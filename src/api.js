import {store} from './store';import {notify} from './sync';
export async function api(path,method='GET',body){
 const h={'Content-Type':'application/json'};if(store.token)h.Authorization='Bearer '+store.token;
 let r;try{r=await fetch('/api'+path,{method,headers:h,body:body===undefined?undefined:JSON.stringify(body)})}
 catch{throw new Error('Tarmoq xatosi: serverga ulanib bo‘lmadi')}
 const d=await r.json().catch(()=>({}));
 if(r.status===401&&store.token&&path!=='/login'&&path!=='/register')store.setToken(null);
 if(!r.ok)throw new Error(d.error||'Xatolik');
 if(method!=='GET'&&path!=='/login'&&path!=='/register')notify(path); // boshqa oynalar ham yangilansin
 return d}
