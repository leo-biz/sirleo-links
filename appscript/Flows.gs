// ── Flows.gs ───────────────────────────────────────────────────────────────────
// Flow template management + enrollment management + drip runner.
//
// Flows sheet: one row per step
//   FlowID | FlowName | Step | DelayDays | Channel | Subject | Message
//
// Enrollments sheet: one row per contact+flow enrollment
//   EnrollmentID | Phone | Name | FlowID | FlowName | Step | Status | NextDate | EnrolledAt | CompletedAt

// ── Flow definitions ───────────────────────────────────────────────────────────

function getFlows() {
  const rows    = getRows(SHEET.FLOWS);
  const flowMap = {};
  rows.forEach(r => {
    const id = String(r[FLOW_COL.ID]).trim();
    if (!id) return;
    if (!flowMap[id]) flowMap[id] = { id, name: r[FLOW_COL.NAME], steps: [] };
    flowMap[id].steps.push({
      step:    parseInt(r[FLOW_COL.STEP])  || 0,
      delay:   parseInt(r[FLOW_COL.DELAY]) || 0,
      channel: r[FLOW_COL.CHANNEL] || 'sms',
      subject: r[FLOW_COL.SUBJECT] || '',
      message: r[FLOW_COL.MESSAGE] || ''
    });
  });
  Object.values(flowMap).forEach(f => f.steps.sort((a, b) => a.step - b.step));
  return Object.values(flowMap);
}

function getFlowById(flowId) {
  return getFlows().find(f => f.id === flowId) || null;
}

// ── Enrollment management ──────────────────────────────────────────────────────

function enrollContact(phone, name, flowId) {
  const flow = getFlowById(flowId);
  if (!flow)              throw new Error('Flow not found: ' + flowId);
  if (!flow.steps.length) throw new Error('Flow has no steps: ' + flowId);

  const id  = 'enr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  const now = new Date();

  appendRow(SHEET.ENROLLMENTS, [
    id, phone, name, flowId, flow.name,
    0, ENR_STATUS.ACTIVE, now, now, ''
  ]);

  // Deliver step 0 immediately
  _deliverFlowStep({ phone, name }, flow.steps[0]);

  // Schedule step 1
  if (flow.steps.length > 1) {
    _updateEnrNextDate(id, flow.steps[1].delay);
  } else {
    _updateEnrField(id, ENR.STATUS, ENR_STATUS.COMPLETE);
    _updateEnrField(id, ENR.COMPLETED_AT, now);
  }

  Logger.log('[Flows] enrolled ' + name + ' (' + phone + ') in ' + flow.name);
  return { ok: true, id };
}

function setEnrollmentStatus(enrollmentId, status) {
  const result = _updateEnrField(enrollmentId, ENR.STATUS, status);
  if (status === ENR_STATUS.COMPLETE) {
    _updateEnrField(enrollmentId, ENR.COMPLETED_AT, new Date());
  }
  return result;
}

// ── Runner — fires every 6h via trigger ────────────────────────────────────────

function setupEnrollmentTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'runEnrollments')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('runEnrollments').timeBased().everyHours(SEQ_INTERVAL_HOURS).create();
  Logger.log('✓ runEnrollments trigger set every ' + SEQ_INTERVAL_HOURS + 'h');
}

