// challenge service
const uuid = require('uuid/v4')
const config = require('config')
const request = require('superagent')
const moment = require('moment')
const axios = require('axios')
const _ = require('lodash')
const HashMap = require('hashmap')
const { Challenge, ChallengeType, ChallengeTimelineTemplate } = require('../models')
const logger = require('../util/logger')
const helper = require('../util/helper')
const { getESClient, getV4ESClient, getM2MToken } = require('../util/helper')
const challengeInformixService = require('./challengeInformixService')
const resourceService = require('./resourceService')
const translationService = require('./translationService')

let allV5Terms

const groupsUUIDCache = new HashMap()
const challengePropertiesToOmitFromDynamo = [
  'numOfSubmissions',
  'numOfRegistrants',
  'registrationStartDate',
  'registrationEndDate',
  'currentPhaseNames',
  'submissionStartDate',
  'submissionEndDate',
  'type',
  'track'
]

async function save (challenge) {
  if (challenge.id) {
    // logger.warn(`Updating Challenge ${JSON.stringify(challenge)}`)
    return updateChallenge(challenge)
  }
  return createChallenge(challenge)
}
/**
 * Put challenge data to new system
 * @param {Object} challenge new challenge data
 */
async function createChallenge (challenge) {
  challenge.id = uuid()
  // numOfSubmissions and numOfRegistrants are not stored in dynamo, they're calclated by the ES processor
  const dynamoChallenge = new Challenge(_.omit(challenge, challengePropertiesToOmitFromDynamo))

  try {
    await dynamoChallenge.save()
    await getESClient().create({
      index: config.get('ES.CHALLENGE_ES_INDEX'),
      type: config.get('ES.CHALLENGE_ES_TYPE'),
      refresh: config.get('ES.ES_REFRESH'),
      id: challenge.id,
      body: {
        ...challenge,
        groups: _.filter(challenge.groups, g => _.toString(g).toLowerCase() !== 'null')
      }
    })
    return challenge.id
  } catch (e) {
    throw Error(`createChallenge Failed ${e}`)
  }
}

/**
 * Update challenge data to new system
 * @param {Object} challenge challenge data
 */
async function updateChallenge (challenge) {
  try {
    // numOfSubmissions and numOfRegistrants are not stored in dynamo, they're calclated by the ES processor
    await Challenge.update({ id: challenge.id }, _.omit(challenge, challengePropertiesToOmitFromDynamo))
    await getESClient().update({
      index: config.get('ES.CHALLENGE_ES_INDEX'),
      type: config.get('ES.CHALLENGE_ES_TYPE'),
      refresh: config.get('ES.ES_REFRESH'),
      id: challenge.id,
      body: {
        doc: {
          ...challenge,
          groups: _.filter(challenge.groups, g => _.toString(g).toLowerCase() !== 'null')
        }
      }
    })
    return challenge.id
  } catch (e) {
    throw Error(`updateChallenge Failed ${e}`)
  }
}

/**
 * Delete Challenge Data
 * @param {Object} challenge challenge data
 */
async function deleteChallenge (challengeId) {
  try {
    await resourceService.deleteAllResourcesForChallenge(challengeId)
    // logger.warn('Delete Challenge From Dynamo')
    await Challenge.delete({ id: challengeId })
    // logger.warn('Delete Challenge From ES')
    return getESClient().deleteByQuery({
      index: config.get('ES.CHALLENGE_ES_INDEX'),
      type: config.get('ES.CHALLENGE_ES_TYPE'),
      refresh: config.get('ES.ES_REFRESH'),
      body: {
        query: {
          match_phrase: {
            id: challengeId
          }
        }
      }
    })
    // logger.warn('Delete Challenge Resources')
  } catch (e) {
    throw Error(`updateChallenge Failed ${e}`)
  }
}

/**
 * Get existing challenges from ES using legacyId
 */
