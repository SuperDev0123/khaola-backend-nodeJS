const express = require("express");
const request = require('request');
const router = express.Router();
const makeMeet = require("../utils/makeGoogleMeet")

const { catchErrors } = require("../handlers/errorHandlers");
const {
  isValidToken,
  // login,
  logout,
} = require("../controllers/authController");

const { login, registerProvider, registerClient, inMeeting, verifyClient, emailTest } = require("../controllers/authControllerDemo");

// use {login } from authController , uncomment line below

// router.route("/login").post(catchErrors(login));

// for development & production don't use this line router.route("/login").post(catchErrors(loginDemo)); (you should remove it) , this is just demo login contoller
router.route("/login").post(catchErrors(login));
router.route("/register").post(catchErrors(registerProvider));
router.route("/client/verify/:id/:token").get(catchErrors(verifyClient))
router.route("/meeting").post(catchErrors(inMeeting))
router.route("/logout").post(isValidToken, catchErrors(logout));
router.route("/test").post((req, res) => {
  const { url } = req.body;
  request(url, async (error, response, html) => {
    res.json({ error, response, html });
  })

});
router.route("/email").post(catchErrors(emailTest));
router.route("/googleMeet").post(catchErrors(()=>{
  makeMeet(new Date('2022-06-15'));
}));

module.exports = router;
