// =====================================
// DATABASE MOCK
// =====================================

jest.mock("../database/pgManager", () => ({

  client: {

    query: jest.fn((query) => {

      // =====================================
      // CHECK FUND EXISTS
      // =====================================

      if (
        query.includes(
          "FROM mutual_funds"
        ) &&

        query.includes(
          "WHERE fund_id"
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
      // CREATE SIP
      // =====================================

      if (
        query.includes(
          "INSERT INTO sips"
        )
      ) {

        return {

          rows: [

            {
              sip_id: 1
            }

          ]

        };

      }


      // =====================================
      // GET ALL SIPS
      // =====================================

      if (
        query.includes(
          "FROM sips s"
        ) &&

        query.includes(
          "ORDER BY s.sip_id DESC"
        )
      ) {

        return {

          rows: [

            {
              sip_id: 1,

              sip_amount: 5000,

              sip_date: 10,

              fund_name:
              "Axis Bluechip Fund"
            }

          ]

        };

      }


      // =====================================
      // PROCESS SIP FETCH
      // =====================================

      if (
        query.includes(
          "SELECT"
        ) &&

        query.includes(
          "mf.nav"
        )
      ) {

        return {

          rows: [

            {
              sip_id: 1,

              investor_id: 1,

              fund_id: 1,

              sip_amount: 5000,

              nav: 50
            }

          ]

        };

      }


      // =====================================
      // INSERT TRANSACTION
      // =====================================

      if (
        query.includes(
          "INSERT INTO investment_transactions"
        )
      ) {

        return {

          rows: [

            {
              transaction_id: 101
            }

          ]

        };

      }


      // =====================================
      // SIP OWNERSHIP CHECK
      // =====================================

      if (
        query.includes(
          "SELECT investor_id"
        )
      ) {

        return {

          rows: [

            {
              investor_id: 1
            }

          ]

        };

      }


      // =====================================
      // GET TRANSACTIONS
      // =====================================

      if (
        query.includes(
          "FROM investment_transactions"
        ) &&

        query.includes(
          "ORDER BY transaction_date DESC"
        )
      ) {

        return {

          rows: [

            {
              transaction_id: 101,

              amount: 5000,

              nav_at_purchase: 50,

              units_allocated: 100,

              transaction_date:
              "2026-05-15"
            }

          ]

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


      // =====================================
      // SIP STATUS UPDATE
      // =====================================

      if (
        query.includes(
          "UPDATE sips"
        )
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

        role: "INVESTOR"

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
// SIP TESTS
// =====================================

describe("SIP APIs", () => {


  // =====================================
  // CREATE SIP
  // =====================================

  describe("POST /api/sips", () => {

    test(
      "Should create SIP",

      async () => {

        const response =
        await request(app)
          .post("/api/sips")
          .send({

            fund_id: 1,

            sip_amount: 5000,

            sip_date: 10

          });

        console.log(
          response.body
        );

        expect(response.statusCode)
          .toBe(201);

      });

  });



  // =====================================
  // GET ALL SIPS
  // =====================================

  describe("GET /api/sips", () => {

    test(
      "Should fetch all SIPs",

      async () => {

        const response =
        await request(app)
          .get("/api/sips");

        console.log(
          response.body
        );

        expect(response.statusCode)
          .toBe(200);

      });

  });



  // =====================================
  // PROCESS SIP
  // =====================================

  describe("POST /api/sips/:sipId/process", () => {

    test(
      "Should process SIP",

      async () => {

        const response =
        await request(app)
          .post("/api/sips/1/process");

        console.log(
          response.body
        );

        expect(response.statusCode)
          .toBe(200);

      });

  });



  // =====================================
  // GET TRANSACTIONS
  // =====================================

  describe(
    "GET /api/sips/:sipId/transactions",

    () => {

      test(
        "Should fetch SIP transactions",

        async () => {

          const response =
          await request(app)
            .get(
              "/api/sips/1/transactions"
            );

          console.log(
            response.body
          );

          expect(response.statusCode)
            .toBe(200);

        });

    });



  // =====================================
  // PAUSE SIP
  // =====================================

  describe("PATCH /api/sips/:sipId/pause", () => {

    test(
      "Should pause SIP",

      async () => {

        const response =
        await request(app)
          .patch("/api/sips/1/pause");

        console.log(
          response.body
        );

        expect(response.statusCode)
          .toBe(200);

      });

  });



  // =====================================
  // RESUME SIP
  // =====================================

  describe("PATCH /api/sips/:sipId/resume", () => {

    test(
      "Should resume SIP",

      async () => {

        const response =
        await request(app)
          .patch("/api/sips/1/resume");

        console.log(
          response.body
        );

        expect(response.statusCode)
          .toBe(200);

      });

  });



  // =====================================
  // CANCEL SIP
  // =====================================

  describe("PATCH /api/sips/:sipId/cancel", () => {

    test(
      "Should cancel SIP",

      async () => {

        const response =
        await request(app)
          .patch("/api/sips/1/cancel");

        console.log(
          response.body
        );

        expect(response.statusCode)
          .toBe(200);

      });

  });

});