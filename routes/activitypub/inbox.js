var express = require('express');
var router = express.Router({
  mergeParams: true
});
var Collection = require('../../models/activitypub/Collection');
var Actor = require('../../models/activitypub/Actor');
var Follow = require('../../models/activitypub/Follow');
var Note = require('../../models/Note');
var User = require('../../models/User');
var Activity = require('../../models/activitypub/Activity');
var request = require('request');
var jsonld = require('jsonld');
var jsig = require('jsonld-signatures');
jsig.use('jsonld', jsonld);


router.post('/', function(req, res) {
  var username = req.params.username;
  var activity = req.body;
  console.log(activity);
  if (activity.type === 'Create') {
    var receivedNote = activity.object;
    var senderActorObject = receivedNote.actorObject;

    Actor.findOne({
      'url': receivedNote.actor
    }, function(error, actor) {
      if (actor) {
        var newNote = new Note({
          type: 'Note',
          content: receivedNote.content,
          to: receivedNote.to,
          attributedTo: receivedNote.attributedTo,
          published: receivedNote.published,
          actorObject: actor,
          actor: receivedNote.actor
        });
        Note.createNote(newNote);
        console.log(newNote);
      }
      if (!actor) {
        var newActor = new Actor({
          username: senderActorObject.username,
          host: senderActorObject.host, // A changer
          url: senderActorObject.url, // Webfinger
          inbox: senderActorObject.inbox,
          outbox: senderActorObject.outbox,
          following: senderActorObject.following,
          followers: senderActorObject.followers,
          publicKey: senderActorObject.publicKey.publicKeyPem
        });

        Actor.createRemoteActor(newActor, function(error, act) {
          var newNote = new Note({
            type: 'Note',
            content: receivedNote.content,
            to: receivedNote.to,
            attributedTo: receivedNote.attributedTo,
            published: receivedNote.published,
            actorObject: newActor,
            actor: receivedNote.actor
          });
          Note.createNote(newNote);
          console.log(newNote);
        });
      }
    });

  }

  if (activity.type === 'Follow') {
    Actor.findOne({
      'url': activity.object
    }, function(error, actorWhoReceiveFollow) {
      if (actorWhoReceiveFollow) {

        var newFollower = activity.actor;
        Follow.update({
          actor: actorWhoReceiveFollow.url,
          type: "Followers"
        }, {
          $addToSet: {
            items: newFollower
          }
        }, function(error, up) {
          if (error) {
            console.log("error");
          }
          if (!error) {
            console.log('no error');
          }
        });

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

        jsig.sign(acceptObject, {
          privateKeyPem: actorWhoReceiveFollow.privateKey,
          creator: actorWhoReceiveFollow.url,
          algorithm: 'RsaSignature2017'

        }, function(err, signedAcceptObject) {
          if (err) {
            return console.log('Signing error:', err);
          }
          console.log('Signed document:', signedAcceptObject);

          Actor.findOne({
            'url': activity.actor
          }, function(error, acceptRecipient) {
            if (acceptRecipient) {

              console.log(acceptObject);

              var httpSignatureOptions = {
                algorithm: 'rsa-sha256',
                authorizationHeaderName: 'Signature',
                keyId,
                key: actorWhoReceiveFollow.privateKey
              };

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
              var actorOptions = {
                url: activity.actor,
                headers: {
                  'Accept': 'application/activity+json'
                },
                json: true
              };
              request.get(actorOptions, function(error, res, actor) {
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
                  var keyId = "acct:" + actorWhoReceiveFollow.username + "@" + actorWhoReceiveFollow.host;

                  var httpSignatureOptions = {
                    algorithm: 'rsa-sha256',
                    authorizationHeaderName: 'Signature',
                    keyId,
                    key: actorWhoReceiveFollow.privateKey
                  };
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
    //Follow.addFollower();

  }

  if (activity.type === 'Accept') {

    var newFollowing = activity.actor;

    Follow.update({
      actor: activity.object.actor,
      type: "Following"
    }, {
      $addToSet: {
        items: newFollowing
      }
    }, function(error, up) {

      if (error) {
        console.log("error");
      }
      if (!error) {
        console.log("no error, Added to the actor's followings !");
      }
    });


  }

  if (activity.type === 'Undo') {
    console.log('Undo');
  }

});
module.exports = router;