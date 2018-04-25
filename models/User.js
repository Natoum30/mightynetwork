var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcryptjs');
var db = mongoose.connect('mongodb://localhost:27017/mightynetwork2');
var Actor = require('./activitypub/Actor');


var userSchema = new Schema({
  username: {type:String, required:true},
  password: {type:String, required:true},
  created_at: Date,
});


userSchema.methods.compare = function(pw){
  return bcrypt.compareSync(pw, this.password);
};

var User = module.exports=mongoose.model('User', userSchema);

module.exports.createUser= function(newUser,callback){
  bcrypt.genSalt(10, function(error, salt){
  bcrypt.hash(newUser.password, salt, function(error,hash){
     newUser.password=hash;
     newUser.save(callback);
   });
 });
   if(!newUser.created_at) newUser.created_at = new Date();

};

module.exports.getUserById=function(id,callback){
  User.findById(id,callback);
};

module.exports.getUserByUsername=function(username,callback){
  var query = {username: username};
  User.findOne(query,callback);
};

module.exports.comparePassword=function(candidatePassword,hash,callback){
  bcrypt.compare(candidatePassword, hash, function(error,isMatch){
    callback(null, isMatch);
  });
};

module.exports.ensureAuthenticate=function(request,response,next){
  if (request.isAuthenticated()){
    return next();
  }
  response.redirect('/login');
};
