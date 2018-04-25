var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/User');
//var Actor = require('../models/activitypub/Actor');

/* GET users listing. */
router.post('/', User.ensureAuthenticate, function(request,response,next){
  var user_searched = request.body.user_searched;

  User.findOne({username:user_searched}, function(error,user){
    if(user){
        response.render('members', {
        title:'Members',
        member:user,
        subtitle:'Results :',
      });
    } else {
        response.render('members', {
        title:'Members',
        member:null,
        subtitle:'No members found, sorry',
      });
    }
});
});


router.get('/',  User.ensureAuthenticate, function (request, response){
      response.render('members', {
      title:'Members',
      });

});



/* Me routes */

router.get('/settings', User.ensureAuthenticate, function(request,response){
  response.render('settings', {
    username:request.user.username
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
