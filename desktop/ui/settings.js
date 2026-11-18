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
  window_inset: 22, light_pattern: "steady", theme: "dark", placements: {},
};

let settings;
let pending = {};
let saving = false;
let inFlight = {};
let revision = 0;
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
const format = (key, value) => ['snowman_size', 'decoration_size'].includes(key)
  ? Number(value).toFixed(1) + '×' : key === 'window_inset' ? value + ' px' : String(value);
const selection = document.querySelector('#placement-item');
const board = document.querySelector('#placement-board');
const marker = document.querySelector('#placement-marker');
const positionFields = ['x', 'y'].map(axis => document.querySelector('#placement-' + axis));
const names = { snowman: 'Snowman', tree: 'Tree', gift: 'Gift', ornament: 'Ornament' };
const symbols = { snowman: '☃', tree: '🎄', gift: '🎁', ornament: '★' };
let positionDraft;
let layoutCounts;
let dragging = false;

function defaultPlacement(kind, index, count) {
  const f = (index + 0.5) / count;
  const offset = Math.sin(index * 2.39) * 0.22 / count;
  if (kind === 'snowman') return [count === 1 ? 0.94 : 1 - f * 0.83 - offset, 1];
  if (kind === 'tree') return [f * 0.72 + offset, 1];
  if (kind === 'gift') return [0.15 + f * 0.79 + offset, 1];
  return [f + offset, 0.18 + Math.abs(Math.sin((index + 1) * 1.23)) * 0.71];
}

function paintPosition(current) {
  if (!selection.value) return;
  const [kind, index] = selection.value.split('-');
  const position = positionDraft || current.placements[selection.value]
    || defaultPlacement(kind, Number(index), layoutCounts[kind]);
  board.classList.toggle('window-board', kind === 'ornament');
  document.querySelector('#placement-edge').hidden = kind !== 'ornament';
  document.querySelector('#placement-y-label').textContent = kind === 'ornament' ? 'Drop length' : 'Down';
  document.querySelector('#placement-help').textContent = kind === 'ornament'
    ? 'Ornament positions repeat on windows. Wider windows have more ornaments.'
    : 'Drag the marker or use the sliders to set its desktop position.';
  marker.textContent = symbols[kind];
  board.style.setProperty('--cord-x', (8 + position[0] * 84) + '%');
  board.style.setProperty('--cord-length', (12 + position[1] * 76) + '%');
  marker.style.left = (8 + position[0] * 84) + '%';
  marker.style.top = (12 + position[1] * 76) + '%';
  for (const [axis, field] of positionFields.entries()) {
    field.value = Math.round(position[axis] * 100);
    document.querySelector('#' + field.id + '-value').value = field.value + '%';
  }
}

function renderLayout(current) {
  const counts = {
    snowman: current.snowman ? current.snowman_count : 0,
    tree: current.trees, gift: current.gifts, ornament: current.dangling ? 30 : 0,
  };
  if (JSON.stringify(counts) !== JSON.stringify(layoutCounts)) {
    const previous = selection.value;
    layoutCounts = counts;
    selection.replaceChildren();
    for (const [kind, count] of Object.entries(counts)) {
      for (let i = 0; i < count; i++) selection.add(new Option(names[kind] + ' ' + (i + 1), kind + '-' + i));
    }
    if (Array.from(selection.options).some(option => option.value === previous)) selection.value = previous;
    else if (!selection.options.length) selection.add(new Option('No decorations', ''));
    selection.disabled = !selection.value;
    document.querySelector('#layout-editor').hidden = !selection.value;
    document.querySelector('#placement-empty').hidden = !!selection.value;
  }
  paintPosition(current);
}

function updatePlacement(position) {
  positionDraft = undefined;
  const placements = { ...(pending.placements ?? inFlight.placements ?? settings.placements) };
  if (position) placements[selection.value] = position;
  else delete placements[selection.value];
  void save({ placements });
}

function positionFromFields() {
  return positionFields.map(field => Number(field.value) / 100);
}

