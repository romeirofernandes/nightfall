import './snow-desktop.js';
const platform=navigator.userAgentData?.platform||navigator.platform;
if(/Linux/i.test(platform))document.getElementById('linux-tab').click();
document.querySelectorAll('[data-weather]').forEach(button=>button.addEventListener('click',()=>{
 const scene=document.getElementById('playground');scene.level=Number(button.dataset.weather);
 document.querySelectorAll('[data-weather]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button))});
}));
document.querySelectorAll('[data-pause-for]').forEach(button=>button.addEventListener('click',()=>{
 const id=button.dataset.pauseFor,scene=document.getElementById(id)||document.querySelector('.'+id);const paused=scene.toggle();
 button.textContent=paused?'▶':'Ⅱ';button.setAttribute('aria-label',paused?'Resume snow':'Pause snow');
 const status=button.closest('.weather-card')?.querySelector('.weather-card__bottom>span:first-child');if(status)status.textContent=paused?'Snowfall is paused':'Snowfall is on';
}));
document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{
 const code=document.getElementById(button.dataset.copy);const text=code.textContent.replace(/^\$ /,'');const status=document.querySelector('.copy-status');
 try{await navigator.clipboard.writeText(text);button.innerHTML='Copied <span>✓</span>';status.textContent='Install command copied.';}catch{const range=document.createRange();range.selectNodeContents(code);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);status.textContent='Select and copy the command above.';}
 setTimeout(()=>{button.innerHTML='Copy <span>⧉</span>';status.textContent='';},2200);
}));
document.documentElement.dataset.ready='1';
function platformDetails(os){
 const linux=os==='linux';document.getElementById('platform-title').textContent=linux?'Nightfall for Hyprland':'Nightfall for Mac';
 document.getElementById('platform-requirements').innerHTML=linux?'Linux x64<br>Arch + Hyprland':'Apple Silicon & Intel<br>macOS 11 or newer';
 document.getElementById('platform-note').textContent=linux?'The overlay requires Wayland layer shell. Install the system libraries shown in the terminal, then run Nightfall inside your Hyprland session.':'This release is ad-hoc signed, not Apple-notarized. macOS may ask you to allow the first launch in System Settings → Privacy & Security.';
}
document.querySelectorAll('[data-os]').forEach(b=>b.addEventListener('click',()=>platformDetails(b.dataset.os)));
platformDetails(/Linux/i.test(platform)?'linux':'mac');
for(const button of document.querySelectorAll('[data-pause-for]')){
 const id=button.dataset.pauseFor,scene=document.getElementById(id)||document.querySelector('.'+id);
 if(scene?.paused){button.textContent='▶';button.setAttribute('aria-label','Resume snow');}
}
new MutationObserver(()=>{
 const selected=document.querySelector('[data-os][aria-selected="true"]');
 if(selected)platformDetails(selected.dataset.os);
}).observe(document.querySelector('.install-tabs'),{subtree:true,attributes:true,attributeFilter:['aria-selected']});
