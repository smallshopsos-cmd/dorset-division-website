const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const email=/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
async function verifyAccess(request,env){
 const token=request.headers.get('Cf-Access-Jwt-Assertion');
 if(!token || !env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return false;
 try{
  const [header,payload,signature]=token.split('.');
  const decode=s=>JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0))));
  const h=decode(header),p=decode(payload);
  if(h.alg!=='RS256'||!h.kid||p.aud?.includes(env.ACCESS_AUD)!==true||p.iss!==env.ACCESS_TEAM_DOMAIN.replace(/\/$/,'')||p.exp*1000<Date.now()||p.nbf&&p.nbf*1000>Date.now())return false;
  const keys=await fetch(env.ACCESS_TEAM_DOMAIN.replace(/\/$/,'')+'/cdn-cgi/access/certs').then(r=>r.json());
  const jwk=keys.keys.find(k=>k.kid===h.kid);
  if(!jwk)return false;
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  return await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,Uint8Array.from(atob(signature.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0)),new TextEncoder().encode(header+'.'+payload));
 }catch{return false;}
}
export default {async fetch(request,env){
 if(!env.REVIEWS_DB)return json({error:'Reviews are not yet available.'},503);
 const url=new URL(request.url),admin=url.pathname.startsWith('/api/reviews/admin');
 if(admin){
  if(!await verifyAccess(request,env))return json({error:'Access denied'},403);
  if(request.method==='GET'){
   const status=url.searchParams.get('status')||'pending';
   if(!['pending','approved','rejected'].includes(status))return json({error:'Invalid status'},400);
   const rows=await env.REVIEWS_DB.prepare('SELECT id,name,email,business,rating,review,status,created_at FROM reviews WHERE status=? ORDER BY created_at DESC LIMIT 100').bind(status).all();
   return json({reviews:rows.results});
  }
  if(request.method==='POST'){
   const data=await request.json().catch(()=>null);
   if(!data||!['approved','rejected'].includes(data.status)||typeof data.id!=='string')return json({error:'Invalid action'},400);
   const result=await env.REVIEWS_DB.prepare("UPDATE reviews SET status=?,reviewed_at=datetime('now') WHERE id=? AND status='pending'").bind(data.status,data.id).run();
   return json({ok:result.meta.changes===1});
  }
  return json({error:'Method not allowed'},405);
 }
 if(request.method==='GET'){
  const rows=await env.REVIEWS_DB.prepare("SELECT id,name,business,rating,review,created_at FROM reviews WHERE status='approved' ORDER BY reviewed_at DESC LIMIT 50").all();
  return json({reviews:rows.results});
 }
 if(request.method!=='POST')return json({error:'Method not allowed'},405);
 if(request.headers.get('Origin')!==url.origin)return json({error:'Invalid origin'},403);
 if(request.headers.get('Content-Type')?.split(';')[0]!=='application/json')return json({error:'JSON required'},415);
 const ip=request.headers.get('CF-Connecting-IP');
 if(!ip||typeof env.CONTACT_RATE_LIMITER?.limit!=='function')return json({error:'Temporarily unavailable'},503);
 const limit=await env.CONTACT_RATE_LIMITER.limit({key:'review:'+ip});
 if(!limit.success)return json({error:'Please try again later.'},429);
 if(Number(request.headers.get('Content-Length')||0)>12000)return json({error:'Submission too large'},413);
 const data=await request.json().catch(()=>null);
 if(!data||typeof data.website!=='string'||data.website!=='')return json({error:'Unable to submit'},400);
 const name=String(data.name||'').trim(),contact=String(data.email||'').trim(),business=String(data.business||'').trim(),review=String(data.review||'').trim(),rating=Number(data.rating);
 if(name.length<2||name.length>100||!email.test(contact)||contact.length>254||business.length>120||review.length<15||review.length>3000||!Number.isInteger(rating)||rating<1||rating>5)return json({error:'Please check your review details'},400);
 await env.REVIEWS_DB.prepare('INSERT INTO reviews(id,name,email,business,rating,review) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),name,contact,business,rating,review).run();
 return json({ok:true,message:'Thank you. Your review has been received for moderation.'},201);
}};