const db = require("../database/pgManager").client;

const { redisClient } = require("../services/redisService");

const {
    successResponse,
    errorResponse
} = require("../utility/responseHandler");


// =======================================
// CREATE SIP
// =======================================

exports.createSIP = async (req, res) => {

    try {

        const {
            fund_id,
            sip_amount,
            sip_date
        } = req.body;

        const investorId = req.user.investor_id;

        // VALIDATION
        if (!fund_id || !sip_amount || !sip_date) {

            return errorResponse(
                res,
                400,
                "Required fields missing"
            );
        }

        if (sip_amount <= 0) {

            return errorResponse(
                res,
                400,
                "Invalid SIP amount"
            );
        }

        if (sip_date < 1 || sip_date > 31) {

            return errorResponse(
                res,
                400,
                "Invalid SIP date"
            );
        }

        // CHECK FUND
        const fundResult = await db.query(
            `
            SELECT *
            FROM mutual_funds
            WHERE fund_id = $1
            `,
            [fund_id]
        );

        if (fundResult.rows.length === 0) {

            return errorResponse(
                res,
                404,
                "Fund not found"
            );
        }

        // CREATE SIP
        const result = await db.query(
            `
            INSERT INTO sips(
                investor_id,
                fund_id,
                sip_amount,
                sip_date
            )
            VALUES($1, $2, $3, $4)
            RETURNING sip_id
            `,
            [
                investorId,
                fund_id,
                sip_amount,
                sip_date
            ]
        );

        return successResponse(
            res,
            201,
            "SIP created successfully",
            {
                sip_id: result.rows[0].sip_id
            }
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
// GET ALL SIPS
// =======================================

exports.getAllSIPs = async (req, res) => {

    try {

        const investorId = req.user.investor_id;

        const result = await db.query(
            `
            SELECT
                s.sip_id,
                s.sip_amount,
                s.sip_date,
                mf.fund_name
            FROM sips s

            JOIN mutual_funds mf
            ON s.fund_id = mf.fund_id

            WHERE s.investor_id = $1

            ORDER BY s.sip_id DESC
            `,
            [investorId]
        );

        return res.status(200).json({

            success: true,

            message: "SIPs fetched successfully",

            data: result.rows,
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
// PROCESS SIP
// =======================================

exports.processSIP = async (req, res) => {

    try {

        const sipId = req.params.sipId;

        const investorId = req.user.investor_id;

        // GET SIP DETAILS
        const result = await db.query(
            `
            SELECT
                s.*,
                mf.nav
            FROM sips s

            JOIN mutual_funds mf
            ON s.fund_id = mf.fund_id

            WHERE s.sip_id = $1
            `,
            [sipId]
        );

        const sip = result.rows[0];

        if (!sip) {

            return errorResponse(
                res,
                404,
                "SIP not found"
            );
        }

        // AUTHORIZATION
        if (sip.investor_id != investorId) {

            return errorResponse(
                res,
                403,
                "Unauthorized access"
            );
        }

        // CALCULATE UNITS
        const unitsAllocated =
            sip.sip_amount / sip.nav;

        // BEGIN TRANSACTION
        await db.query("BEGIN");

        try {

            // INSERT TRANSACTION
            const transactionResult = await db.query(
                `
                INSERT INTO investment_transactions(
                    sip_id,
                    investor_id,
                    fund_id,
                    amount,
                    nav_at_purchase,
                    units_allocated
                )
                VALUES($1, $2, $3, $4, $5, $6)

                RETURNING transaction_id
                `,
                [
                    sip.sip_id,
                    sip.investor_id,
                    sip.fund_id,
                    sip.sip_amount,
                    sip.nav,
                    unitsAllocated
                ]
            );

            // COMMIT
            await db.query("COMMIT");

            // CLEAR CACHE
            await redisClient.del(`holdings_${investorId}`);

            await redisClient.del(`networth_${investorId}`);

            await redisClient.del(`sip_${sipId}`);

            console.log(
                "Redis cache cleared after SIP processing"
            );

            return successResponse(
                res,
                200,
                "SIP processed successfully",
                {
                    transaction_id:
                        transactionResult.rows[0].transaction_id,

                    units_allocated:
                        Number(unitsAllocated.toFixed(4))
                }
            );

        } catch (error) {

            await db.query("ROLLBACK");

            return errorResponse(
                res,
                500,
                error.message
            );
        }

    } catch (error) {

        return errorResponse(
            res,
            500,
            error.message
        );
    }
};


// =======================================
// GET TRANSACTIONS
// =======================================

exports.getTransactions = async (req, res) => {

    try {

        const sipId = req.params.sipId;

        const investorId = req.user.investor_id;

        // CHECK REDIS CACHE
        const cachedTransactions =
            await redisClient.get(
                `transactions_${sipId}`
            );

        // RETURN CACHE
        if (cachedTransactions) {

            console.log(
                "Transactions fetched from Redis cache"
            );

            return successResponse(
                res,
                200,
                "Transactions fetched from Redis cache",
                JSON.parse(cachedTransactions)
            );
        }

        // CHECK SIP OWNERSHIP
        const sipResult = await db.query(
            `
            SELECT investor_id
            FROM sips
            WHERE sip_id = $1
            `,
            [sipId]
        );

        const sip = sipResult.rows[0];

        if (!sip) {

            return errorResponse(
                res,
                404,
                "SIP not found"
            );
        }

        // AUTHORIZATION
        if (sip.investor_id != investorId) {

            return errorResponse(
                res,
                403,
                "Unauthorized access"
            );
        }

        // GET TRANSACTIONS
        const transactionResult = await db.query(
            `
            SELECT
                transaction_id,
                amount,
                nav_at_purchase,
                units_allocated,
                transaction_date
            FROM investment_transactions

            WHERE sip_id = $1

            ORDER BY transaction_date DESC
            `,
            [sipId]
        );

        // STORE IN REDIS
        await redisClient.set(
            `transactions_${sipId}`,
            JSON.stringify(transactionResult.rows),
            { EX: 300 }
        );

        console.log(
            "Transactions stored in Redis"
        );

        return successResponse(
            res,
            200,
            "Transactions fetched successfully",
            transactionResult.rows
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
// GET ALL TRANSACTIONS
// =======================================

exports.getAllTransactions = async (req, res) => {

    try {

        const investorId =
            req.user.investor_id;

        const result = await db.query(
            `
            SELECT
                it.transaction_id,
                it.amount,
                it.nav_at_purchase,
                it.units_allocated,
                it.transaction_date,
                s.sip_id,
                mf.fund_name

            FROM investment_transactions it

            JOIN sips s
            ON it.sip_id = s.sip_id

            JOIN mutual_funds mf
            ON it.fund_id = mf.fund_id

            WHERE s.investor_id = $1

            ORDER BY it.transaction_id DESC
            `,
            [investorId]
        );

        return res.status(200).json({

            success: true,

            message:
                "Transactions fetched successfully",

            data: result.rows,

        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message:
                "Internal server error",

        });

    }
};

exports.pauseSIP =
async (req, res) => {

  try {

    const sipId =
    req.params.sipId;


    await db.query(

      `UPDATE sips

       SET status = 'PAUSED'

       WHERE sip_id = $1`,

      [sipId]
    );


    return successResponse(

      res,

      200,

      "SIP paused successfully"
    );

  } catch (error) {

    return errorResponse(

      res,

      500,

      error.message
    );
  }
};

exports.cancelSIP =
async (req, res) => {

  try {

    const sipId =
    req.params.sipId;


    await db.query(

      `UPDATE sips

       SET status = 'CANCELLED'

       WHERE sip_id = $1`,

      [sipId]
    );


    return successResponse(

      res,

      200,

      "SIP cancelled successfully"
    );

  } catch (error) {

    return errorResponse(

      res,

      500,

      error.message
    );
  }
};

exports.resumeSIP =
async (req, res) => {

  try {

    const sipId =
    req.params.sipId;


    await db.query(

      `UPDATE sips

       SET status = 'ACTIVE'

       WHERE sip_id = $1`,

      [sipId]
    );


    return successResponse(

      res,

      200,

      "SIP resumed successfully"
    );

  } catch (error) {

    return errorResponse(

      res,

      500,

      error.message
    );
  }
};