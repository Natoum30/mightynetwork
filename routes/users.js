var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/User');
var Actor = require('../models/activitypub/Actor');

//var Actor = require('../models/activitypub/Actor');

/* GET users listing. */
router.post('/', User.ensureAuthenticate, function(request,response,next){
  var str = request.body.user_searched;
  var [user_searched,host] = str.split('@');
  Actor.findOne({'username':user_searched,'host':host}, function(error,actor){
    if(actor){
        response.render('members', {
          unique:true,
          actor:actor,
          subtitle:'We found a match'
        });
      } else {
        Actor.find({'username':user_searched}, function(error,actors){
          if(actors){
            response.render('members',{
              unique:false,
              actors:actors,
              subtitle:'Maybe you are looking for:'
            });
          }
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
