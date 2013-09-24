
var _ = require('underscore');
var moment = require('moment');
var db = require(process.cwd() + '/lib/db');

/**
 * Lists all expenses in the system.
 * @param {Object} user user to get expenses for (NOT IMPLEMENTED YET!!)
 * @param {Function} callback function with first param a possible error and second param an array of expenses.
 */
exports.getExpenses = function getExpenses(user, callback) {

    db.queryDB({
            sql: 'SELECT id, title, description, type, date, user_id, created, updated FROM expense'
        },
        callback);
}

/**
 * Inserts an expense for given user.
 * @param {Object} expense object with expense details
 * @param {Object} user object with user details
 * @param {Function} callback function with first param a possible error.
 */
exports.insertExpense = function insertExpense(expense, user, callback) {
    if(!expense || !user) {
        callback('Expense or user params missing');
        return;
    }
    var now = moment();
    expense.date = moment(expense.date);
    expense.type = -1;
    expense.amount = expense.amount || 0.00;
    expense.user_id = user.id;
    if(expense.images) {
        // TODO: link images
        console.log('Expense had images id list. TODO: link images to expense!!');
    }

    db.insert('INSERT INTO expense (title, description, date, type, amount, user_id, created, updated) values($1, $2, $3, $4, $5, $6, $7, $8)',
        [expense.title, expense.desc, expense.date, expense.type, expense.amount, expense.user_id, now, now],
        callback);
}


