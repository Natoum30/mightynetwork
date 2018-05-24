var express = require('express');
var router = express.Router({mergeParams: true});
var Collection = require('../../models/activitypub/Collection');
var Actor = require('../../models/activitypub/Actor');
var Activity = require('../../models/activitypub/Activity');
var http = require('request');

router.post('/', function(request,response){

const activity = request.body;
});


module.exports = router;
