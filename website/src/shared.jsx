import React,{useEffect,useState} from 'react';
import {ArrowUpRight,ArrowLeft,ArrowDown,Check,Copy,Command,Snowflake,Plus,ChevronDown,ShieldCheck} from 'lucide-react';
export const BREW='brew tap --custom-remote romeirofernandes/nightfall https://github.com/romeirofernandes/nightfall\nbrew update-reset "$(brew --repository romeirofernandes/nightfall)"\nbrew install --cask romeirofernandes/nightfall/nightfall';
const LINUX='curl -fsSLO https://github.com/romeirofernandes/nightfall/releases/download/v0.3.0/install-linux.sh && \\\nsh install-linux.sh\n~/.local/bin/nightfall';
export const RELEASE='https://github.com/romeirofernandes/nightfall/releases/latest';
export function Logo({name='nightfall'}){return <a href="/" className="brand" aria-label="Nightfall home"><Snowflake strokeWidth={1.4}/><span>{name}</span></a>}
export function DirectionLink({number,name}){return <a className="direction-link" href="/"><ArrowLeft size={14}/><span>All directions</span><i>{number} / {name}</i></a>}
export function Button({children='Get Nightfall',href='#install',secondary=false,className=''}){return <a href={href} className={`btn ${secondary?'btn--secondary':'btn--primary'} ${className}`}>{children}<ArrowUpRight size={18}/></a>}
export function useTaste(moment){
 useEffect(()=>{
  document.documentElement.dataset.ready='1';
  const motionPath='/taste/motion/motion.js'; import(/* @vite-ignore */ motionPath);
  const momentsPath='/taste/moments/moments.js'; if(moment)import(/* @vite-ignore */ momentsPath);
 },[moment]);
}
export function Install({style='alpine'}){
 const [os,setOS]=useState(()=>/Linux/.test(navigator.platform)?'linux':'mac'),[copied,setCopied]=useState(false),[error,setError]=useState('');
 const command=os==='mac'?BREW:LINUX;
 const copy=async()=>{try{await navigator.clipboard.writeText(command);setCopied(true);setError('');setTimeout(()=>setCopied(false),1800)}catch{setError('Select and copy the commands below.')}};
 return <div className={`install-box install-${style}`}>
  <div className="install-os" role="tablist" aria-label="Choose operating system" onKeyDown={e=>{const tabs=[...e.currentTarget.querySelectorAll('[role="tab"]')];const i=tabs.indexOf(document.activeElement);const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:e.key==='ArrowRight'?(i+1)%tabs.length:e.key==='ArrowLeft'?(i+tabs.length-1)%tabs.length:-1;if(next>=0){e.preventDefault();tabs[next].focus();tabs[next].click();}}}><button id={style+'-mac'} role="tab" aria-controls={style+'-commands'} aria-selected={os==='mac'} onClick={()=>setOS('mac')}><Command size={16}/>macOS</button><button id={style+'-linux'} role="tab" aria-controls={style+'-commands'} aria-selected={os==='linux'} onClick={()=>setOS('linux')}><span className="linux-mark">⌘</span>Arch + Hyprland</button><span className="version">v0.3.0</span></div>
  <div className="terminal-heading"><span><i/><i/><i/></span><span>{os==='mac'?'Homebrew':'Terminal'}</span><button onClick={copy} aria-label="Copy installation commands">{copied?<Check size={15}/>:<Copy size={15}/>} {copied?'Copied':'Copy'}</button></div>
  <div role="tabpanel" id={style+'-commands'} aria-labelledby={style+'-'+os} tabIndex={0}><pre><code>{command}</code></pre></div>
  <div className="install-after"><span className="status-bead"/>{os==='mac'?'Then open Nightfall from Applications.':'Run Nightfall from your Hyprland session.'}</div>
  {error&&<p role="status">{error}</p>}
  <div className="install-links"><a href={RELEASE}>Direct downloads <ArrowUpRight size={14}/></a>{os==='mac'&&<a href="https://brew.sh" target="_blank" rel="noreferrer">Get Homebrew <ArrowUpRight size={14}/></a>}<span>Free · runs locally</span></div>
  {os==='mac'&&<a className="first-launch-link" href="https://github.com/romeirofernandes/nightfall/blob/main/distribution/HOMEBREW-RECOVERY.md">Already used the old tap? Repair installation ↗</a>}
  {os==='mac'&&<a className="first-launch-link" href="/mac-help/"><ShieldCheck size={15}/>macOS says “Not Opened”? Here’s the first-launch guide.<ArrowUpRight size={14}/></a>}
 </div>;
}
export function FAQ({style='alpine'}){
 const items=[
  ['Can I keep working?', 'Yes. The overlay passes mouse clicks through to your apps. Pause or stop the snow whenever you like.'],
  ['What gets installed?', 'A prebuilt app for your Mac’s processor, or a Linux x64 binary. Preferences stay on your device.'],
  ['Why the macOS warning?', 'The current build is ad-hoc signed and isn’t Apple-notarized. The first-launch guide explains the app-specific approval.'],
  ['Where does the snow work?', 'Nightfall targets macOS and Hyprland. Fullscreen apps and scaled multi-monitor setups still need wider runtime testing.']
 ];
 return <div className={`faq-list faq-${style}`}>{items.map(([q,a])=><details key={q}><summary>{q}<Plus size={18}/></summary><p>{a}{q==='Why the macOS warning?'&&<> <a href="/mac-help/">Read the guide ↗</a></>}</p></details>)}</div>;
}
export function SmallFooter({style='alpine'}){return <div className={`small-footer footer-${style}`}><Logo/><span>Desktop snow. Made with Rust + Tauri.</span><a href="https://github.com/romeirofernandes/nightfall">GitHub <ArrowUpRight size={14}/></a><span>© 2026</span></div>}
export function MacHelp(){return <div className="mac-help page-gallery"><header className="site-shell flex items-center justify-between"><Logo/><a className="text-link" href="/"><ArrowLeft size={16}/>Back to Nightfall</a></header><main className="help-shell"><span className="eyebrow">First launch on macOS</span><h1>“Nightfall”<br/>Not Opened.</h1><p className="help-lead">That message is Gatekeeper asking for approval. The current release is ad-hoc signed, not Apple-notarized.</p><ol className="help-steps"><li><span>01</span><div><h2>Click Done.</h2><p>Keep the app in Applications. You don’t need to move it to the Bin.</p></div></li><li><span>02</span><div><h2>Open Privacy & Security.</h2><p>In System Settings, scroll to the message about Nightfall.</p></div></li><li><span>03</span><div><h2>Choose Open Anyway.</h2><p>Confirm the app-specific exception and authenticate if macOS asks. Then confirm Open.</p></div></li></ol><div className="help-note"><ShieldCheck/><p>Keep Gatekeeper enabled. Nightfall doesn’t need a system-wide security exception.</p></div><p className="help-small">The permanent distribution fix is Developer ID signing and Apple notarization. That needs the owner’s Apple Developer certificate and account credentials; it has not been completed yet.</p><div className="flex flex-wrap gap-4 mt-8"><Button href="https://support.apple.com/en-us/102445">Apple’s opening guide</Button><Button href={RELEASE} secondary>Current downloads</Button></div></main></div>}
