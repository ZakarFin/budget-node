/*
 * Initializes routes to express
 */

var routes = require('./index')
    , user = require('./user')
    , db = require('./db');


function restrict(req, res, next) {
    if (req.session.user) {
        console.log(req.session.user.login + ' accessing restricted page ' + req.path);
        next();
    } else {
        req.session.error_msg = 'Access denied! Tried path: ' + req.path;
        res.redirect('/');
    }
}

exports.initRoutes = function (app) {

    app.get('/', routes.index);
    app.get('/users', restrict, user.list);
    app.get('/users/add', restrict, user.add);

    app.post('/users/add', restrict, user.insert);
    app.get('/login', routes.index);
    app.post('/login', user.login);
    app.get('/logout', user.logout);

    app.get('/testdb', restrict, db.test);
};
