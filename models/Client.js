const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
const Schema = mongoose.Schema;

const clientSchema = new Schema({
  firstName: {
    type: String,
    trim: true,
    required: true,
  },  
  lastName: {
    type: String,
    trim: true,
    required: true,
  },  
  birthDate: {
    type: String,
    trim: true,
  },  
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  address: {
    type: String,
    trim: true,
    // required: true
  },
  nationality: {
    type: String,
    trim: true,
    // required: true
  },
  status: {
    type: Boolean,
    default: true
  },
  photo: {
    type: String,
  },
  driverLicense: {
    type: String  
  },
  passeport: {
    type: String
  },
  identityCard: {
    type: String
  },
  role: {
    type: String,
    default: 'subscriber'
  },
  appointmentList: [{
    type: mongoose.Schema.Types.ObjectId,
    ref:"appointment"
  }],
  created: {
    type: Date,
    default: Date.now,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },  
  provider: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: "Provider",
	},
});

module.exports = mongoose.model("Client", clientSchema);
