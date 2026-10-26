/* The official Review Collector stays isolated until optional content is allowed. */
(() => {
  const mounts = document.querySelectorAll('[data-dd-trustpilot-widget]');
  if (!mounts.length) return;
  function update() {
    const allowed = window.DDCookieConsent?.hasOptionalConsent() === true;
    for (const mount of mounts) {
      if (allowed && mount.querySelector('iframe')) continue;
      mount.replaceChildren();
      if (!allowed) {
        const title = document.createElement('strong');
        title.className = 'dd-trustpilot-placeholder-title';
        title.textContent = 'Trustpilot';
        const note = document.createElement('p');
        note.textContent = 'Allow optional content to show the official Trustpilot widget. You can still use the review button.';
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'btn';
        button.textContent = 'Cookie settings';
        button.setAttribute('data-dd-cookie-open', '');
        mount.append(title, note, button);
        continue;
      }
      const frame = document.createElement('iframe');
      frame.title = 'Official Trustpilot Review Collector for Dorset Division';
      frame.width = '100%'; frame.height = '100';
      frame.style.cssText = 'display:block;width:100%;border:0;background:#fff';
      frame.setAttribute('sandbox', 'allow-scripts allow-popups allow-popups-to-escape-sandbox');
      frame.referrerPolicy = 'no-referrer';
      frame.src = '/trustpilot-review-collector.html';
      mount.append(frame);
    }
  }
  window.addEventListener('dd:cookie-consent', update);
  update();
})();
