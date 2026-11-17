const invoke=window.__TAURI__?.core.invoke;
let settings={enabled:true,intensity:1,wind:12,accumulation:true,icicles:true,snowman:true,plow:true,fps:30,cleanup_interval:120,snowman_count:1,snowman_size:1,trees:0,gifts:0,decoration_size:1,lights:false,dangling:false,interactive:false};
const scene=new SnowScene(document.querySelector('#preview'));
const status=document.querySelector('#status');
function paint(){
 for(const k of ['enabled','accumulation','icicles','snowman','plow','lights','dangling'])document.getElementById(k).checked=settings[k];
 for(const k of ['wind','fps','cleanup_interval','snowman_count','snowman_size','trees','gifts','decoration_size'])document.getElementById(k).value=settings[k];
 document.querySelector('#wind-value').value=settings.wind;
 for(const k of ['snowman_size','decoration_size'])document.getElementById(k+'-value').value=settings[k].toFixed(1)+'×';
 const play=document.getElementById('play-mode');play.textContent=settings.interactive?'Exit snowball mode':'Enter snowball mode';play.setAttribute('aria-pressed',!!settings.interactive);
 document.querySelectorAll('[data-intensity]').forEach(b=>{const active=+b.dataset.intensity===settings.intensity;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active)});
 scene.level=settings.intensity;scene.paused=!settings.enabled;
 document.querySelector('#weather-label').textContent=settings.enabled?['A quiet little flurry.','A lovely day for snow.','A proper winter wonderland.'][settings.intensity]:'Taking a little breather.';
}
let saveTimer;let saving=Promise.resolve();let editVersion=0,savedVersion=0;
function save(){const version=++editVersion;paint();clearTimeout(saveTimer);saveTimer=setTimeout(()=>{const snapshot={...settings};saving=saving.catch(()=>{}).then(async()=>{try{if(invoke)await invoke('save_settings',{settings:snapshot});else localStorage.setItem('nightfall-settings',JSON.stringify(snapshot));savedVersion=version;status.textContent='✳ All cozy. Settings saved.'}catch(e){status.textContent='Couldn’t save settings. Please try again.';console.error(e)}})},180)}
(async()=>{try{if(invoke)settings=await invoke('get_settings');else{document.querySelector('#browser-note').hidden=false;settings={...settings,...JSON.parse(localStorage.getItem('nightfall-settings')||'{}')}}}catch(e){status.textContent='Couldn’t load saved preferences.'}paint()})();
document.querySelectorAll('[data-intensity]').forEach(b=>b.onclick=()=>{settings.intensity=+b.dataset.intensity;save()});
for(const k of ['enabled','accumulation','icicles','snowman','plow','lights','dangling'])document.getElementById(k).onchange=e=>{settings[k]=e.target.checked;save()};
for(const k of ['wind','fps','cleanup_interval','snowman_count','snowman_size','trees','gifts','decoration_size'])document.getElementById(k).oninput=e=>{settings[k]=+e.target.value;save()};
document.querySelector('#quit').onclick=async()=>{if(invoke)await invoke('quit');else{scene.paused=true;status.textContent='Preview paused. Close this tab to leave.'}};

document.getElementById('send-santa').onclick=async()=>{try{if(invoke)await invoke('send_plow');status.textContent=invoke?'Santa is on his way.':'Santa cleanup runs in the desktop app.';}catch(e){status.textContent=String(e)}};
document.getElementById('play-mode').onclick=()=>{settings.interactive=!settings.interactive;if(settings.interactive)settings.enabled=true;save()};
// Reflect Escape/overlay exit without overwriting settings while a save is queued.
setInterval(async()=>{if(invoke&&editVersion===savedVersion&&document.visibilityState==='visible'){try{const remote=await invoke('get_settings');if(remote.interactive!==settings.interactive){settings.interactive=remote.interactive;paint();}}catch{}}},1000);
