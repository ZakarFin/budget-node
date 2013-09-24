/**
 * Created with IntelliJ IDEA.
 * User: zakar
 * Date: 8/4/13
 * Time: 10:46 PM
 * To change this template use File | Settings | File Templates.
 */

var _ = require('underscore');
var db = require(process.cwd() + '/lib/db');
var userService = require(process.cwd() + '/lib/userservice');
var rolesHierarchy = {};

/**
 * Lists all groups that the given user has roles in.
 * @param {Object} user to populate
 * @param {Function} callback function with first param a possible error and second param is the given user with populated groups/roles.
 */
exports.getGroupsForUser = function getGroupsForUser(user, callback) {

    db.queryDB({
        sql: 'SELECT group_id, role_id FROM user_group WHERE user_id = $1',
        args : [user.id]
    },
    function (err, result) {
        if (err) {
            callback(err, user);
            return;
        }
        if(result.length > 0) {
            populateRoles(function(err) {
                if (err) {
                    callback(err, user);
                    return;
                }
                populateGroups(user, result, {}, function(err,res) {
/*
                    _.each(res, function(item){
                        groupHierarchy[item.group_id] = item.role_id;
                    });
                    */
                    user.groups = res;
                    callback(err, user);
                });
            });
        }
        else {
            callback(undefined, user);
        }
    });
}


function populateGroups(user, groupRoleList, groupsObj, callback) {
    if(!groupRoleList || groupRoleList.length === 0) {
        callback(undefined, groupsObj || {});
        return;
    }
    // removes the first item/head
    var groupRole = groupRoleList.shift();
    getGroupHierarchy(groupRole, function(err, groups){
        if(err) {
            callback(err, groupsObj);
            return;
        }
        if(!_.isEmpty(groups)) {
            //id, parent_id, name, array[id] AS path
            // TODO: process and link roles arrays
            // TODO: this needs proper validating
            _.each(groups, function(group) {
                // jos group on jo mukana, niin pitäisi katsoa kumpi on
                // lähempänä juurta ja käyttää kauimmaisen oikeuksia...aaargh
                if(groupsObj[group.id]) {
                   console.warn('Group roles will be overridden, this is propably not working correctly/depends on db load order')
                }
                groupsObj[group.id] = group;
            });
        }
        // recurse
        populateGroups(user, groupRoleList, groupsObj, callback);

    });
}

/**
 * Registers a group with given values.
 * @param {Object} group object with group details
 * @param {Function} callback function with first param a possible error.
 */
exports.addGroup = function addGroup(group, callback) {

    db.insert('INSERT INTO "user"(name, parent_id) values($1, $2)',
        [group.name, group.parent_id],
        callback);
}


/**
 * Updates group based on group.id with given values.
 * @param {Object} group object with group details
 * @param {Function} callback function with first param a possible error.
 */
exports.updateGroup = function updateGroup(group, callback) {
    db.update('UPDATE "group" SET name=$1, parent_id=$2 WHERE id=$3',
        [group.name, group.parent_id, group.id],
        callback);
}

/**
 * Gets the all groups starting from the root and includes all of the root groups subgroups. Sorted so that subgroups are after their main group.
 * @param {Number} group id for main group (included in results with all the subgroups under it)
 * @param {Function} callback function with first param a possible error and second param as an array of groups
 */
exports.getAllGroups = function getAllGroups(callback) {

// kaikki päätason == WHERE parent_id = -1
    // kaikki jonkun alta == id = minkä alta
    var params = {};
    params.sql =
        'WITH RECURSIVE first_level_elements AS (' +
            'select id, parent_id, name, array[id] AS path FROM "group" WHERE parent_id = -1' +
            ' UNION ' +
            'select g.id, g.parent_id, g.name, (fle.path || g.id) FROM "group" g, first_level_elements fle ' +
            'WHERE g.parent_id = fle.id' +
            ') ' +
            'SELECT * from first_level_elements ORDER BY path;'
    db.queryDB(params, callback);
}
/**
 * Gets the given group and all subgroups it contains. The results are ordered so main group is first and its subgroups after.
 * @param {Number} group id for main group (included in results with all the subgroups under it)
 * @param {Function} callback function with first param a possible error and second param as an array of groups (main group + its subgroups)
 */
exports.getGroupHierarchy = getGroupHierarchy;

function getGroupHierarchy(groupRole, callback) {
    var params = {
        args: [groupRole.group_id]
    };
    params.sql =
        'WITH RECURSIVE first_level_elements AS (' +
            'select id, parent_id, name, array[id] AS path FROM "group" WHERE id = $1' +
            ' UNION ' +
            'select g.id, g.parent_id, g.name, (fle.path || g.id) FROM "group" g, first_level_elements fle ' +
            'WHERE g.parent_id = fle.id' +
            ') ' +
            'SELECT * from first_level_elements ORDER BY path;'
    //db.queryDB(params, callback);
    db.queryDB(params, function(err, results) {
        var groupHierarchy = {};
        if(results) {
            _.each(results, function(item) {
                item.roles = _.clone(rolesHierarchy[groupRole.role_id].roles);
                groupHierarchy[item.id] = item;
            });
        }
        callback(err, groupHierarchy);
    });
}

function populateRoles(callback) {

    // populate roles hierarchy first
    userService.getRoles(function(err, roles) {
        if (err) {
            callback(err);
            return;
        }
        rolesHierarchy = roles;
        callback();
    });
}