const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
// Load configurations
const config = require('./config/env');
const jwtStrategyConfig = require('./config/jwt');
const mongoose = require('mongoose');
const passport = require('passport');

// Connect to MongoDB

mongoose.connect(config.database.name);
mongoose.connection.on('connected', () => {
  console.info(`Connected to database: ${config.database.name}`);
});
mongoose.connection.on('error', (err) => {
  console.info(`Unable to connect to MongoDB ${config.database.name}`);
});


// Routes for the app

var index = require('./routes/index');
var users = require('./routes/users');
var auth = require('./routes/auth');
var challenges = require('./routes/challenges');
var compilers = require('./routes/compilers');


var app = express();

// Set environment
app.set('env', config.application.env);

// Middleware to allow request from other domains
app.use(cors());
// Middleware for authentication
app.use(passport.initialize());
app.use(passport.session());
// Add the jwt strategy to passport
jwtStrategyConfig(passport);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', index);
app.use('/users', users);
app.use('/auth', auth);
app.use('/challenges', passport.authenticate('jwt', { session: false }), challenges);
app.use('/compilers', passport.authenticate('jwt', { session: false }), compilers)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  error = req.app.get('env') === 'development' ? {error: true, msg: err.message} : { error: true, msg: 'Internal Server error' };

  // render the error page
  res.status(err.status || 500);
  res.json(error);
});

module.exports = app;
