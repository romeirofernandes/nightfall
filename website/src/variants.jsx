import React from 'react';
import {ArrowDown,ArrowUpRight,Snowflake,MoveUpRight,Wind,MousePointer2,Feather,Command,ChevronDown,Terminal,Layers,Monitor,Settings2} from 'lucide-react';
import {DesktopDemo,Contours} from './snow';
import {Logo,Button,DirectionLink,Install,FAQ,SmallFooter,useTaste} from './shared';

export function Alpine(){
 useTaste('iris-opens');
 return <div className="variant variant-alpine">
  <section className="alpine-hero hero" data-enter>
   <DesktopDemo theme="alpine" hero compact className="alpine-world"/>
   <div className="alpine-vignette" aria-hidden="true"/>
   <header className="site-shell alpine-nav"><Logo/><nav><a href="#experience">The experience</a><a href="#install">Get Nightfall<ArrowUpRight size={14}/></a></nav><DirectionLink number="01" name="Alpine"/></header>
   <div className="site-shell alpine-intro"><span className="eyebrow"><i/>A desktop snow app. Free, always.</span><h1>Snow, on<br/>your <em>desktop.</em></h1><p>A little winter over the windows<br/>you spend your days in.</p><Button>Bring on the snow</Button></div>
   <div className="site-shell alpine-hero-foot"><span>For macOS & Hyprland</span><a href="#experience"><ArrowDown size={15}/>Come a little closer</a></div>
   <div className="alpine-word" aria-hidden="true">nightfall</div>
  </section>
  <main>
   <section className="alpine-experience section" id="experience"><div className="site-shell"><div className="alpine-section-head"><span className="eyebrow">01 / A different atmosphere</span><h2>A snow day.<br/>On your terms.</h2><p>Flakes drift. Little banks settle on ledges.<br/>Move the window and make some room<br/>for a fresh dusting.</p></div><DesktopDemo theme="frost"/><div className="alpine-demofacts"><span><MousePointer2 size={16}/>Your clicks pass through.</span><span><Wind size={16}/>Your weather, your choice.</span><span><Snowflake size={16}/>Your own little winter.</span></div></div></section>
   <section className="alpine-details section" data-moment="iris-opens" data-moment-opts='{"from":"base"}'><div className="site-shell"><div className="alpine-details-title"><span className="eyebrow">02 / Underneath it all</span><h2>A little snow.<br/>A lot of care.</h2></div><div className="alpine-feature-lines">{[['01','Snow that settles','Soft banks gather along window ledges. Icicles grow while the windows stay still.'],['02','A friend in the forecast','A snowman and the occasional plow keep your desktop company.'],['03','Local, all the way down','Rust handles the simulation. Your settings stay on your device.']].map(([n,title,copy])=><article key={n}><span>{n}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>
   <section className="alpine-download section" id="install"><div className="site-shell"><div className="alpine-download-title"><Snowflake size={42} strokeWidth={1}/><span className="eyebrow">Your next snow day</span><h2>Make yourself<br/><em>at home.</em></h2><p>Install the prebuilt app.<br/>Put the kettle on. Let it snow.</p></div><Install/><FAQ/></div></section>
  </main><footer className="site-shell"><div className="alpine-signoff">A little winter.<span>Wherever you work.</span></div><SmallFooter/></footer>
 </div>;
}

export function AfterHours(){
 useTaste('letters-assemble');
 return <div className="variant variant-editorial">
  <Contours className="editorial-contours"/>
  <header className="site-shell editorial-nav"><Logo/><span className="edition-label">Desktop snowfall / Vol. 0.2.1</span><DirectionLink number="02" name="After Hours"/></header>
  <main>
   <section className="editorial-hero hero" data-enter><div className="site-shell"><div className="editorial-hero-heading"><div><span className="eyebrow">For the days you’d rather stay in.</span><h1>Desktop snow,<br/><span>after hours.</span></h1></div><div className="editorial-intro-note"><Snowflake size={38} strokeWidth={1.2}/><p>Work can wait<br/>a little.<br/><strong>Winter is here.</strong></p><a href="#install" className="editorial-circle" aria-label="Get Nightfall"><ArrowUpRight size={30}/></a></div></div><div className="editorial-demo-row"><div className="editorial-demo-caption"><span>nightfall</span><p>A small, free snow app<br/>for your Mac or Hyprland.</p><Button>Get your snow day</Button><span className="mini-colophon">Built with Rust + Tauri.</span></div><DesktopDemo theme="editorial" compact/></div></div></section>
   <section className="editorial-features section" id="experience"><div className="site-shell"><div className="editorial-feature-heading"><span className="eyebrow">A few good reasons to look up.</span><h2>Small things.<br/><i>Very good things.</i></h2></div><div className="editorial-row-list">{[[Snowflake,'01','The drift','A few flakes or a proper blizzard. Set your own kind of weather.'],[Layers,'02','The settling','Snow gathers on ledges. Moving a window gives it a fresh start.'],[MousePointer2,'03','The getting-on-with-it','Your apps keep working. Clicks go straight through the snow.']].map(([Icon,n,title,copy])=><article key={n}><span className="row-n">{n}</span><Icon size={34} strokeWidth={1}/><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>
   <section className="editorial-statement section"><div className="site-shell"><span className="eyebrow">The afternoon agenda</span><h2 data-moment="letters-assemble">A little<br/>less hurry.</h2><div className="editorial-statement-bottom"><p>Snow falls at its own pace.<br/>Maybe you can, too.</p><Snowflake size={110} strokeWidth={.8}/><span>macOS + Hyprland<br/>30 fps by default.</span></div></div></section>
   <section className="editorial-install section" id="install"><div className="site-shell"><div className="editorial-install-head"><span className="eyebrow">Take some winter home.</span><h2>One app.<br/>Your snow day.</h2><p>Prebuilt downloads. Local preferences.<br/>A little weather to call your own.</p></div><Install style="editorial"/><FAQ style="editorial"/></div></section>
  </main>
  <footer className="editorial-footer"><div className="site-shell"><div className="editorial-footer-word">good<span>nightfall.</span><Snowflake/></div><SmallFooter style="editorial"/></div></footer>
 </div>;
}

export function Observatory(){
 useTaste('word-highlight');
 return <div className="variant variant-observatory">
  <header className="site-shell observatory-nav"><Logo name="NIGHTFALL"/><span className="system-tag"><i/>Desktop atmosphere / Local</span><DirectionLink number="03" name="Observatory"/></header>
  <main>
   <section className="observatory-hero hero" data-enter><Contours className="observatory-contours"/><div className="site-shell"><div className="observatory-topline"><span>System 0.2.1</span><span>macOS / Hyprland</span><Snowflake size={20}/></div><div className="observatory-hero-grid"><div className="observatory-copy"><span className="eyebrow">Your personal weather system.</span><h1>Desktop snow.<br/><span>You’re in<br/> control.</span></h1><p>Set the snowfall. Shift the breeze.<br/>Run a little winter over your apps.</p><Button>Install Nightfall</Button><div className="observatory-coordinates"><span>Simulation: Rust</span><span>Connection: none</span></div></div><div className="observatory-bench"><div className="scope-bracket tl"/><div className="scope-bracket tr"/><div className="scope-bracket bl"/><div className="scope-bracket br"/><div className="bench-title"><span><i/>Weather bench</span><Settings2 size={17}/></div><DesktopDemo theme="observatory"/><div className="bench-foot"><span>Drag the window. Adjust the wind.</span><span>Live in your browser ↗</span></div></div></div><div className="observatory-bottom"><span>01 / Observe the snowfall</span><ArrowDown size={18}/><span>Free. Prebuilt. Yours.</span></div></div></section>
   <section className="observatory-engine section"><div className="site-shell"><div className="obs-section-label"><span>02 / Under the hood</span><Terminal size={18}/></div><h2>Snow, with<br/><span>sensible limits.</span></h2><div className="obs-engine-grid"><div className="obs-stat"><strong>900<span>max</span></strong><p>Particles per screen.<br/>A bounded Rust simulation.</p></div><div className="obs-stat"><strong>30<span>fps</span></strong><p>The default frame rate.<br/>Choose 60 when you want it.</p></div><div className="obs-code"><div><i/>engine.rs</div><pre><code>{'if flakes.len() < 900 {\n    winter.add_flake();\n}\n\nwinter.step(dt, &settings);'}</code></pre><span>System webview. No bundled Chromium.</span></div></div></div></section>
   <section className="observatory-statement section"><div className="site-shell"><span className="obs-section-label">03 / Keep your flow</span><h2 data-moment="word-highlight">Snow on top.<br/>Your apps underneath.<br/>Your clicks go<br/>right through.</h2></div></section>
   <section className="observatory-install section" id="install"><div className="site-shell"><div className="obs-section-label"><span>04 / Deploy a little winter</span><Command size={18}/></div><div className="obs-install-heading"><h2>Forecast:<br/><span>installed.</span></h2><p>Prebuilt for your Mac’s processor.<br/>A verified binary for Arch x64.<br/>Choose your system below.</p></div><Install style="observatory"/><FAQ style="observatory"/></div></section>
  </main><footer className="site-shell observatory-footer"><div><Snowflake strokeWidth={1}/><span>NIGHTFALL<br/><small>End of transmission. Start of snowfall.</small></span></div><SmallFooter style="observatory"/></footer>
 </div>;
}
