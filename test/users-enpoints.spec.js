const { expect } = require("chai");
const knex = require("knex");
const app = require("../src/app");
const { makeUsersArray, makeXssUser } = require("./fixtures");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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

  function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
    const token = jwt.sign({ user_id: user.id }, secret, {
      subject: user.email,
      algorithm: "HS256"
    });
    return `Bearer ${token}`;
  }

  function prepUsers(testUsers) {
    const preppedUsers = testUsers.map(user => ({
      ...user,
      password: bcrypt.hashSync(user.password)
    }));
    return preppedUsers;
  }

  describe("Protected endpoints", () => {
    const testUsers = makeUsersArray();

    beforeEach("Insert test data", () => {
      return db("users").insert(prepUsers(testUsers));
    });

    const protectedEndpoints = [
      {
        name: "GET /api/users/:id",
        path: "/api/users/1",
        method: supertest(app).get
      },
      {
        name: "DELETE /api/users/:id",
        path: "/api/users/1",
        method: supertest(app).delete
      },
      {
        name: "PATCH /api/users/:id",
        path: "/api/users/1",
        method: supertest(app).patch
      }
    ];

    protectedEndpoints.forEach(endpoint => {
      describe(endpoint.name, () => {
        it("responds with status 401 'Missing bearer token' when no bearer token", () => {
          return endpoint
            .method(endpoint.path)
            .expect(401, { error: "Missing bearer token" });
        });
        it("responds with status 401 'Unauthorized request' when invalid JWT secret", () => {
          const validUser = testUsers[0];
          const invalidSecret = "Invalid";
          return endpoint
            .method(endpoint.path)
            .set("Authorization", makeAuthHeader(validUser, invalidSecret))
            .expect(401, { error: "Unauthorized request" });
        });
        it("responds with status 401 'Unauthorized request' when invalid sub in payload", () => {
          const userInvalidCredentials = {
            email: "Invalid",
            id: 1
          };
          return endpoint
            .method(endpoint.path)
            .set("Authorization", makeAuthHeader(userInvalidCredentials))
            .expect(401, { error: "Unauthorized request" });
        });
      });
    });
  });

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
        return db("users").insert(prepUsers(testUsers));
      });

      it(`GET /api/users responds with status 200 and all of the users`, () => {
        return supertest(app)
          .get("/api/users")
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .expect(200)
          .then(res => {
            expect(res.body.first_name).to.eql(testUsers.first_name);
            expect(res.body.last_name).to.eql(testUsers.last_name);
            expect(res.body.nickname).to.eql(testUsers.nickname);
            expect(res.body.email).to.eql(testUsers.email);
          });
      });
    });
  });

  describe("GET /api/users/:id", () => {
    const testUsers = makeUsersArray();
    before("insert users for authorization", () => {
      return db("users").insert(prepUsers(testUsers));
    });
    context("No user table", () => {
      it("Responds with error 404", () => {
        const noUserId = testUsers.length + 10;
        return supertest(app)
          .get(`/api/users/${noUserId}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(404, { error: { message: "User doesn't exist" } });
      });
    });

    context("Data in the users table", () => {
      const testUsers = makeUsersArray();

      beforeEach("Insert test data", () => {
        return db("users").insert(prepUsers(testUsers));
      });
      it("GET /api/users/:id returns the user by id and status 200", () => {
        const queryId = 3;
        const expectedUser = testUsers[queryId - 1];
        return supertest(app)
          .get(`/api/users/${queryId}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(200)
          .then(res => {
            expect(res.body.first_name).to.eql(expectedUser.first_name);
            expect(res.body.last_name).to.eql(expectedUser.last_name);
            expect(res.body.email).to.eql(expectedUser.email);
            expect(res.body.nickname).to.eql(expectedUser.nickname);
            expect(res.body).to.have.property("id");
            expect(res.body).to.have.property("votes");
            expect(res.body).to.have.property("date_created");
          });
      });
    });

    context("Given an XSS attack user", () => {
      const xssUser = makeXssUser();

      beforeEach("insert malicious user", () => {
        return db.into("users").insert(prepUsers(xssUser));
      });

      it("removes XSS content", () => {
        return supertest(app)
          .get(`/api/users/${xssUser[1].id}`)
          .set("Authorization", makeAuthHeader(xssUser[0]))
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
            expect(res.body.nickname).to.eql(
              '&lt;script&gt;alert("xss");&lt;/script&gt;'
            );
          });
      });
    });
  });

  describe("POST /api/users", () => {
    context("user validation", () => {
      const testUsers = makeUsersArray();
      const testUser = testUsers[0];

      beforeEach("insert users", () => {
        return db("users").insert(testUsers);
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
              error: `Missing '${field}' in the request body`
            });
        });
      });
      it("responds with status 400 when password less than 8 characters", () => {
        const shortPassword = {
          first_name: "Test",
          last_name: "Post",
          email: "test.post@testing.com",
          password: "Post1!",
          nickname: "ElPosterOfTestiness1!"
        };
        return supertest(app)
          .post("/api/users")
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .send(shortPassword)
          .expect(400, {
            error: "Password must be longer than 8 characters"
          });
      });
      it("responds with status 400 when password is greater than 64 characters", () => {
        const shortPassword = {
          first_name: "Test",
          last_name: "Post",
          email: "test.post@testing.com",
          password: "*".repeat(65),
          nickname: "ElPosterOfTestiness1!"
        };
        return supertest(app)
          .post("/api/users")
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .send(shortPassword)
          .expect(400, {
            error: "Password must be less than 64 characters"
          });
      });
      it("responds with status 400 when password starts with space", () => {
        const passwordStartsWithSpace = {
          first_name: "Test",
          last_name: "Post",
          email: "test.post@testing.com",
          password: " testyPost1!",
          nickname: "ElPosterOfTestiness1!"
        };
        return supertest(app)
          .post("/api/users")
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .send(passwordStartsWithSpace)
          .expect(400, {
            error: "Password must not start or end with empty spaces"
          });
      });
      it("responds with status 400 when password ends with space", () => {
        const passwordEndsWithSpace = {
          first_name: "Test",
          last_name: "Post",
          email: "test.post@testing.com",
          password: "testyPost1! ",
          nickname: "ElPosterOfTestiness1!"
        };
        return supertest(app)
          .post("/api/users")
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .send(passwordEndsWithSpace)
          .expect(400, {
            error: "Password must not start or end with empty spaces"
          });
      });
      it("responds with status 400 when password does not contain one upper case, lower case, number, and special character", () => {
        const passwordNotComplex = {
          first_name: "Test",
          last_name: "Post",
          email: "test.post@testing.com",
          password: "testyPost1",
          nickname: "ElPosterOfTestiness1!"
        };
        return supertest(app)
          .post("/api/users")
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .send(passwordNotComplex)
          .expect(400, {
            error:
              "Password must contain 1 upper case, lower case, number, and special character"
          });
      });
      it("responds with status 400 when invalid email submitted", () => {
        const invalidEmail = {
          first_name: "Test",
          last_name: "Post",
          email: "test.posttesting.com",
          password: "testyPost1!",
          nickname: "ElPosterOfTestiness1!"
        };
        return supertest(app)
          .post("/api/users")
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .send(invalidEmail)
          .expect(400, {
            error: "Invalid email address"
          });
      });
      it("responds with status 400 when user email already in database", () => {
        const duplicateUser = {
          first_name: testUser.first_name,
          last_name: testUser.last_name,
          email: testUser.email,
          password: "testyPost1!",
          nickname: testUser.nickname
        };
        return supertest(app)
          .post("/api/users")
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .send(duplicateUser)
          .expect(400, {
            error: "The email is already taken"
          });
      });
    });

    context("Happy path", () => {
      it("responds with status 201, serialized user, strong bcrypt password", () => {
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
            expect(res.body).to.have.property("id");
            expect(res.body.first_name).to.eql(newUser.first_name);
            expect(res.body.last_name).to.eql(newUser.last_name);
            expect(res.body.email).to.eq(newUser.email);
            expect(res.body.nickname).to.eq(newUser.nickname);
            expect(res.body).to.not.have.property("password");
            expect(res.headers.location).to.eql(`/api/users/${res.body.id}`);
            const expectedDate = new Date().toLocaleString("en", {
              timeZone: "UTC"
            });
            const actualDate = new Date(res.body.date_created).toLocaleString();
            expect(actualDate).to.eql(expectedDate);
          })
          .expect(res =>
            db("users")
              .select("*")
              .where({ id: res.body.id })
              .first()
              .then(row => {
                expect(row.first_name).to.eql(newUser.first_name);
                expect(row.last_name).to.eql(newUser.last_name);
                expect(row.email).to.eq(newUser.email);
                expect(row.nickname).to.eq(newUser.nickname);
                const expectedDate = new Date().toLocaleString("en", {
                  timeZone: "UTC"
                });
                const actualDate = new Date(
                  res.body.date_created
                ).toLocaleString();
                expect(actualDate).to.eql(expectedDate);

                return bcrypt.compare(newUser.password, row.password);
              })
              .then(compareMatch => {
                expect(compareMatch).to.be.true;
              })
          );
      });
    });
  });

  describe("DELETE /api/users/:id", () => {
    const testUsers = makeUsersArray();
    before("insert test users for authorization", () => {
      return db("users").insert(prepUsers(testUsers));
    });
    context("no data in the users table", () => {
      it("responds with status 404", () => {
        const userId = 987654;
        return supertest(app)
          .delete(`/api/users/${userId}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(404, { error: { message: `User doesn't exist` } });
      });
    });

    context("data in the users table", () => {
      const testUsers = makeUsersArray();

      beforeEach("insert test data", () => {
        return db.into("users").insert(prepUsers(testUsers));
      });

      it("responds with status 204 and removes the user", () => {
        const userIdToRemove = 3;
        const expectedUsers = testUsers.filter(
          user => user.id !== userIdToRemove
        );
        return supertest(app)
          .delete(`/api/users/${userIdToRemove}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(204)
          .then(res =>
            supertest(app)
              .get("/api/users")
              .set("Authorization", `bearer ${process.env.API_TOKEN}`)
              .then(res => {
                expect(res.body.id).to.eql(expectedUsers.id);
              })
          );
      });
    });
  });

  describe("PATCH /api/users/:id", () => {
    const testUsers = makeUsersArray();
    before("insert users for authorization", () => {
      return db("users").insert(prepUsers(testUsers));
    });
    context("no user in table", () => {
      it("responds with status 404", () => {
        const userId = 987654;
        return supertest(app)
          .patch(`/api/users${userId}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(404);
      });
    });

    context("data in users table", () => {
      const testUsers = makeUsersArray();

      beforeEach("insert test data", () => {
        return db.into("users").insert(prepUsers(testUsers));
      });

      it("responds with status 204 and updates the user", () => {
        const idToUpdate = 2;
        const updatedUser = {
          first_name: "Test",
          last_name: "Patch",
          email: "test.patch@patchtesting.com",
          nickname: "testyPatch"
        };
        return supertest(app)
          .patch(`/api/users/${idToUpdate}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .send(updatedUser)
          .expect(200, { info: "Request completed" });
      });

      it("responds with status 400 when no required fields are supplied", () => {
        const idToUpdate = 2;
        return supertest(app)
          .patch(`/api/users/${idToUpdate}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
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
        return supertest(app)
          .patch(`/api/users/${idToUpdate}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .send({
            ...updatedUser,
            fieldToIgnore: "Should not be in GET response"
          })
          .expect(200, { info: "Request completed" });
      });
    });
  });
});
