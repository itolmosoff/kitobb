import {useState} from 'react';import {api} from './api';import {Icon,Cover,Btn,Msg,Modal,Loader,Empty,toast,fdate,useLoad} from './ui.jsx';import {t} from './i18n';
export const isAutoOwner=id=>id==='kutubxona'||String(id).startsWith('demo-');
const SW={new:'Kutilmoqda',accepted:'Qabul qilindi',declined:'Rad etildi',cancelled:'Bekor qilindi'};
export function SwapList(){const [l,err,rl]=useLoad(()=>api('/swaps'),[],8000);const [busy,setBusy]=useState('');
 const act=async(id,a)=>{setBusy(id+a);try{await api('/swaps/'+id+'/'+a,'POST');toast(t(a==='accept'?'Almashish tasdiqlandi — ikkala ijara boshlandi':'Bajarildi'));rl()}catch(e){toast(e.message,'bad')}setBusy('')};
 return <div><Msg err={err}/>{!l&&!err&&<Loader/>}
  {l?.length===0&&<Empty icon="repeat" title="Almashishlar yo‘q" text="Kitob sahifasida “Almashishni taklif qilish” tugmasini bosing yoki sizga taklif kelishini kuting."/>}
  {l?.map(x=><div key={x.id} className="ocard swap"><div className="swapb"><div className="sw1"><small>{x.mine?t('Siz berasiz'):t('{n} beradi',{n:x.fname})}</small><b>{x.ft||'—'}</b><span className="muted sm">{x.fa}</span></div><Icon n="repeat" size={22}/>
    <div className="sw1"><small>{x.mine?t('{n} beradi',{n:x.tname}):t('Siz berasiz')}</small><b>{x.tt||'—'}</b><span className="muted sm">{x.ta}</span></div></div>
   <div className="o-top" style={{marginTop:10}}><span className="muted sm">{t('{d} kunga',{d:x.days})} · {fdate(x.created)}{x.note?' · “'+x.note+'”':''}</span><span className={'pill sw-'+x.status}>{SW[x.status]}</span></div>
   {x.status==='new'&&<div className="o-actions" style={{marginTop:10}}>{x.mine?<Btn size="sm" variant="danger" icon="x" busy={busy===x.id+'cancel'} onClick={()=>act(x.id,'cancel')}>Bekor qilish</Btn>
    :<><Btn size="sm" icon="check" busy={busy===x.id+'accept'} onClick={()=>act(x.id,'accept')}>Qabul qilish</Btn><Btn size="sm" variant="danger" icon="x" busy={busy===x.id+'decline'} onClick={()=>act(x.id,'decline')}>Rad etish</Btn></>}</div>}</div>)}</div>}
export function SwapBtn({b,me}){const [open,setOpen]=useState(false),[mine,setMine]=useState(null),[sel,setSel]=useState(0),[days,setDays]=useState(14),[note,setNote]=useState(''),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false);
 const show=async()=>{setOpen(true);setMsg('');if(!mine){try{const p=await api('/users/'+me.id);setMine(p.books.filter(x=>x.available>0&&!x.free));}catch(e){setMsg(e.message)}}};
 const send=async()=>{setBusy(true);setMsg('');try{await api('/swaps','POST',{from_book:sel,to_book:b.id,days:+days,note});toast(t('Almashish taklifi yuborildi'));setOpen(false)}catch(e){setMsg(e.message)}setBusy(false)};
 return <><Btn variant="soft" icon="repeat" onClick={show}>Almashishni taklif qilish</Btn>
  <Modal open={open} onClose={()=>setOpen(false)} title="Kitob almashish"><p className="muted" style={{marginBottom:12}}>{t('“{x}” kitobiga o‘z kitobingizni almashtirishni taklif qiling. Ikkala egasi ham kelishsa, ikki ijara pulsiz boshlanadi.',{x:b.title})}</p>
   {!mine&&!msg&&<Loader/>}{mine?.length===0&&<Msg err={t('Almashish uchun mavjud kitobingiz yo‘q. Avval kitob qo‘shing.')}/>}
   <div className="swpick">{mine?.map(x=><button key={x.id} type="button" className={'swopt'+(sel===x.id?' on':'')} onClick={()=>setSel(x.id)}><div className="mini"><Cover b={x}/></div><div><b>{x.title}</b><span className="muted sm">{x.author}</span></div></button>)}</div>
   <label className="field"><span>Necha kunga almashamiz</span><input className="input" type="number" min="1" max="60" value={days} onChange={e=>setDays(e.target.value)}/></label>
   <label className="field"><span>Izoh (ixtiyoriy)</span><input className="input" maxLength={200} value={note} onChange={e=>setNote(e.target.value)}/></label>
   <Msg err={msg}/><Btn block size="lg" icon="send" busy={busy} disabled={!sel} onClick={send}>Taklifni yuborish</Btn></Modal></>}
