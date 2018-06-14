router.post('/', function(req, res) {
  var username = req.params.username;
  var activity = req.body;

  if (activity.type === 'Follow') {
    // J'utilise très souvent la fonction Actor.findOne par exemple, j'aimerais
    //faire un findByUrl qui retournerait l'acteur
    // J'aimerais faire un truc genre :
    // var actorWhoReceiveFollow = findByUrl(activity.object);
    // Ça, ça ne marche pas mais je ne comprends pas trop comment faire,
    // ou alors définir la variable en dehors de la fonction et dans la fonction,
    // changer sa valeur ?

    Actor.findOne({
      'url': activity.object
    }, function(error, actorWhoReceiveFollow) {
      if (error) {
        console.log("Error");
      }

      if (actorWhoReceiveFollow) {

        var newFollower = activity.actor;

        // Parce que du coup pour mettre à jour ma table followers, je dois
        // imbriquer la fonction Follow.update dans le callback du Actor.findOne :

        Follow.update({
          actor: actorWhoReceiveFollow.url,
          type: "Followers"
        }, {
          $addToSet: {
            items: newFollower
          }
        }, function(error, update) {
          if (error) {
            console.log("error");
          }
        });

        // De même pour envoyer mon acceptObject, comme j'ai besoin de savoir
        //l'acteur qui renvoie l'Accept, je dois rester dans le callback

        var acceptObject = {
          "@context": [
            "https://www.w3.org/ns/activitystreams",
            'https://w3id.org/security/v1',
            {
              RsaSignature2017: 'https://w3id.org/security#RsaSignature2017'
            }
          ],
          id: actorWhoReceiveFollow.url + '/accept/' + actorWhoReceiveFollow.id,
          type: "Accept",
          actor: actorWhoReceiveFollow.url,
          object: activity
        };

        var keyId = "acct:" + actorWhoReceiveFollow.username + "@" + actorWhoReceiveFollow.host;

        var httpSignatureOptions = {
          algorithm: 'rsa-sha256',
          authorizationHeaderName: 'Signature',
          keyId,
          key: actorWhoReceiveFollow.privateKey
        };

        // De la même manière, pour signer les objects, je reconstruis à chaque
        //fois la fonction jsig.sign alors que j'aimerais construire ma propre
        // générique. J'ai vu que dans ton code, tu fais un :
        // return signedObject
        // mais quand je fais ça, je n'arrive pas à récupérer la variable
        //signedObject. En gros j'ai souvent l'erreur "variable used out of scope"

        jsig.sign(acceptObject, {
          privateKeyPem: actorWhoReceiveFollow.privateKey,
          creator: actorWhoReceiveFollow.url,
          algorithm: 'RsaSignature2017'

        }, function(err, signedAcceptObject) {
          if (err) {
            return console.log('Signing error:', err);
          }
          console.log('Signed document:', signedAcceptObject);


          Actor.findOne({
            'url': activity.actor
          }, function(error, acceptRecipient) {
            if (acceptRecipient) {

              console.log(acceptObject);


              var acceptOptions = {
                url: acceptRecipient.inbox,
                json: true,
                method: 'POST',
                body: signedAcceptObject,
                httpSignature: httpSignatureOptions
              };
              // Ici j'aimerais faire un return acceptOptions comme ça
              // Si je passe par ce if, acceptOptions a une certaine valeur,
              // et si je passe par l'autre, le acceptOptions en aura une autre,
              // et comme ça je peux faire une seule fois request(acceptOptions)
              // En gros lancer la fonction request or des balises if

              request(acceptOptions);
            }
            if (!acceptRecipient) {
              var actorOptions = {
                url: activity.actor,
                headers: {
                  'Accept': 'application/activity+json'
                },
                json: true
              };
              request.get(actorOptions, function(error, res, actor) {
                if (!error && res.statusCode === 200) {
                  var strUrl = actor.url;
                  var splitStrUrl = strUrl.split('/');
                  var actorHost = splitStrUrl[2];
                  var newActor = new Actor({
                    username: actor.preferredUsername,
                    host: actor.host || actorHost, // A changer
                    url: actor.url, // Webfinger
                    inbox: actor.inbox,
                    outbox: actor.outbox,
                    following: actor.following,
                    followers: actor.followers,
                    publicKey: actor.publicKey.publicKeyPem
                  });
                  Actor.createRemoteActor(newActor);


                  var acceptOptions = {
                    url: newActor.inbox,
                    json: true,
                    method: 'POST',
                    headers: {
                      'Accept': 'application/activity+json'
                    },
                    body: signedAcceptObject,
                    httpSignature: httpSignatureOptions
                  };
                  request(acceptOptions);
                } else {
                  console.log('error');
                }
              });
            }
          });

        });
      }
    });
  }
});

// Voilà, je sais pas trop si c'est plus clair, et je ne sais pas non plus ce
// qui est faisable et ce qui se fait normalement pour avoir un code propre !
// J'avais entendu dire que c'était pas bien de faire sortir des variables de leur
// "environnement" (je ne veux pas non plus faire des variables globales) mais
// là j'ai vraiment l'impression de faire des arbres de fonctions alors que
// ça pourrait être plus simple.
// Après ça se trouve il faut que je réécrive bien à chaque fois les callbacks
// et que j'imbrique les fonctions mais que je peux quand même les rendre plus propres..