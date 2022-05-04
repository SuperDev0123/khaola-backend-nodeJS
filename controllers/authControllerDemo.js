const jwt = require("jsonwebtoken");
const providerModel = require("../models/Provider")
const clientModel = require("../models/Client")
const adminModel = require("../models/Admin")
const sendEmail = require("../utils/sendEmail")
const Token = require("../models/Token")
const CallReserve = require("../models/CallReserve")
const bcrypt = require("bcrypt")
const crypto = require("crypto")
const moment = require("moment")

require("dotenv").config({ path: ".variables.env" });

// for development & production don't use this file (you should remove it) , this is just demo login contoller
// use authController

exports.login = async (req, res) => {
  const { email, password } = req.body;
  let role = 'client';
  // validate
  if (!email || !password)
    return res.status(400).json({ success: false, msg: "Not all fields have been entered." });
  try {
    const user = await providerModel.findOne({ email: req.body.email })
    role = 'provider';
    if (!user) {
      const admin = await adminModel.findOne({ email: req.body.email })
      if (!admin) {
        return res.status(406).json({ success: false, message: "Email not found" })
      }
      role = 'admin';
    }
    if (bcrypt.compareSync(req.body.password, user.password)) {
      console.log({
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
        id: user._id,
        role,
      })
      const token = jwt.sign(
        {
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
          id: user._id,
          role,
        },
        process.env.JWT_SECRET
      );

      res.json({
        success: true,
        result: {
          token,
          admin: {
            id: user._id,
            name: user.name,
            isLoggedIn: true,
            role,
          },
        },
        message: "Successfully login " + role,
      });
    } else {
      res.status(406).json({ success: false, message: "Incorrect password" })
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Error logging in" })
  }
};


exports.registerProvider = async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10)
    const HashPassword = await bcrypt.hashSync(req.body.password, salt)
    const user = await providerModel.findOne({ email: req.body.email })
    if (user) {
      return res.status(406).json({ success: false, message: "Email already exist" })
    }
    let provider = new providerModel({ ...req.body, password: HashPassword })
    await provider.save(req.body, async (err, item) => {
      if (err) {
        res.status(406).json({ success: false, message: "Failed register" + err })
      } else {
        res.json({
          success: true,
          result: {
            item,
          },
          message: " Register success.",
        });
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: "Error register in" })
  }
};

exports.registerClient = async (req, res) => {
  try {
    const user = await clientModel.findOne({ email: req.body.email })
    if (user) {
      return res.status(406).json({ success: false, message: "Email already exist" })
    }
    let client = new clientModel(req.body)
    await client.save(req.body, async (err, item) => {
      if (err) {
        res.status(406).json({ success: false, message: "Failed register" + err })
      } else {
        token = await new Token({ //await
          userId: client._id,
          token: crypto.randomBytes(32).toString("hex")
        }).save()
        const url = `${process.env.BASE_URL}verify/${client._id}/${token.token}`
        console.log(url)
        sendEmail(client.email, "Verify Email", url)
        res.status(200).send({ success: true, message: "Email verification generate successfully", result: {} })
      }
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: "Error register in" })
  }
};

exports.verifyProvider = async (req, res) => {
  try {
    const provider = await providerModel.findOne({ _id: req.params.id })
    if (!provider)
      return res.status(400).send({ success: false, message: "Invalid link" })

    const token = await Token.findOne({
      userId: provider._id,
      token: req.params.token
    })
    if (!token)
      return res.status(400).send({ success: false, message: "Invalid link" })

    await providerModel.updateOne({ _id: provider._id }, { isVerified: true })
    await token.remove()

    res.status(200).send({ success: true, message: "Email verified successfully" })
  } catch (error) {
    console.log(error)
    res.status(500).send({ success: false, message: "Internal server error", error: error })
  }
};

