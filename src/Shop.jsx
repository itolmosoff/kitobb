import {useState} from 'react';import {api} from './api';import {Icon,Avatar,Btn,Msg,Loader,toast,fdate,TITLES,useLoad} from './ui.jsx';import {t} from './i18n';
const ITEMS={frame_emerald:['Zumrad ramka','Profil rasmingiz atrofida yashil ramka.'],frame_gold:['Oltin ramka','Profil rasmingiz atrofida oltin ramka.'],frame_ruby:['Yoqut ramka','Profil rasmingiz atrofida qizil ramka.'],frame_sapphire:['Safir ramka','Profil rasmingiz atrofida ko‘k ramka.'],frame_rainbow:['Kamalak ramka','Rangi almashib turadigan jonli ramka.'],
 title_worm:['Unvon: Kitob qurti','Ismingiz yonida “Kitob qurti” unvoni chiqadi.'],title_sage:['Unvon: Donishmand','Ismingiz yonida “Donishmand” unvoni chiqadi.'],banner_sunset:['Fon: Quyosh botishi','Profilingiz tepasidagi fon rangi o‘zgaradi.'],banner_night:['Fon: Tungi osmon','Profilingiz tepasidagi fon rangi o‘zgaradi.'],
 featured:['“Tavsiya etilgan” belgisi (7 kun)','Kitobingiz kartochkasida yulduzli belgi chiqadi.'],boost:['Katalogda yuqorida (7 kun)','Kitobingiz katalogda boshqalardan yuqorida chiqadi.'],hot:['“Qaynoq” belgisi (7 kun)','Kitobingiz kartochkasida olov belgisi chiqadi.'],
 freeze:['Seriyani saqlash','Kecha o‘qimagan bo‘lsangiz, kechagi kunni belgilab seriyani uzilishdan saqlaydi.'],announce:['Kuzatuvchilarga e’lon','Kitobingiz haqida barcha kuzatuvchilaringizga bildirishnoma boradi.']};
const GROUPS=[['Profil ramkalari',['frame']],['Unvonlar',['title']],['Profil foni',['banner']],['Kitoblar uchun',['book']],['Qo‘shimcha',['streak','announce']]];
const UNTIL={featured:'featured_until',boost:'boost_until',hot:'hot_until'};
export default function Shop({p,onChange}){const [d,err,rl]=useLoad(()=>api('/shop'),[]);const [bk,setBk]=useState(0),[busy,setBusy]=useState('');
 if(err)return <Msg err={err}/>;if(!d)return <Loader/>;
 const after=()=>{rl();onChange&&onChange()};
 const buy=async it=>{setBusy(it.id);try{await api('/shop/buy','POST',{item:it.id,book_id:bsel});toast(t('Xarid amalga oshdi'));after()}catch(e){toast(e.message,'bad')}setBusy('')};
 const eq=async(kind,key)=>{try{await api('/shop/equip','POST',{kind,key});after()}catch(e){toast(e.message,'bad')}};
 const bsel=bk||d.books[0]?.id,cur=d.books.find(x=>x.id===bsel),now=new Date().toISOString();
 const prev=it=>it.kind==='frame'?<Avatar id={p.id} name={p.name} v={p.avatar_v} size={64} frame={it.key}/>:it.kind==='title'?<span className={'utitle t-'+it.key}>{t(TITLES[it.key])}</span>:it.kind==='banner'?<span className={'bnprev bn-'+it.key}/>
  :<Icon n={it.id==='boost'?'trend':it.id==='hot'?'flame':it.id==='featured'?'star':it.kind==='announce'?'send':'flame'} size={30} fill={it.id==='featured'||it.id==='hot'}/>;
 const action=it=>{const cos=['frame','title','banner'].includes(it.kind);
  if(cos)return it.owned?<Btn size="sm" variant={d.cur[it.kind]===it.key?'soft':''} icon="check" onClick={()=>eq(it.kind,d.cur[it.kind]===it.key?'':it.key)}>{d.cur[it.kind]===it.key?'Olib tashlash':'Kiyish'}</Btn>:<Btn size="sm" busy={busy===it.id} disabled={d.balance<it.price} onClick={()=>buy(it)}>Sotib olish</Btn>;
  const dis=d.balance<it.price||(it.kind==='book'||it.kind==='announce')&&!d.books.length||it.kind==='streak'&&!d.freeze_ok||it.kind==='announce'&&!d.followers;
  return <Btn size="sm" busy={busy===it.id} disabled={dis} onClick={()=>buy(it)}>Sotib olish</Btn>};
 const note=it=>it.kind==='streak'&&!d.freeze_ok?'Kecha allaqachon belgilangan':it.kind==='announce'&&!d.followers?'Hozircha kuzatuvchi yo‘q':'';
 return <div><div className="card shopbal"><div><div className="kicker">Sizning balansingiz</div><h3><Icon n="award" size={24}/> {d.balance} XP</h3><span className="muted sm">{t('Jami topilgan: {a} XP · Sarflangan: {b} XP',{a:d.earned,b:d.spent})}</span></div>
   <p className="muted sm" style={{maxWidth:360}}>XP: tugatilgan ijara +10, sharh +5, e’lon +2, o‘qilgan kun +2, javonda tugatilgan kitob +5, sovg‘a qilingan kitob +20.</p></div>
  {d.books.length>0&&<div className="card" style={{marginTop:16}}><label className="field"><span>Kitobni tanlang (“Tavsiya”, “Yuqorida”, “Qaynoq” va e’lon uchun)</span><select className="input" value={bsel} onChange={e=>setBk(+e.target.value)}>{d.books.map(x=><option key={x.id} value={x.id}>{x.title}</option>)}</select></label>
   {cur&&<p className="sm muted">{cur.featured_until>now&&<span>{t('Tavsiya etilgan: {d} gacha',{d:fdate(cur.featured_until)})} </span>}{cur.boost_until>now&&<span>{t('Yuqorida: {d} gacha',{d:fdate(cur.boost_until)})} </span>}{cur.hot_until>now&&<span>{t('Qaynoq: {d} gacha',{d:fdate(cur.hot_until)})}</span>}</p>}</div>}
  {GROUPS.map(([gt,kinds])=>{const its=d.items.filter(i=>kinds.includes(i.kind));return <section key={gt} className="shopsec"><div className="secthead"><h2>{gt}</h2><span>{its.length}</span></div>
   <div className="shopg">{its.map(it=><div key={it.id} className={'card shopit'+(it.owned&&d.cur[it.kind]===it.key?' worn':'')}><div className="shopav">{prev(it)}</div><b>{ITEMS[it.id][0]}</b><p className="muted sm">{ITEMS[it.id][1]}</p>
    <div className="shopf"><span className="xp">{it.price} XP</span>{action(it)}</div>{note(it)&&<span className="sm muted">{note(it)}</span>}</div>)}</div></section>})}
  {!d.books.length&&<p className="muted" style={{marginTop:14}}>Kitob belgilari va e’lon uchun avval kitob e’lon qiling.</p>}</div>}
