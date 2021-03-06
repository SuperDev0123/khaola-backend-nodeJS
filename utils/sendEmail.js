const nodemailer = require("nodemailer");
require("dotenv").config({ path: ".variables.env" });

module.exports = async (email, subject, text) => {
	try {
		const transporter = nodemailer.createTransport({
			host: process.env.HOST,
			service: process.env.SERVICE,
			type: "SMTP",
			port: Number(process.env.EMAIL_PORT),
			secure: Boolean(process.env.SECURE),
			tls: {
				rejectUnauthorized: false
			},
			auth: {
				user: process.env.USER,
				pass: process.env.PASS,
			},
		});

		await transporter.sendMail({
			from: process.env.USER,
			to: email,
			subject: subject,
			text: text,
		});
		console.log("email sent successfully");
	} catch (error) {
		console.log("email not sent!");
		console.log(error);
		return error;
	}
};