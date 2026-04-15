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
  ScriptApp.newTrigger('runSequences').timeBased().everyHours(6).create();
  Logger.log('Trigger set: runSequences every 6 hours');
}

// ── Verify ────────────────────────────────────────────────────────────────────
function testSetup() {
  Logger.log('Sheets:    ' + db().getSheets().map(s => s.getName()).join(', '));
  Logger.log('Config:    ' + JSON.stringify(config()));
  Logger.log('Identity:  ' + JSON.stringify(identity()));
  Logger.log('Flow rows: ' + getFlow().length);
}
