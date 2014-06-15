var env = process.env.NODE_ENV || 'development';
var config = require('../config/' + env);
var mongoose = require('mongoose');

var schema = new mongoose.Schema({
    name: { type: String },
    rights: [Number]
}, { collection: 'accountTypes' });

var model = mongoose.model('accountTypes', schema)
module.exports = {
    AccountType: model
}