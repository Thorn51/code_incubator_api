const express = require("express");
const logger = require("../logger");

const ideasRouter = express.Router();
const bodyParser = express.json();

const ideas = [
  {
    id: "1",
    user_id: "1",
    project_title: "First Project",
    project_summary:
      "Lorem ipsum dolor sit amet, te autem soluta facilisi vel, feugiat perfecto sapientem sit ei, in sit electram abhorreant. Ne nam aeterno labitur admodum, qui timeam quaerendum ullamcorper ut. Porro debet molestie eu duo, sea no essent feugait. In nec atqui scaevola, ea sed everti sanctus convenire. Ea quod discere pri, hinc incorrupte ne his.",
    date_submitted: "12.21.19",
    status: "Idea",
    github: "fake_url",
    votes: "5"
  }
];

ideasRouter
  .route("/ideas")
  .get((req, res) => {
    res.json(ideas);
    logger.info(`GET "/ideas" response status 200`);
  })
  .post(bodyParser, (req, res) => {
    const {
      user_id,
      project_title,
      project_summary,
      date_submitted,
      status = "idea",
      github = "",
      votes = 0
    } = req.body;

    if (!user_id) {
      logger.error(`POST "/ideas" user_id missing in request body`);
      return res.status(400).send("Invalid data");
    }

    if (!project_title) {
      logger.error(`POST "/ideas" project_title missing in request body`);
      return res.status(400).send("Invalid data");
    }

    if (!project_summary) {
      logger.error(`POST "/ideas" project_summary missing in request body`);
      return res.status(400).send("Invalid data");
    }

    const previousId = ideas[ideas.length - 1].id;
    const id = parseInt(previousId) + 1;

    const idea = {
      id,
      user_id,
      project_title,
      project_summary,
      date_submitted,
      status,
      github,
      votes
    };

    ideas.push(idea);

    logger.info(`POST "/ideas" idea id=${id} created`);

    res
      .status(201)
      .location(`http://localhost:8000/ideas/${id}`)
      .json(idea);
  });

ideasRouter
  .route("/ideas/:id")
  .get((req, res) => {
    const { id } = req.params;
    const idea = ideas.find(idea => idea.id === id);

    if (!idea) {
      logger.error(`GET "/ideas/:id" id=${id} -> idea not found`);
      return res.status(404).send("Idea not found");
    }
    logger.info(`GET "/ideas/:id" - idea.id ${id} delivered`);
    res.json(idea);
  })
  .delete((req, res) => {});

module.exports = ideasRouter;
