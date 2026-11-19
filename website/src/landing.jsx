import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ArrowDown, ArrowDownToLine, ArrowUpRight, Check, Copy, Github, Moon, Snowflake, Sun, X} from 'lucide-react';
import gsap from 'gsap';
import {BREW, RELEASE} from './shared';
import {Snow} from './snow';
import {SnowFill} from './snow-fill';
import {SnowSurfaces} from './snow-surfaces';
import {Celestial} from './celestial';
import {useWinterTime} from './use-winter-time';
import {detectInstallPlatform} from './install-platform';
import {useWinterScroll} from './use-winter-scroll';
import './landing.css';

const scenery = {day: '/media/winter/alpine-day.jpg', evening: '/media/winter/alpine-evening.jpg', night: '/media/winter/alpine-night.jpg'};
const repository = 'https://github.com/romeirofernandes/nightfall';
const winterFeatures = [
  {id: 'weather', title: 'Set the snowfall', description: 'Pick a flurry or a blizzard, then set the wind to suit your desktop.'},
  {id: 'ledges', title: 'Let it settle', description: 'Snow gathers along window edges, with icicles hanging below.'},
  {id: 'decorations', title: 'Dress up your desktop', description: 'Put up Christmas lights and make room for a few snowmen.'},
];
// Bulb centers in the transparent 1536 × 260 strand artwork.
const featureBulbs = [
  [38,71], [107,114], [177,147], [249,175], [326,190], [409,195], [484,189],
  [560,171], [629,145], [705,110], [768,69], [833,110], [906,147], [977,172],
  [1056,190], [1137,197], [1215,189], [1287,173], [1365,147], [1435,114], [1499,71],
];
const bulbInterval = 1.1;
const bulbCycle = featureBulbs.length * bulbInterval;
const platforms = {
  mac: {
    name: 'macOS',
    method: 'Terminal',
    command: BREW,
    instruction: 'With Homebrew installed, run these commands in Terminal. Then open Nightfall from Applications.',
    links: [
      ['Get Homebrew', 'https://brew.sh/'],
      ['First-launch help', '/mac-help/'],
      ['Repair an older tap', repository + '/blob/main/distribution/HOMEBREW-RECOVERY.md'],
    ],
  },
  linux: {
    name: 'Linux',
    method: 'Terminal',
    command: 'curl -fsSL https://raw.githubusercontent.com/romeirofernandes/nightfall/main/distribution/install.sh -o /tmp/nightfall-install.sh\nbash /tmp/nightfall-install.sh',
    instruction: 'Check the Linux requirements, then run these commands in your terminal and open Nightfall from your app launcher.',
    links: [['Linux requirements', repository + '/blob/main/distribution/README.md']],
  },
  windows: {
    name: 'Windows',
    method: 'PowerShell',
    command: `& {
  $script = Join-Path $env:TEMP 'nightfall-download-windows.ps1'
  Invoke-WebRequest -UseBasicParsing -Uri 'https://raw.githubusercontent.com/romeirofernandes/nightfall/main/distribution/download-windows.ps1' -OutFile $script -ErrorAction Stop
  & $script
}`,
    instruction: 'Once a Windows x64 release is published, run these commands in PowerShell or the PowerShell profile in Windows Terminal. Then open Nightfall from the extracted folder in Downloads.',
    links: [['Windows requirements', repository + '/blob/main/distribution/README.md#windows'], ['Release downloads', RELEASE]],
  },
};

function InstallAction({openInstaller, platform}) {
  if (!platform) {
    return <a data-snow-surface className="landing-button landing-primary" href="#get-nightfall">
      <ArrowDownToLine aria-hidden="true" size={18}/>See install options
    </a>;
  }

  return (
    <button data-snow-surface className="landing-button landing-primary" aria-haspopup="dialog" onClick={() => openInstaller(platform)}>
      <ArrowDownToLine aria-hidden="true" size={18}/>Install on {platforms[platform].name}
    </button>
  );
}

function GithubSnowLink({field}) {
  const label = <><Github aria-hidden="true" size={17}/>GitHub<ArrowUpRight aria-hidden="true" size={15}/></>;
  return (
    <a data-snow-surface className="landing-button landing-secondary" href={repository}>
      <SnowFill field={field}/>
      <span className="snow-button-label">{label}</span>
      <span className="snow-button-label snow-button-label-filled" aria-hidden="true">{label}</span>
    </a>
  );
}

