import {useState} from 'react';import {api} from './api';import {Icon,Avatar,Btn,Msg,Loader,Empty,toast,go,fdate,useLoad} from './ui.jsx';import {t} from './i18n';
export default function Wants({me}){const [l,err,rl]=useLoad(()=>api('/wants'),[],15000);const [f,setF]=useState({title:'',note:''}),[e2,setE]=useState(''),[busy,setBusy]=useState(false);
 const add=async()=>{setE('');if(f.title.trim().length<2)return setE(t('Kitob nomini yozing'));setBusy(true);try{await api('/wants','POST',f);setF({title:'',note:''});toast(t('So‘rov e’lon qilindi'));rl()}catch(x){setE(x.message)}setBusy(false)};
 const del=async id=>{try{await api('/wants/'+id,'DELETE');rl()}catch(x){toast(x.message,'bad')}};
 return <div><div className="pageh"><h1><Icon n="heart" size={26}/> Kitob xohishlari</h1></div>
  <p className="muted" style={{marginBottom:16}}>Kerakli kitobni yozing — kimdadir shunday kitob bo‘lsa yoki yangi qo‘shilsa, sizga bildirishnoma boradi.</p>
  <div className="card"><label className="field"><span>Menga qaysi kitob kerak?</span><input className="input" maxLength={120} placeholder="Masalan: Sapiens" value={f.title} onChange={e=>setF({...f,title:e.target.value})}/></label>
   <label className="field"><span>Izoh (ixtiyoriy)</span><input className="input" maxLength={200} placeholder="Holati, tili yoki muddati" value={f.note} onChange={e=>setF({...f,note:e.target.value})}/></label>
   <Msg err={e2}/><Btn icon="plus" busy={busy} onClick={add}>So‘rov qoldirish</Btn></div>
  <div className="secthead" style={{marginTop:26}}><h2>Ochiq so‘rovlar</h2>{l&&<span>{t('{n} ta',{n:l.length})}</span>}</div><Msg err={err}/>{!l&&!err&&<Loader/>}
  {l?.length===0&&<Empty icon="heart" title="Hozircha so‘rov yo‘q" text="Birinchi bo‘lib kerakli kitobingizni yozing."/>}
  {l?.map(w=><div key={w.id} className="want"><Avatar id={w.uid} name={w.name} v={w.avatar_v} size={42}/>
   <div className="grow"><b>{w.title}</b>{w.note&&<p className="sm muted">{w.note}</p>}<span className="muted sm">{w.mine?t('Siz'):w.name} · {fdate(w.at)}</span></div>
   <div className="wact">{w.found>0&&<a className="btn soft sm" href={'#/book/'+w.book_id}><Icon n="bookopen" size={15}/>Katalogda bor</a>}
    {w.mine?<Btn size="sm" variant="danger" icon="trash" onClick={()=>del(w.id)}>O‘chirish</Btn>:<Btn size="sm" icon="plus" onClick={()=>go('/add?title='+encodeURIComponent(w.title))}>Menda bor</Btn>}</div></div>)}</div>}
