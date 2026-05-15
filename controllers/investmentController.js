const db =
require("../database/pgManager").client;

const {

  successResponse,
  errorResponse,

} = require(
  "../utility/responseHandler"
);


// ======================================
// ONE TIME INVESTMENT
// ======================================

exports.investNow =
async (req, res) => {

  try {

    const investorId =
    req.user.investor_id;

    const {

      fund_id,
      amount,

    } = req.body;


    // VALIDATION
    if (

      !fund_id ||

      !amount ||

      amount <= 0

    ) {

      return errorResponse(

        res,

        400,

        "Invalid investment data"
      );
    }


    // GET FUND NAV
    const fundResult =
    await db.query(

      `SELECT

          nav

       FROM mutual_funds

       WHERE fund_id = $1`,

      [fund_id]
    );


    if (
      fundResult.rows.length === 0
    ) {

      return errorResponse(

        res,

        404,

        "Fund not found"
      );
    }


    const nav =
    Number(
      fundResult.rows[0].nav
    );


    // CALCULATE UNITS
    const unitsAllocated =

      Number(amount) / nav;


    // CREATE TRANSACTION
    await db.query(

      `INSERT INTO investment_transactions (

          investor_id,
          fund_id,
          amount,
          nav_at_purchase,
          units_allocated

       )

       VALUES ($1, $2, $3, $4, $5)`,

      [

        investorId,
        fund_id,
        amount,
        nav,
        unitsAllocated,
      ]
    );


    return successResponse(

      res,

      201,

      "Investment successful",

      {

        invested_amount:
        amount,

        nav,

        units_allocated:
        unitsAllocated.toFixed(4),
      }
    );

  } catch (error) {

    console.log(error);

    return errorResponse(

      res,

      500,

      error.message
    );
  }
};