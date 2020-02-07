const AuthService = {
  getUserWithUserName(db, email) {
    return db("users")
      .where({ email })
      .first();
  },
  parseBasicToken(token) {
    return Buffer.from(token, "base64")
      .toString()
      .split(":");
  }
};

module.exports = AuthService;
