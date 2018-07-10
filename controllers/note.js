// Node modules
var express = require('express');
var router = express.Router();
var jsonld = require('jsonld');
var jsig = require('jsonld-signatures');
jsig.use('jsonld', jsonld);

// Models
var Note = require('../models/Note');
var User = require('../models/User');
var Activity = require('../models/activitypub/Activity');

// Helpers
var actor = require('../helpers/activitypub/actor');
var signature = require('../helpers/activitypub/signature');
var follow = require('../helpers/activitypub/follow');

/* Post a Note */
router.post('/', User.ensureAuthenticate, function (req, res) {
  var content = req.body.content;
  req.checkBody('content').notEmpty();

  var errors = req.validationErrors();

  if (errors) {
    req.flash('error', 'You seem to have nothing to share ? Too bad !');
    res.location('/');
    res.redirect('/');
  } else {

    actor.getByUserId(req.user._id, function (error, actorWhoSendNote) {
      if (error) {} else {

        follow.getFollowers(actorWhoSendNote.url, function (error, followers) {

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


          Note.createNote(newNote, function (error, note) {

            if (error) {
              throw "Erreur";
            } else {

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
       

              recipients.forEach(function (recipient) {
                if (recipient === "https://www.w3.org/ns/activitystreams#Public") {
                  console.log("Public");
                } else {
                  actor.getByUrl(recipient, function (error, actorRecipient) {

                    signature.signObject(actorWhoSendNote, newActivity.toJSON(), function (err, signedNewActivity) {
                      signedNewActivity.published = newActivity.published;
                      signedNewActivity.object.published = newActivity.object.published;
                      //console.log(signedNewActivity);

                      if (err) {
                        return console.log('Signing error:', err);
                      }

                      signature.postSignedObject(signedNewActivity, actorRecipient, actorWhoSendNote);
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