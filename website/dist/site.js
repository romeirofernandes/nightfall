const commands={
mac:`# Requires Xcode Command Line Tools, Rust & Node.js
git clone https://github.com/romeirofernandes/nightfall.git
cd nightfall
npm ci
npm run build -- --bundles app
open src-tauri/target/release/bundle/macos/Nightfall.app`,
linux:`sudo pacman -S --needed rust nodejs npm base-devel \\
  webkit2gtk-4.1 gtk3 gtk-layer-shell librsvg \\
  libappindicator-gtk3 patchelf
git clone https://github.com/romeirofernandes/nightfall.git
cd nightfall
npm ci
npm run build -- --no-bundle
./src-tauri/target/release/nightfall`
};
let os=/Mac/i.test(navigator.userAgentData?.platform||navigator.platform)?'mac':'linux';
const detected=/Mac|Linux/i.test(navigator.userAgentData?.platform||navigator.platform);
function select(value){
 os=value;
 document.querySelectorAll('[data-os]').forEach(b=>{const selected=b.dataset.os===os;b.setAttribute('aria-selected',selected);b.tabIndex=selected?0:-1;});
 document.querySelector('#commands').textContent=commands[os];
 document.querySelector('#install-title').textContent=os==='mac'?'A little winter on your Mac.':'A little winter on Arch.';
 document.querySelector('#install-description').textContent=os==='mac'?'Build the native app with the tools already on your Mac. Rust and Node.js must be installed first.':'For Arch Linux with a running Hyprland session. Install the dependencies, then build your own little winter.';
 document.querySelector('#install-footnote').textContent=os==='mac'?'Development build · macOS desktop verification pending. These commands build locally; no signed download is available yet.':'Run from your Hyprland session. Other Linux desktops can open settings, but the overlay needs Wayland layer shell.';
 document.querySelector('#detected').textContent=detected?'YOUR PLATFORM, YOUR LITTLE WINTER':'CHOOSE YOUR PLATFORM';
}
select(os);
document.querySelectorAll('[data-os]').forEach(b=>{b.onclick=()=>select(b.dataset.os);b.onkeydown=e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();select(os==='mac'?'linux':'mac');document.querySelector('[data-os="'+os+'"]').focus();}}});
document.querySelector('#copy').onclick=async()=>{const b=document.querySelector('#copy');try{await navigator.clipboard.writeText(commands[os]);b.textContent='Copied ✓'}catch{b.textContent='Select commands below';const r=document.createRange();r.selectNodeContents(document.querySelector('#commands'));const s=window.getSelection();s.removeAllRanges();s.addRange(r)}setTimeout(()=>b.textContent='Copy commands ⧉',2200)};
const snow=new SnowScene(document.querySelector('#snow'),{demo:true});
document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{snow.level=Number(b.dataset.level);document.querySelectorAll('[data-level]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b)});});
document.querySelector('#demo-pause').onclick=e=>{snow.paused=!snow.paused;e.currentTarget.textContent=snow.paused?'▶':'Ⅱ';e.currentTarget.setAttribute('aria-label',snow.paused?'Resume snow':'Pause snow')};
