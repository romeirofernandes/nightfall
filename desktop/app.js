const invoke=window.__TAURI__?.core.invoke;
let settings={enabled:true,intensity:1,wind:12,accumulation:true,icicles:true,snowman:true,plow:true,fps:30};
const scene=new SnowScene(document.querySelector('#preview'));
const status=document.querySelector('#status');
function paint(){
 for(const k of ['enabled','accumulation','icicles','snowman','plow'])document.getElementById(k).checked=settings[k];
 for(const k of ['wind','fps'])document.getElementById(k).value=settings[k];
 document.querySelector('#wind-value').value=settings.wind;
 document.querySelectorAll('[data-intensity]').forEach(b=>{const active=+b.dataset.intensity===settings.intensity;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active)});
 scene.level=settings.intensity;scene.paused=!settings.enabled;
 document.querySelector('#weather-label').textContent=settings.enabled?['A quiet little flurry.','A lovely day for snow.','A proper winter wonderland.'][settings.intensity]:'Taking a little breather.';
}
let saveTimer;let saving=Promise.resolve();
function save(){paint();clearTimeout(saveTimer);saveTimer=setTimeout(()=>{const snapshot={...settings};saving=saving.catch(()=>{}).then(async()=>{try{if(invoke)await invoke('save_settings',{settings:snapshot});else localStorage.setItem('nightfall-settings',JSON.stringify(snapshot));status.textContent='✳ All cozy. Settings saved.'}catch(e){status.textContent='Couldn’t save settings. Please try again.';console.error(e)}})},180)}
(async()=>{try{if(invoke)settings=await invoke('get_settings');else{document.querySelector('#browser-note').hidden=false;settings={...settings,...JSON.parse(localStorage.getItem('nightfall-settings')||'{}')}}}catch(e){status.textContent='Couldn’t load saved preferences.'}paint()})();
document.querySelectorAll('[data-intensity]').forEach(b=>b.onclick=()=>{settings.intensity=+b.dataset.intensity;save()});
for(const k of ['enabled','accumulation','icicles','snowman','plow'])document.getElementById(k).onchange=e=>{settings[k]=e.target.checked;save()};
for(const k of ['wind','fps'])document.getElementById(k).oninput=e=>{settings[k]=+e.target.value;save()};
document.querySelector('#quit').onclick=async()=>{if(invoke)await invoke('quit');else{scene.paused=true;status.textContent='Preview paused. Close this tab to leave.'}};
