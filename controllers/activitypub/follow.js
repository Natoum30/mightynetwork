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
var collecHelper = require('../../helpers/activitypub/collection');


router.get('/followers', function(req, res) {
  var username = req.params.username;
  var Type = Follow;

  res.format({
    'text/html': function() {},
    'application/activity+json': function() {

      User.findOne({
        'username': username
      }, function(error, user) {
        if (!user) {
          console.log("error");
          var err = {
            error: 'No user found'
          };
          res.json(err);
        }
        if (user) {
          Actor.findOne({
            'user_id': user._id
          }, function(error, actor) {
            collecHelper.makeCollection(Type, 'followers', res, actor.url);
          });
        }
      });

    },

    'application/ld+json': function() {
      User.findOne({
        'username': username
      }, function(error, user) {
        Actor.findOne({
          'user_id': user._id
        }, function(error, actor) {
          collecHelper.makeCollection(Type, 'followers', res, actor.url);
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
        if (!user) {
          res.send();
        } else {
          Actor.findOne({
            'user_id': user._id
          }, function(error, actor) {
            if (error) {
              throw error;
            }
            var following = collecHelper.makeCollection(Type, 'following', res, actor.url);
          });
        }
      });
    },

    'application/ld+json': function() {
      User.findOne({
        'username': username
      }, function(error, user) {
        Actor.findOne({
          'user_id': user._id
        }, function(error, actor) {
          var following = collecHelper.makeCollection(Type, 'following', res, actor.url);
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
      var followObject = {
        "@context": [
          "https://www.w3.org/ns/activitystreams",
          'https://w3id.org/security/v1',
          {
            RsaSignature2017: 'https://w3id.org/security#RsaSignature2017'
          }
        ],
        id: sender.url + "/follows/" + recipient._id,
        type: "Follow",
        summary: '',
        actor: sender.url,
        object: recipient.url,

      };



      jsig.sign(followObject, {
        privateKeyPem: sender.privateKey,
        creator: sender.url,
        algorithm: 'RsaSignature2017'

      }, function(err, signedFollowObject) {
        if (err) {
          return console.log('Signing error:', err);
        }

        console.log('Signed document:', signedFollowObject);

        var keyId = "acct:" + sender.username + "@" + sender.host;
        console.log(keyId);
        var httpSignatureOptions = {
          algorithm: 'rsa-sha256',
          authorizationHeaderName: 'Signature',
          keyId,
          key: sender.privateKey
        };

        var followOptions = {
          url: recipient.inbox,
          json: true,
          method: 'POST',
          headers: {
            'Accept': 'application/activity+json'
          },
          httpSignature: httpSignatureOptions,
          body: signedFollowObject
        };

        request(followOptions);
        console.log(res.body);

      });


      req.flash('alert-success', 'Request sent');
      res.location('/users/account/' + recipient._id);
      res.redirect('/users/account/' + recipient._id);
    });

  });

});


router.post('/unfollow', function(req, res) {
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


      jsig.sign(unfollowObject, {
        privateKeyPem: sender.privateKey,
        creator: sender.url,
        algorithm: 'RsaSignature2017'

      }, function(err, signedUnfollowObject) {
        if (err) {
          return console.log('Signing error:', err);
        }

        console.log('Signed document:', signedUnfollowObject);

        var keyId = "acct:" + sender.username + "@" + sender.host;
        console.log(keyId);
        var httpSignatureOptions = {
          algorithm: 'rsa-sha256',
          authorizationHeaderName: 'Signature',
          keyId,
          key: sender.privateKey
        };

        var unfollowOptions = {
          url: recipient.inbox,
          json: true,
          method: 'POST',
          headers: {
            'Accept': 'application/activity+json'
          },
          httpSignature: httpSignatureOptions,
          body: signedUnfollowObject
        };

        request(unfollowOptions);
        console.log(res.body);

      });


      req.flash('alert-success', 'Unfollow sent');
      res.location('/users/account/' + recipient._id);
      res.redirect('/users/account/' + recipient._id);
    });

  });

});

module.exports = router;