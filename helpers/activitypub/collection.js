// Models
var Actor = require('../../models/activitypub/Actor');
var Note = require('../../models/Note');
var Activity = require('../../models/activitypub/Activity');
var Follow = require('../../models/activitypub/Follow');
var Collection = require('../../models/activitypub/Collection');

// Helpers

module.exports.makeCollection = function(Type, route, response, actorUrl) {
  Type.find({
    'actorUrl': actorUrl,
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