var jsonld = require('jsonld');
var jsig = require('jsonld-signatures');
jsig.use('jsonld', jsonld);


module.exports.signObject = function(byActor, object, callback) {
  var options = {
    privateKeyPem: byActor.privateKey,
    creator: byActor.url,
    algorithm: 'RsaSignature2017'
  };
  jsig.sign(object, options, callback);
};



module.exports.isSignatureVerified = function(fromActor, signedObject, callback) {
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