// Ko'p tillilik (UZ / RU / EN). Kalit — o'zbekcha matn (apostrof turlari farq qilmaydi). Eski, statik matnlar DOM kuzatuvchisi orqali tarjima qilinadi.
import {useSyncExternalStore} from 'react';
import {RU,EN,PAT} from './dict.js';
const LK='kitob-lang',norm=s=>String(s).replace(/[‘’ʻʼ`´′]/g,"'").replace(/\s+/g,' ').trim();
const MAP={ru:Object.fromEntries(Object.entries(RU).map(([k,v])=>[norm(k),v])),en:Object.fromEntries(Object.entries(EN).map(([k,v])=>[norm(k),v]))};
let lang=(()=>{try{const l=localStorage.getItem(LK);return l==='ru'||l==='en'?l:'uz'}catch{return'uz'}})();
const subs=new Set(),emit=()=>subs.forEach(f=>f());
const TT={uz:'kitob.uz — kitob ijarasi',ru:'kitob.uz — аренда книг',en:'kitob.uz — book rental'};
const apply=()=>{try{document.documentElement.lang=lang;document.title=TT[lang]}catch{}};
export const getLang=()=>lang;
export const setLang=l=>{lang=l;try{localStorage.setItem(LK,l)}catch{}apply();emit()};
try{addEventListener('storage',e=>{if(e.key===LK){lang=e.newValue==='ru'||e.newValue==='en'?e.newValue:'uz';apply();emit()}})}catch{}
export const useLang=()=>useSyncExternalStore(f=>{subs.add(f);return()=>subs.delete(f)},()=>lang);
const find=s=>{if(lang==='uz')return null;const n=norm(s),m=MAP[lang][n];if(m!==undefined)return m;
 for(const [re,ru,en] of PAT){const x=re.exec(n);if(x)return(lang==='ru'?ru:en).replace(/\$(\d)/g,(_,i)=>x[i])}return null};
export const t=(s,p)=>{let r=find(s);if(r==null)r=s;return p?r.replace(/\{(\w+)\}/g,(m,k)=>p[k]!==undefined?p[k]:m):r};
// DOM matnlarini joyida (qayta yaratmasdan) tarjima qilish: asl matn eslab qolinadi, til almashganda qaytadan qo'llanadi
const ATTR=['placeholder','title','aria-label'],TREC=new WeakMap(),AREC=new WeakMap();
const trText=n=>{const v=n.nodeValue;if(v==null)return;const rec=TREC.get(n),src=rec&&rec.out===v?rec.src:v;let out=src;
 if(/\S/.test(src)){const m=/^(\s*)([\s\S]*?)(\s*)$/.exec(src),r=find(m[2]);if(r!=null)out=m[1]+r+m[3]}
 if(out!==v)n.nodeValue=out;TREC.set(n,{src,out})};
const trAttrs=e=>{let rec=AREC.get(e);if(!rec){rec={};AREC.set(e,rec)}
 for(const a of ATTR){const v=e.getAttribute(a);if(v==null)continue;const r0=rec[a],src=r0&&r0.out===v?r0.src:v,r=find(src),out=r!=null?r:src;if(out!==v)e.setAttribute(a,out);rec[a]={src,out}}};
const walk=n=>{if(n.nodeType===3)return trText(n);if(n.nodeType!==1||n.tagName==='SCRIPT'||n.tagName==='STYLE')return;trAttrs(n);for(let c=n.firstChild;c;c=c.nextSibling)walk(c)};
export const retranslate=()=>{if(document.body)walk(document.body)};
export function startI18n(){apply();
 new MutationObserver(ms=>{for(const m of ms){if(m.type==='childList')m.addedNodes.forEach(walk);else if(m.type==='characterData')trText(m.target);else if(m.type==='attributes')trAttrs(m.target)}})
  .observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTR})}
