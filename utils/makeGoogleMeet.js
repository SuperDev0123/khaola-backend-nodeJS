const Meeting = require('google-meet-api').meet;
const sendEmail = require("./sendEmail")
const CallReserve = require("../models/CallReserve")

require("dotenv").config({ path: ".variables.env" });
const moment = require("moment")

module.exports = (reserveTime) => {
	return new Promise((resolve, reject) => {
		try {
			Meeting({
				clientId: '250596494632-ji2l83g3ukilh1808nenn3mtfne1634o.apps.googleusercontent.com',
				clientSecret: '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',
				refreshToken: '1//04w_-jKqoz_IXCgYIARAAGAQSNwF-L9Iru_VtGmy3HgOMoATWlIrdOQm8CJm1YpWh1DNsh-fvNeERDZ2_fxBz6Dk1Kx5Y7zg1F2g',
				date: moment(reserveTime).format('YYYY-MM-DD'),
				time: moment(reserveTime).format('HH:mm'),
				summary: 'summary',
				location: 'Tunisia',
				description: 'description'
			}).then(function (result) {
				reserve = new CallReserve({
					userId: client_id,
					reserveTime
				}).save();
				const url = `${process.env.BASE_URL}meeting?url=${result}&client=${client_id}`
				sendEmail(client.email, "Video Call URL", url)
				sendEmail('khaoulafattah4@gmail.com', "Video Call URL", url)
				resolve({ success: true, message: "Reserve successfully!", result: {} })
			})
		} catch (err) {
			console.log(err);
			resolve({ success: false, message: 'Creating Video Call Failed!', result: {} })
		}
	})
};