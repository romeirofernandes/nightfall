import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ArrowDown, ArrowDownToLine, ArrowUpRight, Check, ChevronRight, Copy, Github, Snowflake, X} from 'lucide-react';
import gsap from 'gsap';
import {BREW, RELEASE} from './shared';
import {Snow} from './snow';
import {SnowFill} from './snow-fill';
import {SnowSurfaces} from './snow-surfaces';
import {Celestial} from './celestial';
import {useWinterTime} from './use-winter-time';
import {getWindowsDownloads} from './install-platform';
import {useWinterScroll} from './use-winter-scroll';
import './landing.css';

const landscapePhases = ['morning', 'afternoon', 'evening', 'night'];
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
    instruction: 'With Homebrew installed, paste the commands below into Terminal.',
    launch: 'Open Nightfall from Applications.',
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
    instruction: 'Check the Linux requirements, then paste the commands below into your terminal.',
    launch: 'Open Nightfall from your app launcher.',
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
    instruction: 'Once a Windows x64 release is published, paste the commands below into PowerShell or a PowerShell profile in Windows Terminal.',
    launch: 'Open nightfall-renderer.exe from the extracted folder in Downloads.',
    links: [['Windows requirements', repository + '/blob/main/distribution/README.md#windows'], ['Release downloads', RELEASE]],
  },
};


const latestReleaseApi = 'https://api.github.com/repos/romeirofernandes/nightfall/releases/latest';

function WindowsDownloads({release}) {
  const {installer, portable} = release ?? {};
  const status = release === null ? 'Checking GitHub for the Windows x64 download…'
    : release === 'error' ? 'Couldn’t check the Windows download. Open GitHub Releases to check manually.'
    : installer || portable ? 'Windows x64 downloads are available.'
    : 'A Windows x64 download has yet to be published on GitHub.';

  return (
    <>
      <p role="status">{status}</p>
      {(installer || portable) && (
        <div className="landing-windows-downloads">
          {installer && <a className="landing-button landing-primary" href={installer}><ArrowDownToLine aria-hidden="true" size={18}/>Download installer (.exe)</a>}
          {portable && <a className={installer ? 'landing-link' : 'landing-button landing-primary'} href={portable}><ArrowDownToLine aria-hidden="true" size={18}/>Download portable ZIP</a>}
        </div>
      )}
      {installer && <p>Run the installer, then open Nightfall from the Start menu.</p>}
      {portable && <p>For the portable version, extract the ZIP and open <code>nightfall-renderer.exe</code>.</p>}
    </>
  );
}

function GithubSnowLink({field}) {
  const label = <><Github aria-hidden="true" size={17}/>GitHub<ArrowUpRight aria-hidden="true" size={15}/></>;
  return (
    <a data-snow-surface className="landing-button landing-secondary snow-fill-control" href={repository}>
      <SnowFill field={field}/>
      <span className="snow-button-label">{label}</span>
      <span className="snow-button-label snow-button-label-filled" aria-hidden="true">{label}</span>
    </a>
  );
}

