import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../dist/trustpilot-widget.js',import.meta.url),'utf8');
function setup(initial){
 let consent=initial;
 const listeners=new Map();
 const element=tag=>({tag,children:[],attributes:{},style:{},events:{},sent:[],setAttribute(key,value){this.attributes[key]=value;},append(...children){this.children.push(...children);},replaceChildren(...children){this.children=children;},querySelector(tag){return this.children.find(child=>child.tag===tag);},addEventListener(name,fn){this.events[name]=fn;}});
 const mount=element('div');
 const document={querySelectorAll:()=>[mount],createElement(tag){const el=element(tag);if(tag==='iframe')el.contentWindow={postMessage:(data,origin)=>el.sent.push({data:JSON.parse(data),origin})};return el;}};
 const window={DDCookieConsent:{hasOptionalConsent:()=>consent},addEventListener(name,fn){if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(fn);},removeEventListener(name,fn){listeners.get(name)?.delete(fn);}};
 vm.runInNewContext(source,{window,document});
 const dispatch=(name,event)=>{for(const fn of listeners.get(name)||[])fn(event);};
 return {mount,listeners,choose(value){consent=value;dispatch('dd:cookie-consent');},dispatch};
}
test('Trustpilot makes no widget request before optional consent',()=>{
 for(const initial of [undefined,false]){
  const {mount}=setup(initial);
  assert.equal(mount.querySelector('iframe'),undefined);
  assert.ok(mount.querySelector('button').attributes['data-dd-cookie-open']!==undefined);
 }
});
test('consent loads one Trustpilot-origin frame; withdrawal removes frame and handler',()=>{
 const p=setup(false);p.choose(true);const frame=p.mount.querySelector('iframe');
 assert.equal(new URL(frame.src).origin,'https://widget.trustpilot.com');
 assert.ok(frame.attributes.sandbox.includes('allow-scripts'));
 assert.ok(frame.attributes.sandbox.includes('allow-same-origin'));
 assert.equal(frame.referrerPolicy,'no-referrer');
 p.choose(true);assert.equal(p.mount.querySelector('iframe'),frame);
 assert.equal(p.listeners.get('message').size,1);
 p.choose(false);assert.equal(p.mount.querySelector('iframe'),undefined);
 assert.equal(p.listeners.get('message').size,0);
});
test('collector uses the account-supplied IDs and public profile links',async()=>{
 const frame=setup(true).mount.querySelector('iframe');const url=new URL(frame.src);
 assert.equal(url.searchParams.get('templateId'),'56278e9abfbbba0bdcd568bc');
 assert.equal(url.searchParams.get('businessunitId'),'6ade65254716e8a5ad9ea275');
 for(const name of ['index','reviews']){
  const html=await readFile(new URL('../dist/'+name+'.html',import.meta.url),'utf8');
  assert.ok(html.includes('href="https://uk.trustpilot.com/review/dorsetdivision.co.uk"'));
  assert.ok(html.includes('View our Trustpilot profile ↗'));
 }
});
test('official handshake responds only to this frame and the trusted widget origin',()=>{
 const p=setup(true);const frame=p.mount.querySelector('iframe');frame.events.load();
 assert.equal(frame.sent[0].data.command,'setId');
 assert.equal(frame.sent[0].origin,'https://widget.trustpilot.com');
 const widgetId=frame.sent[0].data.widgetId;
 const event={origin:'https://widget.trustpilot.com',source:frame.contentWindow,data:JSON.stringify({command:'ping',widgetId})};
 p.dispatch('message',{...event,origin:'https://untrusted.example'});
 p.dispatch('message',{...event,source:{}});
 p.dispatch('message',{...event,data:'bad JSON'});
 p.dispatch('message',{...event,data:JSON.stringify({command:'ping',widgetId:'wrong'})});
 assert.equal(frame.sent.length,1);
 p.dispatch('message',event);assert.equal(frame.sent[1].data.command,'pong');
 p.dispatch('message',{...event,data:JSON.stringify({command:'resize-height',widgetId,height:5000})});
 assert.equal(frame.height,'180');
});
