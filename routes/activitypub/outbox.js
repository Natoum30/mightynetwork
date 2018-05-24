var express = require('express');
var router = express.Router({mergeParams: true});
var Collection = require('../../models/activitypub/Collection');
var Actor = require('../../models/activitypub/Actor');
var Activity = require('../../models/activitypub/Activity');
var http = require('request');


router.get('/', function(request,response){

  var username = request.params.username;
  var host = request.get('Host');
  var Type = Activity;

  var collection = Collection.makeCollection(username, host, Type, 'outbox', response);
  console.log(collection);
});




module.exports = router;