function runEnrollments() {
  const sh = db().getSheetByName(SHEET.ENROLLMENTS);
  if (!sh) return;

  const rows = sh.getDataRange().getValues();
  const now  = new Date();

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r[ENR.STATUS] !== ENR_STATUS.ACTIVE)            continue;
    if (!r[ENR.NEXT_DATE])                              continue;
    if (new Date(r[ENR.NEXT_DATE]) > now)               continue;

    const flow = getFlowById(r[ENR.FLOW_ID]);
    if (!flow) continue;

    const curStep  = parseInt(r[ENR.STEP]);
    const nextStep = curStep + 1;

    if (nextStep >= flow.steps.length) {
      sh.getRange(i+1, ENR.STATUS+1).setValue(ENR_STATUS.COMPLETE);
      sh.getRange(i+1, ENR.COMPLETED_AT+1).setValue(now);
      continue;
    }

    _deliverFlowStep({ phone: r[ENR.PHONE], name: r[ENR.NAME] }, flow.steps[nextStep]);
    sh.getRange(i+1, ENR.STEP+1).setValue(nextStep);

    if (nextStep + 1 < flow.steps.length) {
      const next = new Date();
      next.setDate(next.getDate() + (flow.steps[nextStep + 1].delay || 0));
      sh.getRange(i+1, ENR.NEXT_DATE+1).setValue(next);
    } else {
      sh.getRange(i+1, ENR.STATUS+1).setValue(ENR_STATUS.COMPLETE);
      sh.getRange(i+1, ENR.COMPLETED_AT+1).setValue(now);
    }
  }
}

// ── Delivery ───────────────────────────────────────────────────────────────────

function _deliverFlowStep(contact, stepData) {
  if (!stepData || !stepData.message) return;

  const cfg   = config();
  const first = String(contact.name || '').split(' ')[0] || 'there';
  const body  = stepData.message
    .replace(/\{\{name\}\}/gi,        first)
    .replace(/\{\{calendly\}\}/gi,    cfg.calendlyUrl    || '')
    .replace(/\{\{intake\}\}/gi,      cfg.intakeFormUrl  || '')
    .replace(/\{\{testimonial\}\}/gi, cfg.testimonialUrl || '');

  const ch = (stepData.channel || 'sms').toLowerCase();

  if ((ch === 'sms' || ch === 'both') && contact.phone) {
    try { sendText(String(contact.phone), body); }
    catch(e) { Logger.log('[Flows] SMS error: ' + e.message); }
  }
  if ((ch === 'email' || ch === 'both') && contact.email) {
    try { MailApp.sendEmail({ to: contact.email, subject: stepData.subject || 'Sir Leo', body }); }
    catch(e) { Logger.log('[Flows] email error: ' + e.message); }
  }
}

// ── API helpers ────────────────────────────────────────────────────────────────

function getEnrollments() {
  const flows = {};
  getFlows().forEach(f => { flows[f.id] = f; });

  return getRows(SHEET.ENROLLMENTS).map(r => {
    const flow    = flows[r[ENR.FLOW_ID]];
    const step    = parseInt(r[ENR.STEP]);
    const nextMsg = flow && flow.steps[step + 1] ? flow.steps[step + 1].message : '';
    return {
      id:          r[ENR.ID],
      phone:       r[ENR.PHONE],
      name:        r[ENR.NAME],
      flowId:      r[ENR.FLOW_ID],
      flowName:    r[ENR.FLOW_NAME],
      step,
      totalSteps:  flow ? flow.steps.length : 0,
      status:      r[ENR.STATUS],
      nextDate:    r[ENR.NEXT_DATE],
      enrolledAt:  r[ENR.ENROLLED_AT],
      completedAt: r[ENR.COMPLETED_AT],
      nextMessage: nextMsg
    };
  });
}

// ── Internal sheet helpers ─────────────────────────────────────────────────────

function _updateEnrField(enrollmentId, colIdx, value) {
  const sh = db().getSheetByName(SHEET.ENROLLMENTS);
  if (!sh) return { ok: false, error: 'Enrollments sheet missing' };
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][ENR.ID]) !== String(enrollmentId)) continue;
    sh.getRange(i+1, colIdx+1).setValue(value);
    return { ok: true };
  }
  return { ok: false, error: 'enrollment not found: ' + enrollmentId };
}

function _updateEnrNextDate(enrollmentId, delayDays) {
  const next = new Date();
  next.setDate(next.getDate() + (delayDays || 0));
  return _updateEnrField(enrollmentId, ENR.NEXT_DATE, next);
}
