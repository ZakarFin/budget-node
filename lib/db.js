
var pg = require('pg');
var connectionString = process.env.DATABASE_URL || "postgres://localhost:5432/budget";


exports.queryDB = queryDB;
exports.insert = queryWithNoReturn;
exports.update = queryWithNoReturn;

/**
 * Tests db connection by getting current time of db server
 * @param {Function} callback function with first param a possible error.
 */
exports.testConnection = function testDBConnection(callback) {
    queryDB({
        sql: 'SELECT NOW() AS "theTime"'
    }, callback);
}

/**
 * Queries db with given sql.
 * @param {Object} params Query params is an object of type {
 *  sql : 'select * from table where id=$1',
 *  args : [1],
 *  rowHandler : function optional(row)
 * }
 * @param {Function} callback function with first param a possible error and second parameter is an array of results.
 */
function queryDB(params, callback) {
    console.log(process.env.DATABASE_URL);
    console.log(connectionString);
    var rowHandler = params.rowHandler;
    if(!rowHandler) {
        rowHandler = function(row) {
            return row;
        };
    }

    pg.connect(connectionString, function (err, client, done) {
        if (err) {
            done();
            callback(err);
        }
        else {
            var query = client.query(params.sql, params.args);

            var result = [];
            query.on('row', function (row) {
                result.push(rowHandler(row));
            });

            //fired after last row is emitted
            query.on('end', function () {
                done();
                callback(null, result);
            });
        }
    });
};

/**
 * @param {String} sql like 'INSERT INTO "test" (title, desc, age) values($1, $2, $3)'
 * @param {Array} values array of values to be inserted into sql ['title', 'desc', 25]
 * @param {Function} callback function with first param a possible error.
 */
function queryWithNoReturn(sql, values, callback) {

    pg.connect(connectionString, function (err, client, done) {

        if (err) {
            console.log(err);
        }
        else {
            client.query(sql, values);
        }
        done();
        callback(err);
    });
}
