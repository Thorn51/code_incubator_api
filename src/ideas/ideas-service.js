const IdeasService = {
  getAllIdeas(knex) {
    return knex.select("*").from("ideas");
  }
};

module.exports = IdeasService;
