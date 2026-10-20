import {useState,useEffect,useRef} from 'react';import {api} from './api';
import {Icon,Cover,Btn,Msg,Empty,toast,go,money,fdate,useLoad,ST} from './ui.jsx';import {Countdown} from './Countdown.jsx';import {SwapList} from './Swaps.jsx';import {t} from './i18n';
function Chat({id}){const [m,err,rl]=useLoad(()=>api('/chat/'+id),[id],4000);const [t,setT]=useState(''),[e2,setE]=useState('');const box=useRef();
 useEffect(()=>{if(box.current)box.current.scrollTop=box.current.scrollHeight},[m?.length]);
 const send=async e=>{e.preventDefault();if(!t.trim())return;setE('');try{await api('/chat/'+id,'POST',{text:t});setT('');rl()}catch(x){setE(x.message)}};
 return <div className="chat full"><div className="list" ref={box}>{m?.length===0&&<p className="muted sm">Hali xabar yo‘q. Birinchi bo‘lib yozing.</p>}
  {m?.map(x=><div key={x.id} className={'bub'+(x.mine?' me':'')}>{!x.mine&&<small>{x.name}</small>}{x.text}</div>)}</div><Msg err={err||e2}/>
  <form className="row" onSubmit={send}><input className="input" style={{height:42}} placeholder="Xabar yozing…" value={t} onChange={e=>setT(e.target.value)}/>
   <button className="iconbtn" style={{background:'var(--espresso)',color:'#fff',border:0}} aria-label="Yuborish"><Icon n="send" size={18}/></button></form></div>}
function Review({id}){const [s,setS]=useState(5),[t,setT]=useState(''),[m,setM]=useState({});
 const send=async()=>{try{await api('/review/'+id,'POST',{stars:s,text:t});setM({ok:1});toast('Baho yuborildi')}catch(e){setM({err:e.message})}};
 if(m.ok)return null;
 return <div className="review full"><b className="sm">Baholang:</b>{[1,2,3,4,5].map(n=><button key={n} type="button" className={'s'+(s>=n?' on':'')} onClick={()=>setS(n)} aria-label={n+' yulduz'}><Icon n="star" size={22} fill={s>=n}/></button>)}
  <input className="input" style={{height:38,flex:1,minWidth:140}} placeholder="Izoh (ixtiyoriy)" value={t} onChange={e=>setT(e.target.value)}/><Btn size="sm" onClick={send}>Yuborish</Btn>{m.err&&<Msg err={m.err}/>}</div>}
