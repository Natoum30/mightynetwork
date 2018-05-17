var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/User');
var Note = require('../models/Note');
var Actor = require('../models/activitypub/Actor');
var req = require('request');
//var Actor = require('../models/activitypub/Actor');

/* Search bar - Members routes */
router.post('/', function(request,response,next){


  var userCalled = request.body.user_searched;
  var [userCalledUsername,userCalledHost] = userCalled.split('@');
  var webfingerRoute = "http://" + userCalledHost + "/.well-known/webfinger?resource=acct:" + userCalled;
  var webfingerOptions = {
    url: webfingerRoute,
    json:true
  };
  req.get(webfingerOptions, function(error, res, actorWebfinger){
    if(!error && res.statusCode === 200){
      var actorUrl = actorWebfinger.aliases[0];

      var actorOptions ={
        url:actorUrl,
        headers:{
          'Accept' : 'application/activity+json'
        },
        json:true
      };

      req.get(actorOptions, function(error,res,actor){
        if (!error && res.statusCode === 200 ) {

          var newActor = new Actor ({
            username:actor.preferredUsername,
            host:userCalledHost, // A changer
            url:actor.url, // Webfinger
            inbox:actor.inbox,
            outbox:actor.outbox,
            following:actor.following,
            followers:actor.followers,
          });

          Actor.createActor(newActor, function(error,act){
            if(error){
              console.log('already in database');
            } else {
              console.log(newActor);
            }
          });
          response.redirect('users/'+newActor.username);
        } else {console.log('error');}
      });
    }
  });





//  Actor.findOne({'username':user_searched,'host':host}, function(error,actor){
//    if(actor){
//      response.redirect('/users/'+ actor.username);
//    } else {
//      Actor.find({'username':user_searched}, function(error,actors){
//        if(actors.length>0){
//          response.render('members',{
//            title:'Members',
//            actors:actors,
//            subtitle:'Maybe you are looking for:'
//          });
//        } else {
//          response.render('members',{
//            title:'Members',
//            nofound:true,
//            subtitle:'No member found'
//          });
//        }
//      });
//    }
//  });
});


router.get('/',  function (request, response){
  response.render('members', {
    title:'Members',
  });
});


/* My settings routes */

router.get('/notifications', User.ensureAuthenticate, function(request,response){
  response.render('notifications', {
    title:'Notifications',
    username:request.user.username
  });
});

router.get('/users.json', function(request,response){
  Actor.find({}, function(error,actors){
    if (error) throw error;
    response.send(actors);
  });
});





/* My page route */

router.get('/:username', function(request,response,next){
  var username = request.params.username;
  Actor.findOne({'username':username}, function(error,actor){
    if(error){
      console.log('error');
    }
    if (!actor){
      response.format({
        'text/html': function(){
      response.render('error', {
        message:'pas trouvé',
        status:'404',
      });
        },
        'application/activity+json': function(){
          response.send('');
        }
      });
    } else {
      response.format({

        'text/html': function(){
          Note.find(
            {'actorObject':actor},
            null,
            {sort:{published:-1}},
            function(error,notes){
              response.render('user',{
                title:actor.username,
                notes:notes,
                author:actor.username,
                host:actor.host
              });
            });
          },

        'application/activity+json': function(){
          Actor.showActorActivityPubObject(actor,response);
        },

        'application/ld+json': function(){
          Actor.showActorActivityPubObject(actor,response);
        }

      });
    }
  });
});


router.get('/:username/note/:id', User.ensureAuthenticate, function(request,response){
  var username = request.params.username;
  Note.findById(request.params.id, function(error,note){
    response.render('note',{
      username:note.actorObject.username,
      actor:note.actorObject,
      content:note.content,
      published:note.published
    });
  });
});






/* User db routes */


module.exports = router;
