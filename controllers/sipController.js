const db = require("../database/pgManager").client;

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

            `SELECT * FROM mutual_funds
             WHERE fund_id = $1`,

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

            `INSERT INTO sips(

                investor_id,
                fund_id,
                sip_amount,
                sip_date

            )

            VALUES($1,$2,$3,$4)

            RETURNING sip_id`,

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
// GET SIP
// =======================================

exports.getSIP = async (req, res) => {

    try {

        const sipId = req.params.sipId;

        const investorId = req.user.investor_id;


        const result = await db.query(

            `SELECT

                s.*,
                mf.fund_name,
                mf.nav

             FROM sips s

             JOIN mutual_funds mf
             ON s.fund_id = mf.fund_id

             WHERE s.sip_id = $1`,

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


        if (sip.investor_id != investorId) {

            return errorResponse(
                res,
                403,
                "Unauthorized access"
            );
        }


        return successResponse(
            res,
            200,
            "SIP fetched successfully",
            sip
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
// PROCESS SIP
// =======================================

exports.processSIP = async (req, res) => {

    try {

        const sipId = req.params.sipId;

        const investorId = req.user.investor_id;


        // GET SIP DETAILS
        const result = await db.query(

            `SELECT

                s.*,
                mf.nav

             FROM sips s

             JOIN mutual_funds mf
             ON s.fund_id = mf.fund_id

             WHERE s.sip_id = $1`,

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


        // INSERT TRANSACTION
        const transactionResult = await db.query(

            `INSERT INTO investment_transactions(

                sip_id,
                investor_id,
                fund_id,
                amount,
                nav_at_purchase,
                units_allocated

            )

            VALUES($1,$2,$3,$4,$5,$6)

            RETURNING transaction_id`,

            [
                sip.sip_id,
                sip.investor_id,
                sip.fund_id,
                sip.sip_amount,
                sip.nav,
                unitsAllocated
            ]
        );


        return successResponse(
            res,
            200,
            "SIP processed successfully",
            {

                transaction_id:
                    transactionResult.rows[0]
                    .transaction_id,

                units_allocated:
                    Number(
                        unitsAllocated.toFixed(4)
                    )
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
// GET SIP TRANSACTIONS
// =======================================

exports.getTransactions = async (req, res) => {

    try {

        const sipId = req.params.sipId;

        const investorId = req.user.investor_id;


        // CHECK SIP OWNERSHIP
        const sipResult = await db.query(

            `SELECT investor_id

             FROM sips

             WHERE sip_id = $1`,

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


        if (sip.investor_id != investorId) {

            return errorResponse(
                res,
                403,
                "Unauthorized access"
            );
        }


        // GET TRANSACTIONS
        const transactionResult = await db.query(

            `SELECT

                transaction_id,
                amount,
                nav_at_purchase,
                units_allocated,
                transaction_date

             FROM investment_transactions

             WHERE sip_id = $1

             ORDER BY transaction_date DESC`,

            [sipId]
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