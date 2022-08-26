const express = require("express");
const router = express.Router();

const controller = require("./controller");

router.post("/signup", controller.signup);

module.exports = router;