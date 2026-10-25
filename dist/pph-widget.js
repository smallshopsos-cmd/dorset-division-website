/* Third-party profile stays isolated and unloaded until optional consent. */
(() => {
  const mount = document.getElementById('pph-hireme');
  if (!mount) return;
  function update() {
    const allowed = window.DDCookieConsent?.hasOptionalConsent() === true;
    if (allowed && mount.querySelector('iframe')) return;
    mount.replaceChildren();
    if (!allowed) {
      const note = document.createElement('p');
      note.textContent = 'The optional PeoplePerHour profile is paused. You can still read the reviews and use the source links.';
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'btn';
      button.textContent = 'Cookie Settings';
      button.setAttribute('data-dd-cookie-open', '');
      mount.append(note, button);
      return;
    }
    const frame = document.createElement('iframe');
    frame.title = 'PeoplePerHour profile for Marnie Danson';
    frame.width = '245'; frame.height = '340';
    frame.style.cssText = 'border:0;max-width:100%;background:transparent';
    frame.setAttribute('sandbox', 'allow-scripts allow-popups allow-popups-to-escape-sandbox');
    frame.referrerPolicy = 'no-referrer';
    frame.srcdoc = '<!doctype html><html lang="en"><meta charset="utf-8"><title>PeoplePerHour profile</title><body style="margin:0"><div id="pph-hireme"></div><script src="https://www.peopleperhour.com/hire/350038202/13691287.js?width=245&height=320&orientation=vertical&theme=dark&hourlies=1126840%2C1126988"></script></body></html>';
    mount.append(frame);
  }
  window.addEventListener('dd:cookie-consent', update);
  update();
})();
