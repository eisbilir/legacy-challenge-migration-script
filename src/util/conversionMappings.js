const _ = require('lodash')

const V5_TRACK_IDS = {
  DATA_SCIENCE: 'c0f5d461-8219-4c14-878a-c3a3f356466d',
  DESIGN: '5fa04185-041f-49a6-bfd1-fe82533cd6c8',
  DEVELOPMENT: '9b6fc876-f4d9-4ccb-9dfd-419247628825',
  QA: '36e6a8d0-7e1e-4608-a673-64279d99c115',
  CMP: '9d6e0de8-df14-4c76-ba0a-a9a8cb03a4ea'
}

const V5_TRACK_NAMES_TO_IDS = {
  DESIGN: V5_TRACK_IDS.DESIGN,
  DEVELOPMENT: V5_TRACK_IDS.DEVELOPMENT,
  'DATA SCIENCE': V5_TRACK_IDS.DATA_SCIENCE,
  'QUALITY ASSURANCE': V5_TRACK_IDS.QA,
  'COMPETITIVE PROGRAMMING': V5_TRACK_IDS.CMP
}

const V5_TRACK_IDS_TO_NAMES = {
  [V5_TRACK_IDS.DATA_SCIENCE]: 'Data Science',
  [V5_TRACK_IDS.DESIGN]: 'Design',
  [V5_TRACK_IDS.DEVELOPMENT]: 'Development',
  [V5_TRACK_IDS.QA]: 'Quality Assurance'
  [V5_TRACK_IDS.CMP]: 'Competitive Programming'
}

const V5_TYPE_IDS = {
  CHALLENGE: '927abff4-7af9-4145-8ba1-577c16e64e2e',
  TASK: 'ecd58c69-238f-43a4-a4bb-d172719b9f31',
  FIRST_2_FINISH: 'dc876fa4-ef2d-4eee-b701-b555fcc6544c'
  PC: '34602883-a58d-45a9-b370-749574b6890d',
  MM: '929bc408-9cf2-4b3e-ba71-adfbf693046c',
  RDM: '78b37a69-92d5-4ad7-bf85-c79b65420c79',
  SKL: 'ddc4252a-270c-408f-a15d-2f31c2141cd3'
}

const V5_TYPE_NAMES_TO_IDS = {
  CHALLENGE: V5_TYPE_IDS.CHALLENGE,
  FIRST2FINISH: V5_TYPE_IDS.FIRST_2_FINISH,
  TASK: V5_TYPE_IDS.TASK
}

const V5_TYPE_IDS_TO_NAMES = {
  [V5_TYPE_IDS.CHALLENGE]: 'Challenge',
  [V5_TYPE_IDS.TASK]: 'Task',
  [V5_TYPE_IDS.FIRST_2_FINISH]: 'First2Finish'
  [V5_TYPE_IDS.PC]: 'Practice Challenge'
  [V5_TYPE_IDS.MM]: 'Marathon Match'
  [V5_TYPE_IDS.RDM]: 'Rapid Development Match'
  [V5_TYPE_IDS.SKL]: 'Skill Builder'
}

const V4_TRACKS = {
  DEVELOP: 'DEVELOP',
  DATA_SCIENCE: 'DATA_SCIENCE',
  DESIGN: 'DESIGN'
}

