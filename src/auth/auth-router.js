const express = require("express");
const AuthService = require("./auth-service");
const logger = require("../logger");

const authRouter = express.Router();
const bodyParser = express.json();

//Router for login endpoint
authRouter.post("/login", bodyParser, (req, res, next) => {
  const { email, password } = req.body;
  const loginUser = { email, password };

  for (const [key, value] of Object.entries(loginUser))
    if (value == null) {
      logger.error(`POST /api/auth/login -> missing ${key} in request body`);
      return res.status(400).json({
        error: `Missing '${key}' in request body`
      });
    }

  //check if user exists in db
  AuthService.getUserWithUserName(req.app.get("db"), loginUser.email)
    .then(dbUser => {
      if (!dbUser) {
        logger.error(
          `POST /api/auth/login -> email does not exist in database`
        );
        return res.status(400).json({
          error: "Incorrect user_name or password"
        });
      }
      //if user exists check password
      return AuthService.comparePasswords(
        loginUser.password,
        dbUser.password
      ).then(matchPasswords => {
        if (!matchPasswords) {
          logger.error(`POST /api/auth/login -> incorrect password`);
          return res.status(400).json({
            error: "Incorrect user_name or password"
          });
        }
        logger.info(
          `POST /api/auth/login -> user id ${dbUser.id} login successful`
        );
        //create JWT and send in response
        const sub = dbUser.email;
        const payload = { user_id: dbUser.id, first_name: dbUser.first_name };
        res.send({
          authToken: AuthService.createJwt(sub, payload)
        });
      });
    })
    .catch(next);
});

module.exports = authRouter;
