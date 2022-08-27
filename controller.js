const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const mysqlQuery = require("./utilities").mysqlQuery;

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

        const encryptedPassword = await bcrypt.hash(params.password, 12);

        const newUser = await mysqlQuery(`INSERT INTO users(userName,fullName,password) VALUES('${params.userName}','${params.fullName}','${encryptedPassword}')`);

        if (newUser) {
            const token = jwt.sign({
                data: 'foobar'
            }, 'secret', { expiresIn: '1h' });
            return res.send({ success: true, token });
        };

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

const login = async function (req, res) {
    try {
        const params = req.body;

        const user = await mysqlQuery(`SELECT * FROM users WHERE userName = '${params.userName}'`);

        if (!user) {
            return res.send({ success: false, message: "Username not registered." });
        }

        const isAuthenticated = await bcrypt.compare(
            params.password,
            user.password
        );

        if (isAuthenticated) {
            const token = jwt.sign({
                data: 'foobar'
            }, 'secret', { expiresIn: '1h' });
            return res.send({ success: true, token });
        }

        return res.send({ success: false, message: "Username or password is incorrect." });

    } catch (error) {
        return res.send({
            success: false,
            message: "There was an error while logging into your profile. Please try again later."
        });
    }
};

const validateSession = async function (req, res) {
    try {
        const params = req.body;
        const token = params?.token;

        const decoded = jwt.verify(token, 'secret');

        if (decoded) {
            return res.send({ success: true });
        } else {
            return res.send({ success: false });
        }

    } catch (error) {
        return res.send({
            success: false,
            message: "There was an error while logging into your profile. Please try again later."
        });
    }
};

module.exports = {
    signup,
    login,
    validateSession
}