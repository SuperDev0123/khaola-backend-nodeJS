const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const providerSchema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    default: true,
  },
  company: {
    type: String,
    trim: true,
    required: true,
  },
  name: {
    type: String,
    trim: true,
    required: true,
  },  
  customField: [
    {
      fieldName: {
        type: String,
        trim: true,
      },
      fieldValue: {
        type: String,
        trim: true,
      },
    },
  ],  
  phone: {
    type: String,
    trim: true,
    required: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    trim: true,
    required: true,
  },  
  created: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Provider", providerSchema);
