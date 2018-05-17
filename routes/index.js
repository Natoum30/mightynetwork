var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var Note = require('../models/Note');
var User = require('../models/User');
var Actor = require('../models/activitypub/Actor');
var Activity = require('../models/activitypub/Activity');

/* Index - Home page */

router.get('/', function(request, response, next) {
  if (request.isAuthenticated())
  {
    Note.find({}, null, {sort:{published: -1}}, function(err, notes){
      response.render('index', {
        title: 'Home sweet home',
        notes:notes,
      });
    });
  } else {
    response.render('welcome', { title: 'Welcome to mightyNetwork' });
  }
});

/* Register routes */

router.get('/register', function(request, response) {
  response.render('register', {
    title:'Register'
  });
});

router.post('/register', function(request,response){
  var username = request.body.username;
  var password = request.body.password;
  var password2 = request.body.password2;
  var instance = request.get('Host');

  request.checkBody('username','Username is required').notEmpty();
  request.checkBody('password','Password is required').notEmpty();
  request.checkBody('password2','Passwords do not match').equals(password);

  var errors = request.validationErrors();

  if(errors){
    response.render('register',{
      errors:errors
    });
  } else {
    var newUser = new User ({
      username: username,
      password:password
    });

    User.createUser(newUser, function(error,user){
      if(error){
        response.render('register',{
          title:'Register - Error',
          error:'username not available'
        });
      } else {

        var newActor = new Actor ({
          user_id:newUser._id,
          username:newUser.username,
          host:instance, // A changer
          url:"http://" + instance + '/users/'+ newUser.username, // Webfinger
          inbox:"http://" + instance + '/users/'+ newUser.username + '/inbox',
          outbox:"http://" + instance +  '/users/' + newUser.username + '/outbox',
          following:"http://" + instance +  '/users/' + newUser.username + '/following',
          followers:"http://" + instance +  '/users/' + newUser.username + '/followers',
          published:newUser.created_at
        });

        Actor.createActor(newActor, function(error,actor){
          if(error){
            response.render('regiser', {
              title:'Register - Error',
              error:'username not avaible'
            });
          }
        });

        console.log(newActor);

        request.flash(
          'alert-success',
          'You are now registered. Please login for more fun.'
        );
        response.location('/');
        response.redirect('/');
      }
    });

    console.log(newUser._id);
  }
});


/* Login routes */
router.get('/login', function(request, response) {
  response.render('login', {
    title:'Log in'
  });
});

router.post('/login',
passport.authenticate('local',{failureRedirect:'/login',failureFlash:true}),
function(request, response) {
  request.flash('alert-success','You are now logged in, welcome !' );
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

passport.use(new LocalStrategy(function(username,password,done){

  User.getUserByUsername(username, function(error,user){
    if(error) throw error;
    if(!user) {
      return done(null,false,{message:'Invalid authentification'});
    }

    User.comparePassword(password,user.password,function(error,isMatch){
      if(error) return done(error);
      if(isMatch) {
        return done(null, user);
      } else {
        return done(null, false, {message:'Invalid authentification'});
      }
    });
  });
}));


/* Logout routes */
router.get('/logout',function(request,response){
  request.logout();
  request.flash('alert-success','You are now logged out');
  response.redirect('/login');
});


/* Post a Note */
router.post('/', User.ensureAuthenticate, function(request, response){
  var content = request.body.content;
  request.checkBody('content').notEmpty();
  var errors = request.validationErrors();
  if(errors){
    request.flash('error','You seem to have nothing to share ? Too bad !');
    response.location('/');
    response.redirect('/');
  } else {

    Actor.findOne({'user_id': request.user._id}, function(error,actor){
      if(error){
      ///
      } else {
      var newNote = new Note ({
        type:'Note',
        content: content,
        to:actor.followers,
        attributedTo: actor.url,
        published: Date,
        actorObject:actor,
        actor:actor.url
      });

      Note.createNote(newNote, function(error,note){
        if(error) {
          response.send('error');
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
              response.send('error');
            } else {
              request.flash('alert-success','Message shared !');
              response.location('/');
              response.redirect('/');
            }
          });
        }
      });
    }
  });
  }
});

/* Notes db routes */

router.get('/note.json', function(request,response){
  Note.find({}, function(error,notes){
    if (error) throw error;
    response.send(notes);
  });
});

/* Exports */

module.exports = router;
