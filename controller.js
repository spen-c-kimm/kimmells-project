const db = require("./database");

const test = async function() {
    console.log("TEST")
};

const signup = async function(req, res) {
    const user = await db.query("INSERT INTO users(fullName,userName,password) VALUES('Spencer Kimmell','skimmell','Password1!')")
    console.log("user: ", user)
    return res.send({ message: "Success!"});
};

module.exports = {
    test,
    signup
}