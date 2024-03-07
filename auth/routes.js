const express = require('express')
const router = express.Router()
const schemas = require('./schemas')
const services = require('./services')

router.post('/signin', async (req, res) => {
  const { error, value } = schemas.signinSchema.validate(req.body)
  if (error) {
    return res
      .status(400)
      
      .json({ error: 'invalid body', details: error.details })
  }

  const user = await services.findUserByEmail(value.email)
  if (!user) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  const isValidPwd = await services.validatePassword(
    value.password,
    user.password
  )
  if (!isValidPwd) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  const token = services.generateAccessToken(user._id)

  res.status(200).json({ result: 'ok', token })
})

router.post('/signup', async (req, res) => {
  const { error, value } = schemas.signupSchema.validate(req.body)
  if (error) {
    return res
      .status(400)
      .json({ error: 'invalid body', details: error.details })
  }

  const user = await services.findUserByEmail(value.email)
  if (user) {
    return res.status(400).json({ error: 'email already in use' })
  }

  const newUser = await services.createUser(value)
  if (!newUser) {
    return res.status(500).json({ error: 'unexpected server error' })
  }

  res.status(200).json({
    id: newUser._id,
    email: newUser.email,
    name: newUser.name,
  })
})
router.get('/users/:id/posts', async (req, res) => {
  try {
    const _db = await getDb()
    const posts = await _db
      .collection(postsCollection)
      .find({ subreditId: new ObjectId(req.params.id) })
      .toArray()

    res.status(200).json(posts)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'unexpected server error' })
  }
})
module.exports = router
