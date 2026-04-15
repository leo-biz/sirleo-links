// ── Constants.gs ──────────────────────────────────────────────────────────────
// Structural IDs and names only. No logic, no URLs, no content.
//
// When deploying: Deploy → Manage deployments → pencil icon → New version
// Paste DEPLOY_DESC as the version description, then bump SCRIPT_VERSION.

const SCRIPT_VERSION = '2.0.9';
const DEPLOY_DESC    = `v${SCRIPT_VERSION} — 11-column session schema (region removed), SESS constants, SWR cache, sidebar admin`;

const SPREADSHEET_ID = '1HKQHgBvjA6kM7XfEODkdFUj-pJ2Moa3GF6ygVgR3qok';

const SHEET = {
  CONTACTS:  'Contacts',
  EVENTS:    'Events',
  SESSIONS:  'Sessions',
  IDENTITY:  'Identity',
  CONFIG:    'Config',
  SEQUENCES: 'Sequences',
  FLOW:      'SequenceFlow'
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
