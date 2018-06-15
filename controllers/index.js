var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var Note = require('../models/Note');
var User = require('../models/User');
var Actor = require('../models/activitypub/Actor');
var Activity = require('../models/activitypub/Activity');
var Follow = require('../models/activitypub/Follow');

var actorHelper = require('../helpers/activitypub/actor');

/* Index - Home page */
var instance = process.env.INSTANCE;
router.get('/', function(request, response, next) {
  if (request.isAuthenticated()) {
    Note.find({}, null, {
      sort: {
        published: -1
      }
    }, function(err, notes) {
      response.render('index', {
        title: 'Home sweet home',
        notes: notes,
        instance: instance
      });
    });
  } else {
    response.render('welcome', {
      title: 'Welcome to ' + instance,
      instance: instance
    });
  }
});

/* Register routes */

router.get('/register', function(request, response) {

  response.render('register', {
    title: 'Register',
    instance: instance

  });
});

router.post('/register', function(request, response) {
  var username = request.body.username;
  var password = request.body.password;
  var password2 = request.body.password2;
  var host = request.get('Host');

  request.checkBody('username', 'Username is required').notEmpty();
  request.checkBody('password', 'Password is required').notEmpty();
  request.checkBody('password2', 'Passwords do not match').equals(password);

  var errors = request.validationErrors();

  if (errors) {
    response.render('register', {
      errors: errors
    });
  } else {
    var newUser = new User({
      username: username,
      password: password
    });
    User.createUser(newUser, function(error, user) {
      if (error) {
        console.log('error');
        response.render('register', {
          title: 'Register - Error',
          error: 'username not available'
        });
      } else {

        var newActor = new Actor({
          user_id: newUser._id,
          username: newUser.username,
          host: host, // A changer
          url: "http://" + host + '/users/' + newUser.username, // Webfinger
          inbox: "http://" + host + '/users/' + newUser.username + '/inbox',
          outbox: "http://" + host + '/users/' + newUser.username + '/outbox',
          following: "http://" + host + '/users/' + newUser.username + '/following',
          followers: "http://" + host + '/users/' + newUser.username + '/followers',
          published: newUser.created_at
        });

        Actor.createLocalActor(newActor, function(error, actor) {
          if (error) {
            console.log('There is an error !');
            console.log(error.message);
            console.log(error);
            response.render('regiser', {
              title: 'Register - Error',
              error: 'username not avaible'
            });

          } else {
            //      console.log(actor);

            var newFollowers = new Follow({
              actor: actor.url,
              type: "Followers",
              items: []
            });
            var newFollowing = new Follow({
              actor: actor.url,
              type: "Following",
              items: []
            });

            Follow.createFollow(newFollowers, function(error, followers) {
              //        console.log(followers);
            });

            Follow.createFollow(newFollowing, function(error, followers) {
              //      console.log("nothing here");
            });
          }
        });




        request.flash(
          'alert-success',
          'You are now registered. Please login for more fun.'
        );
        response.location('/');
        response.redirect('/');
      }
    });

    //  console.log(newUser._id);
  }
});


/* Login routes */
router.get('/login', function(request, response) {
  response.render('login', {
    title: 'Log in',
    instance: instance
  });
});

router.post('/login',
  passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true
  }),
  function(request, response) {
    request.flash('alert-success', 'You are now logged in, welcome !');
    response.redirect('/');
  });

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy(function(username, password, done) {

  User.getUserByUsername(username, function(error, user) {
    if (error) throw error;
    if (!user) {
      return done(null, false, {
        message: 'Invalid authentification'
      });
    }

    User.comparePassword(password, user.password, function(error, isMatch) {
      if (error) return done(error);
      if (isMatch) {
        return done(null, user);
      } else {
        return done(null, false, {
          message: 'Invalid authentification'
        });
      }
    });
  });
}));


/* Logout routes */
router.get('/logout', function(request, response) {
  request.logout();
  request.flash('alert-success', 'You are now logged out');
  response.redirect('/login');
});



/* Notes db routes */

router.get('/note.json', function(request, response) {
  Note.find({}, function(error, notes) {
    if (error) throw error;
    response.json(notes);
  });
});

/* Exports */

module.exports = router;