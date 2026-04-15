// ── Setup.gs ──────────────────────────────────────────────────────────────────
// One-time setup functions. Run each manually from the Apps Script IDE.

// Creates the 6-hour trigger for runSequences()
function setupTrigger() {
  ScriptApp.newTrigger('runSequences').timeBased().everyHours(6).create();
  Logger.log('Trigger created: runSequences every 6 hours');
}

// Creates the SequenceFlow sheet with headers only — fill content directly in the sheet
function setupSequenceFlow() {
  const ss = db();
  if (ss.getSheetByName(SHEET.FLOW)) {
    Logger.log('SequenceFlow already exists — skipping');
    return;
  }
  const sh = ss.insertSheet(SHEET.FLOW);
  sh.appendRow(['Interest', 'Phase', 'Step', 'Delay (days)', 'Message']);
  sh.setFrozenRows(1);
  Logger.log('SequenceFlow created — add your message rows directly in the sheet');
}

// Verifies everything is wired up correctly
function testSetup() {
  Logger.log('Sheets:    ' + db().getSheets().map(s => s.getName()).join(', '));
  Logger.log('Config:    ' + JSON.stringify(config()));
  Logger.log('Identity:  ' + JSON.stringify(identity()));
  Logger.log('Flow rows: ' + getFlow().length);
}
