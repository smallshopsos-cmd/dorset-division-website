/* Burt - Dorset Division. Vanilla JS; no external libraries. */
(function () {
  'use strict';
  if (document.getElementById('dd-burt-root')) return;
  const cfg = Object.assign({endpoint:'',bookingUrl:'/book/',contactUrl:'/contact/',siteContext:''},window.DORSET_BURT_CONFIG||{});
  const svg = `<svg class="dd-burt-avatar" viewBox="0 0 180 190" width="92" height="98" role="img" aria-label="Burt, a midnight navy and gold robot" xmlns="http://www.w3.org/2000/svg"><defs>
  <linearGradient id="burt-shell" x1=".1" y1="0" x2=".9" y2="1"><stop stop-color="#67829a"/><stop offset=".17" stop-color="#273e58"/><stop offset=".52" stop-color="#101e31"/><stop offset=".83" stop-color="#081321"/><stop offset="1" stop-color="#3b5165"/></linearGradient>
  <linearGradient id="burt-gold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff3bc"/><stop offset=".22" stop-color="#c7953d"/><stop offset=".55" stop-color="#ffdc85"/><stop offset=".8" stop-color="#8b622b"/><stop offset="1" stop-color="#edcb78"/></linearGradient>
  <radialGradient id="burt-eye-light"><stop stop-color="#fffbe0"/><stop offset=".32" stop-color="#ffe9a0"/><stop offset=".7" stop-color="#efb84e"/><stop offset="1" stop-color="#a86a20"/></radialGradient>
  <linearGradient id="burt-face" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#172e45"/><stop offset=".65" stop-color="#071522"/><stop offset="1" stop-color="#182b3e"/></linearGradient>
  <filter id="burt-glow"><feGaussianBlur stdDeviation="3"/></filter></defs>
  <ellipse cx="90" cy="170" rx="52" ry="10" fill="#d2a65d" opacity=".15"/>
  <path d="M66 20 Q90 6 114 20 L120 31 60 31Z" fill="url(#burt-shell)" stroke="url(#burt-gold)" stroke-width="2"/>
  <path d="M48 29 Q90 8 132 29 Q157 43 158 83 L154 128 Q144 158 90 171 Q36 158 26 128 L22 83 Q23 43 48 29Z" fill="url(#burt-shell)" stroke="url(#burt-gold)" stroke-width="3"/>
  <path d="M49 42 Q90 24 131 42 Q144 54 145 83 L141 124 Q131 144 90 155 Q49 144 39 124 L35 83 Q36 54 49 42Z" fill="url(#burt-face)" stroke="#927344" stroke-width="1.5"/>
  <path d="M44 64 Q90 35 136 64" fill="none" stroke="#e4c781" stroke-width="2" opacity=".7"/>
  <path d="M34 75 L19 80 19 113 34 118Z" fill="url(#burt-shell)" stroke="url(#burt-gold)" stroke-width="2"/>
  <path d="M146 75 L161 80 161 113 146 118Z" fill="url(#burt-shell)" stroke="url(#burt-gold)" stroke-width="2"/>
  <circle cx="19" cy="96" r="5" fill="#e7bc67"/><circle cx="161" cy="96" r="5" fill="#e7bc67"/>
  <g class="dd-burt-eyes"><path d="M48 86 Q64 72 81 86 Q68 101 48 91Z" fill="#050c16" stroke="#e8bf6e" stroke-width="2"/><path d="M99 86 Q116 72 132 86 L132 91 Q112 101 99 86Z" fill="#050c16" stroke="#e8bf6e" stroke-width="2"/>
  <ellipse cx="66" cy="87" rx="9" ry="6" fill="#dba74d" opacity=".7" filter="url(#burt-glow)"/><ellipse cx="114" cy="87" rx="9" ry="6" fill="#dba74d" opacity=".7" filter="url(#burt-glow)"/>
  <ellipse class="dd-burt-eye" cx="66" cy="87" rx="9" ry="6" fill="url(#burt-eye-light)"/><ellipse class="dd-burt-eye" cx="114" cy="87" rx="9" ry="6" fill="url(#burt-eye-light)"/></g>
  <path d="M82 105 Q90 109 98 105" stroke="#bd9656" stroke-width="2" fill="none" opacity=".6"/>
  <path class="dd-burt-mouth" d="M65 125 Q90 139 115 125" fill="none" stroke="#f5cf7b" stroke-width="4" stroke-linecap="round"/>
  <path d="M59 144 Q90 159 121 144" fill="none" stroke="#b88b4a" stroke-width="1.4" opacity=".7"/>
  <path d="M40 55 Q47 40 63 36" stroke="#fff0c0" stroke-width="2.5" stroke-linecap="round" opacity=".55" fill="none"/>
  <circle cx="90" cy="24" r="3.5" fill="#f4d389"/></svg>`;
  const root=document.createElement('div');root.id='dd-burt-root';root.innerHTML=`<section id="dd-burt-panel" role="dialog" aria-label="Chat with Burt" hidden><header id="dd-burt-header">${svg}<div><strong>Burt</strong><small>Dorset Division digital assistant</small></div><button type="button" id="dd-burt-close" aria-label="Close chat">×</button></header><div id="dd-burt-messages" role="log" aria-live="polite" aria-relevant="additions"></div><div id="dd-burt-status" aria-live="polite"></div><p style="margin:0;padding:4px 15px 8px;font-size:12px;line-height:1.5;color:#e4c786">AI replies use Cloudflare. Avoid sensitive details. <a href="/privacy" style="text-decoration:underline">Privacy policy</a></p><form id="dd-burt-form"><textarea id="dd-burt-input" rows="1" maxlength="1200" placeholder="Ask Burt a question..." aria-label="Your message" required></textarea><button id="dd-burt-send" type="submit">Send</button></form></section><button type="button" id="dd-burt-launch" aria-label="Open Burt chat" aria-expanded="false">${svg.replace(/burt-(shell|gold|eye-light|face|glow)/g,"burt-launch-$1")}<span>Ask Burt</span></button>`;
  document.body.appendChild(root);
  const panel=root.querySelector('#dd-burt-panel'),launch=root.querySelector('#dd-burt-launch'),close=root.querySelector('#dd-burt-close'),log=root.querySelector('#dd-burt-messages'),form=root.querySelector('#dd-burt-form'),input=root.querySelector('#dd-burt-input'),send=root.querySelector('#dd-burt-send'),status=root.querySelector('#dd-burt-status');
  let busy=false;const history=[];
  function state(name){root.classList.remove('dd-burt-thinking','dd-burt-talking','dd-burt-happy');if(name)root.classList.add('dd-burt-'+name)}
  function add(role,message){const el=document.createElement('div');el.className='dd-burt-msg '+role;el.textContent=message;log.appendChild(el);log.scrollTop=log.scrollHeight;return el}
  function handoff(){if(root.querySelector('.dd-burt-handoff'))return;const el=document.createElement('div');el.className='dd-burt-handoff';el.append('Want to speak to Marnie? ');const a=document.createElement('a');a.href=cfg.contactUrl;a.textContent='Contact Dorset Division';el.appendChild(a);log.appendChild(el);log.scrollTop=log.scrollHeight}
  function toggle(open){panel.hidden=!open;launch.setAttribute('aria-expanded',String(open));if(open)input.focus();else launch.focus()}
  launch.addEventListener('click',()=>toggle(panel.hidden));close.addEventListener('click',()=>toggle(false));root.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){e.preventDefault();toggle(false)}});
  add('assistant',"Hello! I'm Burt, Dorset Division's digital assistant. What can I help you with?");
  input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();form.requestSubmit()}});
  form.addEventListener('submit',async e=>{e.preventDefault();if(busy)return;const message=input.value.trim();if(message.length<2)return;add('user',message);input.value='';busy=true;send.disabled=true;state('thinking');status.textContent='Burt is thinking…';
    if(!cfg.endpoint||cfg.endpoint.includes('YOUR-WORKER')){add('assistant','Live chat is not available yet. Please contact Marnie directly using the link below.');handoff();busy=false;send.disabled=false;state('');status.textContent='';return}
    try{const res=await fetch(cfg.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,page:location.pathname,context:cfg.siteContext,history:history.slice(-6)})});const data=await res.json();if(!res.ok)throw new Error(data.error||'Request failed');const answer=String(data.answer||'I cannot answer that just now.');state('talking');add('assistant',answer);history.push({role:'user',content:message},{role:'assistant',content:answer});if(history.length>12)history.splice(0,history.length-12);if(data.handoff)handoff();setTimeout(()=>state('happy'),450);setTimeout(()=>state(''),1300)}catch(err){console.warn('Burt request failed:',err);add('assistant','Sorry, I cannot connect right now. Please contact Marnie directly.');handoff();state('')}finally{busy=false;send.disabled=false;status.textContent='';input.focus()}
  });
})();
