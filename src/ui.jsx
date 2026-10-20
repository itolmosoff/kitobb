import {useState,useEffect,useRef} from 'react';
import {P} from './icons.js';import {onSync} from './sync';import {t} from './i18n';
export const Icon=({n,size=20,fill,className='',style})=><svg className={'ic '+className} style={style} viewBox="0 0 24 24" width={size} height={size} fill={fill?'currentColor':'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{__html:P[n]||''}}/>;
export const money=n=>String(n??0).replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' so‘m';
export const MO=['yan','fev','mar','apr','may','iyun','iyul','avg','sen','okt','noy','dek'];
export const fdate=s=>{if(!s)return'';const [y,m,d]=String(s).slice(0,10).split('-');return +d+' '+t(MO[+m-1])+' '+y};
export const today=()=>new Date().toISOString().slice(0,10);
export const addDays=(s,d)=>{const x=new Date(s);x.setUTCDate(x.getUTCDate()+d);return x.toISOString().slice(0,10)};
export const GENRES=['Roman','Fantastika','Detektiv','Tarix','Ilmiy','Psixologiya','Biznes','Bolalar','She’riyat'];
export const ST={new:'Yangi',confirmed:'Tasdiqlandi',rented:'Ijarada',returned:'Qaytarildi',rejected:'Rad etildi',cancelled:'Bekor qilindi'};
export const SYS='kutubxona';
export const go=p=>{location.hash=p};

/* --- muqova: rasm bo'lmasa chiroyli tipografik muqova --- */
const PAL=[['#1e1b18','#f6efe0','#d9b26f'],['#1f4e5f','#fdf3e0','#f08a5d'],['#e9c46a','#3b2a1a','#b5472f'],['#16324f','#f2e9d8','#6fb1d8'],['#d9cbb0','#2a211a','#a8402c'],['#b5472f','#fbeedd','#f2c97d'],['#33503a','#f3ecd8','#d8b45f'],['#5b3a5e','#f7ecdf','#e9a96b']];
const ART=[a=>`radial-gradient(ellipse 34% 22.7% at 74% 24%,${a} 0 98%,transparent 100%)`,
 a=>`repeating-linear-gradient(135deg,${a}33 0 7px,transparent 7px 18px)`,
 a=>`radial-gradient(ellipse 48% 32% at 50% 100%,${a} 0 98%,transparent 100%)`,
 a=>`linear-gradient(90deg,${a} 0 8%,transparent 8%),radial-gradient(ellipse 15% 10% at 80% 80%,${a} 0 98%,transparent 100%)`,
 a=>`radial-gradient(ellipse 42% 28% at 30% 68%,${a}55 0 62%,transparent 64%),radial-gradient(ellipse 24% 16% at 30% 68%,${a} 0 98%,transparent 100%)`];
export function Cover({b,className=''}){
 if(b.cover_v)return <div className={'cover photo '+className}><img src={`/api/books/${b.id}/cover?v=${b.cover_v}`} alt={b.title} loading="lazy"/></div>;
 const i=Math.abs(+b.id||0),[bg,fg,ac]=PAL[i%8],t=b.title||'',cls=t.length>30?'l':t.length>16?'m':'';
 return <div className={'cover '+className} style={{'--bg':bg,'--fg':fg}}><div className="cv-art" style={{background:ART[i%5](ac)}}/>
  <div className="cv-in"><div className="cv-genre">{b.genre}</div><div><div className={'cv-title '+cls}>{t||'Kitob nomi'}</div><div className="cv-author">{b.author}</div></div></div></div>}
export const COND=[['new','Yangi'],['mid','O‘rtacha'],['old','Eski']],COND_L={new:'Yangi',mid:'O‘rtacha',old:'Eski'},COND_HINT={new:'Deyarli o‘qilmagan, toza',mid:'Ishlatilgan, lekin to‘liq va o‘qishga yaroqli',old:'Eskirgan: burchaklari yoki sahifalari yaroqsiz bo‘lishi mumkin'};
export const isFeat=b=>!!b.featured_until&&b.featured_until>new Date().toISOString();
export const isHot=b=>!!b.hot_until&&b.hot_until>new Date().toISOString();
export const TITLES={worm:'Kitob qurti',sage:'Donishmand'};
export function Avatar({id,name,v,size=40,className='',frame=''}){const [bad,setBad]=useState(false);useEffect(()=>setBad(false),[id,v]);
 const src=v&&!bad?`/api/users/${id}/avatar?v=${v}`:null;
 return <span className={'ava '+className+(frame?' fr-'+frame:'')} style={{width:size,height:size,fontSize:size*.44}}>{src?<img src={src} alt="" onError={()=>setBad(true)}/>:<b>{(name||'?').trim()[0]?.toUpperCase()||'?'}</b>}</span>}
export const Stars=({value=0,size=15})=><span className="stars">{[1,2,3,4,5].map(i=><Icon key={i} n="star" size={size} fill={value>=i-.25}/>)}</span>;
export const Btn=({busy,icon,variant='',size='',block,children,className='',...p})=><button type="button" {...p} disabled={busy||p.disabled} className={['btn',variant,size,block&&'block',className].filter(Boolean).join(' ')}>{busy?<span className="spin"/>:icon&&<Icon n={icon} size={size==='sm'?16:18}/>}{children}</button>;
export const Msg=({err,ok})=>err?<p className="msg bad"><Icon n="alert" size={17}/>{err}</p>:ok?<p className="msg good"><Icon n="check" size={17}/>{ok}</p>:null;
export const Loader=()=><div className="loader"><span className="spin"/></div>;
export const Empty=({icon='book',title,text,children})=><div className="empty"><div className="circ"><Icon n={icon} size={32}/></div><h3>{title}</h3>{text&&<p>{text}</p>}{children}</div>;
export function Modal({open,onClose,title,children}){
 useEffect(()=>{if(!open)return;const k=e=>e.key==='Escape'&&onClose();addEventListener('keydown',k);const o=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{removeEventListener('keydown',k);document.body.style.overflow=o}},[open]);
 if(!open)return null;
 return <div className="overlay" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="sheet" role="dialog" aria-modal="true"><div className="sheet-head"><h3>{title}</h3><button className="iconbtn" onClick={onClose} aria-label="Yopish"><Icon n="x"/></button></div>{children}</div></div>}
let push=null;export const toast=(m,type='ok')=>push&&push({m,type,id:Date.now()+Math.random()});
export function Toaster(){const [l,setL]=useState([]);
 useEffect(()=>{push=t=>{setL(x=>[...x,t]);setTimeout(()=>setL(x=>x.filter(y=>y.id!==t.id)),3300)};return()=>{push=null}},[]);
 return <div className="toasts">{l.map(t=><div key={t.id} className={'toast '+t.type}><Icon n={t.type==='ok'?'check':'alert'} size={18}/>{t.m}</div>)}</div>}
export function useLoad(fn,deps,poll){const [d,setD]=useState(null),[err,setErr]=useState('');const ref=useRef(fn);ref.current=fn;
 const seq=useRef(0);const run=()=>{const n=++seq.current;return ref.current().then(x=>{if(n===seq.current){setD(x);setErr('')}}).catch(e=>{if(n===seq.current)setErr(e.message)})};
 useEffect(()=>onSync(()=>run()),[]);
 useEffect(()=>{setD(null);run();const t=poll&&setInterval(()=>{if(!document.hidden)run()},poll);return()=>clearInterval(t)},deps);
 return [d,err,run]}
export async function resizeImage(file,w,h,q=.85){
 const url=URL.createObjectURL(file);
 try{const img=await new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>no(new Error('Rasmni o‘qib bo‘lmadi'));i.src=url});
  const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');
  const r=Math.max(w/img.width,h/img.height),sw=w/r,sh=h/r;x.fillStyle='#fff';x.fillRect(0,0,w,h);
  x.drawImage(img,(img.width-sw)/2,(img.height-sh)/2,sw,sh,0,0,w,h);return c.toDataURL('image/jpeg',q)}
 finally{URL.revokeObjectURL(url)}}
