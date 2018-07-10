var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var instance = process.env.INSTANCE;
var db = mongoose.connect('mongodb://localhost:27017/' + instance);

var notificationSchema = new Schema({
  type:String,
  actor:String,
  object:String,
  published: Date,
});



var Notification = module.exports = mongoose.model('Notification', notificationSchema);