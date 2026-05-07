const sqlite3 =
require("sqlite3").verbose();

const db = new sqlite3.Database(
    "D:\\sip_tracker",

    (err) => {

        if (err) {

            console.log(err.message);

        } else {

            console.log(
                "Connected to SQLite DB"
            );
        }
    }
);

module.exports = db;