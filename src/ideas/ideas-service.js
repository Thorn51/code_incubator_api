//Perform db operations on ideas
const IdeasService = {
  getAllIdeas(knex) {
    return knex.select("*").from("ideas");
  },
  insertIdea(knex, newIdea) {
    return knex
      .insert(newIdea)
      .into("ideas")
      .returning("*")
      .then(rows => {
        return rows[0];
      });
  },
  getById(knex, id) {
    return knex
      .from("ideas")
      .select("*")
      .where("id", id)
      .first();
  },
  deleteIdea(knex, id) {
    return knex("ideas")
      .where({ id })
      .delete();
  },
  updateIdea(knex, id, updateFields) {
    return knex("ideas")
      .where({ id })
      .update(updateFields);
  }
};

module.exports = IdeasService;
