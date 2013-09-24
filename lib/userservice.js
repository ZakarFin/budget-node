/**
 * Created with IntelliJ IDEA.
 * User: zakar
 * Date: 8/4/13
 * Time: 10:46 PM
 * To change this template use File | Settings | File Templates.
 */

// https://github.com/ncb000gt/node.bcrypt.js/
var bcrypt = require('bcrypt');
var _ = require('underscore');
var db = require(process.cwd() + '/lib/db');

var BSCRIPT_SALT_ROUNDS = 12;
var roles = {};

exports.updateUser = updateUser;
/**
 * Lists all users in the system.
 * @param {Function} callback function with first param a possible error and second param an array of users.
 */
exports.getUsers = function getUsers(callback) {

    db.queryDB({
        sql: 'SELECT id, login, pass, firstname, lastname FROM "user"',
        rowHandler: function (row) {
            return {
                id: row.id,
                login: row.login,
                pass: row.pass,
                firstName: row.firstname,
                lastName: row.lastname
            };
        }
    }, callback);
}

/**
 * Tries to log in the user with given username/pass. Updates the users pass in db if salt rounds have changed.
 * @param {String} username
 * @param {String} pass
 * @param {Function} callback function with first param a possible error and second param as the user if login was successful. If user not found or wrong pass, the callback is called without any parameters.
 */
exports.login = function login(username, pass, callback) {
    db.queryDB({
            sql: 'select id, login, pass, firstname, lastname from "user" where login=$1',
            args: [username],
            rowHandler: function (row) {
                return {
                    id: row.id,
                    login: row.login,
                    pass: row.pass,
                    firstName: row.firstname,
                    lastName: row.lastname
                };
            }
        },
        function (err, result) {
            if (err) {
                callback(err);
                return;
            }
            else if (!result.length) {
                callback();
                return;
            }
            else {
                var dbUser = result[0];
                if (isPassOk(pass, dbUser.pass)) {

                    // Now that we have the plain pass from user, check if we should upgrade the salt on db pass
                    if (bcrypt.getRounds(dbUser.pass) !== BSCRIPT_SALT_ROUNDS) {
                        console.log('Salt complexity changed, updating user in db');
                        // Different number of rounds has been specified ->  update the password in db.
                        var updUser = _.clone(dbUser);
                        updUser.pass = pass;
                        updateUser(updUser, function (err) {
                            if(err) {
                                // no need to react here
                                console.log('Something went wrong when updating user pass: ' + err);
                            }
                        });
                    }
                    // return the user logging in
                    callback(null, dbUser);
                }
                else {
                    callback();
                }
            }
        });
}
/**
 * Registers a user with given values.
 * @param {Object} user object with user details
 * @param {Function} callback function with first param a possible error.
 */
exports.register = function register(user, callback) {

    db.insert('INSERT INTO "user"(login, pass, firstname, lastname) values($1, $2, $3, $4)',
        [user.login, getEncryptedPass(user.pass), user.firstName, user.lastName],
        callback);
}


/**
 * Gets the all roles recursively.
 * TODO: better documentation for this
 * @param {Function} callback function with first param a possible error and second param as an array of roles
 */
exports.getRoles = function getRoles(callback, forceReload) {
    if(!_.isEmpty(roles) && forceReload !== true) {
        //console.log('return existing');
        callback(undefined, _.clone(roles));
        return;
    }
    //console.log('load from db');
    roles = {};
    // populate cached roles object
    var params = {};
    params.sql =
        'WITH RECURSIVE first_level_elements AS (' +
            'select id, inherit_role_id, name, array[id] AS path FROM "role" WHERE inherit_role_id = -1' +
            ' UNION ' +
            'select g.id, g.inherit_role_id, g.name, (fle.path || g.id) FROM "role" g, first_level_elements fle ' +
            'WHERE g.inherit_role_id = fle.id' +
            ') ' +
            'SELECT * from first_level_elements ORDER BY path;'
    db.queryDB(params, function(err, results) {
        if(results) {
            // map to id = role + init internal roles array with self
            _.each(results, function(item) {
                roles[item.id] = item;
                if(!roles[item.id].roles) {
                    roles[item.id].roles = [item.name];
                }
            });
            // populate inherit roles to internal roles array
            _.each(roles, function(item) {
                if(item.path.length > 1) {
                    _.each(item.path, function(roleId) {
                        if(roleId !== item.id) {
                            item.roles.push(roles[roleId].name);
                        }
                    });
                }
            });
            // now we have simple way to get all rolenames related to
            // single role id with roles[id].roles;
        }
        callback(err, _.clone(roles));
    });
}


/**
 * Updates user based on user.id with given values.
 * @param {Object} user object with user details
 * @param {Function} callback function with first param a possible error.
 */
function updateUser(user, callback) {
    db.update('UPDATE "user" SET login=$1, pass=$2, firstname=$3, lastname=$4 WHERE id=$5',
        [user.login, getEncryptedPass(user.pass), user.firstName, user.lastName, user.id],
        callback);
}

function getEncryptedPass(pass) {
    var salt = bcrypt.genSaltSync(BSCRIPT_SALT_ROUNDS);
    var hash = bcrypt.hashSync(pass, salt);
    return hash;
}

function isPassOk(userPass, dbPass) {
    return bcrypt.compareSync(userPass, dbPass);
}
