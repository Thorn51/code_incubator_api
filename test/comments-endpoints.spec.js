const { expect } = require("chai");
const knex = require("knex");
const app = require("../src/app");
const {
  makeCommentsArray,
  makeXssComment,
  makeUsersArray,
  makeIdeasArray
} = require("./fixtures");

describe("Comments Endpoints", () => {
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
    db.raw("TRUNCATE comments, ideas, users RESTART IDENTITY CASCADE")
  );

  afterEach(() =>
    db.raw("TRUNCATE comments, ideas, users RESTART IDENTITY CASCADE")
  );

  describe.only("GET /api/comments", () => {
    context("No data in comments table", () => {
      it("Returns an empty array and status 200", () => {
        return supertest(app)
          .get("/api/comments")
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .expect(200, []);
      });
    });

    context("Data in the comments table", () => {
      const testUsers = makeUsersArray();
      const testIdeas = makeIdeasArray();
      const testComments = makeCommentsArray();

      beforeEach("Insert test data", () => {
        return db("users")
          .insert(testUsers)
          .then(() => {
            return db
              .into("ideas")
              .insert(testIdeas)
              .then(() => {
                return db.into("comments").insert(testComments);
              });
          });
      });

      it(`GET /api/comments responds with status 200 and all of the comments`, () => {
        return supertest(app)
          .get("/api/comments")
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .expect(200, testComments);
      });
    });
  });

  describe("GET /api/comments/:id", () => {
    context("No data in comments table", () => {
      it("Responds with error 404", () => {
        const noCommentId = 200;
        return supertest(app)
          .get(`/api/comments/${noCommentId}`)
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .expect(404, { error: { message: "Comment doesn't exist" } });
      });
    });

    context("Data in the comments table", () => {
      const testComments = makeCommentsArray();

      beforeEach("Insert test data", () => {
        return db("comments").insert(testComments);
      });
      it("GET /api/comments/:id returns the comment by id and status 200", () => {
        const queryId = 3;
        const expectedComment = testComments[queryId - 1];
        return supertest(app)
          .get(`/api/comments/${queryId}`)
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .expect(200, expectedComment);
      });
    });

    context("Given an XSS attack comment", () => {
      const xssComment = makeXssComment();

      beforeEach("insert malicious comment", () => {
        return db.into("comments").insert(xssComment);
      });

      it("removes XSS content", () => {
        return supertest(app)
          .get(`/api/comments/${xssComment[0].id}`)
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

  describe("POST /api/comments", () => {
    it("Responds with status 201, return new comment, and inserts new comment into database", () => {
      const newComment = {
        first_name: "Test",
        last_name: "Post",
        email: "test.post@testing.com",
        password: "testyPost1!",
        nickname: "ElPosterOfTestiness1!"
      };
      return supertest(app)
        .post("/api/comments")
        .set("Authorization", "bearer " + process.env.API_TOKEN)
        .send(newComment)
        .expect(201)
        .expect(res => {
          expect(res.body.first_name).to.eql(newComment.first_name);
          expect(res.body.last_name).to.eql(newComment.last_name);
          expect(res.body.email).to.eql(newComment.email);
          expect(res.body.password).to.eql(newComment.password);
          expect(res.body.nickname).to.eql(newComment.nickname);
          expect(res.body).to.have.property("id");
          expect(res.body).to.have.property("votes");
          expect(res.body).to.have.property("date_created");
          expect(res.headers.location).to.eql(`/api/comments/${res.body.id}`);
        })
        .then(postRes =>
          supertest(app)
            .get(`/api/comments/${postRes.body.id}`)
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
      const newComment = {
        first_name: "Test",
        last_name: "Post",
        email: "test.post@testing.com",
        password: "testyPost1!",
        nickname: "ElPosterOfTestiness1!"
      };

      it(`responds with status 400 when '${field}' is missing from request body`, () => {
        delete newComment[field];

        return supertest(app)
          .post("/api/comments")
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .send(newComment)
          .expect(400, {
            error: { message: `Missing '${field}' in the request body` }
          });
      });
    });
  });

  describe("DELETE /api/comments/:id", () => {
    context("no data in the comments table", () => {
      it("responds with status 404", () => {
        const commentId = 987654;
        return supertest(app)
          .delete(`/api/comments/${commentId}`)
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .expect(404, { error: { message: `Comment doesn't exist` } });
      });
    });

    context("data in the comments table", () => {
      const testComments = makeCommentsArray();

      beforeEach("insert test data", () => {
        return db.into("comments").insert(testComments);
      });

      it("responds with status 204 and removes the comment", () => {
        const commentIdToRemove = 3;
        const expectedComments = testComments.filter(
          comment => comment.id !== commentIdToRemove
        );
        return supertest(app)
          .delete(`/api/comments/${commentIdToRemove}`)
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .expect(204)
          .then(res =>
            supertest(app)
              .get("/api/comments")
              .set("Authorization", "bearer " + process.env.API_TOKEN)
              .expect(expectedComments)
          );
      });
    });
  });

  describe("PATCH /api/comments/:id", () => {
    context("no data in comments table", () => {
      it("responds with status 404", () => {
        const commentId = 987654;
        return supertest(app)
          .patch(`/api/comments${commentId}`)
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .expect(404);
      });
    });

    context("data in comments table", () => {
      const testComments = makeCommentsArray();

      beforeEach("insert test data", () => {
        return db.into("comments").insert(testComments);
      });

      it("responds with status 204 and updates the comment", () => {
        const idToUpdate = 2;
        const updatedComment = {
          first_name: "Test",
          last_name: "Patch",
          email: "test.patch@patchtesting.com",
          nickname: "testyPatch"
        };
        const expectedComment = {
          ...testComments[idToUpdate - 1],
          ...updatedComment
        };
        return supertest(app)
          .patch(`/api/comments/${idToUpdate}`)
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .send(updatedComment)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/comments/${idToUpdate}`)
              .set("Authorization", "bearer " + process.env.API_TOKEN)
              .expect(expectedComment)
          );
      });

      it("responds with status 400 when no required fields are supplied", () => {
        const idToUpdate = 2;
        return supertest(app)
          .patch(`/api/comments/${idToUpdate}`)
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
        const updatedComment = {
          first_name: "Testy"
        };
        const expectedComment = {
          ...testComments[idToUpdate - 1],
          ...updatedComment
        };
        return supertest(app)
          .patch(`/api/comments/${idToUpdate}`)
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .send({
            ...updatedComment,
            fieldToIgnore: "Should not be in GET response"
          })
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/comments/${idToUpdate}`)
              .set("Authorization", "bearer " + process.env.API_TOKEN)
              .expect(expectedComment)
          );
      });
    });
  });
});
