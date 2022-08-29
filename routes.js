const express = require("express");
const router = express.Router();

const controller = require("./controller");

router.post("/signup", controller.signup);
router.post("/login", controller.login);
router.post("/validateSession", controller.validateSession);
router.post("/createPost", controller.createPost);
router.post("/getFeed", controller.getFeed);
router.post("/getUserPosts", controller.getUserPosts);
router.post("/likePost", controller.likePost);
router.post("/getUserLikes", controller.getUserLikes);
router.post("/getReplies", controller.getReplies);
router.post("/followUser", controller.followUser);
router.post("/updateBio", controller.updateBio);
router.post("/getFollowers", controller.getFollowers);
router.post("/getFollowing", controller.getFollowing);

module.exports = router;