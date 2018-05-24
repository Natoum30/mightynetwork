var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var instance = process.env.INSTANCE;
var db = mongoose.connect('mongodb://localhost:27017/'+instance);var Actor = require('./Actor');
var Note = require('../Note');
var Activity =require('./Activity');
var Collection = require('./Collection');


var followSchema = new Schema ({
  followers:Array
});

var Follow = module.exports = mongoose.model('Follow', followSchema);
//var Following = module.exports = mongoose.model('Following', followingSchema);

module.exports.showFollow = function(){

};
