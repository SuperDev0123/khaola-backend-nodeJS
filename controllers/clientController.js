const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt")
const crypto = require("crypto")
const methods = require("./crudController");
const moment = require("moment")
const passport = require('passport')

const providerModel = require("../models/Provider")
const clientModel = require("../models/Client")
const Token = require("../models/Token")
const CallReserve = require("../models/CallReserve")
module.exports = methods.crudController("Client");
const sendEmail = require("../utils/sendEmail")
const schedule = require('node-schedule');
const Meeting = require('google-meet-api').meet;
// const makeMeet = require("../utils/makeGoogleMeet")

module.exports.myList = async (req, res) => {
  try {
    //  Query the database for a list of all results
    const resultsPromise = clientModel.find({ provider: req.user.id })
      .sort({ created: "desc" })
    // Counting the total documents
    const countPromise = clientModel.count();
    // Resolving both promises
    const [result, count] = await Promise.all([resultsPromise, countPromise]);
    // Calculating total pages
    if (count > 0) {
      return res.status(200).json({
        success: true,
        result,
        message: "Successfully found all clients",
      });
    } else {
      return res.status(203).json({
        success: false,
        result: [],
        message: "Collection is Empty",
      });
    }
  } catch {
    return res
      .status(500)
      .json({ success: false, result: [], message: "Oops there is an Error" });
  }
}


module.exports.verifyList = async (req, res) => {
  try {
    //  Query the database for a list of all results
    const resultsPromise = clientModel.aggregate([{
      $lookup: {
        from: 'callreserves',
        localField: '_id',
        foreignField: 'userId',
        as: 'callReserve'
      }
    }]).sort({ created: "desc" })
    // Counting the total documents
    const countPromise = clientModel.count();
    // Resolving both promises
    const [result, count] = await Promise.all([resultsPromise, countPromise]);
    // Calculating total pages
    if (count > 0) {
      return res.status(200).json({
        success: true,
        result,
        message: "Successfully found all clients",
      });
    } else {
      return res.status(203).json({
        success: false,
        result: [],
        message: "Collection is Empty",
      });
    }
  } catch (err) {
    console.log(err)
    return res
      .status(500)
      .json({ success: false, result: [], message: "Oops there is an Error" });
  }
}


module.exports.registerClient = async (req, res) => {
  try {
    const user = await clientModel.findOne({ email: req.body.email })
    if (user) {
      return res.status(406).json({ success: false, message: "Email already exist" })
    }
    let client = new clientModel({ ...req.body, provider: req.user.id })
    await client.save(req.body, async (err, item) => {
      if (err) {
        res.status(406).json({ success: false, message: "Failed register" + err })
      } else {
        token = await new Token({ //await
          userId: client._id,
          token: crypto.randomBytes(32).toString("hex")
        }).save()
        const url = `${process.env.BASE_URL}verify/${client._id}/${token.token}`
        console.log('email_verify', url)
        sendEmail(client.email, "Verify Email", url)
        res.status(200).send({ success: true, message: "Email verification generate successfully", result: {} })
      }
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: "Error register in" })
  }
};

module.exports.reset_verify = async (req, res) => {
  try {
    const { client_id, isVerified } = req.body;
    const client = await clientModel.findOne({ _id: client_id })
    if (!client)
      return res.status(200).send({ success: false, message: "Invalid Client" })

    await clientModel.updateOne({ _id: client._id }, { isVerified })
    let token = await Token.findOne({ userId: client_id })
    if (token) {
      await token.remove();
      return res.status(200).send({ success: true, message: "Approve verification successfully", result: {} })
    }
    token = await new Token({ //await
      userId: client._id,
      token: crypto.randomBytes(32).toString("hex")
    }).save()
    const url = `${process.env.BASE_URL}verify/${client._id}/${token.token}`
    sendEmail(client.email, "Verify Email", url)
    res.status(200).send({ success: true, message: "Email verification generate successfully", result: {} })
  } catch (error) {
    console.log(error)
    res.status(500).send({ success: false, message: "Internal server error", error: error })
  }
};

