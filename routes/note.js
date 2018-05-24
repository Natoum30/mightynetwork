var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var Note = require('../models/Note');
var User = require('../models/User');
var Actor = require('../models/activitypub/Actor');
var Activity = require('../models/activitypub/Activity');
var request = require('request');

/* Post a Note */
router.post('/', User.ensureAuthenticate, function(req, res){
  var content = req.body.content;
  req.checkBody('content').notEmpty();
  var errors = req.validationErrors();
  if(errors){
    req.flash('error','You seem to have nothing to share ? Too bad !');
    res.location('/');
    res.redirect('/');
  } else {

    Actor.findOne({'user_id': req.user._id}, function(error,actor){
      if(error){
      ///
      } else {
      var newNote = new Note ({
        type:'Note',
        content: content,
        to:Array("https://www.w3.org/ns/activitystreams#Public","http://localhost:3000/users/nath"),
        attributedTo: actor.url,
        published: Date,
        actorObject:actor,
        actor:actor.url
      });

      Note.createNote(newNote, function(error,note){
        if(error) {
          res.send('error');
        } else {
          var newActivity = new Activity ({
            "@context": "https://www.w3.org/ns/activitystreams",
            type : "Create",
            to : note.to,
            object: note.toJSON(),
            actor:note.actor
          });

          Activity.createActivity(newActivity, function(error,activity){
            if (error) {
              res.send('error');
            } else {
              req.flash('alert-success','Message shared !');
              res.location('/');
              res.redirect('/');
            }
          });
          // Send my message to followers
          request({
            url:'http://localhost:8000/users/narf/inbox',
            json:true,
            method:'POST',
            body: newActivity
          });
        }
      });
    }
  });
  }
});

module.exports = router;
