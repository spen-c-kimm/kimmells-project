const mysql = require("mysql");
require("dotenv").config();

const connection = mysql.createConnection({
    host: process.env.HOST,
    database: process.env.DATABASE,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD
});

connection.connect(function(error) {
    if (error) {
        throw error;
    } else {
        console.log("Database connected successfully!")
    }
});

module.exports = connection;