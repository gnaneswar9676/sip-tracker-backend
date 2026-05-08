const { Client } = require("pg");

require("dotenv").config();

const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    ssl: {
        rejectUnauthorized: false
    }
});

async function connectDB() {

    try {

        await client.connect();

        console.log("PostgreSQL Connected Successfully");

        const result = await client.query(
            "SELECT NOW()"
        );

        console.log(result.rows);

    } catch (error) {

        console.error(
            "Database Connection Error:",
            error.message
        );
    }
}

module.exports = {
    client,
    connectDB
};