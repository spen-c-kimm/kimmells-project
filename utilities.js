const db = require("./database");

async function mysqlQuery(sql) {
    return new Promise((resolve, reject) => {
        try {
            db.query(sql, function (err, result, fields) {
                if (err) resolve(null);
                return resolve(result);
            });
        } catch(error) {
            reject(null);
        }
    });
}

module.exports = {
    mysqlQuery
}