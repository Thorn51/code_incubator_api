const express = require("express");
const path = require("path");
const logger = require("../logger");
const UsersService = require("./users-service");
const xss = require("xss");
const { validateBearerToken } = require("../middleware/basic-auth");
const { requireAuth } = require("../middleware/jwt-auth");

const usersRouter = express.Router();
const bodyParser = express.json();

usersRouter
  .route("/")
  .all(validateBearerToken)
  //Get all users
  .get((req, res, next) => {
    UsersService.getAllUsers(req.app.get("db"))
      .then(users => {
        res.status(200).json(
          //SECURITY -> remove XSS content
          users.map(user => ({
            id: user.id,
            first_name: xss(user.first_name),
            last_name: xss(user.last_name),
            email: xss(user.email),
            nickname: xss(user.nickname),
            votes: user.votes,
            date_created: user.date_created
          }))
        );
      })
      .catch(next);
    logger.info(`GET "/users" response status 200`);
  })
  //Create new user -> registration
  .post(bodyParser, (req, res, next) => {
    const { first_name, last_name, email, password, nickname } = req.body;

    for (const field of [
      "first_name",
      "last_name",
      "email",
      "password",
      "nickname"
    ])
      if (!req.body[field]) {
        logger.error(
          `POST /api/users -> Missing '${field}' in the request body`
        );
        return res.status(400).json({
          error: `Missing '${field}' in the request body`
        });
      }

    const passwordError = UsersService.validatePassword(password);
    const emailError = UsersService.validateEmail(email);

    if (passwordError) {
      logger.error(`POST /api/users -> ${passwordError}`);
      return res.status(400).json({ error: passwordError });
    }

    if (emailError) {
      logger.error(`POST /api/users -> ${emailError}`);
      return res.status(400).json({ error: emailError });
    }
    //Check if email has already been used.
    UsersService.hasUserWithEmail(req.app.get("db"), email)
      .then(hasUserWithEmail => {
        if (hasUserWithEmail) {
          logger.error(
            `POST /api/users -> The submitted email is already taken`
          );
          return res.status(400).json({ error: "The email is already taken" });
        }
        //If no email in db then hash new password
        return UsersService.hashPassword(password).then(hashedPassword => {
          const newUser = {
            first_name,
            last_name,
            email,
            nickname,
            password: hashedPassword,
            date_created: "now()"
          };
          //Insert new user
          return UsersService.insertUser(req.app.get("db"), newUser).then(
            user => {
              logger.info(`POST /api/users -> User with id=${user.id} created`);
              res
                .status(201)
                .location(path.posix.join(req.originalUrl, `/${user.id}`))
                .json(UsersService.serializeUser(user));
            }
          );
        });
      })
      .catch(next);
  });

usersRouter
  .route("/:id")
  .all(requireAuth)
  //get user by db id
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
    res.status(200).json(UsersService.serializeUser(res.user));
    logger.info(`GET /users/:id -> user.id=${res.user.id} returned`);
  })
  //remove user
  .delete((req, res, next) => {
    const { id } = req.params;

    UsersService.deleteUser(req.app.get("db"), id)
      .then(() => {
        res.status(204).end();
        logger.info(`DELETE "/users/:id" -> user with id ${id} deleted`);
      })
      .catch(next);
  })
  //edit user
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
        res.status(200).json({ info: "Request completed" });
      })
      .catch(next);
    logger.info(`PATCH "/api/users/:id" -> idea id ${req.params.id} edited`);
  });

module.exports = usersRouter;
