import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import analytics from '../integrations/analytics/cloudflare-worker.mjs';

const valid={event:'enquiry_submitted',page:'/contact',landing:'/business-strategy-research',service:'/business-strategy-research',source:'google',consent:true};
const req=(data,origin='https://dorsetdivision.co.uk')=>new Request('https://dorsetdivision.co.uk/api/analytics',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1'},body:JSON.stringify(data)});
function env(){const batches=[];return {batches,CONTACT_RATE_LIMITER:{limit:async()=>({success:true})},REVIEWS_DB:{prepare(sql){return {sql,bind(...values){return {...this,values};}};},async batch(values){batches.push(values);}}};}
test('only allowlisted, consented categories reach aggregate storage',async()=>{
 const e=env();assert.equal((await analytics.fetch(req(valid),e)).status,204);
 const values=e.batches[0][0].values;assert.deepEqual(values.slice(1),['enquiry_submitted','/contact','/business-strategy-research','/business-strategy-research','google']);
 assert.ok(!JSON.stringify(e.batches).includes('192.0.2.1'));
 assert.ok(e.batches[0][1].sql.includes('-90 days'));
});
test('refuses personal fields, arbitrary URL categories, absent consent and foreign origin',async()=>{
 for(const data of [{...valid,email:'private@example.com'},{...valid,page:'/contact?email=private'},{...valid,consent:false},{...valid,source:'https://example.com/private'}]){
  const e=env();assert.equal((await analytics.fetch(req(data),e)).status,400);assert.equal(e.batches.length,0);
 }
 const e=env();assert.equal((await analytics.fetch(req(valid,'https://example.com'),e)).status,403);assert.equal(e.batches.length,0);
});
test('storage and rate limit failures do not pretend to collect an event',async()=>{
 const e=env();e.CONTACT_RATE_LIMITER.limit=async()=>({success:false});assert.equal((await analytics.fetch(req(valid),e)).status,429);assert.equal(e.batches.length,0);
 assert.equal((await analytics.fetch(req(valid),{})).status,503);
});
const source=await readFile(new URL('../dist/enquiry-analytics.js',import.meta.url),'utf8');
test('no measurement or attribution storage before consent; withdrawal stops it',()=>{
 let allowed=false;const sent=[],stored=new Map(),events={},docEvents={};
 const context={window:{DDCookieConsent:{hasAnalyticsConsent:()=>allowed},addEventListener:(name,fn)=>events[name]=fn},document:{referrer:'https://www.google.co.uk/search?q=private',querySelector:()=>null,addEventListener:(name,fn)=>docEvents[name]=fn},location:{pathname:'/business-strategy-research',search:'',origin:'https://dorsetdivision.co.uk'},sessionStorage:{getItem:k=>stored.get(k),setItem:(k,v)=>stored.set(k,v),removeItem:k=>stored.delete(k)},URL,URLSearchParams,fetch:(_u,options)=>{sent.push(JSON.parse(options.body));return Promise.resolve();}};
 vm.runInNewContext(source,context);assert.equal(sent.length,0);assert.equal(stored.size,0);
 allowed=true;events['dd:cookie-consent']();assert.equal(sent[0].source,'google');assert.equal(sent[0].landing,'/business-strategy-research');assert.equal(sent[0].service,'/business-strategy-research');
 context.location.pathname='/contact';docEvents['dd:enquiry-submitted']();assert.equal(sent[1].event,'enquiry_submitted');assert.equal(sent[1].service,'/business-strategy-research');
 assert.ok(!JSON.stringify(sent).includes('private'));
 allowed=false;events['dd:cookie-consent']();docEvents['dd:enquiry-submitted']();assert.equal(sent.length,2);assert.equal(stored.size,0);
});
