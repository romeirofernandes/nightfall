import React, {useEffect, useRef, useState} from 'react';
import {ArrowDownToLine, ArrowUpRight, Check, Copy, Github, Moon, Pause, Play, Snowflake, Sun, Sunrise, Sunset, Terminal, X, Sparkles} from 'lucide-react';
import '@fontsource/prata/latin-400.css';
import gsap from 'gsap';
import {BREW, RELEASE} from './shared';
import {Snow} from './snow';
import {useWinterTime} from './use-winter-time';
import './landing.css';

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
  const {mode, phase: theme, selectMode, position} = useWinterTime();
  const [snowPaused, setSnowPaused] = useState(false);
  const [platform, setPlatform] = useState('mac');
  const [copyState, setCopyState] = useState('');
  const install = platforms[platform];
  useEffect(() => {
    const context = gsap.context(() => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.landing-copy > *', { y: 18, opacity: 0, duration: 1, stagger: .1, ease: 'power3.out', clearProps: 'all' });
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
        <section className="landing-hero hero" data-enter aria-labelledby="landing-title">
          <div className="winter-world" aria-hidden="true">
            {['day', 'evening', 'night'].map(light => <img key={light}
              className={'winter-landscape winter-' + light}
              data-active={light === (theme === 'morning' || theme === 'afternoon' ? 'day' : theme)}
              src={'/media/winter/alpine-' + light + '.jpg'} width="1487" height="1058"
              fetchPriority={light === (theme === 'morning' || theme === 'afternoon' ? 'day' : theme) ? 'high' : 'low'} alt=""/>)}
            <div className="winter-sky"/>
            <div className="winter-celestial" style={{'--orb-x':position.x + '%','--orb-y':position.y + '%'}}/>
          </div>
          <div className="landing-snow" aria-hidden="true"><Snow density={0} wind={5} paused={snowPaused}/></div>
          <header className="landing-shell landing-header">
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
          <div className="landing-shell landing-copy">
            <h1 id="landing-title">A little winter.<span> All yours.</span></h1>
            <p>Free desktop snow for macOS &amp; Hyprland.</p>
            <div className="landing-actions">
              <button className="landing-button landing-primary" aria-haspopup="dialog" onClick={() => openInstaller('mac')}><ArrowDownToLine aria-hidden="true" size={18}/>Get Nightfall</button>
              <button className="landing-button landing-secondary" aria-haspopup="dialog" onClick={() => openInstaller('linux')}><Terminal aria-hidden="true" size={17}/>Install on Linux<ArrowUpRight aria-hidden="true" size={15}/></button>
            </div>
            <a className="landing-link landing-download" href={RELEASE}>All downloads<ArrowUpRight aria-hidden="true" size={13}/></a>
          </div>
          <div className="winter-time">
            <p className="winter-time-status" aria-live="polite">{mode === 'auto' ? 'Your local time. Your little winter.' : 'A change of light. A change of pace.'}</p>
            <fieldset className="winter-time-switch">
              <legend className="sr-only">Choose the time of day</legend>
              {[[Sparkles,'auto','Auto'],[Sunrise,'morning','Morning'],[Sun,'afternoon','Afternoon'],[Sunset,'evening','Evening'],[Moon,'night','Night']].map(([Icon, value, label]) =>
                <button key={value} type="button" aria-pressed={mode === value} onClick={() => selectMode(value)}>
                  <Icon aria-hidden="true" size={16}/><span>{label}</span>
                </button>)}
            </fieldset>
            <span className="sr-only" role="status">{mode === 'auto' ? 'Following local time: ' : 'Scene: '}{theme}</span>
          </div>
        </section>
      </main>
      <footer className="landing-shell landing-footer">
        <span><Snowflake aria-hidden="true" size={16}/>A little winter for your desktop.</span>
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