async function getChallengesFromES (legacyIds) {
  const esQuery = {
    index: config.get('ES.CHALLENGE_ES_INDEX'),
    type: config.get('ES.CHALLENGE_ES_TYPE'),
    // refresh: config.get('ES.ES_REFRESH'),
    size: _.get(legacyIds, 'length', 1),
    from: 0, // Es Index starts from 0
    body: {
      query: {
        bool: {
          should: _.map(legacyIds, legacyId => ({
            match: {
              legacyId: legacyId
            }
          }))
        }
      }
    }
  }
  // Search with constructed query
  let docs
  try {
    docs = await getESClient().search(esQuery)
  } catch (e) {
    // Catch error when the ES is fresh and has no data
    docs = {
      hits: {
        total: 0,
        hits: []
      }
    }
  }
  // Extract data from hits
  return _.map(docs.hits.hits, item => ({
    legacyId: item._source.legacyId,
    legacy: {
      screeningScorecardId: _.get(item._source, 'legacy.screeningScorecardId'),
      reviewScorecardId: _.get(item._source, 'legacy.reviewScorecardId')
    },
    challengeId: item._source.id
  }))
}

/**
 * Get existing challenges from ES using legacyId
 */
async function getChallengeFromES (legacyId) {
  const esQuery = {
    index: config.get('ES.CHALLENGE_ES_INDEX'),
    type: config.get('ES.CHALLENGE_ES_TYPE'),
    // refresh: config.get('ES.ES_REFRESH'),
    size: _.get(legacyId, 'length', 1),
    from: 0, // Es Index starts from 0
    body: {
      query: {
        bool: {
          should: {
            match: {
              legacyId
            }
          }
        }
      }
    }
  }
  // Search with constructed query
  let docs
  try {
    docs = await getESClient().search(esQuery)
  } catch (e) {
    // Catch error when the ES is fresh and has no data
    docs = {
      hits: {
        total: 0,
        hits: []
      }
    }
  }
  // Extract data from hits
  return _.map(docs.hits.hits, item => ({
    legacyId: item._source.legacyId,
    legacy: {
      screeningScorecardId: _.get(item._source, 'legacy.screeningScorecardId'),
      reviewScorecardId: _.get(item._source, 'legacy.reviewScorecardId')
    },
    challengeId: item._source.id
  }))
}

/**
 * Get project from v5 API.
 *
 * @param {String} directProjectId the direct project id
 * @returns {Object} the project
 */
async function getProjectFromV5 (directProjectId) {
  const token = await helper.getM2MToken()
  const url = `${config.PROJECTS_API_URL}?directProjectId=${directProjectId}`
  const res = await request.get(url).set({ Authorization: `Bearer ${token}` })
  return _.get(res, 'body[0]')
}

/**
 * Create challenge timeline mapping from challenge types.
 * @param {Array} typeIds challenge types id
 */
function createChallengeTimelineMapping (challengeTimelines, types) {
  const mapping = {}

  for (const type of types) {
    const template = _.find(challengeTimelines, { typeId: type.id })
    if (template && type.legacyId) {
      mapping[type.legacyId] = template.timelineTemplateId
      // console.log('Timeline Found', type.id, template.timelineTemplateId)
    }
  }
  return mapping
}

/**
 * Get challenge types from dynamo DB.
 *
 * @returns {Array} the challenge types
 */
async function getChallengeTypesFromDynamo () {
  const result = await ChallengeType.scan().exec()
  return result
}

/**
 * getChallengeIDsFromV4
 * @param {Object} filter {startDate, endDate, legacyId, status}
 * @param {Number} perPage
 * @param {Number} page
 * @returns {Object} { total, ids }
 */