const V4_SUBTRACKS = {
  MARATHON_MATCH: 'MARATHON_MATCH',
  DESIGN_FIRST_2_FINISH: 'DESIGN_FIRST_2_FINISH',
  APPLICATION_FRONT_END_DESIGN: 'APPLICATION_FRONT_END_DESIGN',
  WEB_DESIGNS: 'WEB_DESIGNS',
  IDEA_GENERATION: 'IDEA_GENERATION',
  WIDGET_OR_MOBILE_SCREEN_DESIGN: 'WIDGET_OR_MOBILE_SCREEN_DESIGN',
  WIREFRAMES: 'WIREFRAMES',
  PRINT_OR_PRESENTATION: 'PRINT_OR_PRESENTATION',
  STUDIO_OTHER: 'STUDIO_OTHER',
  BANNERS_OR_ICONS: 'BANNERS_OR_ICONS',
  LOGO_DESIGN: 'LOGO_DESIGN',
  FRONT_END_FLASH: 'FRONT_END_FLASH',
  DEVELOPMENT: 'DEVELOPMENT',
  FIRST_2_FINISH: 'FIRST_2_FINISH',
  CODE: 'CODE',
  COPILOT_POSTING: 'COPILOT_POSTING',
  BUG_HUNT: 'BUG_HUNT',
  DEVELOP_MARATHON_MATCH: 'DEVELOP_MARATHON_MATCH',
  TEST_SUITES: 'TEST_SUITES',
  UI_PROTOTYPE_COMPETITION: 'UI_PROTOTYPE_COMPETITION',
  ARCHITECTURE: 'ARCHITECTURE',
  ASSEMBLY_COMPETITION: 'ASSEMBLY_COMPETITION',
  SPECIFICATION: 'SPECIFICATION',
  TEST_SCENARIOS: 'TEST_SCENARIOS',
  CONCEPTUALIZATION: 'CONCEPTUALIZATION',
  CONTENT_CREATION: 'CONTENT_CREATION',
  DESIGN: 'DESIGN',
  RIA_BUILD_COMPETITION: 'RIA_BUILD_COMPETITION',
  RIA_COMPONENT_COMPETITION: 'RIA_COMPONENT_COMPETITION',
  REPORTING: 'REPORTING',
  PROCESS: 'PROCESS',
  LEGACY: 'Legacy',
  TESTING_COMPETITION: 'TESTING_COMPETITION',
  DEPLOYMENT: 'DEPLOYMENT',
  COMPONENT_PRODUCTION: 'COMPONENT_PRODUCTION',
  AUTOMATED_TESTING: 'AUTOMATED TESTING',
  SECURITY: 'SECURITY'
}

const MARATHON_MATCH_TAG = 'Marathon Match'
const DATA_SCIENCE_TAG = 'Data Science'

const FE_DESIGN_TAG = 'Front-End Design'
const IDEATION_TAG = 'Ideation'
const WIREFRAME_TAG = 'Wireframe'
const BUG_HUNT_TAG = 'Bug Hunt'
const TEST_SUITES_TAG = 'Test Suites'
const TEST_SCENARIOS_TAG = 'Test Scenarios'
const TESTING_COMPETITION_TAG = 'Testing Competition'

// Helper methodS to simply avoid writing too much
const buildV4Data = (track, subTrack, isTask, technologies) => ({
  track,
  subTrack,
  isTask,
  ...(technologies ? { technologies } : {})
})
const buildV5Data = (trackId, typeId, tags = []) => ({
  trackId,
  typeId,
  track: V5_TRACK_IDS_TO_NAMES[trackId],
  type: V5_TYPE_IDS_TO_NAMES[typeId],
  tags
})

