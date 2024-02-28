const express = require('express')
const router = express.Router()
const services = require('./services')
const schemas = require('./schemas')
const { getDB } = require('../db/mongodb')
const midle = require('../middleware')

router.get('/', async (req, res) => {
  const polls = await services.getAllPolls()
  res.status(200).json(polls)
})

router.get('/:id', async (req, res) => {
  const pollId = req.params.id

  const poll = await services.getPollById(pollId)
  if (!poll) {
    return res.status(404).json({ error: 'id not found' })
  }
  res.status(200).json({ message: 'Enquete encontrada', poll: poll })
})

router.delete('/:id', async (req, res) => {
  const pollId = req.params.id

  const poll = await services.getPollById(pollId)
  if (!poll) {
    return res.status(404).json({ error: 'poll not found' })
  }

  const deleted = await services.deletePollById(pollId)
  if (!deleted) {
    return res.status(500).json({ error: 'failed to delete poll' })
  }

  res.status(200).json({ message: 'poll deleted successfully' })
})

router.post('/poll', async (req, res) => {
  const { error, value } = schemas.createPollSchema.validate(req.body)

  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }

  const db = await getDB()
  const collection = db.collection('polls')

  const { question, options } = value

  try {
    const result = await collection.insertOne({
      question,
      options,
    })

    if (result.insertedCount === 1) {
      const novaEnquete = {
        pollId: result.insertedId,
        question,
        options,
      }

      return res.status(201).json({ poll: novaEnquete })
    } else {
      console.error('Erro ao salvar a enquete:', err)
    }
  } catch (err) {
    return res.status(500).json({ message: 'Erro interno do servidor' })
  }
})

router.post('/:pollId/vote', midle.auth, async (req, res) => {
  const { error, value } = schemas.voteSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ error: 'Invalid vote details' })
  }

  const pollId = req.params.pollId
  const { option } = value

  const poll = await services.getPollById(pollId)

  if (!poll.options.includes(option)) {
    return res.status(400).json({ error: 'Invalid vote option' })
  }

  const db = await getDB()
  const collection = db.collection('polls')
  await services.votepoll(value, pollId)

  const updatedPoll = await services.getPollById(pollId)
  res
    .status(200)
    .json({ message: 'Vote recorded successfully', poll: updatedPoll })
})

module.exports = router
