// ── Setup.gs ──────────────────────────────────────────────────────────────────
// Bootstrap functions. Run manually from the Apps Script IDE.
//
// For a brand-new sheet:  bootstrap()  — does everything in one shot.
// Individual steps kept below for surgical reruns.

// ── Full bootstrap ─────────────────────────────────────────────────────────────
function bootstrap() {
  const ss = _getTarget();

  _setupSheet(ss, SHEET.CONFIG,    ['Key', 'Value']);
  _setupSheet(ss, SHEET.IDENTITY,  ['Key', 'Value']);
  _setupSheet(ss, SHEET.CONTACTS,  ['Timestamp','SessionID','Name','Phone','Email','Interest','BookingType','Notes','Source','Ref']);
  _setupSheet(ss, SHEET.EVENTS,    ['Timestamp','SessionID','Event','Value']);
  _setupSheet(ss, SHEET.SESSIONS,  ['Timestamp','SessionID','IP','City','Region','Country','Device','OS','Browser','PageViews','Source','Ref']);
  _setupSheet(ss, SHEET.SEQUENCES, ['ID','Enrolled','Name','Phone','Email','Interest','Source','Ref','Phase','Step','Status','NextDate','ConsultDate','BookDate','SessionDate']);
  _setupSheet(ss, SHEET.FLOW,      ['Interest','Phase','Step','Delay (days)','Message']);

  _fillConfig(ss);
  _fillIdentity(ss);
  _fillSequenceFlow(ss);
  _setupTrigger();

  Logger.log('✓ Bootstrap complete. Update Config sheet with your real URLs, then run testSetup().');
}

// ── Individual reruns ─────────────────────────────────────────────────────────
function setupConfig()        { _setupSheet(_getTarget(), SHEET.CONFIG,    ['Key', 'Value']); }
function setupSequenceFlow()  { _setupSheet(_getTarget(), SHEET.FLOW,      ['Interest','Phase','Step','Delay (days)','Message']); }
function fillConfig()         { _fillConfig(_getTarget()); }
function setupTrigger()       { _setupTrigger(); }

function testSetup() {
  Logger.log('Sheets:    ' + db().getSheets().map(s => s.getName()).join(', '));
  Logger.log('Config:    ' + JSON.stringify(config()));
  Logger.log('Identity:  ' + JSON.stringify(identity()));
  Logger.log('Flow rows: ' + getFlow().length);
}

// ── Internals ─────────────────────────────────────────────────────────────────

// Returns the target spreadsheet — honours an optional bootstrapSheetId param
// so you can call bootstrap() after temporarily setting it, or just use the
// constant. Pass a sheet ID string to _getTarget() from the IDE console if needed.
function _getTarget(id) {
  return SpreadsheetApp.openById(id || SPREADSHEET_ID);
}

// Create sheet with header row if it doesn't already exist
function _setupSheet(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (sh) { Logger.log('  skip ' + name + ' (exists)'); return sh; }
  sh = ss.insertSheet(name);
  sh.appendRow(headers);
  sh.setFrozenRows(1);
  Logger.log('  created ' + name);
  return sh;
}

function _fillConfig(ss) {
  const sh = ss.getSheetByName(SHEET.CONFIG);
  if (!sh) { Logger.log('Config sheet missing — run bootstrap() first'); return; }

  const existing = {};
  sh.getDataRange().getValues().forEach(([k, v]) => { if (k) existing[String(k).trim()] = v; });

  const defaults = [
    ['notifyEmail',    'sir.black.leo@gmail.com'],
    ['scriptUrl',      'https://script.google.com/macros/s/AKfycbwgB8aP8zvl9eGPraRloNisHhqKPag_eHlYKtbhMHMjn4TgdRzJEPJN-eWqQSb_n1OSIg/exec'],
    ['seqEnabled',     'true'],
    ['confirmSubject', 'Sir Leo — Submission Received'],
    ['confirmMessage', '{{name}},\n\nYour submission was received. Sir Leo reviews each inquiry personally and will be in touch soon.\n\n— Sir Leo'],
    ['calendlyUrl',    ''],
    ['intakeFormUrl',  ''],
    ['testimonialUrl', '']
  ];

  let added = 0;
  defaults.forEach(([key, value]) => {
    if (existing[key] !== undefined) return;
    sh.appendRow([key, value]);
    added++;
  });
  Logger.log('  config: ' + added + ' keys added');
}

