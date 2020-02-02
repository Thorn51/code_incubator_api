const express = require("express");
const path = require("path");
const logger = require("../logger");
const IdeasService = require("./ideas-service");
const xss = require("xss");

const ideasRouter = express.Router();
const bodyParser = express.json();

const serializeIdea = idea => ({
  id: idea.id,
  project_title: xss(idea.project_title),
  project_summary: xss(idea.project_summary),
  date_submitted: idea.date_submitted,
  github: xss(idea.github),
  votes: idea.votes,
  status: idea.status
});

ideasRouter
  .route("/")
  .get((req, res, next) => {
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
            votes: idea.votes
          }))
        );
      })
      .catch(next);
    logger.info(`GET "/api/ideas" response status 200`);
  })
  .post(bodyParser, (req, res, next) => {
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
    // if (!user_id) {
    //   logger.error(`POST "/api/ideas" user_id missing in request body`);
    //   return res.status(400).send("Invalid data");
    // }console.log(req.body);

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

    // for (const [key, value] of Object.entries(newIdea)) {
    //   if (value === null) {
    //     return res.status(400).json({
    //       error: { message: `Missing '${key}' in request body.` }
    //     });
    //   }
    // }

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
  .delete((req, res, next) => {
    const { id } = req.params;

    IdeasService.deleteIdea(req.app.get("db"), id)
      .then(() => {
        res.status(204).end();
        logger.info(`DELETE "/api/ideas/:id" -> idea with id ${id} deleted`);
      })
      .catch(next);
  })
  .patch(bodyParser, (req, res, next) => {
    const { project_title, project_summary, status } = req.body;
    const ideaUpdate = { project_title, project_summary, status };

    const numberOfValues = Object.values(ideaUpdate).filter(Boolean).length;

    if (numberOfValues === 0) {
      logger.error(
        `PATCH "/api/ideas/:id" -> request to edit did not contain relevant fields`
      );
      return res.status(400).json({
        error: {
          message:
            "Request body must contain project_title, project_summary, or status"
        }
      });
    }

    IdeasService.updateIdea(req.app.get("db"), req.params.id, ideaUpdate)
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);

    logger.info(`PATCH "/api/ideas/:id" -> idea id ${req.params.id} edited`);
  });

module.exports = ideasRouter;
