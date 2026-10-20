import {api} from './api';import {Icon,Msg,Loader,Empty,money,useLoad,MO} from './ui.jsx';import {t} from './i18n';
export default function Stats(){const [d,err]=useLoad(()=>api('/my-stats'),[],20000);
 if(err)return <Msg err={err}/>;if(!d)return <Loader/>;
 const mx=Math.max(1,...d.months.map(m=>m.s)),S=({icon,v,l})=><div className="stat"><div className="ico"><Icon n={icon} size={21}/></div><div><b>{v}</b><span>{l}</span></div></div>;
 return <div><div className="stats"><S icon="tag" v={money(d.earnings)} l="Jami daromad"/><S icon="repeat" v={d.lent} l="Jami ijara"/><S icon="clock" v={d.active} l="Hozir ijarada"/><S icon="library" v={d.books} l="Kitoblarim"/></div>
  <div className="card" style={{marginTop:16}}><div className="sect">Oylik daromad (so‘nggi 6 oy)</div>
   <div className="bars">{d.months.map(m=><div key={m.m} className="bar" title={money(m.s)+' · '+t('{n} ta ijara',{n:m.n})}><b>{m.s?Math.round(m.s/1000)+'k':'0'}</b><div className="col"><i style={{height:Math.max(m.s?6:2,m.s/mx*100)+'%'}}/></div><span>{t(MO[+m.m.slice(5)-1])}</span></div>)}</div></div>
  <div className="card" style={{marginTop:16}}><div className="sect">Eng ko‘p ijaraga olingan kitoblar</div>
   {d.top.length===0?<Empty icon="chart" title="Ma’lumot yo‘q" text="Kitoblaringiz ijaraga olingach, statistika shu yerda chiqadi."/>:d.top.map((b,i)=><div key={i} className="toprow"><span className="rk">{i+1}</span><div className="grow"><b>{b.t}</b></div><span className="muted sm">{t('{n} ta ijara',{n:b.n})} · {money(b.s)}</span></div>)}</div></div>}
