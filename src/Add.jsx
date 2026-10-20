import {useState,useRef} from 'react';import {api} from './api';import {Icon,Cover,Btn,Msg,Loader,toast,go,GENRES,useLoad,resizeImage,money,COND,COND_HINT} from './ui.jsx';import {t} from './i18n';
function PriceAdvice({f,setF}){const [a]=useLoad(()=>api('/price-advice?genre='+encodeURIComponent(f.genre)),[f.genre]);if(!a)return null;
 const p=+f.price,warn=a.avg&&p>0?(p<a.avg*.6?'Narx o‘rtachadan ancha arzon — ehtimol, ortiqcha kam olyapsiz.':p>(a.popular||a.avg)*1.5?'Narx yuqori — talab kamayishi mumkin.':''):'';
 return <div className="advice"><div className="adv-t"><Icon n="trend" size={18}/>Narx maslahatchisi</div>
  {a.n===0?<p className="sm">Bu janrda hali ma’lumot yo‘q. Boshlang‘ich narx sifatida 3 000 so‘m tavsiya etiladi.</p>:<p className="sm">{t('Shu janrda o‘rtacha {a}{p}. So‘nggi 30 kunda {d} ta ijara.',{a:money(a.avg),p:a.popular?t(', mashhurlari {x}',{x:money(a.popular)}):'',d:a.demand30})}</p>}
  <div className="row wrapx"><Btn size="sm" variant="soft" icon="check" onClick={()=>setF({...f,price:a.suggest})}>{t('Tavsiya: {m} — qo‘llash',{m:money(a.suggest)})}</Btn></div>{warn&&<p className="sm adv-w">{warn}</p>}</div>}
