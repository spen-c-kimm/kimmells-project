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

        await mysqlQuery(`INSERT INTO users(userName,fullName,password) VALUES('${params.userName}','${params.fullName}','${encryptedPassword}')`);
        const newUser = (await mysqlQuery(`SELECT * FROM users WHERE ID = LAST_INSERT_ID()`))[0];

        if (newUser) {
            return res.send({ success: true });
        } else {
            return res.send({
                success: false,
                message: "Could not create your profile. Please try again later."
            });
        };

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

        const user = (await mysqlQuery(`SELECT * FROM users WHERE userName = '${params.userName}'`))[0];

        if (!user) {
            return res.send({ success: false, message: "Username not registered." });
        }

        const isAuthenticated = await bcrypt.compare(
            params.password,
            user.password
        );

        if (isAuthenticated) {
            const token = jwt.sign({
                user
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
            message: "There was an error while validating your session. Please try again later."
        });
    }
};

const getFeed = async function (req, res) {
    try {
        const posts = await mysqlQuery(`
        SELECT P.text, P.dateCreated, U.fullName, U.userName, U.ID AS userID
        FROM posts AS P
        JOIN users AS U On U.ID = P.userID
        WHERE P.repliedToID = 0
        ORDER BY P.dateCreated DESC
        `);

        if (posts) {
            return res.send({ success: true, posts });
        } else {
            return res.send({ success: false, message: "No posts found." });
        }
    } catch (error) {
        return res.send({
            success: false,
            message: "There was an error while loading your feed. Please try again later."
        });
    }
};

const getUserPosts = async function (req, res) {
    try {
        const params = req.body;
        const userID = params?.userID;

        const posts = await mysqlQuery(`
        SELECT P.text, P.dateCreated, U.fullName, U.userName, P.userId,
        P2.text AS repliedToText, U2.fullName AS repliedToFullName, U2.userName AS repliedToUserName,
        U2.ID AS repliedToUserID
        FROM posts AS P
        JOIN users AS U ON U.ID = P.userID
        LEFT JOIN posts AS P2 ON P2.ID = P.repliedToID
        LEFT JOIN users AS U2 ON U2.ID = P2.userID
        WHERE P.userID = ${userID} 
        ORDER BY P.dateCreated DESC
        `);

        if (posts) {
            return res.send({ success: true, posts });
        } else {
            return res.send({ success: false, message: "No posts found." });
        }
    } catch (error) {
        return res.send({
            success: false,
            message: "There was an error while loading your feed. Please try again later."
        });
    }
};

const createPost = async function (req, res) {
    try {
        const params = req.body;
        const token = params.token;

        const decoded = jwt.verify(token, 'secret');
        const user = decoded?.user;

        if (!user) {
            return res.send({ success: false, message: "Could not create the post. Please try again later." });
        }

        await mysqlQuery(`INSERT INTO posts(userID,text,repliedToID) VALUES('${user.ID}','${params.text}','${params.repliedToID}')`);
        const newPost = (await mysqlQuery(`SELECT * FROM posts WHERE ID = LAST_INSERT_ID()`))[0];

        if (newPost) {
            return res.send({ success: true, newPost });
        } else {
            return res.send({ success: false, message: "Could not create the post. Please try again later." });
        }

    } catch (error) {
        return res.send({
            success: false,
            message: "There was an error while creating the post. Please try again later."
        });
    }
};

module.exports = {
    signup,
    login,
    validateSession,
    getFeed,
    getUserPosts,
    createPost
}