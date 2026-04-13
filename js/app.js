// Config loaded from /config.js — edit that file, not here

// Custom cursor
const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursorRing');
let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursor.style.left = mouseX + 'px';
  cursor.style.top = mouseY + 'px';
});

function animateRing() {
  ringX += (mouseX - ringX) * 0.12;
  ringY += (mouseY - ringY) * 0.12;
  ring.style.left = ringX + 'px';
  ring.style.top = ringY + 'px';
  requestAnimationFrame(animateRing);
}
animateRing();

document.querySelectorAll('a, button').forEach(el => {
  el.addEventListener('mouseenter', () => {
    ring.style.width = '48px';
    ring.style.height = '48px';
    cursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
  });
  el.addEventListener('mouseleave', () => {
    ring.style.width = '32px';
    ring.style.height = '32px';
    cursor.style.transform = 'translate(-50%, -50%) scale(1)';
  });
});

// Expand cards
function toggleCard(id) {
  document.getElementById(id).classList.toggle('open');
}

// Slide panels
function openPanel(id) {
  document.getElementById(id).classList.add('open');
}
function closePanel(id) {
  document.getElementById(id).classList.remove('open');
}
function handlePanelClick(e, id) {
  if (e.target === document.getElementById(id)) closePanel(id);
}

// Generic wizard navigation
function wizardGo(panelSelector, toId, label) {
  const current = document.querySelector(panelSelector + ' .panel-step.active');
  const next = document.getElementById(toId);
  if (!next) return;
  current.classList.remove('active');
  current.classList.add('slide-left');
  next.classList.remove('slide-left', 'slide-right');
  next.classList.add('active');
  if (label) {
    const lbl = document.getElementById(toId + '-label');
    if (lbl) lbl.textContent = label;
  }
}
function wizardBack(panelSelector, toId) {
  const current = document.querySelector(panelSelector + ' .panel-step.active');
  const target = document.getElementById(toId);
  if (!target) return;
  current.classList.remove('active');
  current.classList.add('slide-right');
  target.classList.remove('slide-left', 'slide-right');
  target.classList.add('active');
}
function resetWizard(panelId) {
  document.querySelectorAll('#' + panelId + ' .panel-step').forEach((s, i) => {
    s.classList.remove('active', 'slide-left', 'slide-right');
    i === 0 ? s.classList.add('active') : s.classList.add('slide-right');
  });
}

// Book wizard
let bPrevContact = 'bs-type';
let bSelections = [];

function bNext(toId, label) {
  if (label) bSelections.push(label);
  if (toId === 'bs-contact') {
    bPrevContact = document.querySelector('#panel-book .panel-step.active').id;
    prefillFields('book-name', 'book-phone', 'book-email');
    const lbl = document.getElementById('bs-contact-label');
    if (lbl) lbl.textContent = bSelections.join(' · ');
  }
  if (toId === 'bs-private-q') {
    document.getElementById('bs-private-q-label').textContent = bSelections.join(' · ');
  }
  if (toId === 'bs-group-q') {
    document.getElementById('bs-group-q-label').textContent = bSelections.join(' · ');
    const isPerf = bSelections.includes('Performance — Watch Only');
    document.getElementById('bs-group-exp-wrap').style.display = isPerf ? 'none' : '';
    document.getElementById('bs-group-limits-wrap').style.display = isPerf ? 'none' : '';
  }
  wizardGo('#panel-book', toId, null);
}
function bBack(toId) {
  wizardBack('#panel-book', toId || bPrevContact);
}
function bSubmit() {
  const name = document.getElementById('book-name').value;
  const phone = document.getElementById('book-phone').value;
  const email = document.getElementById('book-email').value;
  const noteMap = { 'bs-private-q': 'bpq-note', 'bs-group-q': 'bgq-note', 'bs-perf-q': 'bperfq-note', 'bs-workshop-q': 'bwq-note' };
  const noteEl = document.getElementById(noteMap[bPrevContact]);
  const notes = noteEl ? noteEl.value : '';
  saveContact(name, phone, email);
  submitToGoogleForm(name, phone, email, bSelections.join(' / '), notes);
  logContact(name, phone, email, bSelections.join(' / '), bSelections.join(' / '), notes);
  logEvent('bookCompleted', bSelections.join(' / '));
  const smsText = encodeURIComponent('Hey Sir Leo — I\'m ' + (name || 'interested') + '. I just applied for ' + bSelections.join(' / ') + '.');
  document.getElementById('bs-sms-btn').href = 'sms:+17732348238?body=' + smsText;
  wizardGo('#panel-book', 'bs-confirm', null);
  setTimeout(closeBookPanel, 4000);
}
function closeBookPanel() {
  const active = document.querySelector('#panel-book .panel-step.active');
  if (active && active.id !== 'bs-confirm') logEvent('bookDropped', active.id);
  closePanel('panel-book');
  setTimeout(() => { resetWizard('panel-book'); bSelections = []; }, 500);
}

