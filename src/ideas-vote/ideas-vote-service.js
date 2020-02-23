//Perform operations on the idea_vote table in db
const IdeaVoteService = {
  getAllIdeaVotes(knex) {
    return knex.select("*").from("idea_vote");
  },
  insertVote(knex, vote) {
    return knex
      .insert(vote)
      .into("idea_vote")
      .returning("*")
      .then(rows => {
        return rows[0];
      });
  },
  getById(knex, id) {
    return knex
      .from("idea_vote")
      .select("*")
      .where("id", id)
      .first();
  },
  deleteVote(knex, id) {
    return knex("idea_vote")
      .where({ id })
      .delete();
  },
  updateVote(knex, id, updateVote) {
    return knex("idea_vote")
      .where({ id })
      .update(updateVote);
  }
};

module.exports = IdeaVoteService;
