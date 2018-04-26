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
      response.redirect('/users/'+ actor.username);
    } else {
      Actor.find({'username':user_searched}, function(error,actors){
        if(actors.length>0){
          response.render('members',{
            title:'Members',
            actors:actors,
            subtitle:'Maybe you are looking for:'
          });
        } else {
          response.render('members',{
            title:'Members',
            nofound:true,
            subtitle:'No member found'
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
    title:'My settings',
    username:request.user.username
  });
});


/* My page route */

router.get('/:username', User.ensureAuthenticate, function(request,response){
  var username = request.params.username;

  Actor.findOne({'username':username}, function(error,actor){
    if(error){
      throw error;
    } else {
      Note.find({'author_username':actor.username}, null, {sort:{created_at:-1}}, function(error,notes){
        response.render('user',{
          title:actor.username+'@'+actor.host,
          notes:notes,
          author:actor.username,
          host:actor.host
        });

      });
    }
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
