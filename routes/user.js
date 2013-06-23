/*
Routes defined in this file
 */
var routes = {
    "/users" : {
        "get" : {
            requirement : { role : "user" },
            handler : listUsers
        }
    },
    "/users/add" : {
        "get" : {
            requirement : { role : "user" },
            handler : getUserForm
        },
        "post" : {
            requirement : { role : "user" },
            handler : insertUser
        }
    },
    "/login" : {
        "post" : {
            handler : login
        }
    },
    "/logout" : {
        "get" : {
            handler : logout
        }
    }
};

module.exports.getRoutes = function() {
    return routes;
}

// register routes above
/*
for(var key in routes) {
    module.exports[key] = routes[key].handler;
}
module.exports.registerRoutes = function(app) {
    for(var key in routes) {
        var route = routes[key];
        var params = [];
        params.push(route.path);
        if(route.access) {
            params.push(route.access);
        }
        params.push(route.handler);
        app[route.method].apply(app, params);
    }
}
*/

// https://github.com/ncb000gt/node.bcrypt.js/
var bcrypt = require('bcrypt');
var _ = require('underscore');
var pg = require('pg');
var connectionString = process.env.DATABASE_URL || "postgres://localhost:5432/budget";
var BSCRIPT_SALT_ROUNDS = 12;

function getEncryptedPass(pass) {
    var salt = bcrypt.genSaltSync(BSCRIPT_SALT_ROUNDS);
    var hash = bcrypt.hashSync(pass, salt);
    return hash;
}

function isPassOk(userPass, dbPass) {
    return bcrypt.compareSync(userPass, dbPass);
}

function addUser(user, callback) {

    pg.connect(connectionString, function (err, client, done) {

        if (err) {
            console.log(err);
        }
        else {
            client.query('INSERT INTO "user"(login, pass, firstname, lastname) values($1, $2, $3, $4)',
                [user.login, getEncryptedPass(user.pass), user.firstName, user.lastName]);
        }
        callback(err);
        done();
    });
}
function updateUser(user, callback) {

    pg.connect(connectionString, function (err, client, done) {

        if (err) {
            console.log(err);
        }
        else {
            client.query('UPDATE "user" SET login=$1, pass=$2, firstname=$3, lastname=$4 WHERE id=$5',
                [user.login, getEncryptedPass(user.pass), user.firstName, user.lastName, user.id]);
        }
        callback(err);
        done();
    });
}
/**
 *
 * @param params {Object} of type {
 *  sql : 'select * from table where id=$1',
 *  args : [1],
 *  rowHandler : function(row),
 *  callback : function(err, result)
 * }
 * @param callback
 */
function queryDB(params, callback) {
    console.log(process.env.DATABASE_URL);
    console.log(connectionString);

    pg.connect(connectionString, function (err, client, done) {
        if (err) {
            done();
            callback(err);
        }
        else {
            var query = client.query(params.sql, params.args);

            var result = [];
            query.on('row', function (row) {
                result.push(params.rowHandler(row));
            });

            //fired after last row is emitted
            query.on('end', function () {
                done();
                callback(null, result);
            });
        }
    });
}


function listUsers(req, res) {

    queryDB({
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
        },
        function (err, result) {
            if (err) {
                //req.session.error_msg = 'Error quering db: ' + err;
                res.send('Error quering db: ' + err);
            }
            else {
                if (result.length) {
                    res.render('user/list', {
                        'users': result,
                        'title': "User"
                    });
                }
                else {
                    res.send('No users');
                }
            }
        });
};

function login(req, res) {
    queryDB({
            sql: 'select id, login, pass, firstname, lastname from "user" where login=$1',
            args: [req.body.login],
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
                req.session.error_msg = 'Error quering db: ' + err;
            }
            else if (!result.length) {
                req.session.error_msg = 'User not found: ' + req.body.login;
            }
            else {

                var pass = req.body.pass;
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
                                console.log('Something went wrong when updating user pass: ' + err);
                            }
                        });
                    }
                    req.session.regenerate(function () {
                        req.session.user = dbUser;
                        res.redirect('/');
                    });
                    return;
                }
                else {
                    req.session.error_msg = 'Wrong password for user: ' + req.body.login;
                }
            }

            res.redirect('/');
        });
};


function logout(req, res) {
    // destroy the user's session to log them out
    // will be re-created next request
    req.session.destroy(function () {
        res.redirect('/');
    });
};

function getUserForm(req, res) {
    res.render('user/form', {
        'user': req.session.user,
        'title': "User"
    });
};

function insertUser(req, res) {

    var user = {
        login: req.body.login,
        pass: req.body.pass,
        firstName: req.body.firstName,
        lastName: req.body.lastName
    };
    addUser(user, function (err) {
        if (err) {
            res.send("Error connecting to DB");
        }
        else {
            res.redirect('/users');
        }
    });
};