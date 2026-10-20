import {useEffect} from 'react';import {api} from './api';import {Icon,Msg,Loader,Empty,Btn,go,useLoad} from './ui.jsx';import {t} from './i18n';
const NT={'order:new':'{name} “{title}” kitobini ijaraga olmoqchi','order:confirm':'“{title}”: so‘rovingiz tasdiqlandi','order:reject':'“{title}”: so‘rovingiz rad etildi','order:handover':'“{title}”: kitob sizga topshirildi',
 'order:receive':'“{title}”: kitob qaytarib olindi','order:cancel':'“{title}”: ijarachi so‘rovni bekor qildi','order:return':'“{title}”: ijarachi kitobni qaytardim deb belgiladi','ext:ask':'“{title}”: ijarachi +{days} kunga uzaytirishni so‘ramoqda',
 'ext:ok':'“{title}”: ijara +{days} kunga uzaytirildi','ext:no':'“{title}”: uzaytirish rad etildi','chat':'“{title}” bo‘yicha yangi xabar','wait':'“{title}” kitobi bo‘shadi — band qilishingiz mumkin',
 'want':'Siz izlagan kitob qo‘shildi: “{title}”','follow:book':'{name} yangi kitob qo‘shdi: “{title}”','follow:user':'{name} sizni kuzata boshladi','review':'“{title}” kitobiga {stars} yulduzli baho qo‘yildi',
 'swap:new':'{name} “{mine}” kitobini sizning “{title}” kitobingizga almashtirishni taklif qildi','swap:accept':'{name} almashishni qabul qildi: “{title}”','swap:decline':'{name} almashish taklifini rad etdi','swap:cancel':'{name} almashish taklifini bekor qildi',
 'promo':'{name} kitobini tavsiya qilmoqda: “{title}”',
 'due:over':'“{title}”: qaytarish muddati o‘tgan!','due:today':'“{title}”: bugun oxirgi kun — kitobni qaytaring','due:tomorrow':'“{title}”: ertaga qaytarish kuni'};
const IC={swap:'repeat',order:'box',ext:'clock',chat:'chat',wait:'bookopen',want:'heart',follow:'user',review:'star',due:'alert'};
const ago=at=>{const m=Math.max(0,Math.round((Date.now()-Date.parse(at))/6e4));if(m<1)return t('hozirgina');if(m<60)return t('{n} daqiqa oldin',{n:m});const h=Math.round(m/60);return h<24?t('{h} soat oldin',{h}):t('{n} kun oldin',{n:Math.round(h/24)})};
export default function Notifs(){const [d,err,rl]=useLoad(()=>api('/notifs'),[],10000);
 useEffect(()=>()=>{api('/notifs/read','POST').catch(()=>{})},[]); // sahifadan chiqqanda o‘qilgan deb belgilanadi
 return <div><div className="pageh"><h1><Icon n="bell" size={26}/> Bildirishnomalar</h1></div><Msg err={err}/>{!d&&!err&&<Loader/>}
  {d?.list.length===0&&<Empty icon="bell" title="Bildirishnoma yo‘q" text="Yangi so‘rovlar, tasdiqlashlar va eslatmalar shu yerda chiqadi."/>}
  {d?.list.length>0&&<><div className="row" style={{justifyContent:'flex-end',marginBottom:10}}><Btn size="sm" variant="ghost" icon="check" onClick={async()=>{await api('/notifs/read','POST');rl()}}>Hammasini o‘qilgan deb belgilash</Btn></div>
   {d.list.map(n=>{let p={};try{p=JSON.parse(n.text)}catch{}const k=n.type.split(':')[0];
    return <div key={n.id} className={'notif'+(n.read?'':' new')+(n.live?' live':'')} role="button" tabIndex={0} onClick={()=>n.link&&go(n.link)} onKeyDown={e=>e.key==='Enter'&&n.link&&go(n.link)}>
     <span className={'nic '+k}><Icon n={IC[k]||'bell'} size={19}/></span><div className="grow"><p>{t(NT[n.type]||n.type,p)}</p><span className="muted sm">{n.live?t('Eslatma'):ago(n.at)}</span></div>{!n.read&&<i className="dot"/>}</div>})}</>}</div>}
