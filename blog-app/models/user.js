var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
  username: String,
  password: String
});

// Adds features and functionalities
//  from pass-loc-mong to our MongoDB schema
//  to have user-authentication
UserSchema.plugin(passportLocalMongoose);
//adds in  serialize and deserialize user methods that come with pass-loc-mong module

module.exports = mongoose.model("User", UserSchema);
