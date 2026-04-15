// ── Pipeline.gs ────────────────────────────────────────────────────────────────
// CRM pipeline — tracks contact stages independently from drip sequences.
//
// Pipeline sheet: Phone | Name | Stage | Interest | Source | UpdatedAt | Notes
// Stages: New Lead → Reached Out → Responded → Consulted → Booked → Session Done

function getPipeline() {
  const pRows  = getRows(SHEET.PIPELINE);
  const enrRows = getRows(SHEET.ENROLLMENTS);

  // Build active enrollment summary keyed by last-10 phone digits
  const enrByPhone = {};
  enrRows.forEach(r => {
    const key = String(r[ENR.PHONE]).replace(/\D/g, '').slice(-10);
    if (!enrByPhone[key]) enrByPhone[key] = [];
    enrByPhone[key].push({
      id:       r[ENR.ID],
      flowName: r[ENR.FLOW_NAME],
      status:   r[ENR.STATUS],
      step:     r[ENR.STEP]
    });
  });

  return pRows.map(r => {
    const key = String(r[PIPE.PHONE]).replace(/\D/g, '').slice(-10);
    return {
      phone:       r[PIPE.PHONE],
      name:        r[PIPE.NAME],
      stage:       r[PIPE.STAGE],
      interest:    r[PIPE.INTEREST],
      source:      r[PIPE.SOURCE],
      updatedAt:   r[PIPE.UPDATED_AT],
      notes:       r[PIPE.NOTES],
      enrollments: (enrByPhone[key] || []).filter(e => e.status !== ENR_STATUS.COMPLETE)
    };
  });
}

function setStage(phone, stage) {
  if (!PIPE_STAGES.includes(stage)) return { ok: false, error: 'invalid stage: ' + stage };

  const sh     = db().getSheetByName(SHEET.PIPELINE);
  if (!sh) return { ok: false, error: 'Pipeline sheet missing' };

  const digits = String(phone).replace(/\D/g, '').slice(-10);
  const rows   = sh.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    const p = String(rows[i][PIPE.PHONE]).replace(/\D/g, '').slice(-10);
    if (p !== digits) continue;
    sh.getRange(i+1, PIPE.STAGE+1).setValue(stage);
    sh.getRange(i+1, PIPE.UPDATED_AT+1).setValue(new Date());
    return { ok: true, phone, stage };
  }
  return { ok: false, error: 'contact not found in pipeline' };
}

function addToPipeline(phone, name, interest, source) {
  const digits   = String(phone).replace(/\D/g, '').slice(-10);
  const existing = getRows(SHEET.PIPELINE)
    .find(r => String(r[PIPE.PHONE]).replace(/\D/g, '').slice(-10) === digits);
  if (existing) return { ok: true, existing: true };

  appendRow(SHEET.PIPELINE, [
    phone, name, PIPE_STAGES[0], interest||'', source||'', new Date(), ''
  ]);
  return { ok: true, existing: false };
}

function updatePipelineNotes(phone, notes) {
  const sh     = db().getSheetByName(SHEET.PIPELINE);
  if (!sh) return { ok: false };
  const digits = String(phone).replace(/\D/g, '').slice(-10);
  const rows   = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const p = String(rows[i][PIPE.PHONE]).replace(/\D/g, '').slice(-10);
    if (p !== digits) continue;
    sh.getRange(i+1, PIPE.NOTES+1).setValue(notes);
    return { ok: true };
  }
  return { ok: false, error: 'not found' };
}
