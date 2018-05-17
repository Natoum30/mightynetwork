var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var db = mongoose.connect('mongodb://localhost:27017/mightynetwork');
var Actor = require('./Actor');
var Note = require('../Note');
var Activity = require('./Activity');

var collectionSchema = new Schema ({
  "@context":Array,
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

module.exports.showCollection= function(username,host,Type,route,response){

  Actor.findOne({'username':username,'host':host}, function (error, actor){
    if (error) {
      console.log('error');
    } if (!actor) {
      response.json({error:'Record not found'});
    } if (actor) {
      Type.find({}, function(error, types){
        if(error) {
          console.log('error');
        } else {
          var json = types.map(function(type) {
            return type.toJSON();
          });
          var newCollection = new Collection ({
            "@context": 	["https://www.w3.org/ns/activitystreams","https://w3id.org/security/v1"],
            id: actor.url + '/' + route,
            type: "OrderedCollection",
            totalItems:types.length,
            orderedItems:json
          });
          response.json(newCollection);
        }
      });


  }

});
};
