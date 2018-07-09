var express = require('express');
var router = express.Router({
  mergeParams: true
});

// Models
var Collection = require('../../models/activitypub/Collection');
var Actor = require('../../models/activitypub/Actor');
var Follow = require('../../models/activitypub/Follow');
var Note = require('../../models/Note');
var User = require('../../models/User');
var Activity = require('../../models/activitypub/Activity');

// Helpers
var actor = require('../../helpers/activitypub/actor');
var signature = require('../../helpers/activitypub/signature');
var follow = require('../../helpers/activitypub/follow');

// Node_modules
var request = require('request');
var striptags = require('striptags');

router.post('/', function (req, res) {
  var username = req.params.username;
  var activity = req.body;
  console.log(activity);

  /////////////// ACTIVITY CREATE
  if (activity.type === 'Create') {

    var receivedNote = activity.object;

    actor.getByUrl(activity.actor, function (error, senderActor) {

      if (senderActor) {

        var newNote = new Note({
          type: 'Note',
          content: striptags(receivedNote.content),
          to: receivedNote.to,
          cc: receivedNote.cc,
          attributedTo: receivedNote.attributedTo,
          published: activity.published,
          actor: activity.actor,
          id: receivedNote.id,
          actorObject: senderActor
        });

        Note.createNote(newNote, function (error, note) {
          if (error) {
            console.log("note already in DB");
          }
        });
      }
    });
  }


  /////////////// ACTIVITY FOLLOW

  if (activity.type === 'Follow') {
    actor.getByUrl(activity.object, function (error, actorWhoReceiveFollow) {
      console.log('héfollow');

      if (actorWhoReceiveFollow) {

        var newFollower = activity.actor;
        follow.addFollowers(newFollower, actorWhoReceiveFollow);

        var acceptObject = {
          "@context": [
            "https://www.w3.org/ns/activitystreams",
            'https://w3id.org/security/v1',
            {
              RsaSignature2017: 'https://w3id.org/security#RsaSignature2017'
            }
          ],
          id: actorWhoReceiveFollow.url + '/accept/' + actorWhoReceiveFollow.id,
          type: "Accept",
          actor: actorWhoReceiveFollow.url,
          object: activity
        };

        signature.signObject(actorWhoReceiveFollow, acceptObject, function (err, signedAcceptObject) {
          if (err) {
            return console.log('Signing error:', err);
          }
          console.log('Signed document:', signedAcceptObject);

          actor.getByUrl(activity.actor, function (error, acceptRecipient) {
            if (acceptRecipient) {

              signature.postSignedObject(signedAcceptObject, acceptRecipient, actorWhoReceiveFollow);

            }

            if (!acceptRecipient) {

              actor.getRemoteActor(activity.actor, function (error, res, remoteActor) {

                if (!error && res.statusCode === 200) {

                  var strUrl = remoteActor.url;
                  var splitStrUrl = strUrl.split('/');
                  var actorHost = splitStrUrl[2];

                  var newActor = new Actor({
                    username: remoteActor.preferredUsername,
                    host: remoteActor.host || actorHost, // A changer
                    url: remoteActor.id, // Webfinger
                    inbox: remoteActor.inbox,
                    outbox: remoteActor.outbox,
                    following: remoteActor.following,
                    followers: remoteActor.followers,
                    publicKey: remoteActor.publicKey.publicKeyPem
                  });

                  Actor.createRemoteActor(newActor, function (error, actorCreated) {
                    if (error) {
                      console.log('already in database');
                    } else {
                      console.log("New actor :", newActor);
                    }
                  });

                  signature.postSignedObject(signedAcceptObject, newActor, actorWhoReceiveFollow);

                } else {
                  console.log('error');
                }
              });
            }
          });

        });

      } else {
        console.log('Error actor does not exist');
      }
    });

  }


  /////////////// ACTIVITY ACCEPT

  if (activity.type === 'Accept') {
    var newFollowing = activity.actor;
    var actorFollowing = activity.object.actor;

    follow.addFollowing(newFollowing, actorFollowing);

  }

  /////////////// ACTIVITY UNDO

  if (activity.type === 'Undo') {
    console.log('héundo');
    var actorToUnfollow = activity.object.object;
    var unFollower = activity.actor;

    follow.unFollow(actorToUnfollow, unFollower);
  }

});
module.exports = router;