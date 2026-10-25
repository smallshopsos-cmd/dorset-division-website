import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../dist/pph-widget.js',import.meta.url),'utf8');
function setup(initial){
 let consent=initial;
 const listeners={};
 const element=tag=>({tag,children:[],attributes:{},style:{},setAttribute(key,value){this.attributes[key]=value;},append(...children){this.children.push(...children);},replaceChildren(...children){this.children=children;},querySelector(tag){return this.children.find(child=>child.tag===tag);}});
 const mount=element('div');
 const window={DDCookieConsent:{hasOptionalConsent:()=>consent},addEventListener:(name,fn)=>listeners[name]=fn};
 vm.runInNewContext(source,{window,document:{getElementById:()=>mount,createElement:element}});
 return {mount,choose(value){consent=value;listeners['dd:cookie-consent']();}};
}
test('first visit and rejected optional consent never create a network-capable iframe',()=>{
 for(const initial of [undefined,false]){
  const {mount}=setup(initial);
  assert.equal(mount.querySelector('iframe'),undefined);
  assert.ok(mount.querySelector('button').attributes['data-dd-cookie-open']!==undefined);
 }
});
test('consent loads exactly one isolated profile; withdrawal destroys it',()=>{
 const p=setup(false);p.choose(true);
 const frame=p.mount.querySelector('iframe');
 assert.ok(frame.srcdoc.includes('https://www.peopleperhour.com/hire/'));
 assert.ok(frame.attributes.sandbox.includes('allow-scripts'));
 assert.ok(!frame.attributes.sandbox.includes('allow-same-origin'));
 assert.equal(frame.referrerPolicy,'no-referrer');
 p.choose(true);assert.equal(p.mount.querySelector('iframe'),frame);
 p.choose(false);assert.equal(p.mount.querySelector('iframe'),undefined);
 p.choose(true);assert.notEqual(p.mount.querySelector('iframe'),frame);
});
test('previously granted current-version consent loads the profile',()=>{
 assert.ok(setup(true).mount.querySelector('iframe'));
});
