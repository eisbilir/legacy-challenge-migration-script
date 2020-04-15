/*
 * Express routers.
 */
const helper = require('./util/helper')
const { migration, retry } = require('./migrationInstance')
const fs = require('fs')

const getPreviousLogs = async () => {
  return new Promise((resolve) => {
    let crashLog
    let errorLog
    try {
      crashLog = fs.readFileSync('../../crash.log')
    } catch (e) {
      crashLog = 'N/A'
    }
    try {
      errorLog = fs.readFileSync('../../error.json')
    } catch (e) {
      errorLog = 'N/A'
    }
    resolve({
      crashLog,
      errorLog
    })
  })
}

const handleConflict = async (res, req) => {
  res.status(409).send({
    message: 'The migration is running.',
    ...(await getPreviousLogs())
  })
}

/**
 * Run migration.
 *
 * @param {Object} req the express request object
 * @param {Object} res the express response object
 * @returns {undefined}
 */
async function runMigration (req, res, next) {
  console.log('Run Migration')
  if (migration.isRunning()) {
    await handleConflict(res, req)
    return
  }
  migration.run().catch(next)
  res.sendStatus(200)
}

/**
 * Retry migration.
 *
 * @param {Object} req the express request object
 * @param {Object} res the express response object
 * @returns {undefined}
 */
async function retryMigration (req, res, next) {
  console.log('Retry Migration')
  if (migration.isRunning()) {
    await handleConflict(res, req)
    return
  }
  retry.run(req.params.challengeId).catch(next)
  res.sendStatus(200)
}

/**
 * Check the current status of the migration.
 *
 * @param {Object} req the express request object
 * @param {Object} res the express response object
 * @returns {undefined}
 */
async function checkStatus (req, res) {
  if (migration.isRunning()) {
    await handleConflict(res, req)
    return
  }
  console.log('Check Status')
  return res.send({
    status: migration.getStatus(),
    ...(await getPreviousLogs())
  })
}

module.exports = {
  runMigration: helper.wrapRouter(runMigration),
  checkStatus: helper.wrapRouter(checkStatus),
  retryMigration: helper.wrapRouter(retryMigration)
}