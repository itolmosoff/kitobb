import {useState,useRef} from 'react';import {api} from './api';
import {TITLES,Icon,Avatar,Stars,Cover,Btn,Msg,Loader,Empty,Modal,toast,go,fdate,money,useLoad,resizeImage} from './ui.jsx';import {Rentals} from './Orders.jsx';import Stats from './Stats.jsx';import Shop from './Shop.jsx';import {ShelfTab} from './Reading.jsx';import {t} from './i18n';import {Tile} from './Home.jsx';
export default function Profile({id,tab,me,refreshMe,out,pending}){
 const self=id===me.id;const [p,err,reload]=useLoad(()=>api('/users/'+id),[id]);const [favs,,rf]=useLoad(()=>api('/fav-ids'),[]);
 const [f,setF]=useState(null),[pw,setPw]=useState({old:'',new:''}),[msg,setMsg]=useState({}),[busy,setBusy]=useState(''),[delB,setDelB]=useState(null);const file=useRef();
 if(err)return <Msg err={err}/>;if(!p)return <Loader/>;
 const tabs=self?[['rentals','repeat','Ijaralar'],['books','library','Kitoblarim'],['shelf','bookopen','Javon'],['reviews','star','Sharhlar'],['stats','chart','Statistika'],['shop','award','XP do‘koni'],['edit','edit','Tahrirlash'],['pass','shield','Xavfsizlik']]:[['books','library','Kitoblari'],['shelf','bookopen','Javon'],['reviews','star','Sharhlar']];
 const cur=tabs.some(t=>t[0]===tab)?tab:tabs[0][0],base=self?'#/me/':'#/user/'+id+'/';
 const fv=f||p,set=k=>e=>setF({...fv,[k]:e.target.value});
 const upl=async e=>{const fl=e.target.files?.[0];e.target.value='';if(!fl)return;setBusy('ava');try{await api('/me/avatar','PUT',{image:await resizeImage(fl,256,256,.85)});toast('Profil rasmi yangilandi');reload();refreshMe()}catch(x){toast(x.message,'bad')}setBusy('')};
 const rmAva=async()=>{setBusy('ava');try{await api('/me/avatar','PUT',{image:null});toast('Rasm olib tashlandi');reload();refreshMe()}catch(x){toast(x.message,'bad')}setBusy('')};
 const save=async()=>{setMsg({});setBusy('save');try{await api('/me/profile','PUT',fv);setF(null);reload();refreshMe();setMsg({ok:'Saqlandi'})}catch(e){setMsg({err:e.message})}setBusy('')};
 const chg=async()=>{setMsg({});setBusy('pw');try{await api('/me/password','PUT',pw);setPw({old:'',new:''});setMsg({ok:'Parol almashtirildi'})}catch(e){setMsg({err:e.message})}setBusy('')};
 const tog=async bid=>{try{await api('/favs/'+bid,'POST');rf()}catch(e){toast(e.message,'bad')}};
 const delBook=async()=>{setBusy('del');setMsg({});try{await api('/books/'+delB.id,'DELETE');toast('Kitob o‘chirildi');setDelB(null);reload()}catch(e){setMsg({err:e.message})}setBusy('')};
 const fol=async()=>{try{await api('/follow/'+p.id,'POST');reload()}catch(e){toast(e.message,'bad')}};
 const S=({icon,v,l})=><div className="stat"><div className="ico"><Icon n={icon} size={21}/></div><div><b>{v??'—'}</b><span>{l}</span></div></div>;
 return <div>
  <div className={'pbanner'+(p.banner?' bn-'+p.banner:'')}/><div className="pcard"><div className="phead">
   <div className="pava"><Avatar id={p.id} name={p.name} v={p.avatar_v} frame={p.frame} size={92}/>{self&&<><button className="camb" onClick={()=>file.current.click()} aria-label="Rasm yuklash">{busy==='ava'?<span className="spin"/>:<Icon n="camera" size={17}/>}</button><input ref={file} type="file" accept="image/*" hidden onChange={upl}/></>}</div>
   <div className="pname"><h1>{p.name} {p.surname}{p.title&&<em className={'utitle t-'+p.title}>{t(TITLES[p.title])}</em>}</h1><div className="handle">@{p.username}</div></div></div>
   <div className="pmeta"><span><Icon n="star" size={16}/>{p.rating?<>{p.rating} · {p.reviewCount} sharh</>:'Hali baholanmagan'}</span><span><Icon n="pin" size={16}/>{p.region||'Hudud ko‘rsatilmagan'}</span><span><Icon n="calendar" size={16}/>{t('{d} dan a’zo',{d:fdate(p.created)})}</span>{p.trust!=null&&<span className={'trust '+(p.trust>=90?'hi':p.trust>=70?'mid':'lo')}><Icon n="shield" size={16}/>{t('Ishonch: {n}%',{n:p.trust})}</span>}<span><Icon n="user" size={16}/>{t('{a} kuzatuvchi · {b} kuzatmoqda',{a:p.followers,b:p.following})}</span></div>
   {p.bio&&<p className="pbio">{p.bio}</p>}
   {!self&&<div className="pacts"><Btn size="sm" variant={p.is_following?'soft':''} icon={p.is_following?'usercheck':'userplus'} onClick={fol}>{p.is_following?'Kuzatilmoqda':'Kuzatish'}</Btn></div>}
   {self&&<div className="pacts"><a className="btn soft sm" href="#/add"><Icon n="plus" size={16}/>Kitob qo‘shish</a><a className="btn ghost sm" href="#/me/edit"><Icon n="edit" size={16}/>Tahrirlash</a><Btn size="sm" variant="danger" icon="logout" onClick={out}>Chiqish</Btn></div>}</div>
  {self&&p.stats&&<div className="stats"><S icon="library" v={p.stats.books} l="E’lon qilingan"/><S icon="box" v={p.stats.lent} l="Ijaraga berilgan"/><S icon="repeat" v={p.stats.borrowed} l="Ijaraga olingan"/><S icon="award" v={p.level} l={'Daraja · '+p.xp+' XP'}/></div>}
  {!self&&p.pub&&<div className="stats"><S icon="box" v={p.pub.lent} l="Ijaraga berilgan"/><S icon="repeat" v={p.pub.borrowed} l="Ijaraga olingan"/><S icon="user" v={p.followers} l="Kuzatuvchilar"/></div>}
  {p.badges&&<div className="badges"><div className="sect">Nishonlar</div><div className="bgrid">{p.badges.map(x=><div key={x.id} className={'bdg'+(x.earned?' on':'')} title={t(x.desc)}><span className="bi"><Icon n={x.icon} size={22}/></span><b>{t(x.name)}</b></div>)}</div></div>}
  <div className="tabscroll"><div className="seg">{tabs.map(([k,ic,l])=><a key={k} href={base+k}><button className={cur===k?'on':''} tabIndex={-1}><Icon n={ic} size={16}/>{l}{k==='rentals'&&pending>0&&<span className="n">{pending}</span>}</button></a>)}</div></div>
  {cur==='rentals'&&self&&<Rentals pending={pending}/>}
  {cur==='stats'&&self&&<Stats/>}
  {cur==='shelf'&&<ShelfTab key={p.id} p={p} self={self}/>}
  {cur==='shop'&&self&&<Shop p={p} onChange={()=>{reload();refreshMe()}}/>}
  {cur==='books'&&(self?<div>
    <div className="row" style={{marginBottom:14,justifyContent:'space-between'}}><span className="muted">{p.books.length} ta kitob</span><a className="btn" href="#/add"><Icon n="plus" size={18}/>Yangi kitob qo‘shish</a></div>
    {p.books.length===0&&<Empty icon="library" title="Hali kitob qo‘shmagansiz" text="Kitobingizni e’lon qiling — boshqalar ijaraga olishi mumkin."><a className="btn" href="#/add">Kitob qo‘shish</a></Empty>}
    {p.books.map(b=><div key={b.id} className="mybook"><div className="mini" onClick={()=>go('/book/'+b.id)}><Cover b={b}/></div>
     <div><h3 onClick={()=>go('/book/'+b.id)}>{b.title}</h3><div className="muted sm">{b.author} · {b.genre}</div><div className="sm" style={{marginTop:4,color:'var(--brown)'}}>{money(b.price)}/kun · mavjud {b.available}/{b.copies}</div></div>
     <div className="acts"><a className="btn soft sm" href={'#/edit/'+b.id}><Icon n="edit" size={16}/>Tahrirlash</a><Btn size="sm" variant="danger" icon="trash" onClick={()=>{setMsg({});setDelB(b)}}>O‘chirish</Btn></div></div>)}</div>
   :p.books.length?<div className="shelf">{p.books.map(b=><Tile key={b.id} b={b} fav={favs?.includes(b.id)} onFav={tog}/>)}</div>:<Empty icon="library" title="Kitoblar yo‘q"/>)}
  {cur==='reviews'&&(p.reviews.length?p.reviews.map((r,i)=><div key={i} className="rev"><Avatar id={r.uid} name={r.name} v={r.avatar_v} size={42}/><div><b>{r.name}</b> <span className="muted sm">{fdate(r.at)}</span><div><Stars value={r.stars} size={14}/></div>{r.text&&<p>{r.text}</p>}</div></div>):<Empty icon="star" title="Sharhlar yo‘q" text="Ijara tugagach, foydalanuvchilar baho qoldiradi."/>)}
  {cur==='edit'&&self&&<div className="card formcard"><div className="ph-avatar-edit"><Avatar id={p.id} name={p.name} v={p.avatar_v} size={70}/><div className="row wrapx"><Btn size="sm" variant="soft" icon="camera" onClick={()=>file.current.click()}>Rasm yuklash</Btn>{p.avatar_v?<Btn size="sm" variant="ghost" icon="trash" onClick={rmAva}>Olib tashlash</Btn>:null}</div></div>
    <div className="grid2"><label className="field"><span>Ism</span><input className="input" value={fv.name||''} onChange={set('name')}/></label><label className="field"><span>Familiya</span><input className="input" value={fv.surname||''} onChange={set('surname')}/></label></div>
    <label className="field"><span>Username (a-z, 0-9, _)</span><input className="input" autoCapitalize="none" value={fv.username||''} onChange={set('username')}/></label>
    <div className="grid2"><label className="field"><span>Telefon (faqat o‘zingizga ko‘rinadi)</span><input className="input" type="tel" value={fv.phone||''} onChange={set('phone')}/></label><label className="field"><span>Hudud</span><input className="input" value={fv.region||''} onChange={set('region')}/></label></div>
    <label className="field"><span>O‘zingiz haqingizda</span><textarea className="input" maxLength={300} value={fv.bio||''} onChange={set('bio')}/></label>
    <Msg {...msg}/><Btn size="lg" icon="check" busy={busy==='save'} onClick={save}>Saqlash</Btn></div>}
  {cur==='pass'&&self&&<div className="card formcard"><div className="sect">Parolni almashtirish</div>
    <label className="field"><span>Eski parol</span><input className="input" type="password" autoComplete="current-password" value={pw.old} onChange={e=>setPw({...pw,old:e.target.value})}/></label>
    <label className="field"><span>Yangi parol (kamida 6 belgi)</span><input className="input" type="password" autoComplete="new-password" value={pw.new} onChange={e=>setPw({...pw,new:e.target.value})}/></label>
    <Msg {...msg}/><div className="row wrapx"><Btn icon="lock" busy={busy==='pw'} onClick={chg}>Almashtirish</Btn><Btn variant="danger" icon="logout" onClick={out}>Akkauntdan chiqish</Btn></div></div>}
  <Modal open={!!delB} onClose={()=>setDelB(null)} title="Kitobni o‘chirish"><p style={{marginBottom:18}}>“{delB?.title}” kitobi katalogdan butunlay o‘chiriladi. Bu amalni qaytarib bo‘lmaydi.</p><Msg err={msg.err}/>
   <div className="row"><Btn variant="ghost" className="grow" onClick={()=>setDelB(null)}>Bekor qilish</Btn><Btn variant="danger" className="grow" icon="trash" busy={busy==='del'} onClick={delBook}>O‘chirish</Btn></div></Modal></div>}
