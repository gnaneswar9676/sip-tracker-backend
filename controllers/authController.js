const db = require("../database/pgManager").client;

const bcrypt = require("bcrypt");

const crypto = require("crypto");

const tracer = require("../utils/tracer");

const {
    sendResetEmail,
} = require("../services/mailService");

const {
    redisClient
} = require("../services/redisService");

const {
    generateToken
} = require("../utility/authManager");

const {
    successResponse,
    errorResponse
} = require("../utility/responseHandler");


// =======================================
// REGISTER
// =======================================

exports.register = async (req, res) => {

    const span = tracer.startSpan(
        "user-register"
    );

    try {

        span.addEvent(
            "Registration started"
        );

        const {
            first_name,
            last_name,
            mobile,
            city,
            email,
            password
        } = req.body;

        span.setAttribute(
            "user.email",
            email
        );

        // VALIDATION
        if (
            !first_name ||
            !last_name ||
            !mobile ||
            !email ||
            !password
        ) {

            span.addEvent(
                "Validation failed"
            );

            return errorResponse(
                res,
                400,
                "All fields are required"
            );
        }

        span.addEvent(
            "Checking existing email"
        );

        // CHECK EMAIL
        const existingEmail =
            await db.query(
                `
                SELECT *
                FROM investor_auth
                WHERE email = $1
                `,
                [email]
            );

        if (
            existingEmail.rows.length > 0
        ) {

            span.addEvent(
                "Email already exists"
            );

            return errorResponse(
                res,
                400,
                "Email already registered"
            );
        }

        span.addEvent(
            "Checking existing mobile"
        );

        // CHECK MOBILE
        const existingMobile =
            await db.query(
                `
                SELECT *
                FROM investors
                WHERE mobile = $1
                `,
                [mobile]
            );

        if (
            existingMobile.rows.length > 0
        ) {

            span.addEvent(
                "Mobile already exists"
            );

            return errorResponse(
                res,
                400,
                "Mobile already registered"
            );
        }

        span.addEvent(
            "Hashing password"
        );

        // HASH PASSWORD
        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );

        span.addEvent(
            "Starting DB transaction"
        );

        // BEGIN TRANSACTION
        await db.query("BEGIN");

        try {

            span.addEvent(
                "Creating investor"
            );

            // INSERT INVESTOR
            const investorResult =
                await db.query(
                    `
                    INSERT INTO investors(
                        first_name,
                        last_name,
                        mobile,
                        city
                    )
                    VALUES($1, $2, $3, $4)
                    RETURNING investor_id
                    `,
                    [
                        first_name,
                        last_name,
                        mobile,
                        city
                    ]
                );

            const investorId =
                investorResult.rows[0]
                .investor_id;

            span.setAttribute(
                "investor.id",
                investorId
            );

            span.addEvent(
                "Creating auth record"
            );

            // INSERT AUTH
            await db.query(
                `
                INSERT INTO investor_auth(
                    investor_id,
                    email,
                    password
                )
                VALUES($1, $2, $3)
                `,
                [
                    investorId,
                    email,
                    hashedPassword
                ]
            );

            span.addEvent(
                "Committing transaction"
            );

            // COMMIT
            await db.query("COMMIT");

            span.addEvent(
                "Registration successful"
            );

            return successResponse(
                res,
                201,
                "User registered successfully"
            );

        } catch (error) {

            span.recordException(
                error
            );

            span.addEvent(
                "Transaction rollback"
            );

            await db.query(
                "ROLLBACK"
            );

            return errorResponse(
                res,
                500,
                error.message
            );
        }

    } catch (error) {

        span.recordException(
            error
        );

        return errorResponse(
            res,
            500,
            error.message
        );

    } finally {

        span.end();
    }
};


// =======================================
// LOGIN
// =======================================

