/**
 * helper methods
 */
const _ = require('lodash')
const ifxnjs = require('ifxnjs')
const config = require('config')
const elasticsearch = require('elasticsearch')
const moment = require('moment-timezone')
const AWS = require('aws-sdk')
const m2mAuth = require('tc-core-library-js').auth.m2m
const m2m = m2mAuth(_.pick(config, ['AUTH0_URL', 'AUTH0_AUDIENCE', 'TOKEN_CACHE_TIME', 'AUTH0_PROXY_SERVER_URL']))

// Elasticsearch client
let esClient

AWS.config.update({
  s3: config.AMAZON.S3_API_VERSION,
  accessKeyId: config.AMAZON.AWS_ACCESS_KEY_ID,
  secretAccessKey: config.AMAZON.AWS_SECRET_ACCESS_KEY,
  region: config.AMAZON.AWS_REGION
})

/**
 * Get ES Client
 * @return {Object} Elasticsearch Client Instance
 */
function getESClient () {
  if (esClient) {
    return esClient
  }
  const esHost = config.get('ES.HOST')
  // AWS ES configuration is different from other providers
  if (/.*amazonaws.*/.test(esHost)) {
    esClient = elasticsearch.Client({
      apiVersion: config.get('ES.API_VERSION'),
      hosts: esHost,
      connectionClass: require('http-aws-es'), // eslint-disable-line global-require
      amazonES: {
        region: config.get('AMAZON.AWS_REGION'),
        credentials: new AWS.EnvironmentCredentials('AWS')
      }
    })
  } else {
    esClient = new elasticsearch.Client({
      apiVersion: config.get('ES.API_VERSION'),
      hosts: esHost
    })
  }
  return esClient
}

const Pool = ifxnjs.Pool
const pool = Promise.promisifyAll(new Pool())
pool.setMaxPoolSize(config.get('INFORMIX.POOL_MAX_SIZE'))

/**
 * Get Informix connection using the configured parameters
 * @return {Object} Informix connection
 */
async function getInformixConnection () {
  // construct the connection string from the configuration parameters.
  const connectionString = 'SERVER=' + config.get('INFORMIX.SERVER') +
                           ';DATABASE=' + config.get('INFORMIX.DATABASE') +
                           ';HOST=' + config.get('INFORMIX.HOST') +
                           ';Protocol=' + config.get('INFORMIX.PROTOCOL') +
                           ';SERVICE=' + config.get('INFORMIX.PORT') +
                           ';DB_LOCALE=' + config.get('INFORMIX.DB_LOCALE') +
                           ';UID=' + config.get('INFORMIX.USER') +
                           ';PWD=' + config.get('INFORMIX.PASSWORD')
  const conn = await pool.openAsync(connectionString)
  return Promise.promisifyAll(conn)
}

/**
 * Generate informx-flavor date from date string.
 * Also, changes the timezone to EST
 *
 * @param {String} date the date to be converted
 * @returns {String} informx-flavor date
 */
function generateInformxDate (date) {
  return moment().tz('America/New_York').format('YYYY-MM-DD HH:mm:ss.SSS')
}

/**
 * Wrap async function to standard express function
 * @param {Function} fn the async function
 * @returns {Function} the wrapped function
 */
function wrapRouter (fn) {
  return function (req, res, next) {
    fn(req, res, next).catch(next)
  }
}

/**
 * Get M2M token.
 * @returns {Promise<String>} the M2M token
 */
async function getM2MToken () {
  return m2m.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET)
}

module.exports = {
  wrapRouter,
  getESClient,
  getInformixConnection,
  generateInformxDate,
  getM2MToken
}
