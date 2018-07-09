// Modèle Actor (pas encore ActivityPub)
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var instance = process.env.INSTANCE;
var db = mongoose.connect('mongodb://localhost:27017/' + instance);
var Follow = require('./Follow');
var pem = require('pem');
var User = require('../User');
var request = require('request');

pem.config({
  pathOpenSSL: '/usr/bin/openssl'
});

var actorSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    required: false
  },
  url: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  host: {
    type: String,
    require: true
  },
  inbox: {
    type: String,
    required: true,
    unique: true
  },
  outbox: {
    type: String,
    required: true,
    unique: true
  },
  following: {
    type: String,
    required: true,
    unique: true
  },
  followers: {
    type: String,
    required: true,
    unique: true
  },
  publicKey: {
    type: String,
    unique: true
  },
  privateKey: {
    type: String,
    required:false
  },
  created_at: Date
});

actorSchema.methods.toJSON = function() {
  var obj = this.toObject();
  //  delete obj._id;
  delete obj.__v;
  delete obj.user_id;
  delete obj.privateKey;
  return obj;
};

var Actor = module.exports = mongoose.model('Actor', actorSchema);

// actorSchema.index({username:1, host:1}, {unique:true});
module.exports.createPublicAndPrivateKey = function(actor) {

};


module.exports.createLocalActor = function(newActor, callback) {
  if (!newActor.created_at) newActor.created_at = new Date();

  pem.createPrivateKey(function(error, response) {
    if (error) {
      console.log('privateKey error');
      console.log('ERREUR PRIVATE : ');
      console.log(error);
    }
    if (response) {
      var privateKey = response.key;
      newActor.privateKey = privateKey;
      //console.log('PRIVATE KEY : ');
      //console.log(privateKey);

      pem.getPublicKey(privateKey, function(error, response) {
        if (error) {
          console.log('public key error');
          console.log('ERREUR PUBLIC : ');
          console.log(error);
        }
        if (!error) {
          var publicKey = response.publicKey;
          //  console.log('PUBLIC KEY : ');
          //  console.log(publicKey);
          newActor.publicKey = publicKey;
          //  console.log(actor);
          newActor.save(callback);

        }
      });
    }

  });

};

module.exports.createRemoteActor = function(newActor, callback) {
  if (!newActor.created_at) newActor.created_at = new Date();
  newActor.save(callback);
};