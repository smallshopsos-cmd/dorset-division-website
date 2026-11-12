const EVENTS=new Set(['page_view','form_start','enquiry_submitted','booking_click','email_click','phone_click']);
const PAGES=new Set(['/','/about','/approach','/contact','/work','/reviews','/business-strategy-research','/website-design-development','/ecommerce-shopify-support','/branding-logo-design','/book-formatting-publishing','/other']);
const SOURCES=new Set(['direct','google','bing','facebook','instagram','linkedin','tiktok','peopleperhour','other','test']);
export default {async fetch(request,env){
 const reply=(status)=>new Response(null,{status,headers:{'Cache-Control':'no-store'}});
 if(request.method!=='POST')return reply(405);
 if(request.headers.get('Origin')!=='https://dorsetdivision.co.uk'||new URL(request.url).origin!=='https://dorsetdivision.co.uk')return reply(403);
 if(request.headers.get('Content-Type')?.split(';')[0].trim()!=='application/json')return reply(415);
 let data;
 try{
  const reader=request.body?.getReader();if(!reader)return reply(400);
  let text='',size=0;const decoder=new TextDecoder();
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>512){await reader.cancel();return reply(413);}text+=decoder.decode(value,{stream:true});}
  data=JSON.parse(text+decoder.decode());
 }catch{return reply(400);}
 // Fixed buckets only: never accept messages, contact details, raw URLs or identifiers.
 if(!data||Object.keys(data).some(k=>!['event','page','landing','service','source','consent'].includes(k))||data.consent!==true||!EVENTS.has(data.event)||!PAGES.has(data.page)||!PAGES.has(data.landing)||!new Set(['none',...PAGES]).has(data.service)||!SOURCES.has(data.source))return reply(400);
 if(!env.REVIEWS_DB||!env.CONTACT_RATE_LIMITER)return reply(503);
 const ip=request.headers.get('CF-Connecting-IP');if(!ip)return reply(503);
 try{
  if(!(await env.CONTACT_RATE_LIMITER.limit({key:`analytics:${ip}`})).success)return reply(429);
  const day=new Date().toISOString().slice(0,10);
  await env.REVIEWS_DB.batch([
   env.REVIEWS_DB.prepare('INSERT INTO analytics_daily_counts(day,event,page,landing,service,source,total) VALUES(?,?,?,?,?,?,1) ON CONFLICT(day,event,page,landing,service,source) DO UPDATE SET total=total+1').bind(day,data.event,data.page,data.landing,data.service,data.source),
   env.REVIEWS_DB.prepare("DELETE FROM analytics_daily_counts WHERE day < date('now','-90 days')")
  ]);
  return reply(204);
 }catch{return reply(503);}
}};
