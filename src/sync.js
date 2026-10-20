// Oynalar/tablar/kompyuterlar o'rtasida sinxronizatsiya: BroadcastChannel + localStorage 'storage' hodisasi.
const KEY='kitob-sync-ping';let bc=null;try{bc=new BroadcastChannel('kitob-sync')}catch{}
const subs=new Set();let timer=0;
const fire=()=>{clearTimeout(timer);timer=setTimeout(()=>subs.forEach(f=>{try{f()}catch{}}),120)}; // bir nechta signalni bitta yangilashga birlashtiradi
if(bc)bc.onmessage=fire;
try{addEventListener('storage',e=>{if(e.key===KEY)fire()})}catch{}
export function notify(path=''){
 if(!/^\/(favs|chat)/.test(path))fire(); // shu oynaning o'zida ham yangilaymiz
 try{bc&&bc.postMessage({t:Date.now()})}catch{}
 try{localStorage.setItem(KEY,Date.now()+':'+Math.random())}catch{}}
export const onSync=f=>{subs.add(f);return()=>subs.delete(f)};
