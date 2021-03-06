const express = require("express");
const path = require("path");
const xss = require("xss");
const logger = require("../logger");
const CommentsService = require("./comments-service");
const { requireAuth } = require("../middleware/jwt-auth");

const commentsRouter = express.Router();
const bodyParser = express.json();

//SECURITY -> Remove xss content from comments
const serializeComment = comment => ({
  id: comment.id,
  comment_text: xss(comment.comment_text),
  date_submitted: comment.date_submitted,
  votes: comment.votes,
  author: comment.author,
  project: comment.project
});

commentsRouter
  .route("/")
  .all(requireAuth)
  //get all comments
  .get((req, res, next) => {
    CommentsService.getAllComments(req.app.get("db"))
      .then(comments => {
        res.json(
          comments.map(comment => ({
            id: comment.id,
            comment_text: xss(comment.comment_text),
            votes: comment.votes,
            date_submitted: comment.date_submitted,
            author: comment.author,
            project: comment.project
          }))
        );
      })
      .catch(next);
    logger.info(`GET "/comments" response status 200`);
  })
  //Create a new comment and insert it into db
  .post(bodyParser, (req, res, next) => {
    const { comment_text, project } = req.body;
    const newComment = {
      comment_text,
      project
    };

    if (!comment_text) {
      logger.error(`POST "/comments" missing comment in request body`);
      return res.status(400).json({
        error: { message: `Missing 'comment_text' in the request body` }
      });
    }

    newComment.author = req.user.id;

    CommentsService.insertComment(req.app.get("db"), newComment)
      .then(comment => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${comment.id}`))
          .json(comment);
        logger.info(`POST "/comments" comment id=${comment.id} created`);
      })
      .catch(next);
  });

commentsRouter
  .route("/:id")
  .all(requireAuth)
  //Get a comment by ID
  .all((req, res, next) => {
    const { id } = req.params;

    CommentsService.getById(req.app.get("db"), id)
      .then(comment => {
        if (!comment) {
          logger.error(`GET /api/comments/${id} -> comment not found`);
          return res.status(404).json({
            error: { message: "Comment doesn't exist" }
          });
        }
        res.comment = comment;
        next();
      })
      .catch(next);
  })
  .get((req, res) => {
    res.status(200).json(serializeComment(res.comment));
    logger.info(`GET /comments/${req.params.id} returned`);
  })
  //Remove comment from db -> Wired up in api but currently not used in client
  .delete((req, res, next) => {
    CommentsService.deleteComment(req.app.get("db"), req.params.id)
      .then(() => {
        res.status(204).end();
        logger.info(`DELETE /comments/${req.params.id} successful`);
      })
      .catch(next);
  })
  //Edit comment -> Wired up in api but currently not used in client
  .patch(bodyParser, (req, res, next) => {
    const { comment_text, votes } = req.body;
    const commentUpdate = { comment_text, votes };

    if (comment_text === undefined && votes === undefined) {
      logger.error(
        `PATCH /api/comments/${req.params.id} -> request to edit did not contain relevant fields`
      );
      return res.status(400).json({
        error: {
          message: "Request body must contain 'comment_text' or 'votes'"
        }
      });
    }

    CommentsService.updateComment(
      req.app.get("db"),
      req.params.id,
      commentUpdate
    )
      .then(numRowsAffected => {
        res.status(200).json({ info: "Request completed" });
        logger.info(`PATCH /api/comments/${req.params.id} -> comment edited`);
      })
      .catch(next);
  });

module.exports = commentsRouter;
