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
            //requirement : { role : "user" },
            handler : getUserForm
        },
        "post" : {
           // requirement : { role : "user" },
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
    },
    "/groups" : {
        "get" : {
            handler : getGroups
        }
    },
    "/groups/user" : {
        "get" : {
            requirement : { role : "user" },
            handler : getGroupsForUser
        }
    },
    "/roles" : {
        "get" : {
            handler : getRoles
        }
    }

};

module.exports.getRoutes = function() {
    return routes;
}

var userService = require(process.cwd() + '/lib/userservice');
var groupService = require(process.cwd() + '/lib/groupservice');
var _ = require('underscore');
var util = require('util');


function listUsers(req, res) {
    userService.getUsers(function(err, users) {
        if (err) {
            //req.session.error_msg = 'Error quering db: ' + err;
            res.send('Error quering db: ' + err);
        }
        else {
            if (users.length) {
                res.render('user/list', {
                    'users': users,
                    'title': "User"
                });
            }
            else {
                res.send('No users');
            }
        }
    });
}

function login(req, res) {
    userService.login(req.body.login, req.body.pass, function(err, user) {
        if (err) {
            req.session.error_msg = 'Error quering db: ' + err;
            //res.send('Error quering db: ' + err);
            res.redirect('/');
        }
        else if (!user) {
            req.session.error_msg = 'User not found or wrong password';
            res.redirect('/');
        }
        else {
            req.session.regenerate(function () {
                req.session.user = user;
                res.redirect('/');
            });
        }
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

    var user = {
        login: "",
        pass: "",
        firstName: "",
        lastName: ""
    };
    if(req.session.user) {
        user = req.session.user;
    }
    res.render('user/form', {
        'user': user,
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

    userService.register(user, function (err) {
        if (err) {
            req.session.error_msg = 'Error quering db: ' + err;
            res.redirect('/');
        }
        else {
            res.redirect('/users');
        }
    });
};

function getGroups(req, res) {
    groupService.getAllGroups(function(err, groups) {
        if(err) {
            res.send('Error: ' + err);
            return;
        }

        res.writeHead(200, {'content-type': 'text/plain'});

        res.write('Groups:\n\n');
        _.each(groups, function(elem) {
            res.write(util.inspect(elem));
        });
        res.end();

    });
}

function getGroupsForUser(req, res) {
    groupService.getGroupsForUser(req.session.user, function(err, user) {
        if(err) {
            res.send('Error: ' + err);
            return;
        }

        res.writeHead(200, {'content-type': 'text/plain'});

        res.write('User wiht groups:\n\n');
        res.write(util.inspect(user, false, 4));
        //res.write(JSON.stringify(user));
        res.end();

    });
    /*

     { id: 1,
     login: 'zakar',
     pass: '$2a$12$aihCfT6NnHx60s.E2nkg6.SrbiSz.qVikzH58.jWa8r15fRe28oWK',
     firstName: 'Sami',
     lastName: 'Mäkinen',
     groups:
     { '1':
     { id: 1,
     parent_id: -1,
     name: 'sami',
     path: [ 1 ],
     roles: [ 'admin', 'reader', 'writer' ] },
     '2':
     { id: 2,
     parent_id: 3,
     name: 'sami lvl 3',
     path: [ 1, 3, 2 ],
     roles: [ 'admin', 'reader', 'writer' ] },
     '3':
     { id: 3,
     parent_id: 1,
     name: 'sami lvl 2',
     path: [ 1, 3 ],
     roles: [ 'admin', 'reader', 'writer' ] } } }
     */
}

function getRoles(req, res) {
    userService.getRoles(function(err, roles) {
        if(err) {
            res.send('Error: ' + err);
            return;
        }

        res.writeHead(200, {'content-type': 'text/plain'});

        res.write('Roles:\n\n');
        _.each(roles, function(elem) {
            res.write(util.inspect(elem));
        });
        res.end();

    });
}