// Private Resend credentials belong in Cloudflare secrets, never in public assets.
const RECIPIENT = 'dorsetdivision@gmail.com';
const SENDER = 'Dorset Division <website@forms.dorsetdivision.co.uk>';
const PROJECTS = new Set(['A new project', 'An existing business', 'Advice or research', 'Something else']);
const EMAIL = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const unavailable = 'Direct sending is unavailable. Please email marnie@dorsetdivision.co.uk.';
function response(data, status = 200, extra = {}) {
  return Response.json(data, {status, headers: {'Cache-Control':'no-store', ...extra}});
}
function ready(env) {
  return env.CONTACT_DELIVERY_ENABLED === 'true' && Boolean(env.RESEND_API_KEY) && typeof env.CONTACT_RATE_LIMITER?.limit === 'function';
}
async function readJSON(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('invalid');
  const chunks = []; let size = 0;
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 40000) { await reader.cancel(); throw new Error('oversize'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
}
export default {
  async fetch(request, env) {
    if (request.method === 'GET') return response({enabled:ready(env)});
    if (request.method !== 'POST') return response({error:'Method not allowed'},405,{'Allow':'GET, POST'});
    const origin = request.headers.get('Origin');
    if (origin !== 'https://dorsetdivision.co.uk' || new URL(request.url).origin !== origin) return response({error:'Origin not allowed'},403);
    if (!ready(env)) return response({error:unavailable},503);
    if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json') return response({error:'JSON required'},415);
    let data;
    try { data = await readJSON(request); }
    catch (error) { return response({error:'Invalid enquiry'},error.message === 'oversize' ? 413 : 400); }
    if (!data || typeof data !== 'object' || Array.isArray(data)) return response({error:'Invalid enquiry'},400);
    // Reject automated submissions without claiming they were delivered.
    if (typeof data.website !== 'string' || data.website !== '') return response({error:'Unable to submit this enquiry'},400);
    const limits = {name:120,email:254,business:160,project:80,message:8000};
    const fields = {};
    for (const [key,max] of Object.entries(limits)) {
      if (typeof data[key] !== 'string' || data[key].length > max) return response({error:'Please check your enquiry fields'},400);
      fields[key] = data[key].trim();
    }
    if (!fields.name || !fields.message || !EMAIL.test(fields.email) || /[\r\n]/.test(fields.email) || !PROJECTS.has(fields.project) || typeof data.requestId !== 'string' || !UUID.test(data.requestId)) return response({error:'Please check your enquiry fields'},400);
    const ip = request.headers.get('CF-Connecting-IP');
    if (!ip) return response({error:unavailable},503);
    try {
      const {success} = await env.CONTACT_RATE_LIMITER.limit({key:`contact:${ip}`});
      if (!success) return response({error:'Too many attempts. Please wait a minute before trying again.'},429,{'Retry-After':'60'});
      const text = `New Dorset Division website enquiry\n\nName: ${fields.name}\nEmail: ${fields.email}\nBusiness: ${fields.business || '(not supplied)'}\nProject type: ${fields.project}\n\n${fields.message}`;
      const result = await fetch('https://api.resend.com/emails', {
        method:'POST',
        headers:{'Authorization':`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`dd-enquiry/${data.requestId}`},
        body:JSON.stringify({from:SENDER,to:[RECIPIENT],reply_to:fields.email,subject:`Dorset Division enquiry — ${fields.project}`,text}),
        signal:AbortSignal.timeout(12000)
      });
      const receipt = await result.json().catch(()=>null);
      if (!result.ok || typeof receipt?.id !== 'string' || !receipt.id) {
        console.error('Contact delivery rejected', {status:result.status});
        return response({error:unavailable},502);
      }
      // Only provider IDs and statuses are logged, never message contents or keys.
      console.log('Contact enquiry accepted', {id:receipt.id,status:result.status});
      return response({ok:true});
    } catch {
      console.error('Contact delivery unavailable');
      return response({error:unavailable},502);
    }
  }
};
