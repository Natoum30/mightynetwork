// Node modules
var express = require('express');
var router = express.Router();
var jsonld = require('jsonld');
var jsig = require('jsonld-signatures');
jsig.use('jsonld', jsonld);
var request = require('request');

// Models
var Note = require('../models/Note');
var User = require('../models/User');
var Actor = require('../models/activitypub/Actor');
var Activity = require('../models/activitypub/Activity');
var Follow = require('../models/activitypub/Follow');

// Helpers
var actor = require('../helpers/activitypub/actor');
var signature = require('../helpers/activitypub/signature');
var follow = require('../helpers/activitypub/follow');

// Env
var instance = process.env.INSTANCE;


router.get('/', User.ensureAuthenticate, function (req, res) {
    res.render('notifications', {
      title: 'Notifications',
      instance: instance,
      username: req.user.username
    });
  });


  module.exports = router;