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

router.delete('/:id', midle.auth, async (req, res) => {
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

router.post('/poll', midle.auth, async (req, res) => {
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
  try {
    const { error, value } = schemas.voteSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ error: 'Detalhes de voto inválidos' })
    }

    const pollId = req.params.pollId
    const { option } = value

    const poll = await services.getPollById(pollId)

    if (!poll.options.includes(option)) {
      return res.status(400).json({ error: 'Opção de voto inválida' })
    }

    const db = await getDB()
    const collection = db.collection('polls')
    await services.votepoll(value, pollId)

    const updatedPoll = await services.getPollById(pollId)
    
    // Contagem de votos para cada opção
    const voteCounts = updatedPoll.options.reduce((counts, opt) => {
      counts[opt] = (updatedPoll.votes || []).filter(vote => vote.option === opt).length
      return counts
    }, {})

    return res.status(200).json({ message: 'Voto registrado com sucesso', option: option, voteCounts: voteCounts })
  } catch (err) {
    console.error('Erro ao processar a solicitação de voto:', err)
    return res.status(500).json({ error: 'Ocorreu um erro ao processar a solicitação de voto' })
  }
})





module.exports = router
