import http from 'node:http'; import crypto from 'node:crypto'; import os from 'node:os'; import path from 'path'; import fs from 'fs'; import {fileURLToPath} from 'url';
const dir=path.dirname(fileURLToPath(import.meta.url));
// better-sqlite3 o'rniga Node'ning ichki sqlite'i (hech narsa o'rnatish/kompilyatsiya shart emas). Node 22.13+ kerak.
let DatabaseSync;try{({DatabaseSync}=await import('node:sqlite'))}catch{console.error('Node 22.13+ kerak (node -v). Eskiroq 22.x da: node --experimental-sqlite index.js');process.exit(1)}
// Baza kod papkasidan TASHQARIDA saqlanadi: yangi zip/papka ochsangiz ham akkauntlar yo'qolmaydi.
const DATA=process.env.DATA_DIR||path.join(os.homedir(),'.kitob-uz');fs.mkdirSync(DATA,{recursive:true});
const DBF=path.join(DATA,'kitob.db');
if(!fs.existsSync(DBF)){for(const x of ['','-wal','-shm']){const old=path.join(dir,'kitob.db'+x);if(fs.existsSync(old))fs.copyFileSync(old,DBF+x)}} // eski versiyadan ko'chirish
console.log('Ma‘lumotlar bazasi:',DBF);
const raw=new DatabaseSync(DBF);
const db={exec:q=>raw.exec(q),pragma:q=>raw.exec('pragma '+q),prepare:q=>raw.prepare(q),
 transaction:f=>(...a)=>{raw.exec('begin');try{const r=f(...a);raw.exec('commit');return r}catch(e){try{raw.exec('rollback')}catch{}throw e}}};
db.pragma('journal_mode=WAL');
db.exec(`create table if not exists users(id text primary key,name text,created text);
create table if not exists books(id integer primary key,owner_id text,title text,author text,genre text,desc text,price int,copies int,available int,address text);
create table if not exists orders(id integer primary key,key text unique,book_id int,book_title text,renter_id text,owner_id text,name text,phone text,start text,end text,days int,price int,total int,status text,reason text,return_requested int default 0,created text);
create table if not exists history(id integer primary key,order_id int,status text,note text,at text);`);
const today=()=>new Date().toISOString().slice(0,10), now=()=>new Date().toISOString();
const addDays=(s,d)=>{const x=new Date(s);x.setUTCDate(x.getUTCDate()+d);return x.toISOString().slice(0,10)};
// express o'rniga mini-router (hech qanday paket kerak emas)
const routes=[];const app={};
for(const m of ['get','post','put','delete'])app[m]=(p,...h)=>routes.push({m:m.toUpperCase(),re:new RegExp('^'+p.replace(/:(\w+)/g,'(?<$1>[^/]+)')+'$'),h});
const E=(c,m)=>({c,m});
const SYS='kutubxona';
const isAuto=id=>id===SYS||String(id).startsWith('demo-'); // egasi javob bermaydigan akkauntlar: ijara avtomatik tasdiqlanadi
const AV=p=>`case when ${p}avatar is null or ${p}avatar='' then 0 else coalesce(${p}avatar_ts,1) end`;
const BC="b.id,b.owner_id,b.title,b.author,b.genre,b.desc,b.price,b.copies,b.available,b.address,b.deposit,b.cond,b.point,b.free,b.charity,b.featured_until,b.boost_until,b.hot_until,case when b.cover is null or b.cover='' then 0 else coalesce(b.cover_ts,1) end as cover_v";
const auth=(q,s,n)=>{try{const t=(q.headers.authorization||'').slice(7);
 const u=t&&db.prepare('select u.id,u.name,u.email from sessions s join users u on u.id=s.user_id where s.token=? and s.created>?').get(t,new Date(Date.now()-30*864e5).toISOString());
 if(!u)return s.status(401).json({error:'Qayta kiring'});q.u=u;q.token=t;n()}catch{s.status(500).json({error:'Server xatosi'})}};
const wrap=f=>(q,s)=>{try{f(q,s)}catch(e){s.status(e.c||500).json({error:e.m||'Server xatosi'})}};
app.get('/api/me',auth,wrap((q,s)=>s.json(db.prepare(`select id,name,email,username,phone,region,frame,title,banner,${AV('')} as avatar_v from users where id=?`).get(q.u.id))));
// --- akkauntlar serverda: parol scrypt bilan, kirish token bilan ---
const pw={hash:p=>{const salt=crypto.randomBytes(16).toString('hex');return salt+':'+crypto.scryptSync(p,salt,64).toString('hex')},
 ok:(p,h)=>{const [salt,x]=(h||'').split(':');if(!x)return false;const a=Buffer.from(x,'hex'),b=crypto.scryptSync(p,salt,64);return a.length===b.length&&crypto.timingSafeEqual(a,b)}};
const session=id=>{const t=crypto.randomBytes(32).toString('hex');db.prepare('insert into sessions(token,user_id,created) values(?,?,?)').run(t,id,now());return t};
const norm=e=>String(e||'').trim().toLowerCase(),fails=new Map();
const limit=k=>{const r=(fails.get(k)||[]).filter(t=>Date.now()-t<6e5);fails.set(k,r);if(r.length>=10)throw E(429,'Juda ko‘p urinish. 10 daqiqadan keyin qayta urining')};
app.post('/api/register',wrap((q,s)=>{const name=String(q.body.name||'').trim().slice(0,60),email=norm(q.body.email),password=String(q.body.password||'');
 if(!name)throw E(400,'Ismingizni kiriting');if(!/^\S+@\S+\.\S+$/.test(email))throw E(400,'Email noto‘g‘ri');if(password.length<6)throw E(400,'Parol kamida 6 belgi bo‘lsin');
 if(db.prepare('select 1 from users where email=?').get(email))throw E(409,'Bu email band');
 const id=crypto.randomUUID();db.prepare('insert into users(id,name,email,hash,created,username) values(?,?,?,?,?,?)').run(id,name,email,pw.hash(password),now(),'user'+id.replace(/-/g,'').slice(0,8));
 s.json({token:session(id),user:{id,name,email}})}));
app.post('/api/login',wrap((q,s)=>{const email=norm(q.body.email),k=q.socket.remoteAddress+'|'+email;limit(k);
 const u=db.prepare('select id,name,email,hash from users where email=?').get(email);
 if(!u){fails.get(k).push(Date.now());throw E(401,'Bu email ro‘yxatdan o‘tmagan. Avval ro‘yxatdan o‘ting')}
 if(!pw.ok(String(q.body.password||''),u.hash)){fails.get(k).push(Date.now());throw E(401,'Parol noto‘g‘ri')}
 fails.delete(k);s.json({token:session(u.id),user:{id:u.id,name:u.name,email:u.email}})}));
app.post('/api/logout',auth,(q,s)=>{db.prepare('delete from sessions where token=?').run(q.token);s.json({ok:1})});
app.put('/api/me/password',auth,wrap((q,s)=>{const u=db.prepare('select hash from users where id=?').get(q.u.id);
 if(!pw.ok(String(q.body.old||''),u.hash))throw E(400,'Eski parol xato');if(String(q.body.new||'').length<6)throw E(400,'Yangi parol ≥ 6 belgi');
 db.prepare('update users set hash=? where id=?').run(pw.hash(String(q.body.new)),q.u.id);db.prepare('delete from sessions where user_id=? and token<>?').run(q.u.id,q.token);s.json({ok:1})}));
const bookIn=b=>{const ch=b.charity?1:0,fr=ch||b.free?1:0,p=fr?0:+b.price,c=+b.copies,dp=fr?0:+(b.deposit||0);
 if(!String(b.title||'').trim()||!String(b.author||'').trim()||!Number.isInteger(p)||(!fr&&p<=0)||!Number.isInteger(c)||c<0||!Number.isInteger(dp)||dp<0||dp>5e6)throw E(400,'Kitob maydonlari noto‘g‘ri (nom, muallif, narx, nusxa, garov)');
 return [String(b.title).trim().slice(0,120),String(b.author).trim().slice(0,120),String(b.genre||'Roman').slice(0,30),String(b.desc||'').slice(0,1000),p,c,String(b.address||'').slice(0,200),dp,String(b.point||'').trim().slice(0,100),fr,ch,['new','mid','old'].includes(b.cond)?b.cond:'']};
const IMG=/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/]+=*$/;
const imgOk=(v,max)=>{if(typeof v!=='string'||!IMG.test(v)||v.length>max)throw E(400,'Rasm noto‘g‘ri yoki juda katta');return v};
const sendImg=(v,s)=>{const m=/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(v||'');if(!m)return s.status(404).json({error:'Rasm yo‘q'});
 s.setHeader('Content-Type',m[1]);s.setHeader('Cache-Control','public, max-age=604800');s.end(Buffer.from(m[2],'base64'))};
