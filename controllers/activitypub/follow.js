// Node modules
var express = require('express');
var router = express.Router({
  mergeParams: true
});
var jsonld = require('jsonld');
var jsig = require('jsonld-signatures');
jsig.use('jsonld', jsonld);

// Models
var Collection = require('../../models/activitypub/Collection');
var Actor = require('../../models/activitypub/Actor');
var User = require('../../models/User');
var Follow = require('../../models/activitypub/Follow');
var request = require('request');
var Activity = require('../../models/activitypub/Activity');

// Helpers
var collection = require('../../helpers/activitypub/collection');
var signature = require('../../helpers/activitypub/signature');
var actor = require('../../helpers/activitypub/actor');
var user = require('../../helpers/user');
var follow = require('../../helpers/activitypub/follow');

// GET Routes
router.get('/followers', function (req, res) {
  var username = req.params.username;
  var Type = Follow;

  res.format({
    'text/html': function () {
      res.redirect('/users/' + username);
    },

    'application/activity+json': function () {
      follow.jsonPage(username, Type, 'followers', res);
    },
    'application/ld+json': function () {
      follow.jsonPage(username, Type, 'followers', res);
    },

  });

});

router.get('/following', function (req, res) {
  var username = req.params.username;
  var Type = Follow;

  res.format({
    'text/html': function () {
      res.redirect('/users/' + username);

    },

    'application/activity+json': function () {
      follow.jsonPage(username, Type, 'following', res);
    },
    'application/ld+json': function () {
      follow.jsonPage(username, Type, 'following', res);
    },

  });
});


// POST Routes

router.post('/follow', User.ensureAuthenticate, function (req, res) {
  var actorWithHost = req.query.resource;
  var actorParts = actorWithHost.split('@');
  var username = actorParts[0];
  var host = actorParts[1];

  actor.getByAddress(username, host, function (error, actorToFollow) {
    actor.getCurrent(req, function (error, followSender) {

      var followObject = {
        "@context": [
          "https://www.w3.org/ns/activitystreams",
          'https://w3id.org/security/v1',
          {
            RsaSignature2017: 'https://w3id.org/security#RsaSignature2017'
          }
        ],
        id: followSender.url + "/follows/" + actorToFollow._id,
        type: "Follow",
        summary: '',
        actor: followSender.url,
        object: actorToFollow.url,

      };

      signature.signObject(followSender, followObject, function (err, signedFollowObject) {
        if (err) {
          return console.log('Signing error:', err);
        }

        console.log('Signed document:', signedFollowObject);
     
        signature.postSignedObject(signedFollowObject, actorToFollow, followSender);

      });


      req.flash('alert-success', 'Request sent');
      res.location('/users/account/' + actorToFollow._id);
      res.redirect('/users/account/' + actorToFollow._id);
    });

  });

});


router.post('/unfollow', User.ensureAuthenticate, function (req, res) {
  var actorWithHost = req.query.resource;
  var actorParts = actorWithHost.split('@');
  var username = actorParts[0];
  var host = actorParts[1];

  actor.getByAddress(username, host, function (error, recipient) {
    actor.getCurrent(req, function (error, sender) {
      var followObject = {
        id: sender.url + "/follows/" + recipient._id,
        type: "Follow",
        summary: '',
        actor: sender.url,
        object: recipient.url,

      };
      var unfollowObject = {
        "@context": [
          "https://www.w3.org/ns/activitystreams",
          'https://w3id.org/security/v1',
          {
            RsaSignature2017: 'https://w3id.org/security#RsaSignature2017'
          }
        ],
        id: sender.url + "/unfollow/" + recipient._id,
        type: "Undo",
        summary: '',
        actor: sender.url,
        object: followObject,

      };
      console.log(sender.url);
      console.log(recipient.url);
      follow.unFollow(recipient.url, sender.url);


      signature.signObject(sender, unfollowObject, function (err, signedUnfollowObject) {
        if (err) {
          console.log('Signing error:', err);
        }

        console.log('Signed document:', signedUnfollowObject);

        signature.postSignedObject(signedUnfollowObject, recipient, sender);


      });


      req.flash('alert-success', 'Unfollowed user');
      res.location('/users/account/' + recipient._id);
      res.redirect('/users/account/' + recipient._id);
    });

  });

});

module.exports = router;