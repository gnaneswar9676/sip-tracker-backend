// =====================================
// DATABASE MOCK
// =====================================

jest.mock("../database/pgManager", () => ({

  client: {

    query: jest.fn(() => ({

      rows: [

        {

          investor_id: 1,

          first_name: "Gnani",

          last_name: "K",

          city: "Hyderabad"

        }

      ]

    }))

  }

}));



// =====================================
// REDIS MOCK
// =====================================

jest.mock("../services/redisService", () => ({

  redisClient: {

    get: jest.fn(() => null),

    set: jest.fn()

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
// INVESTOR TESTS
// =====================================

describe("Investor APIs", () => {

  test(
    "GET investor profile should work",

    async () => {

      const response =
      await request(app)
        .get("/api/investors/1");

      console.log(
        response.statusCode
      );

      console.log(
        response.body
      );

      expect(response.statusCode)
        .toBe(200);

    });

});

jest.mock("../database/pgManager", () => ({

  client: {

    query: jest.fn((query) => {

      // =====================================
      // GET INVESTOR
      // =====================================

      if (
        query.includes(
          "FROM investors"
        )
      ) {

        return {

          rows: [

            {

              investor_id: 1,

              first_name: "Gnani",

              last_name: "K",

              city: "Hyderabad"

            }

          ]

        };

      }


      // =====================================
      // GET HOLDINGS
      // =====================================

      if (
        query.includes(
          "SUM(it.units_allocated)"
        )
      ) {

        return {

          rows: [

            {

              fund_name:
              "Axis Bluechip Fund",

              amc_name:
              "Axis AMC",

              total_units: 100,

              nav: 50,

              current_value: 5000

            }

          ]

        };

      }


      // =====================================
      // GET NETWORTH
      // =====================================

      if (
        query.includes(
          "total_networth"
        )
      ) {

        return {

          rows: [

            {
              total_networth: 5000
            }

          ]

        };

      }


      return {
        rows: []
      };

    })

  }

}));

test(
  "GET holdings should work",

  async () => {

    const response =
    await request(app)
      .get(
        "/api/investors/1/holdings"
      );

    console.log(
      response.body
    );

    expect(response.statusCode)
      .toBe(200);

  });

  test(
  "GET networth should work",

  async () => {

    const response =
    await request(app)
      .get(
        "/api/investors/1/networth"
      );

    console.log(
      response.body
    );

    expect(response.statusCode)
      .toBe(200);

  });