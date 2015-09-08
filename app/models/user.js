// User model
var mongoose 			= require('mongoose'),
		Schema 				= mongoose.Schema,
		bcrypt 				= require('bcryptjs'),
		uuid 					= require('uuid'),
		UserProfile 	= require('./user_profile');

function minLength8(v) {
	return v.length >= 8;
}

var UserSchema = new Schema({
	username: 								{ type: String, unique: true, require: true },
	password: 								{ type: String, select: false, validate: [minLength8, 'must be a minimum of 8 characters long' ]},
	email: 										{ type: String, unique: true, require: true },
	created: 									{ type: Date, default: null },
	modified: 								{ type: Date, default: null },
	email_verified: 					{ type: Boolean, select: false, default: false },
	email_verification_uuid: 	{ type: String, select: false, unique: true, default: uuid.v4() },
	password_reset_uuid: 			{ type: String, select: false, unique: true, default: null },
	is_admin: 								{ type: Boolean, select: false, default: false },
	user_profile:  						{ type: Schema.Types.ObjectId, ref: 'UserProfile' }
});

if (!UserSchema.options.toObject) {
	UserSchema.options.toObject = {};
}

UserSchema.pre('save', function(next) {
	var user = this;
	if (this.isNew) {
		user.created = new Date();
	}
	if (this.isModified) {
		user.modified = new Date();
	}
	if (this.isModified('password') || this.isNew) {
		bcrypt.genSalt(10, function(err, salt) {
			if (err) {
				return next(err);
			}
			bcrypt.hash(user.password, salt, function(err, hash) {
				if (err) {
					return next(err);
				}
				user.password = hash;
				next();
			});
		});
	} else {
		return next();
	}
});

UserSchema.methods.comparePassword = function(passw, cb) {
	bcrypt.compare(passw, this.password, function(err, isMatch) {
		if (err) {
			return cb(err);
		}
		cb(null, isMatch);
	});
};

module.exports = mongoose.model('User', UserSchema);