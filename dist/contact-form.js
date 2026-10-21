(() => {
  const form = document.querySelector('#contact-form');
  if (!form) return;
  const button = form.querySelector('[type="submit"]');
  const note = form.querySelector('#form-note');
  let direct = false, busy = false, previousPayload = '', requestId = '';
  const configuration = fetch('/api/contact', {cache:'no-store',signal:AbortSignal.timeout(5000)})
    .then(async response => {
      const config = response.ok ? await response.json() : {};
      if (config.enabled === true) {
        direct = true;
        button.textContent = 'Send enquiry ↗';
        note.replaceChildren('Your enquiry is sent using Resend. Please do not include passwords, payment details or sensitive information. ');
        const privacy = document.createElement('a'); privacy.href = '/privacy'; privacy.textContent = 'Privacy policy'; note.append(privacy);
      }
    }).catch(()=>{});
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    busy = true; button.disabled = true; form.setAttribute('aria-busy','true');
    try {
      await configuration;
      const data = new FormData(form);
      if (String(data.get('website') || '')) { note.textContent = 'Unable to submit this enquiry.'; return; }
      if (!direct) {
        const subject = encodeURIComponent('Dorset Division enquiry - '+data.get('project'));
        const body = encodeURIComponent(`Name: ${data.get('name')}\nEmail: ${data.get('email')}\nBusiness: ${data.get('business') || ''}\nProject type: ${data.get('project')}\n\n${data.get('message')}`);
        location.href = `mailto:marnie@dorsetdivision.co.uk?subject=${subject}&body=${body}`;
        note.textContent = 'Your email application should open with your message ready to send. If it does not, email marnie@dorsetdivision.co.uk directly.';
        return;
      }
      const payload = Object.fromEntries(['name','email','business','project','message','website'].map(key=>[key,String(data.get(key) || '')]));
      const encoded = JSON.stringify(payload);
      if (encoded !== previousPayload) { previousPayload = encoded; requestId = crypto.randomUUID(); }
      note.textContent = 'Sending your enquiry…';
      const response = await fetch('/api/contact', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,requestId}),signal:AbortSignal.timeout(16000)});
      const receipt = await response.json().catch(()=>({}));
      if (!response.ok || receipt.ok !== true) throw new Error(receipt.error || 'Sending could not be confirmed. Please email marnie@dorsetdivision.co.uk.');
      form.reset(); previousPayload = ''; requestId = '';
      note.textContent = 'Thank you — your enquiry has been submitted. You can follow up at marnie@dorsetdivision.co.uk.';
    } catch (error) {
      note.textContent = error.name === 'TimeoutError' || error.name === 'TypeError'
        ? 'Sending could not be confirmed. Your message is still here. You can retry or email marnie@dorsetdivision.co.uk.'
        : error.message;
    } finally {
      busy = false; button.disabled = false; form.removeAttribute('aria-busy');
    }
  });
})();
