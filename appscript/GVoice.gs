// ── GVoice.gs ─────────────────────────────────────────────────────────────────
// Watches Gmail for Google Voice text notifications, parses them, matches
// against Contacts sheet, and logs to the Messages sheet.
//
// Trigger: run watchGVoiceEmails() on a time-based trigger (every 5–15 min).
// Setup:   run setupGVoiceTrigger() once from the Apps Script IDE.

function setupGVoiceTrigger() {
  // Remove existing to avoid duplicates
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'watchGVoiceEmails')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('watchGVoiceEmails').timeBased().everyMinutes(10).create();
  Logger.log('✓ GVoice trigger set — every 10 minutes');
}

// ── Main watcher ──────────────────────────────────────────────────────────────
function watchGVoiceEmails() {
  const threads = GmailApp.search('from:txt.voice.google.com is:unread', 0, 25);
  threads.forEach(thread => {
    thread.getMessages()
      .filter(m => m.isUnread())
      .forEach(m => {
        try {
          _processGVoiceMessage(m);
          m.markRead();
        } catch(e) {
          Logger.log('GVoice error on msg ' + m.getId() + ': ' + e.message);
        }
      });
  });
}

// ── Parse + store one message ─────────────────────────────────────────────────
function _processGVoiceMessage(msg) {
  const subject = msg.getSubject();  // "New text message from (814) 541-5044"
  const from    = msg.getFrom();     // "(814) 541-5044 <17732348238.18145415044.xxx@txt.voice.google.com>"
  const ts      = msg.getDate().toISOString();
  const msgId   = msg.getId();

  // Extract phone from subject line
  const subjectMatch = subject.match(/\((\d{3})\)\s*(\d{3})-(\d{4})/);
  if (!subjectMatch) return;  // not a text notification
  const phone = '+1' + subjectMatch[1] + subjectMatch[2] + subjectMatch[3];

  // Extract reply-to email from From header  <...@txt.voice.google.com>
  const emailMatch = from.match(/<([^>]+@txt\.voice\.google\.com)>/);
  const replyEmail = emailMatch ? emailMatch[1] : '';

  // Clean the plain body — strip GVoice boilerplate footer
  const rawBody  = msg.getPlainBody() || '';
  const cleanBody = _cleanGVoiceBody(rawBody);

  // Match against Contacts sheet
  const contact     = findContactByPhone(phone);
  const contactName = contact ? contact.name : '';

  // Log to Messages sheet
  appendRow(SHEET.MESSAGES, [ts, phone, contactName, 'in', cleanBody, replyEmail, msgId]);

  Logger.log('[GVoice] in | ' + phone + ' (' + (contactName||'unknown') + '): ' + cleanBody.slice(0, 60));
}

function _cleanGVoiceBody(raw) {
  const stopPhrases = [
    'YOUR ACCOUNT', 'HELP CENTER', 'HELP FORUM',
    'txt.voice.google.com', 'Google LLC', '1600 Amphitheatre',
    'Mountain View', 'email notification settings',
    'This email was sent to you'
  ];
  return raw.split('\n')
    .filter(line => !stopPhrases.some(p => line.includes(p)))
    .join('\n')
    .trim();
}

// ── Contact lookup by phone ───────────────────────────────────────────────────
function findContactByPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  const rows   = getRows(SHEET.CONTACTS);
  for (const r of rows) {
    const p = String(r[3]).replace(/\D/g, '');
    if (!p) continue;
    // Match last 10 digits (handles +1 prefix variations)
    if (p.slice(-10) === digits.slice(-10)) {
      return { name: r[2], phone: r[3], email: r[4], interest: r[5] };
    }
  }
  return null;
}

// ── Fetch message thread for a given phone ────────────────────────────────────
function getMessagesForPhone(phone) {
  const digits = phone.replace(/\D/g, '').slice(-10);
  return getRows(SHEET.MESSAGES)
    .filter(r => String(r[MSG.PHONE]).replace(/\D/g, '').slice(-10) === digits)
    .map(r => ({
      timestamp:  r[MSG.TIMESTAMP],
      phone:      r[MSG.PHONE],
      name:       r[MSG.NAME],
      direction:  r[MSG.DIRECTION],
      body:       r[MSG.BODY],
      replyEmail: r[MSG.REPLY_EMAIL]
    }))
    .slice(-30);  // last 30 messages
}
