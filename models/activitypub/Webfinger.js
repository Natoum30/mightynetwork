var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var db = mongoose.connect('mongodb://localhost:27017/mightynetwork');



var webfingerData = new Schema({
  subject: String,
  aliases: String,
  links: {
    rel: "self",
    type: "application/activity+json; profile='https://www.w3.org/ns/activitystreams'",
    href: String
  }
});
