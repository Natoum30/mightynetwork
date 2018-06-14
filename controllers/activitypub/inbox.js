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
var actorHelper = require('../../helpers/activitypub/actor');
var signHelper = require('../../helpers/activitypub/signature');
var followHelper = require('../../helpers/activitypub/follow');
// Node_modules
var request = require('request');


router.post('/', function(req, res) {
  var username = req.params.username;
  var activity = req.body;
  console.log(activity);


  if (activity.type === 'Create') {
    var receivedNote = activity.object;
    Actor.findOne({
      'inbox': activity.actor + '/inbox'
    }, function(error, senderActor) {
      console.log(senderActor);

      if (senderActor) {

        var newNote = new Note({
          type: 'Note',
          content: receivedNote.content,
          to: receivedNote.to,
          cc: receivedNote.cc,
          attributedTo: receivedNote.attributedTo,
          published: activity.published,
          actor: activity.actor,
          actorObject: senderActor
        });
        Note.createNote(newNote);
        console.log(newNote);
      }
      //if (!senderActor  ) {
      //  var newActor = new Actor({
      //    username: senderActorObject.username,
      //    host: senderActorObject.host, // A changer
      //    url: senderActorObject.url, // Webfinger
      //    inbox: senderActorObject.inbox,
      //    outbox: senderActorObject.outbox,
      //    following: senderActorObject.following,
      //    followers: senderActorObject.followers,
      //    publicKey: senderActorObject.publicKey.publicKeyPem
      //  });

      //  Actor.createRemoteActor(newActor, function(error, act) {
      //    var newNote = new Note({
      //      type: 'Note',
      //      content: receivedNote.content,
      //      to: receivedNote.to,
      //      attributedTo: receivedNote.attributedTo,
      //      published: receivedNote.published,
      //      actorObject: newActor,
      //      actor: receivedNote.actor
      //    });
      //    Note.createNote(newNote);
      //    console.log(newNote);
      //  });
      //}
    });

  }

  if (activity.type === 'Follow') {
    actorHelper.getByUrl(activity.object, function(error, actorWhoReceiveFollow) {
      console.log('héfollow');

      if (actorWhoReceiveFollow) {

        var newFollower = activity.actor;
        followHelper.addFollowers(newFollower, actorWhoReceiveFollow);

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

        signHelper.signObject(actorWhoReceiveFollow, acceptObject, function(err, signedAcceptObject) {
          if (err) {
            return console.log('Signing error:', err);
          }
          console.log('Signed document:', signedAcceptObject);
          var keyId = "acct:" + actorWhoReceiveFollow.username + "@" + actorWhoReceiveFollow.host;
          var httpSignatureOptions = {
            algorithm: 'rsa-sha256',
            authorizationHeaderName: 'Signature',
            keyId,
            key: actorWhoReceiveFollow.privateKey
          };


          actorHelper.getByUrl(activity.actor, function(error, acceptRecipient) {
            if (acceptRecipient) {

              console.log(acceptObject);

              var acceptOptions = {
                url: acceptRecipient.inbox,
                json: true,
                method: 'POST',
                body: signedAcceptObject,
                httpSignature: httpSignatureOptions
              };
              request(acceptOptions);
            }

            if (!acceptRecipient) {

              actorHelper.getRemoteActor(activity.actor, function(error, res, actor) {
                if (!error && res.statusCode === 200) {
                  var strUrl = actor.url;
                  var splitStrUrl = strUrl.split('/');
                  var actorHost = splitStrUrl[2];
                  var newActor = new Actor({
                    username: actor.preferredUsername,
                    host: actor.host || actorHost, // A changer
                    url: actor.url, // Webfinger
                    inbox: actor.inbox,
                    outbox: actor.outbox,
                    following: actor.following,
                    followers: actor.followers,
                    publicKey: actor.publicKey.publicKeyPem
                  });
                  Actor.createRemoteActor(newActor, function(error, act) {
                    if (error) {
                      console.log('already in database');
                    } else {
                      console.log(newActor);
                    }
                  });


                  var acceptOptions = {
                    url: newActor.inbox,
                    json: true,
                    method: 'POST',
                    headers: {
                      'Accept': 'application/activity+json'
                    },
                    body: signedAcceptObject,
                    httpSignature: httpSignatureOptions
                  };
                  request(acceptOptions);
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


  // If I receive a "Accept" activity

  if (activity.type === 'Accept') {

    var newFollowing = activity.actor;
    var actorFollowing = activity.object.actor;

    followHelper.addFollowing(newFollowing, actorFollowing);

  }

  if (activity.type === 'Undo') {
    console.log('héundo');
    var actorToUnfollow = activity.object.object;
    var unFollower = activity.actor;

    followHelper.unFollow(actorToUnfollow, unFollower);
  }

});
module.exports = router;