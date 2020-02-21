const express = require("express");
const path = require("path");
const logger = require("../logger");
const IdeasService = require("./ideas-service");
const xss = require("xss");
const { validateBearerToken } = require("../middleware/basic-auth");
const { requireAuth } = require("../middleware/jwt-auth");

const ideasRouter = express.Router();
const bodyParser = express.json();

// SECURITY -> remove XSS content from ideas
const serializeIdea = idea => ({
  id: idea.id,
  project_title: xss(idea.project_title),
  project_summary: xss(idea.project_summary),
  date_submitted: idea.date_submitted,
  github: xss(idea.github),
  votes: idea.votes,
  status: idea.status,
  author: idea.author
});

ideasRouter
  .route("/")
  //Get all ideas
  .get(validateBearerToken, (req, res, next) => {
    const knexInstance = req.app.get("db");
    IdeasService.getAllIdeas(knexInstance)
      .then(ideas => {
        res.json(
          ideas.map(idea => ({
            id: idea.id,
            project_title: idea.project_title,
            project_summary: idea.project_summary,
            date_submitted: idea.date_submitted,
            status: idea.status,
            github: idea.github,
            votes: idea.votes,
            author: idea.author
          }))
        );
      })
      .catch(next);
    logger.info(`GET "/api/ideas" response status 200`);
  })
  //Create and insert a new idea into db
  .post(requireAuth, bodyParser, (req, res, next) => {
    const {
      project_title,
      project_summary,
      github = "",
      status = "Idea",
      votes = 0
    } = req.body;

    const newIdea = {
      project_title: xss(project_title),
      project_summary: xss(project_summary),
      github: xss(github),
      status,
      votes
    };

    if (!project_title) {
      logger.error(`POST "/api/ideas" project_title missing in request body`);
      return res.status(400).json({
        error: { message: `Missing 'project_title' in request body.` }
      });
    }

    if (!project_summary) {
      logger.error(`POST "/api/ideas" project_summary missing in request body`);
      return res.status(400).json({
        error: { message: `Missing 'project_summary' in request body.` }
      });
    }

    newIdea.author = req.user.id;

    IdeasService.insertIdea(req.app.get("db"), newIdea)
      .then(idea => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${idea.id}`))
          .json(serializeIdea(idea));
        logger.info(`POST "/api/ideas" idea id=${idea.id} created`);
      })
      .catch(next);
  });

ideasRouter
  .route("/:id")
  .all(requireAuth)
  //Get an idea by its db id
  .all((req, res, next) => {
    IdeasService.getById(req.app.get("db"), req.params.id)
      .then(idea => {
        if (!idea) {
          logger.error(
            `GET "/api/ideas/:id" id=${req.params.id} -> idea not found`
          );
          return res.status(404).json({
            error: { message: "Idea doesn't exist" }
          });
        }
        res.idea = idea;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.status(200).json(serializeIdea(res.idea));
    logger.info(`GET "/api/ideas/:id" -> idea id=${req.params.id} returned`);
  })
  //remove idea from database
  .delete((req, res, next) => {
    const { id } = req.params;

    IdeasService.deleteIdea(req.app.get("db"), id)
      .then(() => {
        res.status(204).end();
        logger.info(`DELETE "/api/ideas/:id" -> idea with id ${id} deleted`);
      })
      .catch(next);
  })
  //edit idea
  .patch(bodyParser, (req, res, next) => {
    const { project_title, project_summary, status, votes } = req.body;
    const ideaUpdate = { project_title, project_summary, status, votes };

    if (
      project_title === undefined &&
      project_summary === undefined &&
      status === undefined &&
      votes === undefined
    ) {
      logger.error(
        `PATCH "/api/ideas/:id" -> request to edit did not contain relevant fields`
      );
      return res.status(400).json({
        error: {
          message:
            "Request body must contain project_title, project_summary, status, and or votes"
        }
      });
    }

    IdeasService.updateIdea(req.app.get("db"), req.params.id, ideaUpdate)
      .then(numRowsAffected => {
        res.status(200).json({ info: "Request completed" });
        logger.info(
          `PATCH "/api/ideas/:id" -> idea id ${req.params.id} edited`
        );
      })
      .catch(next);
  });

module.exports = ideasRouter;
