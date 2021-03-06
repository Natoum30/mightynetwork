var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var instance = process.env.INSTANCE;
var db = mongoose.connect('mongodb://localhost:27017/' + instance);
var Actor = require('./Actor');
var Note = require('../Note');
var http = require('request');
var jsonld = require('jsonld');
var jsig = require('jsonld-signatures');

jsig.use('jsonld', jsonld);

var activitySchema = new Schema({
  "@context": String,
  type: String, // Can be "follow", "accept", "create", "reject"...
  id: String,
  actor: String,
  object: JSON || String,
  signature: JSON,
  published: Date
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
  if (!newNote.published) newNote.published = new Date();
  newActivity.id = newActivity.actor + '/note/' + newActivity._id;
  newActivity.save(callback);
};

