const db = require("../database/pgManager").client;
const bcrypt = require("bcrypt");
const crypto =
  require("crypto");

const {
  sendResetEmail,
} = require(
  "../services/mailService"
);
const { redisClient } = require("../services/redisService");
const { generateToken } = require("../utility/authManager");

const {
    successResponse,
    errorResponse
} = require("../utility/responseHandler");

// =======================================
// REGISTER
// =======================================

exports.register = async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            mobile,
            city,
            email,
            password
        } = req.body;

        // VALIDATION
        if (!first_name || !last_name || !mobile || !email || !password) {
            return errorResponse(res, 400, "All fields are required");
        }

        // CHECK EMAIL
        const existingEmail = await db.query(
            `SELECT * FROM investor_auth WHERE email = $1`,
            [email]
        );

        if (existingEmail.rows.length > 0) {
            return errorResponse(res, 400, "Email already registered");
        }

        // CHECK MOBILE
        const existingMobile = await db.query(
            `SELECT * FROM investors WHERE mobile = $1`,
            [mobile]
        );

        if (existingMobile.rows.length > 0) {
            return errorResponse(res, 400, "Mobile already registered");
        }

        // HASH PASSWORD
        const hashedPassword = await bcrypt.hash(password, 10);

        // BEGIN TRANSACTION
        await db.query("BEGIN");

        try {
            // INSERT INVESTOR
            const investorResult = await db.query(
                `INSERT INTO investors(first_name, last_name, mobile, city)
                 VALUES($1, $2, $3, $4)
                 RETURNING investor_id`,
                [first_name, last_name, mobile, city]
            );

            const investorId = investorResult.rows[0].investor_id;

            // INSERT AUTH
            await db.query(
                `INSERT INTO investor_auth(investor_id, email, password)
                 VALUES($1, $2, $3)`,
                [investorId, email, hashedPassword]
            );

            // COMMIT
            await db.query("COMMIT");

            return successResponse(
                res,
                201,
                "User registered successfully"
            );

        } catch (error) {
            await db.query("ROLLBACK");
            return errorResponse(res, 500, error.message);
        }

    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

// =======================================
// LOGIN
// =======================================

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // VALIDATION
        if (!email || !password) {
            return errorResponse(res, 400, "Email and password required");
        }

        // CHECK REDIS CACHE
        const cachedUser = await redisClient.get(`user_${email}`);
        let user;

        if (cachedUser) {
            user = JSON.parse(cachedUser);
            console.log("User fetched from Redis cache");

        } else {
            // FETCH FROM POSTGRESQL
            const result = await db.query(
                `SELECT ia.*, i.first_name, i.last_name
                 FROM investor_auth ia
                 JOIN investors i
                 ON ia.investor_id = i.investor_id
                 WHERE ia.email = $1`,
                [email]
            );

            user = result.rows[0];

            if (!user) {
                return errorResponse(res, 404, "User not found");
            }

            // STORE IN REDIS
            await redisClient.set(
                `user_${email}`,
                JSON.stringify(user),
                { EX: 300 }
            );

            console.log("User stored in Redis");
        }

        // CHECK PASSWORD
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return errorResponse(res, 401, "Invalid password");
        }

        // GENERATE TOKEN
        const token = generateToken({
            investor_id: user.investor_id,
            email: user.email,
            role: user.role
        });

        // UPDATE LAST LOGIN
        await db.query(
            `UPDATE investor_auth
             SET last_login = CURRENT_TIMESTAMP
             WHERE auth_id = $1`,
            [user.auth_id]
        );

        return successResponse(res, 200, "Login successful", {
            token,
            investor: {
                investor_id: user.investor_id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};
// =======================================
// FORGOT PASSWORD
// =======================================

exports.forgotPassword = async (req, res) => {

    try {

        const { email } = req.body;

        // CHECK USER
        const result = await db.query(
            `
            SELECT *
            FROM investor_auth
            WHERE email = $1
            `,
            [email]
        );

        const user = result.rows[0];

        if (!user) {

            return res.status(404).json({

                success: false,

                message: "Email not found",

            });
        }

        // GENERATE TOKEN
        const resetToken =
            crypto.randomBytes(32).toString("hex");

        const expiry = new Date(
            Date.now() + 1000 * 60 * 15
        );

        // STORE TOKEN
        await db.query(
            `
            UPDATE investor_auth
            SET
                reset_token = $1,
                reset_token_expiry = $2
            WHERE email = $3
            `,
            [
                resetToken,
                expiry,
                email
            ]
        );

        // RESET LINK
        const resetLink =
            `http://localhost:3000/reset-password/${resetToken}`;

        // SEND EMAIL
        await sendResetEmail(
            email,
            resetLink
        );

        return res.status(200).json({

            success: true,

            message: "Reset link sent to email",

        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: "Internal server error",

        });
    }
};


// =======================================
// RESET PASSWORD
// =======================================

exports.resetPassword = async (req, res) => {

    try {

        const { token } = req.params;

        const { password } = req.body;

        // CHECK TOKEN
        const result = await db.query(
            `
            SELECT *
            FROM investor_auth
            WHERE reset_token = $1
            `,
            [token]
        );

        const user = result.rows[0];

        if (!user) {

            return res.status(400).json({

                success: false,

                message: "Invalid token",

            });
        }

        // CHECK EXPIRY
        if (
            new Date(user.reset_token_expiry)
            < new Date()
        ) {

            return res.status(400).json({

                success: false,

                message: "Token expired",

            });
        }

        // HASH PASSWORD
        const hashedPassword =
            await bcrypt.hash(password, 10);

        // UPDATE PASSWORD
        await db.query(
            `
            UPDATE investor_auth
            SET
                password = $1,
                reset_token = NULL,
                reset_token_expiry = NULL
            WHERE reset_token = $2
            `,
            [
                hashedPassword,
                token
            ]
        );

        return res.status(200).json({

            success: true,

            message: "Password reset successful",

        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: "Internal server error",

        });
    }
};