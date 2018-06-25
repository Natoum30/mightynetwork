var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var instance = process.env.INSTANCE;
var db = mongoose.connect('mongodb://localhost:27017/' + instance);
var Actor = require('./Actor');
var Note = require('../Note');
var Activity = require('./Activity');
var Follow = require('../../models/activitypub/Follow');

var collectionSchema = new Schema({
  "@context": Array,
  id: String,
  type: String,
  totalItems: Number,
  orderedItems: JSON
});

collectionSchema.methods.toJSON = function() {
  var obj = this.toObject();
  delete obj._id;
  delete obj.__v;
  return obj;
};


var Collection = module.exports = mongoose.model('Collection', collectionSchema);