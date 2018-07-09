// Node modules
var express = require('express');
var router = express.Router();

// Models
var User = require('../models/User');
var Note = require('../models/Note');
var Actor = require('../models/activitypub/Actor');
var request = require('request');
var Actor = require('../models/activitypub/Actor');

// Helpers
var actor = require('../helpers/activitypub/actor');
var user = require('../helpers/user');
var signHelper = require('../helpers/activitypub/signature');
var follow = require('../helpers/activitypub/follow');

var instance = process.env.INSTANCE;

/* Search bar - Members routes */
router.post('/', function (req, res, next) {

  var userCalled = req.body.user_searched;
  var [userCalledUsername, userCalledHost] = userCalled.split('@');

  // Handle search errors
  if (userCalled.length === 0) {
    res.location('/users/');
    res.redirect('/users/');
  }

  if (userCalledHost === undefined || userCalledHost.length === 0) {
    req.flash('error', 'You have to specify user\'s @host');
    res.location('/users/');
    res.redirect('/users/');

  }

  if (userCalledUsername === undefined || userCalledUsername.length === 0) {
    req.flash('error', 'You have to specify username');
    res.location('/users/');
    res.redirect('/users/');

  }

  // Search with webfinger

  var webfingerRoute = "http://" + userCalledHost + "/.well-known/webfinger?resource=acct:" + userCalled;
  var webfingerOptions = {
    url: webfingerRoute,
    json: true
  };

  request.get(webfingerOptions, function (error, webfingerResponse) {
    if (error || webfingerResponse === undefined) {
      console.log('Error Webfinger');
    }
    var actorWebfinger = webfingerResponse.body;
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

        request.get(actorOptions, function (error, searchedActorResponse) {

          if (error || searchedActorResponse === undefined) {
            console.log('Error actor');
          }
          
          var searchedActor = searchedActorResponse.body;
          
          if (!error && res.statusCode === 200) {
            console.log(searchedActor);
            if (userCalledHost === req.get('Host')) {
              actor.getLocalByUsername(userCalledUsername, function (error, localActor) {
                if (localActor) {
                  res.redirect('users/account/' + localActor._id);
                }
              });

            } else {

              actor.getByUrl(searchedActor.id, function (error, remoteActor) {
                if (remoteActor) {
                  res.redirect('users/account/' + remoteActor._id);
                }
                if (!remoteActor) {

                  console.log("Creating new actor...");
                  var newActor = new Actor({
                    username: searchedActor.preferredUsername,
                    host: userCalledHost, // A changer
                    url: searchedActor.id, // Webfinger
                    inbox: searchedActor.inbox,
                    outbox: searchedActor.outbox,
                    following: searchedActor.following,
                    followers: searchedActor.followers,
                    publicKey: searchedActor.publicKey.publicKeyPem
                  });

                  Actor.createRemoteActor(newActor);
                  res.redirect('users/account/' + newActor._id);

                }
              });

            }
          } else {
            console.log('error');
          }
        });
      } else {
        req.flash('error', actorWebfinger.error);
        res.location('/users/');
        res.redirect('/users/');
      }
    } else {
      req.flash('error', 'Could not fetch data');
      res.location('/users/');
      res.redirect('/users/');
    }
  });

});


router.get('/', function (req, res) {
  res.render('search', {
    title: 'Search for members',
    instance: instance

  });
});


/* My settings routes */



router.get('/actors.json', function (req, res) {
  Actor.find({}, function (error, actors) {
    if (error) throw error;
    res.json(actors);
  });
});

router.get('/users.json', function (req, res) {
  User.find({}, function (error, actors) {
    if (error) throw error;
    res.json(actors);
  });
});




/* My page route */
// User page for local Users
router.get('/:username', function (req, res, next) {
  var username = req.params.username;

  user.getByUsername(username, function (error, localUser) {
    if (!localUser) {
      res.format({
        'text/html': function () {
          res.render('error', {
            message: 'Not a local user',
            status: '404',
          });
        },

        'application/activity+json': function () {
          res.send({
            'error': 'Not a local user'
          });
        }
      });
    } else {
      actor.getByUserId(localUser._id, function (error, localActor) {
        if (error) {
          console.log('error');
        }
        if (localActor) {
          res.format({

            'text/html': function () {
              // Show outbox activities
              Note.find({
                  'attributedTo': localActor.url
                },
                null, {
                  sort: {
                    published: -1
                  }
                },

                function (error, notes) {
                  res.render('user', {
                    title: localActor.username,
                    notes: notes,
                    author: localActor.username,
                    host: localActor.host,
                    authorUrl: localActor.url,
                    instance: instance
                  });
                });

            },

            'application/activity+json': function () {

              actor.showActorActivityPubObject(localActor, res);

            },

            'application/ld+json': function () {
              console.log("hého");

              actor.showActorActivityPubObject(localActor, res);

            }
          });
        }
      });
    }

  });
});

router.get('/account/:id', function (req, res) {
  var id = req.params.id;
  
  actor.getById(id, function (error, remoteActor) {
    if (error) {
      console.log('error');
    }
    if (!remoteActor) {
      res.format({
        'text/html': function () {
          res.render('error', {
            message: 'actor not found',
            status: '404',
          });
        },
        'application/activity+json': function () {
          res.send('');
        }
      });
    } else {
      res.format({

        'text/html': function () {
          // Show outbox activities
          var state = null;
          if (req.isAuthenticated() === true) {
            actor.getCurrent(req, function (error, thisActor) {
        if (error) {console.log(error);}
           //   if (thisActor.url === remoteActor.url) {
           //     state = null
           //   } else {
        //
                follow.getFollowing(thisActor.url, function (error, followingObject) {
                  var followingList = followingObject.items;
        
                  var stateFollow = followingList.indexOf(remoteActor.url);
                  if (stateFollow === -1) {
                    state = false;
                  }
                  if (stateFollow > 0 || stateFollow === 0) {
                    state = true;
                  };

                  console.log(state);
                  Note.find({
                    'attributedTo': remoteActor.url
                  },
                  null, {
                    sort: {
                      published: -1
                    }
                  },
      
                  function (error, notes) {
                    res.render('user', {
                      title: remoteActor.username,
                      notes: notes,
                      author: remoteActor.username,
                      host: remoteActor.host,
                      authorUrl: remoteActor.url,
                      instance: instance,
                      followState : state
                    });
                  });
        
                });
              }
           // }
          );
          } else {
            console.log('Not authentified');
            console.log(state);
          }
          
        },

        'application/activity+json': function () {
          res.json({
            'Error': 'This actor does not exist'
          });
        },

        'application/ld+json': function () {
          res.json({
            'Error': 'This actor does not exist'
          });
        }

      });
    }
  });
});


router.get('/:username/note/:id', User.ensureAuthenticate, function (req, res) {
  var username = req.params.username;
  Note.findById(req.params.id, function (error, note) {
    res.render('note', {
      username: note.actorObject.username,
      actor: note.actorObject,
      content: note.content,
      published: note.published,
      instance: instance

    });
  });
});

/* User db routes */


module.exports = router;