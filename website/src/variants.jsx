import React from 'react';
import {ArrowDown,ArrowUpRight,Snowflake,MoveUpRight,Wind,MousePointer2,Feather,Command,ChevronDown,Terminal,Layers,Monitor,Settings2} from 'lucide-react';
import {DesktopDemo,Contours} from './snow';
import {Logo,Button,Install,FAQ,SmallFooter,useTaste} from './shared';

export function AfterHours(){
 useTaste('letters-assemble');
 return <div className="variant variant-editorial">
  <header className="site-shell editorial-nav"><Logo/><nav><a href="#experience">The snowfall</a><a href="#install">Get Nightfall <ArrowUpRight size={14}/></a></nav></header>
  <main>
   <section className="editorial-hero hero" data-enter><Contours className="editorial-contours"/><div className="site-shell editorial-hero-layout"><div className="editorial-hero-copy"><span className="eyebrow">Free desktop snow · macOS & Hyprland</span><h1>A little winter.<br/><span>All yours.</span></h1><p>Snow over your windows.<br/>Carry on at your own pace.</p><Button>Get Nightfall</Button></div><DesktopDemo theme="editorial" compact/></div></section>
   <section className="editorial-features section" id="experience"><div className="site-shell"><div className="editorial-feature-heading"><span className="eyebrow">A few good reasons to look up.</span><h2>Small things.<br/><i>Very good things.</i></h2></div><div className="editorial-row-list">{[[Snowflake,'01','The drift','A few flakes or a proper blizzard. Set your own kind of weather.'],[Layers,'02','The settling','Snow gathers on ledges. Moving a window gives it a fresh start.'],[MousePointer2,'03','The getting-on-with-it','Your apps keep working. Clicks go straight through the snow.']].map(([Icon,n,title,copy])=><article key={n}><span className="row-n">{n}</span><Icon size={34} strokeWidth={1}/><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>
   <section className="editorial-statement section"><div className="site-shell"><span className="eyebrow">The afternoon agenda</span><h2 data-moment="letters-assemble">A little<br/>less hurry.</h2><div className="editorial-statement-bottom"><p>Snow falls at its own pace.<br/>Maybe you can, too.</p><Snowflake size={110} strokeWidth={.8}/><span>macOS + Hyprland<br/>30 fps by default.</span></div></div></section>
   <section className="editorial-install section" id="install"><div className="site-shell"><div className="editorial-install-head"><span className="eyebrow">Take some winter home.</span><h2>One app.<br/>Your snow day.</h2><p>Prebuilt downloads. Local preferences.<br/>A little weather to call your own.</p></div><Install style="editorial"/><FAQ style="editorial"/></div></section>
  </main>
  <footer className="editorial-footer"><div className="site-shell"><div className="editorial-footer-word">good<span>nightfall.</span><Snowflake/></div><SmallFooter style="editorial"/></div></footer>
 </div>;
}

