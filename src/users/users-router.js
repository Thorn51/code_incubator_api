const express = require("express");
const logger = require("../logger");

const usersRouter = express.Router();
const bodyParser = express.json();

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

usersRouter.route("users").get((req, res) => {
  res.status(200).json(users);
  logger.info(`GET "/users" response status 200`);
});

usersRouter
  .route("/users/:id")
  .get((req, res) => {
    const { id } = req.params;
    const user = users.find(user => user.id === id);

    if (!user) {
      logger.error(`GET "/users/:id" id=${id} -> user not found`);
      return res.status(404).send("User not found");
    }
    logger.info(`GET "/users/:id" -> user.id=${id} delivered`);
    res.status(200).json(user);
  })
  .delete((req, res) => {});

usersRouter.route("/users/registration").post(bodyParser, (req, res) => {
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

usersRouter.route("/users/login").post(bodyParser, (req, res) => {
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

module.exports = usersRouter;
