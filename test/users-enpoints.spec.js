const { expect } = require("chai");
const knex = require("knex");
const app = require("../src/app");
const { makeUsersArray, makeXssUser } = require("./fixtures");

describe("Users Endpoints", () => {
  let db;

  before("Make knex instance with test database", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DATABASE_URL
    });
    app.set("db", db);
  });

  after("Disconnect from test database", () => db.destroy());

  before("Clean table", () =>
    db.raw(`TRUNCATE comments, ideas, users RESTART IDENTITY CASCADE`)
  );
  afterEach("Remove data after each test", () =>
    db.raw(`TRUNCATE comments, ideas, users RESTART IDENTITY CASCADE`)
  );

  describe("GET /api/users", () => {
    context("No data in users table", () => {
      it("Returns an empty array and status 200", () => {
        return supertest(app)
          .get("/api/users")
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .expect(200, []);
      });
    });

    context("Data in the users table", () => {
      const testUsers = makeUsersArray();

      beforeEach("Insert test data", () => {
        return db("users").insert(testUsers);
      });

      it(`GET /api/users responds with status 200 and all of the users`, () => {
        return supertest(app)
          .get("/api/users")
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .expect(200, testUsers);
      });
    });
  });

  describe("GET /api/users/:id", () => {
    context("No data in users table", () => {
      it("Responds with error 404", () => {
        const noUserId = 200;
        return supertest(app)
          .get(`/api/users/${noUserId}`)
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .expect(404, { error: { message: "User doesn't exist" } });
      });
    });

    context("Data in the users table", () => {
      const testUsers = makeUsersArray();

      beforeEach("Insert test data", () => {
        return db("users").insert(testUsers);
      });
      it("GET /api/users/:id returns the user by id and status 200", () => {
        const queryId = 3;
        const expectedUser = testUsers[queryId - 1];
        return supertest(app)
          .get(`/api/users/${queryId}`)
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .expect(200, expectedUser);
      });
    });

    context("Given an XSS attack user", () => {
      const xssUser = makeXssUser();

      beforeEach("insert malicious user", () => {
        return db.into("users").insert(xssUser);
      });

      it("removes XSS content", () => {
        return supertest(app)
          .get(`/api/users/${xssUser[0].id}`)
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .expect(200)
          .expect(res => {
            expect(res.body.first_name).to.eql(
              '&lt;script&gt;alert("xss");&lt;/script&gt;'
            );
            expect(res.body.last_name).to.eql(
              '<img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.'
            );
            expect(res.body.email).to.eql(
              '&lt;script&gt;alert("xss");&lt;/script&gt;'
            );
            expect(res.body.password).to.eql(
              '&lt;script&gt;alert("xss");&lt;/script&gt;'
            );
            expect(res.body.nickname).to.eql(
              '&lt;script&gt;alert("xss");&lt;/script&gt;'
            );
          });
      });
    });
  });

  describe("POST /api/users", () => {
    it("Responds with status 201, return new user, and inserts new user into database", () => {
      const newUser = {
        first_name: "Test",
        last_name: "Post",
        email: "test.post@testing.com",
        password: "testyPost1!",
        nickname: "ElPosterOfTestiness1!"
      };
      return supertest(app)
        .post("/api/users")
        .set("Authorization", "bearer " + process.env.API_TOKEN)
        .send(newUser)
        .expect(201)
        .expect(res => {
          expect(res.body.first_name).to.eql(newUser.first_name);
          expect(res.body.last_name).to.eql(newUser.last_name);
          expect(res.body.email).to.eql(newUser.email);
          expect(res.body.password).to.eql(newUser.password);
          expect(res.body.nickname).to.eql(newUser.nickname);
          expect(res.body).to.have.property("id");
          expect(res.body).to.have.property("votes");
          expect(res.body).to.have.property("date_created");
          expect(res.headers.location).to.eql(`/api/users/${res.body.id}`);
        })
        .then(postRes =>
          supertest(app)
            .get(`/api/users/${postRes.body.id}`)
            .set("Authorization", "bearer " + process.env.API_TOKEN)
            .expect(postRes.body)
        );
    });

    const requiredFields = [
      "first_name",
      "last_name",
      "email",
      "password",
      "nickname"
    ];

    requiredFields.forEach(field => {
      const newUser = {
        first_name: "Test",
        last_name: "Post",
        email: "test.post@testing.com",
        password: "testyPost1!",
        nickname: "ElPosterOfTestiness1!"
      };

      it(`responds with status 400 when '${field}' is missing from request body`, () => {
        delete newUser[field];

        return supertest(app)
          .post("/api/users")
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .send(newUser)
          .expect(400, {
            error: { message: `Missing '${field}' in the request body` }
          });
      });
    });
  });

  describe("DELETE /api/users/:id", () => {
    context("no data in the users table", () => {
      it("responds with status 404", () => {
        const userId = 987654;
        return supertest(app)
          .delete(`/api/users/${userId}`)
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .expect(404, { error: { message: `User doesn't exist` } });
      });
    });

    context("data in the users table", () => {
      const testUsers = makeUsersArray();

      beforeEach("insert test data", () => {
        return db.into("users").insert(testUsers);
      });

      it("responds with status 204 and removes the user", () => {
        const userIdToRemove = 3;
        const expectedUsers = testUsers.filter(
          user => user.id !== userIdToRemove
        );
        return supertest(app)
          .delete(`/api/users/${userIdToRemove}`)
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .expect(204)
          .then(res =>
            supertest(app)
              .get("/api/users")
              .set("Authorization", "bearer " + process.env.API_TOKEN)
              .expect(expectedUsers)
          );
      });
    });
  });

  describe("PATCH /api/users/:id", () => {
    context("no data in users table", () => {
      it("responds with status 404", () => {
        const userId = 987654;
        return supertest(app)
          .patch(`/api/users${userId}`)
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .expect(404);
      });
    });

    context("data in users table", () => {
      const testUsers = makeUsersArray();

      beforeEach("insert test data", () => {
        return db.into("users").insert(testUsers);
      });

      it("responds with status 204 and updates the user", () => {
        const idToUpdate = 2;
        const updatedUser = {
          first_name: "Test",
          last_name: "Patch",
          email: "test.patch@patchtesting.com",
          nickname: "testyPatch"
        };
        const expectedUser = {
          ...testUsers[idToUpdate - 1],
          ...updatedUser
        };
        return supertest(app)
          .patch(`/api/users/${idToUpdate}`)
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .send(updatedUser)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/users/${idToUpdate}`)
              .set("Authorization", "bearer " + process.env.API_TOKEN)
              .expect(expectedUser)
          );
      });

      it("responds with status 400 when no required fields are supplied", () => {
        const idToUpdate = 2;
        return supertest(app)
          .patch(`/api/users/${idToUpdate}`)
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .send({ irrelevantField: "No Field Exists" })
          .expect(400, {
            error: {
              message:
                "Request body must contain first_name, last_name, email, nickname, and or password"
            }
          });
      });

      it("responds with status 204 when updating subset of fields", () => {
        const idToUpdate = 2;
        const updatedUser = {
          first_name: "Testy"
        };
        const expectedUser = {
          ...testUsers[idToUpdate - 1],
          ...updatedUser
        };
        return supertest(app)
          .patch(`/api/users/${idToUpdate}`)
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .send({
            ...updatedUser,
            fieldToIgnore: "Should not be in GET response"
          })
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/users/${idToUpdate}`)
              .set("Authorization", "bearer " + process.env.API_TOKEN)
              .expect(expectedUser)
          );
      });
    });
  });
});