async function getChallengeIDsFromV4 (filter, perPage, page = 1) {
  const boolQuery = []
  const mustQuery = []
  if (filter.startDate) {
    boolQuery.push({ range: { updatedAt: { gte: filter.startDate } } })
  }
  if (filter.endDate) {
    boolQuery.push({ range: { updatedAt: { lte: filter.endDate } } })
  }
  if (filter.legacyId) {
    boolQuery.push({ match: { _id: filter.legacyId } })
  }
  if (filter.status) {
    boolQuery.push({ match_phrase: { status: filter.status } })
  }

  if (boolQuery.length > 0) {
    mustQuery.push({
      bool: {
        filter: boolQuery
      }
    })
  }

  const esQuery = {
    index: 'challengeslisting',
    type: 'challenges',
    // refresh: config.get('ES.ES_REFRESH'),
    size: perPage,
    from: perPage * (page - 1),
    _source: ['id'],
    body: {
      version: 'true',
      query: mustQuery.length > 0 ? {
        bool: {
          must: mustQuery
          // must_not: mustNotQuery
        }
      } : {
        match_all: {}
      },
      sort: [
        { updatedAt: 'desc' }
      ]
    }
  }
  // Search with constructed query
  let docs
  // logger.warn(`V4 Challenge IDs Query ${JSON.stringify(esQuery)}`)
  try {
    docs = await getV4ESClient().search(esQuery)
  } catch (e) {
    // Catch error when the ES is fresh and has no data
    logger.error(e)
    docs = {
      hits: {
        total: 0,
        hits: []
      }
    }
  }
  // logger.warn(JSON.stringify(docs))
  // Extract data from hits
  if (docs.hits.total > 0) return { total: docs.hits.total, ids: _.map(docs.hits.hits, hit => hit._source.id) }
  return false
}
/**
 * getChallengeIDsFromV5
 * @param {Object} filter {startDate, endDate, legacyId, status}
 * @param {Number} perPage
 * @param {Number} page
 * @returns {Object} { total, ids }
 */
async function getChallengeIDsFromV5 (filter, perPage, page = 1) {
  // logger.warn(`getChallengeIDsFromV5 ${JSON.stringify(filter)} perPage ${perPage} page ${page}`)
  const boolQuery = []
  const mustQuery = []
  if (filter.startDate) {
    boolQuery.push({ range: { updated: { gte: filter.startDate } } })
  }
  if (filter.endDate) {
    boolQuery.push({ range: { updated: { lte: filter.endDate } } })
  }
  if (filter.legacyId) {
    boolQuery.push({ match: { legacyId: filter.legacyId } })
  }
  if (filter.status) {
    boolQuery.push({ match_phrase: { status: filter.status } })
  }

  if (boolQuery.length > 0) {
    mustQuery.push({
      bool: {
        filter: boolQuery
      }
    })
  }

  const esQuery = {
    index: config.get('ES.CHALLENGE_ES_INDEX'),
    type: config.get('ES.CHALLENGE_ES_TYPE'),
    // refresh: config.get('ES.ES_REFRESH'),
    size: perPage,
    from: perPage * (page - 1),
    _source: ['legacyId'],
    body: {
      version: 'true',
      query: mustQuery.length > 0 ? {
        bool: {
          must: mustQuery
          // must_not: mustNotQuery
        }
      } : {
        match_all: {}
      },
      sort: [
        { updated: 'desc' }
      ]
    }
  }
  // Search with constructed query
  let docs
  // logger.warn(`V5 Challenge IDs Query ${JSON.stringify(esQuery)}`)
  try {
    docs = await getESClient().search(esQuery)
  } catch (e) {
    // Catch error when the ES is fresh and has no data
    logger.error(e)
    docs = {
      hits: {
        total: 0,
        hits: []
      }
    }
  }
  // logger.warn(JSON.stringify(docs))
  // Extract data from hits
  if (docs.hits.total > 0) return { total: docs.hits.total, ids: _.map(docs.hits.hits, hit => _.toNumber(hit._source.legacyId)) }
  return false
}