exports.reset_status = async (req, res) => {
  try {
    const { client_id, status } = req.body;
    const client = await clientModel.findOne({ _id: client_id })
    if (!client)
      return res.status(200).send({ success: false, message: "Invalid Client" })

    await clientModel.updateOne({ _id: client._id }, { status })
    res.status(200).send({ success: true, message: "Change status successfully", result: {} })
  } catch (error) {
    console.log(error)
    res.status(500).send({ success: false, message: "Internal server error", error: error })
  }
};

module.exports.reserve_list = async (req, res) => {
  try {
    const date = req.query.page;
    const reserveList = await CallReserve.find({ reserveTime: { $regex: '.*' + date + '.*' } }).populate('userId')
    res.status(200).send({ success: true, message: "", result: { reserveList } })
  } catch (error) {
    console.log(error)
    res.status(500).send({ success: false, message: "Internal server error", error: error })
  }
};

module.exports.reserve_call = async (req, res) => {
  try {
    const { reserveTime } = req.body;
    const client_id = req.user.id
    const client = await clientModel.findOne({ _id: client_id })
    if (!client)
      return res.status(200).send({ success: false, message: "Invalid Client", result: {} })
    let reserve = await CallReserve.findOne({ $or: [{ _id: client_id }, { reserveTime: { $gt: moment(reserveTime).add(-15, 'minutes').format('YYYY-MM-DD HH:mm'), $lt: moment(reserveTime).add(15, 'minutes').format('YYYY-MM-DD HH:mm') } }] })
    if (reserve) {
      if (reserve.userId == client_id)
        return res.status(200).send({ success: false, message: "You already reserved Video Verification.", result: {} })
      else
        return res.status(200).send({ success: false, message: "The other person reserved in that time. Please select other day and time.", result: {} })
    }

    // let result = await makeMeet(reserveTime, client_id, client.email);
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
        res.status(200).send({ success: false, message: 'Creating Video Call Failed!', result: {} })
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
      res.status(200).send({ success: true, message: "Reserve successfully!", result: {} })
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({ success: false, message: "Internal server error", error: error })
  }
};

module.exports.is_verify = async (req, res) => {
  try {
    const client_id = req.user.id;
    const client = await clientModel.findOne({ _id: client_id })
    if (!client)
      return res.status(400).send({ success: false, message: "Invalid link" })
    const reserve = await CallReserve.findOne({ userId: client._id });
    if (reserve) {
      if (moment(reserve.reserveTime) > moment(new Date())) {
        return res.json({
          success: true,
          result: { verify: false, reserved: true, rejected: client.isRejected },
          message: "Email Verify Successfully.",
        });
      }
      await reserve.remove();
    }
    res.json({
      success: true,
      result: { verify: client.isVerified, reserved: false, rejected: client.isRejected },
      message: "",
    });
  } catch (error) {
    console.log(error)
    res.status(500).send({ success: false, message: "Internal server error", error: error })
  }
};

module.exports.verify_client = async (req, res) => {
  try {
    const client_id = req.user.id;
    const userInfo = req.body.userInfo;
    console.log(userInfo)
    const client = await clientModel.findOne({ _id: client_id })
    if (!client)
      return res.status(400).send({ success: false, message: "Invalid link" })
    const token = await Token.findOne({
      userId: client._id,
    })
    const reserve = await CallReserve.findOne({ userId: client._id });
    if (reserve) {
      await reserve.remove();
    }
    if (token) {
      await token.remove()
    }
    await clientModel.updateOne({ _id: client._id }, { isVerified: true })
    res.json({
      success: true,
      result: {},
      message: "Verified successfully",
    });
  } catch (error) {
    console.log(error)
    res.status(500).send({ success: false, message: "Internal server error", error: error })
  }
};


module.exports.reject_client = async (req, res) => {
  try {
    const client_id = req.user.id;
    const client = await clientModel.findOne({ _id: client_id })
    if (!client)
      return res.status(400).send({ success: false, message: "Invalid link" })
    const token = await Token.findOne({
      userId: client._id,
    });
    if (token) {
      await token.remove()
    }
    await clientModel.updateOne({ _id: client._id }, { isRejected: true })
    res.json({
      success: true,
      result: {},
      message: "You are rejected",
    });
  } catch (error) {
    console.log(error)
    res.status(500).send({ success: false, message: "Internal server error", error: error })
  }
};
