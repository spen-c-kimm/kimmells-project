const express = require("express");
const router = express.Router();

const controller = require("./controller");

// POST
router.post("/signup", controller.signup);
router.post("/login", controller.login);
router.post("/validateSession", controller.validateSession);
router.post("/createPost", controller.createPost);
router.post("/likePost", controller.likePost);
router.post("/followUser", controller.followUser);
router.post("/deletePost", controller.deletePost);
router.post("/deleteProfile", controller.deleteProfile);
router.post("/getFeed", controller.getFeed);
router.post("/getUserPosts", controller.getUserPosts);
router.post("/getUserLikes", controller.getUserLikes);
router.post("/getReplies", controller.getReplies);
router.post("/getFollowers", controller.getFollowers);
router.post("/getFollowing", controller.getFollowing);
router.post("/getPosts", controller.getPosts);
router.post("/getUsers", controller.getUsers);
router.post("/testPost", controller.testPost);

// GET
router.get("/testGet", controller.testGet);

// PUT
router.put("/updateBio", controller.updateBio);
router.put("/testPut", controller.testPut);

// DELETE
router.delete("/testDelete", controller.testDelete)

module.exports = router;