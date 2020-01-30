const IdeasService = require("../src/ideas/ideas-service");
const knex = require("knex");
const { makeIdeasArray } = require("../test/fixtures");

describe.skip("Ideas service object", () => {
  let db;

  let testIdeas = makeIdeasArray();

  before(() => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DATABASE_URL
    });
  });

  before(() => db("ideas").truncate());

  after(() => db.destroy());

  afterEach(() => db("ideas").truncate());

  context("Given 'ideas' table has no data", () => {
    it("getAllIdeas() returns an empty array", () => {
      return IdeasService.getAllIdeas(db).then(actual => {
        expect(actual).to.eql([]);
      });
    });

    it("insertIdea() inserts and returns a new idea", () => {
      const newIdea = testIdeas[0];
      return IdeasService.insertIdea(db, newIdea).then(actual => {
        expect(actual).to.eql({
          id: 1,
          project_title: newIdea.project_title,
          project_summary: newIdea.project_summary,
          date_submitted: newIdea.date_submitted,
          status: newIdea.status,
          github: newIdea.github,
          votes: newIdea.votes
        });
      });
    });
  });

  context("Given 'ideas' table has data", () => {
    beforeEach(() => {
      return db.into("ideas").insert(testIdeas);
    });

    it("getAllIdeas() returns all data from ideas table", () => {
      return IdeasService.getAllIdeas(db).then(actual => {
        expect(actual).to.eql(testIdeas);
      });
    });

    it("getById() returns an idea by querying the id", () => {
      const thirdId = 3;
      const thirdTestIdea = testIdeas[thirdId - 1];
      return IdeasService.getById(db, thirdId).then(actual => {
        expect(actual).to.eql({
          id: thirdId,
          project_title: thirdTestIdea.project_title,
          project_summary: thirdTestIdea.project_summary,
          date_submitted: thirdTestIdea.date_submitted,
          status: thirdTestIdea.status,
          github: thirdTestIdea.github,
          votes: thirdTestIdea.votes
        });
      });
    });

    it("deleteIdea() removes idea from the table", () => {
      const ideaId = 3;
      return IdeasService.deleteIdea(db, ideaId)
        .then(() => IdeasService.getAllIdeas(db))
        .then(allIdeas => {
          const expected = testIdeas.filter(idea => idea.id !== ideaId);
          expect(allIdeas).to.eql(expected);
        });
    });

    it("updateIdea() queries idea by id and updates it", () => {
      const idOfIdeaToUpdate = 3;
      const ideaToUpdate = testIdeas[idOfIdeaToUpdate - 1];
      const newIdeaData = {
        project_title: "Updated Title",
        project_summary: "Update the summary of the project."
      };
      return IdeasService.updateIdea(db, idOfIdeaToUpdate, newIdeaData)
        .then(() => IdeasService.getById(db, idOfIdeaToUpdate))
        .then(article => {
          expect(article).to.eql({
            ...ideaToUpdate,
            ...newIdeaData
          });
        });
    });
  });
});
