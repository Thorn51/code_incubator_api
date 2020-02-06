const express = require("express");
const path = require("path");
const logger = require("../logger");
const UsersService = require("./users-service");
const xss = require("xss");
const {
  requireAuth,
  validateBearerToken
} = require("../middleware/basic-auth");

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
  .all(validateBearerToken)
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

    // for (const [key, value] of Object.entries(newUser)) {
    //   if (value === undefined) {
    //     logger.error(`POST /api/users -> Missing ${key} in the request body`);
    //     return res.status(400).json({
    //       error: { message: `Missing '${key}' in the request body` }
    //     });
    //   }
    // }

    if (!first_name) {
      logger.error(`POST /api/users -> Missing first_name in the request body`);
      return res.status(400).json({
        error: { message: `Missing 'first_name' in the request body` }
      });
    }
    if (!last_name) {
      logger.error(`POST /api/users -> Missing last_name in the request body`);
      return res.status(400).json({
        error: { message: `Missing 'last_name' in the request body` }
      });
    }
    if (!email) {
      logger.error(`POST /api/users -> Missing email in the request body`);
      return res.status(400).json({
        error: { message: `Missing 'email' in the request body` }
      });
    }
    if (!password) {
      logger.error(`POST /api/users -> Missing password in the request body`);
      return res.status(400).json({
        error: { message: `Missing 'password' in the request body` }
      });
    }
    if (!nickname) {
      logger.error(`POST /api/users -> Missing nickname in the request body`);
      return res.status(400).json({
        error: { message: `Missing 'nickname' in the request body` }
      });
    }

    UsersService.insertUser(req.app.get("db"), newUser)
      .then(user => {
        logger.info(`POST /api/users -> user id=${user.id} created`);
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${user.id}`))
          .json(serializeUser(user));
      })
      .catch(next);
  });

usersRouter
  .route("/:id")
  .all(requireAuth)
  .all((req, res, next) => {
    UsersService.getById(req.app.get("db"), req.params.id)
      .then(user => {
        if (!user) {
          logger.error(
            `GET /api/users/:id -> user id=${req.params.id} not found`
          );
          return res.status(404).json({
            error: { message: "User doesn't exist" }
          });
        }
        res.user = user;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.status(200).json(serializeUser(res.user));
    logger.info(`GET /users/:id -> user.id=${res.user.id} returned`);
  })
  .delete((req, res, next) => {
    const { id } = req.params;

    UsersService.deleteUser(req.app.get("db"), id)
      .then(() => {
        res.status(204).end();
        logger.info(`DELETE "/users/:id" -> user with id ${id} deleted`);
      })
      .catch(next);
  })
  .patch(bodyParser, (req, res, next) => {
    const { first_name, last_name, email, nickname, password } = req.body;

    const userUpdate = { first_name, last_name, email, nickname, password };

    const numberOfValues = Object.values(userUpdate).filter(Boolean).length;

    if (numberOfValues === 0) {
      logger.error(
        `PATCH "/api/ideas/:id" -> request to edit did not contain relevant fields`
      );
      return res.status(400).json({
        error: {
          message:
            "Request body must contain first_name, last_name, email, nickname, and or password"
        }
      });
    }

    UsersService.updateUser(req.app.get("db"), req.params.id, userUpdate)
      .then(numRowsAffect => {
        res.status(204).end();
      })
      .catch(next);
    logger.info(`PATCH "/api/users/:id" -> idea id ${req.params.id} edited`);
  });

module.exports = usersRouter;
