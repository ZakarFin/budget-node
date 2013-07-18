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


var _ = require('underscore');
var db = require(process.cwd() + '/lib/db');
var formidable = require('formidable');
var util = require('util');

var fs = require( "fs" );
var mime = require( "mime" ) /* Used to lookup mime type */


function listExpenses(req, res) {
    db.queryDB({
            sql: 'SELECT id, title, description, type, date, user_id, created, updated FROM expense'
        },
        function (err, result) {
            if (err) {
                //req.session.error_msg = 'Error quering db: ' + err;
                res.send('Error quering db: ' + err);
            }
            else {
                if (result.length) {
                    res.render('finance/list', {
                        'list': result,
                        'title': "Expenses"
                    });
                }
                else {
                    res.send('No expenses');
                }
            }
        });
};



function getExpenseForm(req, res) {

    var bill = {
        title: "",
        desc: "",
        date: new Date()
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
    /*
    form.on('progress', function(bytesReceived, bytesExpected) {
        console.log("rec: " + bytesReceived + ' - expect: ' + bytesExpected);
    });
    form.on('field', function(name, value) {
        console.log("field: " + name + "=" + value);
    });
    form.on('fileBegin', function(name, file) {
        console.log("filebegin: " + name + "=" + file);
    });
    */
        form.on('error', function(err) { console.log(err); });
        form.on('aborted', function() { console.log('Aborted'); });

    form.parse( req, function( error, fields, files ) {
        console.log( "Completed Parsing" );

        if( error ){
            res.writeHead( 500, { "Content-Type" : "text/plain" } );
            res.end( "CRAP! " + error + "\n" );
            return;
        }


        var now = new Date();
        db.insert('INSERT INTO expense (title, description, date, type, user_id, created, updated) values($1, $2, $3, $4, $5, $6, $7)',
            [fields.title, fields.desc, fields.date, -1, req.session.user.id, now, now],
            function(err) {
                if (err) {
                    res.writeHead(200, {'content-type': 'text/plain'});
                    res.write('received upload - but error on db:\n\n');
                    res.write(util.inspect({fields: fields, files: files}));
                    res.end();
                }
                else {
                    res.redirect('/finance');
                }
            })

        // Update the streamed filename with it's original filename
        //fs.renameSync( files.upload.path, "/tmp/" + files.upload.name );
/*
        fs.readFile( "/tmp/" + files.upload.name, "binary", function( error, file ) { // Read the file
            if( error ){
                response.writeHead( 500, { "Content-Type" : "text/plain" } );
                response.end( error + "\n" );
                return;
            }

            var type = mime.lookup( file ); // Lookup the files mime-type
            // writing the file back
            response.writeHead( 200, { "Content-Type" : type } ); // Pass in the mime-type
            response.end( file, "binary" ); //Stream the file down
        });
        */
    });
};