function Card({o,role,reload}){
 const [chat,setChat]=useState(false),[ext,setExt]=useState(false),[rej,setRej]=useState(false),[reason,setReason]=useState(''),[busy,setBusy]=useState('');const sys=!!o.auto; // V A Y R O va demo akkauntlar kitoblari: avtomatik tasdiqlanadi
 const DONE={cancel:'Bekor qilindi. U “Tugagan” bo‘limiga o‘tdi',receive:'Kitob qaytarildi. U “Tugagan” bo‘limiga o‘tdi — u yerda baho qoldirishingiz mumkin',reject:'So‘rov rad etildi','return-request':sys?'Kitob qaytarildi. “Tugagan” bo‘limida baho qoldirishingiz mumkin':'Qaytarish so‘rovi yuborildi',confirm:'So‘rov tasdiqlandi',handover:'Kitob topshirildi',pickup:'Kitob olindi',extend:sys?'Ijara uzaytirildi':'Uzaytirish so‘rovi yuborildi','extend-ok':'Ijara uzaytirildi','extend-no':'Uzaytirish rad etildi'};
 const act=async(a,body)=>{setBusy(a);try{await api(`/orders/${o.id}/${a}`,'POST',body);toast(DONE[a]||'Bajarildi');reload()}catch(e){toast(e.message,'bad')}setBusy('')};
 const B=(a,label,icon,variant='soft')=><Btn key={a} size="sm" variant={variant} icon={icon} busy={busy===a} onClick={()=>act(a)}>{label}</Btn>;
 const open=()=>o.book_exists&&go('/book/'+o.book_id),cust=role==='customer';
 return <div className={'ocard'+(o.overdue?' late':'')}>
  <div className="o-thumb" onClick={open}><Cover b={{id:o.book_id,title:o.book_title,author:o.book_author,cover_v:o.cover_v}}/></div>
  <div><div className="o-top"><h3 onClick={open}>{o.book_title}<small>#{o.id} · {o.book_author}</small></h3>
   <span className="pills">{o.swap_id&&<span className="pill swp">Almashish</span>}{o.gift>0&&<span className="pill swp">Sovg‘a</span>}<span className={'pill st-'+o.status}>{ST[o.status]}</span></span></div>
   <div className="o-meta"><div><Icon n="calendar" size={16}/>{fdate(o.start)} → {fdate(o.end)} · {o.days} kun</div>
    <div><Icon n="user" size={16}/>{cust?'Egasi: '+o.owner_name:'Ijarachi: '+o.name}</div>
    {!cust&&<div><Icon n="phone" size={16}/><a href={'tel:'+o.phone}>{o.phone}</a></div>}
    {!cust&&o.renter_trust!=null&&<div><Icon n="shield" size={16}/>{t('Ishonch darajasi: {n}%',{n:o.renter_trust})}</div>}
    {o.price>0?<div><Icon n="tag" size={16}/>{o.days} × {money(o.price)} = <b>{money(o.total)}</b></div>:<div><Icon n="tag" size={16}/><b>{o.swap_id?'Almashish (pulsiz)':o.gift===2?'Xayriya':'Bepul'}</b></div>}
    {o.status==='rented'&&<div><Countdown end={o.end}/></div>}
    {o.deposit>0&&<div><Icon n="shield" size={16}/>{t('Garov: {m} (qaytariladi)',{m:money(o.deposit)})}</div>}
    {o.overdue?<div style={{color:'var(--bad)'}}><Icon n="clock" size={16}/>Qaytarish muddati o‘tgan</div>:null}
    {o.late_fee>0&&<div style={{color:'var(--bad)'}}><Icon n="tag" size={16}/>{t('Kechikish jarimasi: {d} kun × {p} = {m}',{d:o.late_days,p:money(o.price),m:money(o.late_fee)})}</div>}
    {o.ext_days>0&&o.status==='rented'?<div style={{color:'var(--warn)'}}><Icon n="clock" size={16}/>{t('Uzaytirish so‘ralgan: +{n} kun',{n:o.ext_days})}</div>:null}
    {o.reason&&<div style={{color:'var(--bad)'}}><Icon n="alert" size={16}/>Sabab: {o.reason}</div>}
    {o.return_requested&&o.status==='rented'?<div style={{color:'var(--warn)'}}><Icon n="repeat" size={16}/>Qaytarish so‘ralgan</div>:null}</div></div>
  <div className="full"><div className="o-actions">
   {cust?<>{o.status==='new'&&B('cancel','Bekor qilish','x','danger')}{o.status==='rented'&&!o.return_requested&&B('return-request','Qaytardim','repeat')}{o.status==='rented'&&!o.ext_days&&<Btn size="sm" variant="soft" icon="clock" onClick={()=>setExt(!ext)}>Uzaytirish</Btn>}
     {sys&&o.status==='confirmed'&&<>{B('pickup','Oldim','check')}{B('cancel','Bekor qilish','x','danger')}</>}</>
   :<>{o.status==='new'&&<>{B('confirm','Tasdiqlash','check','')}<Btn size="sm" variant="danger" icon="x" onClick={()=>setRej(!rej)}>Rad etish</Btn></>}
     {o.status==='confirmed'&&B('handover','Topshirildi','box','')}{o.status==='rented'&&B('receive','Qaytarib oldim','check','')}{o.status==='rented'&&o.ext_days>0&&<>{B('extend-ok',t('+{n} kun: tasdiqlash',{n:o.ext_days}),'check','')}{B('extend-no','Rad etish','x','danger')}</>}</>}
   {!sys&&<Btn size="sm" variant="ghost" icon="chat" onClick={()=>setChat(!chat)}>Chat</Btn>}</div>
   {ext&&cust&&<div className="reason"><span className="sm">Necha kunga uzaytiramiz?</span>{[1,3,7].map(n=><Btn key={n} size="sm" variant="soft" busy={busy==='extend'} onClick={()=>act('extend',{days:n})}>{'+'+n+' '+t('kun')}</Btn>)}</div>}
   {rej&&<div className="reason"><input className="input" placeholder="Rad etish sababi…" value={reason} onChange={e=>setReason(e.target.value)}/><Btn size="sm" variant="danger" busy={busy==='reject'} onClick={()=>reason.trim()?act('reject',{reason}):toast('Sababni yozing','bad')}>Yuborish</Btn></div>}</div>
  {chat&&<Chat id={o.id}/>}{o.status==='returned'&&<Review id={o.id}/>}
  <details className="hist full"><summary>Tarix</summary>{o.history.map((h,i)=><div key={i}>{new Date(h.at).toLocaleString()} — {ST[h.status]} {h.note}</div>)}</details></div>}
function List({role}){const [list,err,reload]=useLoad(()=>api('/orders?as='+(role==='owner'?'owner':'renter')),[role],6000);const [flt,setFlt]=useState('active');
 const act=o=>['new','confirmed','rented'].includes(o.status);
 const shown=list?.filter(o=>flt==='all'||(flt==='active')===act(o));const na=list?.filter(act).length||0;
 return <div><div className="seg" style={{marginBottom:16}}>{[['active','Faol',na],['done','Tugagan',(list?.length||0)-na],['all','Hammasi',list?.length||0]].map(([k,l,n])=><button key={k} className={flt===k?'on':''} onClick={()=>setFlt(k)}>{l} <span style={{opacity:.7}}>{n}</span></button>)}</div>
  <Msg err={err}/>{shown?.length===0&&<Empty icon={role==='owner'?'box':'repeat'} title={role==='owner'?'So‘rovlar yo‘q':'Ijaralar yo‘q'} text={role==='owner'?'Kitobingizni ijaraga olishsa, so‘rov shu yerda chiqadi.':'Katalogdan kitob tanlab, band qiling.'}>{role!=='owner'&&<a className="btn" href="#/">Katalogga o‘tish</a>}</Empty>}
  {shown?.map(o=><Card key={o.id} o={o} role={role==='owner'?'owner':'customer'} reload={reload}/>)}</div>}
export function Rentals({pending}){const [t,setT]=useState('mine');const [sw]=useLoad(()=>api('/swaps'),[],10000);const swn=(sw||[]).filter(x=>x.status==='new'&&!x.mine).length;
 return <div><div className="seg" style={{marginBottom:16}}><button className={t==='mine'?'on':''} onClick={()=>setT('mine')}><Icon n="repeat" size={16}/>Olganlarim</button>
  <button className={t==='in'?'on':''} onClick={()=>setT('in')}><Icon n="box" size={16}/>So‘rovlar{pending>0&&<span className="n">{pending}</span>}</button>
  <button className={t==='sw'?'on':''} onClick={()=>setT('sw')}><Icon n="repeat" size={16}/>Almashish{swn>0&&<span className="n">{swn}</span>}</button></div>
  {t==='sw'?<SwapList/>:<List key={t} role={t==='mine'?'customer':'owner'}/>}</div>}
