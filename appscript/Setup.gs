// ── Setup.gs ──────────────────────────────────────────────────────────────────
// One-time setup functions. Run each manually from the Apps Script IDE.
// Order: setupConfig → setupSequenceFlow → setupTrigger → testSetup
//
// Data lives in appscript/data/ in the repo — not here.
// Import each CSV into the corresponding sheet via Sheets → File → Import.

// ── 1. Config sheet — creates structure only ──────────────────────────────────
function setupConfig() {
  const ss = db();
  let sh = ss.getSheetByName(SHEET.CONFIG);
  if (!sh) {
    sh = ss.insertSheet(SHEET.CONFIG);
    sh.appendRow(['Key', 'Value']);
    sh.setFrozenRows(1);
    Logger.log('Config sheet created — import appscript/data/Config.csv');
  } else {
    Logger.log('Config already exists');
  }
}

// ── 2. SequenceFlow sheet — creates structure only ────────────────────────────
function setupSequenceFlow() {
  const ss = db();
  if (ss.getSheetByName(SHEET.FLOW)) {
    Logger.log('SequenceFlow already exists');
    return;
  }
  const sh = ss.insertSheet(SHEET.FLOW);
  sh.appendRow(['Interest', 'Phase', 'Step', 'Delay (days)', 'Message']);
  sh.setFrozenRows(1);
  Logger.log('SequenceFlow created — import appscript/data/SequenceFlow.csv');
}

// ── 3. Trigger — runs runSequences() every 6 hours ────────────────────────────
function setupTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'runSequences')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('runSequences').timeBased().everyHours(SEQ_INTERVAL_HOURS).create();
  Logger.log('Trigger set: runSequences every 6 hours');
}

// ── 1b. Fill Config with known values — skips keys that already exist ─────────
function fillConfig() {
  const ss = db();
  let sh = ss.getSheetByName(SHEET.CONFIG);
  if (!sh) { Logger.log('Run setupConfig() first'); return; }

  const existing = getKV(SHEET.CONFIG);

  const values = {
    notifyEmail:    'sir.black.leo@gmail.com',
    scriptUrl:      'https://script.google.com/macros/s/AKfycbwgB8aP8zvl9eGPraRloNisHhqKPag_eHlYKtbhMHMjn4TgdRzJEPJN-eWqQSb_n1OSIg/exec',
    seqEnabled:     'true',
    confirmSubject: 'Sir Leo — Submission Received',
    confirmMessage: '{{name}},\n\nYour submission was received. Sir Leo reviews each inquiry personally and will be in touch soon.\n\n— Sir Leo',
    calendlyUrl:    '',
    intakeFormUrl:  '',
    testimonialUrl: ''
  };

  let added = 0;
  Object.entries(values).forEach(([key, value]) => {
    if (existing[key] !== undefined) return;
    sh.appendRow([key, value]);
    added++;
  });

  Logger.log('fillConfig done — ' + added + ' keys added');
}

// ── Verify ────────────────────────────────────────────────────────────────────
function testSetup() {
  Logger.log('Sheets:    ' + db().getSheets().map(s => s.getName()).join(', '));
  Logger.log('Config:    ' + JSON.stringify(config()));
  Logger.log('Identity:  ' + JSON.stringify(identity()));
  Logger.log('Flow rows: ' + getFlow().length);
}
