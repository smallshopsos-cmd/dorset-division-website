/* Optional aggregate measurement. No enquiry fields or visitor IDs are collected. */
(()=>{
 const SOURCE_KEY='dd-analytics-source';
 const pages=new Set(['/','/about','/approach','/contact','/work','/reviews','/business-strategy-research','/website-design-development','/ecommerce-shopify-support','/branding-logo-design','/book-formatting-publishing']);
 const sources=['google','bing','facebook','instagram','linkedin','tiktok','peopleperhour'];
 let enabled=false,viewSent=false,formStarted=false;
 const bucket=value=>{const v=String(value||'').toLowerCase();return sources.find(s=>v===s||v.endsWith('.'+s+'.com')||v===s+'.com')||({fb:'facebook',ig:'instagram',li:'linkedin',tt:'tiktok',pph:'peopleperhour'}[v])||'other';};
 const path=()=>{const v=location.pathname.replace(/\.html$/,'').replace(/\/$/,'')||'/';return pages.has(v)?v:'/other';};
 const services=new Set(['/business-strategy-research','/website-design-development','/ecommerce-shopify-support','/branding-logo-design','/book-formatting-publishing']);
 function attribution(){
  let data;
  try{data=JSON.parse(sessionStorage.getItem(SOURCE_KEY)||'null');}catch{}
  if(!data||![...sources,'direct','other'].includes(data.source)||!pages.has(data.landing)&&data.landing!=='/other'){
   let ref=null;try{ref=document.referrer?new URL(document.referrer):null;}catch{}
   const q=new URLSearchParams(location.search).get('utm_source');
   const host=ref?.hostname.replace(/^www\./,'')||'';
   data={source:q?bucket(q):(!ref||ref.origin===location.origin?'direct':(/(^|\.)google\.[a-z.]+$/.test(host)?'google':bucket(host))),landing:path(),service:'none'};
  }
  if(services.has(path()))data.service=path();
  if(!services.has(data.service))data.service='none';
  try{sessionStorage.setItem(SOURCE_KEY,JSON.stringify(data));}catch{}
  return data;
 }
 function record(event){
  if(!enabled)return;
    fetch('/api/analytics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event,page:path(),...attribution(),consent:true}),keepalive:true,credentials:'omit',referrerPolicy:'no-referrer'}).catch(()=>{});
 }
 function apply(){
  enabled=window.DDCookieConsent?.hasAnalyticsConsent()===true;
  if(enabled&&!viewSent){viewSent=true;record('page_view');}
  if(!enabled){try{sessionStorage.removeItem(SOURCE_KEY);}catch{}}
 }
 window.addEventListener('dd:cookie-consent',apply);
 apply();
 const form=document.querySelector('#contact-form');
 form?.addEventListener('input',()=>{if(enabled&&!formStarted){formStarted=true;record('form_start');}});
 document.addEventListener('dd:enquiry-submitted',()=>record('enquiry_submitted'));
 document.addEventListener('click',event=>{
  const a=event.target.closest('a[href]');if(!a)return;
  const h=a.getAttribute('href');
  if(h.startsWith('mailto:'))record('email_click');
  else if(h.startsWith('tel:'))record('phone_click');
  else{try{if(new URL(a.href).hostname==='cal.com')record('booking_click');}catch{}}
 });
})();
