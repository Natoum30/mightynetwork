var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var Note = require('../models/Note');
var User = require('../models/User');
var Actor = require('../models/activitypub/Actor');
var Activity = require('../models/activitypub/Activity');
var Follow = require('../models/activitypub/Follow');

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
    }, function(error, actor) {
      if (error) {
        ///
      } else {

        Follow.findOne({
          'actor': actor.url,
          'type': 'Followers'
        }, function(error, followers) {
          console.log(followers);
          var recipients = followers.items;
          var newNote = new Note({
            type: 'Note',
            content: content,
            to: recipients,
            attributedTo: actor.url,
            published: Date,
            actorObject: actor,
            actor: actor.url
          });

          Note.createNote(newNote, function(error, note) {
            if (error) {
              res.send('error');
            } else {
              var newActivity = new Activity({
                "@context": "https://www.w3.org/ns/activitystreams",
                type: "Create",
                to: note.to,
                object: note,
                actor: note.actor
              });

              recipients.forEach(function(recipient) {
                console.log(recipient);
                if (recipient === "https://www.w3.org/ns/activitystreams#Public") {
                  console.log("ok");
                } else {

                  Actor.findOne({
                    'url': recipient
                  }, function(error, actor) {

                    Activity.signObject(actor, newActivity);

                    var activityOptions = {
                      url: actor.inbox,
                      json: true,
                      method: 'POST',
                      body: newActivity
                    };
                    console.log(activityOptions.url);
                    console.log(newNote.actorObject.inbox);

                    if (activityOptions.url != newNote.actorObject.inbox) {
                      request(activityOptions, function(error, response, next) {
                        if (error) {
                          req.flash('alert-success', 'An error occured !');
                        } else {
                          console.log('coucou');

                        }

                      });
                    }
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