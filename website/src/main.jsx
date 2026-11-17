import React from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowUpRight,Snowflake,ArrowDown,Check,ExternalLink} from 'lucide-react';
import '@fontsource-variable/fraunces/full.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import {Alpine,AfterHours,Observatory} from './variants';
import {Logo,MacHelp} from './shared';
import './styles.css';
function Gallery(){
 const options=[
  {slug:'alpine',no:'01',name:'Alpine',tag:'Immersive / cinematic',copy:'Cold moonlight. Mountain air. A desktop that feels a world away.',words:<>Snow, on<br/><i>your desktop.</i></>,meta:'Forest ink · soft serif · panoramic photography'},
  {slug:'after-hours',no:'02',name:'After Hours',tag:'Expressive / editorial',copy:'Warm graphite, a little coral, and a snow day with personality.',words:<>desktop snow,<br/><i>after hours.</i></>,meta:'Coral · rounded type · printed contours'},
  {slug:'observatory',no:'03',name:'Observatory',tag:'Technical / interactive',copy:'A personal weather bench. Precise controls and a brighter signal.',words:<>DESKTOP SNOW.<br/><i>YOU’RE IN CONTROL.</i></>,meta:'Acid lime · monospace · etched grids'}
 ];
 return <div className="page-gallery"><header className="site-shell gallery-nav"><Logo/><span className="gallery-state"><i/>Design study / three directions</span><a className="text-link" href="/mac-help/">Mac opening guide<ArrowUpRight size={15}/></a></header><main className="site-shell gallery-main"><div className="gallery-intro"><span className="eyebrow">Same little winter. Three different worlds.</span><h1>Which kind<br/>of <em>winter?</em></h1><div><p>Three complete directions for Nightfall.<br/>Different type, different atmosphere,<br/>different ways to feel the snow.</p><span>Built in React + Vite + Tailwind.</span></div></div><div className="direction-grid">{options.map(o=><a key={o.slug} className={`direction-card card card-${o.slug}`} href={'/'+o.slug+'/'}><div className={'direction-teaser teaser-'+o.slug}>{o.slug==='alpine'&&<img src="/media/alpine-night.webp" width="1536" height="1024" alt="" loading="lazy"/>}<span className="teaser-brand"><Snowflake size={14}/>nightfall</span><strong>{o.words}</strong><span className="teaser-cta"><ArrowUpRight size={17}/></span>{o.slug==='observatory'&&<div className="teaser-orbit"/>}</div><div className="direction-card-title"><span>{o.no} / {o.name}</span><ArrowUpRight size={22}/></div><span className="direction-tag">{o.tag}</span><p>{o.copy}</p><div className="direction-meta">{o.meta}</div></a>)}</div><div className="gallery-footnote"><span>Every direction is dark-only, responsive, and fully interactive.</span><a href="https://github.com/romeirofernandes/nightfall">One repository. One little winter. ↗</a></div></main><footer className="site-shell gallery-footer"><span>nightfall / design explorations</span><span>Choose a direction. We’ll keep the one you love.</span></footer></div>;
}
const path=location.pathname.split('/').filter(Boolean)[0];
const Page=path==='alpine'?Alpine:path==='after-hours'?AfterHours:path==='observatory'?Observatory:path==='mac-help'?MacHelp:Gallery;
createRoot(document.getElementById('root')).render(<><a className="skip-link" href="#main-content">Skip to content</a><div id="main-content"><Page/></div></>);
