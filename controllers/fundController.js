const db = require("../database/db");

const {
    successResponse,
    errorResponse
} = require("../utility/responseHandler");

// CREATE FUND
exports.createFund = (req, res) => {
    try {
        const {
            fund_name,
            amc_id,
            category,
            nav,
            risk_level
        } = req.body;

        if (!fund_name || !amc_id || !nav) {
            return errorResponse(res, 400, "Required fields missing");
        }

        db.get(
            "SELECT * FROM amcs WHERE amc_id = ?",
            [amc_id],
            (err, amc) => {
                if (err) {
                    return errorResponse(res, 500, err.message);
                }

                if (!amc) {
                    return errorResponse(res, 404, "AMC not found");
                }

                db.run(
                    `INSERT INTO mutual_funds(
                        fund_name,
                        amc_id,
                        category,
                        nav,
                        risk_level
                    )
                    VALUES(?,?,?,?,?)`,
                    [
                        fund_name,
                        amc_id,
                        category,
                        nav,
                        risk_level
                    ],
                    function (err) {
                        if (err) {
                            return errorResponse(res, 500, err.message);
                        }

                        return successResponse(
                            res,
                            201,
                            "Fund created successfully",
                            {
                                fund_id: this.lastID
                            }
                        );
                    }
                );
            }
        );
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

// GET ALL FUNDS
exports.getFunds = (req, res) => {
    try {
        const query = `
            SELECT
                mf.fund_id,
                mf.fund_name,
                a.amc_name,
                mf.category,
                mf.nav,
                mf.risk_level
            FROM mutual_funds mf
            JOIN amcs a
            ON mf.amc_id = a.amc_id
        `;

        db.all(query, [], (err, funds) => {
            if (err) {
                return errorResponse(res, 500, err.message);
            }

            return successResponse(
                res,
                200,
                "Funds fetched successfully",
                funds
            );
        });
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

// UPDATE NAV
exports.updateNAV = (req, res) => {
    try {
        const fundId = req.params.fundId;
        const { nav } = req.body;

        if (!nav) {
            return errorResponse(res, 400, "NAV is required");
        }

        db.get(
            "SELECT * FROM mutual_funds WHERE fund_id = ?",
            [fundId],
            (err, fund) => {
                if (err) {
                    return errorResponse(res, 500, err.message);
                }

                if (!fund) {
                    return errorResponse(res, 404, "Fund not found");
                }

                db.serialize(() => {
                    db.run("BEGIN TRANSACTION");

                    db.run(
                        `UPDATE mutual_funds
                         SET nav = ?
                         WHERE fund_id = ?`,
                        [nav, fundId],
                        function (err) {
                            if (err) {
                                db.run("ROLLBACK");
                                return errorResponse(res, 500, err.message);
                            }

                            db.run(
                                `INSERT INTO nav_history(
                                    fund_id,
                                    nav_value,
                                    nav_date
                                )
                                VALUES(?, ?, DATE('now'))`,
                                [fundId, nav],
                                function (err) {
                                    if (err) {
                                        db.run("ROLLBACK");
                                        return errorResponse(res, 500, err.message);
                                    }

                                    db.run("COMMIT");

                                    return successResponse(
                                        res,
                                        200,
                                        "NAV updated successfully"
                                    );
                                }
                            );
                        }
                    );
                });
            }
        );
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};