import {useSyncExternalStore} from 'react';
// Token HAR BIR TAB uchun alohida (sessionStorage). Oldingi akkauntlar ro'yxati (parolsiz, faqat ism/email) umumiy (localStorage).
const TK='kitob-token',AK='kitob-accounts';
try{localStorage.removeItem('kitob-store-v1');localStorage.removeItem(TK)}catch{} // eski umumiy tokenni tozalaymiz
const rs=k=>{try{return sessionStorage.getItem(k)}catch{return null}};
const ws=(k,v)=>{try{v==null?sessionStorage.removeItem(k):sessionStorage.setItem(k,v)}catch{}};
const rl=k=>{try{return localStorage.getItem(k)}catch{return null}};
const wl=(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch{}};
let token=rs(TK);let accounts=(()=>{try{const a=JSON.parse(rl(AK));return Array.isArray(a)?a:[]}catch{return[]}})();
const subs=new Set();const emit=()=>subs.forEach(f=>f());
export const store={
 get token(){return token},
 sub:f=>{subs.add(f);return()=>subs.delete(f)},
 setToken(t){token=t||null;ws(TK,token);emit()},
 remember(a){const old=accounts.find(x=>x.email===a.email);accounts=[{...old,...a},...accounts.filter(x=>x.email!==a.email)].slice(0,5);wl(AK,JSON.stringify(accounts));emit()},
 forget(email){accounts=accounts.filter(x=>x.email!==email);wl(AK,JSON.stringify(accounts));emit()}};
// Faqat akkauntlar ro'yxati tablar o'rtasida yangilanadi. Token BOSHQA tabga ta'sir qilmaydi.
try{addEventListener('storage',e=>{if(e.key===AK){try{const a=JSON.parse(e.newValue);accounts=Array.isArray(a)?a:[]}catch{accounts=[]}emit()}})}catch{}
export const useToken=()=>useSyncExternalStore(store.sub,()=>token);
export const useAccounts=()=>useSyncExternalStore(store.sub,()=>accounts);
export const uuid=()=>{try{if(crypto.randomUUID)return crypto.randomUUID()}catch{}
 return'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16)})};
