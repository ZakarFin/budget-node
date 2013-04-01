
/*
 * GET home page.
 */

exports.index = function(req, res){
    var msg = req.session.error_msg;
    if(!msg) {
        delete req.session.error_msg;
    }
    res.render('index', {
        title: 'Express',
        user : req.session.user,
        message : msg
    });
};