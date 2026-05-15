// =====================================
// BCRYPT MOCK
// =====================================

jest.mock("bcrypt", () => ({

  hash: jest.fn(() =>
    Promise.resolve("hashedpassword")
  ),

  compare: jest.fn(() =>
    Promise.resolve(true)
  )

}));



// =====================================
// DATABASE MOCK
// =====================================

jest.mock("../database/pgManager", () => ({

  client: {

    query: jest.fn((query) => {

      // =====================================
      // REGISTER EMAIL CHECK
      // =====================================

      if (
        query.includes(
          "SELECT * FROM investor_auth"
        )
      ) {

        return {
          rows: []
        };

      }


      // =====================================
      // MOBILE CHECK
      // =====================================

      if (
        query.includes(
          "SELECT * FROM investors"
        )
      ) {

        return {
          rows: []
        };

      }


      // =====================================
      // INSERT INVESTOR
      // =====================================

      if (
        query.includes(
          "INSERT INTO investors"
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
      // LOGIN USER FETCH
      // =====================================

      if (
        query.includes(
          "FROM investor_auth ia"
        )
      ) {

        return {

          rows: [

            {
              auth_id: 1,

              investor_id: 1,

              first_name: "Gnani",

              last_name: "K",

              email: "test@gmail.com",

              role: "INVESTOR",

              password: "hashedpassword"

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
// IMPORTS
// =====================================

const request = require("supertest");

const app = require("../app");



// =====================================
// AUTH TESTS
// =====================================

describe("Auth APIs", () => {


  // =====================================
  // REGISTER API
  // =====================================

  describe("Register API", () => {

    test(
      "Should register user",

      async () => {

        const response =
        await request(app)
          .post("/api/auth/register")
          .send({

            first_name: "Gnani",

            last_name: "K",

            mobile: "9876543210",

            city: "Hyderabad",

            email:
            `test${Date.now()}@gmail.com`,

            password: "123456"

          });

        console.log(
          response.body
        );

        expect(response.statusCode)
          .toBe(201);

      });

  });



  // =====================================
  // LOGIN API
  // =====================================

  describe("Login API", () => {

    test(
      "Should login user",

      async () => {

        const response =
        await request(app)
          .post("/api/auth/login")
          .send({

            email: "test@gmail.com",

            password: "123456"

          });

        console.log(
          response.body
        );

        expect(response.statusCode)
          .toBe(200);

        expect(
          response.body.data.token
        ).toBeDefined();

      });

  });

});