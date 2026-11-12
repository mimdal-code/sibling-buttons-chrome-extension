// popup.js
const STORAGE_KEY = 'sites';

async function init() {
  let tab = null;
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    tab = tabs && tabs[0];
  } catch (e) {}

  const here = document.getElementById('here');
  let origin = '—';
  if (tab && tab.url) {
    try { origin = new URL(tab.url).origin; }
    catch (e) { origin = tab.url; }
  } else if (tab) {
    origin = 'unknown (no permission)';
  } else {
    origin = 'no active tab';
  }
  here.textContent = origin;

  try {
    const r = await chrome.storage.local.get(STORAGE_KEY);
    const sites = r[STORAGE_KEY] || {};
    const site = sites[origin];
    const status = document.getElementById('status');
    if (!site) status.textContent = 'Not configured for this site.';
    else if (!site.enabled) status.textContent = 'Configured but disabled.';
    else status.textContent = `${site.buttons?.length || 0} button(s) configured.`;
  } catch (e) {}

  const openBtn = document.getElementById('open-options');
  openBtn.addEventListener('click', () => {
    try {
      chrome.runtime.openOptionsPage();
    } catch (e) {
      const url = chrome.runtime.getURL('options.html');
      chrome.tabs.create({ url });
    }
  });

  const reloadBtn = document.getElementById('reload');
  reloadBtn.addEventListener('click', () => {
    if (tab && tab.id) chrome.tabs.reload(tab.id);
    window.close();
  });
}

init().catch(() => {});