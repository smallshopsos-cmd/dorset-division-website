import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../dist/contact-form.js',import.meta.url),'utf8');
function page(enabled,send){
  const fields={name:'Setup test',email:'test@example.com',business:'',project:'A new project',message:'Keep this enquiry',website:''};
  const button={disabled:false,textContent:'Prepare email ↗'};
  const note={textContent:'Email app notice',replaceChildren(text){this.textContent=text;},append(){}};
  let handler,reset=false;
  const form={querySelector:s=>s==='#form-note'?note:button,addEventListener:(_,fn)=>handler=fn,reportValidity:()=>true,setAttribute(){},removeAttribute(){},reset(){reset=true;}};
  const location={href:''};const requests=[];
  const context={document:{querySelector:()=>form,createElement:()=>({})},FormData:class{get(key){return fields[key];}},location,AbortSignal,crypto:{randomUUID:()=> '2bb8cf13-68fb-4f34-80aa-d4e275fa08bd'},fetch:async(url,options)=>{
    if(!options?.method)return {ok:true,json:async()=>({enabled})};
    requests.push(JSON.parse(options.body));return send(url,options);
  }};
  vm.runInNewContext(source,context);
  return {button,note,location,requests,fields,submitted:()=>handler({preventDefault(){}}),reset:()=>reset};
}
test('unconfigured service preserves the email-app fallback',async()=>{
  const p=page(false,()=>{throw Error('Should not send');});await p.submitted();
  assert.ok(p.location.href.startsWith('mailto:marnie@dorsetdivision.co.uk?subject='));
  assert.ok(decodeURIComponent(p.location.href).includes('Keep this enquiry'));
  assert.equal(p.requests.length,0);assert.equal(p.reset(),false);assert.equal(p.button.disabled,false);
});
test('configured service resets the form only after an accepted response',async()=>{
  const p=page(true,async()=>({ok:true,json:async()=>({ok:true})}));await p.submitted();
  assert.equal(p.button.textContent,'Send enquiry ↗');assert.equal(p.reset(),true);
  assert.equal(p.requests[0].message,'Keep this enquiry');assert.ok(p.note.textContent.includes('submitted'));
});
test('provider errors keep the message and never show a success',async()=>{
  const p=page(true,async()=>({ok:false,json:async()=>({error:'Direct sending is unavailable.'})}));await p.submitted();
  assert.equal(p.reset(),false);assert.equal(p.fields.message,'Keep this enquiry');
  assert.equal(p.note.textContent,'Direct sending is unavailable.');assert.equal(p.button.disabled,false);
});
test('retry after uncertain delivery keeps the same idempotency key',async()=>{
  const p=page(true,async()=>{throw new TypeError('Network lost');});
  await p.submitted();await p.submitted();
  assert.equal(p.requests.length,2);assert.equal(p.requests[0].requestId,p.requests[1].requestId);
  assert.equal(p.reset(),false);assert.ok(p.note.textContent.includes('could not be confirmed'));
});
