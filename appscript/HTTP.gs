// ── HTTP.gs ───────────────────────────────────────────────────────────────────
// doGet and doPost routing only. No business logic here.

function doGet(e) {
  try {
    const action = (e.parameter.action || '').trim();
    const id     = (e.parameter.id     || '').trim();

    const routes = {
      identity:      () => getKV(SHEET.IDENTITY),
      config:        () => getKV(SHEET.CONFIG),
      summary:       () => getSummary(),
      sessions:      () => getSessionList(parseInt(e.parameter.limit) || 40),
      pipeline:      () => getPipeline(),
      markConsulted: () => advancePhase(id, 2, SEQ.CONSULT),
      markBooked:    () => advancePhase(id, 3, SEQ.BOOK),
      markSession:   () => advancePhase(id, 4, SEQ.SESSION),
      markComplete:  () => setStatus(id, 'complete'),
      pauseSeq:      () => setStatus(id, 'paused'),
      resumeSeq:     () => setStatus(id, 'active')
    };

    const handler = routes[action];
    const result  = handler ? handler() : { error: 'unknown action: ' + action };
    return jsonOut(result);
  } catch(err) {
    return jsonOut({ error: err.message });
  }
}

function doPost(e) {
  try {
    const d   = JSON.parse(e.postData.contents);
    const ts  = d.timestamp || new Date().toISOString();
    const sid = d.sessionId || '';

    if (d.type === 'contact') {
      appendRow(SHEET.CONTACTS, [
        ts, sid, d.name||'', d.phone||'', d.email||'',
        d.interest||'', d.bookingType||'', d.notes||'', d.source||'', d.ref||''
      ]);
      enrollSequence(d, sid);
      notifyAndConfirm(d);
    }
    else if (d.type === 'event') {
      appendRow(SHEET.EVENTS, [ts, sid, d.event||'', d.value||'']);
    }
    else if (d.type === 'session') {
      appendRow(SHEET.SESSIONS, [
        ts, sid, d.ip||'', d.city||'', d.country||'',
        d.device||'', d.os||'', d.browser||'', d.pageViews||1, d.source||'', d.ref||''
      ]);
    }
    return ContentService.createTextOutput('ok');
  } catch(err) {
    return ContentService.createTextOutput('error: ' + err.message);
  }
}

function jsonOut(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
