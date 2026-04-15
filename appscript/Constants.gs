// ── Constants.gs ──────────────────────────────────────────────────────────────
// Structural IDs and names only. No logic, no URLs, no content.

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
