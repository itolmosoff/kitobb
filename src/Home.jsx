import {useState,useEffect} from 'react';import {api} from './api';import {GoalCard} from './Reading.jsx';import {Icon,Cover,Avatar,isFeat,isHot,COND,COND_L,money,GENRES,useLoad,Msg,Empty,toast,go} from './ui.jsx';
const keep={q:'',g:'',s:'',a:false,r:'',p:'',f:false,c:''};
export const homeReset=()=>{keep.q='';keep.g='';keep.s='';keep.a=false;keep.r='';keep.p='';keep.f=false;keep.c='';window.dispatchEvent(new Event('homereset'));window.scrollTo(0,0)};
export function Tile({b,fav,onFav,i=0}){
 return <div className="tile" style={{'--i':Math.min(i,14)}} tabIndex={0} onClick={()=>go('/book/'+b.id)} onKeyDown={e=>e.key==='Enter'&&go('/book/'+b.id)}>
  <div className="cv"><Cover b={b}/><span className={'stbadge '+(b.available?'ok':'no')}><i/>{b.available?'Mavjud':'Ijarada'}</span>{isFeat(b)&&<span className="featbadge"><Icon n="star" size={12} fill/>Tavsiya</span>}{isHot(b)&&<span className="featbadge hotbadge"><Icon n="flame" size={12} fill/>Qaynoq</span>}<button className={'heart'+(fav?' on':'')} aria-label="Sevimlilarga" onClick={e=>{e.stopPropagation();onFav(b.id)}}><Icon n="heart" size={18} fill={fav}/></button>
   <span className="go"><Icon n="chevron" size={18}/></span></div>
  <div className="meta"><h3>{b.title}</h3><p>{b.author}</p>{b.rating>0&&<span className="rt"><Icon n="star" size={13} fill/>{b.rating}</span>}{b.cond&&<span className={'cond c-'+b.cond}>{COND_L[b.cond]}</span>}{b.owner_name&&<div className="own" title={'Egasi: '+b.owner_name}><Avatar id={b.owner_id} name={b.owner_name} v={b.owner_av} size={18}/><span>{b.owner_name}</span></div>}<div className="prow"><div className="price">{b.free?<span className="freep">{b.charity?'Xayriya':'Bepul'}</span>:<>{money(b.price)}<small>/kun</small></>}</div><span className="cnt">{b.available}/{b.copies} nusxa</span></div></div></div>}
export function HeroArt(){return <svg viewBox="0 0 400 360" width="100%" aria-hidden="true"><circle cx="210" cy="180" r="165" fill="#d3c1a4"/><circle cx="210" cy="180" r="165" fill="url(#g)"/>
 <defs><radialGradient id="g" cx=".3" cy=".25"><stop offset="0" stopColor="#fff" stopOpacity=".35"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></radialGradient></defs>
 <rect x="110" y="100" width="190" height="150" rx="10" fill="#e8c9a6"/><rect x="118" y="108" width="84" height="64" rx="4" fill="#f4e2c8"/><rect x="208" y="108" width="84" height="64" rx="4" fill="#f4e2c8"/><rect x="118" y="178" width="84" height="64" rx="4" fill="#f4e2c8"/><rect x="208" y="178" width="84" height="64" rx="4" fill="#f4e2c8"/>
 {[['#b5472f',124,126,12,46],['#1f4e5f',138,134,12,38],['#e9c46a',152,122,14,50],['#2b211a',216,130,12,42],['#8c4a2f',230,122,16,50],['#d9cbb0',248,134,12,38],['#5b3a5e',262,126,14,46],['#33503a',130,198,14,44],['#c2653a',146,190,12,52],['#16324f',224,200,16,42],['#e9c46a',242,194,12,48],['#1e1b18',256,200,14,42]].map((r,i)=><rect key={i} x={r[1]} y={r[2]} width={r[3]} height={r[4]} rx="2" fill={r[0]}/>)}
 <g transform="rotate(-12 330 270)"><rect x="288" y="214" width="92" height="22" rx="3" fill="#b5472f"/><rect x="292" y="236" width="86" height="20" rx="3" fill="#2b211a"/><rect x="284" y="256" width="96" height="22" rx="3" fill="#e9c46a"/></g>
 <rect x="60" y="262" width="300" height="20" rx="10" fill="#2b211a" opacity=".12"/></svg>}
