const express = require("express");
const router = express.Router();

import controller from "./controller";

router
  .route("/")
  .get(controller.test)
  .post(controller.test);

module.exports = router;