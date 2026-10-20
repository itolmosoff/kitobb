import {useState,useEffect} from 'react';import {api} from './api';import {store,useToken} from './store';
import {Icon,Avatar,Btn,Msg,Loader,Toaster,useLoad} from './ui.jsx';
import Auth from './Auth.jsx';import Top from './Top.jsx';import Notifs from './Notifs.jsx';import Wants from './Wants.jsx';import Prefs from './Prefs.jsx';import Charity from './Charity.jsx';import {Home,Favs,homeReset} from './Home.jsx';import Book from './Book.jsx';import Add from './Add.jsx';import Profile from './Profile.jsx';
const parse=()=>(location.hash||'#/').slice(1).split('?')[0].split('/').filter(Boolean);
function useRoute(){const [r,setR]=useState(parse);useEffect(()=>{const f=()=>{setR(parse());window.scrollTo(0,0)};addEventListener('hashchange',f);return()=>removeEventListener('hashchange',f)},[]);return r}
export default function App(){
 const token=useToken(),route=useRoute();const [me,setMe]=useState(null),[err,setErr]=useState('');
 const [inc]=useLoad(()=>token?api('/orders?as=owner'):Promise.resolve([]),[token],15000);
 const [nf]=useLoad(()=>token?api('/notifs'):Promise.resolve(null),[token],15000);const unread=nf?.unread||0;
 const pending=(inc||[]).filter(o=>o.status==='new').length;
 const loadMe=()=>{setErr('');return api('/me').then(m=>{setMe(m);store.remember({id:m.id,email:m.email,name:m.name,avatar_v:m.avatar_v})}).catch(e=>setErr(e.message))};
 useEffect(()=>{setMe(null);setErr('');if(token)loadMe()},[token]);
 const out=()=>{api('/logout','POST').catch(()=>{});store.setToken(null);location.hash='#/'};
 if(!token)return <><Auth/><Toaster/></>;
 if(err)return <div className="wrap" style={{paddingTop:60,maxWidth:440}}><div className="card"><Msg err={err}/><div className="row"><Btn onClick={loadMe}>Qayta urinish</Btn><Btn variant="ghost" onClick={out}>Chiqish</Btn></div></div></div>;
 if(!me)return <Loader/>;
 const [r0,r1,r2]=route;
 const page=r0==='book'?<Book key={r1} id={r1} me={me}/>:r0==='add'?<Add key="add" me={me}/>:r0==='edit'?<Add key={r1} me={me} editId={r1}/>:r0==='favs'?<Favs/>:r0==='charity'?<Charity/>:r0==='top'?<Top/>:r0==='wants'?<Wants me={me}/>:r0==='notifs'?<Notifs/>
  :r0==='me'?<Profile key="me" id={me.id} tab={r1} me={me} refreshMe={loadMe} out={out} pending={pending}/>:r0==='user'?<Profile key={r1} id={r1} tab={r2} me={me} refreshMe={loadMe} out={out} pending={pending}/>:<Home me={me}/>;
 const home=!r0||r0==='book'||r0==='',favs=r0==='favs',top=r0==='top',chr=r0==='charity',wants=r0==='wants',nots=r0==='notifs',add=r0==='add'||r0==='edit',mine=r0==='me'||(r0==='user'&&r1===me.id);
 return <div>
  <header className="topbar"><div className="wrap">
   <a className="logo" href="#/" aria-label="Bosh sahifa" onClick={homeReset}><span className="mark"><Icon n="bookopen" size={20}/></span><span>kitob<em>.uz</em></span></a>
   <nav className="tnav"><a href="#/" className={home?'on':''} onClick={homeReset}><Icon n="home" size={18}/>Katalog</a><a href="#/favs" className={favs?'on':''}><Icon n="heart" size={18}/>Sevimlilar</a><a href="#/top" className={top?'on':''}><Icon n="trophy" size={18}/>Top</a><a href="#/wants" className={wants?'on':''}><Icon n="bookopen" size={18}/>Xohishlar</a><a href="#/charity" className={chr?'on':''}><Icon n="heart" size={18}/>Xayriya</a></nav>
   <span className="spacer"/>
   <Prefs/>
   <a className="btn addbtn sm" href="#/add"><Icon n="plus" size={16}/>Kitob qo‘shish</a>
   <a className={'iconbtn bell'+(nots?' on':'')} href="#/notifs" aria-label="Bildirishnomalar"><Icon n="bell" size={20}/>{unread>0&&<span className="badge">{unread>9?'9+':unread}</span>}</a>
   <a className={'avabtn'+(mine?' on':'')} href="#/me" aria-label="Profil"><Avatar id={me.id} name={me.name} v={me.avatar_v} frame={me.frame} size={42}/>{pending>0&&<span className="badge">{pending}</span>}</a>
  </div></header>
  <main className="wrap page">{page}</main>
  <nav className="bnav"><a className={'it'+(home?' on':'')} href="#/" onClick={homeReset}><Icon n="home" size={23}/>Bosh</a><a className={'it'+(top?' on':'')} href="#/top"><Icon n="trophy" size={23}/>Top</a><a className="fab" href="#/add" aria-label="Kitob qo‘shish"><Icon n="plus" size={28}/></a><a className={'it'+(favs?' on':'')} href="#/favs"><Icon n="heart" size={23} fill={favs}/>Sevimlilar</a><a className={'it'+(wants?' on':'')} href="#/wants"><Icon n="bookopen" size={23}/>Xohish</a></nav>
  <Toaster/></div>}
