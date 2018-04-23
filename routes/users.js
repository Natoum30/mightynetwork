var express = require('express');
var router = express.Router();
var User = require('../models/User');



/* GET users listing. */
router.get('/',  User.ensureAuthenticate, function (request, response){
if (request.user)
{
  User.find({}, function(error, users){
    response.render('members', {
        title:'Members',
        users:users
      });
  });
}
});


/* Me routes */

router.get('/settings', User.ensureAuthenticate, function(request,response){
  response.render('settings', {
    username:request.user.username
  });
});

/* User db routes */

router.get('/users.json', function(request,response){
  User.find({}, function(error,users){
    if (error) throw error;
    response.send(users);
  });
});



module.exports = router;
