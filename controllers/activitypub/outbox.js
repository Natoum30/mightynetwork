var express = require('express');
var router = express.Router({
  mergeParams: true
});
var Collection = require('../../models/activitypub/Collection');
var Actor = require('../../models/activitypub/Actor');
var User = require('../../models/User');
var Activity = require('../../models/activitypub/Activity');
var http = require('request');
var Note = require('../../models/Note');

router.get('/', function(request, response) {

  var username = request.params.username;
  //  var host = request.get('Host');
  var Type = Note;

  User.findOne({
    'username': username
  }, function(error, user) {
    Actor.findOne({
      'user_id': user._id,
    }, function(error, actor) {
      var collection = Collection.makeCollection(Note, 'outbox', response, actor.url);
    });
  });


});
module.exports = router;