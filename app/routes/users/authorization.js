"use strict";

var debug = require('debug')('app:routes:authorization' + process.pid),
    _ = require("lodash"),
    util = require('util'),
    path = require('path'),
    async = require('async'),
    bcrypt = require('bcryptjs'),
    tokenUtils = require(path.join(__dirname, '..', '..', '..', 'utils', '/tokenUtils.js')),
    userUtils = require(path.join(__dirname, '..', '..', '..', 'utils', '/userUtils.js')),
    Router = require("express").Router,
    UnauthorizedAccessError = require(path.join(__dirname, '..', '..', '..', 'errors', 'UnauthorizedAccessError.js')),
    User = require(path.join(__dirname, '..', '..', 'models', 'user.js'));

var authenticate = function (req, res, next) {

  debug("Processing authenticate middleware");

  var username = req.body.username,
      password = req.body.password;

  if (_.isEmpty(username) || _.isEmpty(password)) {
    return next(new UnauthorizedAccessError("401", {
      message: 'Invalid username or password'
    }));
  }

  process.nextTick(function () {

    User.findOne({
        username: username
    }, '+password', function (err, user) {

      if (err || !user) {
        return next(new UnauthorizedAccessError("401", {
          message: 'Invalid username or password'
        }));
      }

      user.comparePassword(password, function (err, isMatch) {
        if (isMatch && !err) {
          debug("User authenticated, generating token");
          console.log("user authenticated, generating token");
          tokenUtils.create(user, req, res, next);
        } else {
          return next(new UnauthorizedAccessError("401", {
            message: 'Invalid username or password'
          }));
        }
      });
    });

  });

};

var signup = function(req, res, next) {

  var newUser = {
      username: req.body.username,
      password: req.body.password,
      email: req.body.email,
      is_admin: false
  }
  
  if (_.isEmpty(newUser.username)) {
    res.status(400).json({ success: false, message: 'Signup failed. Username must not be blank.' });
  }

  if (_.isEmpty(newUser.password)) {
    res.status(400).json({ success: false, message: 'Signup failed. Password must not be blank.' });
  }

  if (_.isEmpty(newUser.password)) {
    res.status(400).json({ success: false, message: 'Signup failed. Email address must not be blank.' });
  }

  process.nextTick(function() {

    User.findOne({
      username: newUser.username
    }, function(err, user) {

      if (err) return next(new UnauthorizedAccessError("401"));

      if (user) {
          res.status(400).json({ success:false, message: 'Signup failed. Username taken. Please try another username.' });
      } else if (!user) {

        var successNewUser = new User(newUser);

        successNewUser.save(function(err) {
          if (err) {
            next(err);
          }
          console.log('User saved successfully with ID of ' + successNewUser._id);

          delete successNewUser['password'];

          userUtils.createUserProfile(successNewUser, req, res, next);
        });

      };

    });

  });

}

module.exports = function () {

  var router = new Router();

  router.route("/signup").post(signup, function (req, res, next) {

      return res.status(200).json({
        user: req.user,
        message: 'User successfully created.'
      });  

  });

  router.route("/verify").get(function (req, res, next) {
    return res.status(200).json(undefined);
  });

  router.route("/logout").get(function (req, res, next) {
    if (tokenUtils.expire(req.headers)) {
      delete req.user;
      return res.status(200).json({
        "message": "User has been successfully logged out"
      });
    } else {
      return next(new UnauthorizedAccessError("401"));
    }
  });

  router.route("/login").post(authenticate, function (req, res, next) {
    return res.status(200).json({user: req.user });
  });

  router.unless = require("express-unless");

  return router;
};

debug("Loaded");