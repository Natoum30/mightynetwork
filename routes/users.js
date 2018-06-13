var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/User');
var Note = require('../models/Note');
var Actor = require('../models/activitypub/Actor');
var http = require('request');
var Actor = require('../models/activitypub/Actor');
var instance = process.env.INSTANCE;


/* Search bar - Members routes */
router.post('/', function(request, response, next) {

  var userCalled = request.body.user_searched;
  var [userCalledUsername, userCalledHost] = userCalled.split('@');

  // Handle search errors
  if (userCalled.length === 0) {
    response.location('/users/');
    response.redirect('/users/');
  }

  if (userCalledHost === undefined || userCalledHost.length === 0) {
    request.flash('error', 'You have to specify user\'s @host');
    response.location('/users/');
    response.redirect('/users/');

  }

  if (userCalledUsername === undefined || userCalledUsername.length === 0) {
    request.flash('error', 'You have to specify username');
    response.location('/users/');
    response.redirect('/users/');

  }

  // Search with webfinger

  var webfingerRoute = "http://" + userCalledHost + "/.well-known/webfinger?resource=acct:" + userCalled;
  var webfingerOptions = {
    url: webfingerRoute,
    json: true
  };

  http.get(webfingerOptions, function(error, res, actorWebfinger) {
    if (!error && res.statusCode === 200) {
      if (actorWebfinger.aliases != undefined) {
        var actorUrl = actorWebfinger.aliases[0];

        var actorOptions = {
          url: actorUrl,
          headers: {
            'Accept': 'application/activity+json'
          },
          json: true
        };

        http.get(actorOptions, function(error, res, actor) {
          if (!error && res.statusCode === 200) {
            if (userCalledHost === request.get('Host')) {
              response.redirect('users/' + actor.preferredUsername);
            } else {
              console.log("Creating new actor...");
              var newActor = new Actor({
                username: actor.preferredUsername,
                host: userCalledHost, // A changer
                url: actor.url, // Webfinger
                inbox: actor.inbox,
                outbox: actor.outbox,
                following: actor.following,
                followers: actor.followers,
                publicKey: actor.publicKey.publicKeyPem
              });
              console.log(newActor);

              Actor.createRemoteActor(newActor, function(error, act) {
                if (error) {
                  console.log('already in database');
                } else {
                  console.log(newActor);
                }
              });
              response.redirect('users/' + newActor.username);
            }
          } else {
            console.log('error');
          }
        });
      } else {
        request.flash('error', actorWebfinger.error);
        response.location('/users/');
        response.redirect('/users/');
      }
    } else {
      request.flash('error', 'Could not fetch data');
      response.location('/users/');
      response.redirect('/users/');
    }
  });

});









router.get('/', function(request, response) {
  response.render('search', {
    title: 'Search for members',
    instance: instance

  });
});


/* My settings routes */

router.get('/notifications', User.ensureAuthenticate, function(request, response) {
  response.render('notifications', {
    title: 'Notifications',
    instance: instance,
    username: request.user.username
  });
});

router.get('/actors.json', function(request, response) {
  Actor.find({}, function(error, actors) {
    if (error) throw error;
    response.json(actors);
  });
});

router.get('/users.json', function(request, response) {
  User.find({}, function(error, actors) {
    if (error) throw error;
    response.json(actors);
  });
});




/* My page route */

router.get('/:username', function(request, response, next) {
  var username = request.params.username;

  Actor.findOne({
    'username': username
  }, function(error, actor) {
    if (error) {
      console.log('error');
    }
    if (!actor) {
      response.format({
        'text/html': function() {
          response.render('error', {
            message: 'actor not found',
            status: '404',
          });
        },
        'application/activity+json': function() {
          response.send('');
        }
      });
    } else {
      response.format({

        'text/html': function() {
          // Show outbox activities
          Note.find({
              'actorObject': actor
            },
            null, {
              sort: {
                published: -1
              }
            },

            function(error, notes) {
              response.render('user', {
                title: actor.username,
                notes: notes,
                author: actor.username,
                host: actor.host,
                instance: instance
              });
            });
        },

        'application/activity+json': function() {
          Actor.showActorActivityPubObject(actor, response);
        },

        'application/ld+json': function() {
          Actor.showActorActivityPubObject(actor, response);
        }

      });
    }
  });
});


router.get('/:username/note/:id', User.ensureAuthenticate, function(request, response) {
  var username = request.params.username;
  Note.findById(request.params.id, function(error, note) {
    response.render('note', {
      username: note.actorObject.username,
      actor: note.actorObject,
      content: note.content,
      published: note.published,
      host: instance

    });
  });
});






/* User db routes */


module.exports = router;