var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/User');
var Note = require('../models/Note');
var Actor = require('../models/activitypub/Actor');
var http = require('request');




isWebfingerResourceValid = function(value) {

  exists = function (value) {
    return value !== undefined && value !== null;
  };

  if (!exists(value)) return false;
  if (value.startsWith('acct:') === false) return false;

  var actorWithHost = value.substr(5);
  var actorParts = actorWithHost.split('@');

  if (actorParts.length !== 2) return false;

 console.log('ok');
//  return sanitizeHost(host, REMOTE_SCHEME.HTTP) === CONFIG.WEBSERVER.HOST;
};



/* WebFinger*/

router.get('/webfinger', function (request, response, next) {
  var value = request.query.resource;
  console.log(isWebfingerResourceValid(value));
  if (isWebfingerResourceValid(value)!= false)
  {
    var actorWithHost = value.substr(5);
    var actorParts = actorWithHost.split('@');

    var name = actorParts[0];
    var host = actorParts[1];
    var thisHost = request.get('Host');
    var notfound = {
      "error":"Actor not found"
    };

    if (host != thisHost) {
      response.json(notfound);
    }

    Actor.findOne({'username':name,'host':host}, function(error,actor){
      var contentType = 'application/activity+json; charset=utf-8';
      response.set('Content-Type', contentType);
      if(actor){
        // Set correct content type.


        var res = {
          "subject": request.query.resource,
          "aliases": [ actor.url ],
          "links": [
            {
              "rel": "self",
              "type": "application/activity+json",
              "href": actor.url
            }
          ]
        };
        //  console.log(' ↳ Sending WebFinger response.\n');
        response.json(res);
      }
      if(!actor) {
        response.json(notfound);
      }
    });
   } else {
    console.log('error');
  }
});




module.exports=router;
