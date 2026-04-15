// ── Sequences.gs ──────────────────────────────────────────────────────────────
// Enrollment, daily runner, step delivery, and flow resolution.
// Message content lives in the SequenceFlow sheet — not here.

function enrollSequence(d, sid) {
  const id  = sid || ('seq_' + Date.now());
  const now = new Date();
  const sh  = seqSheet();

  sh.appendRow([
    id, now, d.name||'', d.phone||'', d.email||'',
    d.interest||'', d.source||'', d.ref||'',
    1, 0, 'active', now, '', '', ''
  ]);

  deliverStep(1, 0, d.name||'', d.email||'', d.phone||'', d.interest||'');
  writeNextDate(sh, id, 1, 1, d.interest||'');
}

// Runs on a time-based trigger every 6 hours
function runSequences() {
  if (config().seqEnabled === 'false') return;

  const sh   = seqSheet();
  const rows = sh.getDataRange().getValues();
  const now  = new Date();

  for (let i = 1; i < rows.length; i++) {
    const r        = rows[i];
    const status   = r[SEQ.STATUS];
    const nextDate = r[SEQ.NEXT];

    if (status !== SEQ_STATUS.ACTIVE)           continue;
    if (!nextDate || new Date(nextDate) > now)  continue;

    const phase    = parseInt(r[SEQ.PHASE]);
    const nextStep = parseInt(r[SEQ.STEP]) + 1;
    const interest = r[SEQ.INTEREST];
    const msgs     = getMessages(phase, interest);

    if (nextStep >= msgs.length) {
      sh.getRange(i+1, SEQ.STATUS+1).setValue(SEQ_STATUS.WAITING);
      continue;
    }

    deliverStep(phase, nextStep, r[SEQ.NAME], r[SEQ.EMAIL], r[SEQ.PHONE], interest);
    sh.getRange(i+1, SEQ.STEP+1).setValue(nextStep);
    writeNextDate(sh, null, phase, nextStep + 1, interest, i + 1);
  }
}

function deliverStep(phase, step, name, email, phone, interest) {
  const msgs = getMessages(phase, interest);
  if (step >= msgs.length) return;

  const cfg   = config();
  const first = (name || '').split(' ')[0] || 'there';
  const body  = msgs[step].msg
    .replace(/\{\{name\}\}/g,        first)
    .replace(/\{\{calendly\}\}/g,    cfg.calendlyUrl    || '')
    .replace(/\{\{intake\}\}/g,      cfg.intakeFormUrl  || '')
    .replace(/\{\{testimonial\}\}/g, cfg.testimonialUrl || '');

  if (email) MailApp.sendEmail({ to: email, subject: SEQ_EMAIL_SUBJECT, body });
  if (phone) sendText(String(phone), body);
}

function writeNextDate(sh, id, phase, nextStep, interest, rowNum) {
  const msgs = getMessages(phase, interest);
  if (nextStep >= msgs.length) return;

  const next = new Date();
  next.setDate(next.getDate() + (msgs[nextStep].delay || 0));

  if (rowNum) {
    sh.getRange(rowNum, SEQ.NEXT+1).setValue(next);
    return;
  }
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][SEQ.ID]) === String(id)) {
      sh.getRange(i+1, SEQ.NEXT+1).setValue(next);
      break;
    }
  }
}

// ── SequenceFlow reader — cached per execution ────────────────────────────────
let _flow = null;

function getFlow() {
  if (_flow) return _flow;
  _flow = getRows(SHEET.FLOW)
    .map(r => ({
      interest: String(r[0]).trim(),
      phase:    parseInt(r[1]),
      step:     parseInt(r[2]),
      delay:    parseInt(r[3]) || 0,
      msg:      String(r[4])
    }))
    .filter(r => r.phase && !isNaN(r.step));
  return _flow;
}

function getMessages(phase, interest) {
  const flow     = getFlow();
  const specific = flow.filter(r => r.phase === phase && r.interest !== FLOW_WILDCARD && (interest||'').includes(r.interest));
  const wildcard = flow.filter(r => r.phase === phase && r.interest === FLOW_WILDCARD);
  return (specific.length ? specific : wildcard).sort((a, b) => a.step - b.step);
}
