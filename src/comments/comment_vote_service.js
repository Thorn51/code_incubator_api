//Perform operations on the comments_votes table in db
const CommentVoteService = {
  getAllCommentVotes(knex) {
    return knex.select("*").from("comment_vote");
  },
  insertVote(knex, vote) {
    return knex
      .insert(vote)
      .into("comment_vote")
      .returning("*")
      .then(rows => {
        return rows[0];
      });
  },
  getById(knex, id) {
    return knex
      .from("comment_vote")
      .select("*")
      .where("id", id)
      .first();
  },
  deleteVote(knex, id) {
    return knex("comment_vote")
      .where({ id })
      .delete();
  },
  updateComment(knex, id, updateVote) {
    return knex("comment_vote")
      .where({ id })
      .update(updateVote);
  }
};

module.exports = CommentVoteService;