function positionFromPointer(event) {
  const bounds = board.getBoundingClientRect();
  const x = ((event.clientX - bounds.left) / bounds.width - 0.08) / 0.84;
  const y = ((event.clientY - bounds.top) / bounds.height - 0.12) / 0.76;
  return [x, y].map(value => Math.max(0, Math.min(1, value)));
}


function report(message, error = false) {
  status.textContent = message;
  status.toggleAttribute('data-error', error);
}

function render() {
  const current = { ...settings, ...inFlight, ...pending };
  document.documentElement.dataset.theme = current.theme === 'system'
    ? (systemTheme.matches ? 'dark' : 'light') : current.theme;
  renderLayout(current);
  for (const field of fields) {
    if (field.type === 'checkbox') field.checked = current[field.dataset.setting];
    else if (document.activeElement !== field || !['number', 'range'].includes(field.type)) {
      field.value = current[field.dataset.setting];
    }
  }
  for (const output of document.querySelectorAll('[data-value]')) {
    const value = current[output.dataset.value];
    output.value = format(output.dataset.value, value);
  }
  for (const button of presets) {
    button.setAttribute('aria-pressed', String(Number(button.dataset.intensity) === current.intensity));
  }
  document.querySelector('#forecast-value').textContent = current.enabled
    ? ['Flurry', 'Snow day', 'Blizzard'][current.intensity] : 'Paused';
  play.textContent = current.interactive ? 'Exit snowball mode' : 'Enter snowball mode';
  play.setAttribute('aria-pressed', String(current.interactive));
  santa.disabled = !current.enabled;
  document.querySelector('[data-setting="light_pattern"]').disabled = !current.lights;
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
      inFlight = patch;
      settings = invoke ? await invoke('update_settings', { changes: patch }) : { ...settings, ...patch };
      inFlight = {};
      render();
    }
    report(invoke ? 'Settings saved' : 'Preview only. Open Nightfall to change desktop snow.');
  } catch (error) {
    pending = {};
    inFlight = {};
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
  document.querySelector('#window-inset').hidden = !/Mac/.test(navigator.platform);
  systemTheme.addEventListener('change', render);
  selection.onchange = () => { positionDraft = undefined; render(); };
  document.querySelector('#reset-placement').onclick = () => updatePlacement();
  for (const field of positionFields) {
    field.oninput = () => { positionDraft = positionFromFields(); paintPosition(settings); };
    field.onchange = () => updatePlacement(positionFromFields());
  }
  marker.onpointerdown = event => {
    if (event.button !== 0) return;
    dragging = true;
    marker.setPointerCapture(event.pointerId);
  };
  marker.onpointermove = event => {
    if (!dragging) return;
    positionDraft = positionFromPointer(event);
    paintPosition(settings);
  };
  marker.onpointerup = () => {
    if (!dragging) return;
    dragging = false;
    if (positionDraft) updatePlacement(positionDraft);
  };
  marker.onpointercancel = () => { dragging = false; positionDraft = undefined; render(); };
  marker.onkeydown = event => {
    const delta = { ArrowLeft: [-0.02, 0], ArrowRight: [0.02, 0], ArrowUp: [0, -0.02], ArrowDown: [0, 0.02] }[event.key];
    if (!delta) return;
    event.preventDefault();
    updatePlacement(positionFromFields().map((p, i) => Math.max(0, Math.min(1, p + delta[i]))));
  };
  render();
  for (const field of fields) {
    field.onchange = () => {
      const value = field.type === 'checkbox' ? field.checked
        : ['theme', 'light_pattern'].includes(field.dataset.setting) ? field.value : Number(field.value);
      if (field.type !== 'checkbox' && !field.checkValidity()) {
        field.value = settings[field.dataset.setting];
        return;
      }
      void save({ [field.dataset.setting]: value });
    };
    if (field.type === 'range') {
      field.oninput = () => {
        const output = document.querySelector('[data-value="' + field.dataset.setting + '"]');
        output.value = format(field.dataset.setting, Number(field.value));
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
