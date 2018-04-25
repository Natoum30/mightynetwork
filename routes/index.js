var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var Note = require('../models/Note');
var User = require('../models/User');


/* GET home page. */
router.get('/', function(request, response, next) {
  if (request.isAuthenticated())
  {
    Note.find({}, null, {sort:{created_at: -1}}, function(err, notes){
      response.render('index', {
        title: 'Home sweet home',
        notes:notes
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
        error:'username not available'
      });
    } else{
    console.log(user);

    request.flash('alert-success','You are now registered. Please login for more fun.');

    response.location('/');
    response.redirect('/');
  }
});
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
})
);


/* Logout routes */
router.get('/logout',function(request,response){
  request.logout();
  request.flash('alert-success','You are now logged out');
  response.redirect('/login');
});


/* Post a Note */
router.post('/', User.ensureAuthenticate, function(request, response){

  var note = request.body.note;

  request.checkBody('note').notEmpty();

  var errors = request.validationErrors();

  if(errors){

  request.flash('error','You seem to have nothing to share ? Too bad !');
  response.location('/');
  response.redirect('/');
  } else {
      var newNote = new Note ({
      note:note,
      author_id:request.user._id,
      author_username:request.user.username
      });

      Note.createNote(newNote, function(error,note){

        if(error) {
          response.send('error');
        }  else {
            request.flash('alert-success','Message shared !');
            response.location('/');
            response.redirect('/');
          }
      });
    }
});

/* PAS FINI */
router.get('/note/:id', function(request,response){
  Notes.findById(request.params.id, function(error,note){
    response.render('note',{username:request.user.username,content:note.note});
  });
});
/* db */

router.get('/note.json', function(request,response){
  Note.find({}, function(error,notes){
    if (error) throw error;
    response.send(notes);
  });
});

module.exports = router;
