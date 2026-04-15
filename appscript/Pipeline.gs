// ── Pipeline.gs ───────────────────────────────────────────────────────────────
// Phase transitions and pipeline view. Owns the Sequences sheet structure.

function seqSheet() {
  const ss = db();
  let sh = ss.getSheetByName(SHEET.SEQUENCES);
  if (!sh) {
    sh = ss.insertSheet(SHEET.SEQUENCES);
    sh.appendRow([
      'ID', 'Enrolled', 'Name', 'Phone', 'Email', 'Interest', 'Source', 'Ref',
      'Phase', 'Step', 'Status', 'NextDate', 'ConsultDate', 'BookDate', 'SessionDate'
    ]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function advancePhase(id, newPhase, dateCol) {
  const sh   = seqSheet();
  const rows = sh.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][SEQ.ID]) !== String(id)) continue;
    const r   = rows[i];
    const now = new Date();

    sh.getRange(i+1, SEQ.PHASE+1).setValue(newPhase);
    sh.getRange(i+1, SEQ.STEP+1).setValue(0);
    sh.getRange(i+1, SEQ.STATUS+1).setValue('active');
    sh.getRange(i+1, SEQ.NEXT+1).setValue(now);
    sh.getRange(i+1, dateCol+1).setValue(now);

    deliverStep(newPhase, 0, r[SEQ.NAME], r[SEQ.EMAIL], r[SEQ.PHONE], r[SEQ.INTEREST]);
    writeNextDate(sh, null, newPhase, 1, r[SEQ.INTEREST], i+1);
    return { ok: true, id, phase: newPhase };
  }
  return { ok: false, error: 'id not found' };
}

function setStatus(id, status) {
  const sh   = seqSheet();
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][SEQ.ID]) !== String(id)) continue;
    sh.getRange(i+1, SEQ.STATUS+1).setValue(status);
    return { ok: true, id, status };
  }
  return { ok: false, error: 'id not found' };
}

function getPipeline() {
  return getRows(SHEET.SEQUENCES).map(r => ({
    id:          r[SEQ.ID],
    enrolled:    r[SEQ.ENROLLED],
    name:        r[SEQ.NAME],
    phone:       r[SEQ.PHONE],
    email:       r[SEQ.EMAIL],
    interest:    r[SEQ.INTEREST],
    source:      r[SEQ.SOURCE],
    ref:         r[SEQ.REF],
    phase:       r[SEQ.PHASE],
    step:        r[SEQ.STEP],
    status:      r[SEQ.STATUS],
    nextDate:    r[SEQ.NEXT],
    consultDate: r[SEQ.CONSULT],
    bookDate:    r[SEQ.BOOK],
    sessionDate: r[SEQ.SESSION]
  }));
}
