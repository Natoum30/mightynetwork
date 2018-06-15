var Actor = require('../../models/activitypub/Actor');
var request = require('request');


module.exports.showActorActivityPubObject = function(actor, response) {
  var actorActivityPubObject = {
    "@context": [
      "https://www.w3.org/ns/activitystreams",
      "https://w3id.org/security/v1",
      {
        RsaSignature2017: 'https://w3id.org/security#RsaSignature2017'
      }
    ],
    "id": actor.url,
    "type": "Person",
    "following": actor.following,
    "followers": actor.followers,
    "inbox": actor.inbox,
    "outbox": actor.outbox,
    "preferredUsername": actor.username,
    "name": actor.username,
    "summary": "No summary",
    "url": actor.url,
    "endpoints": {
      "sharedInbox": actor.inbox
    },
    "publicKey": {
      "owner": actor.url,
      "id": actor.url + "#main-key",
      "publicKeyPem": actor.publicKey
    }
  };
  response.json(actorActivityPubObject);
};


module.exports.getByUrl = function(actorUrl, callback) {
  Actor.findOne({
    'url': actorUrl
  }, callback);
};

module.exports.getRemoteActor = function(actorUrl, callback) {
  var actorOptions = {
    url: actorUrl,
    headers: {
      'Accept': 'application/activity+json'
    },
    json: true
  };

  request.get(actorOptions, callback);
};