var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var instance = process.env.INSTANCE;
var db = mongoose.connect('mongodb://localhost:27017/'+instance);

var webfingerData = new Schema({
  subject: String,
  aliases: String,
  links: {
    rel: "self",
    type: "application/activity+json; profile='https://www.w3.org/ns/activitystreams'",
    href: String
  }
});
