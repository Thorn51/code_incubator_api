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
  req.app
    .get("db")("users")
    .where({ email: tokenEmail })
    .first()
    .then(user => {
      if (!user || user.password !== tokenPassword) {
        return res.status(401).json({ error: "Unauthorized request" });
      }

      next();
    })
    .catch(next);
}

function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_TOKEN;
  const authToken = req.get("Authorization");
  console.log(authToken);
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
