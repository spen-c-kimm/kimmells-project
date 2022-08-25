const express = require("express");
const router = express.Router();

const controller = require("./controller");

router.post("/signup", controller.signup);

router
  .route("/")
  .get(controller.test)
  .post(controller.test);

module.exports = router;