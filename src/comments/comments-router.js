const express = require("express");
const path = require("path");
const xss = require("xss");
const logger = require("../logger");

const commentsRouter = express.Router();
const bodyParser = express.json();

const serializeComment = comment => ({
  id: comment.id,
  comment_text: xss(comment.comment_text),
  votes: comment.votes,
  author: comment.author,
  project: comment.project
});

commentsRouter
  .route("/comments")
  .get((req, res) => {
    res.json(comments);
    logger.info(`GET "/comments" response status 200`);
  })
  .post(bodyParser, (req, res) => {
    const { comment_text, user_id, project_id } = req.body;

    if (!comment_text) {
      logger.error(`POST "/comments" missing comment in request body`);
      return res.status(400).send("Invalid data");
    }

    const previousId =
      comments.length === 0 ? 0 : comments[comments.length - 1].id;
    const id = parseInt(previousId) + 1;
    const votes = 0;

    const newComment = {
      id,
      user_id,
      project_id,
      comment_text,
      votes
    };

    comments.push(newComment);

    res
      .status(201)
      .location(`http://localhost:8000/comments/${id}`)
      .json(newComment);

    logger.info(`POST "/comments" comment id=${id} created`);
  });

commentsRouter
  .route("/comments/:id")
  .get((req, res) => {
    const { id } = req.params;
    const comment = comments.find(comment => comment.id === id);

    if (!comment) {
      logger.error(`GET "/comments/:id" id=${id} -> comment not found`);
      return res.status(404).send("Comment not found");
    }
    logger.info(`GET "/comments/:id" -> comment.id=${id} delivered`);
    res.status(200).json(comment);
  })
  .delete((req, res) => {
    const { id } = req.params;
    const commentIndex = comments.findIndex(comment => comment.id === id);

    if (commentIndex === -1) {
      logger.error(`DELETE "/comments/:id" comment id=${id} not found`);
      return res.status(404).send("Not Found");
    }
    res.status(204).end();
    logger.info(`DELETE "/comments/:id" -> comment with id ${id} deleted`);
  });

module.exports = commentsRouter;
