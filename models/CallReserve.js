const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const callreserveSchema = new Schema({
	userId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: "Client",
		unique: true,
	},
	reserveTime: { type: String, required: true },
	status: { type: Boolean, default: false },
	url: { type: String },
	createdAt: { type: Date, default: Date.now, expires: 3600 },//1hour
});

module.exports = mongoose.model("Callreserve", callreserveSchema);