const QUOTE='Kitoblar — o‘zing bilan olib yuradigan betakror sehrdir.';
export function Home({me}){
 const [q,setQ]=useState(keep.q),[g,setG]=useState(keep.g),[dq,setDq]=useState(q),[so,setSo]=useState(keep.s),[av,setAv]=useState(keep.a),[rg,setRg]=useState(keep.r),[pl,setPl]=useState(keep.p),[dpl,setDpl]=useState(keep.p),[fr,setFr]=useState(keep.f),[cd,setCd]=useState(keep.c);
 useEffect(()=>{const t=setTimeout(()=>setDpl(pl),250);return()=>clearTimeout(t)},[pl]);
 useEffect(()=>{const t=setTimeout(()=>setDq(q),250);return()=>clearTimeout(t)},[q]);
 useEffect(()=>{keep.q=q;keep.g=g;keep.s=so;keep.a=av;keep.r=rg;keep.p=pl;keep.f=fr;keep.c=cd},[q,g,so,av,rg,pl,fr,cd]);
 useEffect(()=>{const f=()=>{setQ('');setDq('');setG('');setSo('');setAv(false);setRg('');setPl('');setDpl('');setFr(false);setCd('')};window.addEventListener('homereset',f);return()=>window.removeEventListener('homereset',f)},[]);
 const [books,err]=useLoad(()=>api('/books?q='+encodeURIComponent(dq)+'&genre='+encodeURIComponent(g)+'&sort='+so+'&avail='+(av?1:0)+'&region='+encodeURIComponent(rg)+'&place='+encodeURIComponent(dpl)+'&free='+(fr?1:0)+'&cond='+cd),[dq,g,so,av,rg,dpl,fr,cd],10000);
 const [tr]=useLoad(()=>api('/trending'),[],30000);const [regs]=useLoad(()=>api('/regions'),[]);
 const [bod]=useLoad(()=>api('/book-of-day'),[]);const [favs,,rf]=useLoad(()=>api('/fav-ids'),[]);
 const tog=async id=>{try{await api('/favs/'+id,'POST');rf()}catch(e){toast(e.message,'bad')}};
 const filtering=!!(dq||g||av||rg||dpl||fr||cd),clear=()=>{setQ('');setDq('');setG('');setSo('');setAv(false);setRg('');setPl('');setDpl('');setFr(false);setCd('')};
 return <div>
  <section className="hero"><div><div className="hi">Salom, {me.name.split(' ')[0]}</div><h1>Keyingi <b>kitobingni</b> kashf et</h1>
   <p className="lead">Kitoblarni ijaraga oling, o‘zingiznikini ulashing va yangi muallifni kashf eting.</p>
   <form className="hsearch" onSubmit={e=>{e.preventDefault();setDq(q);document.getElementById('shelf')?.scrollIntoView({behavior:'smooth'})}}><Icon n="search" size={20}/><input placeholder="Kitob nomi yoki muallif…" value={q} onChange={e=>setQ(e.target.value)}/>
    {q&&<button type="button" className="iconbtn" style={{width:34,height:34,border:0}} onClick={()=>setQ('')} aria-label="Tozalash"><Icon n="x" size={16}/></button>}<button className="btn sm" type="submit">Izlash</button></form>
   <div className="row wrapx"><a className="btn ghost" href="#shelf" onClick={e=>{e.preventDefault();document.getElementById('shelf')?.scrollIntoView({behavior:'smooth'})}}><Icon n="library" size={18}/>Kitoblarni ko‘rish</a><a className="btn soft" href="#/add"><Icon n="plus" size={18}/>Kitob qo‘shish</a></div></div>
   <div className="hero-art"><HeroArt/></div></section>
  {!filtering&&<GoalCard compact/>}
  {!filtering&&<a className="charity-banner" href="#/charity"><Icon n="heart" size={22}/><div><b>Bepul va xayriya kitoblari</b><span>Keraksiz kitobni sovg‘a qiling yoki bepul oling</span></div><Icon n="chevron" size={20}/></a>}
  {!filtering&&bod&&<section className="featured"><div className="fc"><Cover b={bod}/></div><div><div className="kicker">Kun kitobi</div><h2>{bod.title}</h2><div className="by">{bod.author}</div>
   <p className="d">{bod.desc}</p><div className="row wrapx"><a className="btn" href={'#/book/'+bod.id}><Icon n="bookopen" size={18}/>Batafsil</a><span className="price" style={{color:'#2a1f16',fontSize:17}}>{money(bod.price)}<small style={{color:'#4c3b2b'}}> /kun</small></span></div></div></section>}
  {!filtering&&tr?.length>0&&<><div className="secthead"><h2><Icon n="trend" size={22}/> Haftaning mashhurlari</h2></div><div className="hscroll">{tr.map((b,i)=><Tile key={b.id} i={i} b={b} fav={favs?.includes(b.id)} onFav={tog}/>)}</div></>}
  <div className="secthead" id="shelf"><h2>Janr bo‘yicha</h2></div>
  <div className="chips">{[['','Hammasi'],...GENRES.map(x=>[x,x])].map(([k,l])=><button key={k} className={'chip'+(g===k?' on':'')} onClick={()=>setG(k)}>{l}</button>)}</div>
  <div className="filters"><label><Icon n="repeat" size={16}/><select className="input" value={so} onChange={e=>setSo(e.target.value)} aria-label="Saralash"><option value="">Saralash: odatiy</option><option value="new">Yangi qo‘shilgan</option><option value="popular">Mashhur</option><option value="rating">Yuqori baholi</option><option value="cheap">Arzon avval</option><option value="pricey">Qimmat avval</option></select></label>
   <label><Icon n="pin" size={16}/><select className="input" value={rg} onChange={e=>setRg(e.target.value)} aria-label="Hudud"><option value="">Barcha hududlar</option>{(regs||[]).map(x=><option key={x.r} value={x.r}>{x.r} ({x.n})</option>)}</select></label>
   <label><Icon n="book" size={16}/><select className="input" value={cd} onChange={e=>setCd(e.target.value)} aria-label="Kitob holati"><option value="">Barcha holatlar</option>{COND.map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></label>
   <label><Icon n="shield" size={16}/><input className="input" style={{minWidth:210}} value={pl} onChange={e=>setPl(e.target.value)} placeholder="Topshirish nuqtasi: Chilonzor, metro" aria-label="Topshirish nuqtasi"/></label>
   <label className="chk"><input type="checkbox" checked={av} onChange={e=>setAv(e.target.checked)}/><span>Faqat mavjud</span></label><label className="chk"><input type="checkbox" checked={fr} onChange={e=>setFr(e.target.checked)}/><span>Faqat bepul</span></label></div>
  <div className="band"><span>Klassika</span><i>✦</i><span>Fantastika</span><i>✦</i><span>Tarix</span><i>✦</i><span>Ilm</span></div>
  <div className="secthead"><h2>{filtering?'Natijalar':'Barcha kitoblar'}</h2>{books&&<span>{books.length} ta kitob</span>}</div>
  <Msg err={err}/>
  {!books&&!err&&<div className="shelf">{Array.from({length:8}).map((_,i)=><div key={i} className="sk"/>)}</div>}
  {books?.length===0&&<Empty icon="search" title="Natija topilmadi" text={dq?'“'+dq+'” harflaridan boshlanadigan kitob yoki muallif topilmadi. Boshqa harflar bilan izlab ko‘ring yoki janrni almashtiring.':'Bu janrda hozircha kitob yo‘q. Boshqa janrni tanlab ko‘ring.'}><button className="btn soft" onClick={clear}>Filtrni tozalash</button></Empty>}
  {books?.length>0&&<div className="shelf" key={dq+'|'+g}>{books.map((b,i)=><Tile key={b.id} i={i} b={b} fav={favs?.includes(b.id)} onFav={tog}/>)}</div>}
  <div className="quote"><h3>Kun iqtibosi</h3><p>“{QUOTE}”</p><small>— Stiven King</small></div></div>}
export function Favs(){const [l,err,rl]=useLoad(()=>api('/favs'),[]);
 const tog=async id=>{try{await api('/favs/'+id,'POST');rl()}catch(e){toast(e.message,'bad')}};
 return <div><div className="pageh"><h1>Sevimlilarim</h1></div><Msg err={err}/>
  {!l&&!err&&<div className="shelf">{Array.from({length:4}).map((_,i)=><div key={i} className="sk"/>)}</div>}
  {l?.length===0&&<Empty icon="heart" title="Hali sevimli kitob yo‘q" text="Kitob ustidagi yurakchani bosing — u shu yerda saqlanadi."><a className="btn" href="#/">Katalogga o‘tish</a></Empty>}
  {l?.length>0&&<div className="shelf">{l.map((b,i)=><Tile key={b.id} i={i} b={b} fav onFav={tog}/>)}</div>}</div>}
