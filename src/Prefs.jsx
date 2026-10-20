import {Icon} from './ui.jsx';import {useLang,setLang} from './i18n';import {useTheme,toggleTheme} from './theme.js';
export default function Prefs({className=''}){const th=useTheme(),lang=useLang();
 return <div className={'prefs '+className}>
  <select className="langsel" aria-label="Til" value={lang} onChange={e=>setLang(e.target.value)}><option value="uz">UZ</option><option value="ru">RU</option><option value="en">EN</option></select>
  <button type="button" className="iconbtn" onClick={toggleTheme} aria-label="Mavzuni almashtirish"><Icon n={th==='dark'?'sun':'moon'} size={19}/></button></div>}
