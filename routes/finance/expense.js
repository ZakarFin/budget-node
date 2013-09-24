/*
 Routes defined in this file
 */
var routes = {
    "/finance" : {
        "get" : {
            //requirement : { role : "user" },
            handler : listExpenses
        }
    },
    "/finance/add" : {
        "get" : {
            requirement : { role : "user" },
            handler : getExpenseForm
        },
        "post" : {
            requirement : { role : "user" },
            handler : insertExpense
        }
    }
};

module.exports.getRoutes = function() {
    return routes;
}

var expenseService = require(process.cwd() + '/lib/expenseservice');
var imageService = require(process.cwd() + '/lib/imageservice');

var moment = require('moment');
var db = require(process.cwd() + '/lib/db');
var formidable = require('formidable');

function listExpenses(req, res) {
    var user = {};
    expenseService.getExpenses(user, function(err, expenses) {
        if (err) {
            //req.session.error_msg = 'Error quering db: ' + err;
            res.send('Error quering db: ' + err);
            return;
        }
        if (expenses.length) {
            res.render('finance/list', {
                'list': expenses,
                'title': "Expenses"
            });
        }
        else {
            res.send('No expenses');
        }
    });
};



function getExpenseForm(req, res) {

    var bill = {
        title: "",
        desc: "",
        date: moment().format("YYYY-MM-DD")
    };
    res.render('finance/form', {
        'bill': bill,
        'title': "Bill"
    });
};

function insertExpense(req, res) {
    // http://webtonio.com/262/
    //https://github.com/felixge/node-formidable
    //var bodyParser = express.bodyParser();
    //delete app.use(express.bodyParser());

    var form = new formidable.IncomingForm();
    form.uploadDir = process.cwd() + '/uploads';
    form.keepExtensions = true;
    console.log( "Preparing upload" );
    var files = [];
    var expense = {};

    form.on('field', function(name, value) {
        expense[name] = value;
        console.log("field: " + name + "=" + value);
    });

    form.on('file', function(name, file) {
        files.push(file);
    });

    form.on('error', function(err) { console.log(err); });
    form.on('aborted', function() { console.log('Aborted'); });

    form.parse( req, function( error ) {
        console.log( "Completed Parsing" );

        if( error ){
            res.writeHead( 500, { "Content-Type" : "text/plain" } );
            res.end( "CRAP! " + error + "\n" );
            return;
        }
        insertImages(req.session.user, files, [], function(err, idList) {
            if(err) {
                // rollback for images on idList?
                res.writeHead( 500, { "Content-Type" : "text/plain" } );
                res.end( "CRAP2! " + err + "\nList is: " + util.inspect(idList));
                return;
            }

            // after previous async heaven -> do this
            // TODO: create link table rows for images in insert
            expense.images = idList;
            expenseService.insertExpense(expense, req.session.user, function(err) {

                if (err) {
                    // rollback for images on idList?
                    res.writeHead(200, {'content-type': 'text/plain'});
                    res.write('received upload - but error on db:\n\n');
                    res.write(util.inspect({expense: expense, files: files}));
                    res.end();
                }
                else {
                    res.redirect('/finance');
                }
            });
        });

    });
}

/**
 * Recurses the files array, gathers list of ids for inserted images and calls callback function when done.
 * @param user user details for uploader
 * @param files file objects to insert
 * @param idList array of ids for inserted images
 * @param callback function to call with error and idList when done recursing the files array or error happened
 */
function insertImages(user, files, idList, callback) {
    if(!files || files.length === 0) {
        callback(null, idList || []);
        return;
    }
    // removes the first item/head and removes it
    var file = files.shift();
    imageService.insertImage(file, user, function(err, imageId) {
        if(err) {
            //rollback for idList?
            callback(err, idList);
            return;
        }
        // add image id to recurse list
        idList.push(imageId);
        // recurse
        insertImages(user, files, idList, callback);
    });
}