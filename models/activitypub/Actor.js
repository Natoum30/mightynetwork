// Modèle Actor (pas encore ActivityPub)
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var db = mongoose.connect('mongodb://localhost:27017/mightynetwork');

var actorSchema = new Schema({
  user_id:{type:Schema.Types.ObjectId, required:false},
  url:{type:String,required:true},
  username:{type:String,required:true},
  host:{type:String,require:true},
  inbox:{type:String,required:true},
  outbox:{type:String,required:true},
  following:{type:String, required:true},
  followers:{type:String, required:true},
  created_at:Date
});

var Actor = module.exports = mongoose.model('Actor', actorSchema);

actorSchema.index({username:1, host:1}, {unique:true});


module.exports.createActor= function(newActor,callback){
if(!newActor.created_at) newActor.created_at = new Date();
newActor.save(callback);

};

module.exports.showActorActivityPubObject= function(actor,response){
  var actorActivityPubObject = {
    "@context": [
      "https://www.w3.org/ns/activitystreams"
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
      "sharedInbox": "http://" + actor.host + "/inbox"
    },
  //  "publicKey": {
  //    "owner": "https://${localDomain}/",
  //    "id": "https://${localDomain}/publickey",
  //    "publicKeyPem": "-----BEGIN PUBLIC KEY-----MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA8NY/rAs24sgBWrTFiE0ovxSbv9ekts8NM109W6WM3s30SpAAmK/dPVzmMLeZxrsHaJVOFOCuSe2X2vVHUkYySMDokdIUWfHfGf+hpied8QPVJopoZq8cv3zz6HC8j7RFUaQYQMYi5JpdF7z9y0ZpI8bvRxWH2TPchJQe0uDk8Jvdlcqm/FfQIC6rQyLgLnX2/kRs0e7TeYTmMlXvtbmUqbtBd9FHIA0Kz9xyPm310N2E0Ca/pbDRYEylw5roRN1FI3teov3dR3Jxoy02iwHTeI9FOUF4K/MaS+ebZGjlI7ArJa4zHQ0gqslFlNLbi+4KdOI6CQKyjBZqRNBGlXBD8QIDAQAB-----END PUBLIC KEY-----"
  //  }
  };
  response.json(actorActivityPubObject);
};

// var Note = module.exports=mongoose.model('Note', noteSchema);
//
// module.exports.createNote= function(newNote,callback){
   // if(!newNote.created_at) newNote.created_at = new Date();
   // newNote.save(callback);
// };
//
//
// module.exports.getNoteById=function(id,callback){
  // Note.findById(id,callback);
// };
