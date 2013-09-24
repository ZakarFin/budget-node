/**
 * Created with IntelliJ IDEA.
 * User: zakar
 * Date: 8/3/13
 * Time: 9:43 PM
 * To change this template use File | Settings | File Templates.
 */
var sinon = require('sinon');
require('jasmine-sinon');
var expenseService = require(process.cwd() + '/lib/expenseservice');
describe('dummy testing', function() {
    it("spying should work ok", function() {
        var obj = {
            jee: function()  {
                console.log('test 1');
            }
        };
        var spiedJee = sinon.spy(obj, 'jee');
        obj.jee();
        expect(spiedJee).toHaveBeenCalledOnce();
    });

    it("async should work ok", function() {
        var obj = {
            jee: function()  {
                console.log('test 2');
            }
        };

        var spiedJee = sinon.spy(obj, 'jee');
        setTimeout(function() {
            obj.jee();
        },2000);

        // wait for async call to be finished
        waitsFor(function() {
            return spiedJee.calledOnce;
        }, 'should return a status that is not undefined', 3000);

        // run the assertion after response has been set
        runs(function() {
            expect(spiedJee).toHaveBeenCalledOnce();
            //done();
        });
    });


    it("async with done should work ok", function(done) {
        setTimeout(function() {
            console.log('test 3');
            expect(true).toEqual(true);
            done();

        }, 500);
        /*
         var request = require('request');
        request("http://www.google.fi", function(error, response, body){
            //expect(body).toEqual("hello world");
            console.log(body);
            done();
        });
        */
    });

    it("expenseService testing", function() {
        var list = null;
        var obj = {
            cb : function(err, expenses) {
                console.log('test 4a');
                list = expenses;
            }
        };
        var cbSpy = sinon.spy(obj, 'cb');
        var user = {};
        expenseService.getExpenses(user, obj.cb);
        // wait for async call to be finished
        waitsFor(function() {
            return cbSpy.calledOnce;
        }, 'cb should be called', 5000);


        // run the assertion after response has been set
        runs(function() {
            console.log('test 4b');
            expect(list.length).toBeGreaterThan(0);
        });
    });



});