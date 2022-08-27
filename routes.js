const express = require("express");
const router = express.Router();

const controller = require("./controller");

router.post("/signup", controller.signup);
router.post("/login", controller.login);
router.post("/validateSession", controller.validateSession);
router.post("/createPost", controller.createPost);
router.post("/getFeed", controller.getFeed);

module.exports = router;