/**
 * Module dependencies.
 */

var express = require('express')
    , http = require('http')
    , _ = require('underscore')
    , path = require('path');

var app = express();

app.configure(function() {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    // formidable breaks if bodyparser is used
    //app.use(express.bodyParser());
    // these two can be used instead (only parts of bodyparser)
    app.use(express.json());
    app.use(express.urlencoded());

    app.use(express.methodOverride());
    app.use(express.cookieParser('your secret here'));
    app.use(express.session());
    app.use(app.router);
    app.use(require('less-middleware')({ src: __dirname + '/public' }));
    app.use(express.static(path.join(__dirname, 'public')));
});

// http://stackoverflow.com/questions/8332333/node-js-setting-up-environment-specific-configs-to-be-used-with-everyauth
app.configure('development', function () {
    app.use(express.errorHandler());
});

var controllers = [];
controllers.push('./routes/index');
controllers.push('./routes/user');
controllers.push('./routes/finance/expense');
//controllers.push('./routes/db');
initRoutes(controllers);

http.createServer(app).listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});

function initRoutes(controllers) {

    _.forEach(controllers, function(controllerPath) {
        var controller = require(controllerPath);
        var routes = controller.getRoutes();
        console.log("Registering paths for " + controllerPath + ":");
        _registerRoutes(app, routes);
    });
}

/*
Routes is an object like this:
{
"uri/path" : {
        "get|post|del|put" : {
            "requirement" : { "optional" : "object" },
            "handler" : function(req, res) {}
        }
    }
}
 */
function _registerRoutes(app, routes) {
    for(var path in routes) {
        var route = routes[path];
        for(var method in route) {
            var impl = route[method];
            var params = [];
            params.push(path);
            if(impl.requirement) {
                params.push(handleRequirements(impl.requirement));
            }
            params.push(impl.handler);
            app[method].apply(app, params);
            console.log(" -> " + method + " " + path);
        }
    }
}

function handleRequirements(requirement) {
    return function restrict(req, res, next) {
        // TODO: handle based on requirement
        if (req.session.user) {
            console.log(req.session.user.login + ' accessing restricted page ' + req.path);
            next();
        } else {
            req.session.error_msg = 'Access denied! Tried path: ' + req.path + ' - required: ' + JSON.stringify(requirement);
            res.redirect('/');
        }
    }
}