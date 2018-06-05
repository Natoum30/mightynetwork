var express = require('express');
var router = express.Router({
  mergeParams: true
});
var Collection = require('../../models/activitypub/Collection');
var Actor = require('../../models/activitypub/Actor');
var User = require('../../models/User');
var Follow = require('../../models/activitypub/Follow');
var request = require('request');

router.get('/followers', function(req, res) {
  var username = req.params.username;
  var Type = Follow;

  res.format({
    'text/html': function() {},
    'application/activity+json': function() {

      User.findOne({
        'username': username
      }, function(error, user) {
        Actor.findOne({
          'user_id': user._id
        }, function(error, actor) {
          var followers = Collection.makeCollection(Type, 'followers', res, actor.url);
        });
      });
    },

    'application/ld+json': function() {
      User.findOne({
        'username': username
      }, function(error, user) {
        Actor.findOne({
          'user_id': user._id
        }, function(error, actor) {
          var followers = Collection.makeCollection(Type, 'followers', res, actor.url);
        });
      });

    },

  });

});

router.get('/following', function(req, res) {
  var username = req.params.username;
  var Type = Follow;

  res.format({
    'text/html': function() {},
    'application/activity+json': function() {

      User.findOne({
        'username': username
      }, function(error, user) {
        Actor.findOne({
          'user_id': user._id
        }, function(error, actor) {
          var following = Collection.makeCollection(Type, 'following', res, actor.url);
        });
      });
    },

    'application/ld+json': function() {
      User.findOne({
        'username': username
      }, function(error, user) {
        Actor.findOne({
          'user_id': user._id
        }, function(error, actor) {
          var following = Collection.makeCollection(Type, 'following', res, actor.url);
        });
      });

    },

  });
});


router.post('/follow', function(req, res) {
  var actorWithHost = req.query.resource;
  var actorParts = actorWithHost.split('@');
  var name = actorParts[0];
  var host = actorParts[1];

  Actor.findOne({
    'username': name,
    'host': host
  }, function(error, recipient) {
    Actor.findOne({
      'username': req.user.username,
      'host': req.get('Host')
    }, function(error, sender) {
      console.log(sender);
      var followObject = {
        "@context": "https://www.w3.org/ns/activitystreams",
        type: "Follow",
        summary: '',
        actor: sender.url,
        object: recipient.url
      };
      var followOptions = {
        url: recipient.inbox,
        json: true,
        method: 'POST',
        headers: {
          'Accept': 'application/activity+json'
        },
        body: followObject
      };

      request(followOptions);
      req.flash('alert-success', 'Request sent');
      res.location('/users/' + recipient.username);
      res.redirect('/users/' + recipient.username);
    });

  });

});

module.exports = router;