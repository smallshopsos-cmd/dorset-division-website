/* Dorset Division cookie choices; optional profile content waits for permission. */
(()=>{
 const KEY='dd-cookie-consent-v3';
 const get=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}};
 const save=(optional,analytics)=>{try{localStorage.setItem(KEY,JSON.stringify({optional,analytics,updated:new Date().toISOString()}))}catch{} window.dispatchEvent(new CustomEvent('dd:cookie-consent',{detail:{optional,analytics}}));};
 const banner=document.createElement('section');banner.className='dd-cookie-banner';banner.setAttribute('role','region');banner.setAttribute('aria-label','Cookie preferences');banner.innerHTML=`<div class="dd-cookie-copy"><strong>YOUR PRIVACY MATTERS.</strong><p>Essential storage remembers your choice. Optional review widgets and usage measurement run only with your permission. <a href="cookies.html">Cookie policy</a> · <a href="privacy.html">Privacy policy</a></p><div class="dd-cookie-details" id="dd-cookie-details" hidden><p><b>Essential:</b> always active for necessary site functions and remembering your choice.</p><label><input type="checkbox" id="dd-cookie-optional"> Allow optional third-party profile and review widgets</label><label><input type="checkbox" id="dd-cookie-analytics"> Allow optional usage measurement</label><p class="dd-cookie-small">Usage measurement counts pages, enquiry steps and contact clicks by broad traffic source. It does not collect enquiry contents or create a visitor ID. Temporary source, landing-page and service categories are remembered for this browser tab. Counts are retained for up to 90 days. You can switch it off here at any time.</p><p class="dd-cookie-small">Optional: the PeoplePerHour and Trustpilot widgets may use third-party storage and receive technical request information when loaded. No advertising pixels are used.</p></div></div><div class="dd-cookie-actions"><button type="button" data-dd-cookie="reject">Reject optional</button><button type="button" data-dd-cookie="settings">Preferences</button><button type="button" data-dd-cookie="accept">Accept optional</button><button type="button" data-dd-cookie="save" hidden>Save choices</button></div>`;
 document.body.appendChild(banner);
 // Keep withdrawal available on older page footers as well as the homepage.
 if(!document.querySelector('[data-dd-cookie-open]')){
  const footer=document.querySelector('body > footer .dd-footer-wrap');
  if(footer){const settings=document.createElement('button');settings.type='button';settings.className='dd-cookie-footer-link';settings.setAttribute('data-dd-cookie-open','');settings.textContent='Cookie Settings';footer.appendChild(settings);}
 }
 const updateClearance=()=>{document.documentElement.style.setProperty('--dd-cookie-offset',banner.hidden?'0px':`${Math.ceil(banner.getBoundingClientRect().height)+36}px`);document.documentElement.classList.toggle('dd-cookie-open',!banner.hidden);};
 if('ResizeObserver' in window)new ResizeObserver(updateClearance).observe(banner);
 else window.addEventListener('resize',updateClearance);
 let opener=null;
 const details=banner.querySelector('#dd-cookie-details'),opt=banner.querySelector('#dd-cookie-optional'),analyticsOpt=banner.querySelector('#dd-cookie-analytics'),saveBtn=banner.querySelector('[data-dd-cookie="save"]');
 const show=(focus=false)=>{const current=get();opt.checked=!!current?.optional;analyticsOpt.checked=!!current?.analytics;banner.hidden=false;updateClearance();if(focus){opener=document.activeElement;banner.querySelector('[data-dd-cookie="reject"]').focus();}};
 const close=()=>{banner.hidden=true;details.hidden=true;saveBtn.hidden=true;updateClearance();};
 const apply=(optional,analytics)=>{save(optional,analytics);close();if(opener?.isConnected)opener.focus();opener=null;};
 banner.addEventListener('click',e=>{const btn=e.target.closest('[data-dd-cookie]');if(!btn)return;const action=btn.dataset.ddCookie;if(action==='reject')apply(false,false);if(action==='accept')apply(true,true);if(action==='settings'){details.hidden=!details.hidden;saveBtn.hidden=details.hidden;updateClearance();}if(action==='save')apply(opt.checked,analyticsOpt.checked);});
 document.addEventListener('click',e=>{if(e.target.closest('[data-dd-cookie-open]')){e.preventDefault();show(true);}});
 if(!get())show();else close();
 window.DDCookieConsent={hasOptionalConsent:()=>get()?.optional===true,hasAnalyticsConsent:()=>get()?.analytics===true,open:()=>show(true)};
})();
