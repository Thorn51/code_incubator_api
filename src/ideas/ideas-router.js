const express = require("express");
const logger = require("../logger");
const IdeasService = require("./ideas-service");

const ideasRouter = express.Router();
const bodyParser = express.json();

ideasRouter
  .route("/ideas")
  .get((req, res) => {
    const knexInstance = req.app.get("db");
    IdeasService.getAllArticles(knexInstance)
      .then(ideas => {
        res.json(ideas);
      })
      .catch(next);
    logger.info(`GET "/ideas" response status 200`);
  })
  .post(bodyParser, (req, res) => {
    const {
      user_id,
      project_title,
      project_summary,
      date_submitted,
      status = "idea",
      github = "",
      votes = 0
    } = req.body;

    if (!user_id) {
      logger.error(`POST "/ideas" user_id missing in request body`);
      return res.status(400).send("Invalid data");
    }

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

    const idea = {
      id,
      user_id,
      project_title,
      project_summary,
      date_submitted,
      status,
      github,
      votes
    };

    ideas.push(idea);

    logger.info(`POST "/ideas" idea id=${id} created`);

    res
      .status(201)
      .location(`http://localhost:8000/ideas/${id}`)
      .json(idea);
  });

ideasRouter
  .route("/ideas/:id")
  .get((req, res) => {
    const { id } = req.params;
    const idea = ideas.find(idea => idea.id === id);

    if (!idea) {
      logger.error(`GET "/ideas/:id" id=${id} -> idea not found`);
      return res.status(404).send("Idea not found");
    }
    logger.info(`GET "/ideas/:id" - idea.id ${id} delivered`);
    res.json(idea);
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
