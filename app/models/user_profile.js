// User Profile model
var mongoose 	= require('mongoose'),
		Schema 		= mongoose.Schema,
		uuid 			= require('uuid'),
		User 			= require('./user');

function maxLength600(v) {
	if (typeof v != 'undefined' && v != null && v != '') {
		return v.length <= 600;
	} else {
		return true;
	}
}

var UserProfileSchema = new Schema({
	_creator: 							{ type: Schema.Types.ObjectId, ref: 'User' },
	created: 								{ type: Date },
	modified:    						{ type: Date },
	avatar_url: 						{ type: String, default: null },
	bio: 										{ type: String, default: null, validate: [maxLength600, 'too long. 600 characters maximum.' ]},
	website: 								{ type: String, default: null },
	twitter_handle: 				{ type: String, default: null },
	facebook_handle: 				{ type: String, default: null },
	github_handle: 					{ type: String, default: null },
	dribble_handle: 				{ type: String, default: null },
	codepen_handle: 				{ type: String, default: null }
});

if (!UserProfileSchema.options.toObject) {
	UserProfileSchema.options.toObject = {};
}

UserProfileSchema.pre('save', function(next) {
	var userProfile = this;
	if (this.isNew) {
		userProfile.created = new Date();
	}
	if (this.isModified) {
		userProfile.modified = new Date();
	}
	return next();
});

module.exports = mongoose.model('UserProfile', UserProfileSchema);