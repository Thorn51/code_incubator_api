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
  logger.info(`GET "/" response status 200`);
});

app.get("/ideas", (req, res) => {
  res.json(ideas);
  logger.info(`GET "/ideas" response status 200`);
});

app.get("/comments", (req, res) => {
  res.json(comments);
  logger.info(`GET "/comments" response status 200`);
});

app.get("/users", (req, res) => {
  res.status(200).json(users);
  logger.info(`GET "/users" response status 200`);
});

app.get("/ideas/:id", (req, res) => {
  const { id } = req.params;
  const idea = ideas.find(idea => idea.id === id);

  if (!idea) {
    logger.error(`GET "/ideas/:id" id=${id} -> idea not found`);
    return res.status(404).send("Idea not found");
  }
  logger.info(`GET "/ideas/:id" - idea.id ${id} delivered`);
  res.json(idea);
});

app.get("/comments/:id", (req, res) => {
  const { id } = req.params;
  const comment = comments.find(comment => comment.id === id);

  if (!comment) {
    logger.error(`GET "/comments/:id" id=${id} -> comment not found`);
    return res.status(404).send("Comment not found");
  }
  logger.info(`GET "/comments/:id" -> comment.id=${id} delivered`);
  res.status(200).json(comment);
});

app.get("/users/:id", (req, res) => {
  const { id } = req.params;
  const user = users.find(user => user.id === id);

  if (!user) {
    logger.error(`GET "/users/:id" id=${id} -> user not found`);
    return res.status(404).send("User not found");
  }
  logger.info(`GET "/users/:id" -> user.id=${id} delivered`);
  res.status(200).json(user);
});

app.post("/ideas", (req, res) => {
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

  const previousId = ideas[ideas.length - 1].id;
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

app.post("/users/registration", (req, res) => {
  const { first_name, last_name, nickname, email, password } = req.body;

  if (!first_name) {
    logger.error(
      'POST "/users/registration" first_name missing in request body'
    );
    return res.status(400).send("Invalid Data");
  }
  if (!last_name) {
    logger.error(
      'POST "/users/registration" last_name missing in request body'
    );
    return res.status(400).send("Invalid Data");
  }
  if (!nickname) {
    logger.error('POST "/users/registration" nickname missing in request body');
    return res.status(400).send("Invalid Data");
  }
  if (!email) {
    logger.error('POST "/users/registration" email missing in request body');
    return res.status(400).send("Invalid Data");
  }
  if (!password) {
    logger.error('POST "/users/registration" password missing in request body');
    return res.status(400).send("Invalid Data");
  }

  const previousId = users[users.length - 1].id;
  const id = parseInt(previousId) + 1;
  const votes = 0;

  const newUser = {
    id,
    first_name,
    last_name,
    email,
    password,
    nickname,
    votes
  };

  users.push(newUser);

  res
    .status(201)
    .location(`http://localhost:8000/ideas/${id}`)
    .json(newUser);
});

app.post("/users/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find(user => user.email === email);

  if (!email) {
    logger.error(`POST "/users/login" email missing from request body`);
    return res.status(400).send("Invalid request");
  }

  if (!password) {
    logger.error(`POST "/users/login" password missing from request body`);
    return res.status(400).send("Invalid request");
  }

  if (!user) {
    logger.error(`POST "/users/login" the user doesn't exist`);
    return res.status(400).send("Invalid request");
  }

  if (user.password !== password) {
    logger.error(`POST "/users/login" passwords do not match`);
    return res.status(401).send("Unauthorized");
  }

  res.status(204).end();
  logger.info(`POST "/users/login" user ${user.id} logged in`);
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
