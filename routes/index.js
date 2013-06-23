
var routes = {
    "/" : {
        "get" : {
            handler : index
        }
    },
    "/login" : {
        "get" : {
            handler : index
        }
    }
};

module.exports.getRoutes = function() {
    return routes;
}

/*
 * GET home page.
 */
function index(req, res){
    var msg = req.session.error_msg;
    if(msg) {
        delete req.session.error_msg;
    }
    res.render('index', {
        title: 'Express',
        user : req.session.user,
        message : msg
    });
};