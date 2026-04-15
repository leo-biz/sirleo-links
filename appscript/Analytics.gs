// ── Analytics.gs ──────────────────────────────────────────────────────────────
// Summary stats and session timeline for the admin dashboard.

function getSummary() {
  const cRows = getRows(SHEET.CONTACTS);
  const eRows = getRows(SHEET.EVENTS);
  const sRows = getRows(SHEET.SESSIONS);

  const sources={}, refs={}, topEvents={};
  let bookCompleted=0, collabCompleted=0;

  eRows.forEach(([,,ev]) => {
    if (ev === 'bookCompleted')   bookCompleted++;
    if (ev === 'collabCompleted') collabCompleted++;
    topEvents[ev] = (topEvents[ev]||0) + 1;
  });

  const deviceCounts={}, osCounts={}, browserCounts={}, countryCounts={}, cityCounts={};
  let returnVisitors = 0, totalVisits = 0;
  const fiveMinsAgo  = new Date(Date.now() - 5*60*1000);
  const activeIds    = new Set();

  eRows.forEach(r => { if (new Date(r[0]) > fiveMinsAgo) activeIds.add(r[1]); });

  sRows.forEach(r => {
    if (new Date(r[SESS.TIMESTAMP]) > fiveMinsAgo) activeIds.add(r[SESS.SID]);
    const pv = parseInt(r[SESS.PAGE_VIEWS]) || 1;
    totalVisits += pv;
    if (pv > 1) returnVisitors++;
    if (r[SESS.SOURCE])  sources[r[SESS.SOURCE]]         = (sources[r[SESS.SOURCE]]||0)         + 1;
    if (r[SESS.REF])     refs[r[SESS.REF]]               = (refs[r[SESS.REF]]||0)               + 1;
    if (r[SESS.DEVICE])  deviceCounts[r[SESS.DEVICE]]    = (deviceCounts[r[SESS.DEVICE]]||0)    + 1;
    if (r[SESS.OS])      osCounts[r[SESS.OS]]            = (osCounts[r[SESS.OS]]||0)            + 1;
    if (r[SESS.BROWSER]) browserCounts[r[SESS.BROWSER]]  = (browserCounts[r[SESS.BROWSER]]||0)  + 1;
    if (r[SESS.COUNTRY]) countryCounts[r[SESS.COUNTRY]]  = (countryCounts[r[SESS.COUNTRY]]||0)  + 1;
    if (r[SESS.CITY]) {
      const loc = [r[SESS.CITY], r[SESS.COUNTRY]].filter(Boolean).join(', ');
      cityCounts[loc] = (cityCounts[loc]||0) + 1;
    }
  });

  // ── Time series — last 30 days bucketed by date ───────────────────────────
  const today  = new Date();
  const days   = 30;
  const labels = [];
  const sessMap = {}, visitsMap = {}, contactMap = {}, eventMap = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    labels.push(key);
    sessMap[key] = 0; visitsMap[key] = 0; contactMap[key] = 0; eventMap[key] = 0;
  }
  sRows.forEach(r => {
    const key = String(r[SESS.TIMESTAMP]).slice(0, 10);
    if (sessMap[key] !== undefined) {
      sessMap[key]++;
      visitsMap[key] += parseInt(r[SESS.PAGE_VIEWS]) || 1;
    }
  });
  cRows.forEach(r => {
    const key = String(r[0]).slice(0, 10);
    if (contactMap[key] !== undefined) contactMap[key]++;
  });
  eRows.forEach(r => {
    const key = String(r[0]).slice(0, 10);
    if (eventMap[key] !== undefined) eventMap[key]++;
  });
  const timeSeries = {
    labels,
    visits:   labels.map(d => visitsMap[d]),
    sessions: labels.map(d => sessMap[d]),
    contacts: labels.map(d => contactMap[d]),
    events:   labels.map(d => eventMap[d])
  };

  return {
    totalContacts:   cRows.length,
    totalSessions:   sRows.length,
    totalVisits,
    totalEvents:     eRows.length,
    bookCompleted,   collabCompleted,
    activeSessions:  activeIds.size,
    returnVisitors,
    sources, refs, topEvents,
    deviceCounts, osCounts, browserCounts, countryCounts, cityCounts,
    timeSeries,
    contacts:     cRows.slice(-15).reverse().map(r => ({
      timestamp: r[0], name: r[2], phone: r[3], email: r[4], interest: r[5]
    })),
    recentEvents: (function() {
      const sessBySid = {};
      sRows.forEach(r => { sessBySid[r[SESS.SID]] = { ip: r[SESS.IP], device: r[SESS.DEVICE], os: r[SESS.OS], browser: r[SESS.BROWSER] }; });
      const nameBySid = {};
      cRows.forEach(r => { nameBySid[r[1]] = r[2]; });
      return eRows.slice(-20).reverse().map(r => {
        const sid  = r[1];
        const sess = sessBySid[sid] || {};
        return {
          timestamp: r[0], sessionId: sid, event: r[2], value: r[3],
          name: nameBySid[sid] || '', ip: sess.ip || '', device: sess.device || '',
          os: sess.os || '', browser: sess.browser || ''
        };
      });
    })()
  };
}

function getSessionList(limit) {
  const sRows = getRows(SHEET.SESSIONS);
  const eRows = getRows(SHEET.EVENTS);
  const cRows = getRows(SHEET.CONTACTS);
  const fiveMinsAgo = new Date(Date.now() - 5*60*1000);

  const evBySid = {}, contactBySid = {};
  eRows.forEach(r => {
    if (!evBySid[r[1]]) evBySid[r[1]] = [];
    evBySid[r[1]].push({ timestamp: r[0], event: r[2], value: r[3] });
  });
  cRows.forEach(r => {
    contactBySid[r[1]] = { name: r[2], phone: r[3], interest: r[5] };
  });

  return sRows.slice(-limit).reverse().map(r => {
    const [ts, sid, ip, city, country, device, os, browser, pageViews, source, ref] = r;
    const events  = evBySid[sid]      || [];
    const contact = contactBySid[sid] || {};
    const lastTs  = events.length ? events[events.length-1].timestamp : ts;
    return {
      sessionId: sid, timestamp: ts, lastSeen: lastTs,
      ip, city, country, device, os, browser, pageViews, source, ref,
      name:     contact.name     || null,
      phone:    contact.phone    || null,
      interest: contact.interest || null,
      active:   new Date(lastTs) > fiveMinsAgo,
      events
    };
  });
}
