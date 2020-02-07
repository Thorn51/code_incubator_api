const { expect } = require("chai");
const knex = require("knex");
const app = require("../src/app");
const { makeUsersArray, makeIdeasArray, makeXssIdea } = require("./fixtures");
const bcrypt = require("bcryptjs");

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

  before("Clean table", () =>
    db.raw(`TRUNCATE comments, ideas, users RESTART IDENTITY CASCADE`)
  );

  afterEach("Remove data after each test", () =>
    db.raw(`TRUNCATE comments, ideas, users RESTART IDENTITY CASCADE`)
  );

  function makeAuthHeader(user) {
    const token = Buffer.from(`${user.email}:${user.password}`).toString(
      "base64"
    );
    return `basic ${token}`;
  }

  function prepUsers(testUsers) {
    const preppedUsers = testUsers.map(user => ({
      ...user,
      password: bcrypt.hashSync(user.password)
    }));
    return preppedUsers;
  }

  describe("GET /api/ideas", () => {
    context("No data in ideas table", () => {
      it("Returns an empty array and status 200", () => {
        return supertest(app)
          .get("/api/ideas")
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .expect(200, []);
      });
    });

    context("Data in the ideas table", () => {
      const testUsers = makeUsersArray();
      const testIdeas = makeIdeasArray();

      beforeEach("Insert test data", () => {
        return db("users")
          .insert(prepUsers(testUsers))
          .then(() => {
            return db("ideas").insert(testIdeas);
          });
      });

      it(`GET /api/ideas responds with status 200 and all of the ideas`, () => {
        return supertest(app)
          .get("/api/ideas")
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .expect(200, testIdeas);
      });
    });
  });

  describe("Protected endpoints", () => {
    const testUsers = makeUsersArray();
    const testIdeas = makeIdeasArray();

    beforeEach("Insert test data", () => {
      return db("users")
        .insert(prepUsers(testUsers))
        .then(() => {
          return db("ideas").insert(testIdeas);
        });
    });

    const protectedEndpoints = [
      {
        name: "GET /api/articles/:id",
        path: "/api/ideas/1",
        method: supertest(app).get
      },
      {
        name: "POST /api/ideas",
        path: "/api/ideas",
        method: supertest(app).post
      },
      {
        name: "DELETE /api/ideas/:id",
        path: "/api/ideas/1",
        method: supertest(app).delete
      },
      {
        name: "PATCH /api/ideas/:id",
        path: "/api/ideas/1",
        method: supertest(app).patch
      }
    ];

    protectedEndpoints.forEach(endpoint => {
      describe(endpoint.name, () => {
        it("responds with status 401 'Missing basic token' when no basic token", () => {
          return endpoint
            .method(endpoint.path)
            .expect(401, { error: "Missing basic token" });
        });
        it("responds with status 401 'Unauthorized request' when no credentials", () => {
          const userNoCredentials = { email: "", password: "" };
          return endpoint
            .method(endpoint.path)
            .set("Authorization", makeAuthHeader(userNoCredentials))
            .expect(401, { error: "Unauthorized request" });
        });
        it("responds with status 401 'Unauthorized request' when invalid user", () => {
          const userInvalidCredentials = {
            email: "Invalid",
            password: "Invalid"
          };
          return endpoint
            .method(endpoint.path)
            .set("Authorization", makeAuthHeader(userInvalidCredentials))
            .expect(401, { error: "Unauthorized request" });
        });
        it("responds with status 401 'Unauthorized request' when invalid password", () => {
          const userInvalidPassword = {
            email: testUsers[0].email,
            password: "Invalid"
          };
          return endpoint
            .method(endpoint.path)
            .set("Authorization", makeAuthHeader(userInvalidPassword))
            .expect(401, { error: "Unauthorized request" });
        });
      });
    });
  });

  describe("GET /api/ideas/:id", () => {
    const testUsers = makeUsersArray();
    context("No data in ideas table", () => {
      beforeEach(() => {
        return db.into("users").insert(prepUsers(testUsers));
      });
      it("Responds with error 404", () => {
        return supertest(app)
          .get(`/api/ideas/200`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(404, { error: { message: "Idea doesn't exist" } });
      });
    });

    context("Data in the ideas table", () => {
      const testUsers = makeUsersArray();
      const testIdeas = makeIdeasArray();

      beforeEach("Insert test data", () => {
        return db("users")
          .insert(prepUsers(testUsers))
          .then(() => {
            return db("ideas").insert(testIdeas);
          });
      });

      it("GET /api/ideas/:id returns the idea by id and status 200", () => {
        const queryId = 3;
        const expectedIdea = testIdeas[queryId - 1];
        return supertest(app)
          .get(`/api/ideas/${queryId}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(200, expectedIdea);
      });
    });

    context("Given an XSS attack idea", () => {
      const testUsers = makeUsersArray();
      const xssIdea = makeXssIdea();

      beforeEach("Insert test data", () => {
        return db("users")
          .insert(prepUsers(testUsers))
          .then(() => {
            return db("ideas").insert(xssIdea);
          });
      });

      it("removes XSS content", () => {
        return supertest(app)
          .get(`/api/ideas/${xssIdea[0].id}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(200)
          .expect(res => {
            expect(res.body.project_title).to.eql(
              '&lt;script&gt;alert("xss");&lt;/script&gt;'
            );
            expect(res.body.project_summary).to.eql(
              '<img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.'
            );
          });
      });
    });
  });

  describe("POST /api/ideas", () => {
    const testUsers = makeUsersArray();
    beforeEach(() => {
      return db.into("users").insert(prepUsers(testUsers));
    });
    it("Responds with status 201, return new idea, and inserts new idea into database", () => {
      const newIdea = {
        project_title: "Test Post Endpoint",
        project_summary: "Testing if the ideas endpoint will successfully post"
      };
      return supertest(app)
        .post("/api/ideas")
        .set("Authorization", makeAuthHeader(testUsers[0]))
        .send(newIdea)
        .expect(201)
        .expect(res => {
          expect(res.body.project_title).to.eql(newIdea.project_title);
          expect(res.body.project_summary).to.eql(newIdea.project_summary);
          expect(res.body).to.have.property("id");
          expect(res.body).to.have.property("votes");
          expect(res.body).to.have.property("date_submitted");
          expect(res.body).to.have.property("status");
          expect(res.body).to.have.property("votes");
          expect(res.headers.location).to.eql(`/api/ideas/${res.body.id}`);
        })
        .then(postRes =>
          supertest(app)
            .get(`/api/ideas/${postRes.body.id}`)
            .set("Authorization", makeAuthHeader(testUsers[0]))
            .expect(postRes.body)
        );
    });

    const requiredFields = ["project_title", "project_summary"];

    requiredFields.forEach(field => {
      const newIdea = {
        project_title: "Test Idea Post",
        project_summary:
          "Test that the validation checks are working properly to ensure required fields are submitted."
      };

      it(`responds with status 400 when '${field}' is missing from request body`, () => {
        delete newIdea[field];

        return supertest(app)
          .post("/api/ideas")
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .send(newIdea)
          .expect(400, {
            error: { message: `Missing '${field}' in request body.` }
          });
      });
    });
  });

  describe("DELETE /api/ideas/:id", () => {
    const testUsers = makeUsersArray();
    context("no data in the ideas table", () => {
      before(() => {
        return db.into("users").insert(prepUsers(testUsers));
      });
      it("responds with status 404", () => {
        const ideaId = 987654;
        return supertest(app)
          .delete(`/api/ideas/${ideaId}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(404, { error: { message: `Idea doesn't exist` } });
      });
    });

    context("data in the ideas table", () => {
      const testUsers = makeUsersArray();
      const testIdeas = makeIdeasArray();

      beforeEach("Insert test data", () => {
        return db("users")
          .insert(prepUsers(testUsers))
          .then(() => {
            return db("ideas").insert(testIdeas);
          });
      });

      it("responds with status 204 and removes the idea", () => {
        const ideaIdToRemove = 3;
        const expectedIdeas = testIdeas.filter(
          idea => idea.id !== ideaIdToRemove
        );
        return supertest(app)
          .delete(`/api/ideas/${ideaIdToRemove}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(204)
          .then(res =>
            supertest(app)
              .get("/api/ideas")
              .set("Authorization", `bearer ${process.env.API_TOKEN}`)
              .expect(expectedIdeas)
          );
      });
    });
  });

  describe("PATCH /api/ideas/:id", () => {
    const testUsers = makeUsersArray();
    context("no data in ideas table", () => {
      it("responds with status 404", () => {
        const ideaId = 987654;
        return supertest(app)
          .patch(`/api/ideas${ideaId}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(404);
      });
    });

    context("data in ideas table", () => {
      const testUsers = makeUsersArray();
      const testIdeas = makeIdeasArray();

      beforeEach("Insert test data", () => {
        return db("users")
          .insert(prepUsers(testUsers))
          .then(() => {
            return db("ideas").insert(testIdeas);
          });
      });

      it("responds with status 200 and updates the idea", () => {
        const idToUpdate = 2;
        const updatedIdea = {
          project_title: "Test Patch",
          project_summary: "Testing the patch endpoint for editing ideas.",
          status: "In-Development"
        };
        const expectedIdea = {
          ...testIdeas[idToUpdate - 1],
          ...updatedIdea
        };
        return supertest(app)
          .patch(`/api/ideas/${idToUpdate}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .send(updatedIdea)
          .expect(200, { info: "Request completed" })
          .then(res =>
            supertest(app)
              .get(`/api/ideas/${idToUpdate}`)
              .set("Authorization", makeAuthHeader(testUsers[0]))
              .expect(expectedIdea)
          );
      });

      it("responds with status 400 when no required fields are supplied", () => {
        const idToUpdate = 2;
        return supertest(app)
          .patch(`/api/ideas/${idToUpdate}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .send({ irrelevantField: "No Field Exists" })
          .expect(400, {
            error: {
              message:
                "Request body must contain project_title, project_summary, status, and or votes"
            }
          });
      });

      it("responds with status 200 when updating a subset of fields", () => {
        const idToUpdate = 2;
        const updateIdea = {
          project_title: "Test Patch on Title"
        };
        const expectedIdea = {
          ...testIdeas[idToUpdate - 1],
          ...updateIdea
        };
        return supertest(app)
          .patch(`/api/ideas/${idToUpdate}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .send({
            ...updateIdea,
            fieldToIgnore: "Should not be in GET response"
          })
          .expect(200, { info: "Request completed" })
          .then(res =>
            supertest(app)
              .get(`/api/ideas/${idToUpdate}`)
              .set("Authorization", makeAuthHeader(testUsers[0]))
              .expect(expectedIdea)
          );
      });
    });
  });
});
