var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var db = mongoose.connect('mongodb://localhost:27017/mightynetwork2');

var noteSchema = new Schema({
  note: {type:String, required:true},
  created_at: Date,
  author_id: {type:Schema.Types.ObjectId, required:true},
  author_username:{type:String,required:true},
  author_host:{type:String,required:true}
});

var Note = module.exports=mongoose.model('Note', noteSchema);

module.exports.createNote= function(newNote,callback){
   if(!newNote.created_at) newNote.created_at = new Date();
   newNote.save(callback);
};


module.exports.getNoteById=function(id,callback){
  Note.findById(id,callback);
};