async function getChallengeListingFromV4ES (legacyId) {
  const esQuery = {
    index: 'challengeslisting',
    type: 'challenges',
    size: 1,
    from: 0, // Es Index starts from 0
    // id: legacyId
    body: {
      version: 'true',
      query: {
        match: {
          id: legacyId
        }
      }
    }
  }
  // Search with constructed query
  let docs
  // console.log('es query', JSON.stringify(esQuery))
  try {
    docs = await getV4ESClient().search(esQuery)
  } catch (e) {
    // Catch error when the ES is fresh and has no data
    // logger.error(e)
    docs = {
      hits: {
        total: 0,
        hits: []
      }
    }
  }
  // Extract data from hits
  if (docs.hits.hits && docs.hits.hits[0]) {
    return { data: docs.hits.hits[0]._source, version: docs.hits.hits[0]._version }
  }
  return {}
}

async function getChallengeDetailFromV4ES (legacyId) {
  const esQuery = {
    index: 'challengesdetail',
    type: 'challenges',
    size: 1,
    from: 0, // Es Index starts from 0
    // id: legacyId
    body: {
      version: 'true',
      query: {
        match: {
          id: legacyId
        }
      }
    }
  }
  // Search with constructed query
  let docs
  // console.log('es query', JSON.stringify(esQuery))
  try {
    docs = await getV4ESClient().search(esQuery)
  } catch (e) {
    // Catch error when the ES is fresh and has no data
    logger.error(e)
    docs = {
      hits: {
        total: 0,
        hits: []
      }
    }
  }
  // Extract data from hits
  if (docs.hits.hits && docs.hits.hits[0]) {
    return { data: docs.hits.hits[0]._source, version: docs.hits.hits[0]._version }
  }
  return {}
}

/**
 * Convert track and type to a timelineTemplateId
 * @param {String} trackId
 * @param {String} typeId
 */
async function mapTimelineTemplateId (trackId, typeId) {
  const templates = await ChallengeTimelineTemplate.scan('trackId').contains(trackId).exec()
  const template = _.find(templates, { typeId })
  if (template) return template.id
  throw new Error(`Timeline Template Not found for trackId: ${trackId} typeId: ${typeId}`)
}

/**
 * Builds a V5 Challenge from V4 ES & Informix
 * @param {Number} legacyId
 * @returns {Object} v5ChallengeObject
 */
