// Modèle Actor (pas encore ActivityPub)
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var db = mongoose.connect('mongodb://localhost:27017/mightynetwork2');

var actorSchema = new Schema({
  user_id:{type:Schema.Types.ObjectId, required:true},
  url:{type:String,required:true},
  username:{type:String,required:true},
  host:{type:String,require:true},
  inbox:{type:String,required:true},
  outbox:{type:String,required:true},
  following:{type:String, required:true},
  followers:{type:String, required:true},
  created_at:Date
});

actorSchema.index({username:1, host:1}, {unique:true});

var Actor = module.exports = mongoose.model('Actor', actorSchema);

module.exports.createActor= function(newActor,callback){
newActor.save(callback);

};
// var Note = module.exports=mongoose.model('Note', noteSchema);
//
// module.exports.createNote= function(newNote,callback){
   // if(!newNote.created_at) newNote.created_at = new Date();
   // newNote.save(callback);
// };
//
//
// module.exports.getNoteById=function(id,callback){
  // Note.findById(id,callback);
// };
