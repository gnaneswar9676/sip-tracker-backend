const db = require("../database/db");

const {
    successResponse,
    errorResponse
} = require("../utility/responseHandler");

// GET INVESTOR
exports.getInvestor = (req, res) => {
    try {
        const investorId = req.params.investorId;

        // OWNERSHIP VALIDATION
        if (req.user.investor_id != investorId) {
            return errorResponse(res, 403, "Unauthorized access");
        }

        const query = `
            SELECT
                investor_id,
                first_name,
                last_name,
                mobile,
                city,
                created_at
            FROM investors
            WHERE investor_id = ?
        `;

        db.get(query, [investorId], (err, investor) => {
            if (err) {
                return errorResponse(res, 500, err.message);
            }

            if (!investor) {
                return errorResponse(res, 404, "Investor not found");
            }

            return successResponse(
                res,
                200,
                "Investor fetched successfully",
                investor
            );
        });
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

// GET HOLDINGS
exports.getHoldings = (req, res) => {
    try {
        const investorId = req.params.investorId;

        // AUTHORIZATION
        if (req.user.investor_id != investorId) {
            return errorResponse(res, 403, "Unauthorized access");
        }

        const query = `
            SELECT
                mf.fund_name,
                a.amc_name,
                SUM(it.units_allocated) AS total_units,
                mf.nav,
                ROUND(
                    SUM(it.units_allocated) * mf.nav,
                    2
                ) AS current_value
            FROM investment_transactions it
            JOIN mutual_funds mf
            ON it.fund_id = mf.fund_id
            JOIN amcs a
            ON mf.amc_id = a.amc_id
            WHERE it.investor_id = ?
            GROUP BY mf.fund_id
        `;

        db.all(query, [investorId], (err, holdings) => {
            if (err) {
                return errorResponse(res, 500, err.message);
            }

            return successResponse(
                res,
                200,
                "Holdings fetched successfully",
                holdings
            );
        });
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

// GET NETWORTH
exports.getNetWorth = (req, res) => {
    try {
        const investorId = req.params.investorId;

        // AUTHORIZATION
        if (req.user.investor_id != investorId) {
            return errorResponse(res, 403, "Unauthorized access");
        }

        const query = `
            SELECT
                ROUND(
                    SUM(it.units_allocated * mf.nav),
                    2
                ) AS total_networth
            FROM investment_transactions it
            JOIN mutual_funds mf
            ON it.fund_id = mf.fund_id
            WHERE it.investor_id = ?
        `;

        db.get(query, [investorId], (err, networth) => {
            if (err) {
                return errorResponse(res, 500, err.message);
            }

            return successResponse(
                res,
                200,
                "Networth fetched successfully",
                networth
            );
        });
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};