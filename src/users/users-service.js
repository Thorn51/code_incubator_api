const xss = require("xss");
const bcrypt = require("bcryptjs");

const PASSWORD_REGEX = /((?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W]).{8,64})/;
const EMAIL_REGEX = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;

const UsersService = {
  hasUserWithEmail(db, email) {
    return db("users")
      .where({ email })
      .first()
      .then(user => !!user);
  },
  validateEmail(email) {
    if (!EMAIL_REGEX.test(email)) {
      return "Invalid email address";
    }
  },
  validatePassword(password) {
    if (password.length < 8) {
      return "Password must be longer than 8 characters";
    }
    if (password.length > 64) {
      return "Password must be less than 64 characters";
    }
    if (password.startsWith(" ")) {
      return "Password must not start or end with empty spaces";
    }
    if (password.endsWith(" ")) {
      return "Password must not start or end with empty spaces";
    }
    if (!PASSWORD_REGEX.test(password)) {
      return "Password must contain 1 upper case, lower case, number, and special character";
    }
  },
  getAllUsers(db) {
    return db.select("*").from("users");
  },
  insertUser(db, newUser) {
    return db
      .insert(newUser)
      .into("users")
      .returning("*")
      .then(([user]) => user);
  },
  getById(db, id) {
    return db
      .from("users")
      .select("*")
      .where("id", id)
      .first();
  },
  deleteUser(db, id) {
    return db("users")
      .where({ id })
      .delete();
  },
  updateUser(db, id, updateFields) {
    return db("users")
      .where({ id })
      .update(updateFields);
  },
  hashPassword(password) {
    return bcrypt.hash(password, 12);
  },
  serializeUser(user) {
    return {
      id: user.id,
      first_name: xss(user.first_name),
      last_name: xss(user.last_name),
      email: xss(user.email),
      nickname: xss(user.nickname),
      votes: 0,
      date_created: new Date(user.date_created)
    };
  }
};

module.exports = UsersService;
