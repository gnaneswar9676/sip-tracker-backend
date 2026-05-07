const db = require("../database/db");
const bcrypt = require("bcrypt");

const { generateToken } = require("../utility/authManager");
const { successResponse, errorResponse } = require("../utility/responseHandler");

// REGISTER
exports.register = async (req, res) => {
    try {
        const { first_name, last_name, mobile, city, email, password } = req.body;

        if (!first_name || !last_name || !mobile || !email || !password) {
            return errorResponse(res, 400, "All fields are required");
        }

        db.get(
            "SELECT * FROM investor_auth WHERE email = ?",
            [email],
            async (err, existingEmail) => {
                if (err) {
                    return errorResponse(res, 500, err.message);
                }

                if (existingEmail) {
                    return errorResponse(res, 400, "Email already registered");
                }

                db.get(
                    "SELECT * FROM investors WHERE mobile = ?",
                    [mobile],
                    async (err, existingMobile) => {
                        if (err) {
                            return errorResponse(res, 500, err.message);
                        }

                        if (existingMobile) {
                            return errorResponse(res, 400, "Mobile already registered");
                        }

                        const hashedPassword = await bcrypt.hash(password, 10);

                        db.serialize(() => {
                            db.run("BEGIN TRANSACTION");

                            db.run(
                                `INSERT INTO investors(first_name,last_name,mobile,city)
                                 VALUES(?,?,?,?)`,
                                [first_name, last_name, mobile, city],
                                function (err) {
                                    if (err) {
                                        db.run("ROLLBACK");
                                        return errorResponse(res, 500, err.message);
                                    }

                                    const investorId = this.lastID;

                                    db.run(
                                        `INSERT INTO investor_auth(investor_id,email,password)
                                         VALUES(?,?,?)`,
                                        [investorId, email, hashedPassword],
                                        function (err) {
                                            if (err) {
                                                db.run("ROLLBACK");
                                                return errorResponse(res, 500, err.message);
                                            }

                                            db.run("COMMIT");

                                            return successResponse(
                                                res,
                                                201,
                                                "User registered successfully"
                                            );
                                        }
                                    );
                                }
                            );
                        });
                    }
                );
            }
        );
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

// LOGIN
exports.login = (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return errorResponse(res, 400, "Email and password required");
        }

        db.get(
            `SELECT ia.*, i.first_name, i.last_name
             FROM investor_auth ia
             JOIN investors i
             ON ia.investor_id = i.investor_id
             WHERE ia.email = ?`,
            [email],
            async (err, user) => {
                if (err) {
                    return errorResponse(res, 500, err.message);
                }

                if (!user) {
                    return errorResponse(res, 404, "User not found");
                }

                const isPasswordValid = await bcrypt.compare(
                    password,
                    user.password
                );

                if (!isPasswordValid) {
                    return errorResponse(res, 401, "Invalid password");
                }

                const token = generateToken({
                    investor_id: user.investor_id,
                    email: user.email,
                    role: user.role
                });

                db.run(
                    `UPDATE investor_auth
                     SET last_login = CURRENT_TIMESTAMP
                     WHERE auth_id = ?`,
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
            }
        );
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};