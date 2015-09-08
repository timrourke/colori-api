"use strict";

var debug = require('debug')('app:routes:users' + process.pid),
    _ = require("lodash"),
    util = require('util'),
    path = require('path'),
    async = require('async'),
    Router = require("express").Router,
    User = require(path.join(__dirname, '..', '..', 'models', 'user.js')),
    UserProfile = require(path.join(__dirname, '..', '..', 'models', 'user_profile.js'));

module.exports = function () {

  var router = new Router();

  router.route('/').get(function(req, res) {
    User.find({}, function(err, users) {

      if (err) {
        return next(err);
      } else if (!users) {
        res.status(404).json({ success: false, message: 'No users found.' });
      }

      var userResults = [];

      async.each(users, function(user, callback) {

        //Remove password from returned users. Not generally
        //needed for a users query.
        delete user['password'];

        //Uses the schema transformation method defined in the UserSchema.

        UserProfile.find({ _creator: user._id })
        .exec(function(err, profile) {
          if (err) return next(err);

          if (profile) {
            user = user.toObject();
            user.profile = profile;  
          }

          userResults.push(user);

          callback();

        });

      }, function(err) {

        if (err) {
          return next(err);
        } else {
          res.json({
            success: true,
            message: userResults.length + ' users found.',
            foundUsers: userResults
          });   
        }

      });
      
    });
  });

  var findUserByUsername = function(username, callback) {
    User.findOne({ username: username }, function(err, user) {

      if (err) {
        return callback(err);
      } else if (!user) {
        return callback(null, null);        
      } else {
        return callback(null, user)
      }

    });
  }

  var findUserByUsernameAndUpdate = function(username, updatedUserProperties, callback) {
    User.findOne({ username: username }, function(err, user) {

      if (err) {
        return callback(err);
      } else if (!user) {
        return callback(null, null);        
      } else {
        User.findByIdAndUpdate(user._id, updatedUserProperties, function(err, updatedUser) {
          if (err) {
            return next(err);
          } else if (!updatedUser || updatedUser == null) {
            return callback(null, null);
          } else {
            return callback(null, updatedUser);
          }
        });
      }

    });
  }

  router.route('/:username').get(function(req, res, next) {
    findUserByUsername(req.params.username, function(err, user) {
      if (err) {
        return next(err);
      } else if (!user || user == null) {
        res.status(404).json({ success: false, message: 'No users found.' }); 
      } else {
        UserProfile.find({ _creator: user._id })
        .exec(function(err, profile) {
          if (err) return next(err);

          if (profile) {
            user = user.toObject();
            user.profile = profile;  
          }

          res.json({
            success: true,
            message: 'User found by username ' + req.params.username + '.',
            foundUser: user
          }); 
        });
        
      }
      
    });
  });

  router.route('/:username').put(function(req, res, next) {
    findUserByUsernameAndUpdate(req.params.username, req.body, function(err, updatedUser) {
      if (err) {
        return next(err);
      } else if (!updatedUser || updatedUser == null) {
        res.status(404).json({ success: false, message: 'No users found.' }); 
      } else {
        UserProfile.find({ _creator: updatedUser._id })
        .exec(function(err, profile) {
          if (err) return next(err);

          if (profile) {
            updatedUser = updatedUser.toObject();
            updatedUser.profile = profile;  
          }

          res.json({
            success: true,
            message: 'User ' + updatedUser.username + ' successfully updated.',
            updatedUser: updatedUser
          }); 
        });
        
      }
      
    });
  });

  router.unless = require("express-unless");

  return router;
};

debug("Loaded");