exports.verifyClient = async (req, res) => {
  try {
    const client = await clientModel.findOne({ _id: req.params.id })
    if (!client)
      return res.status(400).send({ success: false, message: "Invalid link" })
    if (!client.isVerified) {
      const tokenExist = await Token.findOne({
        userId: client._id,
        token: req.params.token
      })
      const reserve = await CallReserve.findOne({ userId: client._id });
      if (reserve) {
        if (moment(reserve.reserveTime) > moment(new Date())) {
          return res.status(400).send({ success: false, message: "You are already reserve video verification. Please wait." })
        }
        await reserve.remove();
      }
      // if (!tokenExist)
      //   return res.status(400).send({ success: false, message: "Invalid link" })
      // await tokenExist.remove()
      const role = 'client';
      const token = jwt.sign(
        {
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
          id: client._id,
          role,
        },
        process.env.JWT_SECRET
      );

      res.json({
        success: true,
        result: {
          token,
          admin: {
            id: client._id,
            name: `${client.firstName} ${client.lastName}`,
            isLoggedIn: true,
            role,
          },
        },
        message: "Email verified successfully",
      });
    }
    else {
      return res.status(400).send({ success: false, message: "You are already verified." })
    }
  } catch (error) {
    console.log(error)
    res.status(500).send({ success: false, message: "Internal server error", error: error })
  }
};

exports.reset_verify = async (req, res) => {
  try {
    const { client_id } = req.body;
    console.log(client_id)
    const client = await clientModel.findOne({ _id: client_id })
    console.log(client)
    if (!client)
      return res.status(200).send({ success: false, message: "Invalid Client" })

    await clientModel.updateOne({ _id: client._id }, { isVerified: false })
    let token = await Token.findOne({ userId: client_id })
    if (token) {
      return res.status(200).send({ success: false, message: "User is Awaiting Verification" })
    }
    token = await new Token({ //await
      userId: client._id,
      token: crypto.randomBytes(32).toString("hex")
    }).save()
    const url = `${process.env.BASE_URL}verify/${client._id}/${token.token}`
    console.log(url)
    sendEmail(client.email, "Verify Email", url)
    res.status(200).send({ success: true, message: "Email verification generate successfully", result: {} })
  } catch (error) {
    console.log(error)
    res.status(500).send({ success: false, message: "Internal server error", error: error })
  }
};

exports.reset_status = async (req, res) => {
  try {
    console.log(req)
    const { client_id, status } = req.body;
    console.log(client_id)
    const client = await clientModel.findOne({ _id: client_id })
    console.log(client)
    if (!client)
      return res.status(200).send({ success: false, message: "Invalid Client" })

    await clientModel.updateOne({ _id: client._id }, { status })
    res.status(200).send({ success: true, message: "Change status successfully", result: {} })
  } catch (error) {
    console.log(error)
    res.status(500).send({ success: false, message: "Internal server error", error: error })
  }
};

exports.reserve_list = async (req, res) => {
  try {
    const date = req.query.page;
    const reserveList = await CallReserve.find({ reserveTime: { $regex: '.*' + date + '.*' } }).populate('userId')
    res.status(200).send({ success: true, message: "", result: { reserveList } })
  } catch (error) {
    console.log(error)
    res.status(500).send({ success: false, message: "Internal server error", error: error })
  }
};

exports.reserve_call = async (req, res) => {
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
    reserve = new CallReserve({
      userId: client_id,
      reserveTime
    }).save();
    res.status(200).send({ success: true, message: "Reserve successfully!", result: {} })
  } catch (error) {
    console.log(error)
    res.status(500).send({ success: false, message: "Internal server error", error: error })
  }
};

exports.verify_client = async (req, res) => {
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
    await clientModel.updateOne({ _id: client._id }, { isVerified: true, firstName: "test", lastName: "test", birthDate: '1922-02-12' })
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

exports.is_verify = async (req, res) => {
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
          result: { verify: false, reserved: true },
          message: "Email Verify Successfully.",
        });
      }
      await reserve.remove();
    }
    res.json({
      success: true,
      result: { verify: client.isVerified, reserved: false },
      message: "",
    });
  } catch (error) {
    console.log(error)
    res.status(500).send({ success: false, message: "Internal server error", error: error })
  }
};
