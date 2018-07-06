// Models
var Follow = require('../../models/activitypub/Follow');

// Helpers 
var collection = require('./collection');
var user = require('../user');
var actor = require('./actor');

module.exports.addFollowers = function (newFollower, actorWhoReceiveFollow) {
  Follow.update({
    actor: actorWhoReceiveFollow.url,
    type: "Followers"
  }, {
    $addToSet: {
      items: newFollower
    }
  }, function (error, up) {
    if (error) {
      console.log("error");
    }
    if (!error) {
      console.log('no error');
    }
  });
};

module.exports.addFollowing = function (newFollowing, actorFollowing) {
  Follow.update({
    actor: actorFollowing,
    type: "Following"
  }, {
    $addToSet: {
      items: newFollowing
    }
  }, function (error, up) {

    if (error) {
      console.log("error");
    }
    if (!error) {
      console.log("no error, Added to the actor's followings !");
    }
  });

};

module.exports.unFollow = function (actorToUnfollow, unFollower) {
  Follow.update({
    actor: actorToUnfollow,
    type: "Followers"
  }, {
    $pull: {
      items: unFollower
    }
  }, function (error, up) {
    if (error) {
      console.log('error when updating');
    }
  });
};

module.exports.getFollowers = function (actorUrl, callback) {
  Follow.findOne({
    'actor': actorUrl,
    'type': 'Followers'
  }, callback)
}

module.exports.jsonPage = function (username, Type, route, res) {
  user.getByUsername(username, function (error, userFound) {
    if (!userFound) {
      console.log("error");
      var err = {
        error: 'No user found'
      };
      res.json(err);
    }
    if (userFound) {
      actor.getByUserId(userFound._id, function (error, actor) {
        collection.makeCollection(Type, route, res, actor.url);
      });
    }
  });
}