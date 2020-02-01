const express = require("express");
const path = require("path");
const logger = require("../logger");
const UsersService = require("./users-service");
const xss = require("xss");

const usersRouter = express.Router();
const bodyParser = express.json();

const serializeUser = user => ({
  id: user.id,
  first_name: xss(user.first_name),
  last_name: xss(user.last_name),
  email: xss(user.email),
  password: xss(user.password),
  nickname: xss(user.nickname),
  votes: user.votes,
  date_created: user.date_created
});

usersRouter
  .route("/")
  .get((req, res, next) => {
    UsersService.getAllUsers(req.app.get("db"))
      .then(users => {
        res.status(200).json(
          users.map(user => ({
            id: user.id,
            first_name: xss(user.first_name),
            last_name: xss(user.last_name),
            email: xss(user.email),
            password: xss(user.password),
            nickname: xss(user.nickname),
            votes: user.votes,
            date_created: user.date_created
          }))
        );
      })
      .catch(next);
    logger.info(`GET "/users" response status 200`);
  })
  .post(bodyParser, (req, res, next) => {
    const {
      first_name,
      last_name,
      email,
      password,
      nickname,
      votes = 0
    } = req.body;

    const newUser = {
      first_name: xss(first_name),
      last_name: xss(last_name),
      email: xss(email),
      password: xss(password),
      nickname: xss(nickname),
      votes
    };

    for (const [key, value] of Object.entries(newUser)) {
      if (value === null) {
        logger.error(`POST /api/users -> Missing ${key} in the request body`);
        return res.status(400).json({
          error: { message: `Missing ${key} in the request body` }
        });
      }
    }

    UsersService.insertUser(req.app.get("db"), newUser).then(user => {
      logger.info(`POST /api/users -> user id=${user.id} created`);
      res
        .status(201)
        .location(path.posix.join(req.originalUrl, `/${user.id}`))
        .json(serializeUser(user));
    });
  });

usersRouter
  .route("/:id")
  .get((req, res) => {
    const { id } = req.params;
    const user = users.find(user => user.id === id);

    if (!user) {
      logger.error(`GET "/users/:id" id=${id} -> user not found`);
      return res.status(404).send("User not found");
    }
    logger.info(`GET "/users/:id" -> user.id=${id} delivered`);
    res.status(200).json({ id });
  })
  .delete((req, res) => {
    const { id } = req.params;
    const userIndex = users.findIndex(user => user.id === id);

    if (userIndex === -1) {
      logger.error(`DELETE "/users/:id" user id=${id} not found`);
      return res.status(404).send("Not Found");
    }
    res.status(204).end;
    logger.info(`DELETE "/users/:id" -> user with id ${id} deleted`);
  });

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

  const previousId = users.length === 0 ? 0 : users[users.length - 1].id;
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
    .location(path.posix.join(req.originalUrl, `/${newUser.id}`))
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
