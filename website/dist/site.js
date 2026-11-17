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
