var jsonld = require('jsonld');
var jsig = require('jsonld-signatures');
jsig.use('jsonld', jsonld);
var request = require('request');

module.exports.signObject = function (byActor, object, callback) {
  var options = {
    privateKeyPem: byActor.privateKey,
    creator: byActor.url,
    algorithm: 'RsaSignature2017'
  };
  jsig.sign(object, options, callback);
};



module.exports.isSignatureVerified = function (fromActor, signedObject, callback) {
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

  jsig.verify(signedDocument, options, callback);
};

module.exports.postSignedObject = function (signedObject, actorRecipient, httpSignatureOptions) {

  // console.log('Signed object:', signedObject);

  var objectOptions = {
    url: actorRecipient.inbox,
    json: true,
    method: 'POST',
    body: signedObject,
    headers: {
      'Accept': 'application/activity+json'
    },
    httpSignature: httpSignatureOptions
  };
  request(objectOptions, function (error, body) {
    if (error) {
      console.log('error', error)
    }

  });


}