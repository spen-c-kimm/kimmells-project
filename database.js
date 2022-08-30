const mysql = require("mysql");
require("dotenv").config();

const connection = mysql.createConnection({
    host: "localhost",
    database: "kimmells",
    user: "kimmells",
    password: "aZ8bpDLY86klFppPV"
});

connection.connect(function(error) {
    if (error) {
        throw error;
    } else {
        console.log("Database connected successfully!")
    }
});

module.exports = connection;