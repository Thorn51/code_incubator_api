require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { NODE_ENV } = require("./config");
const ideasRouter = require("./ideas/ideas-router");
const commentsRouter = require("./comments/comments-router");
const usersRouter = require("./users/users-router");
const logger = require("./logger");

const app = express();

app.use(helmet());
app.use(cors());

app.use(function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_TOKEN;
  const authToken = req.get("Authorization");
  if (!authToken || authToken.split(" ")[1] !== apiToken) {
    logger.error(`Unauthorized request to path: ${req.path}`);
    return res.status(401).json({ error: "Unauthorized request" });
  }

  next();
});

app.get("/", (req, res) => {
  res.send("Hello, world!");
  logger.info(`GET "/" response status 200`);
});

app.use(ideasRouter);
app.use(commentsRouter);
app.use(usersRouter);

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
