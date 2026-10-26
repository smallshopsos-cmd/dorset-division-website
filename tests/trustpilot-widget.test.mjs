import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../dist/trustpilot-widget.js',import.meta.url),'utf8');
function setup(initial){
 let consent=initial;
 const listeners={};
 const element=tag=>({tag,children:[],attributes:{},style:{},setAttribute(key,value){this.attributes[key]=value;},append(...children){this.children.push(...children);},replaceChildren(...children){this.children=children;},querySelector(tag){return this.children.find(child=>child.tag===tag);}});
 const mount=element('div');
 const window={DDCookieConsent:{hasOptionalConsent:()=>consent},addEventListener:(name,fn)=>listeners[name]=fn};
 vm.runInNewContext(source,{window,document:{querySelectorAll:()=>[mount],createElement:element}});
 return {mount,choose(value){consent=value;listeners['dd:cookie-consent']();}};
}
test('Trustpilot makes no widget request before optional consent',()=>{
 for(const initial of [undefined,false]){
  const {mount}=setup(initial);
  assert.equal(mount.querySelector('iframe'),undefined);
  assert.ok(mount.querySelector('button').attributes['data-dd-cookie-open']!==undefined);
 }
});
test('Trustpilot consent loads one isolated official collector and withdrawal removes it',()=>{
 const p=setup(false);p.choose(true);const frame=p.mount.querySelector('iframe');
 assert.equal(frame.src,'/trustpilot-review-collector.html');
 assert.ok(frame.attributes.sandbox.includes('allow-scripts'));
 assert.ok(!frame.attributes.sandbox.includes('allow-same-origin'));
 assert.equal(frame.referrerPolicy,'no-referrer');
 p.choose(true);assert.equal(p.mount.querySelector('iframe'),frame);
 p.choose(false);assert.equal(p.mount.querySelector('iframe'),undefined);
});
test('collector uses the account-supplied IDs and official HTTPS bootstrap',async()=>{
 const html=await readFile(new URL('../dist/trustpilot-review-collector.html',import.meta.url),'utf8');
 assert.ok(html.includes('data-template-id="56278e9abfbbba0bdcd568bc"'));
 assert.ok(html.includes('data-businessunit-id="6ade65254716e8a5ad9ea275"'));
 assert.ok(html.includes('https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js'));
 assert.ok(html.includes('content="noindex,nofollow"'));
});
