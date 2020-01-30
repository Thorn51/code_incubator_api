const express = require("express");
const logger = require("../logger");
const IdeasService = require("./ideas-service");

const ideasRouter = express.Router();
const bodyParser = express.json();

ideasRouter
  .route("/ideas")
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    IdeasService.getAllIdeas(knexInstance)
      .then(ideas => {
        res.json(
          ideas.map(idea => ({
            id: idea.id,
            project_title: idea.project_title,
            project_summary: idea.project_summary,
            date_submitted: new Date(idea.date_submitted),
            status: idea.status,
            github: idea.github,
            votes: idea.votes
          }))
        );
      })
      .catch(next);
    logger.info(`GET "/ideas" response status 200`);
  })
  .post(bodyParser, (req, res) => {
    IdeasService.insertIdea(req.app.get("db"), newIdea);

    // if (!user_id) {
    //   logger.error(`POST "/ideas" user_id missing in request body`);
    //   return res.status(400).send("Invalid data");
    // }

    if (!project_title) {
      logger.error(`POST "/ideas" project_title missing in request body`);
      return res.status(400).send("Invalid data");
    }

    if (!project_summary) {
      logger.error(`POST "/ideas" project_summary missing in request body`);
      return res.status(400).send("Invalid data");
    }

    const previousId = ideas.length === 0 ? 0 : ideas[ideas.length - 1].id;
    const id = parseInt(previousId) + 1;

    const newIdea = {
      id,
      user_id,
      project_title,
      project_summary,
      date_submitted,
      status,
      github,
      votes
    };

    IdeasService.insertIdea(req.app.get("db"), newIdea).then(() => {
      res
        .status(201)
        .location(`http://localhost:8000/ideas/${id}`)
        .json(idea);
    });

    logger.info(`POST "/ideas" idea id=${id} created`);
  });

ideasRouter
  .route("/ideas/:id")
  .get((req, res, next) => {
    IdeasService.getById(req.app.get("db"), req.params.id)
      .then(idea => {
        if (!idea) {
          logger.error(
            `GET "/ideas/:id" id=${req.params.id} -> idea not found`
          );
          return res.status(404).json({
            error: { message: "Idea not found" }
          });
        }
        res.status(200).json(idea);
      })
      .catch(next);

    logger.info(`GET "/ideas/:id" -> idea id=${req.params.id} returned`);
  })
  .delete((req, res) => {
    const { id } = req.params;
    const ideaIndex = ideas.findIndex(idea => idea.id === id);

    if (ideaIndex === -1) {
      logger.error(`DELETE "/ideas/:id" comment id=${id} not found`);
      return res.status(404).send("Not Found");
    }
    res.status(204).end();
    logger.info(`DELETE "/ideas/:id" -> idea with id ${id} deleted`);
  });

module.exports = ideasRouter;
