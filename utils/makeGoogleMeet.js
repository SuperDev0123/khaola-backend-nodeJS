const Meeting = require('google-meet-api').meet;
const sendEmail = require("./sendEmail")
const CallReserve = require("../models/CallReserve")

require("dotenv").config({ path: ".variables.env" });
const moment = require("moment")

module.exports = (reserveTime, client_id, email) => {
	return new Promise((resolve, reject) => {
		try {
			Meeting({
				clientId: '250596494632-ji2l83g3ukilh1808nenn3mtfne1634o.apps.googleusercontent.com',
				clientSecret: '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',
				refreshToken: '1//04_QsDp4-tREoCgYIARAAGAQSNwF-L9Ir-4TEd1ceLCeCQwqmI52igv2uEMnazUYpK9o0GgeIjurjri0HYuP8iFLW8IkrKGojsvA',
				date: moment(reserveTime).format('YYYY-MM-DD'),
				time: moment(reserveTime).format('HH:mm'),
				summary: 'summary',
				location: 'Tunisia',
				description: 'description'
			}).then(async function (meetingUrl) {
				if(!meetingUrl){
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
				sendEmail(email, "Video Call URL", url)
				sendEmail('khaoulafattah4@gmail.com', "Video Call URL", url)
				resolve({ success: true, message: "Reserve successfully!", result: {} })
			})
		} catch (err) {
			console.log(err);
			resolve({ success: false, message: 'Creating Video Call Failed!', result: {} })
		}
	})
};