function _fillIdentity(ss) {
  const sh = ss.getSheetByName(SHEET.IDENTITY);
  if (!sh) return;

  const existing = {};
  sh.getDataRange().getValues().forEach(([k, v]) => { if (k) existing[String(k).trim()] = v; });

  const defaults = [
    ['name',     'Sir Leo'],
    ['tagline',  'Luxury Experiences. Discretion Guaranteed.'],
    ['email',    'sir.black.leo@gmail.com'],
    ['phone',    ''],
    ['ig',       ''],
    ['city',     '']
  ];

  let added = 0;
  defaults.forEach(([key, value]) => {
    if (existing[key] !== undefined) return;
    sh.appendRow([key, value]);
    added++;
  });
  Logger.log('  identity: ' + added + ' keys added');
}

function _fillSequenceFlow(ss) {
  const sh = ss.getSheetByName(SHEET.FLOW);
  if (!sh) return;

  // Only seed if empty (header row only)
  if (sh.getLastRow() > 1) { Logger.log('  skip SequenceFlow (has data)'); return; }

  // [Interest, Phase, Step, Delay (days), Message]
  const rows = [
    // ── Phase 1: Get to the call ──────────────────────────────────────────────
    [FLOW_WILDCARD, 1, 0, 0,  '{{name}}, thanks for reaching out. I review every inquiry personally — let\'s connect on a quick call. Grab a time here: {{calendly}}'],
    [FLOW_WILDCARD, 1, 1, 2,  '{{name}}, just following up. Slots fill fast — lock yours in: {{calendly}}'],
    [FLOW_WILDCARD, 1, 2, 5,  '{{name}}, last nudge from me. If timing isn\'t right, no pressure — I\'m here when you\'re ready.'],

    // ── Phase 2: Get the booking ──────────────────────────────────────────────
    [FLOW_WILDCARD, 2, 0, 0,  '{{name}}, great talking with you. Ready to make it official? Book your session here: {{calendly}}'],
    [FLOW_WILDCARD, 2, 1, 3,  '{{name}}, following up on your booking. I want to make sure you get a spot — {{calendly}}'],
    [FLOW_WILDCARD, 2, 2, 6,  '{{name}}, still thinking it over? Happy to answer any questions before you commit.'],

    // ── Phase 3: Pre-session admin ────────────────────────────────────────────
    [FLOW_WILDCARD, 3, 0, 0,  '{{name}}, you\'re confirmed! To get the most out of your session, please complete your intake form: {{intake}}'],
    [FLOW_WILDCARD, 3, 1, 3,  '{{name}}, reminder: intake form due before we meet — {{intake}}'],
    [FLOW_WILDCARD, 3, 2, 6,  '{{name}}, we\'re almost there. Any questions before your session? Reply anytime.'],

    // ── Phase 4: Post-session ─────────────────────────────────────────────────
    [FLOW_WILDCARD, 4, 0, 1,  '{{name}}, hope the session exceeded expectations. How are you feeling?'],
    [FLOW_WILDCARD, 4, 1, 4,  '{{name}}, if you\'d like to share your experience, a short testimonial means a lot: {{testimonial}}'],
    [FLOW_WILDCARD, 4, 2, 7,  '{{name}}, know someone who\'d benefit from this? Referrals always get priority booking.']
  ];

  rows.forEach(row => sh.appendRow(row));
  Logger.log('  SequenceFlow: ' + rows.length + ' steps seeded');
}

function _setupTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'runSequences')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('runSequences').timeBased().everyHours(SEQ_INTERVAL_HOURS).create();
  Logger.log('  trigger: runSequences every ' + SEQ_INTERVAL_HOURS + 'h');
}
