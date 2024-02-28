const db = require('../db/mongodb')

async function getPollById(pollId) {
  try {
    return await db
      .getDB()
      .collection(db.pollsCollection)
      .findOne({ _id: db.toMongoID(pollId) })
  } catch (error) {
    console.log(error)
    return null
  }
}

async function getAllPolls() {
  try {
    return await db.getDB().collection(db.pollsCollection).find({}).toArray()
  } catch (error) {
    console.log(error)
    return []
  }
}

async function deletePollById(pollId) {
  try {
    const result = await db
      .getDB()
      .collection(db.pollsCollection)
      .deleteOne({ _id: db.toMongoID(pollId) })

    return result.deletedCount > 0
  } catch (error) {
    console.log(error)
    return false
  }
}
async function votepoll(vote, pollId) {
  try {
    const result = await db.getDB
      .collection(db.pollsCollection)
      .findOneAndUpdate(
        { _id: db.toMongoID(pollId) },
        { $set: { vote: vote.option } },
        { upsert: true, returnDocument: 'affter' }
      )
    console.log(vote, pollId)
    return result
  } catch (e) {
    console.log(e)
    return false
  }
}

module.exports = {
  getPollById,
  getAllPolls,
  votepoll,
  deletePollById,
}