function WinterEnding({theme, themes, openInstaller, sweepTarget, field}) {
  const [loaded, setLoaded] = useState([]);
  const [displayed, setDisplayed] = useState(theme);
  useEffect(() => {
    if (loaded.includes(theme)) setDisplayed(theme);
  }, [loaded, theme]);

  return (
    <div className="winter-ending">
      <div className="winter-footer-art" aria-hidden="true">
        {themes.map(light => (
          <img key={light} className="winter-footer-scene" data-active={displayed === light}
            src={`/media/winter/footer-${light}.webp`} alt="" width="1774" height="887" decoding="async"
            loading={light === displayed ? 'lazy' : 'eager'}
            onLoad={() => setLoaded(previous => previous.includes(light) ? previous : [...previous, light])}/>
        ))}
      </div>
      <section className="landing-shell winter-install-tray" ref={sweepTarget} aria-labelledby="get-nightfall">
        <h2 id="get-nightfall" tabIndex={-1}>Get Nightfall</h2>
        <ul className="winter-platforms" aria-label="Installation platforms" data-snow-surface="segmented">
          {Object.entries(platforms).map(([key, platform]) => {
            const label = <>{platform.name}<ChevronRight size={16} aria-hidden="true"/></>;
            return (
              <li key={key}>
                <button className="winter-platform snow-fill-control" aria-haspopup="dialog" aria-label={`Install on ${platform.name}`}
                  onClick={() => openInstaller(key)}>
                  <SnowFill field={field}/>
                  <span className="snow-button-label">{label}</span>
                  <span className="snow-button-label snow-button-label-filled" aria-hidden="true">{label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
      <footer className="winter-footer">
        <div className="landing-shell winter-footer-content">
          <nav className="landing-footer-links" aria-label="Footer">
            <a className="landing-link" href={RELEASE}>All downloads<ArrowUpRight aria-hidden="true" size={13}/></a>
            <a className="landing-link" href={repository}>GitHub<ArrowUpRight aria-hidden="true" size={13}/></a>
            <a className="landing-link" href="/mac-help/">macOS help</a>
          </nav>
          <p className="winter-credits">crafted by <a href="https://romeiro.dev">romeiro</a>, <a href="https://russel.is-a.dev">russel</a> &amp; <a href="https://gavin-soares.vercel.app">gavin</a>'s agents</p>
        </div>
      </footer>
      <SnowSurfaces field={field}/>
    </div>
  );
}

function isBackdropEvent(event) {
  if (event.target !== event.currentTarget) return false;
  const {left, right, top, bottom} = event.currentTarget.getBoundingClientRect();
  return event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom;
}

export function Landing() {
  const dialog = useRef(null);
  const pressedBackdrop = useRef(false);
  const hero = useRef(null);
  const snowField = useRef(null);
  const previewSnowField = useRef(null);
  const featureSnowField = useRef(null);
  const footerSnowField = useRef(null);
  const installSnowTarget = useRef(null);
  const landingSnowFields = useMemo(() => [snowField, previewSnowField, featureSnowField, footerSnowField], []);
  const {phase: theme, selectMode, position} = useWinterTime();
  const [visibleLandscape, setVisibleLandscape] = useState(theme);
  const [loadedLandscapes, setLoadedLandscapes] = useState([]);
  useEffect(() => {
    if (loadedLandscapes.includes(theme)) setVisibleLandscape(theme);
  }, [loadedLandscapes, theme]);
  const [seenThemes, setSeenThemes] = useState([theme]);
  useEffect(() => { setSeenThemes(previous => previous.includes(theme) ? previous : [...previous, theme]); }, [theme]);
  const endingThemes = seenThemes.includes(theme) ? seenThemes : [...seenThemes, theme];
  const [platform, setPlatform] = useState('mac');
  const [copyState, setCopyState] = useState('');
  const [windowsRelease, setWindowsRelease] = useState(null);
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
    pressedBackdrop.current = false;
    setPlatform(platform); setCopyState(''); dialog.current.showModal();
    if (platform === 'windows') checkWindowsRelease();
  }
  async function checkWindowsRelease() {
    setWindowsRelease(null);
    try {
      const response = await fetch(latestReleaseApi, {signal: AbortSignal.timeout(8000)});
      if (!response.ok) throw new Error('GitHub release lookup failed');
      setWindowsRelease(getWindowsDownloads(await response.json(), RELEASE));
    } catch {
      setWindowsRelease('error');
    }
  }
  async function copyCommands() {
    try { await navigator.clipboard.writeText(install.command); setCopyState('copied'); }
    catch { setCopyState('error'); }
  }
  const installSteps = (
    <ol className="landing-install-steps">
      <li>
        <h3>Run the commands</h3>
        <p>{install.instruction}</p>
        <div className="landing-terminal">
          <pre tabIndex={0} aria-label={`${install.method} installation commands`}><code>{install.command}</code></pre>
          <button className="landing-button landing-copy-button" onClick={copyCommands}>
            {copyState === 'copied' ? <Check size={15} aria-hidden="true"/> : <Copy size={15} aria-hidden="true"/>}
            {copyState === 'copied' ? 'Copied' : 'Copy commands'}
          </button>
        </div>
        <span className="landing-status" role="status">
          {copyState === 'error' ? 'Select and copy the commands above.' : copyState === 'copied' ? 'Installation commands copied.' : ''}
        </span>
      </li>
      <li>
        <h3>Open Nightfall</h3>
        <p>{install.launch}</p>
      </li>
    </ol>
  );
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
              {landscapePhases.map(light => (
                <img key={light} className="winter-landscape" data-active={light === visibleLandscape}
                  src={`/media/winter/hero-${light}.webp`} alt="" width="1672" height="941" decoding="async"
                  fetchPriority={light === visibleLandscape ? 'high' : 'low'}
                  onLoad={() => setLoadedLandscapes(loaded => loaded.includes(light) ? loaded : [...loaded, light])}/>
              ))}
            </div>
            <Celestial phase={theme} position={position}/>
          </div>
          <header className="landing-shell wrap landing-header">
            <a className="landing-brand" href="/" aria-label="Nightfall home"><Snowflake aria-hidden="true" size={27}/>Nightfall</a>
            <div className="landing-header-actions">
              <button className="landing-icon-button landing-theme-toggle" onClick={toggleTheme} aria-keyshortcuts="D"
                aria-label={theme === 'night' ? 'Switch to afternoon' : 'Switch to night'} title={theme === 'night' ? 'Switch to afternoon (D)' : 'Switch to night (D)'}>
                <svg aria-hidden="true" width="23" height="23" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.65" strokeLinecap="round">
                  <circle cx="12" cy="12" r="9.25"/>
                  <path d="M12 2.75v18.5m0-13.875h8m-8 4.625h9.25M12 16.625h8"/>
                </svg>
              </button>
            </div>
          </header>
          <div className="landing-shell wrap landing-copy">
            <h1 id="landing-title">A little winter.<span> All yours.</span></h1>
            <p>Free snow for your desktop.</p>
            <div className="landing-actions">
              <a data-snow-surface className="landing-button landing-primary" href="#get-nightfall">
                <ArrowDownToLine aria-hidden="true" size={18}/>Install now
              </a>
              <GithubSnowLink field={snowField}/>
            </div>
          </div>
          {['left', 'right'].map(side => (
            <div key={side} className={`winter-near winter-near-${side}`} aria-hidden="true">
              <img src="/media/winter/hero-spruce.webp" alt="" width="1672" height="941" decoding="async"/>
            </div>
          ))}
          <div className="winter-passage-shade" aria-hidden="true"/>
          <a className="winter-scroll-cue" href="#winter-passage" aria-label="Explore the winter scene"><ArrowDown size={20} aria-hidden="true"/></a>
          <SnowSurfaces field={snowField}/>
        </section>
        <section id="winter-passage" className="winter-passage" aria-labelledby="winter-passage-title">
          <div className="landing-shell winter-passage-copy">
            <h2 id="winter-passage-title">A snow day on your desktop.</h2>
            <p>Snow falls across your desktop and gathers on your windows.</p>
            <figure className="winter-image-frame winter-desktop-preview" data-snow-surface="preview" data-snow-occluder>
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
                    <div className="winter-image-frame winter-feature-capture" data-detail={id}
                      data-snow-surface="feature" data-snow-occluder aria-hidden="true"/>
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
      <WinterEnding theme={theme} themes={endingThemes}
        openInstaller={openInstaller} sweepTarget={installSnowTarget} field={footerSnowField}/>
      <dialog className="landing-dialog" ref={dialog} aria-labelledby="install-title"
        onPointerDown={event => { pressedBackdrop.current = isBackdropEvent(event); }}
        onClick={event => {
          if (pressedBackdrop.current && isBackdropEvent(event)) event.currentTarget.close();
          pressedBackdrop.current = false;
        }}>
        <header className="landing-dialog-header">
          <h2 id="install-title">Install on {install.name}</h2>
          <form method="dialog">
            <button className="landing-icon-button landing-close" aria-label="Close installation instructions">
              <X size={20} aria-hidden="true"/>
            </button>
          </form>
        </header>
        {platform === 'windows' ? (
          <div className="landing-windows-install">
            <WindowsDownloads release={windowsRelease}/>
            <details>
              <summary>Install with PowerShell</summary>
              {installSteps}
            </details>
          </div>
        ) : installSteps}
        <div className="landing-help-links">
          {install.links.map(([label, href]) => <a className="landing-link" key={href} href={href}>{label}<ArrowUpRight aria-hidden="true" size={14}/></a>)}
        </div>
      </dialog>
    </div>
  );
}