module.exports = {
  V5_TO_V4: {
    [V5_TRACK_IDS.DATA_SCIENCE]: {
      [V5_TYPE_IDS.CHALLENGE]: () => buildV4Data(V4_TRACKS.DATA_SCIENCE, V4_SUBTRACKS.MARATHON_MATCH, false),
      [V5_TYPE_IDS.FIRST_2_FINISH]: () => buildV4Data(V4_TRACKS.DEVELOP, V4_SUBTRACKS.FIRST_2_FINISH, false),
      [V5_TYPE_IDS.TASK]: () => buildV4Data(V4_TRACKS.DEVELOP, V4_SUBTRACKS.FIRST_2_FINISH, true)
      [V5_TYPE_IDS.PC]: () => buildV4Data(V4_TRACKS.DATA_SCIENCE, V4_SUBTRACKS.MARATHON_MATCH, false)
      [V5_TYPE_IDS.MM]:() => buildV4Data(V4_TRACKS.DATA_SCIENCE, V4_SUBTRACKS.MARATHON_MATCH, false)
      [V5_TYPE_IDS.RDM]: () => buildV4Data(V4_TRACKS.DEVELOP, V4_SUBTRACKS.CODE, false)
      [V5_TYPE_IDS.SKL]: () => buildV4Data(V4_TRACKS.DATA_SCIENCE, V4_SUBTRACKS.MARATHON_MATCH, false)
    },
    [V5_TRACK_IDS.DESIGN]: {
      [V5_TYPE_IDS.CHALLENGE]: () => buildV4Data(V4_TRACKS.DESIGN, V4_SUBTRACKS.WEB_DESIGNS, false),
      [V5_TYPE_IDS.FIRST_2_FINISH]: () => buildV4Data(V4_TRACKS.DESIGN, V4_SUBTRACKS.DESIGN_FIRST_2_FINISH, false),
      [V5_TYPE_IDS.TASK]: () => buildV4Data(V4_TRACKS.DESIGN, V4_SUBTRACKS.DESIGN_FIRST_2_FINISH, true)
      [V5_TYPE_IDS.PC]: () => buildV4Data(V4_TRACKS.DESIGN, V4_SUBTRACKS.WEB_DESIGNS, false)
      [V5_TYPE_IDS.MM]:() => buildV4Data(V4_TRACKS.DESIGN, V4_SUBTRACKS.MARATHON_MATCH, false)
      [V5_TYPE_IDS.RDM]: () => buildV4Data(V4_TRACKS.DESIGN, V4_SUBTRACKS.WEB_DESIGNS, false)
      [V5_TYPE_IDS.SKL]: () => buildV4Data(V4_TRACKS.DESIGN, V4_SUBTRACKS.WEB_DESIGNS, false)
    },
    [V5_TRACK_IDS.DEVELOPMENT]: {
      [V5_TYPE_IDS.CHALLENGE]: () => buildV4Data(V4_TRACKS.DEVELOP, V4_SUBTRACKS.CODE, false),
      [V5_TYPE_IDS.FIRST_2_FINISH]: () => buildV4Data(V4_TRACKS.DEVELOP, V4_SUBTRACKS.FIRST_2_FINISH, false),
      [V5_TYPE_IDS.TASK]: () => buildV4Data(V4_TRACKS.DEVELOP, V4_SUBTRACKS.FIRST_2_FINISH, true)
      [V5_TYPE_IDS.PC]: () => buildV4Data(V4_TRACKS.DEVELOP, V4_SUBTRACKS.CODE, false)
      [V5_TYPE_IDS.MM]:() => buildV4Data(V4_TRACKS.DEVELOP, V4_SUBTRACKS.MARATHON_MATCH, false)
      [V5_TYPE_IDS.RDM]: () => buildV4Data(V4_TRACKS.DEVELOP, V4_SUBTRACKS.CODE, false)
      [V5_TYPE_IDS.SKL]: () => buildV4Data(V4_TRACKS.DEVELOP, V4_SUBTRACKS.CODE, false)

    },
    [V5_TRACK_IDS.QA]: {
      [V5_TYPE_IDS.CHALLENGE]: () => buildV4Data(V4_TRACKS.DEVELOP, V4_SUBTRACKS.BUG_HUNT, false),
      [V5_TYPE_IDS.FIRST_2_FINISH]: () => buildV4Data(V4_TRACKS.DEVELOP, V4_SUBTRACKS.FIRST_2_FINISH, false),
      [V5_TYPE_IDS.TASK]: () => buildV4Data(V4_TRACKS.DEVELOP, V4_SUBTRACKS.FIRST_2_FINISH, true)
      [V5_TYPE_IDS.PC]: () => buildV4Data(V4_TRACKS.DEVELOP, V4_SUBTRACKS.CODE, false)
      [V5_TYPE_IDS.MM]:() => buildV4Data(V4_TRACKS.DEVELOP, V4_SUBTRACKS.MARATHON_MATCH, false)
      [V5_TYPE_IDS.RDM]: () => buildV4Data(V4_TRACKS.DEVELOP, V4_SUBTRACKS.CODE, false)
      [V5_TYPE_IDS.SKL]: () => buildV4Data(V4_TRACKS.DEVELOP, V4_SUBTRACKS.CODE, false)
    },
    [V5_TRACK_IDS.CMP]: {
      [V5_TYPE_IDS.CHALLENGE]: () => buildV4Data(V4_TRACKS.DEVELOP, V4_SUBTRACKS.BUG_HUNT, false),
      [V5_TYPE_IDS.FIRST_2_FINISH]: () => buildV4Data(V4_TRACKS.DEVELOP, V4_SUBTRACKS.FIRST_2_FINISH, false),
      [V5_TYPE_IDS.TASK]: () => buildV4Data(V4_TRACKS.DEVELOP, V4_SUBTRACKS.FIRST_2_FINISH, true)
      [V5_TYPE_IDS.PC]: () => buildV4Data(V4_TRACKS.DEVELOP, V4_SUBTRACKS.CODE, false)
      [V5_TYPE_IDS.MM]:() => buildV4Data(V4_TRACKS.DEVELOP, V4_SUBTRACKS.MARATHON_MATCH, false)
      [V5_TYPE_IDS.RDM]: () => buildV4Data(V4_TRACKS.DEVELOP, V4_SUBTRACKS.CODE, false)
      [V5_TYPE_IDS.SKL]: () => buildV4Data(V4_TRACKS.DEVELOP, V4_SUBTRACKS.CODE, false)
    }
  },
  V4_TO_V5: {
    [V4_TRACKS.DATA_SCIENCE]: {
      // categorizes non competitive programming marathon matches as Data Science Match
      [V4_SUBTRACKS.MARATHON_MATCH]: () => buildV5Data(V5_TRACK_IDS.DATA_SCIENCE, V5_TYPE_IDS.CHALLENGE, [DATA_SCIENCE_MATCH_TAG])
    },
    [V4_TRACKS.DESIGN]: {
      [V4_SUBTRACKS.DESIGN_FIRST_2_FINISH]: (isTask) => buildV5Data(V5_TRACK_IDS.DESIGN, isTask ? V5_TYPE_IDS.TASK : V5_TYPE_IDS.FIRST_2_FINISH),
      [V4_SUBTRACKS.APPLICATION_FRONT_END_DESIGN]: () => buildV5Data(V5_TRACK_IDS.DESIGN, V5_TYPE_IDS.CHALLENGE, [FE_DESIGN_TAG]),
      [V4_SUBTRACKS.WEB_DESIGNS]: () => buildV5Data(V5_TRACK_IDS.DESIGN, V5_TYPE_IDS.CHALLENGE),
      [V4_SUBTRACKS.IDEA_GENERATION]: () => buildV5Data(V5_TRACK_IDS.DESIGN, V5_TYPE_IDS.CHALLENGE, [IDEATION_TAG]),
      [V4_SUBTRACKS.WIDGET_OR_MOBILE_SCREEN_DESIGN]: () => buildV5Data(V5_TRACK_IDS.DESIGN, V5_TYPE_IDS.CHALLENGE),
      [V4_SUBTRACKS.WIREFRAMES]: () => buildV5Data(V5_TRACK_IDS.DESIGN, V5_TYPE_IDS.CHALLENGE, [WIREFRAME_TAG]),
      [V4_SUBTRACKS.PRINT_OR_PRESENTATION]: () => buildV5Data(V5_TRACK_IDS.DESIGN, V5_TYPE_IDS.CHALLENGE),
      [V4_SUBTRACKS.STUDIO_OTHER]: () => buildV5Data(V5_TRACK_IDS.DESIGN, V5_TYPE_IDS.CHALLENGE),
      [V4_SUBTRACKS.BANNERS_OR_ICONS]: () => buildV5Data(V5_TRACK_IDS.DESIGN, V5_TYPE_IDS.CHALLENGE),
      [V4_SUBTRACKS.LOGO_DESIGN]: () => buildV5Data(V5_TRACK_IDS.DESIGN, V5_TYPE_IDS.CHALLENGE),
      [V4_SUBTRACKS.FRONT_END_FLASH]: () => buildV5Data(V5_TRACK_IDS.DESIGN, V5_TYPE_IDS.CHALLENGE)
    },
    [V4_TRACKS.DEVELOP]: {
      [V4_SUBTRACKS.DEVELOPMENT]: () => buildV5Data(V5_TRACK_IDS.DEVELOPMENT, V5_TYPE_IDS.CHALLENGE),
      [V4_SUBTRACKS.FIRST_2_FINISH]: (isTask) => buildV5Data(V5_TRACK_IDS.DEVELOPMENT, isTask ? V5_TYPE_IDS.TASK : V5_TYPE_IDS.FIRST_2_FINISH),
      [V4_SUBTRACKS.CODE]: (isTask, tags) => {
        if (_.includes(tags, MARATHON_MATCH_TAG)) {
          return buildV5Data(V5_TRACK_IDS.DATA_SCIENCE, V5_TYPE_IDS.CHALLENGE)
        } else if (_.includes(tags, DATA_SCIENCE_TAG)) {
          return buildV5Data(V5_TRACK_IDS.DATA_SCIENCE, V5_TYPE_IDS.CHALLENGE)
        } else {
          return buildV5Data(V5_TRACK_IDS.DEVELOPMENT, V5_TYPE_IDS.CHALLENGE)
        }
      },
      [V4_SUBTRACKS.COPILOT_POSTING]: () => buildV5Data(V5_TRACK_IDS.DEVELOPMENT, V5_TYPE_IDS.CHALLENGE),
      [V4_SUBTRACKS.BUG_HUNT]: () => buildV5Data(V5_TRACK_IDS.QA, V5_TYPE_IDS.CHALLENGE, [BUG_HUNT_TAG]),
      [V4_SUBTRACKS.DEVELOP_MARATHON_MATCH]: () => buildV5Data(V5_TRACK_IDS.DATA_SCIENCE, V5_TYPE_IDS.CHALLENGE, [MARATHON_MATCH_TAG]),
      [V4_SUBTRACKS.TEST_SUITES]: () => buildV5Data(V5_TRACK_IDS.QA, V5_TYPE_IDS.CHALLENGE, [TEST_SUITES_TAG]),
      [V4_SUBTRACKS.UI_PROTOTYPE_COMPETITION]: () => buildV5Data(V5_TRACK_IDS.DEVELOPMENT, V5_TYPE_IDS.CHALLENGE),
      [V4_SUBTRACKS.ARCHITECTURE]: () => buildV5Data(V5_TRACK_IDS.DEVELOPMENT, V5_TYPE_IDS.CHALLENGE),
      [V4_SUBTRACKS.ASSEMBLY_COMPETITION]: () => buildV5Data(V5_TRACK_IDS.DEVELOPMENT, V5_TYPE_IDS.CHALLENGE),
      [V4_SUBTRACKS.SPECIFICATION]: () => buildV5Data(V5_TRACK_IDS.DEVELOPMENT, V5_TYPE_IDS.CHALLENGE),
      [V4_SUBTRACKS.TEST_SCENARIOS]: () => buildV5Data(V5_TRACK_IDS.QA, V5_TYPE_IDS.CHALLENGE, [TEST_SCENARIOS_TAG]),
      [V4_SUBTRACKS.CONCEPTUALIZATION]: () => buildV5Data(V5_TRACK_IDS.DEVELOPMENT, V5_TYPE_IDS.CHALLENGE),
      [V4_SUBTRACKS.CONTENT_CREATION]: () => buildV5Data(V5_TRACK_IDS.DEVELOPMENT, V5_TYPE_IDS.CHALLENGE),
      [V4_SUBTRACKS.DESIGN]: () => buildV5Data(V5_TRACK_IDS.DEVELOPMENT, V5_TYPE_IDS.CHALLENGE),
      [V4_SUBTRACKS.RIA_BUILD_COMPETITION]: () => buildV5Data(V5_TRACK_IDS.DEVELOPMENT, V5_TYPE_IDS.CHALLENGE),
      [V4_SUBTRACKS.RIA_COMPONENT_COMPETITION]: () => buildV5Data(V5_TRACK_IDS.DEVELOPMENT, V5_TYPE_IDS.CHALLENGE),
      [V4_SUBTRACKS.REPORTING]: () => buildV5Data(V5_TRACK_IDS.DEVELOPMENT, V5_TYPE_IDS.CHALLENGE),
      [V4_SUBTRACKS.PROCESS]: () => buildV5Data(V5_TRACK_IDS.DEVELOPMENT, V5_TYPE_IDS.CHALLENGE),
      [V4_SUBTRACKS.LEGACY]: () => buildV5Data(V5_TRACK_IDS.DEVELOPMENT, V5_TYPE_IDS.CHALLENGE),
      [V4_SUBTRACKS.TESTING_COMPETITION]: () => buildV5Data(V5_TRACK_IDS.QA, V5_TYPE_IDS.CHALLENGE, [TESTING_COMPETITION_TAG]),
      [V4_SUBTRACKS.DEPLOYMENT]: () => buildV5Data(V5_TRACK_IDS.DEVELOPMENT, V5_TYPE_IDS.CHALLENGE),
      [V4_SUBTRACKS.COMPONENT_PRODUCTION]: () => buildV5Data(V5_TRACK_IDS.DEVELOPMENT, V5_TYPE_IDS.CHALLENGE),
      [V4_SUBTRACKS.SECURITY]: () => buildV5Data(V5_TRACK_IDS.DEVELOPMENT, V5_TYPE_IDS.CHALLENGE),
      [V4_SUBTRACKS.AUTOMATED_TESTING]: () => buildV5Data(V5_TRACK_IDS.DEVELOPMENT, V5_TYPE_IDS.CHALLENGE)
    }
  },
  V5_TRACK_NAMES_TO_IDS,
  V5_TYPE_NAMES_TO_IDS,
  V4_TRACKS,
  V4_SUBTRACKS,
  MARATHON_MATCH_TAG,
  DATA_SCIENCE_TAG
}
