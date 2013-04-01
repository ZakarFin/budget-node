/*
 * GET users listing.
 */

var pg = require('pg');
var connectionString = process.env.DATABASE_URL || "postgres://localhost:5432/budget";
exports.test = function (req, res) {

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
             pass character varying(200),
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