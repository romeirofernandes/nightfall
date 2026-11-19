import React, {useEffect, useRef, useState} from 'react';
import {ArrowDown, ArrowDownToLine, ArrowUpRight, Check, Copy, Github, Moon, Pause, Play, Snowflake, Sun, Terminal, X} from 'lucide-react';
import '@fontsource/prata/latin-400.css';
import gsap from 'gsap';
import {BREW, RELEASE} from './shared';
import {Snow} from './snow';
import {SnowFill} from './snow-fill';
import {SnowSurfaces} from './snow-surfaces';
import {Celestial} from './celestial';
import {useWinterTime} from './use-winter-time';
import {useWinterScroll} from './use-winter-scroll';
import './landing.css';

const scenery = {day: '/media/winter/alpine-day.jpg', evening: '/media/winter/alpine-evening.jpg', night: '/media/winter/alpine-night.jpg'};
const repository = 'https://github.com/romeirofernandes/nightfall';
const platforms = {
  mac: {
    name: 'macOS',
    method: 'Homebrew',
    command: BREW,
    instruction: 'When it finishes, open Nightfall from Applications.',
    links: [
      ['Get Homebrew', 'https://brew.sh/'],
      ['First-launch help', '/mac-help/'],
      ['Repair an older tap', repository + '/blob/main/distribution/HOMEBREW-RECOVERY.md'],
    ],
  },
  linux: {
    name: 'Arch + Hyprland',
    method: 'Terminal',
    command: 'curl -fsSL https://raw.githubusercontent.com/romeirofernandes/nightfall/main/distribution/install.sh -o /tmp/nightfall-install.sh\nbash /tmp/nightfall-install.sh',
    instruction: 'When it finishes, open Nightfall from your app launcher.',
    links: [['Linux requirements', repository + '/blob/main/distribution/README.md']],
  },
};

