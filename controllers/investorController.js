const db = require("../database/pgManager").client;

const { redisClient } = require("../services/redisService");

const {
    successResponse,
    errorResponse
} = require("../utility/responseHandler");

// =======================================
// GET INVESTOR
// =======================================

exports.getInvestor = async (req, res) => {
    try {
        const investorId = req.params.investorId;

        // AUTHORIZATION
        if (req.user.investor_id != investorId) {
            return errorResponse(
                res,
                403,
                "Unauthorized access"
            );
        }

        // CHECK REDIS CACHE
        const cachedInvestor = await redisClient.get(
            `investor_${investorId}`
        );

        // RETURN CACHE
        if (cachedInvestor) {
            console.log("Investor fetched from Redis cache");

            return successResponse(
                res,
                200,
                "Investor fetched from Redis cache",
                JSON.parse(cachedInvestor)
            );
        }

        // FETCH FROM POSTGRESQL
        const result = await db.query(
            `SELECT
                investor_id,
                first_name,
                last_name,
                mobile,
                city,
                created_at
             FROM investors
             WHERE investor_id = $1`,
            [investorId]
        );

        const investor = result.rows[0];

        if (!investor) {
            return errorResponse(
                res,
                404,
                "Investor not found"
            );
        }

        // STORE IN REDIS
        await redisClient.set(
            `investor_${investorId}`,
            JSON.stringify(investor),
            { EX: 300 }
        );

        console.log("Investor stored in Redis");

        return successResponse(
            res,
            200,
            "Investor fetched successfully",
            investor
        );

    } catch (error) {
        return errorResponse(
            res,
            500,
            error.message
        );
    }
};

// =======================================
// GET HOLDINGS
// =======================================

exports.getHoldings = async (req, res) => {
    try {
        const investorId = req.params.investorId;

        // AUTHORIZATION
        if (req.user.investor_id != investorId) {
            return errorResponse(
                res,
                403,
                "Unauthorized access"
            );
        }

        // CHECK REDIS CACHE
        const cachedHoldings = await redisClient.get(
            `holdings_${investorId}`
        );

        // RETURN CACHE
        if (cachedHoldings) {
            console.log("Holdings fetched from Redis cache");

            return successResponse(
                res,
                200,
                "Holdings fetched from Redis cache",
                JSON.parse(cachedHoldings)
            );
        }

        // FETCH FROM POSTGRESQL
        const result = await db.query(
            `SELECT
                mf.fund_name,
                a.amc_name,
                SUM(it.units_allocated) AS total_units,
                mf.nav,
                ROUND(
                    CAST(
                        SUM(it.units_allocated) * mf.nav
                        AS NUMERIC
                    ),
                    2
                ) AS current_value
             FROM investment_transactions it
             JOIN mutual_funds mf
             ON it.fund_id = mf.fund_id
             JOIN amcs a
             ON mf.amc_id = a.amc_id
             WHERE it.investor_id = $1
             GROUP BY
                mf.fund_id,
                mf.fund_name,
                a.amc_name,
                mf.nav`,
            [investorId]
        );

        // STORE IN REDIS
        await redisClient.set(
            `holdings_${investorId}`,
            JSON.stringify(result.rows),
            { EX: 300 }
        );

        console.log("Holdings stored in Redis");

        return successResponse(
            res,
            200,
            "Holdings fetched successfully",
            result.rows
        );

    } catch (error) {
        return errorResponse(
            res,
            500,
            error.message
        );
    }
};

// =======================================
// GET NETWORTH
// =======================================

exports.getNetWorth = async (req, res) => {
    try {
        const investorId = req.params.investorId;

        // AUTHORIZATION
        if (req.user.investor_id != investorId) {
            return errorResponse(
                res,
                403,
                "Unauthorized access"
            );
        }

        // CHECK REDIS CACHE
        const cachedNetworth = await redisClient.get(
            `networth_${investorId}`
        );

        // RETURN CACHE
        if (cachedNetworth) {
            console.log("Networth fetched from Redis cache");

            return successResponse(
                res,
                200,
                "Networth fetched from Redis cache",
                JSON.parse(cachedNetworth)
            );
        }

        // FETCH FROM POSTGRESQL
        const result = await db.query(
            `SELECT
                ROUND(
                    CAST(
                        SUM(it.units_allocated * mf.nav)
                        AS NUMERIC
                    ),
                    2
                ) AS total_networth
             FROM investment_transactions it
             JOIN mutual_funds mf
             ON it.fund_id = mf.fund_id
             WHERE it.investor_id = $1`,
            [investorId]
        );

        // STORE IN REDIS
        await redisClient.set(
            `networth_${investorId}`,
            JSON.stringify(result.rows[0]),
            { EX: 300 }
        );

        console.log("Networth stored in Redis");

        return successResponse(
            res,
            200,
            "Networth fetched successfully",
            result.rows[0]
        );

    } catch (error) {
        return errorResponse(
            res,
            500,
            error.message
        );
    }
};