// Collab wizard
let cPrevContact = 'cs-type';
let cSelections = [];

function cNext(toId, label) {
  if (label) cSelections.push(label);
  if (toId === 'cs-contact') {
    cPrevContact = document.querySelector('#panel-collab .panel-step.active').id;
    prefillFields('collab-name', 'collab-phone', 'collab-email');
    const lbl = document.getElementById('cs-contact-label');
    if (lbl) lbl.textContent = cSelections.join(' · ');
  }
  wizardGo('#panel-collab', toId, null);
}
function cBack(toId) {
  wizardBack('#panel-collab', toId || cPrevContact);
}
function cSubmit() {
  const name = document.getElementById('collab-name').value;
  const phone = document.getElementById('collab-phone').value;
  const email = document.getElementById('collab-email').value;
  const cNoteMap = { 'cs-sub-q': 'csub-note', 'cs-model-q': 'cmod-note', 'cs-photo-q': 'cphoto-note', 'cs-creator-q': 'ccreate-note' };
  const cNoteEl = document.getElementById(cNoteMap[cPrevContact]);
  const notes = cNoteEl ? cNoteEl.value : '';
  saveContact(name, phone, email);
  submitToGoogleForm(name, phone, email, cSelections.join(' / '), notes);
  logContact(name, phone, email, cSelections.join(' / '), cSelections.join(' / '), notes);
  logEvent('collabCompleted', cSelections.join(' / '));
  const smsText = encodeURIComponent('Hey Sir Leo — I\'m ' + (name || 'reaching out') + '. I\'d love to collaborate as a ' + cSelections[0] + '.');
  document.getElementById('cs-sms-btn').href = 'sms:+17732348238?body=' + smsText;
  wizardGo('#panel-collab', 'cs-confirm', null);
  setTimeout(closeCollabPanel, 4000);
}
function closeCollabPanel() {
  const active = document.querySelector('#panel-collab .panel-step.active');
  if (active && active.id !== 'cs-confirm') logEvent('collabDropped', active.id);
  closePanel('panel-collab');
  setTimeout(() => { resetWizard('panel-collab'); cSelections = []; }, 500);
}

// Session ID — one per visitor, persists across page visits
function getSession() {
  let id = localStorage.getItem('sl_session');
  if (!id) {
    id = 'sl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    localStorage.setItem('sl_session', id);
  }
  return id;
}

// ─── Sheet logging ───────────────────────────────────────────────────────────
function _post(payload) {
  if (!SL.sheetUrl) return;
  fetch(SL.sheetUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.assign({ sessionId: getSession(), timestamp: new Date().toISOString() }, payload))
  });
}

function logContact(name, phone, email, interest, bookingType, notes) {
  _post({ type: 'contact', name, phone, email, interest, bookingType: bookingType || '', notes: notes || '' });
}

function logEvent(event, value) {
  _post({ type: 'event', event, value: value || '' });
}

function logSession(data) {
  _post(Object.assign({ type: 'session' }, data));
}

function logSocialTap(platform) {
  logEvent('socialTap', platform);
}

