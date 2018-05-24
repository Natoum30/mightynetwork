var express = require('express');
var router = express.Router({mergeParams: true});
var Collection = require('../../models/activitypub/Collection');
var Actor = require('../../models/activitypub/Actor');
var Note = require('../../models/Note');
var Activity = require('../../models/activitypub/Activity');
var request = require('request');

router.post('/', function(req,res){
var username = req.params.username;

var activity = req.body;

if (activity.type === 'Create') {
  var receivedNote = activity.object;

  Actor.findOne({'url': receivedNote.actor}, function(error,actor){
    var newNote = new Note ({
      type:'Note',
      content: receivedNote.content,
      to:receivedNote.to,
      attributedTo: receivedNote.attributedTo,
      published: receivedNote.published,
      actorObject:actor,
      actor:receivedNote.actor
    });

    Note.createNote(newNote);
    console.log(newNote);
  });



}
});

module.exports = router;
