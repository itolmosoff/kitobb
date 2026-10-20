import {useState} from 'react';import {api} from './api';import {Icon,Cover,Btn,Msg,Loader,Modal,toast,go,today,addDays,useLoad} from './ui.jsx';import {t} from './i18n';
const MN=['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
export const COLS=[['reading','O‘qiyapman','bookopen'],['want','O‘qimoqchiman','heart'],['done','O‘qib bo‘ldim','check']];
function YearModal({onClose}){const [d,err]=useLoad(()=>api('/year-review'),[]);
 return <Modal open onClose={onClose} title={t('Mening yilim {y}',{y:d?.year||''})}>{err&&<Msg err={err}/>}{!d&&!err&&<Loader/>}
  {d&&<div className="yr"><div className="yr-big"><b>{d.books}</b><span>kitob o‘qib tugatdingiz</span></div>
   {d.target&&<p className="muted" style={{textAlign:'center',margin:'-6px 0 14px'}}>{d.books>=d.target?t('Maqsadga erishdingiz! 🎉 ({a}/{b})',{a:d.books,b:d.target}):t('Maqsad: {a}/{b} kitob',{a:d.books,b:d.target})}</p>}
   <div className="yr-g"><div><b>{d.days}</b><span>kun o‘qidingiz</span></div><div><b>{d.best}</b><span>eng uzun seriya (kun)</span></div><div><b>{d.lent}</b><span>marta kitobingiz ijarada bo‘ldi</span></div><div><b>{d.gifted}</b><span>kitob sovg‘a qildingiz</span></div></div>
   <div className="yr-l">{d.genre&&<p><Icon n="library" size={17}/>{t('Sevimli janr: {x}',{x:t(d.genre.name)})}</p>}{d.author&&<p><Icon n="user" size={17}/>{t('Eng ko‘p o‘qilgan muallif: {x}',{x:d.author.name})}</p>}
    {d.month&&<p><Icon n="calendar" size={17}/>{t('Eng faol oy: {x}',{x:t(MN[+d.month.name-1])})}</p>}</div>
   {d.list.length>0&&<><h4 style={{margin:'14px 0 6px'}}>O‘qilgan kitoblar</h4><ul className="yr-b">{d.list.map((x,i)=><li key={i}><b>{x.title}</b> <span className="muted">{x.author}</span></li>)}</ul></>}
   {d.books===0&&<p className="muted">Hali kitob tugatilmagan. Javonda “O‘qib bo‘ldim” ni belgilang yoki ijarani qaytaring.</p>}</div>}</Modal>}
export function GoalCard({compact}){const [g,,rg]=useLoad(()=>api('/goal'),[],60000);const [ed,setEd]=useState(false),[tv,setTv]=useState(12),[yr,setYr]=useState(false),[busy,setBusy]=useState(false);
 if(!g)return null;const pct=g.target?Math.min(100,Math.round(g.done/g.target*100)):0,set=g.target&&!ed;
 const mark=async()=>{setBusy(true);try{await api('/read-today','POST');toast(t('Barakalla! Seriya davom etmoqda'));rg()}catch(e){toast(e.message,'bad')}setBusy(false)};
 const save=async n=>{try{await api('/goal','PUT',{target:+n});setEd(false);rg()}catch(e){toast(e.message,'bad')}};
 return <div className={'goal'+(compact?' compact':'')}><div className="gtop"><div><div className="kicker">{t('O‘qish maqsadi {y}',{y:g.year})}</div>{set?<h3>{t('{a} / {b} kitob',{a:g.done,b:g.target})}</h3>:<h3>Bu yil nechta kitob o‘qiysiz?</h3>}</div>
   <div className={'streak'+(g.streak>0?' on':'')} title={t('Eng uzun seriya: {n} kun',{n:g.best})}><Icon n="flame" size={22} fill={g.streak>0}/><b>{g.streak}</b><span>kun ketma-ket</span></div></div>
  {set&&<div className="pbar"><i style={{width:pct+'%'}}/><span>{pct}%</span></div>}
  {!set&&<div className="gset"><div className="chips" style={{marginBottom:10}}>{[6,12,24,52].map(n=><button key={n} type="button" className={'chip'+(+tv===n?' on':'')} onClick={()=>setTv(n)}>{n}</button>)}</div>
   <div className="row"><input className="input" style={{maxWidth:110}} type="number" min="1" max="365" value={tv} onChange={e=>setTv(e.target.value)}/><Btn size="sm" icon="check" onClick={()=>save(tv)}>Maqsadni saqlash</Btn>{g.target&&<Btn size="sm" variant="ghost" onClick={()=>setEd(false)}>Bekor qilish</Btn>}</div></div>}
  {!compact&&<div className="heat" aria-hidden="true">{Array.from({length:28},(_,i)=>addDays(today(),i-27)).map(d=><i key={d} className={g.days.includes(d)?'on':''} title={d}/>)}</div>}
  <div className="row wrapx" style={{marginTop:12}}><Btn size="sm" icon={g.today?'check':'bookopen'} variant={g.today?'soft':''} busy={busy} disabled={g.today} onClick={mark}>{g.today?'Bugun belgilandi':'Bugun o‘qidim'}</Btn>
   {set&&<Btn size="sm" variant="ghost" icon="edit" onClick={()=>{setTv(g.target);setEd(true)}}>Maqsadni o‘zgartirish</Btn>}{!compact&&<Btn size="sm" variant="soft" icon="award" onClick={()=>setYr(true)}>Mening yilim</Btn>}
   {compact&&<a className="btn ghost sm" href="#/me/shelf">Javonim</a>}</div>{yr&&<YearModal onClose={()=>setYr(false)}/>}</div>}
export function ShelfTab({p,self}){const [l,err,rl]=useLoad(()=>api('/shelf/'+p.id),[p.id]);const [f,setF]=useState({title:'',author:'',status:'want'}),[e2,setE]=useState('');
 const add=async()=>{setE('');if(!f.title.trim())return setE(t('Kitob nomini yozing'));try{await api('/shelf','POST',f);setF({...f,title:'',author:''});rl()}catch(x){setE(x.message)}};
 const mv=async(id,status)=>{try{await api('/shelf/'+id,'PUT',{status});rl()}catch(x){toast(x.message,'bad')}};
 const del=async id=>{try{await api('/shelf/'+id,'DELETE');rl()}catch(x){toast(x.message,'bad')}};
 return <div>{self&&<GoalCard/>}
  {self&&<div className="card" style={{marginBottom:18}}><div className="sect">Javonga kitob qo‘shish</div><div className="grid2"><label className="field"><span>Kitob nomi</span><input className="input" maxLength={120} value={f.title} onChange={e=>setF({...f,title:e.target.value})}/></label>
   <label className="field"><span>Muallif</span><input className="input" maxLength={120} value={f.author} onChange={e=>setF({...f,author:e.target.value})}/></label></div>
   <div className="chips" style={{marginBottom:12}}>{COLS.map(([k,lab])=><button key={k} type="button" className={'chip'+(f.status===k?' on':'')} onClick={()=>setF({...f,status:k})}>{lab}</button>)}</div><Msg err={e2}/><Btn icon="plus" onClick={add}>Qo‘shish</Btn></div>}
  <Msg err={err}/>{!l&&!err&&<Loader/>}
  {l&&<div className="shelves">{COLS.map(([k,lab,ic])=>{const it=l.filter(x=>x.status===k);return <section key={k} className="shcol"><h4><Icon n={ic} size={18}/>{lab}<span className="n">{it.length}</span></h4>
   {it.length===0&&<p className="muted sm">Bo‘sh</p>}{it.map(x=><div key={x.id} className="shitem"><div className="mini" onClick={()=>x.exists_&&go('/book/'+x.book_id)}>{x.book_id&&x.exists_?<Cover b={{id:x.book_id,title:x.title,author:x.author,genre:x.genre,cover_v:x.cover_v}}/>:<span className="shfake">{(x.title||'?')[0]}</span>}</div>
    <div className="grow"><b onClick={()=>x.exists_&&go('/book/'+x.book_id)}>{x.title}</b><span className="muted sm">{x.author}</span>
     {self&&<div className="mvrow">{COLS.filter(c=>c[0]!==k).map(c=><button key={c[0]} type="button" className="chip sm" onClick={()=>mv(x.id,c[0])}>{'→ '+t(c[1])}</button>)}<button type="button" className="iconbtn sm" onClick={()=>del(x.id)} aria-label="O‘chirish"><Icon n="trash" size={14}/></button></div>}</div></div>)}</section>})}</div>}</div>}
export function ShelfBtn({b,ex,rx}){const cur=ex?.shelf;
 const set=async st=>{try{if(cur&&cur.status===st)await api('/shelf/'+cur.id,'DELETE');else await api('/shelf','POST',{book_id:b.id,status:st});toast(t(cur&&cur.status===st?'Javondan olib tashlandi':'Javonga qo‘shildi'));rx()}catch(e){toast(e.message,'bad')}};
 return <div className="shbtn"><span className="sm muted"><Icon n="library" size={15}/>Javonga:</span>{COLS.map(([k,lab])=><button key={k} type="button" className={'chip sm'+(cur?.status===k?' on':'')} onClick={()=>set(k)}>{lab}</button>)}</div>}
