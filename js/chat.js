(function () {
  let messages = [];
  let open = false;

  const ENDPOINT = '/.netlify/functions/chat';

  const STARTERS = [
    'What does a session involve?',
    'Is this for beginners?',
    'How do I book?',
    'Is this confidential?',
  ];

  function buildUI() {
    const btn = document.createElement('button');
    btn.id = 'sl-chat-btn';
    btn.innerHTML = '<span class="sl-chat-icon">✦</span>';
    btn.setAttribute('aria-label', 'Ask a question');
    btn.onclick = toggleChat;

    const panel = document.createElement('div');
    panel.id = 'sl-chat-panel';
    panel.innerHTML = `
      <div class="sl-chat-header">
        <div class="sl-chat-header-text">
          <span class="sl-chat-title">Guide</span>
          <span class="sl-chat-sub">Ask anything about Sir Leo's world</span>
        </div>
        <button class="sl-chat-close" onclick="window._slChatClose()" aria-label="Close">✕</button>
      </div>
      <div class="sl-chat-messages" id="sl-chat-messages">
        <div class="sl-chat-welcome">
          <p>Welcome. Ask me anything — services, safety, how to get started.</p>
          <div class="sl-chat-starters" id="sl-chat-starters">
            ${STARTERS.map(s => `<button class="sl-chat-starter" onclick="window._slChatStarter(this)">${s}</button>`).join('')}
          </div>
        </div>
      </div>
      <div class="sl-chat-input-row">
        <input id="sl-chat-input" class="sl-chat-input" type="text" placeholder="Ask a question…" maxlength="400" />
        <button class="sl-chat-send" id="sl-chat-send" onclick="window._slChatSend()" aria-label="Send">→</button>
      </div>
    `;

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    document.getElementById('sl-chat-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') window._slChatSend();
    });
  }

  function toggleChat() {
    open = !open;
    document.getElementById('sl-chat-panel').classList.toggle('open', open);
    if (open) setTimeout(() => document.getElementById('sl-chat-input').focus(), 300);
  }

  window._slChatClose = function () {
    open = false;
    document.getElementById('sl-chat-panel').classList.remove('open');
  };

  window._slChatStarter = function (btn) {
    document.getElementById('sl-chat-input').value = btn.textContent;
    window._slChatSend();
  };

  window._slChatSend = async function () {
    const input = document.getElementById('sl-chat-input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    const starters = document.getElementById('sl-chat-starters');
    if (starters) starters.remove();

    appendMessage('user', text);
    messages.push({ role: 'user', content: text });

    const typing = appendTyping();
    document.getElementById('sl-chat-send').disabled = true;

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });
      const data = await res.json();
      typing.remove();
      const reply = data.reply || 'Something went wrong — please try again.';
      appendMessage('assistant', reply);
      messages.push({ role: 'assistant', content: reply });
    } catch {
      typing.remove();
      appendMessage('assistant', 'Something went wrong — please try again.');
    } finally {
      document.getElementById('sl-chat-send').disabled = false;
      input.focus();
    }
  };

  function appendMessage(role, text) {
    const msgs = document.getElementById('sl-chat-messages');
    const div = document.createElement('div');
    div.className = 'sl-chat-msg sl-chat-msg--' + role;
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  function appendTyping() {
    const msgs = document.getElementById('sl-chat-messages');
    const div = document.createElement('div');
    div.className = 'sl-chat-msg sl-chat-msg--assistant sl-chat-typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildUI);
  } else {
    buildUI();
  }
})();
