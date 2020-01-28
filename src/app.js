require("dotenv").config();
const express = require("express");
const winston = require("winston");
const cors = require("cors");
const helmet = require("helmet");
const { NODE_ENV } = require("./config");

const app = express();

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [new winston.transports.File({ filename: "info.log" })]
});

if (NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple()
    })
  );
}

app.use(helmet());
app.use(cors());
app.use(express.json());

const ideas = [
  {
    id: "1",
    user_id: "1",
    project_title: "First Project",
    project_summary:
      "Lorem ipsum dolor sit amet, te autem soluta facilisi vel, feugiat perfecto sapientem sit ei, in sit electram abhorreant. Ne nam aeterno labitur admodum, qui timeam quaerendum ullamcorper ut. Porro debet molestie eu duo, sea no essent feugait. In nec atqui scaevola, ea sed everti sanctus convenire. Ea quod discere pri, hinc incorrupte ne his.",
    date_submitted: "12.21.19",
    status: "Idea",
    github: "fake_url",
    votes: "5"
  }
];

const comments = [
  {
    id: "1",
    user_id: "2",
    project_id: "1",
    comment_text:
      "Ne velit facilis deserunt nam, eum lucilius constituto ex. Odio rebum dignissim ad mel, an ius tollit veniam, vix vidit mazim homero ad. Paulo definitiones et mei, nam ne illum scripta. Zril senserit at has, at est clita eirmod moderatius. Et mnesarchum posidonium sea, aliquid debitis oportere qui et. Vix no ullum adipiscing, an qui nulla temporibus.",
    date_submitted: "12.21.20",
    votes: "15"
  }
];

const users = [
  {
    id: "1",
    first_name: "John",
    last_name: "Doe",
    email: "jdoe@devevlopmenttesting.com",
    password: "notRealForDev!1",
    nickname: "code_guru",
    votes: "77"
  }
];

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
  logger.info(`"/" response status 200`);
});

app.get("/ideas", (req, res) => {
  res.json(ideas);
  logger.info(`"/ideas" response status 200`);
});

app.get("/comments", (req, res) => {
  res.json(comments);
  logger.info(`"/comments" response status 200`);
});

app.get("/users", (req, res) => {
  res.status(200).json(users);
  logger.info(`"/users" response status 200`);
});

app.get("/ideas/:id", (req, res) => {
  const { id } = req.params;
  const idea = ideas.find(idea => idea.id === id);

  if (!idea) {
    logger.error(`"/ideas/:id" id=${id} -> idea not found`);
    return res.status(404).send("Idea not found");
  }
  logger.info(`"/ideas/:id" - idea.id ${id} delivered`);
  res.json(idea);
});

app.get("/comments/:id", (req, res) => {
  const { id } = req.params;
  const comment = comments.find(comment => comment.id === id);

  if (!comment) {
    logger.error(`"/comments/:id" id=${id} -> comment not found`);
    return res.status(404).send("Comment not found");
  }
  logger.info(`"/comments/:id" -> comment.id=${id} delivered`);
  res.status(200).json(comment);
});

app.get("/users/:id", (req, res) => {
  const { id } = req.params;
  const user = users.find(user => user.id === id);

  if (!user) {
    logger.error(`"/users/:id" id=${id} -> user not found`);
    return res.status(404).send("User not found");
  }
  logger.info(`"/users/:id" -> user.id=${id} delivered`);
  res.status(200).json(user);
});

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
