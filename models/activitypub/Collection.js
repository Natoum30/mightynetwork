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

module.exports.makeCollection = function(Type, route, response, actor) {
  Type.find({
    'actor': actor,
  }, function(error, types) {
    //  console.log(types);
    if (error) {
      console.log('error');
    }
    if (types.length > 0) {
      // Collection of Notes and Annouce (not implemented yet)
      if (route === "outbox") {

        var activities = [];

        types.forEach(function(note) {
          var activity = new Activity({
            "@context": "https://www.w3.org/ns/activitystreams",
            type: "Create",
            to: note.to,
            object: note.toJSON(),
            actor: note.actor
          });
          activities.push(activity);
        });
        var jsonNote = activities.map(function(activity) {
          return activity.toJSON();
        });

        var noteCollection = new Collection({
          "@context": Array("https://www.w3.org/ns/activitystreams", "https://w3id.org/security/v1"),
          id: actor + '/' + route,
          type: "OrderedCollection",
          totalItems: types.length,
          orderedItems: jsonNote
        });
        response.json(noteCollection);
      }
      // Collection of Followers
      if (route === "followers") {
        Type.findOne({
          'actor': actor,
          'type': 'Followers'
        }, function(error, followers) {
          if (error) {
            console.log('Coucou');
          } else {

            var followersCollection = new Collection({
              "@context": Array("https://www.w3.org/ns/activitystreams", "https://w3id.org/security/v1"),
              id: actor + '/' + route,
              type: "OrderedCollection",
              totalItems: followers.items.length,
              orderedItems: followers.items
            });
            response.json(followersCollection);
          }
        });
      }

      // Collection of Following

      if (route === "following") {
        Type.findOne({
          'actor': actor,
          'type': 'Following'
        }, function(error, following) {
          if (error) {
            console.log('Coucou');
          } else {

            var followingCollection = new Collection({
              "@context": Array("https://www.w3.org/ns/activitystreams", "https://w3id.org/security/v1"),
              id: actor + '/' + route,
              type: "OrderedCollection",
              totalItems: following.items.length,
              orderedItems: following.items
            });
            response.json(followingCollection);
          }
        });
      }
    } else {
      response.json({
        'error': 'Nothing found'
      });
    }
  });
};