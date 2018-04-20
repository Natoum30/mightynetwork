var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcryptjs');
var db = mongoose.connect('mongodb://localhost:27017/mightynetwork2');

var userSchema = new Schema({
  username: {type:String, required:true, unique:true},
  password: {type:String, required:true},
  created_at: Date
});

// 'pre' ça se passe juste avant l'écriture dans le base de donnée
//userSchema.pre('save', function(next){
//  var user = this;
//
//  if(!this.created_at) this.created_at = new Date();
//  bcrypt.genSalt(5, function(error, salt){
//    bcrypt.hash(user.password, salt, function(error,hash){
//      user.password=hash;
//
//      next();
//    });
//  });
//});

userSchema.methods.compare = function(pw){
  return bcrypt.compareSync(pw, this.password);
};

module.exports=mongoose.model('User', userSchema);

module.exports.createUser= function(newUser,callback){
  bcrypt.genSalt(10, function(error, salt){
  bcrypt.hash(newUser.password, salt, function(error,hash){
     newUser.password=hash;
     newUser.save(callback);
   });
 });
};
