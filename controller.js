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
            return res.send({ success: true, token, userID: user.ID });
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
        const params = req.body;
        const userID = params?.userID;

        const posts = await mysqlQuery(`
        SELECT P.text, P.dateCreated, U.fullName, 
        U.userName, P.userID, P.ID AS postID,
        CASE WHEN L.deleted = 0 THEN 1 ELSE 0 END AS liked 
        FROM posts AS P
        JOIN users AS U On U.ID = P.userID
        LEFT JOIN likes AS L ON L.userID = ${userID} AND L.postID = P.ID
        WHERE P.repliedToID = 0
        ORDER BY P.dateCreated DESC
        `);

        const users = await mysqlQuery(`SELECT * FROM users`);

        if (posts) {
            return res.send({ success: true, posts, users });
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

const getUsers = async function (req, res) {
    try {
        const params = req.body;
        const userID = params?.userID;

        const users = await mysqlQuery(`
        SELECT U.* , CASE WHEN F.deleted = 0 THEN 1 ELSE 0 END AS following
        FROM users AS U
        LEFT JOIN followers AS F ON F.followerID = ${userID} AND F.followingID = U.ID
        `);

        if (users) {
            return res.send({ success: true, users });
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

const getPosts = async function (req, res) {
    try {
        const params = req.body;
        const userID = params?.userID;

        const posts = await mysqlQuery(`
        SELECT P.text, P.dateCreated, U.fullName, 
        U.userName, P.userID, P.ID AS postID, P2.text AS repliedToText, U2.fullName AS repliedToFullName, 
        U2.userName AS repliedToUserName, P2.ID AS repliedToPostID, U2.ID AS repliedToUserID,
        CASE WHEN L.deleted = 0 THEN 1 ELSE 0 END AS liked 
        FROM posts AS P
        JOIN users AS U On U.ID = P.userID
        LEFT JOIN posts AS P2 ON P2.ID = P.repliedToID
        LEFT JOIN users AS U2 ON U2.ID = P2.userID
        LEFT JOIN likes AS L ON L.userID = ${userID} AND L.postID = P.ID
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
        const followerID = params?.followerID;

        const user = (await mysqlQuery(`
        SELECT U.*, CASE WHEN F.deleted = 0 THEN 1 ELSE 0 END AS following
        FROM users AS U
        LEFT JOIN followers AS F ON F.followerID = ${followerID} AND F.followingID = ${userID}
        WHERE U.ID =${userID}
        `))[0];

        const followersCount = (await mysqlQuery(`SELECT COUNT(ID) AS followersCount FROM followers WHERE followingID = ${userID} AND deleted = 0`))[0]?.followersCount;
        const followingCount = (await mysqlQuery(`SELECT COUNT(ID) AS followingCount FROM followers WHERE followerID = ${userID} AND deleted = 0`))[0]?.followingCount;

        const posts = await mysqlQuery(`
        SELECT P.text, P.dateCreated, U.fullName, U.userName, P.userId, P.ID AS postID,
        P2.text AS repliedToText, U2.fullName AS repliedToFullName, 
        U2.userName AS repliedToUserName, P2.ID AS repliedToPostID,
        U2.ID AS repliedToUserID, CASE WHEN L.deleted = 0 THEN 1 ELSE 0 END AS liked 
        FROM posts AS P
        JOIN users AS U ON U.ID = P.userID
        LEFT JOIN posts AS P2 ON P2.ID = P.repliedToID
        LEFT JOIN users AS U2 ON U2.ID = P2.userID
        LEFT JOIN likes AS L ON L.userID = ${userID} AND L.postID = P.ID
        WHERE P.userID = ${userID} 
        ORDER BY P.dateCreated DESC
        `);

        if (posts && user) {
            return res.send({ success: true, posts, user, followersCount, followingCount });
        } else {
            return res.send({ success: false, message: "No posts found." });
        }
    } catch (error) {
        return res.send({
            success: false,
            message: "There was an error while loading the posts. Please try again later."
        });
    }
};

const getUserLikes = async function (req, res) {
    try {

        const params = req.body;
        const userID = params?.userID;

        const likes = await mysqlQuery(`
        SELECT P.text, P.dateCreated, U.fullName, U.userName, P.userId, P.ID AS postID,
        P2.text AS repliedToText, U2.fullName AS repliedToFullName, 
        U2.userName AS repliedToUserName, P2.ID AS repliedToPostID,
        U2.ID AS repliedToUserID
        FROM likes AS L 
        JOIN posts AS P ON P.ID = L.postID
        JOIN users AS U ON U.ID = P.userID
        LEFT JOIN posts AS P2 ON P2.ID = P.repliedToID
        LEFT JOIN users AS U2 ON U2.ID = P2.userID
        WHERE L.userID = ${userID} AND L.deleted = 0
        ORDER BY P.dateCreated DESC
        `);

        if (likes) {
            return res.send({ success: true, likes });
        } else {
            return res.send({ success: false, message: "No posts found." });
        }

    } catch (error) {
        return res.send({
            success: false,
            message: "There was an error while loading the posts. Please try again later."
        });
    }
};

const getFollowers = async function (req, res) {
    try {

        const params = req.body;
        const userID = params?.userID;
        const currentUser = params?.currentUser;

        const followers = await mysqlQuery(`
        SELECT U.*, CASE WHEN F2.deleted = 0 THEN 1 ELSE 0 END AS following
        FROM followers AS F
        JOIN users AS U ON U.ID = F.followerID
        LEFT JOIN followers AS F2 ON F2.followerID = ${currentUser} AND F2.followingID = U.ID
        WHERE F.followingID = ${userID} AND F.deleted = 0
        `);

        // LEFT JOIN followers AS F ON F.followerID = ${followerID} AND F.followingID = ${userID}

        if (followers) {
            return res.send({ success: true, followers });
        } else {
            return res.send({ success: false, message: "No followers found." });
        }

    } catch (error) {
        return res.send({
            success: false,
            message: "There was an error while loading the posts. Please try again later."
        });
    }
};

const getFollowing = async function (req, res) {
    try {

        const params = req.body;
        const userID = params?.userID;
        const currentUser = params?.currentUser;

        const following = await mysqlQuery(`
        SELECT U.*, CASE WHEN F2.deleted = 0 THEN 1 ELSE 0 END AS following
        FROM followers AS F
        JOIN users AS U ON U.ID = F.followingID
        LEFT JOIN followers AS F2 ON F2.followerID = ${currentUser} AND F2.followingID = U.ID
        WHERE F.followerID = ${userID} AND F.deleted = 0
        `);

        if (following) {
            return res.send({ success: true, following });
        } else {
            return res.send({ success: false, message: "No users found." });
        }

    } catch (error) {
        return res.send({
            success: false,
            message: "There was an error while loading the posts. Please try again later."
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

const likePost = async function (req, res) {
    try {
        const params = req.body;

        const like = (await mysqlQuery(`SELECT * FROM likes WHERE userID = ${params.userID} AND postID = ${params.postID}`))[0];

        if (like) {
            const deleted = like.deleted;
            await mysqlQuery(`Update likes SET deleted = ${!deleted} WHERE userID = ${params.userID} AND postID = ${params.postID}`);
        } else {
            await mysqlQuery(`INSERT INTO likes(userID,postID) VALUES('${params.userID}','${params.postID}')`);
        }

    } catch (error) {
        return res.send({
            success: false,
            message: "There was an error while creating the post. Please try again later."
        });
    }
};

const followUser = async function (req, res) {
    try {
        const params = req.body;
        const followerID = params.followerID
        const followingID = params.followingID

        const follow = (await mysqlQuery(`SELECT * FROM followers WHERE followerID = ${followerID} AND followingID = ${followingID}`))[0];

        if (follow) {
            const deleted = follow.deleted === 0 ? 1 : 0;
            await mysqlQuery(`Update followers SET deleted = ${deleted} WHERE followerID = ${followerID} AND followingID = ${followingID}`);
        } else {
            await mysqlQuery(`INSERT INTO followers(followerID,followingID) VALUES('${followerID}','${followingID}')`);
        }

        return res.send({ success: true });

    } catch (error) {
        return res.send({
            success: false,
            message: "There was an error while creating the post. Please try again later."
        });
    }
};

const getReplies = async function (req, res) {
    try {
        const params = req.body;
        const postID = params?.postID;
        const userID = params?.userID;

        const post = (await mysqlQuery(`
        SELECT P.text, P.dateCreated, U.fullName, U.userName, P.userId, P.ID AS postID,
        P2.text AS repliedToText, U2.fullName AS repliedToFullName, 
        U2.userName AS repliedToUserName, P2.ID AS repliedToPostID,
        U2.ID AS repliedToUserID, CASE WHEN L.deleted = 0 THEN 1 ELSE 0 END AS liked
        FROM posts AS P
        JOIN users AS U ON U.ID = P.userID
        LEFT JOIN posts AS P2 ON P2.ID = P.repliedToID
        LEFT JOIN users AS U2 ON U2.ID = P2.userID
        LEFT JOIN likes AS L ON L.userID = ${userID} AND L.postID = P.ID
        WHERE P.ID = ${postID}`))[0];

        const replies = await mysqlQuery(`
        SELECT P.text, P.dateCreated, U.fullName, U.userName, P.userId, P.ID AS postID,
        P2.text AS repliedToText, U2.fullName AS repliedToFullName, 
        U2.userName AS repliedToUserName, P2.ID AS repliedToPostID,
        U2.ID AS repliedToUserID, CASE WHEN L.deleted = 0 THEN 1 ELSE 0 END AS liked
        FROM posts AS P
        JOIN users AS U ON U.ID = P.userID
        LEFT JOIN posts AS P2 ON P2.ID = P.repliedToID
        LEFT JOIN users AS U2 ON U2.ID = P2.userID
        LEFT JOIN likes AS L ON L.userID = ${userID} AND L.postID = P.ID
        WHERE P.repliedToID = ${postID}
        ORDER BY P.dateCreated ASC
        `);

        return res.send({
            success: true,
            post,
            replies
        });

    } catch (error) {
        return res.send({
            success: false,
            message: "There was an error while loading the posts. Please try again later."
        });
    }
};

const updateBio = async function (req, res) {
    try {
        console.log("updateBio")
        const params = req.body;
        const token = params.token;

        const decoded = jwt.verify(token, 'secret');
        const user = decoded?.user;

        console.log("params.bio: ", params.bio)

        await mysqlQuery(`Update users SET bio = '${params.bio}' WHERE ID = ${user.ID}`);

        return res.send({
            success: true
        });

    } catch (error) {
        return res.send({
            success: false,
            message: "There was an error while adding the bio. Please try again later."
        });
    }
};

const deletePost = async function (req, res) {
    try {
        const params = req.body;
        const postID = params.postID;
        const userID = params.userID;

        const post = (await mysqlQuery(`SELECT * FROM posts WHERE ID = ${postID} AND userID = ${userID}`))[0];

        if (post) {            
            await mysqlQuery(`DELETE FROM posts WHERE ID = ${postID} AND userID = ${userID}`);

            return res.send({
                success: true
            });
        } else {    
            console.log("ELSE")        
            return res.send({
                success: false,
                message: "Could not delete the post. Please try again later."
            });
        }        

    } catch (error) {
        return res.send({
            success: false,
            message: "Could not delete the post. Please try again later."
        });
    }
};

const deleteProfile = async function (req, res) {
    try {
        const params = req.body;
        const userID = params.userID;

        const user = await mysqlQuery(`SELECT * FROM users WHERE ID = ${userID}`)[0];

        if (user) {
            await mysqlQuery(`DELETE FROM users WHERE ID = ${userID}`);
            await mysqlQuery(`DELETE FROM posts WHERE userID = ${userID}`);
            await mysqlQuery(`DELETE FROM likes WHERE userID = ${userID}`);
            await mysqlQuery(`DELETE FROM followers WHERE followerID = ${userID} AND following = ${userID}`);

            return res.send({
                success: true
            });
        } else {            
            return res.send({
                success: false,
                message: "Could not delete your profile. Please try again later."
            });
        }        

    } catch (error) {
        return res.send({
            success: false,
            message: "Could not delete your profile. Please try again later."
        });
    }
};

const testDelete = async function (req, res) {
    return res.send({
        message: "Deleted Successfully"
    });
};

const testGet = async function (req, res) {

    const posts = await mysqlQuery("SELECT * FROM posts")
    return res.send({
        posts
    });
};

const testPut = async function (req, res) {
    return res.send({
        message: "Updated Successfully"
    });
};

const testPost = async function (req, res) {
    const posts = await mysqlQuery("SELECT * FROM posts")
    return res.send({
        posts
    });
};

module.exports = {
    signup,
    login,
    validateSession,
    getFeed,
    getUserPosts,
    createPost,
    likePost,
    getUserLikes,
    getReplies,
    followUser,
    updateBio,
    getFollowers,
    getFollowing,
    getPosts,
    getUsers,
    deletePost,
    deleteProfile,
    testDelete,
    testGet,
    testPut,
    testPost
}