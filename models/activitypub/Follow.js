var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var db = mongoose.connect('mongodb://localhost:27017/mightynetwork2');
var Actor = require('./Actor');

var FollowState = new Schema({
//???
});

var followSchema = new Schema({
  follower:{type:Actor,required:true},
  following:{type:Actor, required:true},
  state:{type:FollowState, required:true},
  created_at:Date
});
