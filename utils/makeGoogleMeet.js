const Meeting = require('google-meet-api').meet;
const sendEmail = require("./sendEmail")
const CallReserve = require("../models/CallReserve")
const schedule = require('node-schedule');
const passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20').Strategy;

clientID = "XXXXX7762268-71s6k9joXXXXX2p0a55ba8li85jXXXXX.apps.googleusercontent.com"
clientSecret = "XXXXPX-iXaXXXXXjcoGsnqYQr0rDJeXXXXX"

require("dotenv").config({ path: ".variables.env" });
const moment = require("moment")

const getRefreshToken = async () => {
	return new Promise((resolve, reject) => {
		passport.use(new GoogleStrategy({
			clientID: '250596494632-ji2l83g3ukilh1808nenn3mtfne1634o.apps.googleusercontent.com',
			clientSecret: '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',
			callbackURL: `${process.env.HOME_URL}/auth/callback`
		},
			function (accessToken, refreshToken, profile, cb) {
				resolve(refreshToken);
				return cb();
			}
		));
	});
}

module.exports = (reserveTime, client_id, email, client_name) => {
	return new Promise(async (resolve, reject) => {
		try {
			Meeting({
				clientId: '24487777005-g8tjp8384je8tv6k50i5pmi9a15qo6nm.apps.googleusercontent.com',
				clientSecret: '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',
				refreshToken: '1//04qVKo6iueOYjCgYIARAAGAQSNwF-L9IrZQ2fW4LJjiE8gF4Oo1bgNhW3ruM0M6e8f8fcoM3VGzTaudW7eIMp4pTigSg5utCFyCA',
				date: moment(reserveTime).format('YYYY-MM-DD'),
				time: moment(reserveTime).format('HH:mm'),				
				location: 'Tunisia',
				description: 'description',
				organizer: "khaoulafattah4@gmail.com",
				inviter: email,
			}).then(async function (meetingUrl) {
				if (!meetingUrl) {
					resolve({ success: false, message: 'Creating Video Call Failed!', result: {} })
					return;
				}

				reserve = await new CallReserve({
					userId: client_id,
					url: meetingUrl,
					reserveTime
				}).save();
				const url = `${process.env.BASE_URL}meeting?client=${client_id}&url=${meetingUrl}`
				console.log('------meeting------>')
				console.log(url)
				sendEmail(email, "Video Call URL", `Hello ${client_name}\nYour meeting is on ${moment(reserveTime).format('YYYY-MM-DD HH:mm')}\n This is the google meet link \n${url}\nClick here when its time`)
				sendEmail('khaoulafattah4@gmail.com', "Video Call URL", `${client_name} reserved meeting is on ${moment(reserveTime).format('YYYY-MM-DD HH:mm')}\n This is the google meet link \n${url}\nClick here when its time`)
				let remindTime = new Date(`${moment(reserveTime).format('YYYY-MM-DD')} 08:00`).setHours(8);
				console.log('remind time', remindTime)
				schedule.scheduleJob(remindTime, function () {
					sendEmail(email, "Video Call URL", `Hello ${client_name}\nYour meeting is on ${moment(reserveTime).format('YYYY-MM-DD HH:mm')}\n This is the google meet link \n${url}\nClick here when its time`)
				});
				resolve({ success: true, message: "Reserve successfully!", result: {} })
			})
		} catch (err) {
			console.log(err);
			resolve({ success: false, message: 'Creating Video Call Failed!', result: {} })
		}
	})
};