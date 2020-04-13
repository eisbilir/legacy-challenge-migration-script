/**
 * ChallengeHistory model.
 */

const dynamoose = require('dynamoose')

const Schema = dynamoose.Schema

const schema = new Schema({
  id: {
    type: String,
    hashKey: true,
    required: true
  },
  legacyId: {
    type: Number,
    required: true,
    rangeKey: true,
    index: true
  }
},
{ throughput: 'ON_DEMAND' })

module.exports = schema