const Meeting = require('google-meet-api').meet;
const passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
const sendEmail = require("./sendEmail")
const CallReserve = require("../models/CallReserve")

require("dotenv").config({ path: ".variables.env" });
const moment = require("moment")

module.exports = (reserveTime, client_id, email) => {
	return new Promise((resolve, reject) => {
		try {
			console.log('try')
			passport.use(new GoogleStrategy({
				clientID: process.env.MEET_USER,
				clientSecret: process.env.MEET_PASS,
				callbackURL: `${process.env.HOME_URL}auth/callback`
			},
				function (accessToken, refreshToken, profile, cb) {
					console.log('refresh token', refreshToken)
					Meeting({
						clientId: process.env.MEET_USER,
						clientSecret: process.env.MEET_PASS,
						refreshToken: refreshToken,
						date: moment(reserveTime).format('YYYY-MM-DD'),
						time: moment(reserveTime).format('HH:mm'),
						summary: 'summary',
						location: 'Tunisia',
						description: 'description',
						checking: 0
					}).then(function (result) {
						reserve = new CallReserve({
							userId: client_id,
							reserveTime
						}).save();
						const url = `${process.env.BASE_URL}meeting?url=${result}&client=${client_id}`
						console.log('------meeting------>')
						console.log(url)
						sendEmail(email, "Video Call URL", url)
						sendEmail('khaoulafattah4@gmail.com', "Video Call URL", url)
						resolve({ success: true, message: "Reserve successfully!", result: {} })
					}).catch((error) => {
						console.log(error)
						resolve({ success: false, message: 'Creating Video Call Failed!', result: {} })
					});
					return cb();
				}
			));
		} catch (err) {
			console.log(err);
			resolve({ success: false, message: 'Creating Video Call Failed!', result: {} })
		}
	})
};