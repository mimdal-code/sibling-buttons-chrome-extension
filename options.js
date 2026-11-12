// options.js — sidebar + main layout, editable buttons, presets.
const STORAGE_KEY = 'sites';
const HEALTH_KEY = 'health';
const UI_KEY = 'ui.selectedOrigin';

let sites = {};
let health = {};
let selectedOrigin = null;
let editing = null; // { origin, id: string|null }

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const CSS_PRESETS = [
  {
    id: 'default',
    name: 'Default',
    css: 'padding:4px 10px;font:12px system-ui,-apple-system,Segoe UI,sans-serif;border:1px solid #d0d7de;border-radius:6px;background:#f6f8fa;color:#24292f;cursor:pointer;position:relative;z-index:9999;pointer-events:auto;'
  },
  {
    id: 'primary-green',
    name: 'Primary (green)',
    css: 'padding:4px 10px;font:12px system-ui,sans-serif;border:1px solid #1f883d;border-radius:6px;background:#1f883d;color:#fff;cursor:pointer;font-weight:600;position:relative;z-index:9999;pointer-events:auto;'
  },
  {
    id: 'primary-blue',
    name: 'Primary (blue)',
    css: 'padding:4px 10px;font:12px system-ui,sans-serif;border:1px solid #0969da;border-radius:6px;background:#0969da;color:#fff;cursor:pointer;font-weight:500;position:relative;z-index:9999;pointer-events:auto;'
  },
  {
    id: 'ghost',
    name: 'Ghost',
    css: 'padding:4px 10px;font:12px system-ui,sans-serif;border:1px solid currentColor;border-radius:6px;background:transparent;color:inherit;cursor:pointer;position:relative;z-index:9999;pointer-events:auto;'
  },
  {
    id: 'danger',
    name: 'Danger',
    css: 'padding:4px 10px;font:12px system-ui,sans-serif;border:1px solid #cf222e;border-radius:6px;background:#cf222e;color:#fff;cursor:pointer;position:relative;z-index:9999;pointer-events:auto;'
  },
  {
    id: 'pill',
    name: 'Pill',
    css: 'padding:4px 12px;font:12px system-ui,sans-serif;border:1px solid #d0d7de;border-radius:999px;background:#fff;color:#24292f;cursor:pointer;position:relative;z-index:9999;pointer-events:auto;'
  },
  {
    id: 'compact',
    name: 'Compact',
    css: 'padding:2px 8px;font:11px system-ui,sans-serif;border:1px solid #d0d7de;border-radius:4px;background:#fff;color:#24292f;cursor:pointer;line-height:1.2;position:relative;z-index:9999;pointer-events:auto;'
  },
  {
    id: 'dark-friendly',
    name: 'Dark-friendly',
    css: 'padding:4px 10px;font:12px system-ui,sans-serif;border:1px solid rgba(127,127,127,.4);border-radius:6px;background:rgba(127,127,127,.12);color:inherit;cursor:pointer;backdrop-filter:blur(4px);position:relative;z-index:9999;pointer-events:auto;'
  },
  {
    id: 'vector',
    name: 'Wikipedia / Vector',
    css: 'padding:4px 10px;font:13px/1.4 "Helvetica Neue",Helvetica,Arial,sans-serif;border:1px solid #a2a9b1;border-radius:2px;background:#f8f9fa;color:#202122;cursor:pointer;position:relative;z-index:9999;pointer-events:auto;'
  }
];

const PRESETS = [
  {
    name: 'Open URL',
    desc: 'Plain link button. Opens the URL in a new tab.',
    button: {
      label: 'Open',
      css: 'padding:4px 10px;font:12px system-ui,sans-serif;border:1px solid #d0d7de;border-radius:6px;background:#f6f8fa;color:#24292f;cursor:pointer;',
      position: 'after',
      target: { selector: '', language: 'css' },
      action: { type: 'link', url: 'https://example.com', newTab: true }
    }
  },
  {
    name: 'GitHub (dark)',
    desc: 'Primary dark button, opens github.com in a new tab.',
    button: {
      label: 'GitHub',
      css: 'padding:4px 10px;font:12px system-ui,sans-serif;border:1px solid #1f883d;border-radius:6px;background:#1f883d;color:#fff;cursor:pointer;font-weight:600;',
      position: 'after',
      target: { selector: '', language: 'css' },
      action: { type: 'link', url: 'https://github.com', newTab: true }
    }
  },
  {
    name: 'Copy page title',
    desc: 'JS: copies document.title to clipboard.',
    button: {
      label: 'Copy title',
      css: 'padding:4px 10px;font:12px system-ui,sans-serif;border:1px solid #d0d7de;border-radius:6px;background:#f6f8fa;cursor:pointer;',
      position: 'after',
      target: { selector: '', language: 'css' },
      action: {
        type: 'js',
        code: 'navigator.clipboard.writeText(document.title).then(function(){}, function(){});'
      }
    }
  },
  {
    name: 'Log to console',
    desc: 'JS: prints the current URL to the page console.',
    button: {
      label: 'Log URL',
      css: 'padding:4px 10px;font:12px system-ui,sans-serif;border:1px solid #0969da;border-radius:6px;background:#0969da;color:#fff;cursor:pointer;',
      position: 'after',
      target: { selector: '', language: 'css' },
      action: {
        type: 'js',
        code: 'console.log("SiblingButtons:", location.href);'
      }
    }
  },
  {
    name: 'GitHub (Web Store)',
    desc: 'Anchored to the Web Store “Visit support hub” link.',
    button: {
      label: 'GitHub',
      css: 'padding:4px 10px;font:12px system-ui,sans-serif;border:1px solid #1f883d;border-radius:6px;background:#1f883d;color:#fff;cursor:pointer;font-weight:600;',
      position: 'after',
      target: { selector: 'a[href$="/support"]', language: 'css' },
      action: { type: 'link', url: 'https://github.com', newTab: true }
    }
  }
];

