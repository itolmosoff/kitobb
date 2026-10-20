import {useState,useRef} from 'react';import {api} from './api';import {uuid} from './store';
import {Icon,Cover,Avatar,Stars,Btn,Msg,Modal,Loader,toast,go,money,fdate,today,addDays,isFeat,isHot,COND_L,TITLES,useLoad} from './ui.jsx';import {ShelfBtn} from './Reading.jsx';import {SwapBtn,isAutoOwner} from './Swaps.jsx';import {BookExtra,busyMap} from './BookExtra.jsx';import {t} from './i18n';
export default function Book({id,me}){
 const [b,err]=useLoad(()=>api('/books/'+id),[id],10000);const [favs,,rf]=useLoad(()=>api('/fav-ids'),[]);const [ex,,rx]=useLoad(()=>api('/books/'+id+'/extra'),[id],10000);
 const [open,setOpen]=useState(false),[del,setDel]=useState(false),[busy,setBusy]=useState(false),[msg,setMsg]=useState('');
 const [f,setF]=useState({start:today(),days:3,name:me.name||'',phone:me.phone||''});const key=useRef(uuid());
 const back=()=>history.length>1?history.back():go('/');
 const backBtn=<button className="btn ghost sm backbtn" onClick={back}><Icon n="back" size={16}/>Orqaga</button>;
 if(err)return <div>{backBtn}<Msg err={err}/></div>;if(!b)return <Loader/>;
 const own=b.owner_id===me.id,fav=favs?.includes(b.id),d=+f.days,ok=Number.isInteger(d)&&d>=1&&d<=60,end=ok?addDays(f.start,d):'—',total=ok?d*b.price:0;
 const tog=async()=>{try{await api('/favs/'+b.id,'POST');rf()}catch(e){toast(e.message,'bad')}};
 const step=n=>setF({...f,days:Math.min(60,Math.max(1,(ok?d:1)+n))});
 const send=async()=>{if(busy)return;setMsg('');
  if(!f.name.trim()||!/^\+?[\d\s-]{7,15}$/.test(f.phone)||!ok||f.start<today())return setMsg('Ism, telefon (+998…), sana va muddat (1–60 kun) to‘g‘ri kiritilsin');
  const bm=busyMap(ex?.busy);for(let i=0;ok&&i<d;i++)if((bm[addDays(f.start,i)]||0)>=b.copies)return setMsg(t('Tanlangan sanalarda kitob band'));
  setBusy(true);try{await api('/orders','POST',{...f,days:b.free?1:f.days,bookId:b.id,key:key.current});key.current=uuid();toast('Kitob band qilindi');setOpen(false);go('/me/rentals')}catch(e){setMsg(e.message)}setBusy(false)};
 const wl=async()=>{try{const r=await api('/waitlist/'+b.id,'POST');toast(t(r.waiting?'Navbatga yozildingiz':'Navbatdan chiqdingiz'));rx()}catch(e){toast(e.message,'bad')}};
 const remove=async()=>{setBusy(true);setMsg('');try{await api('/books/'+b.id,'DELETE');toast('Kitob o‘chirildi');setDel(false);go('/me/books')}catch(e){setMsg(e.message)}setBusy(false)};
 return <div>{backBtn}
  <div className="bp-grid">
   <div className="bp-cover"><div className="bp-stage"><Cover b={b}/></div>
    <button className={'heart'+(fav?' on':'')} onClick={tog} aria-label="Sevimlilarga"><Icon n="heart" size={22} fill={fav}/></button></div>
   <div className="bp-info">
    <div className="row wrapx"><span className="chip on" style={{height:32,cursor:'default'}}>{b.genre}</span><span className={'stbadge inline '+(b.available?'ok':'no')}><i/>{b.available?'Mavjud':'Ijarada'}</span>{b.cond&&<span className={'stbadge inline c-'+b.cond}>{t('Holati: {x}',{x:t(COND_L[b.cond])})}</span>}{b.free&&<span className="stbadge inline gift"><Icon n="heart" size={14} fill/>{b.charity?'Xayriya':'Bepul'}</span>}{isHot(b)&&<span className="stbadge inline hotb"><Icon n="flame" size={14} fill/>Qaynoq</span>}{isFeat(b)&&<span className="stbadge inline rt"><Icon n="star" size={14} fill/>Tavsiya etilgan</span>}{b.rcount>0&&<span className="stbadge inline rt"><Icon n="star" size={14} fill/>{b.rating} · {b.rcount}</span>}</div>
    <h1>{b.title}</h1><p className="by">{b.author}</p>
    <div className="facts">
     <div className="fact"><Icon n="tag"/><b>{b.free?(b.charity?'Xayriya':'Bepul'):money(b.price)}</b><span>{b.free?'sovg‘a':'bir kunga'}</span></div>
     <div className="fact"><Icon n="box"/><b>{b.available} / {b.copies}</b><span>mavjud nusxa</span></div>
     <div className="fact"><Icon n="repeat"/><b>{b.rentals}</b><span>marta ijarada</span></div></div>
    <h4>Kitob haqida</h4><p className="desc">{b.desc||'Bu kitob uchun tavsif kiritilmagan.'}</p>
    <div className="infoline"><Icon n="pin" size={18}/><span><b>Olish manzili:</b> {b.address||'Egasi bilan kelishiladi'}</span></div>
    {b.point&&<div className="infoline"><Icon n="shield" size={18}/><span><b>Topshirish nuqtasi:</b> {b.point}</span></div>}
    {b.deposit>0&&<div className="infoline"><Icon n="shield" size={18}/><span><b>Garov puli:</b> {money(b.deposit)} <span className="muted">(kitob qaytarilganda qaytariladi)</span></span></div>}
    <div className="infoline"><Icon n="clock" size={18}/><span>Kitobni muddatida qaytaring. Kechiksangiz, egasi bilan kelishasiz.</span></div>
    <a className="owner" href={'#/user/'+b.owner_id}><Avatar id={b.owner_id} name={b.owner_name} v={b.owner_av} frame={b.owner_frame} size={46}/>
     <div className="grow"><b>{b.owner_name}{b.owner_title&&<em className={'utitle sm t-'+b.owner_title}>{t(TITLES[b.owner_title])}</em>}</b><span className="sub">{b.owner_rating?<><Stars value={b.owner_rating} size={14}/>{b.owner_rating} · {b.owner_reviews} sharh</>:'Kitob egasi'}</span></div><Icon n="chevron" size={20}/></a>
    <div className="ctabar">{own?<><a className="btn soft grow" href={'#/edit/'+b.id}><Icon n="edit" size={18}/>Tahrirlash</a><Btn variant="danger" icon="trash" onClick={()=>{setMsg('');setDel(true)}}>O‘chirish</Btn></>
     :b.available?<Btn className="grow" size="lg" icon="calendar" onClick={()=>{setMsg('');setOpen(true)}}>{b.free?'Bepul olish':'Band qilish'}</Btn>:<Btn className="grow" size="lg" variant="soft" icon="clock" onClick={wl}>{ex?.waiting?'Navbatdan chiqish':'Navbatga yozilish'}{ex?.queue>0?' · '+ex.queue:''}</Btn>}</div>
    <div className="row wrapx" style={{marginTop:14}}><ShelfBtn b={b} ex={ex} rx={rx}/>{!own&&b.available>0&&!b.free&&!isAutoOwner(b.owner_id)&&<SwapBtn b={b} me={me}/>}</div></div></div>
  <BookExtra b={b} ex={ex} rx={rx} favs={favs} tog={tog}/>
  <Modal open={open} onClose={()=>setOpen(false)} title="Band qilish">
   <div className="bk-book"><div className="mini"><Cover b={b}/></div><div><b>{b.title}</b><span>{b.author} · {money(b.price)}/kun</span></div></div>
   <div className="grid2"><label className="field"><span>Boshlanish sanasi</span><input className="input" type="date" min={today()} value={f.start} onChange={e=>setF({...f,start:e.target.value})}/></label>
    {!b.free&&<div className="field"><span>Necha kunga</span><div className="stepper"><button type="button" onClick={()=>step(-1)} aria-label="Kamaytirish"><Icon n="minus" size={18}/></button>
     <input className="input" type="number" min="1" max="60" inputMode="numeric" value={f.days} onChange={e=>setF({...f,days:e.target.value})}/><button type="button" onClick={()=>step(1)} aria-label="Ko‘paytirish"><Icon n="plus" size={18}/></button></div></div>}</div>
   <label className="field"><span>Ismingiz</span><input className="input" autoComplete="name" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></label>
   <label className="field"><span>Telefon</span><input className="input" type="tel" autoComplete="tel" placeholder="+998 90 123 45 67" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/></label>
   {b.free?<p className="muted" style={{margin:'4px 0 14px'}}>Bu kitob bepul beriladi. Egasi tasdiqlagach, kelishilgan joyda olib ketasiz.</p>:<div className="sum"><div><span>Qaytarish sanasi</span><b>{ok?fdate(end):'—'}</b></div><div><span>Kunlik narx</span><b>{money(b.price)}</b></div>{b.deposit>0&&<div><span>Garov (qaytariladi)</span><b>{money(b.deposit)}</b></div>}<div className="t"><span>Jami</span><b>{money(total)}</b></div></div>}
   <Msg err={msg}/><Btn block size="lg" busy={busy} icon="check" onClick={send}>Band qilishni tasdiqlash</Btn></Modal>
  <Modal open={del} onClose={()=>setDel(false)} title="Kitobni o‘chirish">
   <p style={{marginBottom:18}}>“{b.title}” kitobi katalogdan butunlay o‘chiriladi. Bu amalni qaytarib bo‘lmaydi.</p><Msg err={msg}/>
   <div className="row"><Btn variant="ghost" className="grow" onClick={()=>setDel(false)}>Bekor qilish</Btn><Btn variant="danger" className="grow" busy={busy} icon="trash" onClick={remove}>O‘chirish</Btn></div></Modal></div>}
