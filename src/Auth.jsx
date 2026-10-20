import {useState,useRef,useMemo} from 'react';import {api} from './api';import {store,useAccounts} from './store';import {Icon,Avatar,Msg,Btn,Cover} from './ui.jsx';import Prefs from './Prefs.jsx';
function Shelves(){const rects=useMemo(()=>{let s=11;const r=()=>(s=(s*16807)%2147483647)/2147483647;
 const cols=['#7a3b2e','#2f4a58','#c99a3f','#3d5a45','#5b3a5e','#d8c7a6','#8c4a2f','#22303c','#a8623a','#6e7f6a','#b9852f','#44302a','#b5472f','#e0b867'];const o=[];
 for(let row=0;row<6;row++){let x=-10;const base=row*165+160;while(x<1700){const w=18+r()*28,h=100+r()*52,c=cols[Math.floor(r()*cols.length)];o.push({x,y:base-h,w,h,c,k:r()});x+=w+1.5}}return o},[]);
 return <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice"><rect width="1600" height="1000" fill="#3a2718"/>
 {rects.map((b,i)=><g key={i}><rect x={b.x} y={b.y} width={b.w} height={b.h} rx="2" fill={b.c}/><rect x={b.x} y={b.y+b.h*.16} width={b.w} height="4" fill="rgba(255,255,255,.28)"/><rect x={b.x} y={b.y+b.h*.78} width={b.w} height={b.k>.5?9:3} fill="rgba(0,0,0,.22)"/></g>)}
 {[0,1,2,3,4,5].map(i=><rect key={'p'+i} x="0" y={i*165+160} width="1600" height="14" fill="#2a1b10"/>)}</svg>}
const SIDE=[{id:3,title:'Otamdan qolgan dalalar',author:'Tohir Malik',genre:'Roman'},{id:19,title:'Dune',author:'Frank Herbert',genre:'Fantastika'},{id:31,title:'Sapiens',author:'Yuval Harari',genre:'Tarix'},
 {id:44,title:'Kichkina shahzoda',author:'A. de Sent-Ekzyuperi',genre:'Bolalar'},{id:13,title:'Alkimyogar',author:'Paulo Koelo',genre:'Roman'},{id:27,title:'O‘tkan kunlar',author:'Abdulla Qodiriy',genre:'Roman'}];
export default function Auth(){const accounts=useAccounts();const [mode,setMode]=useState('login');const [f,setF]=useState({name:'',email:'',password:''});
 const [show,setShow]=useState(false),[err,setErr]=useState(''),[busy,setBusy]=useState(false);const pw=useRef();
 const reg=mode==='reg',set=k=>e=>setF({...f,[k]:e.target.value});
 const submit=async e=>{e.preventDefault();if(busy)return;setErr('');const email=f.email.trim();
  if(reg&&!f.name.trim())return setErr('Ismingizni kiriting');if(!email)return setErr('Emailni kiriting');if(!f.password)return setErr('Parolni kiriting');
  setBusy(true);try{const d=await api(reg?'/register':'/login','POST',{name:f.name,email,password:f.password});
   store.remember({id:d.user.id,email:d.user.email,name:d.user.name});store.setToken(d.token);location.hash='#/'}catch(x){setErr(x.message)}setBusy(false)};
 const pick=a=>{setMode('login');setF({...f,email:a.email,password:''});setErr('');setTimeout(()=>pw.current?.focus(),30)};
 return <div className="auth"><Prefs className="auth-prefs"/><div className="auth-bg"><Shelves/></div><div className="auth-shade"/>
  <div className="auth-books">{SIDE.map(b=><div key={b.id} className="abook"><Cover b={b}/></div>)}</div>
  <div className="glass"><div className="logo"><span className="mark"><Icon n="bookopen" size={20}/></span><span>kitob<em>.uz</em></span></div>
   <p className="tag">Kitoblarni ijaraga oling, ulashing va kashf eting</p>
   <div className="segw"><button className={!reg?'on':''} onClick={()=>{setMode('login');setErr('')}}>Kirish</button><button className={reg?'on':''} onClick={()=>{setMode('reg');setErr('')}}>Ro‘yxatdan o‘tish</button></div>
   {!reg&&accounts.length>0&&<div className="accs"><h4>Oldingi akkauntlar</h4>{accounts.map(a=><div key={a.email} className={'acc'+(f.email===a.email?' on':'')} role="button" tabIndex={0} onClick={()=>pick(a)} onKeyDown={e=>e.key==='Enter'&&pick(a)}>
    <Avatar id={a.id} name={a.name} v={a.avatar_v} size={38}/><div className="grow"><b>{a.name}</b><span className="e">{a.email}</span></div>
    <button type="button" className="x" aria-label="Ro‘yxatdan olib tashlash" onClick={e=>{e.stopPropagation();store.forget(a.email)}}><Icon n="x" size={16}/></button></div>)}</div>}
   <form onSubmit={submit} noValidate>
    {reg&&<label className="field"><div className="inp"><Icon n="user" size={19}/><input placeholder="Ismingiz" autoComplete="name" value={f.name} onChange={set('name')}/></div></label>}
    <label className="field"><div className="inp"><Icon n="mail" size={19}/><input type="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck="false" placeholder="Email" autoComplete={reg?'email':'username'} value={f.email} onChange={set('email')}/></div></label>
    <label className="field"><div className="inp"><Icon n="lock" size={19}/><input ref={pw} type={show?'text':'password'} placeholder="Parol" autoComplete={reg?'new-password':'current-password'} value={f.password} onChange={set('password')}/>
     <button type="button" onClick={()=>setShow(!show)} aria-label="Parolni ko‘rsatish"><Icon n={show?'eyeoff':'eye'} size={19}/></button></div></label>
    <Msg err={err}/><Btn type="submit" busy={busy} block size="lg">{reg?'Ro‘yxatdan o‘tish':'Kirish'}</Btn></form>
   <p className="foot">{reg?'Parol kamida 6 belgi bo‘lsin':'Akkauntingiz yo‘qmi? “Ro‘yxatdan o‘tish” ni bosing'}</p></div></div>}
