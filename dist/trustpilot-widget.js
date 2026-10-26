/* Official Trustpilot frame; external content loads only after optional consent. */
(() => {
  const mounts = document.querySelectorAll('[data-dd-trustpilot-widget]');
  if (!mounts.length) return;
  const origin = 'https://widget.trustpilot.com';
  const template = '56278e9abfbbba0bdcd568bc';
  const business = '6ade65254716e8a5ad9ea275';
  const cleanup = new Map();
  let sequence = 0;
  function update() {
    const allowed = window.DDCookieConsent?.hasOptionalConsent() === true;
    for (const mount of mounts) {
      if (allowed && mount.querySelector('iframe')) continue;
      cleanup.get(mount)?.();
      cleanup.delete(mount);
      mount.replaceChildren();
      if (!allowed) {
        const title = document.createElement('strong');
        title.className = 'dd-trustpilot-placeholder-title';
        title.textContent = 'Trustpilot';
        const note = document.createElement('p');
        note.textContent = 'Allow optional content to show the official Trustpilot widget. You can still view our profile using the button.';
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'btn';
        button.textContent = 'Cookie settings';
        button.setAttribute('data-dd-cookie-open', '');
        mount.append(title, note, button);
        continue;
      }
      const frame = document.createElement('iframe');
      const widgetId = 'dd-trustpilot-' + (++sequence);
      frame.title = 'Official Trustpilot Review Collector for Dorset Division';
      frame.width = '100%'; frame.height = '100';
      frame.style.cssText = 'display:block;width:100%;border:0;background:#fff';
      // This frame is hosted by Trustpilot, not our website. Its real origin is
      // required by the official widget API and message handshake. SOP keeps it
      // separate from the Dorset Division page and its form data.
      frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox');
      frame.referrerPolicy = 'no-referrer';
      const send = command => frame.contentWindow?.postMessage(JSON.stringify({command, widgetId}), origin);
      const receive = event => {
        if (event.origin !== origin || event.source !== frame.contentWindow || typeof event.data !== 'string' || event.data.length > 20000) return;
        let message;
        try { message = JSON.parse(event.data); } catch { return; }
        if (!message || message.widgetId !== widgetId) return;
        if (message.command === 'ping') send('pong');
        if (message.command === 'resize-height' && Number.isFinite(message.height)) {
          frame.height = String(Math.min(180, Math.max(52, message.height)));
        }
      };
      window.addEventListener('message', receive);
      cleanup.set(mount, () => window.removeEventListener('message', receive));
      frame.addEventListener('load', () => send('setId'));
      frame.src = origin + '/trustboxes/' + template + '/index.html?businessunitId=' + business + '&templateId=' + template + '#locale=en-GB&styleHeight=52px&styleWidth=100%25&theme=light';
      mount.append(frame);
    }
  }
  window.addEventListener('dd:cookie-consent', update);
  update();
})();
