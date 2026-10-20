import {useSyncExternalStore} from 'react';
const K='kitob-theme',subs=new Set();
let th=(()=>{try{return localStorage.getItem(K)==='dark'?'dark':'light'}catch{return'light'}})();
const apply=()=>{document.documentElement.dataset.theme=th;document.querySelector('meta[name=theme-color]')?.setAttribute('content',th==='dark'?'#16110d':'#f8f3e6')};apply();
const emit=()=>subs.forEach(f=>f());
export const toggleTheme=()=>{th=th==='dark'?'light':'dark';try{localStorage.setItem(K,th)}catch{}apply();emit()};
try{addEventListener('storage',e=>{if(e.key===K){th=e.newValue==='dark'?'dark':'light';apply();emit()}})}catch{}
export const useTheme=()=>useSyncExternalStore(f=>{subs.add(f);return()=>subs.delete(f)},()=>th);
