const express = require("express");
const router = express.Router();
const services = require("./services");

router.get("/", async (req, res) => {
  const polls = await services.getAllPolls();
  res.status(200).json(polls);
});

router.get("/:id", async (req, res) => {
  const pollId = req.params.id;

  const poll = await services.getPollById(pollId);
  if (!poll) {
    return res.status(404).json({ error: "id not found" });
  }
  res.status(200).json({ message: "Enquete encontrada", poll: poll });
});

router.delete("/:id", async (req, res) => {
  const pollId = req.params.id;

  const poll = await services.getPollById(pollId);
  if (!poll) {
    return res.status(404).json({ error: "poll not found" });
  }

  const deleted = await services.deletePollById(pollId);
  if (!deleted) {
    return res.status(500).json({ error: "failed to delete poll" });
  }

  res.status(200).json({ message: "poll deleted successfully" });
});

let polls = [];

router.post("/poll", (req, res) => {
  const { error, value } = createPollSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { question, options } = value;

  const novaEnquete = {
    pollId: polls.length + 1,
    question,
    options,
  };

  polls.push(novaEnquete);

  return res.status(201).json({ poll: novaEnquete });
});
module.exports = router;