exports.login = async (req, res) => {

    const span = tracer.startSpan(
        "user-login"
    );

    try {

        span.addEvent(
            "Login started"
        );

        const {
            email,
            password
        } = req.body;

        span.setAttribute(
            "user.email",
            email
        );

        // VALIDATION
        if (
            !email ||
            !password
        ) {

            span.addEvent(
                "Validation failed"
            );

            return errorResponse(
                res,
                400,
                "Email and password required"
            );
        }

        span.addEvent(
            "Checking Redis cache"
        );

        // CHECK REDIS CACHE
        const cachedUser =
            await redisClient.get(
                `user_${email}`
            );

        let user;

        if (cachedUser) {

            span.addEvent(
                "Cache hit"
            );

            user = JSON.parse(
                cachedUser
            );

            console.log(
                "User fetched from Redis cache"
            );

        } else {

            span.addEvent(
                "Cache miss"
            );

            span.addEvent(
                "Fetching user from PostgreSQL"
            );

            // FETCH FROM POSTGRESQL
            const result =
                await db.query(
                    `
                    SELECT ia.*, i.first_name, i.last_name
                    FROM investor_auth ia
                    JOIN investors i
                    ON ia.investor_id = i.investor_id
                    WHERE ia.email = $1
                    `,
                    [email]
                );

            user = result.rows[0];

            if (!user) {

                span.addEvent(
                    "User not found"
                );

                return errorResponse(
                    res,
                    404,
                    "User not found"
                );
            }

            span.addEvent(
                "Storing user in Redis"
            );

            // STORE IN REDIS
            await redisClient.set(
                `user_${email}`,
                JSON.stringify(user),
                {
                    EX: 300
                }
            );

            console.log(
                "User stored in Redis"
            );
        }

        span.addEvent(
            "Comparing password"
        );

        // CHECK PASSWORD
        const isPasswordValid =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!isPasswordValid) {

            span.addEvent(
                "Invalid password"
            );

            return errorResponse(
                res,
                401,
                "Invalid password"
            );
        }

        span.addEvent(
            "Generating JWT token"
        );

        // GENERATE TOKEN
        const token =
            generateToken({
                investor_id:
                    user.investor_id,
                email:
                    user.email,
                role:
                    user.role
            });

        span.addEvent(
            "Updating last login"
        );

        // UPDATE LAST LOGIN
        await db.query(
            `
            UPDATE investor_auth
            SET last_login = CURRENT_TIMESTAMP
            WHERE auth_id = $1
            `,
            [user.auth_id]
        );

        span.addEvent(
            "Login successful"
        );

        return successResponse(
            res,
            200,
            "Login successful",
            {
                token,
                investor: {
                    investor_id:
                        user.investor_id,
                    first_name:
                        user.first_name,
                    last_name:
                        user.last_name,
                    email:
                        user.email,
                    role:
                        user.role
                }
            }
        );

    } catch (error) {

        span.recordException(
            error
        );

        return errorResponse(
            res,
            500,
            error.message
        );

    } finally {

        span.end();
    }
};


// =======================================
// FORGOT PASSWORD
// =======================================

exports.forgotPassword =
async (req, res) => {

    try {

        const { email } =
            req.body;

        const result =
            await db.query(
                `
                SELECT *
                FROM investor_auth
                WHERE email = $1
                `,
                [email]
            );

        const user =
            result.rows[0];

        if (!user) {

            return res.status(404)
            .json({
                success: false,
                message:
                    "Email not found",
            });
        }

        const resetToken =
            crypto.randomBytes(32)
            .toString("hex");

        const expiry =
            new Date(
                Date.now()
                + 1000 * 60 * 15
            );

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

        const resetLink =
            `http://localhost:3000/reset-password/${resetToken}`;

        await sendResetEmail(
            email,
            resetLink
        );

        return res.status(200)
        .json({
            success: true,
            message:
                "Reset link sent to email",
        });

    } catch (error) {

        console.log(error);

        return res.status(500)
        .json({
            success: false,
            message:
                "Internal server error",
        });
    }
};


// =======================================
// RESET PASSWORD
// =======================================

exports.resetPassword =
async (req, res) => {

    try {

        const { token } =
            req.params;

        const { password } =
            req.body;

        const result =
            await db.query(
                `
                SELECT *
                FROM investor_auth
                WHERE reset_token = $1
                `,
                [token]
            );

        const user =
            result.rows[0];

        if (!user) {

            return res.status(400)
            .json({
                success: false,
                message:
                    "Invalid token",
            });
        }

        if (
            new Date(
                user.reset_token_expiry
            ) < new Date()
        ) {

            return res.status(400)
            .json({
                success: false,
                message:
                    "Token expired",
            });
        }

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );

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

        return res.status(200)
        .json({
            success: true,
            message:
                "Password reset successful",
        });

    } catch (error) {

        console.log(error);

        return res.status(500)
        .json({
            success: false,
            message:
                "Internal server error",
        });
    }
};