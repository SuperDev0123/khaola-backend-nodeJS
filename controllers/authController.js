const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const mongoose = require("mongoose");

const Admin = mongoose.model("Admin");
const Client = mongoose.model("Client");
const Provider = mongoose.model("Provider");

require("dotenv").config({ path: ".variables.env" });

exports.register = async (req, res) => {
  try {
    let { email, password, passwordCheck, name, surname } = req.body;

    if (!email || !password || !passwordCheck)
      return res.status(400).json({ msg: "Not all fields have been entered." });
    if (password.length < 5)
      return res
        .status(400)
        .json({ msg: "The password needs to be at least 5 characters long." });
    if (password !== passwordCheck)
      return res
        .status(400)
        .json({ msg: "Enter the same password twice for verification." });

    const existingAdmin = await Admin.findOne({ email: email });
    if (existingAdmin)
      return res
        .status(400)
        .json({ msg: "An account with this email already exists." });

    if (!name) name = email;

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    const newAdmin = new Admin({
      email,
      password: passwordHash,
      name,
      surname,
    });
    const savedAdmin = await newAdmin.save();
    res.status(200).send({
      success: true,
      admin: {
        id: savedAdmin._id,
        name: savedAdmin.name,
        surname: savedAdmin.surname,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      result: null,
      message: err.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // validate
    if (!email || !password)
      return res.status(400).json({ msg: "Not all fields have been entered." });

    const admin = await Admin.findOne({ email: email });
    // console.log(admin);
    if (!admin)
      return res.status(400).json({
        success: false,
        result: null,
        message: "No account with this email has been registered.",
      });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch)
      return res.status(400).json({
        success: false,
        result: null,
        message: "Invalid credentials.",
      });

    const token = jwt.sign(
      {
        expiresIn: '12h',
        id: admin._id,
      },
      process.env.JWT_SECRET
    );

    const result = await Admin.findOneAndUpdate(
      { _id: admin._id },
      { isLoggedIn: true },
      {
        new: true,
      }
    ).exec();

    res.json({
      success: true,
      result: {
        token,
        admin: {
          id: result._id,
          name: result.name,
          isLoggedIn: result.isLoggedIn,
        },
      },
      message: "Successfully login admin",
    });
  } catch (err) {
    // res.status(500).json({ success: false, result:null, message: err.message });
    res
      .status(500)
      .json({ success: false, result: null, message: err.message });
  }
};

exports.isValidToken = async (req, res, next) => {
  try {
    const token = req.header("x-auth-token");
    if (!token)
      return res.status(401).json({
        success: false,
        result: null,
        message: "No authentication token, authorization denied.",
        jwtExpired: true,
      });

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (!verified)
      return res.status(401).json({
        success: false,
        result: null,
        message: "Token verification failed, authorization denied.",
        jwtExpired: true,
      });
    else {
      req.user = verified;
      next();
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      result: null,
      message: err.message,
      jwtExpired: true,
    });
  }
};

exports.isValidClient = (req, res, next) => {
  this.isValidToken(req, res, async () => {
    if (req.user.id && req.user.role == 'client') {
      const client = await Client.findOne({ _id: req.user.id });
      if (!client)
        return res.status(401).json({
          success: false,
          result: null,
          message: "User doens't Exist, authorization denied.",
          jwtExpired: true,
        });
      next()
    } else {
      return res.status(403).json("ur not allowed to do that ")
    }
  })
}

exports.isValidAdmin = (req, res, next) => {
  this.isValidToken(req, res, async () => {
    if (req.user.id && req.user.role == 'admin') {
      const admin = await Admin.findOne({ _id: req.user.id });
      if (!admin)
        return res.status(401).json({
          success: false,
          result: null,
          message: "Admin doens't Exist, authorization denied.",
          jwtExpired: true,
        });
      next()
    } else {
      return res.status(403).json("ur not allowed to do that ")
    }
  })
}

exports.isValidProvider = (req, res, next) => {
  this.isValidToken(req, res, async () => {
    if (req.user.id && req.user.role == 'provider') {
      const provider = await Provider.findOne({ _id: req.user.id });
      if (!provider)
        return res.status(401).json({
          success: false,
          result: null,
          message: "User doens't Exist, authorization denied.",
          jwtExpired: true,
        });
      next()
    } else {
      return res.status(403).json("ur not allowed to do that ")
    }
  })
}

exports.isValidClient = (req, res, next) => {
  this.isValidToken(req, res, async () => {
    if (req.user.id && req.user.role == 'client') {
      const client = await Client.findOne({ _id: req.user.id });
      if (!client)
        return res.status(401).json({
          success: false,
          result: null,
          message: "User doens't Exist, authorization denied.",
          jwtExpired: true,
        });
      next()
    } else {
      return res.status(403).json("ur not allowed to do that ")
    }
  })
}

exports.logout = async (req, res) => {
  const result = await Admin.findOneAndUpdate(
    { _id: req.admin._id },
    { isLoggedIn: false },
    {
      new: true,
    }
  ).exec();

  res.status(200).json({ isLoggedIn: result.isLoggedIn });
};
