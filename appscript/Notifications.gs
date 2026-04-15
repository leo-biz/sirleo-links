// ── Notifications.gs ──────────────────────────────────────────────────────────
// New contact alert to Sir Leo + confirmation email to visitor.
// All copy (subject, body) is driven by the Config sheet.

function notifyAndConfirm(d) {
  const cfg    = config();
  const id     = d.sessionId || '';
  const name   = d.name      || '';
  const first  = name.split(' ')[0] || '';
  const notify = cfg.notifyEmail || '';
  const script = cfg.scriptUrl   || '';

  _notifySirLeo(d, id, name, first, notify, script, cfg);
  _confirmVisitor(d, first, cfg);
}

function _notifySirLeo(d, id, name, first, notify, script, cfg) {
  if (!notify) return;

  const btn = (action, label) => script
    ? `<a href="${script}?action=${action}&id=${encodeURIComponent(id)}" ` +
      `style="padding:8px 16px;background:#1a1a1a;color:#b4915a;text-decoration:none;font-weight:bold;margin-right:8px">${label}</a>`
    : '';

  MailApp.sendEmail({
    to:       notify,
    subject:  '🔔 ' + (name||'Unknown') + ' — ' + (d.interest||'?'),
    htmlBody:
      `<p><b>Name:</b> ${name||'—'}</p>` +
      `<p><b>Phone:</b> ${d.phone||'—'}</p>` +
      `<p><b>Email:</b> ${d.email||'—'}</p>` +
      `<p><b>Interest:</b> ${d.interest||'—'}</p>` +
      `<p><b>Source:</b> ${d.source||'direct'}</p><br>` +
      btn('markConsulted', '✓ Consulted') +
      btn('markBooked',    '✓ Booked')    +
      btn('pauseSeq',      '⏸ Pause')
  });
}

function _confirmVisitor(d, first, cfg) {
  if (!d.email) return;

  const subject = cfg.confirmSubject || 'Sir Leo — Submission Received';
  const tpl     = cfg.confirmMessage ||
    '{{name}},\n\nYour submission was received. Sir Leo reviews each inquiry personally and will be in touch soon.\n\n— Sir Leo';

  MailApp.sendEmail({
    to:      d.email,
    subject: subject,
    body:    tpl.replace('{{name}}', first || 'Hello')
  });
}
