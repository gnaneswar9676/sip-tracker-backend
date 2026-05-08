const db = require("../database/pgManager").client;

const {
  redisClient,
} = require("../services/redisService");

const {
  successResponse,
  errorResponse,
} = require("../utility/responseHandler");


// =======================================
// CREATE FUND
// =======================================

exports.createFund = async (req, res) => {

  try {

    const {
      fund_name,
      amc_id,
      category,
      nav,
      risk_level,
    } = req.body;


    // VALIDATION
    if (
      !fund_name ||
      !amc_id ||
      !nav
    ) {

      return errorResponse(
        res,
        400,
        "Required fields missing"
      );
    }


    // CHECK AMC EXISTS
    const amcResult =
    await db.query(

      `SELECT * FROM amcs
       WHERE amc_id = $1`,

      [amc_id]
    );


    if (
      amcResult.rows.length === 0
    ) {

      return errorResponse(
        res,
        404,
        "AMC not found"
      );
    }


    // CHECK DUPLICATE FUND
    const existingFund =
    await db.query(

      `SELECT * FROM mutual_funds
       WHERE fund_name = $1`,

      [fund_name]
    );


    if (
      existingFund.rows.length > 0
    ) {

      return errorResponse(
        res,
        400,
        "Fund already exists"
      );
    }


    // CREATE FUND
    const result =
    await db.query(

      `INSERT INTO mutual_funds(

          fund_name,
          amc_id,
          category,
          nav,
          risk_level

      )

      VALUES($1,$2,$3,$4,$5)

      RETURNING fund_id`,

      [
        fund_name,
        amc_id,
        category,
        nav,
        risk_level,
      ]
    );


    // CLEAR CACHE
    await redisClient.del(
      "all_funds"
    );


    return successResponse(
      res,
      201,
      "Fund created successfully",

      {
        fund_id:
        result.rows[0].fund_id,
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
// GET ALL FUNDS
// =======================================

exports.getFunds = async (req, res) => {

  try {

    // CHECK REDIS CACHE
    const cachedFunds =
    await redisClient.get(
      "all_funds"
    );


    // RETURN CACHE
    if (cachedFunds) {

      return successResponse(
        res,
        200,
        "Funds fetched from Redis cache",

        JSON.parse(
          cachedFunds
        )
      );
    }


    // FETCH FROM POSTGRESQL
    const result =
    await db.query(

      `SELECT

          mf.fund_id,
          mf.fund_name,
          a.amc_name,
          mf.category,
          mf.nav,
          mf.risk_level

       FROM mutual_funds mf

       JOIN amcs a

       ON mf.amc_id = a.amc_id`
    );


    // STORE IN REDIS
    await redisClient.set(

      "all_funds",

      JSON.stringify(
        result.rows
      ),

      {
        EX: 60
      }
    );


    return successResponse(
      res,
      200,
      "Funds fetched successfully",

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
// UPDATE NAV
// =======================================

exports.updateNAV = async (req, res) => {

  try {

    const fundId =
    req.params.fundId;

    const { nav } =
    req.body;


    // VALIDATION
    if (!nav) {

      return errorResponse(
        res,
        400,
        "NAV is required"
      );
    }


    // CHECK FUND EXISTS
    const fundResult =
    await db.query(

      `SELECT * FROM mutual_funds
       WHERE fund_id = $1`,

      [fundId]
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


    // BEGIN TRANSACTION
    await db.query(
      "BEGIN"
    );


    try {

      // UPDATE NAV
      await db.query(

        `UPDATE mutual_funds

         SET nav = $1

         WHERE fund_id = $2`,

        [nav, fundId]
      );


      // INSERT NAV HISTORY
      await db.query(

        `INSERT INTO nav_history(

            fund_id,
            nav_value,
            nav_date

        )

        VALUES(

            $1,
            $2,
            CURRENT_DATE
        )`,

        [fundId, nav]
      );


      // COMMIT
      await db.query(
        "COMMIT"
      );


      // CLEAR REDIS CACHE
      await redisClient.del(
        "all_funds"
      );


      return successResponse(
        res,
        200,
        "NAV updated successfully"
      );

    } catch (error) {

      // ROLLBACK
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

    return errorResponse(
      res,
      500,
      error.message
    );
  }
};