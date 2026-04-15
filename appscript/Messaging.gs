// ── Messaging.gs ──────────────────────────────────────────────────────────────
// Send texts via Google Voice email gateway.
//
// How it works:
//   New text  → email {10digits}@txt.voice.google.com from GVoice-linked Gmail
//   Reply     → email the reply address extracted from their incoming GVoice email
//
// Both methods require this Apps Script to run under the Gmail account that
// is linked to Google Voice.

// ── Send a new text (or reply) ────────────────────────────────────────────────
function sendText(phone, body) {
  if (!phone || !body) throw new Error('phone and body required');

  const digits   = phone.replace(/\D/g, '').replace(/^1/, '').slice(-10);
  const toEmail  = digits + '@txt.voice.google.com';
  const ts       = new Date().toISOString();

  GmailApp.sendEmail(toEmail, '', body);

  // Match contact name for the log
  const contact = findContactByPhone(phone);
  appendRow(SHEET.MESSAGES, [ts, phone, contact ? contact.name : '', 'out', body, toEmail, '']);
  Logger.log('[Messaging] out | ' + phone + ': ' + body.slice(0, 60));

  return { ok: true };
}

// ── Reply via the stored reply email (preserves GVoice thread) ────────────────
function replyToText(phone, body) {
  if (!phone || !body) throw new Error('phone and body required');

  // Find most recent inbound reply email for this number
  const msgs      = getMessagesForPhone(phone);
  const lastInbound = [...msgs].reverse().find(m => m.direction === 'in' && m.replyEmail);

  if (lastInbound && lastInbound.replyEmail) {
    GmailApp.sendEmail(lastInbound.replyEmail, '', body);
  } else {
    // Fall back to new text
    const digits  = phone.replace(/\D/g, '').replace(/^1/, '').slice(-10);
    GmailApp.sendEmail(digits + '@txt.voice.google.com', '', body);
  }

  const ts      = new Date().toISOString();
  const contact = findContactByPhone(phone);
  appendRow(SHEET.MESSAGES, [ts, phone, contact ? contact.name : '', 'out', body, '', '']);
  Logger.log('[Messaging] reply | ' + phone + ': ' + body.slice(0, 60));

  return { ok: true };
}

// ── Send a sequence step message manually ─────────────────────────────────────
function sendSequenceMessage(seqId, body) {
  if (!seqId || !body) throw new Error('seqId and body required');

  const rows = getRows(SHEET.SEQUENCES);
  const row  = rows.find(r => r[SEQ.ID] === seqId);
  if (!row) throw new Error('sequence not found: ' + seqId);

  const phone = String(row[SEQ.PHONE]);
  const name  = String(row[SEQ.NAME]);
  const filled = body
    .replace(/\{\{name\}\}/gi, name.split(' ')[0] || name)
    .replace(/\{\{calendly\}\}/gi, config().calendlyUrl || '')
    .replace(/\{\{intake\}\}/gi,   config().intakeFormUrl || '')
    .replace(/\{\{testimonial\}\}/gi, config().testimonialUrl || '');

  return replyToText(phone, filled);
}
