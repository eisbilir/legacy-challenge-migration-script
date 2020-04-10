/*
 * Services for API.
 */
const actions = require('../actions')
const ora = require('ora')
const logger = require('../util/logger')

const status = {
  RUNNING: 'Running',
  IDLE: 'Idle'
}

let currentStatus = status.IDLE
const spinner = ora('Legacy Challenge Migration API')
const migration = {}
const retry = {}

/**
 * Run the migration.
 *
 * @returns {Promise} migration become idle when resolved
 */
migration.run = () => {
  if (migration.isRunning()) {
    return Promise.resolve()
  }
  currentStatus = status.RUNNING
  return actions.migrate.ALL(spinner)
    .catch((err) => {
      logger.logFullError(err)
    })
    .then(() => {
      currentStatus = status.IDLE
    })
}

/**
 * Retry the migration for a single challenge.
 *
 * @param {Number} challengeId the challenge ID
 * @returns {Promise} migration become idle when resolved
 */
retry.run = (challengeId) => {
  if (migration.isRunning()) {
    return Promise.resolve()
  }
  currentStatus = status.RUNNING
  return actions.retry.ALL(spinner, challengeId)
    .catch((err) => {
      logger.logFullError(err)
    })
    .then(() => {
      currentStatus = status.IDLE
    })
}

/**
 * Check if the migration is running or idle.
 *
 * @returns {undefined}
 */
migration.isRunning = () => {
  return currentStatus === status.RUNNING
}

/**
 * Get current migration status.
 *
 * @returns {undefined}
 */
migration.getStatus = () => {
  return currentStatus
}

/**
 * Health check
 *
 * @returns {Boolean}
 */
migration.isHealthy = () => {
  // TODO: do actual checks here
  return true
}

module.exports = {
  migration,
  retry
}
