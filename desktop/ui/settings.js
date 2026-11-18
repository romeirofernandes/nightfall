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
const boards = {
  desktop: document.querySelector('#desktop-board'),
  ornaments: document.querySelector('#ornament-board'),
};
const names = { snowman: 'Snowman', tree: 'Tree', gift: 'Gift', ornament: 'Ornament' };
const symbols = { snowman: '☃', tree: '🎄', gift: '🎁', ornament: '★' };
const markers = new Map();
let ornamentSlots = invoke ? 0 : 6;
let drag;

function defaultPlacement(kind, index, count) {
  const f = (index + 0.5) / count;
  const offset = Math.sin(index * 2.39) * 0.22 / count;
  if (kind === 'snowman') return [count === 1 ? 0.94 : 1 - f * 0.83 - offset, 1];
  if (kind === 'tree') return [f * 0.72 + offset, 1];
  if (kind === 'gift') return [0.15 + f * 0.79 + offset, 1];
  return [f + offset, 0.18 + Math.abs(Math.sin((index + 1) * 1.23)) * 0.71];
}

function activePlacements() {
  return pending.placements ?? inFlight.placements ?? settings.placements;
}

function paintMarker(item, position) {
  item.position = position;
  item.wrapper.style.setProperty('--x', (5 + position[0] * 90) + '%');
  item.wrapper.style.setProperty('--y', (13 + position[1] * 73) + '%');
}

function moveDecoration(id, position) {
  void save({ placements: { ...activePlacements(), [id]: position } });
}

const unit = value => Math.max(0, Math.min(1, value));

function makeMarker(kind, index) {
  const board = kind === 'ornament' ? boards.ornaments : boards.desktop;
  const id = kind + '-' + index;
  const wrapper = document.createElement('div');
  wrapper.className = 'decoration ' + kind;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'placement-marker';
  button.textContent = kind === 'ornament' && index % 2 ? '●' : symbols[kind];
  button.title = names[kind] + ' ' + (index + 1);
  button.setAttribute('aria-label', button.title + '. Use arrow keys to move.');
  wrapper.append(button);
  board.append(wrapper);
  const item = { id, kind, wrapper, position: [0, 0] };
  button.addEventListener('pointerdown', event => {
    if (event.button !== 0 || drag) return;
    const bounds = board.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    drag = { item, x: event.clientX, y: event.clientY, initial: item.position,
      width: bounds.width * 0.90, height: bounds.height * 0.73 };
    wrapper.classList.add('dragging');
    button.setPointerCapture(event.pointerId);
  });
  button.addEventListener('pointermove', event => {
    if (drag?.item !== item) return;
    const { x, y, initial, width, height } = drag;
    paintMarker(item, [unit(initial[0] + (event.clientX - x) / width),
      unit(initial[1] + (event.clientY - y) / height)]);
  });
  function endDrag(cancel) {
    if (drag?.item !== item) return;
    const initial = drag.initial;
    drag = undefined;
    wrapper.classList.remove('dragging');
    if (cancel) render();
    else if (item.position.some((value, axis) => value !== initial[axis])) moveDecoration(id, item.position);
  }
  button.addEventListener('pointerup', () => endDrag(false));
  button.addEventListener('pointercancel', () => endDrag(true));
  button.addEventListener('lostpointercapture', () => endDrag(true));
  button.addEventListener('keydown', event => {
    const delta = { ArrowLeft: [-0.02, 0], ArrowRight: [0.02, 0],
      ArrowUp: [0, -0.02], ArrowDown: [0, 0.02] }[event.key];
    if (!delta) return;
    event.preventDefault();
    moveDecoration(id, item.position.map((p, i) => unit(p + delta[i])));
  });
  return item;
}

function renderLayout(current) {
  const counts = {
    snowman: current.snowman ? current.snowman_count : 0,
    tree: current.trees,
    gift: current.gifts,
    ornament: current.dangling ? ornamentSlots : 0,
  };
  const wanted = new Set();
  for (const [kind, count] of Object.entries(counts)) {
    for (let i = 0; i < count; i++) {
      const id = kind + '-' + i;
      wanted.add(id);
      if (!markers.has(id)) markers.set(id, makeMarker(kind, i));
      const item = markers.get(id);
      if (drag?.item !== item) {
        paintMarker(item, current.placements[id] ?? defaultPlacement(kind, i, count));
      }
    }
  }
  for (const [id, item] of markers) {
    if (wanted.has(id)) continue;
    if (drag?.item === item) drag = undefined;
    item.wrapper.remove();
    markers.delete(id);
  }
  const floorCount = counts.snowman + counts.tree + counts.gift;
  document.querySelector('#desktop-empty').hidden = floorCount > 0;
  document.querySelector('#desktop-board').hidden = floorCount === 0;
  document.querySelector('#ornament-layout').hidden = !counts.ornament;
  document.querySelector('#randomize').disabled = !wanted.size;
  document.querySelector('#ground').disabled = !floorCount;
}

function rearrange(ground) {
  const placements = { ...activePlacements() };
  const items = [...markers.values()];
  for (const lane of ['desktop', 'ornaments']) {
    if (ground && lane === 'ornaments') continue;
    const group = items.filter(item => (item.kind === 'ornament') === (lane === 'ornaments'));
    if (ground) {
      for (const item of group) placements[item.id] = [item.position[0], 1];
      continue;
    }
    // Shuffle spatial slots so neighboring decorations don't all land on top of one another.
    const slots = group.map((_, i) => (i + 0.2 + Math.random() * 0.6) / group.length);
    for (let i = slots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }
    group.forEach((item, i) => {
      placements[item.id] = [slots[i], lane === 'desktop' ? 0.4 + Math.random() * 0.56 : 0.15 + Math.random() * 0.7];
    });
  }
  void save({ placements });
}

function report(message, error = false) {
  status.textContent = message;
  status.toggleAttribute('data-error', error);
}

function render() {
  const current = { ...settings, ...inFlight, ...pending };
  document.documentElement.dataset.theme = current.theme === 'system'
    ? (systemTheme.matches ? 'dark' : 'light') : current.theme;
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  const themeButton = document.querySelector('#theme');
  themeButton.title = 'Switch to ' + nextTheme + ' mode';
  themeButton.setAttribute('aria-label', themeButton.title);
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
  syncSelectMenus();
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
  const [latest, slots] = await Promise.all([invoke('get_settings'), invoke('arrangement_slots')]);
  if (saving || revision !== requestedAt) return;
  settings = latest;
  ornamentSlots = slots;
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
  if (invoke) ornamentSlots = await invoke('arrangement_slots');
  document.querySelector('#theme').onclick = () => {
    void save({ theme: document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark' });
  };
  document.querySelector('#randomize').onclick = () => rearrange(false);
  document.querySelector('#ground').onclick = () => rearrange(true);
  makeSelectMenus();
  render();
  for (const field of fields) {
    field.onchange = () => {
      const value = field.type === 'checkbox' ? field.checked
        : field.dataset.setting === 'light_pattern' ? field.value : Number(field.value);
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
    if (!event.defaultPrevented && event.key === 'Escape' && settings.interactive) void save({ interactive: false });
  });
  if (invoke) setInterval(() => refresh().catch(error => report(String(error), true)), 750);
  else report('Preview only. Open Nightfall to change desktop snow.');
}

start().catch(error => report('Could not load settings. ' + String(error), true));