export function Landing() {
  const dialog = useRef(null);
  const hero = useRef(null);
  const snowField = useRef(null);
  const previewSnowField = useRef(null);
  const {phase: theme, selectMode, position} = useWinterTime();
  const [seenThemes, setSeenThemes] = useState([theme]);
  useEffect(() => { setSeenThemes(previous => previous.includes(theme) ? previous : [...previous, theme]); }, [theme]);
  const foregroundThemes = seenThemes.includes(theme) ? seenThemes : [...seenThemes, theme];
  const [snowPaused, setSnowPaused] = useState(false);
  const [platform, setPlatform] = useState('mac');
  const [copyState, setCopyState] = useState('');
  const install = platforms[platform];
  useWinterScroll(hero, snowPaused);
  useEffect(() => {
    const context = gsap.context(() => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        const entrance = gsap.timeline();
        entrance.from('.winter-world', { scale: 1.055, duration: 2.2, ease: 'power3.out', clearProps: 'transform' }, 0)
          .from('.landing-copy h1', { y: 35, clipPath: 'inset(0 0 100% 0)', duration: 1.3, ease: 'power3.out', clearProps: 'all' }, .15)
          .from('.landing-copy > p, .landing-actions', { y: 18, opacity: 0, duration: .9, stagger: .14, ease: 'power3.out', clearProps: 'all' }, .65);
      });
    }, hero);
    return () => context.revert();
  }, []);
  function openInstaller(platform) {
    setPlatform(platform); setCopyState(''); dialog.current.showModal();
  }
  async function copyCommands() {
    try { await navigator.clipboard.writeText(install.command); setCopyState('copied'); }
    catch { setCopyState('error'); }
  }
  return (
    <div className="landing" data-theme={theme} ref={hero}>
      <a className="landing-skip" href="#main-content">Skip to content</a>
      <main id="main-content" tabIndex={-1}>
        <div className="winter-journey">
        <section className="landing-hero hero" data-enter aria-labelledby="landing-title">
          <div className="winter-world hero__bg" aria-hidden="true">
            <div className="winter-distance">
            {['day', 'evening', 'night'].map(light => <img key={light}
              className={'winter-landscape winter-' + light}
              data-active={light === (theme === 'morning' || theme === 'afternoon' ? 'day' : theme)}
              src={scenery[light]} width="1672" height="941"
              fetchPriority={light === (theme === 'morning' || theme === 'afternoon' ? 'day' : theme) ? 'high' : 'low'} alt=""/>)}
            </div>
            <Celestial phase={theme} position={position} paused={snowPaused}/>
          </div>
          <div className="landing-snow" aria-hidden="true"><Snow density={2} atmosphere wind={12} paused={snowPaused} surfaces={snowField}/></div>
          <header className="landing-shell wrap landing-header">
            <a className="landing-brand" href="/" aria-label="Nightfall home"><Snowflake aria-hidden="true" size={27}/>Nightfall</a>
            <div className="landing-header-actions">
              <a className="landing-link landing-github" href={repository} aria-label="Nightfall on GitHub"><Github aria-hidden="true" size={17}/><span>GitHub</span><ArrowUpRight aria-hidden="true" size={14}/></a>
              <span className="landing-nav-divider" aria-hidden="true"/>
              <button className="landing-icon-button" onClick={() => setSnowPaused(!snowPaused)} aria-pressed={snowPaused}
                aria-label={snowPaused ? 'Resume snowfall' : 'Pause snowfall'} title={snowPaused ? 'Resume snowfall' : 'Pause snowfall'}>
                {snowPaused ? <Play aria-hidden="true" size={16}/> : <Pause aria-hidden="true" size={16}/>}
              </button>
              <button className="landing-icon-button" onClick={() => selectMode(theme === 'night' ? 'afternoon' : 'night')}
                aria-label={theme === 'night' ? 'Switch to afternoon' : 'Switch to night'} title={theme === 'night' ? 'Switch to afternoon' : 'Switch to night'}>
                {theme === 'night' ? <Sun aria-hidden="true" size={18}/> : <Moon aria-hidden="true" size={18}/>}
              </button>
            </div>
          </header>
          <div className="landing-shell wrap landing-copy">
            <h1 id="landing-title">A little winter.<span> All yours.</span></h1>
            <p>Free desktop snow for macOS &amp; Hyprland.</p>
            <div className="landing-actions">
              <button data-snow-surface className="landing-button landing-primary" aria-haspopup="dialog" onClick={() => openInstaller('mac')}><ArrowDownToLine aria-hidden="true" size={18}/>Get Nightfall</button>
              <button data-snow-surface className="landing-button landing-secondary" aria-haspopup="dialog" onClick={() => openInstaller('linux')}><SnowFill paused={snowPaused} field={snowField}/><span className="snow-button-label"><Terminal aria-hidden="true" size={17}/>Install on Linux<ArrowUpRight aria-hidden="true" size={15}/></span><span className="snow-button-label snow-button-label-filled" aria-hidden="true"><Terminal size={17}/>Install on Linux<ArrowUpRight size={15}/></span></button>
            </div>
          </div>
          <div className="winter-near winter-near-left" aria-hidden="true">{foregroundThemes.map(light => <img key={light} data-active={theme === light} ref={node => { if (node?.complete && node.naturalWidth) node.dataset.ready = 'true'; }} onLoad={event => { event.currentTarget.dataset.ready = 'true'; }} src={light === 'afternoon' ? '/media/winter/foreground-pines.png' : '/media/winter/foreground-' + light + '.png'} alt="" width="1672" height="941"/>)}</div>
          <div className="winter-near winter-near-right" aria-hidden="true">{foregroundThemes.map(light => <img key={light} data-active={theme === light} ref={node => { if (node?.complete && node.naturalWidth) node.dataset.ready = 'true'; }} onLoad={event => { event.currentTarget.dataset.ready = 'true'; }} src={light === 'afternoon' ? '/media/winter/foreground-pines.png' : '/media/winter/foreground-' + light + '.png'} alt="" width="1672" height="941"/>)}</div>
          <div className="winter-passage-shade" aria-hidden="true"/>
          <a className="winter-scroll-cue" href="#winter-passage" aria-label="Explore the winter scene"><ArrowDown size={20} aria-hidden="true"/></a>
          <SnowSurfaces field={snowField} paused={snowPaused}/>
        </section>
        <section id="winter-passage" className="winter-passage" aria-labelledby="winter-passage-title">
          <div className="winter-passage-snow" aria-hidden="true">
            <Snow density={1} wind={8} paused={snowPaused} passageTheme={theme}/>
          </div>
          <div className="landing-shell winter-passage-copy">
            <h2 id="winter-passage-title">A snow day on your desktop.</h2>
            <p>Snow falls across your desktop and gathers on your windows.</p>
            <figure className="winter-desktop-preview">
              <img src="/nightfall-desktop.webp" width="1600" height="1041" loading="lazy" decoding="async"
                alt="Nightfall running on macOS, with falling snow, Christmas lights, and snow settled along the top of its Weather window."/>
              <div className="winter-preview-weather" aria-hidden="true">
                <div className="winter-preview-ledge" data-snow-surface="preview"/>
                <Snow density={1} wind={7} paused={snowPaused} surfaces={previewSnowField}/>
                <SnowSurfaces field={previewSnowField} paused={snowPaused}/>
              </div>
            </figure>
          </div>
        </section>
        </div>
      </main>
      <footer className="landing-shell wrap landing-footer closing">
        <a className="landing-link" href={RELEASE}>All downloads<ArrowUpRight aria-hidden="true" size={13}/></a>
        <p>crafted by <a href="https://romeiro.dev">romeiro</a>, <a href="https://russel.is-a.dev">russel</a> &amp; <a href="https://gavin-soares.vercel.app">gavin</a>'s agents</p>
      </footer>
      <dialog className="landing-dialog" ref={dialog} aria-labelledby="install-title">
        <div className="landing-dialog-header">
          <h2 id="install-title">Install on {install.name}</h2>
          <form method="dialog"><button className="landing-button landing-close" aria-label="Close installation instructions"><X size={20} aria-hidden="true"/></button></form>
        </div>
        <div className="landing-terminal">
          <div className="landing-terminal-bar">
            <span>{install.method}</span>
            <button className="landing-button landing-copy-button" onClick={copyCommands}>
              {copyState === 'copied' ? <Check size={15} aria-hidden="true"/> : <Copy size={15} aria-hidden="true"/>}
              {copyState === 'copied' ? 'Copied' : 'Copy commands'}
            </button>
          </div>
          <pre tabIndex={0} aria-label="Installation commands"><code>{install.command}</code></pre>
        </div>
        <span className="landing-status" role="status">
          {copyState === 'error' ? 'Select and copy the commands above.' : copyState === 'copied' ? 'Installation commands copied.' : ''}
        </span>
        <p>{install.instruction}</p>
        <div className="landing-help-links">
          {install.links.map(([label, href]) => <a className="landing-link" key={href} href={href}>{label}<ArrowUpRight aria-hidden="true" size={14}/></a>)}
        </div>
      </dialog>
    </div>
  );
}
