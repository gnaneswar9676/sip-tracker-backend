const request = require("supertest");

const app = require("../app");

describe("App APIs", () => {

  test("GET / should work", async () => {

    const response =
    await request(app)
      .get("/");

    expect(response.statusCode)
      .toBe(200);

  });

});