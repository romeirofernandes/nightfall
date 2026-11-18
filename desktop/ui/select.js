// Glide Select-inspired menu. The underlying select remains the settings value source.
const selectMenus = [];

function makeSelectMenus() {
  for (const [index, select] of [...document.querySelectorAll('select[data-setting]')].entries()) {
    const label = select.previousElementSibling.textContent.trim();
    const wrapper = document.createElement('div');
    wrapper.className = 'glide-select';
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'select-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    const value = document.createElement('span');
    const chevron = document.createElement('span');
    chevron.className = 'select-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    trigger.append(value, chevron);
    const list = document.createElement('div');
    list.className = 'select-list';
    list.id = 'select-list-' + index;
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', label);
    list.hidden = true;
    trigger.setAttribute('aria-controls', list.id);
    const highlight = document.createElement('div');
    highlight.className = 'select-highlight';
    highlight.setAttribute('aria-hidden', 'true');
    list.append(highlight);

    const rows = [...select.options].map(option => {
      const row = document.createElement('div');
      row.className = 'select-option';
      row.setAttribute('role', 'option');
      row.tabIndex = -1;
      const text = document.createElement('span');
      text.textContent = option.textContent;
      const check = document.createElement('span');
      check.className = 'select-check';
      check.setAttribute('aria-hidden', 'true');
      check.textContent = '✓';
      row.append(text, check);
      row.onclick = () => choose(option.value);
      row.onpointerenter = () => glide(row);
      row.onfocus = () => glide(row);
      list.append(row);
      return row;
    });

    function glide(row) {
      if (row) highlight.style.transform = 'translateY(' + row.offsetTop + 'px)';
    }

    function close(refocus = false) {
      list.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      if (refocus && !trigger.disabled) trigger.focus();
    }

    function choose(newValue) {
      select.value = newValue;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      close(true);
    }

    function open() {
      if (trigger.disabled) return;
      for (const menu of selectMenus) if (menu.close !== close) menu.close();
      list.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      const below = innerHeight - trigger.getBoundingClientRect().bottom;
      wrapper.classList.toggle('opens-up', list.offsetHeight + 8 > below);
      (rows[select.selectedIndex] ?? rows[0]).focus({ preventScroll: true });
    }

    trigger.onclick = () => list.hidden ? open() : close();
    trigger.onkeydown = event => {
      if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
      event.preventDefault();
      open();
    };
    list.onkeydown = event => {
      const index = rows.indexOf(document.activeElement);
      switch (event.key) {
        case 'ArrowDown': rows[(index + 1) % rows.length].focus(); break;
        case 'ArrowUp': rows[(index + rows.length - 1) % rows.length].focus(); break;
        case 'Home': rows[0].focus(); break;
        case 'End': rows.at(-1).focus(); break;
        case 'Enter':
        case ' ': choose(select.options[index].value); break;
        case 'Escape': close(true); break;
        case 'Tab': close(true); return;
        default: return;
      }
      event.preventDefault();
    };
    list.onpointerleave = () => glide(rows[select.selectedIndex]);
    document.addEventListener('pointerdown', event => {
      if (!wrapper.contains(event.target)) close();
    });
    wrapper.addEventListener('focusout', event => {
      if (event.relatedTarget && !wrapper.contains(event.relatedTarget)) close();
    });

    // A label cannot contain both the fallback select and the visible button.
    const rowLabel = document.createElement('div');
    rowLabel.className = select.parentElement.className;
    select.parentElement.replaceWith(rowLabel);
    rowLabel.append(Object.assign(document.createElement('span'), { textContent: label }), wrapper);
    select.hidden = true;
    wrapper.append(select, trigger, list);
    selectMenus.push({ close, sync() {
      const option = select.selectedOptions[0];
      value.textContent = option?.textContent ?? '';
      trigger.setAttribute('aria-label', label + ': ' + value.textContent);
      trigger.disabled = select.disabled;
      if (trigger.disabled) close();
      rows.forEach((row, i) => {
        row.setAttribute('aria-selected', String(i === select.selectedIndex));
      });
    } });
  }
}

function syncSelectMenus() {
  for (const menu of selectMenus) menu.sync();
}
