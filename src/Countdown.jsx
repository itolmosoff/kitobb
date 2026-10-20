import {useState,useEffect} from 'react';import {Icon} from './ui.jsx';import {t} from './i18n';
// "Qaytarishga 3 kun qoldi" / "Bugun oxirgi kun" / "Muddati o'tgan" — jonli taymer (har soniya yangilanadi)
const endMs=s=>{const [y,m,d]=String(s).slice(0,10).split('-').map(Number);return new Date(y,m-1,d,23,59,59).getTime()};
const p2=n=>String(n).padStart(2,'0');
export function Countdown({end}){const [now,setNow]=useState(Date.now());
 useEffect(()=>{const i=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(i)},[]);
 const left=endMs(end)-now;
 if(left<0){const n=Math.ceil(-left/864e5);return <span className="cd late"><Icon n="alert" size={15}/>{t('Muddati {n} kun o‘tgan',{n})}</span>}
 const d=Math.floor(left/864e5),r=left%864e5,clock=p2(Math.floor(r/36e5))+':'+p2(Math.floor(r%36e5/6e4))+':'+p2(Math.floor(r%6e4/1e3));
 return <span className={'cd '+(d===0?'today':d<=2?'warn':'ok')}><Icon n="clock" size={15}/>{d===0?t('Bugun oxirgi kun'):t('Qaytarishga {n} kun qoldi',{n:d})}<time>{clock}</time></span>}
