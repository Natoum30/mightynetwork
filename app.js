//var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');
var session = require('express-session');
var validator = require('express-validator');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var multer = require('multer');
var upload = multer({
  dest: './uploads'
});
var flash = require('connect-flash');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var instance = process.env.INSTANCE;
var db = mongoose.createConnection('mongodb://localhost:27017/' + instance);
var bcrypt = require('bcryptjs');
var indexRouter = require('./routes/index');
var noteRouter = require('./routes/note');
var usersRouter = require('./routes/users');
var webfingerRouter = require('./routes/webfinger');
var inboxRouter = require('./routes/activitypub/inbox');
var outboxRouter = require('./routes/activitypub/outbox');
var followRouter = require('./routes/activitypub/follow');
var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views')); // Pas obligatoire
app.set('view engine', 'pug');


app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());
app.use(express.static('public'));
app.use(express.json({
  type: ['application/json', 'application/activity+json', 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"']
}));
app.use(express.urlencoded({
  extended: true
}));
app.use(session({
  secret: 'jaimelechocolat',
  saveUninitialized: true,
  resave: true
}));
// Validator ?
app.use(validator({
  errorFormatter: function(param, msg, value) {
    var namespace = param.split('.'),
      root = namespace.shift(),
      formParam = root;
    while (namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param: formParam,
      msg: msg,
      value: value
    };
  }
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Connect-flash
app.use(require('connect-flash')());
app.use(function(request, response, next) {
  response.locals.messages = require('express-messages')(request, response);
  next();
});

app.use(function(request, response, next) {
  response.locals.user = request.user || null;
  next();
});

app.use('/', indexRouter);
app.use('/', noteRouter);
app.use('/users', usersRouter);
app.use('/.well-known', webfingerRouter);
app.use('/users/:username/outbox', outboxRouter);
app.use('/users/:username/inbox', inboxRouter);
app.use('/users/:username', followRouter);
// catch 404 and forward to error handler
app.use(function(request, response, next) {
  next(createError(404));
});

// error handler
app.use(function(err, request, response, next) {
  // set locals, only providing error in development
  response.locals.message = err.message;
  response.locals.error = request.app.get('env') === 'development' ? err : {};

  // render the error page
  response.status(err.status || 500);
  response.render('error');
});

module.exports = app;

app.listen(process.env.NODE_PORT);