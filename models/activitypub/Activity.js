var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var instance = process.env.INSTANCE;
var db = mongoose.connect('mongodb://localhost:27017/' + instance);
var Actor = require('./Actor');
var Note = require('../Note');
var http = require('request');

var activitySchema = new Schema({
  "@context": String,
  type: String, // Can be "follow", "accept", "create", "reject"...
  id: String,
  to: [String],
  actor: String,
  object: JSON || String
});

activitySchema.options.toJSON = {
  transform: function(doc, ret, options) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;

    return ret;
  }
};


activitySchema.methods.toJSON = function() {
  var obj = this.toObject();
  delete obj._id;
  delete obj.__v;
  delete obj.actorObject;
  return obj;
};

var Activity = module.exports = mongoose.model('Activity', activitySchema);

module.exports.createActivity = function(newActivity, callback) {
  newActivity.id = newActivity.actor + '/note/' + newActivity._id;
  newActivity.save(callback);
};
//
//module.exports.postActivity = function(message,callback){
//  var destInbox = 'http://localhost:3000/users/nath/inbox';
//  var postOptions = {
//    url:destInbox,
//    headers: {'content-type' : 'application/activity+json'},
//    json : true,
//    form : message
//  };
//  http.post(postOptions, callback);
//};
//module.exports.postActivity = function(newActivity,callback){
//  var dest = newActivity.to;
//  dest.forEach(function(destUrl){
//    if (destUrl != 'https://www.w3.org/ns/activitystreams#Public') {
//      var destOptions ={
//        url:destUrl,
//        headers:{
//          'Accept' : 'application/activity+json'
//        },
//        json:true,
//        form : newActivity.toJSON()
//      };
//      http.get(destOptions, function(error,res,dest){
//        var postOptions = {
//          url:dest.inbox,
//          headers: {'content-type' : 'application/activity+json'},
//          json : true
//        };
//        http.post(postOptions, callback);
//      });
//    }
//  });
//
//};