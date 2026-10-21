document.querySelector('.mobile-toggle')?.addEventListener('click',()=>{const nav=document.querySelector('nav');nav.classList.toggle('open');document.querySelector('.mobile-toggle').setAttribute('aria-expanded',nav.classList.contains('open'))});
const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target)}}),{threshold:.08});document.documentElement.classList.add('js-reveal');document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
document.querySelectorAll('[data-carousel]').forEach(c=>{const track=c.querySelector('.carousel-track');const prev=c.querySelector('[data-prev]');const next=c.querySelector('[data-next]');const move=(direction)=>{const item=track.querySelector(':scope > *');track.scrollBy({left:direction*(item.getBoundingClientRect().width+(parseFloat(getComputedStyle(track).gap)||0)),behavior:'smooth'})};prev?.addEventListener('click',()=>move(-1));next?.addEventListener('click',()=>move(1));if(c.dataset.autoplay==='true'&&!matchMedia('(prefers-reduced-motion: reduce)').matches){let timer=setInterval(()=>{if(document.hidden||c.matches(':hover')||c.contains(document.activeElement))return;const end=track.scrollLeft+track.clientWidth>=track.scrollWidth-20;if(end)track.scrollTo({left:0,behavior:'smooth'});else move(1)},5500);}}
);
document.querySelectorAll('.filters').forEach(group=>{group.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{group.querySelectorAll('button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');const type=btn.dataset.filter;document.querySelectorAll('[data-category]').forEach(el=>{el.hidden=type!=='all'&&!el.dataset.category.split(' ').includes(type)})}))});


const menuButton=document.querySelector('.mobile-toggle');
const menu=document.querySelector('nav');
function closeMenu(){menu?.classList.remove('open');menuButton?.setAttribute('aria-expanded','false');}
menu?.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu?.classList.contains('open')){closeMenu();menuButton?.focus();}});
document.querySelectorAll('.filters').forEach(group=>{const buttons=group.querySelectorAll('button');const update=()=>buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.classList.contains('active'))));update();buttons.forEach(button=>button.addEventListener('click',update));});
document.querySelectorAll('[data-carousel]').forEach(carousel=>{
 const track=carousel.querySelector('.carousel-track');if(!track)return;
 track.tabIndex=0;track.setAttribute('role','region');track.setAttribute('aria-label','Scrollable cards');
 carousel.querySelector('[data-prev]')?.setAttribute('aria-label','Previous cards');carousel.querySelector('[data-next]')?.setAttribute('aria-label','Next cards');
 track.addEventListener('keydown',event=>{if(event.target!==track||!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();carousel.querySelector(event.key==='ArrowLeft'?'[data-prev]':'[data-next]')?.click();});
});