function normalizeOrigin(input) {
  let s = input.trim();
  if (!/^[a-z]+:\/\//i.test(s)) s = 'https://' + s;
  return new URL(s).origin;
}
function uid() { return 'b_' + Math.random().toString(36).slice(2, 10); }
function detectLanguage(sel) { return (/^\s*\/|^\s*\(/.test(sel || '')) ? 'xpath' : 'css'; }
async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}
async function sendToTab(tabId, msg) {
  try { return await chrome.tabs.sendMessage(tabId, msg); }
  catch (e) { return { ok: false, error: 'content-script-not-loaded' }; }
}
function healthFor(origin, btnId) {
  const h = health[origin];
  if (!h || !h.byButton || !h.byButton[btnId]) return null;
  return h.byButton[btnId];
}

async function loadAll() {
  const r = await chrome.storage.local.get([STORAGE_KEY, HEALTH_KEY, UI_KEY]);
  sites = r[STORAGE_KEY] || {};
  health = r[HEALTH_KEY] || {};
  selectedOrigin = r[UI_KEY] || Object.keys(sites)[0] || null;
  if (selectedOrigin && !sites[selectedOrigin]) selectedOrigin = Object.keys(sites)[0] || null;
  renderSidebar();
  renderMain();
}

async function saveSites() {
  await chrome.storage.local.set({ [STORAGE_KEY]: sites });
  try { await chrome.runtime.sendMessage({ type: 'sync' }); } catch (_) {}
}

async function saveSelected(origin) {
  selectedOrigin = origin;
  await chrome.storage.local.set({ [UI_KEY]: origin || null });
  renderSidebar();
  renderMain();
}

function renderSidebar() {
  const list = $('#site-list');
  list.replaceChildren();
  const tpl = $('#site-item-tpl');
  const origins = Object.keys(sites);
  $('#sidebar-empty').hidden = origins.length > 0;

  origins.sort().forEach(origin => {
    const li = tpl.content.firstElementChild.cloneNode(true);
    if (origin === selectedOrigin) li.classList.add('active');
    $('.site-item-origin', li).textContent = origin;
    const count = (sites[origin].buttons || []).length;
    $('.site-item-count', li).textContent = `${count} button${count === 1 ? '' : 's'}`;
    $('.site-item-btn', li).addEventListener('click', () => saveSelected(origin));
    list.appendChild(li);
  });
}

function renderMain() {
  const mainEmpty = $('#main-empty');
  const mainSite = $('#main-site');

  if (!selectedOrigin || !sites[selectedOrigin]) {
    mainEmpty.hidden = false;
    mainSite.hidden = true;
    return;
  }
  mainEmpty.hidden = true;
  mainSite.hidden = false;

  const cfg = sites[selectedOrigin];

  $('.origin', mainSite).textContent = selectedOrigin;
  const enabled = $('.enabled', mainSite);
  enabled.checked = !!cfg.enabled;
  enabled.onchange = async () => {
    if (enabled.checked) {
      const granted = await chrome.permissions.request({ origins: [`${selectedOrigin}/*`] });
      if (!granted) { enabled.checked = false; alert('Permission denied for ' + selectedOrigin); return; }
    }
    cfg.enabled = enabled.checked;
    await saveSites();
    renderMain();
  };

  $('.remove-site', mainSite).onclick = async () => {
    if (!confirm('Remove site ' + selectedOrigin + '?')) return;
    delete sites[selectedOrigin];
    try { await chrome.permissions.remove({ origins: [`${selectedOrigin}/*`] }); } catch (_) {}
    await saveSites();
    selectedOrigin = Object.keys(sites)[0] || null;
    await saveSelected(selectedOrigin);
  };

  const urlPattern = $('.url-pattern', mainSite);
  urlPattern.value = cfg.urlPattern || '';
  urlPattern.onchange = async () => {
    cfg.urlPattern = urlPattern.value.trim();
    await saveSites();
  };

  const btnHost = $('.buttons', mainSite);
  btnHost.replaceChildren();
  const tpl = $('#button-row-tpl');
  const buttons = cfg.buttons || [];
  $('.empty-buttons', mainSite).hidden = buttons.length > 0;

  buttons.forEach(b => {
    const row = tpl.content.firstElementChild.cloneNode(true);
    $('.b-label', row).textContent = b.label;
    $('.b-meta', row).textContent = `${b.action?.type || '?'} · ${b.position} "${b.target?.selector || ''}"`;
    const h = healthFor(selectedOrigin, b.id);
    const badge = $('.b-health', row);
    if (h) {
      if (h.ok) { badge.textContent = '✅'; badge.title = h.text || h.tag || ''; badge.classList.add('ok'); }
      else { badge.textContent = '❌ ' + (h.error || ''); badge.title = h.href || ''; badge.classList.add('err'); }
    }
    $('.edit-button', row).onclick = () => startEdit(selectedOrigin, b.id);
    $('.remove-button', row).onclick = async () => {
      sites[selectedOrigin].buttons = sites[selectedOrigin].buttons.filter(x => x.id !== b.id);
      await saveSites();
      if (editing && editing.id === b.id) cancelEdit();
      renderMain();
      renderSidebar();
    };
    btnHost.appendChild(row);
  });

  const presetsHost = $('#presets');
  presetsHost.replaceChildren();
  const presetTpl = $('#preset-tpl');
  PRESETS.forEach(p => {
    const btn = presetTpl.content.firstElementChild.cloneNode(true);
    $('.preset-name', btn).textContent = p.name;
    $('.preset-desc', btn).textContent = p.desc;
    btn.onclick = () => startEdit(selectedOrigin, null, p.button);
    presetsHost.appendChild(btn);
  });

  if (editing && editing.origin === selectedOrigin) {
    $('#editor-card').hidden = false;
    $('#editor-title').textContent = editing.id ? 'Edit button' : 'New button';
  } else {
    $('#editor-card').hidden = true;
  }
}

function findPresetByCss(css) {
  if (!css) return null;
  const norm = s => s.replace(/\s+/g, ' ').trim();
  return CSS_PRESETS.find(p => norm(p.css) === norm(css)) || null;
}

function renderCssPresets(currentCss) {
  const host = $('#css-presets');
  if (!host) return;
  host.replaceChildren();
  const match = findPresetByCss(currentCss);
  const form = $('#button-form');

  CSS_PRESETS.forEach(p => {
    const label = document.createElement('label');
    label.className = 'css-preset' + (match && match.id === p.id ? ' selected' : '');
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'cssPreset';
    radio.value = p.id;
    if (match && match.id === p.id) radio.checked = true;
    const swatch = document.createElement('span');
    swatch.className = 'css-preview-swatch';
    swatch.textContent = p.name;
    swatch.style.cssText = p.css;
    label.appendChild(radio);
    label.appendChild(swatch);
    radio.addEventListener('change', () => {
      if (!radio.checked) return;
      form.css.value = p.css;
      renderCssPresets(p.css);
    });
    host.appendChild(label);
  });

  const customLabel = document.createElement('label');
  customLabel.className = 'css-preset' + (match ? '' : ' selected');
  const customRadio = document.createElement('input');
  customRadio.type = 'radio';
  customRadio.name = 'cssPreset';
  customRadio.value = '__custom__';
  customRadio.checked = !match;
  const customText = document.createElement('span');
  customText.className = 'css-preview-swatch';
  customText.textContent = 'Custom';
  customLabel.appendChild(customRadio);
  customLabel.appendChild(customText);
  customRadio.addEventListener('change', () => {
    if (customRadio.checked) renderCssPresets(form.css.value);
  });
  host.appendChild(customLabel);
}

function startEdit(origin, buttonId, preset) {
  const cfg = sites[origin];
  const existing = buttonId ? (cfg.buttons || []).find(b => b.id === buttonId) : null;
  const source = existing || preset || {
    label: '',
    css: '',
    position: 'after',
    target: { selector: '', language: 'css' },
    action: { type: 'link', url: '', newTab: true }
  };

  editing = { origin, id: buttonId };

  const form = $('#button-form');
  form.target.value = source.target?.selector || '';
  form.position.value = source.position || 'after';
  form.label.value = source.label || '';
  form.css.value = source.css || '';
  form.actionType.value = source.action?.type || 'link';
  if (source.action?.type === 'link') {
    form.actionUrl.value = source.action.url || '';
    form.actionNewTab.checked = source.action.newTab !== false;
  } else {
    form.actionCode.value = source.action?.code || '';
  }
  renderCssPresets(source.css || '');

  const cssField = form.css;
  cssField.oninput = () => {
    const match = findPresetByCss(cssField.value);
    const host = $('#css-presets');
    const currentlySelected = host.querySelector('input[name="cssPreset"]:checked');
    const selectedId = currentlySelected ? currentlySelected.value : '';
    const wanted = match ? match.id : '__custom__';
    if (wanted !== selectedId) renderCssPresets(cssField.value);
  };

  syncActionFields();
  $('#test-result').textContent = '—';
  $('#test-result').classList.remove('ok', 'err');

  renderMain();
  $('#editor-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cancelEdit() {
  editing = null;
  $('#editor-card').hidden = true;
  renderMain();
}

function syncActionFields() {
  const form = $('#button-form');
  const isLink = form.actionType.value === 'link';
  $$('.action-link-field', form).forEach(f => { f.hidden = !isLink; });
  $$('.action-js-field', form).forEach(f => { f.hidden = isLink; });
}

function readForm() {
  const form = $('#button-form');
  const type = form.actionType.value;
  const action = type === 'link'
    ? { type: 'link', url: form.actionUrl.value.trim(), newTab: !!form.actionNewTab.checked }
    : { type: 'js', code: form.actionCode.value };
  const sel = form.target.value.trim();
  return {
    label: form.label.value.trim(),
    css: form.css.value.trim(),
    position: form.position.value,
    target: { selector: sel, language: detectLanguage(sel) },
    action
  };
}

function wireUp() {
  $('#add-site-btn').onclick = async () => {
    const raw = prompt('Origin (e.g. https://chromewebstore.google.com):');
    if (!raw) return;
    let origin;
    try { origin = normalizeOrigin(raw); } catch { return alert('Invalid URL'); }
    if (sites[origin]) { await saveSelected(origin); return; }
    sites[origin] = { enabled: false, urlPattern: '', buttons: [] };
    await saveSites();
    await saveSelected(origin);
  };

  $('#new-button-btn').onclick = () => {
    if (!selectedOrigin) return;
    startEdit(selectedOrigin, null);
  };

  $('#cancel-edit-btn').onclick = () => cancelEdit();
  $('#button-form').actionType.onchange = () => syncActionFields();

  $('#test-target-btn').onclick = async () => {
    const form = $('#button-form');
    const sel = form.target.value.trim();
    if (!sel) return;
    const tab = await getActiveTab();
    if (!tab) return;
    const res = await sendToTab(tab.id, { type: 'resolveSelector', selector: sel, language: detectLanguage(sel) });
    const out = $('#test-result');
    out.classList.remove('ok', 'err');
    if (res && res.ok) {
      out.textContent = `✅ <${res.tag}> "${res.text}"`;
      out.classList.add('ok');
    } else {
      out.textContent = '❌ ' + (res?.error || 'not found');
      out.classList.add('err');
    }
  };

  $('#preview-btn').onclick = async () => {
    const tab = await getActiveTab();
    if (!tab) return;
    const data = readForm();
    if (!data.target.selector) return alert('Enter a target selector first');
    const res = await sendToTab(tab.id, {
      type: 'previewInsert',
      selector: data.target.selector,
      language: data.target.language,
      position: data.position,
      label: data.label || 'Preview',
      css: data.css
    });
    if (!res?.ok) alert('Preview failed: ' + (res?.error || 'unknown'));
  };

  $('#clear-preview-btn').onclick = async () => {
    const tab = await getActiveTab();
    if (tab) await sendToTab(tab.id, { type: 'clearPreview' });
  };

  $('#button-form').onsubmit = async (e) => {
    e.preventDefault();
    if (!editing || !editing.origin) return;
    const data = readForm();
    if (!data.label) return alert('Label is required');
    if (data.action.type === 'link' && !data.action.url) return alert('URL is required for link actions');
    if (data.action.type === 'js' && !data.action.code.trim()) return alert('JS code is required');

    const cfg = sites[editing.origin];
    cfg.buttons = cfg.buttons || [];
    if (editing.id) {
      const idx = cfg.buttons.findIndex(b => b.id === editing.id);
      if (idx >= 0) cfg.buttons[idx] = { ...cfg.buttons[idx], ...data };
    } else {
      cfg.buttons.push({ id: uid(), ...data });
    }
    await saveSites();
    editing = null;
    renderSidebar();
    renderMain();
  };

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === 'healthUpdated') loadAll();
  });
}

wireUp();
loadAll();