// ─── Session init — IP + device on page load ─────────────────────────────────
(function initSession() {
  const views = (parseInt(localStorage.getItem('sl_views') || '0')) + 1;
  localStorage.setItem('sl_views', String(views));

  // Capture ?src= on first visit and persist it
  const srcParam = new URLSearchParams(location.search).get('src');
  if (srcParam) localStorage.setItem('sl_source', srcParam);
  const source = localStorage.getItem('sl_source') || '';

  const ua = navigator.userAgent;
  const device   = /mobile|android|iphone|ipad/i.test(ua) ? (/ipad|tablet/i.test(ua) ? 'tablet' : 'mobile') : 'desktop';
  const os       = /iphone|ipad|ipod/i.test(ua) ? 'iOS' : /android/i.test(ua) ? 'Android' : /windows/i.test(ua) ? 'Windows' : /mac/i.test(ua) ? 'macOS' : 'Other';
  const browser  = /edg/i.test(ua) ? 'Edge' : /chrome/i.test(ua) ? 'Chrome' : /firefox/i.test(ua) ? 'Firefox' : /safari/i.test(ua) ? 'Safari' : 'Other';

  fetch('https://ipapi.co/json/')
    .then(r => r.json())
    .then(ip => logSession({ ip: ip.ip, city: ip.city, country: ip.country_name, device, os, browser, pageViews: views, source }))
    .catch(() => logSession({ device, os, browser, pageViews: views, source }));
})();
// ─────────────────────────────────────────────────────────────────────────────

// Google Forms submission
function submitToGoogleForm(name, phone, email, interest, notes) {
  const url = 'https://docs.google.com/forms/d/e/' + SL.gformId + '/formResponse';
  const body = new URLSearchParams({
    'entry.822677538': name || '',
    'entry.1256343272': phone || '',
    'entry.1186389288': email || '',
    'entry.379165230': interest || '',
    'entry.827857821': notes || '',
  });
  fetch(url, { method: 'POST', mode: 'no-cors', body });
}

// Session storage
function saveContact(name, phone, email) {
  if (name) localStorage.setItem('sl_name', name);
  if (phone) localStorage.setItem('sl_phone', phone);
  if (email) localStorage.setItem('sl_email', email);
}
function prefillFields(nameId, phoneId, emailId) {
  const name = localStorage.getItem('sl_name');
  const phone = localStorage.getItem('sl_phone');
  const email = localStorage.getItem('sl_email');
  if (name && nameId) document.getElementById(nameId).value = name;
  if (phone && phoneId) document.getElementById(phoneId).value = phone;
  if (email && emailId) document.getElementById(emailId).value = email;
}

// Contact modal
function openModal() {
  prefillFields('modal-name', 'modal-phone', 'modal-email');
  document.getElementById('modalOverlay').classList.add('open');
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}
function handleOverlayClick(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
}
function submitForm() {
  const name = document.getElementById('modal-name').value;
  const phone = document.getElementById('modal-phone').value;
  const email = document.getElementById('modal-email').value;
  const interests = ['int-curious','int-session','int-group','int-event','int-collab','int-learn']
    .filter(id => document.getElementById(id).checked)
    .map(id => document.querySelector('label[for="'+id+'"]').textContent)
    .join(', ') || 'Stay Connected';
  saveContact(name, phone, email);
  submitToGoogleForm(name, phone, email, interests, '');
  logContact(name, phone, email, interests, '', '');
  localStorage.setItem('sl_submitted', '1');
  logEvent('modalSubmitted', interests);
  updateTextLink();
  document.getElementById('modalForm').classList.add('hide');
  document.getElementById('modalConfirm').classList.add('show');
  setTimeout(closeModal, 2200);
}

// Auto-open after 1.5s — skip if already submitted
if (!localStorage.getItem('sl_submitted')) setTimeout(openModal, 1500);

// Save Contact — vCard download
function saveVCard() {
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'FN:Sir Leo',
    'N:Leo;Sir;;;',
    'TEL;TYPE=CELL:' + SL.phone,
    'EMAIL:' + SL.email,
    'URL:' + SL.siteUrl,
    'X-SOCIALPROFILE;type=instagram:' + SL.instagram,
    'X-SOCIALPROFILE;type=facebook:' + SL.facebook,
    'X-SOCIALPROFILE;type=fetlife:' + SL.fetlife,
    'NOTE:Luxury Dominance & Performance Art',
    'END:VCARD'
  ].join('\r\n');
  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sir-leo.vcf';
  a.click();
  URL.revokeObjectURL(url);
}

// Add to Calendar — two events in one ICS
function addToCalendar() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => buildAndDownloadICS(pos.coords.latitude, pos.coords.longitude),
      ()  => buildAndDownloadICS(null, null),
      { timeout: 5000 }
    );
  } else {
    buildAndDownloadICS(null, null);
  }
}

