// ── Constants.gs ──────────────────────────────────────────────────────────────
// Structural IDs and names only. No logic, no URLs, no content.
//
// When deploying: Deploy → Manage deployments → pencil icon → New version
// Paste DEPLOY_DESC as the version description, then bump SCRIPT_VERSION.

const SCRIPT_VERSION = '3.1.0';
const DEPLOY_DESC    = `v${SCRIPT_VERSION} — Pipeline/Flows/Enrollments rearchitecture; new CRM stages, multi-flow drip, GVoice messaging`;

const SPREADSHEET_ID = '1HKQHgBvjA6kM7XfEODkdFUj-pJ2Moa3GF6ygVgR3qok';

const SHEET = {
  CONTACTS:    'Contacts',
  EVENTS:      'Events',
  SESSIONS:    'Sessions',
  IDENTITY:    'Identity',
  CONFIG:      'Config',
  MESSAGES:    'Messages',
  // CRM
  PIPELINE:    'Pipeline',
  // Drip flows
  FLOWS:       'Flows',
  ENROLLMENTS: 'Enrollments',
  // Legacy (kept for backward compat)
  SEQUENCES:   'Sequences',
  FLOW:        'SequenceFlow'
};

// Pipeline sheet column indices
const PIPE = {
  PHONE:      0,
  NAME:       1,
  STAGE:      2,
  INTEREST:   3,
  SOURCE:     4,
  UPDATED_AT: 5,
  NOTES:      6
};

const PIPE_STAGES = [
  'New Lead', 'Reached Out', 'Responded',
  'Consulted', 'Booked', 'Session Done'
];

// Flows sheet column indices
const FLOW_COL = {
  ID:      0,
  NAME:    1,
  STEP:    2,
  DELAY:   3,
  CHANNEL: 4,
  SUBJECT: 5,
  MESSAGE: 6
};

// Enrollments sheet column indices
const ENR = {
  ID:           0,
  PHONE:        1,
  NAME:         2,
  FLOW_ID:      3,
  FLOW_NAME:    4,
  STEP:         5,
  STATUS:       6,
  NEXT_DATE:    7,
  ENROLLED_AT:  8,
  COMPLETED_AT: 9
};

const ENR_STATUS = {
  ACTIVE:   'active',
  PAUSED:   'paused',
  COMPLETE: 'complete'
};

// Messages sheet column indices
const MSG = {
  TIMESTAMP:   0,
  PHONE:       1,
  NAME:        2,
  DIRECTION:   3,  // 'in' | 'out'
  BODY:        4,
  REPLY_EMAIL: 5,
  MESSAGE_ID:  6
};

const SEQ_INTERVAL_HOURS  = 6;       // how often runSequences() fires
const SEQ_EMAIL_SUBJECT   = 'Sir Leo';
const DEFAULT_SESSION_LIMIT = 40;
const FLOW_WILDCARD       = '*';

const SEQ_STATUS = {
  ACTIVE:   'active',
  PAUSED:   'paused',
  WAITING:  'waiting',
  COMPLETE: 'complete'
};

// Sessions sheet column indices
const SESS = {
  TIMESTAMP:  0,
  SID:        1,
  IP:         2,
  CITY:       3,
  COUNTRY:    4,
  DEVICE:     5,
  OS:         6,
  BROWSER:    7,
  PAGE_VIEWS: 8,
  SOURCE:     9,
  REF:        10
};

// Sequences sheet column indices — single source of truth
const SEQ = {
  ID:       0,
  ENROLLED: 1,
  NAME:     2,
  PHONE:    3,
  EMAIL:    4,
  INTEREST: 5,
  SOURCE:   6,
  REF:      7,
  PHASE:    8,
  STEP:     9,
  STATUS:   10,
  NEXT:     11,
  CONSULT:  12,
  BOOK:     13,
  SESSION:  14
};
