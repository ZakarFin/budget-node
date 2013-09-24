
var _ = require('underscore');
var moment = require('moment');
var db = require(process.cwd() + '/lib/db');
var util = require('util');

var fs = require( "fs" );
var mime = require( "mime" ) /* Used to lookup mime type */

/**
 * Lists all users in the system.
 * @param {Object} user user to get expenses for (NOT IMPLEMENTED YET!!)
 * @param {Function} callback function with first param a possible error and second param an array of expenses.
 */
exports.getExpenses = function getExpenses(user, callback) {

    db.queryDB({
            sql: 'SELECT id, title, description, type, date, user_id, created, updated FROM expense'
        },
        callback);
}

exports.insertImage = function insertImage(file, user, callback) {
    if(!file || !user) {
        callback('File or user params missing');
        return;
    }
    // TODO: move image from temp to "target" folder and insert info about it to db
    console.log('Got image. TODO: move file and insert info about it to DB: ' + util.inspect(file));
    var imageId = -1;
    callback(null, imageId);
/*
file:
 {
 size: 1391733,
 path: '/Users/zakar/projects/budget-node/uploads/6eae631bcd0b0d254d1b2e6164ef8701.jpg',
 name: 'IMG_0783.jpg',
 type: 'image/jpeg',
 lastModifiedDate: Mon Aug 05 2013 01:26:03 GMT+0300 (EEST)
 }

    var now = moment();
    expense.date = moment(expense.date);
    expense.type = -1;
    expense.amount = expense.amount || 0.00;
    expense.user_id = user.id;

    db.insert('INSERT INTO expense (title, description, date, type, amount, user_id, created, updated) values($1, $2, $3, $4, $5, $6, $7, $8)',
        [expense.title, expense.desc, expense.date, expense.type, expense.amount, expense.user_id, now, now],
        callback);
        */

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
}


