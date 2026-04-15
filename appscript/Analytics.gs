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
  let returnVisitors = 0;
  const fiveMinsAgo  = new Date(Date.now() - 5*60*1000);
  const activeIds    = new Set();

  eRows.forEach(r => { if (new Date(r[0]) > fiveMinsAgo) activeIds.add(r[1]); });

  sRows.forEach(r => {
    if (new Date(r[0]) > fiveMinsAgo) activeIds.add(r[1]);
    if (parseInt(r[8]) > 1) returnVisitors++;
    if (r[9])    sources[r[9]]       = (sources[r[9]]||0)       + 1;
    if (r[10])   refs[r[10]]         = (refs[r[10]]||0)         + 1;
    if (r[5])    deviceCounts[r[5]]  = (deviceCounts[r[5]]||0)  + 1;
    if (r[6])    osCounts[r[6]]      = (osCounts[r[6]]||0)      + 1;
    if (r[7])    browserCounts[r[7]] = (browserCounts[r[7]]||0) + 1;
    if (r[4])    countryCounts[r[4]] = (countryCounts[r[4]]||0) + 1;
    if (r[3] && r[4]) {
      const loc = r[3] + ', ' + r[4];
      cityCounts[loc] = (cityCounts[loc]||0) + 1;
    }
  });

  return {
    totalContacts:   cRows.length,
    totalSessions:   sRows.length,
    totalEvents:     eRows.length,
    bookCompleted,   collabCompleted,
    activeSessions:  activeIds.size,
    returnVisitors,
    sources, refs, topEvents,
    deviceCounts, osCounts, browserCounts, countryCounts, cityCounts,
    contacts:     cRows.slice(-15).reverse().map(r => ({
      timestamp: r[0], name: r[2], phone: r[3], email: r[4], interest: r[5]
    })),
    recentEvents: eRows.slice(-20).reverse().map(r => ({
      timestamp: r[0], event: r[2], value: r[3]
    }))
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
