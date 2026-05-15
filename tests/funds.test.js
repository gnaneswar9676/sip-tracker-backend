// =====================================
// DATABASE MOCK
// =====================================

jest.mock("../database/pgManager", () => ({

  client: {

    query: jest.fn((query) => {

      // =====================================
      // GET ALL FUNDS
      // =====================================

      if (
        query.includes(
          "FROM mutual_funds mf"
        )
      ) {

        return {

          rows: [

            {
              fund_id: 1,

              fund_name:
              "Axis Bluechip Fund",

              amc_name:
              "Axis AMC",

              category:
              "Equity",

              nav: 45.67,

              risk_level:
              "High"
            },

            {
              fund_id: 2,

              fund_name:
              "SBI Small Cap Fund",

              amc_name:
              "SBI AMC",

              category:
              "Small Cap",

              nav: 78.12,

              risk_level:
              "Very High"
            }

          ]

        };

      }


      // =====================================
      // AMC EXISTS
      // =====================================

      if (
        query.includes(
          "SELECT * FROM amcs"
        )
      ) {

        return {

          rows: [

            {
              amc_id: 1,
              amc_name: "HDFC AMC"
            }

          ]

        };

      }


      // =====================================
      // FUND EXISTS FOR NAV UPDATE
      // =====================================

      if (
        query.includes(
          "SELECT * FROM mutual_funds WHERE fund_id"
        )
      ) {

        return {

          rows: [

            {
              fund_id: 1,
              fund_name:
              "Axis Bluechip Fund"
            }

          ]

        };

      }


      // =====================================
      // FUND DUPLICATE CHECK
      // =====================================

      if (
        query.includes(
          "SELECT * FROM mutual_funds WHERE fund_name"
        )
      ) {

        return {
          rows: []
        };

      }


      // =====================================
      // CREATE FUND
      // =====================================

      if (
        query.includes(
          "INSERT INTO mutual_funds"
        )
      ) {

        return {

          rows: [

            {
              fund_id: 3
            }

          ]

        };

      }


      // =====================================
      // UPDATE NAV
      // =====================================

      if (
        query.includes(
          "UPDATE mutual_funds"
        )
      ) {

        return {

          rows: [

            {
              fund_id: 1,
              nav: 50
            }

          ]

        };

      }


      // =====================================
      // INSERT NAV HISTORY
      // =====================================

      if (
        query.includes(
          "INSERT INTO nav_history"
        )
      ) {

        return {
          rows: []
        };

      }


      // =====================================
      // TRANSACTION QUERIES
      // =====================================

      if (
        query === "BEGIN" ||
        query === "COMMIT" ||
        query === "ROLLBACK"
      ) {

        return {
          rows: []
        };

      }


      return {
        rows: []
      };

    })

  }

}));



// =====================================
// REDIS MOCK
// =====================================

jest.mock("../services/redisService", () => ({

  redisClient: {

    get: jest.fn(() => null),

    set: jest.fn(),

    del: jest.fn()

  }

}));



// =====================================
// AUTH MIDDLEWARE MOCK
// =====================================

jest.mock(
  "../middleware/authMiddleware",
  () => ({

    authenticateUser:
    (req, res, next) => {

      req.user = {

        investor_id: 1,

        role: "ADMIN"

      };

      next();
    },

    authorizeRole:
    () => {

      return (req, res, next) => {
        next();
      };

    }

}));



// =====================================
// IMPORTS
// =====================================

const request = require("supertest");

const app = require("../app");



// =====================================
// FUNDS TESTS
// =====================================

describe("Funds APIs", () => {


  // =====================================
  // GET FUNDS
  // =====================================

  describe("GET /api/funds", () => {

    test(
      "Should fetch all funds",

      async () => {

        const response =
        await request(app)
          .get("/api/funds");

        console.log(
          response.body
        );

        expect(response.statusCode)
          .toBe(200);

        expect(
          response.body.data.length
        ).toBeGreaterThan(0);

      });

  });



  // =====================================
  // CREATE FUND
  // =====================================

  describe("POST /api/funds", () => {

    test(
      "Should create fund",

      async () => {

        const response =
        await request(app)
          .post("/api/funds")
          .send({

            fund_name:
            "HDFC Flexi Cap Fund",

            amc_id: 1,

            category:
            "Flexi Cap",

            nav: 55.34,

            risk_level:
            "High"

          });

        console.log(
          response.body
        );

        expect(response.statusCode)
          .toBe(201);

      });

  });



  // =====================================
  // UPDATE NAV
  // =====================================

  describe("PUT /api/funds/:fundId/nav", () => {

    test(
      "Should update fund NAV",

      async () => {

        const response =
        await request(app)
          .put("/api/funds/1/nav")
          .send({

            nav: 50

          });

        console.log(
          response.body
        );

        expect(response.statusCode)
          .toBe(200);

      });

  });

});