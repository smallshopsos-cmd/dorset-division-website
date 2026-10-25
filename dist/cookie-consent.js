/* Dorset Division cookie choices; optional profile content waits for permission. */
(()=>{
 const KEY='dd-cookie-consent-v2';
 const get=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}};
 const save=optional=>{try{localStorage.setItem(KEY,JSON.stringify({optional,updated:new Date().toISOString()}))}catch{} window.dispatchEvent(new CustomEvent('dd:cookie-consent',{detail:{optional}}));};
 const banner=document.createElement('section');banner.className='dd-cookie-banner';banner.setAttribute('role','region');banner.setAttribute('aria-label','Cookie preferences');banner.innerHTML=`<div class="dd-cookie-copy"><strong>YOUR PRIVACY MATTERS.</strong><p>We use essential storage to remember your cookie choice. The optional PeoplePerHour profile on the Reviews page connects to a third party and loads only if you allow it. <a href="cookies.html">Cookie policy</a> · <a href="privacy.html">Privacy policy</a></p><div class="dd-cookie-details" id="dd-cookie-details" hidden><p><b>Essential:</b> always active for necessary site functions and remembering your choice.</p><label><input type="checkbox" id="dd-cookie-optional"> Allow optional third-party profile content</label><p class="dd-cookie-small">Optional: the PeoplePerHour profile widget may use third-party storage and receives technical request information when loaded. The site does not include analytics or advertising pixels.</p></div></div><div class="dd-cookie-actions"><button type="button" data-dd-cookie="reject">Reject optional</button><button type="button" data-dd-cookie="settings">Preferences</button><button type="button" data-dd-cookie="accept">Accept optional</button><button type="button" data-dd-cookie="save" hidden>Save choices</button></div>`;
 document.body.appendChild(banner);
 const updateClearance=()=>document.documentElement.style.setProperty('--dd-cookie-offset',banner.hidden?'0px':`${Math.ceil(banner.getBoundingClientRect().height)+36}px`);
 if('ResizeObserver' in window)new ResizeObserver(updateClearance).observe(banner);
 else window.addEventListener('resize',updateClearance);
 let opener=null;
 const details=banner.querySelector('#dd-cookie-details'),opt=banner.querySelector('#dd-cookie-optional'),saveBtn=banner.querySelector('[data-dd-cookie="save"]');
 const show=(focus=false)=>{const current=get();opt.checked=!!current?.optional;banner.hidden=false;updateClearance();if(focus){opener=document.activeElement;banner.querySelector('[data-dd-cookie="reject"]').focus();}};
 const close=()=>{banner.hidden=true;details.hidden=true;saveBtn.hidden=true;updateClearance();};
 const apply=optional=>{save(optional);close();if(opener?.isConnected)opener.focus();opener=null;};
 banner.addEventListener('click',e=>{const btn=e.target.closest('[data-dd-cookie]');if(!btn)return;const action=btn.dataset.ddCookie;if(action==='reject')apply(false);if(action==='accept')apply(true);if(action==='settings'){details.hidden=!details.hidden;saveBtn.hidden=details.hidden;updateClearance();}if(action==='save')apply(opt.checked);});
 document.addEventListener('click',e=>{if(e.target.closest('[data-dd-cookie-open]')){e.preventDefault();show(true);}});
 if(!get())show();else close();
 window.DDCookieConsent={hasOptionalConsent:()=>get()?.optional===true,open:()=>show(true)};
})();
