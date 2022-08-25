const express = require("express");
const path = require("path");

import router from "./routes";

const app = express();

app.use(express.static(path.join(__dirname, "build")));

app.use("/api/v1/route", router);

app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "build", "index.html"))
});

app.listen(3000);