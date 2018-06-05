var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var instance = process.env.INSTANCE;
var db = mongoose.connect('mongodb://localhost:27017/' + instance);
var Actor = require('./Actor');
var Note = require('../Note');
var Activity = require('./Activity');
var Collection = require('./Collection');


var followSchema = new Schema({
  actor: String,
  type: String,
  items: Array
});


followSchema.methods.toJSON = function() {
  var obj = this.toObject();
  //delete obj.actorObject;
  delete obj._id;
  delete obj.__v;
  delete obj.actor;
  delete obj.type;
  return obj;
};


var Follow = module.exports = mongoose.model('Follow', followSchema);
//var Following = module.exports = mongoose.model('Following', followingSchema);


module.exports.createFollow = function(newFollow, callback) {
  newFollow.save(callback);
};

module.exports.showFollow = function() {

};

module.exports.addFollowers = function() {

};

module.exports.addFollowing = function() {

};