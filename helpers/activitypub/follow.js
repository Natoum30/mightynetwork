var Follow = require('../../models/activitypub/Follow');
var collecHelper = require('./collection');


module.exports.addFollowers = function(newFollower, actorWhoReceiveFollow) {
  Follow.update({
    actor: actorWhoReceiveFollow.url,
    type: "Followers"
  }, {
    $addToSet: {
      items: newFollower
    }
  }, function(error, up) {
    if (error) {
      console.log("error");
    }
    if (!error) {
      console.log('no error');
    }
  });
};

module.exports.addFollowing = function(newFollowing, actorFollowing) {
  Follow.update({
    actor: actorFollowing,
    type: "Following"
  }, {
    $addToSet: {
      items: newFollowing
    }
  }, function(error, up) {

    if (error) {
      console.log("error");
    }
    if (!error) {
      console.log("no error, Added to the actor's followings !");
    }
  });

};

module.exports.unFollow = function(actorToUnfollow, unFollower) {
  Follow.update({
    actor: actorToUnfollow,
    type: "Followers"
  }, {
    $pull: {
      items: unFollower
    }
  }, function(error, up) {
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