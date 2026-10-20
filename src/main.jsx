import {useEffect} from 'react';import {createRoot} from 'react-dom/client';import './styles.css';import './theme.js';import App from './App.jsx';import {useLang,startI18n,retranslate} from './i18n';
startI18n();
// Til almashganda ilova QAYTA YARATILMAYDI (holat, qidiruv matni, skroll saqlanadi): faqat matnlar joyida yangilanadi
const Root=()=>{const l=useLang();useEffect(()=>{retranslate()},[l]);return <App/>};
createRoot(document.getElementById('root')).render(<Root/>);