async function buildV5Challenge (legacyId, challengeListing, challengeDetails) {
  if (!challengeListing) {
    const challengeListingObj = await getChallengeListingFromV4ES(legacyId)
    challengeListing = challengeListingObj.data
  }
  if (!challengeDetails) {
    const challengeDetailObj = await getChallengeDetailFromV4ES(legacyId)
    challengeDetails = challengeDetailObj.data
  }

  const allGroups = challengeListing.groupIds

  if (!allV5Terms) {
    allV5Terms = await getAllV5Terms()
  }

  let groups = []
  if (allGroups && allGroups.length > 0) {
    // logger.warn(`Old Group Ids ${JSON.stringify(allGroups)}`)
    groups = await convertGroupIdsToV5UUIDs(allGroups)
  }

  // for (const challenge of challenges) {
  logger.info(`Building Challenge ${challengeListing.id} - Last Modified Date ${moment(challengeListing.updatedAt).utc().format()}`)

  let detailRequirement = ''

  if (challengeDetails) {
    detailRequirement += challengeDetails.detailRequirements
    if (challengeDetails.introduction && challengeDetails.introduction.trim() !== '') {
      detailRequirement = challengeDetails.introduction + '<br />' + detailRequirement
    }
    if (challengeDetails.finalSubmissionGuidelines && challengeDetails.finalSubmissionGuidelines.trim() !== '') {
      detailRequirement += '<br /><br /><h2>Final Submission Guidelines</h2>' + challengeDetails.finalSubmissionGuidelines
    }
  } else {
    logger.warn(`!! No Challenge Details v4 index entry for ${legacyId}. Spec & Terms will be missing`)
  }

  let connectProjectId = null
  if (challengeListing.projectId) {
    // can't query v5 api for "undefined", so catch it here
    connectProjectId = _.get((await getProjectFromV5(challengeListing.projectId)), 'id', null)
  } else {
    logger.warn(`Project has no directProjectId: ${challengeListing.id}`)
  }

  const [challengeInfoFromIfx] = await challengeInformixService.getChallengeInfo(legacyId)

  // if (!challengeTypeMapping[challengeInfoFromIfx.type_id]) {
  //   // logger.error('Throwing Error')
  //   throw Error(`Challenge Type ID ${challengeInfoFromIfx.type_id} not found for legacyId ${legacyId}`)
  // }

  const v5TrackProperties = translationService.convertV4TrackToV5(
    challengeListing.track,
    challengeListing.subTrack,
    challengeListing.isTask || false)

  const newChallenge = {
    id: null, // this is removed from here and created in the save function
    legacyId,
    status: challengeListing.status,
    track: v5TrackProperties.track,
    type: v5TrackProperties.type,
    trackId: v5TrackProperties.trackId,
    typeId: v5TrackProperties.typeId,
    legacy: {
      track: challengeListing.track,
      subTrack: challengeListing.subTrack,
      forumId: challengeListing.forumId,
      directProjectId: challengeListing.projectId,
      reviewType: challengeListing.reviewType || 'COMMUNITY',
      screeningScorecardId: challengeListing.screeningScorecardId,
      reviewScorecardId: challengeListing.reviewScorecardId
    },
    task: {
      isTask: challengeListing.isTask || false,
      isAssigned: (challengeListing.submitterIds && challengeListing.submitterIds.length >= 1) || false,
      memberId: (challengeListing.submitterIds && challengeListing.submitterIds.length === 1) ? _.toString(challengeListing.submitterIds[0]) : ''
    },
    name: challengeListing.challengeTitle,
    description: detailRequirement || '',
    descriptionFormat: 'HTML',
    projectId: connectProjectId,
    created: moment(challengeListing.createdAt).utc().format(),
    createdBy: challengeInfoFromIfx ? challengeInfoFromIfx.created_by : 'v5migration',
    updated: moment(challengeListing.updatedAt).utc().format(),
    updatedBy: challengeInfoFromIfx ? challengeInfoFromIfx.updated_by : 'v5migration',
    timelineTemplateId: await mapTimelineTemplateId(v5TrackProperties.trackId, v5TrackProperties.typeId),
    phases: [],
    terms: [],
    startDate: moment().utc().format(),
    numOfSubmissions: _.toNumber(challengeListing.numberOfSubmissions),
    numOfRegistrants: _.toNumber(challengeListing.numberOfRegistrants)
  }

  const prizeSet = { type: 'placement', description: 'Challenge Prizes' }
  prizeSet.prizes = _.map(challengeListing.prize, e => ({ value: e, type: 'USD' }))
  const prizeSets = [prizeSet]

  // review this
  if (challengeListing.numberOfCheckpointPrizes > 0) {
    const prizeSet = { type: 'checkpoint', description: 'Checkpoint Prizes' }
    prizeSet.prizes = []
    for (let i = 0; i < challengeListing.numberOfCheckpointPrizes; i += 1) {
      prizeSet.prizes.push({ value: challengeListing.topCheckPointPrize, type: 'USD' })
    }
    prizeSets.push(prizeSet)
  }

  const tags = _.uniq(_.compact(_.concat(challengeListing.technologies, challengeListing.platforms, v5TrackProperties.tags)))

  const winners = _.map(challengeListing.winners, w => {
    return {
      // userId: w.submitter, // TODO - look up handle?
      handle: w.submitter,
      placement: w.rank
    }
  })

  // get terms belong to this challenge
  const terms = []
  if (challengeDetails && challengeDetails.terms) {
    _.map(challengeDetails.terms, async term => {
      // console.log('Term', term)
      const v5Term = _.find(allV5Terms, v5Term => v5Term.legacyId === term.termsOfUseId)
      if (v5Term) {
        let roleId = null
        try {
          roleId = await resourceService.getRoleUUIDForResourceRoleName(term.role)
          terms.push({ id: v5Term.id, roleId })
        } catch (e) {
          // logger.warn(`Term Role ${term.role} not found - not creating association`)
        }
      } else {
        // logger.error(`V5 Term Not Found for ${term.termsOfUseId}`)
        throw Error(`V5 Term ${term.termsOfUseId} not found for legacyId ${legacyId}`)
      }
    })
  }

  newChallenge.startDate = moment(challengeListing.registrationStartDate).utc().format()
  let challengeEndDate = newChallenge.startDate
  const phases = _.map(challengeListing.phases, phase => {
    // console.log(phase.scheduled_start_time, Date.parse(phase.scheduled_start_time), phase.duration, (phase.duration / 1000 / 60 / 60))
    const v5duration = _.toInteger(Number(phase.duration) / 1000)
    // console.log('phase', phase)
    const newPhase = {
      id: uuid(),
      name: phase.type,
      phaseId: _.get(_.find(config.get('PHASE_NAME_MAPPINGS'), { name: phase.type }), 'phaseId'),
      duration: v5duration,
      scheduledStartDate: moment(phase.scheduledStartTime).utc().format(),
      scheduledEndDate: moment(phase.scheduledEndTime).utc().format(),
      actualStartDate: moment(phase.actualStartTime).utc().format(),
      actualEndDate: moment(phase.actualEndTime).utc().format()
    }
    // logger.warn(`Original Date: ${phase.scheduledStartTime}`)
    // logger.warn(`Parsed UTC Formatted Date: ${moment(phase.scheduledStartTime).utc().format()}`)

    challengeEndDate = moment(phase.scheduledEndTime).utc().format()
    if (phase.status === 'Open') {
      newPhase.isOpen = true
    } else {
      newPhase.isOpen = false
    }
    return newPhase
  })
  newChallenge.endDate = challengeEndDate

  if (phases.length > 0) {
    const registrationPhase = _.find(phases, p => p.name === 'Registration')
    const submissionPhase = _.find(phases, p => p.name === 'Submission')
    newChallenge.currentPhaseNames = _.map(_.filter(phases, p => p.isOpen === true), 'name')
    if (registrationPhase) {
      newChallenge.registrationStartDate = registrationPhase.actualStartDate || registrationPhase.scheduledStartDate
      newChallenge.registrationEndDate = registrationPhase.actualEndDate || registrationPhase.scheduledEndDate
    }
    if (submissionPhase) {
      newChallenge.submissionStartDate = submissionPhase.actualStartDate || submissionPhase.scheduledStartDate
      newChallenge.submissionEndDate = submissionPhase.actualEndDate || submissionPhase.scheduledEndDate
    }
  }

  const metadata = []
  if (challengeListing.fileTypes && challengeListing.fileTypes.length > 0) {
    const fileTypes = _.map(challengeListing.fileTypes, fileType => fileType.description)
    // console.log(fileTypes)
    metadata.push({ name: 'fileTypes', value: JSON.stringify(fileTypes) })
  }

  const metadataList = ['allowStockArt', 'drPoints', 'submissionViewable', 'submissionLimit', 'codeRepo', 'environment']
  const allMetadata = _.map(metadataList, item => {
    if (challengeListing[item]) return { name: item, value: _.toString(challengeListing[item]) }
  })
  metadata.push(..._.compact(allMetadata))

  const events = []
  if (challengeListing.events && challengeListing.events.length > 0) {
    for (const event of challengeListing.events) {
      if (!_.find(events, { id: event.id })) {
        events.push({
          id: event.id,
          name: event.eventDescription,
          key: event.eventShortDesc
        })
      } else {
        logger.debug(`Duplicate event ${JSON.stringify(event)}`)
      }
    }
  }

  // console.log(JSON.stringify(metadata))

  return _.assign(newChallenge, { prizeSets, tags, groups, winners, phases, metadata, terms, events })
}

