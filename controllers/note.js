var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var Note = require('../models/Note');
var User = require('../models/User');
var Actor = require('../models/activitypub/Actor');
var Activity = require('../models/activitypub/Activity');
var Follow = require('../models/activitypub/Follow');
var jsonld = require('jsonld');
var jsig = require('jsonld-signatures');
jsig.use('jsonld', jsonld);


var request = require('request');

/* Post a Note */
router.post('/', User.ensureAuthenticate, function(req, res) {
  var content = req.body.content;
  req.checkBody('content').notEmpty();
  var errors = req.validationErrors();
  if (errors) {
    req.flash('error', 'You seem to have nothing to share ? Too bad !');
    res.location('/');
    res.redirect('/');
  } else {

    Actor.findOne({
      'user_id': req.user._id
    }, function(error, actorWhoSendNote) {
      if (error) {
        ///
      } else {

        Follow.findOne({
          'actor': actorWhoSendNote.url,
          'type': 'Followers'
        }, function(error, followers) {
          console.log(followers);
          var recipients = followers.items;
          var newNote = new Note({
            type: 'Note',
            content: content,
            cc: actorWhoSendNote.followers,
            to: ['https://www.w3.org/ns/activitystreams#Public'],
            attributedTo: actorWhoSendNote.url,
            actorObject: actorWhoSendNote.toJSON(),
            actor: actorWhoSendNote.url,


          });
          newNote.id = newNote.actor + '/note/' + newNote._id;
          newNote.published = new Date();

          Note.createNote(newNote, function(error, note) {
            if (error) {
              res.send('error');
            } else {
              console.log("NOTE:", note.toJSON());

              var newActivity = new Activity({
                "@context": "https://www.w3.org/ns/activitystreams",
                id: note.id + '/activity',
                type: "Create",
                cc: actorWhoSendNote.followers,
                to: ['https://www.w3.org/ns/activitystreams#Public'],
                object: note.toJSON(),
                actor: note.actor,
                published: note.published
              });
              console.log("ACTIVITY : ", newActivity);
              var keyId = "acct:" + actorWhoSendNote.username + "@" + actorWhoSendNote.host;
              var httpSignatureOptions = {
                algorithm: 'rsa-sha256',
                authorizationHeaderName: 'Signature',
                keyId,
                key: actorWhoSendNote.privateKey
              };

              recipients.forEach(function(recipient) {
                console.log(recipient);
                if (recipient === "https://www.w3.org/ns/activitystreams#Public") {
                  console.log("Public");
                } else {
                  Actor.findOne({
                    'url': recipient
                  }, function(error, actorRecipient) {
                    console.log(actorRecipient);
                    var options = {
                      privateKeyPem: actorWhoSendNote.privateKey,
                      creator: actorWhoSendNote.url,
                      algorithm: 'RsaSignature2017'
                    };
                    jsig.sign(newActivity.toJSON(), options, function(err, signedNewActivity) {
                      signedNewActivity.published = newActivity.published;
                      signedNewActivity.object.published = newActivity.object.published;
                      if (err) {
                        console.log('Signing error', err);
                      }
                      console.log('Signed object:', signedNewActivity);
                      var activityOptions = {
                        url: actorRecipient.inbox,
                        json: true,
                        method: 'POST',
                        body: signedNewActivity,
                        httpSignature: httpSignatureOptions
                      };
                      //if (activityOptions.url != newNote.actorObject.inbox) {
                      request(activityOptions, function(error, response, next) {
                        if (error) {
                          req.flash('alert', 'An error occured !');
                        } else {
                          console.log('coucou');

                        }

                      });
                      //}
                    });
                  });
                }
              });

              res.redirect('/');


            }
          });
        });

      }
    });
  }
});

module.exports = router;