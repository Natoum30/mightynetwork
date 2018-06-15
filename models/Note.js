var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var instance = process.env.INSTANCE;
var db = mongoose.connect('mongodb://localhost:27017/' + instance);
var noteSchema = new Schema({
  id: {
    type: String,
    unique: true
  },
  actor: String,
  type: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  to: {
    type: [String],
    required: true
  },
  cc: {
    type: [String],
    required: true
  },
  attributedTo: {
    type: String,
    required: true
  },
  published: Date,
  actorObject: JSON
});

noteSchema.methods.toJSON = function() {
  var obj = this.toObject();
  //delete obj.actorObject;
  delete obj._id;
  delete obj.__v;
  delete obj.actorObject;
  return obj;
};

var Note = module.exports = mongoose.model('Note', noteSchema);

module.exports.createNote = function(newNote, callback) {
  if (!newNote.published) newNote.published = new Date();
  newNote.save(callback);
};


module.exports.getNoteById = function(id, callback) {
  Note.findById(id, callback);
};