/**
 * Builds & Saves a v5 Challenge
 * @param {Number} legacyId
 * @returns V5 Challenge UUID
 */
async function migrateChallenge (legacyId) {
  return save(await buildV5Challenge(legacyId, null, null))
}
async function getAllV5Terms () {
  logger.debug('Getting V5 Terms')
  const token = await helper.getM2MToken()
  let allTerms = []
  // get search is paginated, we need to get all pages' data
  let page = 1
  // TODO: move this to configs
  const perPage = 100 // max number of items per page
  while (true) {
    const result = await request.get(`${config.TERMS_API_URL}?page=${page}&perPage=${perPage}`).set({ Authorization: `Bearer ${token}` })
    const terms = result.body.result || []
    if (terms.length === 0) {
      break
    }
    allTerms = allTerms.concat(terms)
    page += 1
    if (result.headers['x-total-pages'] && page > Number(result.headers['x-total-pages'])) {
      break
    }
  }
  return allTerms
}

async function convertGroupIdsToV5UUIDs (oldIds) {
  // console.log('Convert to UUIDs', groupOldIdArray)
  // format groupOldIdArray[{ challenge_id, group_id }]
  let token = null
  const groups = []
  for (const oldId of oldIds) {
    if (groupsUUIDCache.get(oldId)) {
      // logger.debug(`Group Found in Cache! ${oldId} - ${groupsUUIDCache.get(oldId)}`)
      groups.push(groupsUUIDCache.get(oldId))
    } else {
      if (!token) token = await helper.getM2MToken()
      logger.debug(`Calling v5 Groups API - ${config.GROUPS_API_URL}?oldId=${oldId}`)
      const result = await request.get(`${config.GROUPS_API_URL}?oldId=${oldId}`).set({ Authorization: `Bearer ${token}` })
      const resultObj = JSON.parse(result.text)
      if (resultObj && resultObj[0]) {
        groupsUUIDCache.set(oldId, resultObj[0].id)
        groups.push(groupsUUIDCache.get(oldId))
      } else {
        // logger.error('Group not Found in API', oldId)
        throw new Error(`Legacy Group ID ${oldId} not found in v5 Groups API`)
      }
    }
  }
  return groups
}

