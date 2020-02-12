const AuthService = require("../auth/auth-service");
const logger = require("../logger");

function requireAuth(req, res, next) {
  const authToken = req.get("Authorization") || "";
  let basicToken;

  if (!authToken.toLowerCase().startsWith("basic ")) {
    return res.status(401).json({ error: "Missing basic token" });
  } else {
    basicToken = authToken.slice("basic ".length, authToken.length);
  }

  const [tokenEmail, tokenPassword] = Buffer.from(basicToken, "base64")
    .toString()
    .split(":");

  if (!tokenEmail || !tokenPassword) {
    return res.status(401).json({ error: "Unauthorized request" });
  }

  AuthService.getUserWithUserName(req.app.get("db"), tokenEmail).then(user => {
    if (!user) {
      logger.error("User was not found");
      return res.status(401).json({ error: "Unauthorized request" });
    }
    return AuthService.comparePasswords(tokenPassword, user.password).then(
      passwordsMatch => {
        if (!passwordsMatch) {
          return res.status(401).json({ error: "Unauthorized request" });
        }

        req.user = user;
        next();
      }
    );
  });
}

function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_TOKEN;
  const authToken = req.get("Authorization");

  if (!authToken || authToken.split(" ")[1] !== apiToken) {
    logger.error(`Unauthorized request to path: ${req.path}`);
    return res.status(401).json({ error: "Unauthorized request" });
  }

  next();
}

module.exports = {
  requireAuth,
  validateBearerToken
};
