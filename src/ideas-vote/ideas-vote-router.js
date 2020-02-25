const express = require("express");
const path = require("path");
const logger = require("../logger");
const IdeaVoteService = require("./ideas-vote-service");
const { requireAuth } = require("../middleware/jwt-auth");

const ideaVoteRouter = express.Router();
const bodyParser = express.json();

ideaVoteRouter
  .route("/")
  .all(requireAuth)
  //get all idea votes
  .get((req, res, next) => {
    IdeaVoteService.getAllIdeaVotes(req.app.get("db"))
      .then(votes => {
        res.status(200).json(votes);
        logger.info(`GET /api/idea/vote status 200`);
      })
      .catch(next);
  })
  //Create a new comment vote and insert it in to db
  .post(bodyParser, (req, res, next) => {
    const { vote, idea_id } = req.body;
    const newVote = {
      vote: vote,
      idea: idea_id
    };

    if (!vote) {
      logger.error("POST /api/idea/vote missing 'vote' in request body");
      return res.status(400).json({
        error: { message: "Missing 'vote' in the request body" }
      });
    }

    newVote.vote_by_user = req.user.id;

    IdeaVoteService.insertVote(req.app.get("db"), newVote)
      .then(result => {
        logger.info(
          `POST /api/idea/vote/ -> idea vote id=${result.id} created`
        );
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${result.id}`))
          .json(result);
      })
      .catch(next);
  });

ideaVoteRouter
  .route("/:id")
  .all(requireAuth)
  .all((req, res, next) => {
    const { id } = req.params;

    IdeaVoteService.getById(req.app.get("db"), id)
      .then(vote => {
        if (!vote) {
          logger.error(`GET /api/idea/vote/${id} -> vote not found`);
          return res.status(404).json({
            error: { message: "Vote doesn't exist" }
          });
        }
        res.vote = vote;
        next();
      })
      .catch(next);
  })
  .get((req, res) => {
    res.status(200).json(res.vote);
    logger.info(`GET /api/idea/vote/${req.params.id} -> returned`);
  })
  //Remove from from db -> Wired up in api but currently not used in client
  .delete((req, res, next) => {
    IdeaVoteService.deleteVote(req.app.get("db"), req.params.id)
      .then(() => {
        res.status(204).json({ info: { message: "Vote deleted" } });
        logger.info(`DELETE /api/idea/vote/${req.params.id} successful`);
      })
      .catch(next);
  })
  //Edit vote in db -> Wired up in api but currently not used in client, use case change vote
  .patch(bodyParser, (req, res, next) => {
    const { vote } = req.body;
    const voteUpdate = { vote };

    if (vote === undefined) {
      logger.error(
        `PATCH /api/idea/vote${req.params.id} -> request to edit did not contain vote`
      );
      return res
        .status(400)
        .json({ error: { message: "Request body must contain 'vote'" } });
    }

    IdeaVoteService.updateVote(req.app.get("db"), req.params.id, voteUpdate)
      .then(() => {
        res.status(200).json({ info: "Request completed" });
        logger.info(`PATCH /api/idea/vote${req.params.id} -> vote updated`);
      })
      .catch(next);
  });

module.exports = ideaVoteRouter;
