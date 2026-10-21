import {test, afterEach} from 'node:test';
import assert from 'node:assert/strict';
import contact from '../integrations/contact/cloudflare-worker.mjs';
import worker from '../worker.mjs';

const originalFetch = globalThis.fetch;
afterEach(()=>{globalThis.fetch = originalFetch;});
const data = {name:'Setup test',email:'tester@example.com',business:'Test business',project:'A new project',message:'Delivery test only',website:'',requestId:'2bb8cf13-68fb-4f34-80aa-d4e275fa08bd'};
const env = () => ({RESEND_API_KEY:'test-only-not-a-real-key',CONTACT_DELIVERY_ENABLED:'true',CONTACT_RATE_LIMITER:{limit:async()=>({success:true})}});
const request = (body=data, headers={}) => new Request('https://dorsetdivision.co.uk/api/contact',{
  method:'POST',headers:{Origin:'https://dorsetdivision.co.uk','Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1',...headers},body:JSON.stringify(body)
});
test('disabled or incomplete configuration cannot send or expose secrets',async()=>{
  globalThis.fetch=()=>{throw new Error('Must not contact provider');};
  const get=()=>new Request('https://dorsetdivision.co.uk/api/contact');
  assert.deepEqual(await (await contact.fetch(get(),{})).json(),{enabled:false});
  assert.deepEqual(await (await contact.fetch(get(),{...env(),CONTACT_DELIVERY_ENABLED:'false'})).json(),{enabled:false});
  assert.equal((await contact.fetch(request(),{})).status,503);
  assert.deepEqual(await (await contact.fetch(get(),env())).json(),{enabled:true});
});
test('only confirmed provider acceptance succeeds; recipients cannot be overridden',async()=>{
  let captured;
  globalThis.fetch=async(url,options)=>{captured={url,...options};return Response.json({id:'provider-test-id'});};
  const response=await contact.fetch(request({...data,to:'untrusted@example.com',from:'untrusted@example.com'}),env());
  assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true});
  const payload=JSON.parse(captured.body);
  assert.equal(captured.url,'https://api.resend.com/emails');
  assert.deepEqual(payload.to,['dorsetdivision@gmail.com']);
  assert.equal(payload.from,'Dorset Division <website@forms.dorsetdivision.co.uk>');
  assert.equal(payload.reply_to,data.email);assert.ok(payload.text.includes(data.message));
  assert.equal(captured.headers['Idempotency-Key'],'dd-enquiry/'+data.requestId);
});
test('blocks cross-origin, missing origin, non-JSON and unsupported methods',async()=>{
  assert.equal((await contact.fetch(request(data,{Origin:'https://example.com'}),env())).status,403);
  assert.equal((await contact.fetch(request(data,{Origin:''}),env())).status,403);
  assert.equal((await contact.fetch(request(data,{'Content-Type':'text/plain'}),env())).status,415);
  assert.equal((await contact.fetch(new Request('https://dorsetdivision.co.uk/api/contact',{method:'DELETE'}),env())).status,405);
});
test('rejects invalid fields, spam field, oversize bodies and malformed JSON before sending',async()=>{
  globalThis.fetch=()=>{throw new Error('Invalid input must not reach provider');};
  for(const body of [null,[],{...data,website:'spam'},{...data,email:'x\r\nBcc:bad@example.com'},{...data,message:''},{...data,message:'x'.repeat(8001)},{...data,project:'Injected subject'},{...data,requestId:'invalid'}]){
    assert.equal((await contact.fetch(request(body),env())).status,400);
  }
  const raw=body=>new Request('https://dorsetdivision.co.uk/api/contact',{method:'POST',headers:{Origin:'https://dorsetdivision.co.uk','Content-Type':'application/json'},body});
  assert.equal((await contact.fetch(raw('{'),env())).status,400);
  assert.equal((await contact.fetch(raw('x'.repeat(40001)),env())).status,413);
});
test('rate limit fails closed and provider failures never claim success',async()=>{
  let calls=0;globalThis.fetch=async()=>{calls++;return Response.json({message:'Provider rejected'}, {status:422});};
  const limited=env();limited.CONTACT_RATE_LIMITER.limit=async()=>({success:false});
  const response=await contact.fetch(request(),limited);assert.equal(response.status,429);assert.equal(response.headers.get('Retry-After'),'60');assert.equal(calls,0);
  assert.equal((await contact.fetch(request(),env())).status,502);
  globalThis.fetch=async()=>Response.json({});
  assert.equal((await contact.fetch(request(),env())).status,502);
  globalThis.fetch=async()=>{throw new Error('Network failure');};
  assert.equal((await contact.fetch(request(),env())).status,502);
});
test('root Worker keeps static asset routing and contact route separate',async()=>{
  const assets={fetch:async()=>new Response('static asset')};
  assert.equal(await (await worker.fetch(new Request('https://dorsetdivision.co.uk/about'),{ASSETS:assets})).text(),'static asset');
  assert.deepEqual(await (await worker.fetch(new Request('https://dorsetdivision.co.uk/api/contact'),{})).json(),{enabled:false});
  assert.equal((await worker.fetch(new Request('https://dorsetdivision.co.uk/api/unknown'),{})).status,404);
});