function ChristmasFooter({theme, themes, openInstaller, sweepTarget, field}) {
  const [loaded, setLoaded] = useState([]);
  const [displayed, setDisplayed] = useState(theme);
  useEffect(() => {
    if (loaded.includes(theme)) setDisplayed(theme);
  }, [loaded, theme]);

  return (
    <footer id="get-nightfall" className="winter-closing" aria-label="Install Nightfall and resources">
      <div className="winter-footer-art" aria-hidden="true">
        {themes.map(light => (
          <img key={light} className="winter-footer-scene" data-active={displayed === light}
            src={`/media/winter/footer-${light}.webp`} alt="" width="1774" height="887" decoding="async"
            loading={light === displayed ? 'lazy' : 'eager'}
            onLoad={() => setLoaded(previous => previous.includes(light) ? previous : [...previous, light])}/>
        ))}
      </div>
      <div className="landing-shell winter-install-tray" ref={sweepTarget}>
        <h2 id="platform-install-title">Get Nightfall</h2>
        <div className="landing-actions" role="group" aria-labelledby="platform-install-title">
          {Object.keys(platforms).map(platform => (
            <InstallAction key={platform} platform={platform} openInstaller={openInstaller}/>
          ))}
        </div>
        <nav className="landing-footer-links" aria-label="Footer">
          <a className="landing-link" href={RELEASE}>All downloads<ArrowUpRight aria-hidden="true" size={13}/></a>
          <a className="landing-link" href={repository}>GitHub<ArrowUpRight aria-hidden="true" size={13}/></a>
          <a className="landing-link" href="/mac-help/">macOS help</a>
        </nav>
        <p>crafted by <a href="https://romeiro.dev">romeiro</a>, <a href="https://russel.is-a.dev">russel</a> &amp; <a href="https://gavin-soares.vercel.app">gavin</a>'s agents</p>
      </div>
      <SnowSurfaces field={field}/>
    </footer>
  );
}

