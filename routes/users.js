var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/User');
var Note = require('../models/Note');
var Actor = require('../models/activitypub/Actor');

//var Actor = require('../models/activitypub/Actor');

/* Search bar - Members routes */
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


/* My settings routes */

router.get('/settings', User.ensureAuthenticate, function(request,response){
  response.render('settings', {
    username:request.user.username
  });
});


/* My page route */

router.get('/:username', User.ensureAuthenticate, function(request,response){
  var username = request.params.username;
  Note.find({'author_username':username}, null, {sort:{created_at:-1}}, function(error, notes){
    response.render('me',{
      author:username,
      notes:notes
    });
  });
});




/* User db routes */

router.get('/db/users.json', function(request,response){
  Actor.find({}, function(error,actors){
    if (error) throw error;
    response.send(actors);
  });
});



module.exports = router;
