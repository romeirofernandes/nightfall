const invoke = window.__TAURI__?.core.invoke;
const fields = [...document.querySelectorAll('[data-setting]')];
const presets = [...document.querySelectorAll('[data-intensity]')];
const status = document.querySelector('#status');
const play = document.querySelector('#snowball');
const santa = document.querySelector('#santa');
const quit = document.querySelector('#quit');
const previewDefaults = {
  enabled: true, intensity: 1, wind: 12, accumulation: true, icicles: true,
  snowman: true, snowman_count: 1, snowman_size: 1, trees: 0, gifts: 0,
  decoration_size: 1, lights: false, dangling: false, plow: true,
  cleanup_interval: 120, fps: 30, interactive: false,
};

let settings;
let pending = {};
let saving = false;
let revision = 0;

function report(message, error = false) {
  status.textContent = message;
  status.toggleAttribute('data-error', error);
}

function render() {
  const current = { ...settings, ...pending };
  for (const field of fields) {
    if (field.type === 'checkbox') field.checked = current[field.dataset.setting];
    else if (document.activeElement !== field || !['number', 'range'].includes(field.type)) {
      field.value = current[field.dataset.setting];
    }
  }
  for (const output of document.querySelectorAll('[data-value]')) {
    const value = current[output.dataset.value];
    output.value = output.dataset.value === 'wind' ? String(value) : value.toFixed(1) + '×';
  }
  for (const button of presets) {
    button.setAttribute('aria-pressed', String(Number(button.dataset.intensity) === current.intensity));
  }
  document.querySelector('#forecast-value').textContent = current.enabled
    ? ['Flurry', 'Snow day', 'Blizzard'][current.intensity] : 'Paused';
  play.textContent = current.interactive ? 'Exit snowball mode' : 'Enter snowball mode';
  play.setAttribute('aria-pressed', String(current.interactive));
  santa.disabled = !current.enabled;
}

async function save(changes) {
  Object.assign(pending, changes);
  revision++;
  render();
  if (saving) return;
  saving = true;
  try {
    while (Object.keys(pending).length) {
      const patch = pending;
      pending = {};
      settings = invoke ? await invoke('update_settings', { changes: patch }) : { ...settings, ...patch };
      render();
    }
    report(invoke ? 'Settings saved' : 'Preview only. Open Nightfall to change desktop snow.');
  } catch (error) {
    pending = {};
    render();
    report('Could not save settings. ' + String(error), true);
  } finally {
    saving = false;
  }
}

async function refresh() {
  if (!invoke || saving || document.hidden) return;
  const requestedAt = revision;
  const latest = await invoke('get_settings');
  if (saving || revision !== requestedAt) return;
  settings = latest;
  render();
}

const links = [...document.querySelectorAll('[data-page]')];
for (const link of links) {
  link.onclick = () => {
    for (const button of links) {
      if (button === link) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
      document.getElementById(button.dataset.page).hidden = button !== link;
    }
    window.scrollTo(0, 0);
  };
}

async function start() {
  settings = invoke ? await invoke('get_settings') : previewDefaults;
  render();
  for (const field of fields) {
    field.onchange = () => {
      const value = field.type === 'checkbox' ? field.checked : Number(field.value);
      if (field.type !== 'checkbox' && !field.checkValidity()) {
        field.value = settings[field.dataset.setting];
        return;
      }
      void save({ [field.dataset.setting]: value });
    };
    if (field.type === 'range') {
      field.oninput = () => {
        const output = document.querySelector('[data-value="' + field.dataset.setting + '"]');
        output.value = field.dataset.setting === 'wind' ? field.value : Number(field.value).toFixed(1) + '×';
      };
    }
  }
  for (const button of presets) button.onclick = () => save({ intensity: Number(button.dataset.intensity) });
  play.onclick = () => save(settings.interactive ? { interactive: false } : { enabled: true, interactive: true });
  santa.onclick = async () => {
    try {
      if (invoke) await invoke('send_plow');
      report(invoke ? 'Santa is on his way.' : 'Santa runs in the desktop app.');
    } catch (error) { report(String(error), true); }
  };
  quit.onclick = async () => {
    try {
      if (invoke) await invoke('quit');
      else report('Close this tab to quit the preview.');
    } catch (error) { report(String(error), true); }
  };
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && settings.interactive) void save({ interactive: false });
  });
  if (invoke) setInterval(() => refresh().catch(error => report(String(error), true)), 750);
  else report('Preview only. Open Nightfall to change desktop snow.');
}

start().catch(error => report('Could not load settings. ' + String(error), true));