async function getChallengeFromV5API (legacyId) {
  const token = await getM2MToken()
  const url = `${config.CHALLENGE_API_URL}?legacyId=${legacyId}&perPage=1&page=1`
  // logger.debug(`Get Challenge from V5 URL ${url}`)
  let res = null
  try {
    res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } })
  } catch (e) {
    logger.error(`Axios Error: ${JSON.stringify(e)}`)
  }
  // console.log(res.data)
  return res.data || null
}

async function getChallengeSubmissionsFromV5API (challengeId, type) {
  const token = await getM2MToken()
  let url = `${config.SUBMISSIONS_API_URL}?challengeId=${challengeId}&perPage=1`
  if (type) {
    url += `&type=${type}`
  }
  // logger.warn(`Getting Submissions: ${url}`)
  const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } })
  // logger.warn(`Getting Submissions Response: ${JSON.stringify(res.data)} ${res.headers['x-total']}`)
  if (res) return { result: res.data, total: res.headers['x-total'] }

  return { results: [], total: 0 }
}

module.exports = {
  save,
  buildV5Challenge,
  migrateChallenge,
  // cacheTypesAndTimelines,
  getChallengeFromES,
  getChallengesFromES,
  getChallengeIDsFromV4,
  getChallengeIDsFromV5,
  getChallengeListingFromV4ES,
  getChallengeDetailFromV4ES,
  // getChallengeTypes,
  // saveChallengeTypes,
  deleteChallenge,
  createChallengeTimelineMapping,
  getChallengeFromV5API,
  getChallengeTypesFromDynamo,
  getChallengeSubmissionsFromV5API
}
