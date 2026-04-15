// Config loaded from /config.js (fallbacks) + Identity/Config sheets (live values)
// Shared functions (saveVCard, ICS, remote config) are in /js/shared.js

// ─── Brightness toggle ────────────────────────────────────────────────────────
(function() {
  // Default is dark — only go light if user explicitly chose it
  if (localStorage.getItem('sl_hc') === 'light') document.body.classList.add('high-contrast');
})();
function toggleBrightness() {
  const on = document.body.classList.toggle('high-contrast');
  localStorage.setItem('sl_hc', on ? 'light' : 'dark');
}
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
  const card = document.getElementById(id);
  const wasOpen = card.classList.contains('open');
  card.classList.toggle('open');
  if (wasOpen) logEvent('cardDropped', id);
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
  if (!phone.trim()) {
    const el = document.getElementById('book-phone');
    el.focus();
    el.style.borderColor = 'rgba(155,32,32,0.8)';
    setTimeout(() => el.style.borderColor = '', 2000);
    return;
  }
  const noteMap = { 'bs-private-q': 'bpq-note', 'bs-group-q': 'bgq-note', 'bs-perf-q': 'bperfq-note', 'bs-workshop-q': 'bwq-note' };
  const noteEl = document.getElementById(noteMap[bPrevContact]);
  const notes = noteEl ? noteEl.value : '';
  const bInterest = bSelections.join(' / ');
  saveContact(name, phone, email, bInterest);
  submitToGoogleForm(name, phone, email, bInterest, notes);
  logContact(name, phone, email, bInterest, bInterest, notes);
  logEvent('bookCompleted', bInterest);
  document.getElementById('bs-sms-btn').href = 'sms:' + SL.phone + '?body=' + encodeURIComponent(buildSmsBody(name, bInterest, SL.eventName));
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
  if (!phone.trim()) {
    const el = document.getElementById('collab-phone');
    el.focus();
    el.style.borderColor = 'rgba(155,32,32,0.8)';
    setTimeout(() => el.style.borderColor = '', 2000);
    return;
  }
  const cNoteMap = { 'cs-sub-q': 'csub-note', 'cs-model-q': 'cmod-note', 'cs-photo-q': 'cphoto-note', 'cs-creator-q': 'ccreate-note' };
  const cNoteEl = document.getElementById(cNoteMap[cPrevContact]);
  const notes = cNoteEl ? cNoteEl.value : '';
  const cInterest = cSelections.join(' / ');
  saveContact(name, phone, email, cInterest);
  submitToGoogleForm(name, phone, email, cInterest, notes);
  logContact(name, phone, email, cInterest, cInterest, notes);
  logEvent('collabCompleted', cInterest);
  document.getElementById('cs-sms-btn').href = 'sms:' + SL.phone + '?body=' + encodeURIComponent(buildSmsBody(name, cInterest, SL.eventName));
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
const _QUEUE_KEY = 'sl_queue';

function _flushQueue() {
  if (!SL.sheetUrl) return;
  const queue = JSON.parse(localStorage.getItem(_QUEUE_KEY) || '[]');
  if (!queue.length) return;
  localStorage.removeItem(_QUEUE_KEY);
  queue.forEach(payload => _send(payload));
}

