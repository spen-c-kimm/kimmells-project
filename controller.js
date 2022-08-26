const mysqlQuery = require("./utilities").mysqlQuery;

const test = async function () {
    console.log("TEST")
};

const signup = async function (req, res) {
    try {
        const params = req.body;

        const existingUser = await mysqlQuery(`SELECT * FROM users WHERE userName = '${params.userName}'`);

        if (existingUser?.length > 0) {
            return res.send({
                success: false,
                message: "Username is already in use."
            });
        }

        const newUser = await mysqlQuery(`INSERT INTO users(userName,fullName,password) VALUES('${params.userName}','${params.fullName}','${params.password}')`);

        if (newUser) { return res.send({ success: true }) };

        return res.send({
            success: false,
            message: "Could not create your profile. Please try again later."
        });
    } catch (error) {
        return res.send({
            success: false,
            message: "There was an error while creating your profile. Please try again later."
        });
    }
};

module.exports = {
    test,
    signup
}