export function Landing() {
  const dialog = useRef(null);
  const hero = useRef(null);
  const snowField = useRef(null);
  const previewSnowField = useRef(null);
  const featureSnowField = useRef(null);
  const footerSnowField = useRef(null);
  const installSnowTarget = useRef(null);
  const landingSnowFields = useMemo(() => [snowField, previewSnowField, featureSnowField, footerSnowField], []);
  const [devicePlatform] = useState(() => detectInstallPlatform(navigator));
  const {phase: theme, selectMode, position} = useWinterTime();
  const sceneLight = theme === 'morning' || theme === 'afternoon' ? 'day' : theme;
  const [seenThemes, setSeenThemes] = useState([theme]);
  useEffect(() => { setSeenThemes(previous => previous.includes(theme) ? previous : [...previous, theme]); }, [theme]);
  const foregroundThemes = seenThemes.includes(theme) ? seenThemes : [...seenThemes, theme];
  const [platform, setPlatform] = useState('mac');
  const [copyState, setCopyState] = useState('');
  const install = platforms[platform];
  useWinterScroll(hero);
  useEffect(() => {
    const context = gsap.context(() => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        const entrance = gsap.timeline();
        entrance.from('.winter-world', { scale: 1.055, duration: 2.2, ease: 'power3.out', clearProps: 'transform' }, 0)
          .from('.landing-copy h1', { y: 35, clipPath: 'inset(0 0 100% 0)', duration: 1.3, ease: 'power3.out', clearProps: 'all' }, .15)
          .from('.landing-copy > p, .landing-copy .landing-actions', { y: 18, opacity: 0, duration: .9, stagger: .14, ease: 'power3.out', clearProps: 'all' }, .65);
      });
    }, hero);
    return () => context.revert();
  }, []);
  const toggleTheme = useCallback(() => {
    selectMode(theme === 'night' ? 'afternoon' : 'night');
  }, [selectMode, theme]);

  useEffect(() => {
    function handleThemeShortcut(event) {
      if (event.defaultPrevented || event.repeat || event.isComposing || event.altKey ||
          event.ctrlKey || event.metaKey || event.shiftKey || event.key?.toLowerCase() !== 'd' ||
          dialog.current.open || event.target instanceof HTMLElement &&
          (event.target.isContentEditable || event.target.closest('input, textarea, select, [role="textbox"]'))) return;
      toggleTheme();
    }
    window.addEventListener('keydown', handleThemeShortcut);
    return () => window.removeEventListener('keydown', handleThemeShortcut);
  }, [toggleTheme]);

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
      <div className="winter-snowfall" aria-hidden="true">
        <Snow density={2} wind={9} passageTheme={theme} surfaceFields={landingSnowFields} sweepTarget={installSnowTarget}/>
      </div>
      <main id="main-content" tabIndex={-1}>
        <div className="winter-journey">
        <section className="landing-hero hero" data-enter aria-labelledby="landing-title">
          <div className="winter-world hero__bg" aria-hidden="true">
            <div className="winter-distance">
            {['day', 'evening', 'night'].map(light => <img key={light}
              className={'winter-landscape winter-' + light}
              data-active={light === sceneLight}
              src={scenery[light]} width="1672" height="941"
              fetchPriority={light === sceneLight ? 'high' : 'low'} alt=""/>)}
            </div>
            <Celestial phase={theme} position={position}/>
          </div>
          <header className="landing-shell wrap landing-header">
            <a className="landing-brand" href="/" aria-label="Nightfall home"><Snowflake aria-hidden="true" size={27}/>Nightfall</a>
            <div className="landing-header-actions">
              <button className="landing-icon-button landing-theme-toggle" onClick={toggleTheme} aria-keyshortcuts="D"
                aria-label={theme === 'night' ? 'Switch to afternoon' : 'Switch to night'} title={theme === 'night' ? 'Switch to afternoon (D)' : 'Switch to night (D)'}>
                <Sun aria-hidden="true" size={18} data-active={theme === 'night'}/>
                <Moon aria-hidden="true" size={18} data-active={theme !== 'night'}/>
              </button>
            </div>
          </header>
          <div className="landing-shell wrap landing-copy">
            <h1 id="landing-title">A little winter.<span> All yours.</span></h1>
            <p>Free snow for your desktop.</p>
            <div className="landing-actions">
              <InstallAction openInstaller={openInstaller} platform={devicePlatform}/>
              <GithubSnowLink field={snowField}/>
            </div>
          </div>
          <div className="winter-near winter-near-left" aria-hidden="true">{foregroundThemes.map(light => <img key={light} data-active={theme === light} ref={node => { if (node?.complete && node.naturalWidth) node.dataset.ready = 'true'; }} onLoad={event => { event.currentTarget.dataset.ready = 'true'; }} src={light === 'afternoon' ? '/media/winter/foreground-pines.png' : '/media/winter/foreground-' + light + '.png'} alt="" width="1672" height="941"/>)}</div>
          <div className="winter-near winter-near-right" aria-hidden="true">{foregroundThemes.map(light => <img key={light} data-active={theme === light} ref={node => { if (node?.complete && node.naturalWidth) node.dataset.ready = 'true'; }} onLoad={event => { event.currentTarget.dataset.ready = 'true'; }} src={light === 'afternoon' ? '/media/winter/foreground-pines.png' : '/media/winter/foreground-' + light + '.png'} alt="" width="1672" height="941"/>)}</div>
          <div className="winter-passage-shade" aria-hidden="true"/>
          <a className="winter-scroll-cue" href="#winter-passage" aria-label="Explore the winter scene"><ArrowDown size={20} aria-hidden="true"/></a>
          <SnowSurfaces field={snowField}/>
        </section>
        <section id="winter-passage" className="winter-passage" aria-labelledby="winter-passage-title">
          <div className="landing-shell winter-passage-copy">
            <h2 id="winter-passage-title">A snow day on your desktop.</h2>
            <p>Snow falls across your desktop and gathers on your windows.</p>
            <figure className="winter-desktop-preview" data-snow-surface="preview" data-snow-occluder>
              <img src="/nightfall-desktop.webp" width="1600" height="1041" loading="lazy" decoding="async"
                alt="Nightfall running on macOS, with falling snow, Christmas lights, and snow settled along the top of its Weather window."/>
            </figure>
          </div>
          <SnowSurfaces field={previewSnowField}/>
        </section>
        </div>
        <div className="winter-finale">
          <section className="winter-features" id="winter-features" aria-labelledby="winter-features-title">
            <div className="winter-feature-lights" aria-hidden="true">
              <img src="/media/winter/feature-lights.webp" alt="" width="1536" height="260" loading="lazy" decoding="async"/>
              {featureBulbs.map(([x, y], i) => {
                // Visit every bulb once per cycle, skipping along the strand between glints.
                const turn = i * 8 % featureBulbs.length;
                return <span className="winter-feature-bulb" key={x} style={{
                  left: `${x / 15.36}%`, top: `${y / 2.6}%`,
                  '--spark-delay': `${turn * bulbInterval - bulbCycle}s`,
                  '--spark-period': `${bulbCycle}s`,
                }}/>;
              })}
            </div>
            <div className="landing-shell winter-features-content">
              <h2 id="winter-features-title">Make it snow your way.</h2>
              <ul className="winter-feature-list">
                {winterFeatures.map(({id, title, description}) => (
                  <li key={id} className="winter-feature">
                    <div className="winter-feature-capture" data-detail={id} data-snow-surface="feature" data-snow-occluder aria-hidden="true"/>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
          <SnowSurfaces field={featureSnowField}/>
        </div>
      </main>
      <ChristmasFooter theme={theme} themes={foregroundThemes}
        openInstaller={openInstaller} sweepTarget={installSnowTarget} field={footerSnowField}/>
      <dialog className="landing-dialog" ref={dialog} aria-labelledby="install-title">
        <div className="landing-dialog-header">
          <h2 id="install-title"><Snowflake size={28} aria-hidden="true"/>Install on {install.name}</h2>
          <form method="dialog"><button className="landing-button landing-close" aria-label="Close installation instructions"><X size={20} aria-hidden="true"/></button></form>
        </div>
        <div className="landing-dialog-body">
          <p>{install.instruction}</p>
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
          <div className="landing-help-links">
            {install.links.map(([label, href]) => <a className="landing-link" key={href} href={href}>{label}<ArrowUpRight aria-hidden="true" size={14}/></a>)}
          </div>
        </div>
      </dialog>
    </div>
  );
}
