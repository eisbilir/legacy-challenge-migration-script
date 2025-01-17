/**
 * App constants
 */

const prizeSetTypes = {
  ChallengePrizes: 'placement',
  CopilotPayment: 'copilot',
  ReviewerPayment: 'reviewer',
  CheckpointPrizes: 'checkpoint'
}

const challengeStatusOrders = {
  draft: 0,
  active: 1,
  completed: 2,
  deleted: 2,
  cancelled: 2
}

const challengeStatuses = {
  Completed: 'Completed',
}

module.exports = {
  prizeSetTypes,
  challengeStatusOrders,
  challengeStatuses
}