function _send(payload) {
  fetch(SL.sheetUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(() => {
    // Re-queue on failure
    const queue = JSON.parse(localStorage.getItem(_QUEUE_KEY) || '[]');
    queue.push(payload);
    localStorage.setItem(_QUEUE_KEY, JSON.stringify(queue));
  });
}

function _post(payload) {
  if (!SL.sheetUrl) return;
  const full = Object.assign({ sessionId: getSession(), timestamp: new Date().toISOString() }, payload);
  console.log('[SL] posting to:', SL.sheetUrl, full);
  _send(full);
}

// Drain any queued payloads from previous offline visits
_flushQueue();

function logContact(name, phone, email, interest, bookingType, notes) {
  const source = localStorage.getItem('sl_source') || '';
  const ref    = localStorage.getItem('sl_ref') || '';
  _post({ type: 'contact', name, phone, email, interest, bookingType: bookingType || '', notes: notes || '', source, ref });
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

  // Capture ?src= and ?ref= on first visit and persist them
  const params = new URLSearchParams(location.search);
  const srcParam = params.get('src');
  const refParam = params.get('ref');
  if (srcParam) localStorage.setItem('sl_source', srcParam);
  if (refParam) localStorage.setItem('sl_ref', refParam);

  // Pre-fill contact fields from URL params (?name=, ?phone=, ?email=)
  const nameParam  = params.get('name');
  const phoneParam = params.get('phone');
  const emailParam = params.get('email');
  if (nameParam)  localStorage.setItem('sl_name',  nameParam);
  if (phoneParam) localStorage.setItem('sl_phone', phoneParam);
  if (emailParam) localStorage.setItem('sl_email', emailParam);
  const source = localStorage.getItem('sl_source') || '';
  const ref    = localStorage.getItem('sl_ref') || '';

  const ua = navigator.userAgent;
  const device   = /mobile|android|iphone|ipad/i.test(ua) ? (/ipad|tablet/i.test(ua) ? 'tablet' : 'mobile') : 'desktop';
  const os       = /iphone|ipad|ipod/i.test(ua) ? 'iOS' : /android/i.test(ua) ? 'Android' : /windows/i.test(ua) ? 'Windows' : /mac/i.test(ua) ? 'macOS' : 'Other';
  const browser  = /edg/i.test(ua) ? 'Edge' : /chrome/i.test(ua) ? 'Chrome' : /firefox/i.test(ua) ? 'Firefox' : /safari/i.test(ua) ? 'Safari' : 'Other';

  fetch('https://ipapi.co/json/')
    .then(r => r.json())
    .then(ip => {
      const payload = { ip: ip.ip, city: ip.city, region: ip.region, country: ip.country_name, device, os, browser, pageViews: views, source, ref };
      console.log('[SL] session payload:', payload);
      logSession(payload);
    })
    .catch(() => {
      const payload = { device, os, browser, pageViews: views, source, ref };
      console.log('[SL] session payload (no geo):', payload);
      logSession(payload);
    });
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
function saveContact(name, phone, email, interest) {
  if (name)     localStorage.setItem('sl_name', name);
  if (phone)    localStorage.setItem('sl_phone', phone);
  if (email)    localStorage.setItem('sl_email', email);
  if (interest) localStorage.setItem('sl_interest', interest);
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
let _modalOpen = false;
let _modalDone = false;
function openModal() {
  _modalOpen = true;
  _modalDone = false;
  prefillFields('modal-name', 'modal-phone', 'modal-email');
  document.getElementById('modalOverlay').classList.add('open');
}
function closeModal() {
  if (_modalOpen && !_modalDone) logEvent('modalDropped');
  _modalOpen = false;
  document.getElementById('modalOverlay').classList.remove('open');
}
function handleOverlayClick(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
}
function submitForm() {
  const name = document.getElementById('modal-name').value;
  const phone = document.getElementById('modal-phone').value;
  const email = document.getElementById('modal-email').value;
  if (!phone.trim()) {
    const el = document.getElementById('modal-phone');
    el.focus();
    el.style.borderColor = 'rgba(155,32,32,0.8)';
    setTimeout(() => el.style.borderColor = '', 2000);
    return;
  }
  const _allIds = ['int-curious','int-session','int-group','int-event','int-collab','int-learn'];
  const interests = document.getElementById('int-all').checked
    ? 'All of the above'
    : _allIds.filter(id => document.getElementById(id).checked)
        .map(id => document.querySelector('label[for="'+id+'"]').textContent)
        .join(', ') || 'Stay Connected';
  _modalDone = true;
  saveContact(name, phone, email, interests);
  submitToGoogleForm(name, phone, email, interests, '');
  logContact(name, phone, email, interests, '', '');
  localStorage.setItem('sl_submitted', '1');
  logEvent('modalSubmitted', interests);
  updateTextLink();
  document.getElementById('modalForm').classList.add('hide');
  document.getElementById('modalConfirm').classList.add('show');
  setTimeout(closeModal, 2200);
}

// FAQ accordion
function toggleFaq(el) {
  el.classList.toggle('open');
}

// All of the above checkbox
const _interestIds = ['int-curious','int-session','int-group','int-event','int-collab','int-learn'];
function toggleAllInterests(el) {
  _interestIds.forEach(id => { document.getElementById(id).checked = el.checked; });
}
// Uncheck "All of the above" if any individual box is unchecked
_interestIds.forEach(id => {
  document.getElementById(id).addEventListener('change', () => {
    const allChecked = _interestIds.every(i => document.getElementById(i).checked);
    document.getElementById('int-all').checked = allChecked;
  });
});

// Auto-open after 1.5s — skip if already submitted
if (!localStorage.getItem('sl_submitted')) setTimeout(openModal, 1500);


// Version tag
const _vEl = document.getElementById('sl-version');
if (_vEl) _vEl.textContent = 'v' + (SL.version || '—');

// Build Text Sir Leo link with name + interest
function updateTextLink() {
  const name     = localStorage.getItem('sl_name');
  const interest = localStorage.getItem('sl_interest');
  const msg  = buildSmsBody(name, interest, SL.eventName);
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
