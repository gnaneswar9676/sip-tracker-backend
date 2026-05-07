const db = require("../database/db");

const {
    successResponse,
    errorResponse
} = require("../utility/responseHandler");

// CREATE SIP
exports.createSIP = (req, res) => {
    try {
        const {
            fund_id,
            sip_amount,
            sip_date
        } = req.body;

        const investorId = req.user.investor_id;

        if (!fund_id || !sip_amount || !sip_date) {
            return errorResponse(res, 400, "Required fields missing");
        }

        if (sip_amount <= 0) {
            return errorResponse(res, 400, "Invalid SIP amount");
        }

        if (sip_date < 1 || sip_date > 31) {
            return errorResponse(res, 400, "Invalid SIP date");
        }

        db.get(
            "SELECT * FROM mutual_funds WHERE fund_id = ?",
            [fund_id],
            (err, fund) => {
                if (err) {
                    return errorResponse(res, 500, err.message);
                }

                if (!fund) {
                    return errorResponse(res, 404, "Fund not found");
                }

                db.run(
                    `INSERT INTO sips(
                        investor_id,
                        fund_id,
                        sip_amount,
                        sip_date
                    )
                    VALUES(?,?,?,?)`,
                    [
                        investorId,
                        fund_id,
                        sip_amount,
                        sip_date
                    ],
                    function (err) {
                        if (err) {
                            return errorResponse(res, 500, err.message);
                        }

                        return successResponse(
                            res,
                            201,
                            "SIP created successfully",
                            {
                                sip_id: this.lastID
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

// GET SIP
exports.getSIP = (req, res) => {
    try {
        const sipId = req.params.sipId;
        const investorId = req.user.investor_id;

        const query = `
            SELECT
                s.*,
                mf.fund_name,
                mf.nav
            FROM sips s
            JOIN mutual_funds mf
            ON s.fund_id = mf.fund_id
            WHERE s.sip_id = ?
        `;

        db.get(query, [sipId], (err, sip) => {
            if (err) {
                return errorResponse(res, 500, err.message);
            }

            if (!sip) {
                return errorResponse(res, 404, "SIP not found");
            }

            if (sip.investor_id != investorId) {
                return errorResponse(res, 403, "Unauthorized access");
            }

            return successResponse(
                res,
                200,
                "SIP fetched successfully",
                sip
            );
        });
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

// PROCESS SIP
exports.processSIP = (req, res) => {
    try {
        const sipId = req.params.sipId;
        const investorId = req.user.investor_id;

        db.get(
            `SELECT
                s.*,
                mf.nav
             FROM sips s
             JOIN mutual_funds mf
             ON s.fund_id = mf.fund_id
             WHERE s.sip_id = ?`,
            [sipId],
            (err, sip) => {
                if (err) {
                    return errorResponse(res, 500, err.message);
                }

                if (!sip) {
                    return errorResponse(res, 404, "SIP not found");
                }

                if (sip.investor_id != investorId) {
                    return errorResponse(res, 403, "Unauthorized access");
                }

                const unitsAllocated =
                    sip.sip_amount / sip.nav;

                db.serialize(() => {
                    db.run("BEGIN TRANSACTION");

                    db.run(
                        `INSERT INTO investment_transactions(
                            sip_id,
                            investor_id,
                            fund_id,
                            amount,
                            nav_at_purchase,
                            units_allocated
                        )
                        VALUES(?,?,?,?,?,?)`,
                        [
                            sip.sip_id,
                            sip.investor_id,
                            sip.fund_id,
                            sip.sip_amount,
                            sip.nav,
                            unitsAllocated
                        ],
                        function (err) {
                            if (err) {
                                db.run("ROLLBACK");
                                return errorResponse(res, 500, err.message);
                            }

                            db.run("COMMIT");

                            return successResponse(
                                res,
                                200,
                                "SIP processed successfully",
                                {
                                    transaction_id: this.lastID,
                                    units_allocated: unitsAllocated
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

// GET SIP TRANSACTIONS
exports.getTransactions = (req, res) => {
    try {
        const sipId = req.params.sipId;
        const investorId = req.user.investor_id;

        const query = `
            SELECT
                it.transaction_id,
                it.amount,
                it.nav_at_purchase,
                it.units_allocated,
                it.transaction_date
            FROM investment_transactions it
            JOIN sips s
            ON it.sip_id = s.sip_id
            WHERE it.sip_id = ?
        `;

        db.all(query, [sipId], (err, transactions) => {
            if (err) {
                return errorResponse(res, 500, err.message);
            }

            db.get(
                `SELECT investor_id
                 FROM sips
                 WHERE sip_id = ?`,
                [sipId],
                (err, sip) => {
                    if (err) {
                        return errorResponse(res, 500, err.message);
                    }

                    if (sip.investor_id != investorId) {
                        return errorResponse(res, 403, "Unauthorized access");
                    }

                    return successResponse(
                        res,
                        200,
                        "Transactions fetched successfully",
                        transactions
                    );
                }
            );
        });
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};