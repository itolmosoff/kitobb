import {useState} from 'react';import {api} from './api';import {TITLES,Icon,Avatar,Msg,Loader,Empty,money,useLoad} from './ui.jsx';import {t,getLang} from './i18n';const L=o=>o[getLang()];
export default function Top(){
 const [d,err]=useLoad(()=>api('/leaderboard'),[],20000);const [tab,setTab]=useState('lenders');
 const lend=tab==='lenders',list=d&&d[tab];
 const num=r=>lend?t('{n} ta ijara',{n:r.n}):t('{n} ta kitob',{n:r.n});
 const sub=r=>lend?<>{r.rating?<><Icon n="star" size={13} fill/>{r.rating} · </>:null}{money(r.money)}</>:<>{t('{n} kun o‘qigan',{n:r.days||0})}</>;
 const top3=list?.slice(0,3)||[],order=[1,0,2].filter(i=>top3[i]);
 return <div><div className="pageh"><h1><Icon n="trophy" size={28}/> Top kitobxonlar</h1></div>
  <div className="seg" style={{marginBottom:18}}><button className={lend?'on':''} onClick={()=>setTab('lenders')}><Icon n="box" size={16}/>Eng ko‘p bergan</button><button className={!lend?'on':''} onClick={()=>setTab('readers')}><Icon n="bookopen" size={16}/>Eng ko‘p o‘qigan</button></div>
  <Msg err={err}/>{!d&&!err&&<Loader/>}
  {list?.length===0&&<Empty icon="trophy" title="Reyting hozircha bo‘sh" text="Ijaralar boshlangach, eng faol akkauntlar shu yerda chiqadi."/>}
  {list?.length>0&&<><div className="podium">{order.map(i=>{const r=top3[i];return <a key={r.id} href={'#/user/'+r.id} className={'pod p'+(i+1)+(r.id===d.me?' me':'')}>
    <span className="medal">{i+1}</span><Avatar id={r.id} name={r.name} v={r.avatar_v} frame={r.frame} size={i===0?84:68}/><b>{r.name}</b><span className="pn">{num(r)}</span></a>})}</div>
   <div className="lbl">{list.map((r,i)=><a key={r.id} href={'#/user/'+r.id} className={'lb'+(r.id===d.me?' me':'')}>
    <span className="rk">{i+1}</span><Avatar id={r.id} name={r.name} v={r.avatar_v} frame={r.frame} size={44}/>
    <div className="grow"><b>{r.name}{r.title&&<em className={'utitle sm t-'+r.title}>{t(TITLES[r.title])}</em>}{r.id===d.me&&<em className="you">{t('Siz')}</em>}</b><span className="sub">{sub(r)}{r.region?' · '+r.region:''}</span></div>
    <div className="lbn"><b>{r.n}</b><span>{L(lend?{uz:'ijara',ru:'аренд',en:'rentals'}:{uz:'kitob',ru:'книг',en:'books'})}</span></div></a>)}</div></>}</div>}
