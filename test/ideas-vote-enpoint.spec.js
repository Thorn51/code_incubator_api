const { expect } = require("chai");
const knex = require("knex");
const app = require("../src/app");
const {
  makeCommentsArray,
  makeUsersArray,
  makeIdeasArray,
  makeIdeaVoteArray
} = require("./fixtures");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

describe("Idea Vote Endpoints", () => {
  let db;

  before("Make knex instance with test database", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DATABASE_URL
    });
    app.set("db", db);
  });

  after("Disconnect from test database", () => db.destroy());

  before("Remove data from table", () =>
    db.raw(
      "TRUNCATE idea_vote, idea_vote, comments, ideas, users RESTART IDENTITY CASCADE"
    )
  );

  afterEach(() =>
    db.raw(
      "TRUNCATE idea_vote, idea_vote, comments, ideas, users RESTART IDENTITY CASCADE"
    )
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
    const testIdeas = makeIdeasArray();
    const testComments = makeCommentsArray();
    const testIdeaVote = makeIdeaVoteArray();

    beforeEach("Insert test data", () => {
      return db("users")
        .insert(prepUsers(testUsers))
        .then(() => {
          return db
            .into("ideas")
            .insert(testIdeas)
            .then(() => {
              return db
                .into("comments")
                .insert(testComments)
                .then(() => {
                  return db("idea_vote").insert(testIdeaVote);
                });
            });
        });
    });

    const protectedEndpoints = [
      {
        name: "GET /api/idea/vote",
        path: "/api/idea/vote",
        method: supertest(app).get
      },
      {
        name: "GET /api/idea/vote/:id",
        path: "/api/idea/vote/1",
        method: supertest(app).get
      },
      {
        name: "POST /api/idea/vote",
        path: "/api/idea/vote",
        method: supertest(app).post
      },
      {
        name: "DELETE /api/idea/vote/:id",
        path: "/api/idea/vote/1",
        method: supertest(app).delete
      },
      {
        name: "PATCH /api/idea/vote/:id",
        path: "/api/idea/vote/1",
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
        it("responds with status 401 'Unauthorized request' invalid JWT secret", () => {
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

  describe("GET /api/idea/vote", () => {
    context("No data in idea_vote table", () => {
      const testUsers = makeUsersArray();
      before("insert users", () => {
        return db("users").insert(prepUsers(testUsers));
      });
      it("Returns an empty array and status 200", () => {
        return supertest(app)
          .get("/api/idea/vote")
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(200, []);
      });
    });

    context("Data in tables", () => {
      const testUsers = makeUsersArray();
      const testIdeas = makeIdeasArray();
      const testComments = makeCommentsArray();
      const testIdeaVote = makeIdeaVoteArray();

      beforeEach("Insert test data", () => {
        return db("users")
          .insert(prepUsers(testUsers))
          .then(() => {
            return db
              .into("ideas")
              .insert(testIdeas)
              .then(() => {
                return db
                  .into("comments")
                  .insert(testComments)
                  .then(() => {
                    return db("idea_vote").insert(testIdeaVote);
                  });
              });
          });
      });

      it(`GET /api/idea/vote responds with status 200 and all of the comments`, () => {
        return supertest(app)
          .get("/api/idea/vote")
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(200, testIdeaVote);
      });
    });
  });

  describe("GET /api/idea/vote/:id", () => {
    const testUsers = makeUsersArray();
    before("insert users", () => {
      return db("users").insert(prepUsers(testUsers));
    });
    context("No data in idea_vote table", () => {
      it("Responds with error 404", () => {
        const noCommentId = 200;
        return supertest(app)
          .get(`/api/idea/vote/${noCommentId}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(404, { error: { message: "Vote doesn't exist" } });
      });
    });

    context("Data in the comments table", () => {
      const testUsers = makeUsersArray();
      const testIdeas = makeIdeasArray();
      const testComments = makeCommentsArray();
      const testIdeaVote = makeIdeaVoteArray();

      beforeEach("Insert test data", () => {
        return db("users")
          .insert(prepUsers(testUsers))
          .then(() => {
            return db
              .into("ideas")
              .insert(testIdeas)
              .then(() => {
                return db
                  .into("comments")
                  .insert(testComments)
                  .then(() => {
                    return db("idea_vote").insert(testIdeaVote);
                  });
              });
          });
      });

      it("GET /api/idea/vote/:id returns the vote by id and status 200", () => {
        const queryId = 3;
        const expectedVote = testIdeaVote[queryId - 1];
        return supertest(app)
          .get(`/api/idea/vote/${queryId}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(200, expectedVote);
      });
    });
  });

  describe("POST /api/idea/vote", () => {
    const testUsers = makeUsersArray();
    const testIdeas = makeIdeasArray();
    const testComments = makeCommentsArray();

    beforeEach("Insert test data", () => {
      return db("users")
        .insert(prepUsers(testUsers))
        .then(() => {
          return db
            .into("ideas")
            .insert(testIdeas)
            .then(() => {
              return db("comments").insert(testComments);
            });
        });
    });
    it("Responds with status 201, return new vote, and inserts new vote into database", () => {
      const newVote = {
        vote: "1",
        idea_id: 1
      };
      return supertest(app)
        .post("/api/idea/vote")
        .set("Authorization", makeAuthHeader(testUsers[0]))
        .send(newVote)
        .expect(201)
        .expect(res => {
          expect(res.body.vote).to.eql(newVote.vote);
          expect(res.body.idea).to.eql(newVote.idea_id);
          expect(res.body.vote_by_user).to.eql(testUsers[0].id);
          expect(res.body).to.have.property("id");
          expect(res.headers.location).to.eql(`/api/idea/vote/${res.body.id}`);
        })
        .then(postRes =>
          supertest(app)
            .get(`/api/idea/vote/${postRes.body.id}`)
            .set("Authorization", makeAuthHeader(testUsers[0]))
            .expect(postRes.body)
        );
    });

    it(`responds with status 400 when 'vote' is missing from request body`, () => {
      return supertest(app)
        .post("/api/idea/vote")
        .set("Authorization", makeAuthHeader(testUsers[0]))
        .send({})
        .expect(400, {
          error: { message: `Missing 'vote' in the request body` }
        });
    });
  });

  describe("DELETE /api/idea/vote/:id", () => {
    const testUsers = makeUsersArray();
    context("no data in the idea_vote table", () => {
      before("insert users", () => {
        return db("users").insert(prepUsers(testUsers));
      });
      it("responds with status 404", () => {
        const commentId = 987654;
        return supertest(app)
          .delete(`/api/idea/vote/${commentId}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(404, { error: { message: `Vote doesn't exist` } });
      });
    });

    context("data in the tables", () => {
      const testUsers = makeUsersArray();
      const testIdeas = makeIdeasArray();
      const testComments = makeCommentsArray();
      const testIdeaVote = makeIdeaVoteArray();

      beforeEach("Insert test data", () => {
        return db("users")
          .insert(prepUsers(testUsers))
          .then(() => {
            return db
              .into("ideas")
              .insert(testIdeas)
              .then(() => {
                return db
                  .into("comments")
                  .insert(testComments)
                  .then(() => {
                    return db("idea_vote").insert(testIdeaVote);
                  });
              });
          });
      });

      it("responds with status 204 and removes the vote", () => {
        const voteIdToRemove = 3;
        const expectedVotes = testIdeaVote.filter(
          vote => vote.id !== voteIdToRemove
        );
        return supertest(app)
          .delete(`/api/idea/vote/${voteIdToRemove}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(204)
          .then(res =>
            supertest(app)
              .get("/api/idea/vote")
              .set("Authorization", makeAuthHeader(testUsers[0]))
              .expect(expectedVotes)
          );
      });
    });
  });

  describe("PATCH /api/idea/vote/:id", () => {
    const testUsers = makeUsersArray();
    before("insert users", () => {
      return db("users").insert(prepUsers(testUsers));
    });
    context("no data in idea_vote table", () => {
      it("responds with status 404", () => {
        const commentId = 987654;
        return supertest(app)
          .patch(`/api/idea/vote${commentId}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(404);
      });
    });

    context("data in idea_vote table", () => {
      const testUsers = makeUsersArray();
      const testIdeas = makeIdeasArray();
      const testComments = makeCommentsArray();
      const testIdeaVote = makeIdeaVoteArray();

      beforeEach("Insert test data", () => {
        return db("users")
          .insert(prepUsers(testUsers))
          .then(() => {
            return db
              .into("ideas")
              .insert(testIdeas)
              .then(() => {
                return db
                  .into("comments")
                  .insert(testComments)
                  .then(() => {
                    return db("idea_vote").insert(testIdeaVote);
                  });
              });
          });
      });

      it("responds with status 204 and updates the vote", () => {
        const idToUpdate = 2;
        const updatedVote = {
          vote: "-1"
        };
        const expectedVote = {
          ...testIdeaVote[idToUpdate - 1],
          ...updatedVote
        };
        return supertest(app)
          .patch(`/api/idea/vote/${idToUpdate}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .send(updatedVote)
          .expect(200, { info: "Request completed" })
          .then(res =>
            supertest(app)
              .get(`/api/idea/vote/${idToUpdate}`)
              .set("Authorization", makeAuthHeader(testUsers[0]))
              .expect(expectedVote)
          );
      });

      it("responds with status 400 when no required fields are supplied", () => {
        const idToUpdate = 2;
        return supertest(app)
          .patch(`/api/idea/vote/${idToUpdate}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .send({ irrelevantField: "No Field Exists" })
          .expect(400, {
            error: {
              message: "Request body must contain 'vote'"
            }
          });
      });
    });
  });
});
