const express = require("express");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");

const router = require("./routes");

const app = express();

app.use(express.json());;
// app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.use(cors())

app.use(express.static(path.join(__dirname, "build")));

app.use("/api/v1", router);

// app.get("/", function(req, res) {
//     res.sendFile(path.join(__dirname, "build", "index.html"))
// });

app.listen(3000);