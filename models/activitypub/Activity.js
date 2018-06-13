var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var instance = process.env.INSTANCE;
var db = mongoose.connect('mongodb://localhost:27017/' + instance);
var Actor = require('./Actor');
var Note = require('../Note');
var http = require('request');
var jsonld = require('jsonld');
var jsig = require('jsonld-signatures');

jsig.use('jsonld', jsonld);

var activitySchema = new Schema({
  "@context": String,
  type: String, // Can be "follow", "accept", "create", "reject"...
  id: String,
  actor: String,
  object: JSON || String,
  signature: JSON
});

activitySchema.options.toJSON = {
  transform: function(doc, ret, options) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;

    return ret;
  }
};


activitySchema.methods.toJSON = function() {
  var obj = this.toObject();
  delete obj._id;
  delete obj.__v;
  delete obj.actorObject;
  return obj;
};

var Activity = module.exports = mongoose.model('Activity', activitySchema);

module.exports.createActivity = function(newActivity, callback) {
  newActivity.id = newActivity.actor + '/note/' + newActivity._id;
  newActivity.save(callback);
};

module.exports.signObject = function(byActor, object) {
  var options = {
    privateKeyPem: byActor.privateKey,
    creator: byActor.url,
    algorithm: 'RsaSignature2017'
  };
  console.log(jsig.sign(object, options));
  return jsig.promises.sign(object, options);
};

module.exports.isSignatureVerified = function(fromActor, signedObject) {
  var publicKeyObject = {
    '@context': jsig.SECURITY_CONTEXT_URL,
    '@id': fromActor.url,
    '@type': 'CryptographicKey',
    owner: fromActor.url,
    publicKeyPem: fromActor.publicKey
  };

  var publicKeyOwnerObject = {
    '@context': jsig.SECURITY_CONTEXT_URL,
    '@id': fromActor.url,
    publicKey: signedObject.publicKey
  };

  var options = {
    publicKey: publicKeyObject,
    publicKeyOwner: publicKeyOwnerObject
  };

  return jsig.promises.verify(signedDocument, options)
    .catch(err => {
      logger.error('Cannot check signature.', {
        err
      })
      return false
    })

};
//
//module.exports.postActivity = function(message,callback){
//  var destInbox = 'http://localhost:3000/users/nath/inbox';
//  var postOptions = {
//    url:destInbox,
//    headers: {'content-type' : 'application/activity+json'},
//    json : true,
//    form : message
//  };
//  http.post(postOptions, callback);
//};
//module.exports.postActivity = function(newActivity,callback){
//  var dest = newActivity.to;
//  dest.forEach(function(destUrl){
//    if (destUrl != 'https://www.w3.org/ns/activitystreams#Public') {
//      var destOptions ={
//        url:destUrl,
//        headers:{
//          'Accept' : 'application/activity+json'
//        },
//        json:true,
//        form : newActivity.toJSON()
//      };
//      http.get(destOptions, function(error,res,dest){
//        var postOptions = {
//          url:dest.inbox,
//          headers: {'content-type' : 'application/activity+json'},
//          json : true
//        };
//        http.post(postOptions, callback);
//      });
//    }
//  });
//
//};