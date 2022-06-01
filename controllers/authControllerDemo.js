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
    let user = await providerModel.findOne({ email: req.body.email })
    role = 'provider';
    if (!user) {
      user = await adminModel.findOne({ email: req.body.email })
      if (!user) {
        return res.status(406).json({ success: false, message: "Email not found" })
      }
      role = 'admin';
    }
    if (bcrypt.compareSync(req.body.password, user.password)) {
      const token = jwt.sign(
        {
          expiresIn: '12h',
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
          expiresIn: '12h',
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

exports.inMeeting = async (req, res) => {
  try {
    await CallReserve.updateOne({ userId: req.body.client_id }, { status: true })
    res.json({
      success: true,
      result: {},
      message: "Redirect to Google meet url",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error register in" })
  }
};

exports.emailTest = async (req, res) => {
  try {
    sendEmail(req.body.email, "Verify Email", `It's only test`)
  } catch (error) {
    res.status(500).json({ success: false, message: "Error register in" })
  }
};