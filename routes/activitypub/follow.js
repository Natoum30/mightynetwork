var express = require('express');
var router = express.Router({mergeParams: true});
var Collection = require('../../models/activitypub/Collection');
var Actor = require('../../models/activitypub/Actor');
var Follow = require('../../models/activitypub/Follow');
var req = require('request');

router.get('/followers', function(request,response){
  var username = request.params.username;
  var host = request.get('Host');
  var Type = Follow;

  response.format({
    'text/html': function(){

    },



    'application/activity+json': function(){

    },

    'application/ld+json': function(){

    },

  });

});

router.get('/following', function(request,response){

});


router.post('/', function(request,response){

});

module.exports = router;
