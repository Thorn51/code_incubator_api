const knex = require("knex");
const app = require("../src/app");
const { MakeUsersArray } = require("./fixtures");

describe.only("Auth Endpoints", () => {
  let describe;

  const testUsers = MakeUsersArray();
  const testUser = testUsers[0];

  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DATABASE_URL
    });
  });

  after("disconnect from db", () => db.destroy());

  before("cleanup", () => truncate("users"));

  before("Clean table", () =>
    db.raw(`TRUNCATE comments, ideas, users RESTART IDENTITY CASCADE`)
  );

  afterEach("Remove data after each test", () =>
    db.raw(`TRUNCATE comments, ideas, users RESTART IDENTITY CASCADE`)
  );

  describe("POST /api/auth/login", () => {
    beforeEach("insert users", () => {
      return db("users").insert(testUsers);
    });

    it("has a test");
  });
});