function Form({init,editId}){
 const [f,setF]=useState({title:init?.title||'',author:init?.author||'',genre:init?.genre||'Roman',desc:init?.desc||'',price:init?.price??3000,copies:init?.copies??1,address:init?.address||'',deposit:init?.deposit??0,point:init?.point||'',cond:init?.cond||'mid',free:!!init?.free,charity:!!init?.charity});
 const [cover,setCover]=useState(undefined); // undefined: o‘zgarmagan · null: olib tashlangan · 'data:…': yangi rasm
 const [busy,setBusy]=useState(false),[err,setErr]=useState('');const file=useRef();const set=k=>e=>setF({...f,[k]:e.target.value});
 const pick=async e=>{const fl=e.target.files?.[0];e.target.value='';if(!fl)return;setErr('');try{setCover(await resizeImage(fl,360,540,.82))}catch(x){setErr(x.message)}};
 const hasOld=!!init?.cover_v&&cover===undefined,hasImg=typeof cover==='string'||hasOld;
 const prev=typeof cover==='string'?<div className="cover photo"><img src={cover} alt=""/></div>:hasOld?<Cover b={init}/>:<Cover b={{id:editId||f.title.length+3,title:f.title,author:f.author||'Muallif',genre:f.genre}}/>;
 const save=async()=>{setErr('');if(!f.title.trim()||!f.author.trim())return setErr('Kitob nomi va muallifini kiriting');
  const price=+f.price,copies=+f.copies;if(!f.free&&!f.charity&&(!Number.isInteger(price)||price<=0))return setErr('Kunlik narx to‘g‘ri emas');if(!Number.isInteger(copies)||copies<1||copies>99)return setErr('Nusxalar soni 1 dan 99 gacha bo‘lsin');
  const deposit=+f.deposit||0;if(!Number.isInteger(deposit)||deposit<0||deposit>5e6)return setErr(t('Garov puli noto‘g‘ri'));
  setBusy(true);try{const body={...f,price,copies,deposit};if(cover!==undefined)body.cover=cover;await api(editId?'/books/'+editId:'/books',editId?'PUT':'POST',body);
   toast(editId?'O‘zgarishlar saqlandi':'Kitob e’lon qilindi');go('/me/books')}catch(e){setErr(e.message)}setBusy(false)};
 return <div className="addgrid">
  <div className="uploader"><div className="pv">{prev}</div><input ref={file} type="file" accept="image/*" hidden onChange={pick}/>
   <div className="row wrapx" style={{justifyContent:'center'}}><Btn variant="soft" icon="camera" size="sm" onClick={()=>file.current.click()}>{hasImg?'Rasmni almashtirish':'Muqova rasmi'}</Btn>
    {hasImg&&<Btn variant="ghost" icon="trash" size="sm" onClick={()=>setCover(null)}>Olib tashlash</Btn>}</div>
   <p className="hint">Muqova rasmi ixtiyoriy. Yuklamasangiz, nom va muallifdan chiroyli muqova yasaladi.</p></div>
  <div className="card"><div className="sect">Asosiy ma’lumot</div>
   <label className="field"><span>Kitob nomi</span><input className="input" maxLength={120} placeholder="Masalan: O‘tkan kunlar" value={f.title} onChange={set('title')}/></label>
   <label className="field"><span>Muallif</span><input className="input" maxLength={120} placeholder="Masalan: Abdulla Qodiriy" value={f.author} onChange={set('author')}/></label>
   <div className="field"><span>Janr</span><div className="genres">{GENRES.map(g=><button type="button" key={g} className={'chip'+(f.genre===g?' on':'')} onClick={()=>setF({...f,genre:g})}>{g}</button>)}</div></div>
   <div className="field"><span>Kitob holati</span><div className="genres">{COND.map(([k,l])=><button type="button" key={k} className={'chip c-btn c-'+k+(f.cond===k?' on':'')} onClick={()=>setF({...f,cond:k})}>{l}</button>)}</div><p className="hint">{COND_HINT[f.cond]}</p></div>
   <label className="field"><span>Qisqacha tavsif ({f.desc.length}/1000)</span><textarea className="input" maxLength={1000} placeholder="Kitob nima haqida? Holati qanday?" value={f.desc} onChange={set('desc')}/></label>
   <div className="sect" style={{marginTop:10}}>Ijara shartlari</div>
   <div className="giveaway"><label className="chk"><input type="checkbox" checked={f.free||f.charity} disabled={f.charity} onChange={e=>setF({...f,free:e.target.checked})}/><span>Bepul beraman (birinchi so‘ragan oladi)</span></label>
    <label className="chk"><input type="checkbox" checked={f.charity} onChange={e=>setF({...f,charity:e.target.checked,free:e.target.checked||f.free})}/><span>Xayriya uchun (maktab, kutubxona, bolalar uyi)</span></label></div>
   <div className="grid2"><label className="field"><span>Kunlik narx (so‘m)</span><input className="input" type="number" min="500" step="500" inputMode="numeric" disabled={f.free||f.charity} value={(f.free||f.charity)?0:f.price} onChange={set('price')}/></label>
    <label className="field"><span>Nusxalar soni</span><input className="input" type="number" min="1" max="99" inputMode="numeric" value={f.copies} onChange={set('copies')}/></label></div>
   {!(f.free||f.charity)&&<PriceAdvice f={f} setF={setF}/>}
   {!(f.free||f.charity)&&<label className="field"><span>Garov puli (so‘m, ixtiyoriy)</span><input className="input" type="number" min="0" step="1000" inputMode="numeric" placeholder="0" value={f.deposit} onChange={set('deposit')}/></label>}
   <div className="field"><span>Topshirish nuqtasi (jamoat joyi — xavfsizroq)</span><input className="input" maxLength={100} placeholder="Masalan: Chilonzor, metro yaqini" value={f.point} onChange={set('point')}/>
    <div className="genres" style={{marginTop:8}}>{['Metro yaqini','Kafe','Universitet','Kutubxona','Savdo markazi'].map(x=><button type="button" key={x} className={'chip sm'+(f.point===x?' on':'')} onClick={()=>setF({...f,point:x})}>{x}</button>)}</div></div>
   <label className="field"><span>Kitobni olib ketish manzili</span><input className="input" maxLength={200} placeholder="Shahar, ko‘cha, mo‘ljal" value={f.address} onChange={set('address')}/></label>
   <Msg err={err}/><div className="row wrapx"><Btn size="lg" busy={busy} icon={editId?'check':'plus'} className="grow" onClick={save}>{editId?'Saqlash':'E’lon qilish'}</Btn><a className="btn ghost lg" href="#/me/books">Bekor qilish</a></div></div></div>}
export default function Add({me,editId}){
 const [src,err]=useLoad(()=>editId?api('/books/'+editId):Promise.resolve(null),[editId]);
 const body=editId?(err?<Msg err={err}/>:!src?<Loader/>:src.owner_id!==me.id?<Msg err="Bu kitobni faqat egasi tahrirlay oladi"/>:<Form key={editId} init={src} editId={editId}/>):<Form key="new" init={{title:new URLSearchParams(location.hash.split('?')[1]||'').get('title')||''}}/>;
 return <div><div className="pageh"><a className="iconbtn" href="#/me/books" aria-label="Orqaga"><Icon n="back"/></a><h1>{editId?'Kitobni tahrirlash':'Yangi kitob qo‘shish'}</h1></div>{body}</div>}
