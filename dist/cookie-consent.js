/* Dorset Division cookie choices. No optional trackers are loaded by this package. */
(()=>{
 const KEY='dd-cookie-consent-v1';
 const get=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}};
 const save=optional=>{try{localStorage.setItem(KEY,JSON.stringify({optional,updated:new Date().toISOString()}))}catch{} window.dispatchEvent(new CustomEvent('dd:cookie-consent',{detail:{optional}}));};
 const banner=document.createElement('section');banner.className='dd-cookie-banner';banner.setAttribute('role','dialog');banner.setAttribute('aria-label','Cookie preferences');banner.innerHTML=`<div class="dd-cookie-copy"><strong>YOUR PRIVACY MATTERS.</strong><p>We use essential storage to remember your cookie choice. Optional analytics or marketing cookies will only be used if you agree, if such tools are added. <a href="cookies.html">Cookie policy</a> · <a href="privacy.html">Privacy policy</a></p><div class="dd-cookie-details" id="dd-cookie-details" hidden><p><b>Essential:</b> always active for necessary site functions and remembering your choice.</p><label><input type="checkbox" id="dd-cookie-optional"> Allow optional analytics and marketing cookies</label><p class="dd-cookie-small">No optional tracking is included in these files. If you add analytics or embeds later, they must be configured to wait for consent.</p></div></div><div class="dd-cookie-actions"><button type="button" data-dd-cookie="reject">Reject optional</button><button type="button" data-dd-cookie="settings">Preferences</button><button type="button" data-dd-cookie="accept">Accept optional</button><button type="button" data-dd-cookie="save" hidden>Save choices</button></div>`;
 document.body.appendChild(banner);
 const details=banner.querySelector('#dd-cookie-details'),opt=banner.querySelector('#dd-cookie-optional'),saveBtn=banner.querySelector('[data-dd-cookie="save"]');
 const show=()=>{const current=get();opt.checked=!!current?.optional;banner.hidden=false;};
 const close=()=>{banner.hidden=true;details.hidden=true;saveBtn.hidden=true;};
 const apply=optional=>{save(optional);close();};
 banner.addEventListener('click',e=>{const btn=e.target.closest('[data-dd-cookie]');if(!btn)return;const action=btn.dataset.ddCookie;if(action==='reject')apply(false);if(action==='accept')apply(true);if(action==='settings'){details.hidden=!details.hidden;saveBtn.hidden=details.hidden;}if(action==='save')apply(opt.checked);});
 document.addEventListener('click',e=>{if(e.target.closest('[data-dd-cookie-open]')){e.preventDefault();show();banner.querySelector('[data-dd-cookie="reject"]').focus();}});
 if(!get())show();else close();
 window.DDCookieConsent={hasOptionalConsent:()=>get()?.optional===true,open:show};
})();
