var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var db = mongoose.connect('mongodb://localhost:27017/mightynetwork');
var Actor = require('./Actor');
var Note = require('../Note');

var activitySchema = new Schema ({
  "@context":String,
  type: String,
  id: String,
  to: [String],
  actor:String,
  object:JSON || String
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
  return obj;
};

var Activity = module.exports = mongoose.model('Activity', activitySchema);

module.exports.createActivity= function(newActivity,callback){
newActivity.id = newActivity.actor + '/note/' + newActivity._id;
newActivity.save(callback);
};
