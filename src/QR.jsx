import {useMemo} from 'react';import QRCode from './vendor/qr/index.js';
export function QR({text,size=200}){
 const d=useMemo(()=>{try{const q=new QRCode(-1,1);q.addData(text);q.make();const n=q.getModuleCount();let p='';
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))p+=`M${c} ${r}h1v1h-1z`;return {n,p}}catch{return null}},[text]);
 if(!d)return null;
 return <svg className="qr" width={size} height={size} viewBox={`-2 -2 ${d.n+4} ${d.n+4}`} shapeRendering="crispEdges" role="img" aria-label="QR"><rect x="-2" y="-2" width={d.n+4} height={d.n+4} fill="#fff"/><path d={d.p} fill="#000"/></svg>}
