const express = require("express");
const path = require("path");
const logger = require("../logger");
const CommentVoteService = require("./comment-vote-service");
const { requireAuth } = require("../middleware/jwt-auth");

const commentVoteRouter = express.Router();
const bodyParser = express.json();

commentVoteRouter
  .route("/")
  .all(requireAuth)
  //get all comment votes
  .get((req, res, next) => {
    CommentVoteService.getAllCommentVotes(req.app.get("db"))
      .then(votes => {
        res.status(200).json(votes);
        logger.info(`GET /api/comment/vote status 200`);
      })
      .catch(next);
  })
  //Create a new comment vote and insert it in to db
  .post(bodyParser, (req, res, next) => {
    const { vote, comment_id } = req.body;
    const newVote = {
      vote: vote,
      comment: comment_id
    };

    if (!vote) {
      logger.error("POST /api/comment/vote missing 'vote' in request body");
      return res.status(400).json({
        error: { message: "Missing 'vote' in the request body" }
      });
    }

    newVote.vote_by_user = req.user.id;

    CommentVoteService.insertVote(req.app.get("db"), newVote)
      .then(result => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${result.id}`))
          .json(result);
      })
      .catch(next);
  });

commentVoteRouter
  .route("/:id")
  .all(requireAuth)
  .all((req, res, next) => {
    const { id } = req.params;

    CommentVoteService.getById(req.app.get("db"), id)
      .then(vote => {
        if (!vote) {
          logger.error(`GET /api/comment/vote/${id} -> vote not found`);
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
    logger.info(`GET /api/comment/vote/${req.params.id} -> returned`);
  })
  //Remove from from db -> Wired up in api but currently not used in client
  .delete((req, res, next) => {
    CommentVoteService.deleteVote(req.app.get("db"), req.params.id)
      .then(() => {
        res.status(204).json({ info: { message: "Vote deleted" } });
        logger.info(`DELETE /api/comment/vote/${req.params.id} successful`);
      })
      .catch(next);
  })
  //Edit vote in db -> Wired up in api but currently not used in client, use case change vote
  .patch(bodyParser, (req, res, next) => {
    const { vote } = req.body;
    const voteUpdate = { vote };

    if (vote === undefined) {
      logger.error(
        `PATCH /api/comment/vote${req.params.id} -> request to edit did not contain vote`
      );
      return res
        .status(400)
        .json({ error: { message: "Request body must contain 'vote'" } });
    }

    CommentVoteService.updateVote(req.app.get("db"), req.params.id, voteUpdate)
      .then(() => {
        res.status(200).json({ info: "Request completed" });
        logger.info(`PATCH /api/comment/vote${req.params.id} -> vote updated`);
      })
      .catch(next);
  });

module.exports = commentVoteRouter;
