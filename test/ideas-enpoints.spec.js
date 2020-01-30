const { expect } = require("chai");
const knex = require("knex");
const app = require("../src/app");
const { makeIdeasArray } = require("./fixtures");

describe("Ideas Endpoints", () => {
  let db;

  before("Make knex instance with test database", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DATABASE_URL
    });
    app.set("db", db);
  });

  after("Disconnect from test database", () => db.destroy());

  before("Clean table", () => db("ideas").truncate());

  afterEach("Remove data after each test", () => db("ideas").truncate());

  describe("GET /ideas", () => {
    context("No data in ideas table", () => {
      it("Returns an empty array and status ", () => {
        return supertest(app)
          .get("/ideas")
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .expect(200, []);
      });
    });

    context("Data in the ideas table", () => {
      const testIdeas = makeIdeasArray();

      beforeEach("Insert test data", () => {
        return db("ideas").insert(testIdeas);
      });

      it(`GET /ideas responds with status 200 and all of the ideas`, () => {
        return supertest(app)
          .get("/ideas")
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .expect(200, testIdeas);
      });
    });
  });

  describe("GET /ideas/:id", () => {
    context("No data in ideas table", () => {
      it("Responds with error 404", () => {
        const noIdeaId = 200;
        return supertest(app)
          .get(`/ideas/${noIdeaId}`)
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .expect(404, { error: { message: "Idea not found" } });
      });
    });

    context("Data in the ideas table", () => {
      const testIdeas = makeIdeasArray();

      beforeEach("Insert test data", () => {
        return db("ideas").insert(testIdeas);
      });
      it("GET /ideas/:id returns the idea by id and status 200", () => {
        const queryId = 3;
        const expectedArticle = testIdeas[queryId - 1];
        return supertest(app)
          .get(`/ideas/${queryId}`)
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .expect(200, expectedArticle);
      });
    });
  });

  describe.only("POST /ideas", () => {
    it("Responds with status 201, return new idea, and inserts new idea into database", () => {
      return supertest(app)
        .post("/ideas")
        .set("Authorization", "bearer " + process.env.API_TOKEN)
        .send({
          project_title: "Test Post Endpoint",
          project_summary:
            "Testing if the ideas endpoint will successfully post"
        })
        .expect(201);
    });
  });
});