// Qidiruv: so'z BOSHIDA moslik ("sh" -> Shaytanat, Sherlok...; "Tohir Malik"da "ma" -> Malik). O'rtadagi/oxiridagi harflar hisobga olinmaydi.
const nrm=x=>String(x||'').toLowerCase().replace(/[‘’ʻʼ`´′]/g,"'");
const sp=x=>nrm(x).replace(/[^\p{L}\p{N}']+/gu,' ').trim();
app.get('/api/books',wrap((q,s)=>{const {q:t='',genre=''}=q.query,term=sp(t);
 let rows=db.prepare(`select ${BC},u.name owner_name,${AV('u.')} as owner_av,(select count(*) from orders o where o.book_id=b.id) rentals,(select round(avg(stars),1) from book_reviews where book_id=b.id) rating,(select count(*) from book_reviews where book_id=b.id) rcount,u.region owner_region from books b left join users u on u.id=b.owner_id
  where (?='' or b.genre=?) order by case when b.owner_id=? then 1 else 0 end, case when b.owner_id=? then b.id else -b.id end`).all(genre,genre,SYS,SYS);
 if(term){const k=' '+term;rows=rows.filter(b=>(' '+sp(b.title)).includes(k)||(' '+sp(b.author)).includes(k))}
 if(q.query.avail==='1')rows=rows.filter(b=>b.available>0);
 if(q.query.region)rows=rows.filter(b=>b.owner_region===q.query.region);
 if(['new','mid','old'].includes(q.query.cond))rows=rows.filter(b=>b.cond===q.query.cond);
 if(q.query.free==='1')rows=rows.filter(b=>b.free);else if(q.query.free==='charity')rows=rows.filter(b=>b.charity);
 {const pl=sp(q.query.place||'').split(' ').filter(Boolean);if(pl.length)rows=rows.filter(b=>{const w=' '+sp((b.point||'')+' '+(b.address||''));return pl.every(x=>w.includes(' '+x))})}
 const so=q.query.sort;if(!so){const ni=nowIso();rows.sort((a,b)=>(+(b.boost_until>ni))-(+(a.boost_until>ni)))}

 if(so==='popular')rows.sort((a,b)=>b.rentals-a.rentals);else if(so==='cheap')rows.sort((a,b)=>a.price-b.price);else if(so==='pricey')rows.sort((a,b)=>b.price-a.price);
 else if(so==='rating')rows.sort((a,b)=>(b.rating||0)-(a.rating||0)||b.rcount-a.rcount);else if(so==='new')rows.sort((a,b)=>b.id-a.id);
 s.json(rows)}));
app.get('/api/books/:id/cover',(q,s)=>sendImg(db.prepare('select cover v from books where id=?').get(q.params.id)?.v,s));
app.get('/api/users/:id/avatar',(q,s)=>sendImg(db.prepare('select avatar v from users where id=?').get(q.params.id)?.v,s));
app.get('/api/books/:id',wrap((q,s)=>{const b=db.prepare(`select ${BC},u.name owner_name,u.frame owner_frame,u.title owner_title,${AV('u.')} as owner_av,
  (select avg(stars) from reviews where to_id=b.owner_id) owner_rating,(select count(*) from reviews where to_id=b.owner_id) owner_reviews,
  (select count(*) from orders o where o.book_id=b.id) rentals,(select round(avg(stars),1) from book_reviews where book_id=b.id) rating,(select count(*) from book_reviews where book_id=b.id) rcount,u.region owner_region from books b left join users u on u.id=b.owner_id where b.id=?`).get(q.params.id);
 if(!b)throw E(404,'Kitob topilmadi');s.json({...b,owner_rating:b.owner_rating?+(+b.owner_rating).toFixed(1):null})}));
app.get('/api/my-books',auth,(q,s)=>s.json(db.prepare(`select ${BC} from books b where b.owner_id=? order by b.id desc`).all(q.u.id)));
app.post('/api/books',auth,wrap((q,s)=>{const [t,a,g,d,p,c,ad,dp,pt,fr,ch,cd]=bookIn(q.body);const cv=q.body.cover?imgOk(q.body.cover,450000):null;
 const id=Number(db.prepare('insert into books(owner_id,title,author,genre,desc,price,copies,available,address,cover,cover_ts,deposit,point,free,charity,cond) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(q.u.id,t,a,g,d,p,c,c,ad,cv,Date.now(),dp,pt,fr,ch,cd).lastInsertRowid);
 announce(id,q.u,t,a);s.json({id})}));
app.put('/api/books/:id',auth,wrap((q,s)=>{const [t,a,g,d,p,c,ad,dp,pt,fr,ch,cd]=bookIn(q.body);
 const b=db.prepare('select * from books where id=? and owner_id=?').get(q.params.id,q.u.id);if(!b)throw E(404,'Kitob topilmadi');
 const cv=typeof q.body.cover==='string'&&q.body.cover?imgOk(q.body.cover,450000):null;
 const av=Math.max(0,b.available+(c-b.copies));
 db.prepare('update books set title=?,author=?,genre=?,desc=?,price=?,copies=?,available=?,address=?,deposit=?,point=?,free=?,charity=?,cond=? where id=?').run(t,a,g,d,p,c,av,ad,dp,pt,fr,ch,cd,b.id);
 if(q.body.cover===null)db.prepare('update books set cover=null,cover_ts=? where id=?').run(Date.now(),b.id);
 else if(cv)db.prepare('update books set cover=?,cover_ts=? where id=?').run(cv,Date.now(),b.id);
 s.json({ok:1})}));
app.delete('/api/books/:id',auth,wrap((q,s)=>{const b=db.prepare('select id from books where id=? and owner_id=?').get(q.params.id,q.u.id);if(!b)throw E(404,'Kitob topilmadi');
 if(db.prepare("select 1 from orders where book_id=? and status in('new','confirmed','rented')").get(b.id))throw E(409,'Bu kitobda faol ijara bor. Ijara tugagach o‘chirishingiz mumkin');
 db.prepare('delete from books where id=?').run(b.id);db.prepare('delete from favs where book_id=?').run(b.id);s.json({ok:1})}));
const log=(id,st,note='')=>db.prepare('insert into history(order_id,status,note,at) values(?,?,?,?)').run(id,st,note,now());
app.post('/api/orders',auth,wrap((q,s)=>{const {bookId,start,days,name,phone,key}=q.body,d=+days;
 if(!key||!name?.trim()||!/^\+?[\d\s-]{7,15}$/.test(phone||'')||!Number.isInteger(d)||d<1||d>60||!/^\d{4}-\d\d-\d\d$/.test(start||''))throw E(400,'Forma noto‘g‘ri');
 if(start<today())throw E(400,'O‘tgan sanaga ijara mumkin emas');
 const id=db.transaction(()=>{const old=db.prepare('select id from orders where key=?').get(key);if(old)return old.id; // takroriy yuborish
  const b=db.prepare('select * from books where id=?').get(bookId);if(!b)throw E(404,'Kitob mavjud emas');if(b.owner_id===q.u.id)throw E(400,'O‘z kitobingizni ijaraga ololmaysiz');
  {const act2=db.prepare(`select start,"end" e from orders where book_id=? and status in('new','confirmed','rented')`).all(b.id);
   for(let k=0;k<d;k++){const day=addDays(start,k);if(act2.filter(x=>x.start<=day&&day<x.e).length>=b.copies)throw E(409,'Tanlangan sanalarda kitob band')}}
  if(db.prepare('update books set available=available-1 where id=? and available>0').run(b.id).changes!==1)throw E(409,'Bo‘sh nusxa qolmadi');
  const total=b.price*d,st=isAuto(b.owner_id)?'confirmed':'new'; // narx serverda hisoblanadi va saqlanadi
  const oid=db.prepare('insert into orders(key,book_id,book_title,renter_id,owner_id,name,phone,start,end,days,price,total,status,created,deposit) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(key,b.id,b.title,q.u.id,b.owner_id,name.trim(),phone,start,addDays(start,d),d,b.price,total,st,now(),b.deposit||0).lastInsertRowid;
  log(oid,'new');if(st==='confirmed')log(oid,'confirmed','Avtomatik tasdiqlandi');else nt(b.owner_id,'order:new',{title:b.title,name:name.trim()},'/me/rentals');return oid})();
 s.json({id})}));
app.get('/api/orders',auth,(q,s)=>{const col=q.query.as==='owner'?'owner_id':'renter_id';
 s.json(db.prepare(`select o.*,case when b.cover is null or b.cover='' then 0 else coalesce(b.cover_ts,1) end as cover_v,b.author as book_author,(b.id is not null) as book_exists,(select name from users where id=o.owner_id) owner_name,(select name from users where id=o.renter_id) renter_name from orders o left join books b on b.id=o.book_id where o.${col}=? order by o.id desc`).all(q.u.id).map(o=>({...o,overdue:['confirmed','rented'].includes(o.status)&&o.end<today()?1:0,auto:isAuto(o.owner_id)?1:0,late_days:late(o),late_fee:late(o)*o.price,renter_trust:col==='owner_id'?trust(o.renter_id):null,history:db.prepare('select status,note,at from history where order_id=? order by id').all(o.id)})))});
const T={confirm:['owner','new','confirmed'],reject:['owner','new','rejected'],handover:['owner','confirmed','rented'],receive:['owner','rented','returned'],cancel:['customer','new','cancelled']};
app.post('/api/orders/:id/extend',auth,wrap((q,s)=>{const o=party(q),d=+q.body.days;
 if(o.renter_id!==q.u.id||o.status!=='rented')throw E(400,'Faqat ijaradagi kitobni uzaytirish mumkin');
 if(!Number.isInteger(d)||d<1||d>14||o.days+d>120)throw E(400,'1–14 kun tanlang');if(o.ext_days)throw E(409,'Uzaytirish so‘rovi allaqachon yuborilgan');
 if(isAuto(o.owner_id))applyExt(o,d);else{db.prepare('update orders set ext_days=? where id=?').run(d,o.id);log(o.id,'rented','Uzaytirish so‘rovi: +'+d+' kun');nt(o.owner_id,'ext:ask',{title:o.book_title,days:d},'/me/rentals')}
 s.json({ok:1})}));
app.post('/api/orders/:id/extend-ok',auth,wrap((q,s)=>{const o=party(q);if(o.owner_id!==q.u.id||!o.ext_days||o.status!=='rented')throw E(400,'Uzaytirish so‘rovi yo‘q');
 applyExt(o,o.ext_days);nt(o.renter_id,'ext:ok',{title:o.book_title,days:o.ext_days},'/me/rentals');s.json({ok:1})}));
app.post('/api/orders/:id/extend-no',auth,wrap((q,s)=>{const o=party(q);if(o.owner_id!==q.u.id||!o.ext_days)throw E(400,'Uzaytirish so‘rovi yo‘q');
 db.prepare('update orders set ext_days=0 where id=?').run(o.id);log(o.id,'rented','Uzaytirish rad etildi');nt(o.renter_id,'ext:no',{title:o.book_title},'/me/rentals');s.json({ok:1})}));
app.post('/api/orders/:id/:act',auth,wrap((q,s)=>{const {act}=q.params;
 db.transaction(()=>{const o=db.prepare('select * from orders where id=?').get(q.params.id);
  const role=o&&o.owner_id===q.u.id?'owner':o&&o.renter_id===q.u.id?'customer':null;if(!role)throw E(404,'Buyurtma topilmadi');
  if(isAuto(o.owner_id)&&role==='customer'){ // kutubxona kitoblari: egasi yo'q, ijarachi o'zi boshqaradi
   const mv=(st,note)=>{db.prepare('update orders set status=? where id=?').run(st,o.id);log(o.id,st,note);if(st==='rented'&&o.price===0&&!o.swap_id)return gift(o);if(st!=='rented')free(o.book_id);if(st==='returned')shelfDone(o)};
   if(act==='pickup'){if(o.status!=='confirmed')throw E(400,'Bu amal hozir mumkin emas');return mv('rented','Kitob olindi')}
   if(act==='cancel'){if(o.status!=='confirmed')throw E(400,'Bu amal hozir mumkin emas');return mv('cancelled')}
   if(act==='return-request'){if(o.status!=='rented')throw E(400,'Bu amal hozir mumkin emas');return mv('returned','Qaytarildi')}}
  if(act==='return-request'){if(role!=='customer'||o.status!=='rented')throw E(400,'Bu amal hozir mumkin emas');
   db.prepare('update orders set return_requested=1 where id=?').run(o.id);nt(o.owner_id,'order:return',{title:o.book_title},'/me/rentals');return log(o.id,'rented','Qaytarish so‘rovi')}
  const t=T[act];if(!t||t[0]!==role)throw E(403,'Ruxsat yo‘q');if(o.status!==t[1])throw E(400,'Holat tartibi buzilmasin: hozir "'+o.status+'"');
  if(act==='reject'&&!q.body.reason?.trim())throw E(400,'Rad etish sababi kerak');
  db.prepare('update orders set status=?,reason=? where id=?').run(t[2],q.body.reason||o.reason,o.id);log(o.id,t[2],q.body.reason||'');nt(t[0]==='owner'?o.renter_id:o.owner_id,'order:'+act,{title:o.book_title,reason:q.body.reason||''},'/me/rentals');
  if(['rejected','cancelled','returned'].includes(t[2]))free(o.book_id);if(t[2]==='returned')shelfDone(o);if(act==='handover'&&o.price===0&&!o.swap_id)gift(o)})();
 s.json({ok:1})}));

for(const c of ['username','surname','bio','region','phone','created','email','hash','avatar','avatar_ts'])try{db.exec(`alter table users add column ${c} text`)}catch{}
for(const c of ['cover text','cover_ts int'])try{db.exec(`alter table books add column ${c}`)}catch{}
db.exec(`update users set created=coalesce(created,'${now()}'),username=coalesce(username,lower(replace(name,' ','_'))||id);
create table if not exists sessions(token text primary key,user_id text,created text);
create unique index if not exists users_email on users(email);
create table if not exists favs(user_id text,book_id int,primary key(user_id,book_id));
create table if not exists msgs(id integer primary key,order_id int,sender text,text text,at text);
create table if not exists reviews(id integer primary key,order_id int,from_id text,to_id text,stars int,text text,at text,unique(order_id,from_id));
create table if not exists waitlist(user_id text,book_id int,at text,primary key(user_id,book_id));
create table if not exists notifs(id integer primary key,user_id text,type text,text text,link text,at text,read int default 0);
create index if not exists notifs_u on notifs(user_id,id);
create table if not exists follows(follower text,followee text,primary key(follower,followee));
create table if not exists book_reviews(id integer primary key,book_id int,user_id text,stars int,text text,at text,unique(book_id,user_id));
create table if not exists wants(id integer primary key,user_id text,title text,note text,at text,done int default 0);`);
for(const c of ['ext_days int default 0','deposit int default 0'])try{db.exec(`alter table orders add column ${c}`)}catch{}
try{db.exec('alter table books add column deposit int default 0')}catch{}
for(const c of ['hot_until text','cond text','point text','free int default 0','charity int default 0','featured_until text','boost_until text'])try{db.exec(`alter table books add column ${c}`)}catch{}
for(const c of ['swap_id int','gift int default 0'])try{db.exec(`alter table orders add column ${c}`)}catch{}
for(const c of ['frame text','title text','banner text'])try{db.exec(`alter table users add column ${c}`)}catch{}
db.exec(`create table if not exists meta(k text primary key,v text);
create table if not exists swaps(id integer primary key,from_id text,to_id text,from_book int,to_book int,days int,note text,status text,created text);
create table if not exists shelf(id integer primary key,user_id text,book_id int,title text,author text,status text,at text,done_at text);
create unique index if not exists shelf_ub on shelf(user_id,book_id) where book_id is not null;
create table if not exists goals(user_id text,year int,target int,primary key(user_id,year));
create table if not exists readdays(user_id text,day text,primary key(user_id,day));
create table if not exists purchases(id integer primary key,user_id text,item text,book_id int,price int,at text);`);
const SEED=[["O‘tkan kunlar", "Abdulla Qodiriy", "Roman", "O‘zbek adabiyotidagi ilk roman: Otabek va Kumushning muhabbati hamda xonlik davri voqealari."], ["Mehrobdan chayon", "Abdulla Qodiriy", "Roman", "Qo‘qon xonligi muhitida yosh Anvar va Ra’noning fojiali taqdiri haqida tarixiy roman."], ["Otamdan qolgan dalalar", "Tohir Malik", "Roman", "Ota va bola, yer va adolat haqidagi, bir necha avlod hayotini qamragan roman."], ["Shaytanat", "Tohir Malik", "Roman", "Insonning ichki kurashi, vijdon va iymon mavzusidagi mashhur roman."], ["Ikki eshik orasi", "O‘tkir Hoshimov", "Roman", "O‘tkir Hoshimovning xalq hayotini keng ko‘rsatgan, hayotiy romani."], ["Dunyoning ishlari", "O‘tkir Hoshimov", "Roman", "Bolalik xotiralari va hayotiy voqealar asosida yozilgan samimiy qissa."], ["Ulug‘bek xazinasi", "Odil Yoqubov", "Roman", "Mirzo Ulug‘bek davri va uning taqdiri haqida tarixiy roman."], ["Kecha va kunduz", "Cho‘lpon", "Roman", "Cho‘lponning o‘zbek xalqi hayotini tasvirlaydigan mashhur romani."], ["Navoiy", "Oybek", "Roman", "Oybekning Alisher Navoiy hayoti va davri haqidagi tarixiy romani."], ["Jinoyat va jazo", "Fyodor Dostoyevskiy", "Roman", "Raskolnikovning ichki kurashi va vijdon azobi haqidagi klassik roman."], ["Urush va tinchlik", "Lev Tolstoy", "Roman", "Napoleon urushlari davridagi Rossiya jamiyati haqida buyuk epik roman."], ["Anna Karenina", "Lev Tolstoy", "Roman", "Muhabbat, oila va jamiyat qoidalarining to‘qnashuvi haqidagi roman."], ["Alkimyogar", "Paulo Koelo", "Roman", "Yosh cho‘pon Santyagoning orzusi ortidan qilgan sayohati haqida ibratli hikoya."], ["Chol va dengiz", "Ernest Xeminguey", "Roman", "Keksa baliqchining ulkan baliq bilan kurashi haqida qissa."], ["Usta va Margarita", "Mixail Bulgakov", "Roman", "Moskvada shayton paydo bo‘lishi, sevgi va adolat haqidagi mashhur roman."], ["Yuz yillik yolg‘izlik", "Gabriel Garsia Markes", "Roman", "Buendia oilasining bir necha avlodi tarixi, sehrli realizm namunasi."], ["Buyuk Getsbi", "Frensis Skott Fitsjerald", "Roman", "1920-yillar Amerikasida orzu, boylik va sevgi haqidagi roman."], ["Hayvonlar fermasi", "Jorj Oruell", "Roman", "Hokimiyat va tenglik haqidagi masalga o‘xshash satirik qissa."], ["Dune", "Frank Herbert", "Fantastika", "Cho‘l sayyorasi Arrakisdagi hokimiyat va omon qolish kurashi haqida fantastik doston."], ["Xobbit", "J. R. R. Tolkin", "Fantastika", "Bilbo Baggins va mittilar sarguzashti haqida ertakbop asar."], ["Garri Potter va falsafiy tosh", "Joan Rowling", "Fantastika", "Sehrgarlik maktabiga kelgan yetim bolaning birinchi sarguzashtlari."], ["Asos", "Ayzek Azimov", "Fantastika", "Galaktika imperiyasi qulashi va sivilizatsiyani saqlab qolish haqida ilmiy fantastika."], ["Marslik", "Endi Veyr", "Fantastika", "Marsda yolg‘iz qolgan astronavtning omon qolish uchun kurashi."], ["1984", "Jorj Oruell", "Fantastika", "Total nazorat va haqiqat buzib ko‘rsatiladigan jamiyat haqida antiutopiya."], ["Fahrenheit 451", "Rey Bredberi", "Fantastika", "Kitoblar yoqib tashlanadigan kelajak haqidagi distopik roman."], ["Sherlok Xolms sarguzashtlari", "Artur Konan Doyl", "Detektiv", "Dono detektiv Xolms va doktor Vatsonning qiziqarli ishlari."], ["Nil daryosidagi o‘lim", "Agata Kristi", "Detektiv", "Nil bo‘ylab kemada sodir bo‘lgan qotillikni Puaro ochadi."], ["Sharq ekspressidagi qotillik", "Agata Kristi", "Detektiv", "Qorga tushib qolgan poyezdda sodir bo‘lgan jumboqli qotillik."], ["Da Vinchi siri", "Den Braun", "Detektiv", "Luvrdagi qotillikdan boshlangan sirli izlanish haqida triller."], ["Sapiens", "Yuval Harari", "Tarix", "Insoniyatning ibtidosidan bugungi kungacha bo‘lgan qisqacha tarixi."], ["Homo Deus", "Yuval Harari", "Tarix", "Insoniyatning kelajagi: texnologiya va inson taqdiri haqida mulohazalar."], ["Boburnoma", "Zahiriddin Muhammad Bobur", "Tarix", "Bobur Mirzoning xotiralari: hayoti, yurishlari va tabiat tasvirlari."], ["Temur tuzuklari", "Amir Temur", "Tarix", "Amir Temurga nisbat beriladigan davlat boshqaruvi va harbiy ish qoidalari."], ["Qurol, mikroblar va po‘lat", "Jared Daymond", "Tarix", "Jamiyatlar taraqqiyoti nega turlicha bo‘lganini tushuntiruvchi tadqiqot."], ["Vaqtning qisqacha tarixi", "Stiven Xoking", "Ilmiy", "Koinot, qora o‘ralar va vaqt tabiati haqida ommabop kitob."], ["Kosmos", "Karl Sagan", "Ilmiy", "Koinot va unda insonning o‘rni haqida ilhomlantiruvchi kitob."], ["Xudbin gen", "Richard Dokinz", "Ilmiy", "Evolyutsiyaga genlar nuqtai nazaridan qaraydigan mashhur kitob."], ["Tez va sekin fikrlash", "Daniel Kaneman", "Psixologiya", "Fikrlashimizning ikki tizimi va qarorlardagi xatolar haqida."], ["Atom odatlar", "Jeyms Klir", "Psixologiya", "Kichik odatlar orqali hayotni o‘zgartirishning amaliy yo‘llari."], ["Insonning ma’no izlashi", "Viktor Frankl", "Psixologiya", "Qamoq lagerida omon qolgan psixiatr tajribasi va hayot ma’nosi haqida."], ["Boy ota, kambag‘al ota", "Robert Kiyosaki", "Biznes", "Pul va moliyaviy savodxonlik haqida ikki xil qarash."], ["Kichkina shahzoda", "Antuan de Sent-Ekzyuperi", "Bolalar", "Kattalar uchun ham falsafiy ertak: do‘stlik, sevgi va mas’uliyat haqida."], ["Sariq devni minib", "Xudoyberdi To‘xtaboyev", "Bolalar", "Xudoyberdi To‘xtaboyevning bolalar uchun sarguzasht qissasi."], ["Alisa mo‘jizalar mamlakatida", "Lyuis Kerroll", "Bolalar", "Quyon inidan boshlangan g‘alati sarguzasht haqida ertak."], ["Xamsa", "Alisher Navoiy", "She’riyat", "Alisher Navoiyning beshta dostondan iborat buyuk asari."], ["Ruboiylar", "Umar Xayyom", "She’riyat", "Umar Xayyomning hikmat va tafakkurga to‘la to‘rtliklari."]];
db.prepare('insert or ignore into users(id,name,created,username) values(?,?,?,?)').run(SYS,'V A Y R O',now(),SYS);
db.prepare('update users set name=? where id=?').run('V A Y R O',SYS);
if(!db.prepare('select 1 from books where owner_id=?').get(SYS)){const ins=db.prepare('insert into books(owner_id,title,author,genre,desc,price,copies,available,address) values(?,?,?,?,?,?,?,?,?)');
 SEED.forEach(([t,a,g,d],i)=>{const c=i%3+1;ins.run(SYS,t,a,g,d,2000+(i%4)*500,c,c,'Toshkent, V A Y R O kutubxona punkti')})}
else SEED.forEach(([t,a,g,d])=>db.prepare("update books set desc=? where owner_id=? and title=? and desc like '%asari. Janr:%'").run(d,SYS,t));

// --- V A Y R O platformasi gavjum ko'rinishi uchun demo foydalanuvchilar va ularning kitoblari (faqat bir marta qo'shiladi) ---
const DEMO=[
 ['alisher','Alisher_Bookworm','alisher_bookworm','Toshkent','Fantastika va biznes kitoblarini yig‘aman.','Toshkent, Chilonzor, 9-kvartal',[
  ['Uzuklar hukmdori: Halqa birodarligi','J. R. R. Tolkin','Fantastika','Frodo va do‘stlarining Yagona Uzukni yo‘q qilish yo‘lidagi xavfli safari boshlanadi.'],
  ['Ender o‘yini','Orson Skott Kard','Fantastika','O‘ta zehnli bola o‘zga sayyoraliklarga qarshi urush uchun tayyorlanadi.'],
  ['Metro 2033','Dmitriy Gluxovskiy','Fantastika','Yadroviy urushdan keyin Moskva metrosida omon qolganlar hayoti haqida roman.'],
  ['Noldan birgacha','Piter Til','Biznes','Yangi narsa yaratish va startap qurish haqida amaliy fikrlar.']]],
 ['malika','Malika_Reads','malika_reads','Samarqand','Klassik romanlarni yaxshi ko‘raman.','Samarqand, Registon yaqini',[
  ['Sarob','Abdulla Qahhor','Roman','Ziyolilar taqdiri va ma’naviy tanlov haqidagi o‘zbek romani.'],
  ['Sinchalak','Abdulla Qahhor','Roman','Qishloq hayoti va oddiy odamlar taqdiri haqida qissa.'],
  ['Jeyn Ayr','Sharlotta Bronte','Roman','Yetim qizning mustaqil hayot va sevgi uchun kurashi haqida klassik roman.'],
  ['Kichik ayollar','Luiza Olkott','Roman','To‘rt opa-singilning o‘sishi, orzulari va oilaviy mehr haqida roman.']]],
 ['jamshid','Jamshid_Lib','jamshid_lib','Toshkent','Detektiv va ilm-fan ishqibozi.','Toshkent, Yunusobod, 4-mavze',[
  ['Baskervillar iti','Artur Konan Doyl','Detektiv','Xolms va Vatsonning vahimali afsona izidagi tergovi.'],
  ['Va keyin hech kim qolmadi','Agata Kristi','Detektiv','Orolga to‘plangan mehmonlar birin-ketin sirli ravishda halok bo‘la boshlaydi.'],
  ['Katta savollarga qisqa javoblar','Stiven Xoking','Ilmiy','Koinot va inson kelajagi haqidagi savollarga qisqa, aniq javoblar.'],
  ['Chuqur ish','Kal Nyuport','Biznes','Chalg‘itishlar davrida diqqatni jamlab ishlash usullari.']]],
 ['dilnoza','Dilnoza_Kitob','dilnoza_kitob','Buxoro','Kitob — eng yaxshi do‘st.','Buxoro, Lyabi Hovuz atrofi',[
  ['Shum bola','G‘afur G‘ulom','Roman','Quvnoq va tentak bolaning urush yillaridagi sarguzashtlari.'],
  ['Ufq','Said Ahmad','Roman','Urush va tinch hayot, odamiylik haqidagi o‘zbek romani.'],
  ['Ona','Maksim Gorkiy','Roman','Ona va o‘g‘lining kurash yo‘li haqida mashhur roman.'],
  ['Mening ismim Qizil','Orxon Pamuk','Roman','XVI asr Istanbulida miniatyurachi ustalar orasidagi sirli qotillik.']]],
 ['sardor','Sardor_Pages','sardor_pages','Andijon','Shaxsiy rivojlanish kitoblari.','Andijon, Bobur ko‘chasi',[
  ['Yetti odat','Stiven Kovi','Psixologiya','Samarali odamlarning yetti odati haqida mashhur kitob.'],
  ['Do‘st orttirish va odamlarga ta’sir qilish san’ati','Deyl Karnegi','Psixologiya','Muloqot va munosabatlar haqidagi klassik qo‘llanma.'],
  ['Fikrlash va boy bo‘lish','Napoleon Xill','Biznes','Muvaffaqiyatga erishish tamoyillari haqidagi kitob.']]],
 ['nodira','Nodira_Library','nodira_library','Namangan','Bolalar uchun kitoblar to‘plaganman.','Namangan, Davlatobod',[
  ['Pippi Uzunchorap','Astrid Lindgren','Bolalar','Kuchli va quvnoq qizcha Pippining sarguzashtlari.'],
  ['Narniya yilnomalari: Sher, jodugar va shkaf','K. S. Lyuis','Bolalar','To‘rt bolaning sehrli shkaf orqali Narniya diyoriga tushishi.'],
  ['Robinzon Kruzo','Daniel Defo','Roman','Sahroi orolda yolg‘iz qolgan dengizchining omon qolish kurashi.'],
  ['Tom Soyerning sarguzashtlari','Mark Tven','Bolalar','Quvnoq bola Tomning qiziqarli sarguzashtlari.']]],
 ['bekzod','Bekzod_Reader','bekzod_reader','Farg‘ona','Tarix va jahon adabiyoti.','Farg‘ona, Marg‘ilon yo‘li',[
  ['Ipak yo‘li','Piter Frankopan','Tarix','Ipak yo‘li bo‘ylab dunyo tarixiga yangicha nazar.'],
  ['Chingizxon va zamonaviy dunyoning yaratilishi','Jek Ueterford','Tarix','Mo‘g‘ul imperiyasining dunyo taraqqiyotiga ta’siri haqida tadqiqot.'],
  ['Kitob o‘g‘risi','Markus Zusak','Roman','Natsistlar Germaniyasida kitobni sevgan qizning hikoyasi.']]],
 ['zilola','Zilola_Books','zilola_books','Toshkent','Fantastika va sehr — sevimli janrim.','Toshkent, Mirobod, Shahriston',[
  ['Garri Potter va sirlar xonasi','Joan Rowling','Fantastika','Xogvartsdagi ikkinchi yil va sirli xona haqida.'],
  ['Och o‘yinlar','Syuzanna Kollinz','Fantastika','O‘lim o‘yinida omon qolish uchun kurashgan qizning hikoyasi.'],
  ['Gulliverning sayohatlari','Jonatan Svift','Fantastika','Gulliverning mitti va devlar yurtlariga g‘aroyib safarlari.']]],
 ['otabek','Otabek_Shelf','otabek_shelf','Qarshi','O‘zbek va qirg‘iz adabiyoti muxlisi.','Qarshi, Mustaqillik ko‘chasi',[
  ['Qutlug‘ qon','Oybek','Roman','Xonlik davri va xalq orzulari haqida tarixiy roman.'],
  ['Oq kema','Chingiz Aytmatov','Roman','Ikki dunyo orasida qolgan bolaning orzu va fojiasi haqida qissa.'],
  ['Jamila','Chingiz Aytmatov','Roman','Qirg‘iz qishlog‘ida muhabbat va jasorat haqida qissa.']]],
 ['shahnoza','Shahnoza_Reads','shahnoza_reads','Xorazm','She’riyat va klassik dramalar.','Urganch, Al-Xorazmiy ko‘chasi',[
  ['Romeo va Juletta','Vilyam Shekspir','She’riyat','Ikki dushman xonadon yoshlarining fojiali sevgisi haqida tragediya.'],
  ['Aql va tuyg‘u','Jeyn Ostin','Roman','Ikki opa-singilning sevgi va hayotiy tanlovlari haqida roman.']]],
 ['gulnora','Gulnora_Books','gulnora_books','Jizzax','O‘zbek adabiyoti muxlisi.','Jizzax, Sharof Rashidov ko‘chasi',[
  ['Ikki eshik orasi','O‘tkir Hoshimov','Roman','Hayot, sevgi va insoniy qadriyatlar haqida mashhur asar.'],['Dunyoning ishlari','O‘tkir Hoshimov','Roman','Hayotiy hikoyalarga boy qissa.']]],
 ['rustam','Rustam_Shelf','rustam_shelf','Sirdaryo','Biznes va rivojlanish kitoblari.','Guliston, Mustaqillik ko‘chasi',[
  ['Boy ota, kambag‘al ota','Robert Kiyosaki','Biznes','Moliyaviy savodxonlik haqida mashhur kitob.'],['Atom odatlar','Jeyms Klir','Psixologiya','Kichik odatlar orqali katta o‘zgarishlar haqida kitob.']]],
 ['sevara','Sevara_Reads','sevara_reads','Navoiy','Jahon klassikasini yaxshi ko‘raman.','Navoiy, Navoiy ko‘chasi',[
  ['Qor','Orxon Pamuk','Roman','Sovuq shaharchada siyosat va sevgi haqida roman.'],['Yuz yillik yolg‘izlik','Gabriel Garsia Markes','Roman','Buendia oilasining bir necha avlodi haqida sehrli realizm romani.']]],
 ['farhod','Farhod_Lib','farhod_lib','Surxondaryo','Detektiv va klassika.','Termiz, Alisher Navoiy ko‘chasi',[
  ['Qizil ipdagi etyud','Artur Konan Doyl','Detektiv','Xolmsning birinchi mashhur tergovi.'],['Gobsek','Onore de Balzak','Roman','Pul va ochko‘zlik haqida qissa.']]],
 ['aziza','Aziza_Kitob','aziza_kitob','Qoraqalpog‘iston','Bolalar va tarix kitoblari.','Nukus, Berdaq ko‘chasi',[
  ['Boburnoma','Zahiriddin Muhammad Bobur','Tarix','Bobur xotiralari — davr va hayot haqida tarixiy manba.'],['Matilda','Roald Dal','Bolalar','Zehnli qizcha va uning sehrli kuchi haqida kitob.']]],
 ['eldor','Eldor_Pages','eldor_pages','Toshkent viloyati','Psixologiya va ilm-fan.','Chirchiq, Amir Temur ko‘chasi',[
  ['Fikrlash — tez va sekin','Daniel Kaneman','Psixologiya','Fikrlash tizimlari va qarorlar haqida kitob.'],['Kosmos','Karl Sagan','Ilmiy','Koinot haqida mashhur ilmiy-ommabop kitob.']]]];
const REGN={Toshkent:'Toshkent shahri',Qarshi:'Qashqadaryo'}; // viloyat nomlarini bir xillashtirish
{const iu=db.prepare('insert or ignore into users(id,name,created,username,region,bio) values(?,?,?,?,?,?)'),
  ib=db.prepare('insert into books(owner_id,title,author,genre,desc,price,copies,available,address) values(?,?,?,?,?,?,?,?,?)');
 const todo=[];
 for(const [k,name,un,reg,bio,addr,books] of DEMO){const id='demo-'+k;const rg=REGN[reg]||reg;iu.run(id,name,now(),un,rg,bio);db.prepare('update users set name=?,region=? where id=?').run(name,rg,id);
  if(!db.prepare('select 1 from books where owner_id=?').get(id))books.forEach((b,j)=>(todo[j]=todo[j]||[]).push([id,addr,b]))}
 let n=0;for(const row of todo)for(const [id,addr,[t,a,g,d]] of row){const c=1+(n%3===0?1:0)+(n%7===0?1:0);ib.run(id,t,a,g,d,1500+(n%6)*500,c,c,addr);n++}} // egalar navbatma-navbat aralashib chiqadi
const cnt=(sql,...a)=>db.prepare(sql).get(...a).n;
app.get('/api/users/:id',auth,wrap((q,s)=>{const id=q.params.id;
 const u=db.prepare(`select id,name,surname,username,bio,region,created,phone,frame,title,banner,${AV('')} as avatar_v from users where id=?`).get(id);if(!u)throw E(404,'Foydalanuvchi topilmadi');
 const r=db.prepare('select avg(stars) a,count(*) n from reviews where to_id=?').get(id);
 const p={id,avatar_v:u.avatar_v,name:u.name,surname:u.surname||'',username:u.username||'user'+id.replace(/-/g,'').slice(0,8),bio:u.bio||'',region:u.region||'',created:u.created,frame:u.frame||'',title:u.title||'',banner:u.banner||'',rating:r.a?+r.a.toFixed(1):null,reviewCount:r.n};
 p.books=db.prepare(`select ${BC} from books b where b.owner_id=? order by b.id desc`).all(id);
 p.reviews=db.prepare(`select r.stars,r.text,r.at,u.name,u.id uid,${AV('u.')} as avatar_v from reviews r join users u on u.id=r.from_id where r.to_id=? order by r.id desc`).all(id);
 if(id===q.u.id){p.phone=u.phone||'';const done=cnt("select count(*) n from orders where status='returned' and (owner_id=? or renter_id=?)",id,id);
  p.stats={books:p.books.length,lent:cnt("select count(*) n from orders where owner_id=? and status in('rented','returned')",id),borrowed:cnt("select count(*) n from orders where renter_id=? and status in('rented','returned')",id),done,reviews:r.n,rating:p.rating};
  p.xp=xpOf(id);p.level=Math.floor(p.xp/50)+1}
 Object.assign(p,social(id,p,q.u.id));s.json(p)}));
app.put('/api/me/profile',auth,wrap((q,s)=>{const {name,surname,username,bio,region,phone}=q.body;
 if(!name?.trim()||!/^[a-z0-9_]{3,20}$/.test(username||''))throw E(400,'Ism va username kerak (3–20 belgi: a-z, 0-9, _)');
 if(phone&&!/^\+?[\d\s-]{7,15}$/.test(phone))throw E(400,'Telefon noto‘g‘ri');
 if(db.prepare('select 1 from users where username=? and id<>?').get(username,q.u.id))throw E(409,'Bu username band');
 db.prepare('update users set name=?,surname=?,username=?,bio=?,region=?,phone=? where id=?').run(name.trim(),surname||'',username,(bio||'').slice(0,300),region||'',phone||'',q.u.id);s.json({ok:1})}));
app.put('/api/me/avatar',auth,wrap((q,s)=>{const v=q.body.image;
 if(v===null||v==='')db.prepare('update users set avatar=null,avatar_ts=? where id=?').run(Date.now(),q.u.id);
 else db.prepare('update users set avatar=?,avatar_ts=? where id=?').run(imgOk(v,250000),Date.now(),q.u.id);s.json({ok:1})}));
app.get('/api/fav-ids',auth,(q,s)=>s.json(db.prepare('select book_id from favs where user_id=?').all(q.u.id).map(x=>x.book_id)));
app.get('/api/favs',auth,(q,s)=>s.json(db.prepare(`select ${BC},u.name owner_name,${AV('u.')} as owner_av from books b join favs f on f.book_id=b.id left join users u on u.id=b.owner_id where f.user_id=? order by f.rowid desc`).all(q.u.id)));
app.post('/api/favs/:id',auth,(q,s)=>{const r=db.prepare('delete from favs where user_id=? and book_id=?').run(q.u.id,q.params.id);if(!r.changes)db.prepare('insert or ignore into favs values(?,?)').run(q.u.id,q.params.id);s.json({fav:!r.changes})});
const party=q=>{const o=db.prepare('select * from orders where id=? and (owner_id=? or renter_id=?)').get(q.params.id,q.u.id,q.u.id);if(!o)throw E(404,'Buyurtma topilmadi');return o};
app.get('/api/chat/:id',auth,wrap((q,s)=>{party(q);s.json(db.prepare('select m.id,m.text,m.at,m.sender,u.name from msgs m join users u on u.id=m.sender where order_id=? order by m.id').all(q.params.id).map(x=>({...x,mine:x.sender===q.u.id})))}));
app.post('/api/chat/:id',auth,wrap((q,s)=>{const o=party(q),t=(q.body.text||'').trim();if(!t||t.length>500)throw E(400,'Xabar 1–500 belgi');
 db.prepare('insert into msgs(order_id,sender,text,at) values(?,?,?,?)').run(o.id,q.u.id,t,now());nt(o.owner_id===q.u.id?o.renter_id:o.owner_id,'chat',{title:o.book_title},'/me/rentals');s.json({ok:1})}));
app.post('/api/review/:id',auth,wrap((q,s)=>{const o=party(q),st=+q.body.stars;
 if(o.status!=='returned')throw E(400,'Baho ijara tugagach beriladi');if(!Number.isInteger(st)||st<1||st>5)throw E(400,'1–5 yulduz tanlang');
 try{db.prepare('insert into reviews(order_id,from_id,to_id,stars,text,at) values(?,?,?,?,?,?)').run(o.id,q.u.id,o.owner_id===q.u.id?o.renter_id:o.owner_id,st,(q.body.text||'').slice(0,300),now())}catch{throw E(409,'Siz allaqachon baho bergansiz')}s.json({ok:1})}));
app.get('/api/book-of-day',auth,(q,s)=>{const a=db.prepare(`select ${BC},u.name owner_name from books b left join users u on u.id=b.owner_id order by b.id`).all();s.json(a.length?a[Math.floor(Date.now()/864e5)%a.length]:null)});
// ================== YANGI IMKONIYATLAR ==================
const late=o=>['confirmed','rented'].includes(o.status)&&o.end<today()?Math.round((Date.parse(today())-Date.parse(o.end))/864e5):0; // kechikkan kunlar
const nt=(uid,type,data={},link='')=>{if(!uid||isAuto(uid))return;db.prepare('insert into notifs(user_id,type,text,link,at) values(?,?,?,?,?)').run(uid,type,JSON.stringify(data),link,now())};
const free=id=>{db.prepare('update books set available=min(copies,available+1) where id=?').run(id); // nusxa bo'shadi: navbatdagilarga xabar
 const b=db.prepare('select title from books where id=?').get(id);if(!b)return;
 for(const w of db.prepare('select user_id from waitlist where book_id=?').all(id))nt(w.user_id,'wait',{title:b.title},'/book/'+id);
 db.prepare('delete from waitlist where book_id=?').run(id)};
const applyExt=(o,d)=>{const end=addDays(o.end,d),days=o.days+d;db.prepare('update orders set "end"=?,days=?,total=?,ext_days=0 where id=?').run(end,days,o.price*days,o.id);log(o.id,'rented','Uzaytirildi: +'+d+' kun → '+end)};
const trust=id=>{const r=db.prepare(`select o."end" e,(select at from history h where h.order_id=o.id and h.status='returned' order by h.id desc limit 1) ret from orders o where o.renter_id=? and o.status='returned'`).all(id);if(!r.length)return null;
 const ok=r.filter(x=>x.ret&&x.ret.slice(0,10)<=x.e).length/r.length,rv=db.prepare('select avg(stars) a from reviews where to_id=?').get(id).a;
 return Math.round(100*(.7*ok+.3*(rv?rv/5:ok)))};
const announce=(id,u,t,a)=>{for(const f of db.prepare('select follower from follows where followee=?').all(u.id))nt(f.follower,'follow:book',{name:u.name,title:t},'/book/'+id);
 const k=' '+sp(t),k2=' '+sp(a);
 for(const w of db.prepare('select user_id,title from wants where done=0').all()){const wt=' '+sp(w.title);if(w.user_id!==u.id&&wt.trim()&&(k.includes(wt)||k2.includes(wt)))nt(w.user_id,'want',{title:t},'/book/'+id)}};
db.prepare("update users set region='' where id=?").run(SYS); // V A Y R O platforma kitoblari viloyatga bog'lanmaydi
const BADGES=[['first','award','Birinchi ijara','Birinchi kitobingizni ijaraga oldingiz',s=>s.borrowed>=1],['lender','box','Kitob egasi','Kitobingiz kamida 1 marta ijaraga berildi',s=>s.lent>=1],
 ['lender10','library','Kutubxonachi','10 marta kitob ijaraga berdingiz',s=>s.lent>=10],['reader5','book','Kitobxon','5 ta kitob o‘qidingiz',s=>s.borrowed>=5],
 ['generous','tag','Saxiy','5 ta kitob e’lon qildingiz',s=>s.books>=5],['trusted','shield','Ishonchli','Ishonch darajasi 90%+ (kamida 3 ijara)',s=>s.trust>=90&&s.done>=3],
 ['critic','chat','Tanqidchi','3 ta kitobga baho berdingiz',s=>s.given>=3],['star','star','Yulduz','4.5+ reyting (kamida 3 sharh)',s=>s.rating>=4.5&&s.rcount>=3],['pro','award','Faol a’zo','100+ XP to‘pladingiz',s=>s.xp>=100],
 ['donor','heart','Sovg‘achi','Kamida 1 ta kitobni sovg‘a qildingiz',s=>s.gifts>=1],['charity3','award','Xayriyachi','3 ta kitobni xayriyaga berdingiz',s=>s.charity>=3],['swapper','repeat','Almashtiruvchi','Kitob almashishni yakunladingiz',s=>s.swaps>=1],
 ['streak7','clock','Barqaror','7 kun ketma-ket o‘qidingiz',s=>s.best>=7],['goal','trophy','Maqsad egasi','Yillik o‘qish maqsadiga erishdingiz',s=>s.goalHit]];
const social=(id,p,me)=>{const lent=cnt("select count(*) n from orders where owner_id=? and status in('rented','returned')",id),borrowed=cnt("select count(*) n from orders where renter_id=? and status in('rented','returned')",id),
 done=cnt("select count(*) n from orders where status='returned' and (owner_id=? or renter_id=?)",id,id),given=cnt('select count(*) n from book_reviews where user_id=?',id),tr=trust(id);
 const st={lent,borrowed,done,given,books:p.books.length,trust:tr,rating:p.rating||0,rcount:p.reviewCount,xp:xpOf(id),gifts:cnt('select count(*) n from orders where owner_id=? and gift>0',id),charity:cnt('select count(*) n from orders where owner_id=? and gift=2',id),swaps:cnt('select count(distinct swap_id) n from orders where swap_id is not null and status=\'returned\' and (owner_id=? or renter_id=?)',id,id),best:runs(daySet(id)),goalHit:(g=>!!g.target&&g.done>=g.target)(goalOf(id))};
 return {followers:cnt('select count(*) n from follows where followee=?',id),following:cnt('select count(*) n from follows where follower=?',id),is_following:!!db.prepare('select 1 from follows where follower=? and followee=?').get(me,id),
  trust:tr,pub:{lent,borrowed},badges:BADGES.map(([bid,icon,name,desc,f])=>({id:bid,icon,name,desc,earned:!!f(st)}))}};
app.post('/api/follow/:id',auth,wrap((q,s)=>{const id=q.params.id;if(id===q.u.id)throw E(400,'O‘zingizni kuzata olmaysiz');if(!db.prepare('select 1 from users where id=?').get(id))throw E(404,'Foydalanuvchi topilmadi');
 const r=db.prepare('delete from follows where follower=? and followee=?').run(q.u.id,id);if(!r.changes){db.prepare('insert into follows values(?,?)').run(q.u.id,id);nt(id,'follow:user',{name:q.u.name},'/user/'+q.u.id)}s.json({following:!r.changes})}));
app.get('/api/regions',auth,(q,s)=>s.json(db.prepare("select u.region r,count(*) n from books b join users u on u.id=b.owner_id where u.region is not null and u.region<>'' group by u.region order by u.region").all()));
app.get('/api/trending',auth,wrap((q,s)=>{const since=new Date(Date.now()-7*864e5).toISOString();
 s.json(db.prepare(`select ${BC},u.name owner_name,${AV('u.')} owner_av,(select count(*) from orders o where o.book_id=b.id and o.created>?) wk,(select count(*) from orders o where o.book_id=b.id) rentals,(select round(avg(stars),1) from book_reviews where book_id=b.id) rating from books b left join users u on u.id=b.owner_id order by wk desc,rentals desc,b.id desc limit 8`).all(since).filter(r=>r.rentals>0))}));
app.get('/api/books/:id/similar',auth,wrap((q,s)=>{const b=db.prepare('select id,author,genre from books where id=?').get(q.params.id);if(!b)return s.json([]);
 s.json(db.prepare(`select ${BC},u.name owner_name,${AV('u.')} owner_av,(select round(avg(stars),1) from book_reviews where book_id=b.id) rating from books b left join users u on u.id=b.owner_id where b.id<>? and (b.author=? or b.genre=?) order by (b.author=?) desc,(b.available>0) desc,b.id desc limit 6`).all(b.id,b.author,b.genre,b.author))}));
app.get('/api/books/:id/extra',auth,wrap((q,s)=>{const id=+q.params.id;if(!db.prepare('select 1 from books where id=?').get(id))throw E(404,'Kitob topilmadi');
 const reviews=db.prepare(`select r.stars,r.text,r.at,u.name,u.id uid,${AV('u.')} avatar_v from book_reviews r join users u on u.id=r.user_id where r.book_id=? order by r.id desc limit 30`).all(id);
 s.json({shelf:db.prepare('select id,status from shelf where user_id=? and book_id=?').get(q.u.id,id)||null,queue:cnt('select count(*) n from waitlist where book_id=?',id),waiting:!!db.prepare('select 1 from waitlist where book_id=? and user_id=?').get(id,q.u.id),reviews,
  can:!!db.prepare("select 1 from orders where book_id=? and renter_id=? and status='returned'").get(id,q.u.id)&&!reviews.some(r=>r.uid===q.u.id),
  busy:db.prepare(`select start,"end" e from orders where book_id=? and status in('new','confirmed','rented') and "end">=?`).all(id,today()).map(x=>({start:x.start,end:x.e}))})}));
app.post('/api/books/:id/review',auth,wrap((q,s)=>{const st=+q.body.stars,id=+q.params.id;if(!Number.isInteger(st)||st<1||st>5)throw E(400,'1–5 yulduz tanlang');
 if(!db.prepare("select 1 from orders where book_id=? and renter_id=? and status='returned'").get(id,q.u.id))throw E(403,'Kitobni o‘qib qaytargandan keyin baho berasiz');
 try{db.prepare('insert into book_reviews(book_id,user_id,stars,text,at) values(?,?,?,?,?)').run(id,q.u.id,st,String(q.body.text||'').slice(0,300),now())}catch{throw E(409,'Siz bu kitobga allaqachon baho bergansiz')}
 const b=db.prepare('select owner_id,title from books where id=?').get(id);if(b)nt(b.owner_id,'review',{title:b.title,stars:st},'/book/'+id);s.json({ok:1})}));
app.post('/api/waitlist/:id',auth,wrap((q,s)=>{const b=db.prepare('select id,owner_id,available from books where id=?').get(q.params.id);if(!b)throw E(404,'Kitob topilmadi');if(b.owner_id===q.u.id)throw E(400,'O‘z kitobingiz');
 const r=db.prepare('delete from waitlist where user_id=? and book_id=?').run(q.u.id,b.id);
 if(!r.changes){if(b.available>0)throw E(400,'Kitob hozir mavjud — band qilishingiz mumkin');db.prepare('insert into waitlist values(?,?,?)').run(q.u.id,b.id,now())}s.json({waiting:!r.changes})}));
app.get('/api/wants',auth,wrap((q,s)=>{const books=db.prepare('select id,title,author from books').all().map(b=>({id:b.id,t:' '+sp(b.title),a:' '+sp(b.author)}));
 s.json(db.prepare(`select w.id,w.title,w.note,w.at,w.user_id uid,u.name,${AV('u.')} avatar_v from wants w join users u on u.id=w.user_id where w.done=0 order by w.id desc limit 100`).all()
  .map(w=>{const k=' '+sp(w.title),m=books.filter(b=>k.trim()&&(b.t.includes(k)||b.a.includes(k)));return {...w,mine:w.uid===q.u.id,found:m.length,book_id:m[0]?.id||null}}))}));
app.post('/api/wants',auth,wrap((q,s)=>{const t=String(q.body.title||'').trim().slice(0,120),n=String(q.body.note||'').trim().slice(0,200);if(t.length<2)throw E(400,'Kitob nomini yozing');
 if(cnt('select count(*) n from wants where user_id=? and done=0',q.u.id)>=5)throw E(400,'Bir vaqtda 5 tadan ko‘p so‘rov qoldirib bo‘lmaydi');
 const id=Number(db.prepare('insert into wants(user_id,title,note,at) values(?,?,?,?)').run(q.u.id,t,n,now()).lastInsertRowid);s.json({id})}));
app.delete('/api/wants/:id',auth,wrap((q,s)=>{if(!db.prepare('delete from wants where id=? and user_id=?').run(q.params.id,q.u.id).changes)throw E(404,'Topilmadi');s.json({ok:1})}));
app.get('/api/notifs',auth,(q,s)=>{const rem=db.prepare("select id,book_title,\"end\" e from orders where renter_id=? and status='rented' and \"end\"<=?").all(q.u.id,addDays(today(),1))
  .map(o=>({id:'r'+o.id,type:o.e<today()?'due:over':o.e===today()?'due:today':'due:tomorrow',text:JSON.stringify({title:o.book_title}),link:'/me/rentals',at:now(),read:0,live:1}));
 const list=db.prepare('select id,type,text,link,at,read from notifs where user_id=? order by id desc limit 40').all(q.u.id);
 s.json({unread:cnt('select count(*) n from notifs where user_id=? and read=0',q.u.id)+rem.length,list:[...rem,...list]})});
app.post('/api/notifs/read',auth,(q,s)=>{db.prepare('update notifs set read=1 where user_id=?').run(q.u.id);s.json({ok:1})});
app.get('/api/leaderboard',auth,wrap((q,s)=>{const S="o.status in('rented','returned')";
 const L=db.prepare(`select u.id,u.name,u.region,${AV('u.')} avatar_v,u.frame,u.title,count(*) n,sum(o.total) money,(select round(avg(stars),1) from reviews where to_id=u.id) rating from orders o join users u on u.id=o.owner_id where ${S} and o.owner_id<>? group by u.id order by n desc,money desc,u.name limit 20`).all(SYS);
 const R=db.prepare(`select u.id,u.name,u.region,${AV('u.')} avatar_v,u.frame,u.title,count(*) n,sum(o.days) days from orders o join users u on u.id=o.renter_id where ${S} group by u.id order by n desc,days desc,u.name limit 20`).all();
 s.json({lenders:L,readers:R,me:q.u.id})}));
app.get('/api/my-stats',auth,wrap((q,s)=>{const id=q.u.id,S="status in('rented','returned')";
 const months=[];for(let i=5;i>=0;i--){const d=new Date();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()-i);months.push(d.toISOString().slice(0,7))}
 const rows=db.prepare(`select substr(created,1,7) m,count(*) n,sum(total) s from orders where owner_id=? and ${S} group by m`).all(id);
 s.json({earnings:cnt(`select coalesce(sum(total),0) n from orders where owner_id=? and ${S}`,id),lent:cnt(`select count(*) n from orders where owner_id=? and ${S}`,id),
  active:cnt("select count(*) n from orders where owner_id=? and status in('confirmed','rented')",id),books:cnt('select count(*) n from books where owner_id=?',id),
  top:db.prepare(`select book_title t,count(*) n,sum(total) s from orders where owner_id=? and ${S} group by book_id order by n desc,s desc limit 5`).all(id),
  months:months.map(m=>{const r=rows.find(x=>x.m===m);return {m,n:r?r.n:0,s:r?r.s:0}})})}));

// --- demo: oldingi ijaralar, sharhlar (leaderboard, mashhur kitoblar, nishonlar real ko'rinsin) ---
if(!db.prepare("select 1 from orders where key like 'seed-%'").get()){
 const D=DEMO.map(x=>'demo-'+x[0]),NM=Object.fromEntries(D.map(id=>[id,db.prepare('select name from users where id=?').get(id).name]));
 const ob=id=>db.prepare('select id,title,price from books where owner_id=? order by id').all(id);
 const io=db.prepare('insert into orders(key,book_id,book_title,renter_id,owner_id,name,phone,start,"end",days,price,total,status,created,deposit) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,0)'),ih=db.prepare('insert into history(order_id,status,note,at) values(?,?,?,?)');
 const ts=(day,h=10)=>day+'T'+String(h).padStart(2,'0')+':15:00.000Z',TXT=['Kitob juda yoqdi, rahmat!','Vaqtida topshirdi, yaxshi odam.','Kitob toza holatda edi.','Tavsiya qilaman!','Muloqot qulay bo‘ldi.',''];
 const rv=db.prepare('insert or ignore into reviews(order_id,from_id,to_id,stars,text,at) values(?,?,?,?,?,?)'),brv=db.prepare('insert or ignore into book_reviews(book_id,user_id,stars,text,at) values(?,?,?,?,?)');
 const mk=(i,key,renter,owner,b,ago,days,status)=>{const start=addDays(today(),-ago),end=addDays(start,days),created=ts(addDays(start,-1),9);
  const oid=Number(io.run(key,b.id,b.title,renter,owner,NM[renter],'+99890'+String(1000000+i*7919).slice(0,7),start,end,days,b.price,b.price*days,status,created).lastInsertRowid);
  ih.run(oid,'new','',created);ih.run(oid,'confirmed','Avtomatik tasdiqlandi',ts(addDays(start,-1),10));ih.run(oid,'rented','Kitob topshirildi',ts(start,11));return {oid,end}};
 for(let i=0;i<46;i++){const renter=D[i%D.length];let owner=D[(i*7+3)%D.length];if(owner===renter)owner=D[(i*7+4)%D.length];const bs=ob(owner);if(!bs.length)continue;const b=bs[(i*3)%bs.length];
  const days=3+(i%5)*2,ago=days+2+(i*2)%38,{oid,end}=mk(i,'seed-'+i,renter,owner,b,ago,days,'returned');
  ih.run(oid,'returned','Qaytarib olindi',ts(i%9===0?addDays(end,2):end,15));
  if(i%4!==3){const st=i%6===0?4:5;rv.run(oid,renter,owner,st,TXT[i%TXT.length],ts(end,18));if(i%2===0)brv.run(b.id,renter,i%6===0?4:5,TXT[(i+1)%TXT.length],ts(end,19))}}
 for(let j=0;j<7;j++){const renter=D[(j*3+2)%D.length],owner=D[(j*4+1)%D.length];if(renter===owner)continue;const b=db.prepare('select id,title,price from books where owner_id=? and available>0 order by id limit 1 offset ?').get(owner,j%2);if(!b)continue;
  db.prepare('update books set available=available-1 where id=?').run(b.id);mk(100+j,'seed-a'+j,renter,owner,b,j+1,5+j,'rented')}}

// ================== 3-BOSQICH: barter, javon, maqsad, XP do'koni, narx maslahati, bepul/xayriya ==================
const xpOf=id=>cnt("select count(*) n from orders where status='returned' and (owner_id=? or renter_id=?)",id,id)*10+cnt('select count(*) n from reviews where to_id=?',id)*5+cnt('select count(*) n from books where owner_id=?',id)*2
 +cnt('select count(*) n from readdays where user_id=?',id)*2+cnt("select count(*) n from shelf where user_id=? and status='done'",id)*5+cnt('select count(*) n from orders where owner_id=? and gift>0',id)*20;
const shelfDone=o=>{const b=db.prepare('select title,author from books where id=?').get(o.book_id),row=db.prepare('select id,status from shelf where user_id=? and book_id=?').get(o.renter_id,o.book_id);
 if(row){if(row.status!=='done')db.prepare("update shelf set status='done',done_at=? where id=?").run(now(),row.id)}
 else db.prepare("insert into shelf(user_id,book_id,title,author,status,at,done_at) values(?,?,?,?,'done',?,?)").run(o.renter_id,o.book_id,b?b.title:o.book_title,b?b.author:'',now(),now())};
const gift=o=>{const b=db.prepare('select id,copies,charity from books where id=?').get(o.book_id); // bepul kitob topshirildi = sovg'a qilindi
 db.prepare("update orders set status='returned',gift=? where id=?").run(b&&b.charity?2:1,o.id);log(o.id,'returned','Sovg‘a qilindi');
 if(b){if(b.copies<=1){for(const t of ['books','favs','waitlist'])db.prepare(`delete from ${t} where ${t==='books'?'id':'book_id'}=?`).run(b.id)}else db.prepare('update books set copies=copies-1 where id=?').run(b.id)}};
if(!db.prepare("select 1 from meta where k='shelf_backfill'").get()){for(const o of db.prepare("select * from orders where status='returned' and coalesce(gift,0)=0").all())shelfDone(o);db.prepare("insert into meta values('shelf_backfill','1')").run()}
// demo: topshirish nuqtalari va bepul/xayriya kitoblari
{const PT={alisher:'Chilonzor, metro yaqini',malika:'Samarqand, Registon yonidagi kafe',jamshid:'Yunusobod, metro yaqini',dilnoza:'Buxoro, Lyabi Hovuz kafesi',sardor:'Andijon, universitet yonida',nodira:'Namangan, shahar kutubxonasi',bekzod:'Farg‘ona, savdo markazi',zilola:'Toshkent, Mirobod kafesi',otabek:'Qarshi, universitet yonida',shahnoza:'Urganch, shahar kutubxonasi',gulnora:'Jizzax, shahar kutubxonasi',rustam:'Guliston, markaziy kafe',sevara:'Navoiy, universitet yonida',farhod:'Termiz, savdo markazi',aziza:'Nukus, Berdaq kutubxonasi',eldor:'Chirchiq, avtovokzal yonida'};
 for(const [k,v] of Object.entries(PT))db.prepare("update books set point=? where owner_id=? and (point is null or point='')").run(v,'demo-'+k);
 // har bir viloyatda kamida 7 tadan kitob bo'lishi uchun mashhur kitoblar nusxalari egalari bo'yicha taqsimlanadi
 {const POP=db.prepare('select title,author,genre,desc from books where owner_id=? order by id').all(SYS),AD=Object.fromEntries(DEMO.map(x=>[x[0],x[5]]));
  DEMO.forEach(([k],ui)=>{const id='demo-'+k;if(!db.prepare('select 1 from users where id=?').get(id)||!POP.length)return;const have=new Set(db.prepare('select title from books where owner_id=?').all(id).map(r=>r.title));let n=have.size;
   for(let j=0;n<7&&j<POP.length*2;j++){const b=POP[(ui*5+j*3+(j>=POP.length?1:0))%POP.length];if(have.has(b.title))continue;have.add(b.title);const c=1+((ui+j)%3===0?1:0);
    db.prepare('insert into books(owner_id,title,author,genre,desc,price,copies,available,address,point,cond) values(?,?,?,?,?,?,?,?,?,?,?)').run(id,b.title,b.author,b.genre,b.desc,1500+((ui*7+j*3)%6)*500,c,c,AD[k],PT[k],['new','mid','old'][(ui+j)%3]);n++}})}
 const FREE=[['nodira','Bolalar ertaklari to‘plami','Xalq og‘zaki ijodi','Bolalar','Maktab yoshidagi bolalar uchun xalq ertaklari.',3,1],['zilola','Ingliz tili: boshlang‘ich daraja','Turli mualliflar','Ilmiy','Til o‘rganish uchun yaxshi holatdagi eski darslik.',1,0],
  ['bekzod','Jahon xalqlari ertaklari','Turli mualliflar','Bolalar','Bolalar kutubxonasi uchun to‘plam.',3,1],['alisher','Dasturlashga kirish','Turli mualliflar','Ilmiy','Boshlovchilar uchun dasturlash qo‘llanmasi.',1,0]];
 for(const [k,t,a,g,d,c,ch] of FREE){const id='demo-'+k;if(!db.prepare('select 1 from users where id=?').get(id)||db.prepare('select 1 from books where owner_id=? and title=?').get(id,t))continue;
  db.prepare('insert into books(owner_id,title,author,genre,desc,price,copies,available,address,point,free,charity) values(?,?,?,?,?,0,?,?,?,?,1,?)').run(id,t,a,g,d,c,c,'',PT[k],ch)}}
const nowIso=()=>new Date().toISOString();
db.prepare("update books set cond=case (id%3) when 0 then 'new' when 1 then 'mid' else 'old' end where (cond is null or cond='') and (owner_id like 'demo-%' or owner_id=?)").run(SYS); // demo kitoblar uchun holat
const daySet=id=>new Set([...db.prepare('select day from readdays where user_id=?').all(id).map(x=>x.day),...db.prepare("select substr(done_at,1,10) d from shelf where user_id=? and status='done' and done_at is not null").all(id).map(x=>x.d)]);
const runs=set=>{const days=[...set].sort();let best=0,cur=0,prev=null;for(const d of days){cur=prev&&addDays(prev,1)===d?cur+1:1;best=Math.max(best,cur);prev=d}return best};
const streakOf=set=>{let d=set.has(today())?today():addDays(today(),-1),n=0;while(set.has(d)){n++;d=addDays(d,-1)}return n};
const goalOf=id=>{const y=+today().slice(0,4),g=db.prepare('select target from goals where user_id=? and year=?').get(id,y),set=daySet(id);
 return {year:y,target:g?g.target:null,done:cnt("select count(*) n from shelf where user_id=? and status='done' and substr(done_at,1,4)=?",id,String(y)),streak:streakOf(set),best:runs(set),today:set.has(today()),
  days:Array.from({length:28},(_,i)=>addDays(today(),i-27)).filter(d=>set.has(d)),total_days:set.size}};
app.get('/api/goal',auth,(q,s)=>s.json(goalOf(q.u.id)));
app.put('/api/goal',auth,wrap((q,s)=>{const t=+q.body.target;if(!Number.isInteger(t)||t<1||t>365)throw E(400,'Maqsad 1 dan 365 gacha bo‘lsin');
 db.prepare('insert into goals values(?,?,?) on conflict(user_id,year) do update set target=excluded.target').run(q.u.id,+today().slice(0,4),t);s.json(goalOf(q.u.id))}));
app.post('/api/read-today',auth,(q,s)=>{db.prepare('insert or ignore into readdays values(?,?)').run(q.u.id,today());s.json(goalOf(q.u.id))});
app.get('/api/year-review',auth,wrap((q,s)=>{const id=q.u.id,y=String(+q.query.year||today().slice(0,4)),items=db.prepare(`select h.title,h.author,h.done_at,b.genre from shelf h left join books b on b.id=h.book_id where h.user_id=? and h.status='done' and substr(h.done_at,1,4)=?`).all(id,y);
 const top=(a,f)=>{const m={};for(const x of a){const k=f(x);if(k)m[k]=(m[k]||0)+1}const e=Object.entries(m).sort((p,r)=>r[1]-p[1])[0];return e?{name:e[0],n:e[1]}:null};
 const days=new Set([...daySet(id)].filter(d=>d.startsWith(y))),g=db.prepare('select target from goals where user_id=? and year=?').get(id,+y);
 s.json({year:+y,books:items.length,days:days.size,best:runs(days),genre:top(items,x=>x.genre),author:top(items,x=>x.author),month:top(items,x=>x.done_at.slice(5,7)),target:g?g.target:null,
  lent:cnt("select count(*) n from orders where owner_id=? and status in('rented','returned') and substr(created,1,4)=?",id,y),gifted:cnt("select count(*) n from orders where owner_id=? and gift>0 and substr(created,1,4)=?",id,y),
  list:items.slice(0,8).map(x=>({title:x.title,author:x.author}))})}));
// --- javon ---
const SH=['reading','want','done'];
app.get('/api/shelf/:uid',auth,wrap((q,s)=>s.json(db.prepare(`select h.id,h.book_id,h.title,h.author,h.status,h.at,h.done_at,b.genre,b.id is not null as exists_,case when b.cover is null or b.cover='' then 0 else coalesce(b.cover_ts,1) end cover_v from shelf h left join books b on b.id=h.book_id where h.user_id=? order by coalesce(h.done_at,h.at) desc`).all(q.params.uid))));
app.post('/api/shelf',auth,wrap((q,s)=>{const st=q.body.status;if(!SH.includes(st))throw E(400,'Noto‘g‘ri so‘rov');let t=String(q.body.title||'').trim().slice(0,120),a=String(q.body.author||'').trim().slice(0,120),bid=+q.body.book_id||null;
 if(bid){const b=db.prepare('select title,author from books where id=?').get(bid);if(!b)throw E(404,'Kitob topilmadi');t=b.title;a=b.author;const row=db.prepare('select id from shelf where user_id=? and book_id=?').get(q.u.id,bid);
  if(row){db.prepare('update shelf set status=?,done_at=? where id=?').run(st,st==='done'?now():null,row.id);return s.json({id:row.id})}}
 if(!t)throw E(400,'Kitob nomini yozing');
 s.json({id:Number(db.prepare('insert into shelf(user_id,book_id,title,author,status,at,done_at) values(?,?,?,?,?,?,?)').run(q.u.id,bid,t,a,st,now(),st==='done'?now():null).lastInsertRowid)})}));
app.put('/api/shelf/:id',auth,wrap((q,s)=>{const st=q.body.status;if(!SH.includes(st))throw E(400,'Noto‘g‘ri so‘rov');
 if(!db.prepare('update shelf set status=?,done_at=? where id=? and user_id=?').run(st,st==='done'?now():null,q.params.id,q.u.id).changes)throw E(404,'Topilmadi');s.json({ok:1})}));
app.delete('/api/shelf/:id',auth,wrap((q,s)=>{if(!db.prepare('delete from shelf where id=? and user_id=?').run(q.params.id,q.u.id).changes)throw E(404,'Topilmadi');s.json({ok:1})}));
// --- barter ---
app.post('/api/swaps',auth,wrap((q,s)=>{const d=+(q.body.days||14),fb=db.prepare('select * from books where id=? and owner_id=?').get(+q.body.from_book,q.u.id),tb=db.prepare('select * from books where id=?').get(+q.body.to_book);
 if(!tb)throw E(404,'Kitob topilmadi');if(!fb)throw E(400,'Almashtirish uchun o‘z kitobingizni tanlang');if(tb.owner_id===q.u.id)throw E(400,'O‘z kitobingiz');if(isAuto(tb.owner_id))throw E(400,'Bu akkaunt bilan almashib bo‘lmaydi');
 if(!Number.isInteger(d)||d<1||d>60)throw E(400,'1–60 kun tanlang');if(!fb.available||!tb.available)throw E(409,'Ikkala kitobda ham bo‘sh nusxa bo‘lishi kerak');
 if(db.prepare("select 1 from swaps where from_id=? and from_book=? and to_book=? and status='new'").get(q.u.id,fb.id,tb.id))throw E(409,'Bu taklif allaqachon yuborilgan');
 const id=Number(db.prepare("insert into swaps(from_id,to_id,from_book,to_book,days,note,status,created) values(?,?,?,?,?,?,'new',?)").run(q.u.id,tb.owner_id,fb.id,tb.id,d,String(q.body.note||'').slice(0,200),now()).lastInsertRowid);
 nt(tb.owner_id,'swap:new',{name:q.u.name,mine:fb.title,title:tb.title},'/me/rentals');s.json({id})}));
app.get('/api/swaps',auth,(q,s)=>s.json(db.prepare(`select s.*,fb.title ft,fb.author fa,tb.title tt,tb.author ta,(select name from users where id=s.from_id) fname,(select name from users where id=s.to_id) tname from swaps s left join books fb on fb.id=s.from_book left join books tb on tb.id=s.to_book where s.from_id=? or s.to_id=? order by s.id desc limit 50`).all(q.u.id,q.u.id).map(x=>({...x,mine:x.from_id===q.u.id}))));
app.post('/api/swaps/:id/:act',auth,wrap((q,s)=>{const {act}=q.params;
 db.transaction(()=>{const w=db.prepare('select * from swaps where id=?').get(q.params.id);if(!w||w.status!=='new'||(w.to_id!==q.u.id&&w.from_id!==q.u.id))throw E(404,'Topilmadi');
  if(act==='cancel'){if(w.from_id!==q.u.id)throw E(403,'Ruxsat yo‘q');db.prepare("update swaps set status='cancelled' where id=?").run(w.id);return nt(w.to_id,'swap:cancel',{name:q.u.name},'/me/rentals')}
  if(w.to_id!==q.u.id)throw E(403,'Ruxsat yo‘q');
  if(act==='decline'){db.prepare("update swaps set status='declined' where id=?").run(w.id);return nt(w.from_id,'swap:decline',{name:q.u.name},'/me/rentals')}
  if(act!=='accept')throw E(400,'Noto‘g‘ri so‘rov');
  const a=db.prepare('select * from books where id=?').get(w.from_book),b=db.prepare('select * from books where id=?').get(w.to_book);if(!a||!b)throw E(409,'Kitob topilmadi');
  for(const x of [a,b])if(db.prepare('update books set available=available-1 where id=? and available>0').run(x.id).changes!==1)throw E(409,'Bo‘sh nusxa qolmadi');
  const st=today(),end=addDays(st,w.days),U=id=>db.prepare('select name,phone from users where id=?').get(id);
  const mk=(suffix,book,renter,owner)=>{const r=U(renter),oid=Number(db.prepare('insert into orders(key,book_id,book_title,renter_id,owner_id,name,phone,start,"end",days,price,total,status,created,deposit,swap_id) values(?,?,?,?,?,?,?,?,?,?,0,0,\'confirmed\',?,0,?)').run('swap-'+w.id+suffix,book.id,book.title,renter,owner,r.name,r.phone||'+998000000000',st,end,w.days,now(),w.id).lastInsertRowid);log(oid,'new','Almashish');log(oid,'confirmed','Almashish tasdiqlandi')};
  mk('-a',b,w.from_id,w.to_id);mk('-b',a,w.to_id,w.from_id);db.prepare("update swaps set status='accepted' where id=?").run(w.id);nt(w.from_id,'swap:accept',{name:q.u.name,title:b.title},'/me/rentals')})();
 s.json({ok:1})}));
// --- XP do'koni ---
const SHOP=[{id:'frame_emerald',kind:'frame',key:'emerald',price:80},{id:'frame_gold',kind:'frame',key:'gold',price:120},{id:'frame_ruby',kind:'frame',key:'ruby',price:100},{id:'frame_sapphire',kind:'frame',key:'sapphire',price:100},{id:'frame_rainbow',kind:'frame',key:'rainbow',price:220},
 {id:'title_worm',kind:'title',key:'worm',price:60},{id:'title_sage',kind:'title',key:'sage',price:90},{id:'banner_sunset',kind:'banner',key:'sunset',price:70},{id:'banner_night',kind:'banner',key:'night',price:70},
 {id:'featured',kind:'book',price:150},{id:'boost',kind:'book',price:250},{id:'hot',kind:'book',price:200},{id:'freeze',kind:'streak',price:60},{id:'announce',kind:'announce',price:120}];
const COSM={frame:'frame',title:'title',banner:'banner'},BKCOL={featured:'featured_until',boost:'boost_until',hot:'hot_until'};
const bal=id=>({earned:xpOf(id),spent:cnt('select coalesce(sum(price),0) n from purchases where user_id=?',id)});
const owns=(uid,item)=>!!db.prepare('select 1 from purchases where user_id=? and item=?').get(uid,item);
app.get('/api/shop',auth,wrap((q,s)=>{const b=bal(q.u.id),u=db.prepare('select frame,title,banner from users where id=?').get(q.u.id);
 s.json({...b,balance:b.earned-b.spent,items:SHOP.map(i=>({...i,owned:!!COSM[i.kind]&&owns(q.u.id,i.id)})),cur:{frame:u.frame||'',title:u.title||'',banner:u.banner||''},
  freeze_ok:!daySet(q.u.id).has(addDays(today(),-1)),followers:cnt('select count(*) n from follows where followee=?',q.u.id),
  books:db.prepare('select id,title,featured_until,boost_until,hot_until from books where owner_id=? order by id desc').all(q.u.id)})}));
app.post('/api/shop/buy',auth,wrap((q,s)=>{const it=SHOP.find(x=>x.id===q.body.item);if(!it)throw E(404,'Topilmadi');
 db.transaction(()=>{const b=bal(q.u.id);if(b.earned-b.spent<it.price)throw E(400,'XP yetarli emas');
  const rec=bk=>db.prepare('insert into purchases(user_id,item,book_id,price,at) values(?,?,?,?,?)').run(q.u.id,it.id,bk||null,it.price,now());
  if(COSM[it.kind]){if(owns(q.u.id,it.id))throw E(409,'Bu narsa sizda bor');rec();db.prepare(`update users set ${COSM[it.kind]}=? where id=?`).run(it.key,q.u.id);return}
  if(it.kind==='streak'){const y=addDays(today(),-1);if(daySet(q.u.id).has(y))throw E(409,'Kecha allaqachon belgilangan');db.prepare('insert or ignore into readdays values(?,?)').run(q.u.id,y);rec();return}
  const bk=db.prepare('select id,title,featured_until,boost_until,hot_until from books where id=? and owner_id=?').get(+q.body.book_id,q.u.id);if(!bk)throw E(400,'Avval kitobingizni tanlang');
  if(it.kind==='announce'){const fs=db.prepare('select follower from follows where followee=?').all(q.u.id);if(!fs.length)throw E(400,'Sizni hali hech kim kuzatmayapti');
   for(const f of fs)nt(f.follower,'promo',{name:q.u.name,title:bk.title},'/book/'+bk.id);rec(bk.id);return}
  const col=BKCOL[it.id],cur=bk[col]&&bk[col]>nowIso()?Date.parse(bk[col]):Date.now(),until=new Date(cur+7*864e5).toISOString();
  db.prepare(`update books set ${col}=? where id=?`).run(until,bk.id);rec(bk.id)})();s.json({ok:1})}));
app.post('/api/shop/equip',auth,wrap((q,s)=>{const kind=String(q.body.kind||''),key=String(q.body.key||'');if(!COSM[kind])throw E(400,'Noto‘g‘ri so‘rov');
 if(key){const it=SHOP.find(x=>x.kind===kind&&x.key===key);if(!it||!owns(q.u.id,it.id))throw E(403,'Ruxsat yo‘q')}
 db.prepare(`update users set ${COSM[kind]}=? where id=?`).run(key,q.u.id);s.json({ok:1})}));
app.post('/api/shop/frame',auth,wrap((q,s)=>{const key=String(q.body.frame||'');if(key){const it=SHOP.find(x=>x.kind==='frame'&&x.key===key);if(!it||!owns(q.u.id,it.id))throw E(403,'Ruxsat yo‘q')}
 db.prepare('update users set frame=? where id=?').run(key,q.u.id);s.json({ok:1})}));
// --- narx maslahatchisi ---
app.get('/api/price-advice',auth,wrap((q,s)=>{const g=String(q.query.genre||'');
 const rows=db.prepare(`select b.price,(select count(*) from orders o where o.book_id=b.id) r,(select count(*) from orders o where o.book_id=b.id and o.created>?) m from books b where b.price>0 and b.owner_id<>? and (?='' or b.genre=?)`).all(new Date(Date.now()-30*864e5).toISOString(),q.u.id,g,g);
 const r5=x=>Math.round(x/500)*500,avg=a=>a.length?r5(a.reduce((x,y)=>x+y,0)/a.length):null,pr=rows.map(x=>x.price),hot=rows.filter(x=>x.r>=2).sort((a,b)=>b.r-a.r).slice(0,Math.max(3,Math.ceil(rows.length/4))).map(x=>x.price);
 const a=avg(pr),p=avg(hot);s.json({genre:g,n:rows.length,avg:a,min:pr.length?Math.min(...pr):null,max:pr.length?Math.max(...pr):null,popular:p,demand30:rows.reduce((x,y)=>x+y.m,0),suggest:a?r5(p?.6*a+.4*p:a):3000})}));
// --- xayriya ---
app.get('/api/charity-stats',auth,(q,s)=>s.json({gifted:cnt('select count(*) n from orders where gift>0'),charity:cnt('select count(*) n from orders where gift=2'),free_books:cnt('select count(*) n from books where free=1'),
 donors:db.prepare(`select u.id,u.name,${AV('u.')} avatar_v,u.frame,count(*) n from orders o join users u on u.id=o.owner_id where o.gift>0 group by u.id order by n desc,u.name limit 5`).all()}));
const pub=path.join(dir,'public');
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.ico':'image/x-icon','.png':'image/png'};
const serve=(url,s)=>{let f=path.join(pub,decodeURIComponent(url==='/'?'/index.html':url));
 if(!f.startsWith(pub+path.sep)||!fs.existsSync(f)||fs.statSync(f).isDirectory())f=path.join(pub,'index.html');
 if(!fs.existsSync(f))return s.status(404).json({error:'Topilmadi'});
 s.setHeader('Content-Type',MIME[path.extname(f)]||'application/octet-stream');s.end(fs.readFileSync(f))};
const server=http.createServer(async(q,s)=>{try{
 s.status=c=>{s.statusCode=c;return s};s.json=o=>{s.setHeader('Content-Type','application/json; charset=utf-8');s.end(JSON.stringify(o))};
 const u=new URL(q.url,'http://x');q.query=Object.fromEntries(u.searchParams);
 const ch=[];let n=0;for await(const c of q){n+=c.length;if(n>2e6)return s.status(413).json({error:'Juda katta'});ch.push(c)}
 const raw=Buffer.concat(ch).toString('utf8');q.body={};
 if(raw){try{q.body=JSON.parse(raw)}catch{return s.status(400).json({error:'Noto‘g‘ri so‘rov'})}}
 for(const r of routes){if(r.m!==q.method)continue;const m=u.pathname.match(r.re);if(!m)continue;
  q.params=Object.fromEntries(Object.entries(m.groups||{}).map(([k,v])=>[k,decodeURIComponent(v)]));
  let i=0;const next=()=>{const f=r.h[i++];if(f)f(q,s,next)};return next()}
 if(q.method==='GET'&&!u.pathname.startsWith('/api'))return serve(u.pathname,s);
 s.status(404).json({error:'Topilmadi'})
}catch(e){if(!s.headersSent)s.status(500).json({error:'Server xatosi'});else s.end()}});
const PORT=process.env.PORT||3001;server.listen(PORT,'0.0.0.0',()=>console.log('Server ishga tushdi: http://localhost:'+PORT));
