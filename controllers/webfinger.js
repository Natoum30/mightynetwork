// Node modules
var express = require('express');
var router = express.Router();

// Models
var Actor = require('../models/activitypub/Actor');


var isWebfingerResourceValid = function(value) {

  var exists = function(value) {
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

router.get('/webfinger', function(req, res, next) {
  var value = req.query.resource;
  console.log(isWebfingerResourceValid(value));
  if (isWebfingerResourceValid(value) != false) {
    var actorWithHost = value.substr(5);
    var actorParts = actorWithHost.split('@');

    var name = actorParts[0];
    var host = actorParts[1];
    var thisHost = req.get('Host');
    var notfound = {
      "error": "Actor not found"
    };

    if (host != thisHost) {
      res.json(notfound);
    }

    Actor.findOne({
      'username': name,
      'host': host
    }, function(error, actor) {
      if (actor) {
        // Set correct content type.


        var res = {
          "subject": req.query.resource,
          "aliases": [actor.url],
          "links": [{
            "rel": "self",
            "type": "application/activity+json",
            "href": actor.url
          }]
        };
        //  console.log(' ↳ Sending WebFinger response.\n');
        res.json(res);
      }
      if (!actor) {
        res.json(notfound);
      }
    });
  } else {
    console.log('error');
  }
});




module.exports = router;