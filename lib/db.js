/*
 * GET users listing.
 */

var routes = {
    "/testdb" : {
        "get" : {
            requirement : { role : "user" },
            handler : justForTesting
        }
    }
};

module.exports.getRoutes = function() {
    return routes;
}

var pg = require('pg');
var connectionString = process.env.DATABASE_URL || "postgres://localhost:5432/budget";

function justForTesting(req, res) {

    pg.connect(connectionString, function (err, client) {
        if (err) {
            console.log(err);
        }
        else {
            /*
             CREATE TABLE "user"
             (
             id serial NOT NULL,
             login character varying(50),
             firstname character varying(50),
             lastname character varying(100),
             pass character varying(200)
             )
             */

            client.connect(function (err) {
                if (err) {
                    console.log(err);
                    res.render('db', { title: 'argh' });
                }
                client.query('SELECT NOW() AS "theTime"', function (err, result) {
                    var value = result.rows[0].theTime;
                    client.end.bind(client);
                    res.render('db', { title: value });
                    //output: Tue Jan 15 2013 19:12:47 GMT-600 (CST)
                })
            });
        }
    });
};

/**
 *
 * @param params {Object} of type {
 *  sql : 'select * from table where id=$1',
 *  args : [1],
 *  rowHandler : function(row),
 *  callback : function(err, result)
 * }
 * @param callback
 */
module.exports.queryDB = function queryDB(params, callback) {
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
 * @param sql like 'INSERT INTO "test" (title, desc) values($1, $2)'
 * @param values array of values to be inserted into sql ['title', 'desc']
 * @param callback function to call when done
 */
module.exports.insert = function insert(sql, values, callback) {

    pg.connect(connectionString, function (err, client, done) {

        if (err) {
            console.log(err);
        }
        else {
            client.query(sql, values);
        }
        callback(err);
        done();
    });
}