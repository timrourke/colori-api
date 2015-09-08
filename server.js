var debug 				    = require('debug')('app: ' + process.pid);
var path 					= require('path');
var fs 						= require('fs');
var express 			    = require('express');

debug('Initializing express.');
var app 					= express();
var bodyParser              = require('body-parser');
var morgan                  = require('morgan');
var onFinished              = require('on-finished');
var mongoose                = require('mongoose');

var NotFoundError	        = require(path.join(__dirname, 'errors', 'NotFoundError.js'));
var tokenUtils			    = require(path.join(__dirname, 'utils', 'tokenUtils.js'));
var unless			        = require('express-unless');

var config 				    = require(path.join(__dirname, 'config', 'config')); // get our config file
var User                    = require('./app/models/user'); // get our User model
var UserProfile             = require('./app/models/user_profile'); // get our UserProfile model

debug('Starting application');

/*
 * Configuration
 *
 */

// Global application configuration
var port = process.env.PORT || 8080;
mongoose.connect(config.database);
mongoose.connection.on('error', function() {
	debug('Mongoose connection error.');
});
mongoose.connection.once('open', function callback() {
	debug('Mongoose connected to db.');
});


debug('Initializing plugins.');
// Middleware - Morgan for logging
app.use(morgan('dev'));

// Middleware - Bodyparser for POST/GET params
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Middleware - Performance-related
app.use(require('compression')());
app.use(require('response-time')());
app.use(function(req, res, next) {
	onFinished(res, function(err) {
		debug('[%s] finished request', req.connection.remoteAddress);
	});

	next();
});


/*
 * Frontend Routes
 *
 */

// Load temporary test frontend
//app.use(express.static(__dirname + '/testfrontend'));
app.use('/app', express.static(__dirname + '/testfrontend/app'));
app.use('/bower_components', express.static(__dirname + '/testfrontend/bower_components'));
// app.use('/css', express.static(__dirname + '/css'));
app.use('/app/partials', express.static(__dirname + '/testfrontend/app/partials'));


/*
 * API Routes
 *
 */

app.use('/api', tokenUtils.middleware().unless({path: ['/api/auth/login', '/api/auth/signup', '/api/auth/logout']}));
app.use("/api/auth", require(path.join(__dirname, 'app', 'routes', 'users', 'authorization.js'))());
app.use("/api/users", require(path.join(__dirname, 'app', 'routes', 'users', 'users.js'))());

app.all('*', function(req, res, next) {
    // Just send the index.html for other files to support HTML5Mode
    res.sendFile('index.html', { root: __dirname + '/testfrontend/' });
});

// // all other requests redirect to 404
app.all("*", function (req, res, next) {
    next(new NotFoundError("404"));
});

// error handler for all the applications
app.use(function (err, req, res, next) {

    var errorType = typeof err,
        code = 500,
        msg = { message: "Internal Server Error" };

    switch (err.name) {
        case "UnauthorizedError":
            code = err.status;
            msg = undefined;
            break;
        case "BadRequestError":
        case "UnauthorizedAccessError":
        case "NotFoundError":
            code = err.status;
            msg = err.inner;
            break;
        default:
            break;
    }

    return res.status(code).json(msg);

});

app.listen(port);
console.log('colori-api listening on localhost at port ' + port);