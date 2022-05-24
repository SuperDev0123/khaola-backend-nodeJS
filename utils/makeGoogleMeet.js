const Meeting = require('google-meet-api').meet;
const sendEmail = require("./sendEmail")
const CallReserve = require("../models/CallReserve")
const schedule = require('node-schedule');


require("dotenv").config({ path: ".variables.env" });
const moment = require("moment")

module.exports = (reserveTime, client_id, email) => {
	return new Promise((resolve, reject) => {
		try {
			Meeting({
				clientId: '250596494632-ji2l83g3ukilh1808nenn3mtfne1634o.apps.googleusercontent.com',
				clientSecret: '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',
				refreshToken: '1//04xLHlHzz0aR1CgYIARAAGAQSNwF-L9IrfnQbRlLuN9E6VtK_ObOhFTmjUQPmhgyGBr5UBTM1n25PdA8m3MDPJsJuA2xq7KDC28Q',
				date: moment(reserveTime).format('YYYY-MM-DD'),
				time: moment(reserveTime).format('HH:mm'),
				summary: 'summary',
				location: 'Tunisia',
				description: 'description'
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
				sendEmail(email, "Video Call URL", url)
				sendEmail('khaoulafattah4@gmail.com', "Video Call URL", url)
				let remindTime = new Date(`${moment(reserveTime).format('YYYY-MM-DD')} 08:00`).setHours(8);
				console.log('remind time', remindTime)
				schedule.scheduleJob(remindTime, function () {
					sendEmail(email, "Video Call URL", url)
				});
				resolve({ success: true, message: "Reserve successfully!", result: {} })
			})
		} catch (err) {
			console.log(err);
			resolve({ success: false, message: 'Creating Video Call Failed!', result: {} })
		}
	})
};