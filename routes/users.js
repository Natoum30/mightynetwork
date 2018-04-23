var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/User');



/* GET users listing. */
router.get('/',  User.ensureAuthenticate, function (request, response){
if (request.user)
{
  User.find({}, function(error, users){
    response.render('members', {
        title:'Members',
        users:users
      });
  });
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
  passport.authenticate('local',{failureRedirect:'/users/login',failureFlash:true}),
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
  response.redirect('/users/login');
});


/* Me routes */

router.get('/me', User.ensureAuthenticate, function(request,response){
  response.render('/me', {
    title:request.session.user.username
  });
});

/* User db routes */

router.get('/users.json', function(request,response){
  User.find({}, function(error,users){
    if (error) throw error;
    response.send(users);
  });
});



module.exports = router;
