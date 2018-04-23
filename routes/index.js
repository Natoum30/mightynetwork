var express = require('express');
var router = express.Router();
var Note = require('../models/Note');
var User = require('../models/User');


/* GET home page. */
router.get('/', User.ensureAuthenticate, function(request, response, next) {
  if (request.user)
  {
    Note.find({}, null, {sort:{created_at: -1}}, function(err, notes){
      response.render('index', {
        title: 'Home sweet home',
        notes:notes
      });
    });


  } else {
    response.render('welcome', { title: 'Welcome to mightyNetwork' });
  }
});


/* Post a Note */
router.post('/', User.ensureAuthenticate, function(request, response){
 var note = request.body.note;

request.checkBody('note','You seem to have nothing to share ? Too bad !').notEmpty();

var errors = request.validationErrors();

if(errors){
  response.render('index', {
    errors:errors
  });
} else {
  var newNote = new Note ({
    note:note,
    author_id:request.user._id,
    author_username:request.user.username
  });
Note.createNote(newNote, function(error,note){
  if(error) {
  response.send('error');
}  else {

    request.flash('alert-success','Message shared !');

    response.location('/');
    response.redirect('/');
  }
});
}
});

/* PAS FINI */
router.get('/note/:id', function(request,response){
  Notes.findById(request.params.id, function(error,note){
    response.render('note',{username:request.user.username,content:note.note});
  });
});
/* db */

router.get('/note.json', function(request,response){
  Note.find({}, function(error,notes){
    if (error) throw error;
    response.send(notes);
  });
});

module.exports = router;
