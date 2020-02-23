require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { NODE_ENV } = require("./config");
const ideasRouter = require("./ideas/ideas-router");
const commentsRouter = require("./comments/comments-router");
const usersRouter = require("./users/users-router");
const authRouter = require("./auth/auth-router");
const commentVoteRouter = require("./comment-vote/comment-vote-router");
const ideaVoteRouter = require("./ideas-vote/ideas-vote-router");

const app = express();

//SECURITY -> helmet hides sensitive data in headers
app.use(helmet());

//Allow cross-origin resource sharing
app.use(cors());

// routers
app.use("/api/ideas", ideasRouter);
app.use("/api/comments", commentsRouter);
app.use("/api/users", usersRouter);
app.use("/api/auth", authRouter);
app.use("/api/comment/vote", commentVoteRouter);
app.use("/api/idea/vote", ideaVoteRouter);

//Middleware that catches and handles errors
app.use(function errorHandler(error, req, res, next) {
  let response;
  if (NODE_ENV === "production") {
    response = { error: { message: "server error" } };
  } else {
    console.log(error);
    response = { message: error.message, error };
  }
  res.status(500).json(response);
});

module.exports = app;