function buildAndDownloadICS(lat, lon) {
  const pad = n => String(n).padStart(2,'0');
  const fmt = d => d.getFullYear() + pad(d.getMonth()+1) + pad(d.getDate());
  const today = new Date();
  const reminder = new Date(today); reminder.setDate(today.getDate() + 3);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const reminderEnd = new Date(reminder); reminderEnd.setDate(reminder.getDate() + 1);

  const locationLine = (lat && lon) ? 'GEO:' + lat.toFixed(6) + ';' + lon.toFixed(6) : null;

  const desc1 = [
    'On this day\\, you experienced the presence of Sir Leo.',
    'Below are your instructions\\, skip steps you have already completed:\\n',
    'Step 1. Visit ' + SL.siteUrl,
    'Step 2. A pop up will appear\\, insert your contact info and complete the checkbox of interest',
    'Step 3. Click Contact > Text Sir Leo. It will auto create a text\\, be sure to press send',
    'Step 4. Recognize\\, Schedule a call is present for future endeavors',
    'Step 5. Click Follow\\, and follow Sir Leo on all social medias listed',
    'Step 6. Click Book\\, and click the options of interest',
    'Step 7. Click Collaborate if you are looking to do so\\n',
    'Sir Leo',
    'Phone: ' + SL.phoneDisplay,
    'Email: ' + SL.email,
    'Site: ' + SL.siteUrl
  ].join('\\n');

  const desc2 = [
    'Your reminder to follow through with Sir Leo.\\n',
    'Site: ' + SL.siteUrl,
    'Phone: ' + SL.phoneDisplay,
    'Email: ' + SL.email,
    'Text: ' + SL.phone
  ].join('\\n');

  const event1 = [
    'BEGIN:VEVENT',
    'UID:met-sirleo-' + Date.now() + '@sirleo-links.netlify.app',
    'DTSTART;VALUE=DATE:' + fmt(today),
    'DTEND;VALUE=DATE:' + fmt(tomorrow),
    'SUMMARY:Met Sir Leo',
    'DESCRIPTION:' + desc1,
    locationLine,
    'END:VEVENT'
  ].filter(Boolean).join('\r\n');

  const event2 = [
    'BEGIN:VEVENT',
    'UID:remind-sirleo-' + Date.now() + '@sirleo-links.netlify.app',
    'DTSTART;VALUE=DATE:' + fmt(reminder),
    'DTEND;VALUE=DATE:' + fmt(reminderEnd),
    'SUMMARY:Connect with Sir Leo',
    'DESCRIPTION:' + desc2,
    'END:VEVENT'
  ].join('\r\n');

  const ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Sir Leo//sirleo-links//EN\r\n' + event1 + '\r\n' + event2 + '\r\nEND:VCALENDAR';
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sir-leo.ics';
  a.click();
  URL.revokeObjectURL(url);
}

// Build Text Sir Leo link with name
function updateTextLink() {
  const name = localStorage.getItem('sl_name');
  const msg = name
    ? 'Hey Sir Leo — I\'m ' + name + '. I want to stay connected.'
    : 'Hey Sir Leo — I want to stay connected.';
  const link = document.getElementById('text-sir-leo-link');
  if (link) link.href = 'sms:' + SL.phone + '?body=' + encodeURIComponent(msg);
}
updateTextLink();

// Deep link via ?open= param
(function() {
  const action = new URLSearchParams(location.search).get('open');
  if (action === 'book') setTimeout(() => openPanel('panel-book'), 400);
  if (action === 'follow') setTimeout(() => toggleCard('card-follow'), 400);
})();

// Service worker registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// iOS install banner
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = window.navigator.standalone;
const dismissed = localStorage.getItem('sl_pwa_dismissed');
if (isIOS && !isStandalone && !dismissed) {
  const banner = document.createElement('div');
  banner.id = 'ios-banner';
  banner.innerHTML = '<span>Tap <strong>Share</strong> then <strong>Add to Home Screen</strong> to save Sir Leo for later</span><button onclick="localStorage.setItem(\'sl_pwa_dismissed\',\'1\'); this.parentElement.remove()">✕</button>';
  banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#1a1a1a;border-top:1px solid rgba(180,145,90,0.3);color:#b4915a;font-family:Raleway,sans-serif;font-size:13px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;';
  banner.querySelector('button').style.cssText = 'background:none;border:none;color:#b4915a;font-size:18px;cursor:pointer;flex-shrink:0;';
  document.body.appendChild(banner);
}
