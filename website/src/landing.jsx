import React, {useRef, useState} from 'react';
import {ArrowDownToLine, ArrowUpRight, Check, Command, Copy, Github, Moon, Pause, Play, Snowflake, Sun, Terminal, X} from 'lucide-react';
import {BREW, RELEASE} from './shared';
import {Snow} from './snow';
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
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('nightfall-theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });
  const [snowPaused, setSnowPaused] = useState(false);
  const [platform, setPlatform] = useState('mac');
  const [copyState, setCopyState] = useState('');
  const install = platforms[platform];

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem('nightfall-theme', next);
    } catch {
      // Keep the theme switch usable if storage is unavailable.
    }
  }

  function openInstaller(platform) {
    setPlatform(platform);
    setCopyState('');
    dialog.current.showModal();
  }

  async function copyCommands() {
    try {
      await navigator.clipboard.writeText(install.command);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  }

  return (
    <div className="landing" data-theme={theme}>
      <div className="landing-snow" aria-hidden="true"><Snow density={0} wind={5} paused={snowPaused}/></div>
      <a className="landing-skip" href="#main-content">Skip to content</a>
      <header className="landing-shell landing-header">
        <a className="landing-brand" href="/"><Snowflake aria-hidden="true" size={24}/>Nightfall</a>
        <div className="landing-header-actions">
          <button className="landing-icon-button" onClick={() => setSnowPaused(!snowPaused)}
            aria-label={snowPaused ? 'Resume snowfall' : 'Pause snowfall'} title={snowPaused ? 'Resume snowfall' : 'Pause snowfall'}>
            {snowPaused ? <Play aria-hidden="true" size={16}/> : <Pause aria-hidden="true" size={16}/>}
          </button>
          <button className="landing-icon-button" onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? <Sun aria-hidden="true" size={18}/> : <Moon aria-hidden="true" size={18}/>}
          </button>
          <a className="landing-link" href={repository}><Github aria-hidden="true" size={17}/>GitHub<ArrowUpRight aria-hidden="true" size={14}/></a>
        </div>
      </header>

      <main className="landing-shell landing-main" id="main-content" tabIndex={-1}>
        <section className="landing-hero" data-enter aria-labelledby="landing-title">
          <div className="landing-copy">
            <h1 id="landing-title">Snow for your<br/> desktop<span>.</span></h1>
            <p>Let it snow over your windows, hang a few lights, and throw a snowball. Nightfall is free and open source.</p>
            <div className="landing-actions">
              <button className="landing-button landing-primary" aria-haspopup="dialog" onClick={() => openInstaller('mac')}><Command aria-hidden="true" size={17}/>macOS</button>
              <button className="landing-button" aria-haspopup="dialog" onClick={() => openInstaller('linux')}><Terminal aria-hidden="true" size={17}/>Arch + Hyprland</button>
            </div>
            <a className="landing-link landing-download" href={RELEASE}><ArrowDownToLine aria-hidden="true" size={15}/>Direct downloads</a>
          </div>
          <div className="landing-preview">
            <img src="/nightfall-desktop.webp" width="1600" height="1041" fetchPriority="high"
              alt="Nightfall in Blizzard mode on macOS, with snow settling on the settings window, Christmas lights, snowmen, and Santa flying overhead"/>
          </div>
        </section>
      </main>

      <footer className="landing-shell landing-footer">
        <Snowflake aria-hidden="true" size={17}/>
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
