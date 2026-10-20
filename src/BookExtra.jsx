import {useState} from 'react';import {api} from './api';import {Icon,Avatar,Stars,Btn,Msg,toast,fdate,today,addDays,useLoad} from './ui.jsx';import {Tile} from './Home.jsx';import {QR} from './QR.jsx';import {t} from './i18n';
export const busyMap=busy=>{const m={};for(const x of busy||[])for(let d=x.start;d<x.end;d=addDays(d,1))m[d]=(m[d]||0)+1;return m};
const MN=['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'],WD=['Du','Se','Ch','Pa','Ju','Sh','Ya'];
const copyText=async s=>{try{await navigator.clipboard.writeText(s);return true}catch{try{const a=document.createElement('textarea');a.value=s;document.body.appendChild(a);a.select();const ok=document.execCommand('copy');a.remove();return ok}catch{return false}}};
function Cal({busy,copies}){const n=new Date(),[ym,setYm]=useState([n.getFullYear(),n.getMonth()]),[y,m]=ym,bm=busyMap(busy),td=today();
 const first=(new Date(y,m,1).getDay()+6)%7,len=new Date(y,m+1,0).getDate(),cells=[...Array(first).fill(null),...Array.from({length:len},(_,i)=>i+1)];
 const mv=k=>{const d=new Date(y,m+k,1);setYm([d.getFullYear(),d.getMonth()])};
 return <div className="cal"><div className="cal-h"><button type="button" className="iconbtn" onClick={()=>mv(-1)} aria-label="Oldingi oy"><Icon n="chevron" size={18} style={{transform:'rotate(180deg)'}}/></button><b>{t(MN[m])} {y}</b><button type="button" className="iconbtn" onClick={()=>mv(1)} aria-label="Keyingi oy"><Icon n="chevron" size={18}/></button></div>
  <div className="cal-g">{WD.map(w=><span key={w} className="wd">{t(w)}</span>)}{cells.map((d,i)=>{if(!d)return <span key={'e'+i}/>;const iso=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,c=bm[iso]||0;
   return <span key={i} title={c?c+'/'+copies:''} className={'cd2'+(iso<td?' past':'')+(c>=copies?' full':c>0?' part':'')+(iso===td?' today':'')}>{d}</span>})}</div>
  <div className="cal-l"><span><i className="free"/>Bo‘sh</span><span><i className="part"/>Qisman band</span><span><i className="full"/>To‘liq band</span></div></div>}
export function BookExtra({b,ex,rx,favs,tog}){const url=location.origin+location.pathname+'#/book/'+b.id,[qr,setQr]=useState(false),[s,setS]=useState(5),[tx,setTx]=useState(''),[err,setErr]=useState('');
 const [sim]=useLoad(()=>api('/books/'+b.id+'/similar'),[b.id]);
 const share=async()=>{try{if(navigator.share)await navigator.share({title:b.title,text:b.author,url});else if(await copyText(url))toast(t('Havola nusxalandi'))}catch{}};
 const copy=async()=>toast(await copyText(url)?t('Havola nusxalandi'):url,'ok');
 const send=async()=>{setErr('');try{await api('/books/'+b.id+'/review','POST',{stars:s,text:tx});setTx('');toast(t('Baho yuborildi'));rx()}catch(e){setErr(e.message)}};
 return <div className="bx">
  <section className="bxs"><div className="secthead"><h2>Ulashish</h2></div>
   <div className="row wrapx"><Btn variant="soft" icon="share" onClick={share}>Ulashish</Btn><a className="btn soft" target="_blank" rel="noopener noreferrer" href={'https://t.me/share/url?url='+encodeURIComponent(url)+'&text='+encodeURIComponent(b.title+' — '+b.author)}><Icon n="send" size={18}/>Telegram</a>
    <Btn variant="ghost" icon="copy" onClick={copy}>Havolani nusxalash</Btn><Btn variant="ghost" icon="qr" onClick={()=>setQr(!qr)}>QR kod</Btn></div>
   {qr&&<div className="qrbox"><QR text={url} size={190}/><p className="muted sm">Telefon kamerasi bilan skanerlang</p></div>}</section>
  <section className="bxs"><div className="secthead"><h2>Band kunlar kalendari</h2></div>{ex?<Cal busy={ex.busy} copies={b.copies}/>:<div className="sk" style={{height:260}}/>}</section>
  <section className="bxs"><div className="secthead"><h2>Kitob sharhlari</h2>{b.rcount>0&&<span><Stars value={b.rating} size={14}/> {b.rating} · {t('{n} sharh',{n:b.rcount})}</span>}</div>
   {ex?.can&&<div className="review"><b className="sm">Baholang:</b>{[1,2,3,4,5].map(n=><button key={n} type="button" className={'s'+(s>=n?' on':'')} onClick={()=>setS(n)} aria-label={n+' yulduz'}><Icon n="star" size={22} fill={s>=n}/></button>)}
    <input className="input" style={{height:38,flex:1,minWidth:140}} placeholder="Izoh (ixtiyoriy)" value={tx} onChange={e=>setTx(e.target.value)}/><Btn size="sm" onClick={send}>Yuborish</Btn></div>}
   <Msg err={err}/>{ex&&!ex.can&&ex.reviews.length===0&&<p className="muted">Hali sharh yo‘q. Kitobni o‘qib qaytargach, baho qoldirishingiz mumkin.</p>}
   {ex?.reviews.map((r,i)=><div key={i} className="rev"><Avatar id={r.uid} name={r.name} v={r.avatar_v} size={40}/><div><b>{r.name}</b> <span className="muted sm">{fdate(r.at)}</span><div><Stars value={r.stars} size={14}/></div>{r.text&&<p>{r.text}</p>}</div></div>)}</section>
  {sim?.length>0&&<section className="bxs"><div className="secthead"><h2>O‘xshash kitoblar</h2></div><div className="shelf">{sim.map((x,i)=><Tile key={x.id} i={i} b={x} fav={favs?.includes(x.id)} onFav={tog}/>)}</div></section>}</div>}
