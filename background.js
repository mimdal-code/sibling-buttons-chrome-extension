// background.js

const STORAGE_KEY = 'sites';

async function getSites() {
  const r = await chrome.storage.local.get(STORAGE_KEY);
  return r[STORAGE_KEY] || {};
}

function scriptIdFor(origin) {
  return 'site-' + btoa(origin).replace(/=/g, '');
}

async function registerOrigin(origin) {
  const id = scriptIdFor(origin);
  const config = {
    id,
    matches: [`${origin}/*`],
    js: ['content.js'],
    css: ['content.css'],
    runAt: 'document_idle',
    persistAcrossSessions: true
  };

  try {
    const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [id] });
    if (existing.length) {
      await chrome.scripting.updateContentScripts([config]);
    } else {
      await chrome.scripting.registerContentScripts([config]);
    }
  } catch (e) {
    const msg = String(e && e.message || e);
    if (msg.includes('Duplicate script ID')) {
      try {
        await chrome.scripting.updateContentScripts([config]);
        return;
      } catch (e2) {
        throw e2;
      }
    }
    throw e;
  }
}

async function unregisterOrigin(origin) {
  const id = scriptIdFor(origin);
  try {
    await chrome.scripting.unregisterContentScripts({ ids: [id] });
  } catch (e) {}
}

// Serialize syncAll so overlapping triggers don't race on registerContentScripts.
let syncRunning = null;
let syncAgain = false;

async function syncAllImpl() {
  try {
    const sites = await getSites();
    const wanted = new Set();
    for (const [origin, cfg] of Object.entries(sites)) {
      if (cfg && cfg.enabled) {
        wanted.add(origin);
        try { await registerOrigin(origin); } catch (e) {}
      } else {
        await unregisterOrigin(origin);
      }
    }
    const all = await chrome.scripting.getRegisteredContentScripts();
    const wantedIds = new Set([...wanted].map(scriptIdFor));
    const orphans = all.map(s => s.id).filter(id => id.startsWith('site-') && !wantedIds.has(id));
    if (orphans.length) {
      try { await chrome.scripting.unregisterContentScripts({ ids: orphans }); } catch (e) {}
    }
  } catch (e) {}
}

async function syncAll() {
  if (syncRunning) {
    syncAgain = true;
    return syncRunning;
  }
  syncRunning = (async () => {
    do {
      syncAgain = false;
      await syncAllImpl();
    } while (syncAgain);
    syncRunning = null;
  })();
  return syncRunning;
}

chrome.runtime.onInstalled.addListener(() => { syncAll(); });
chrome.runtime.onStartup.addListener(() => { syncAll(); });
chrome.storage.onChanged.addListener((ch, area) => {
  if (area === 'local' && ch[STORAGE_KEY]) syncAll();
});
chrome.permissions.onAdded.addListener(() => { syncAll(); });
chrome.permissions.onRemoved.addListener(() => { syncAll(); });

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'sync') {
    syncAll().then(() => sendResponse({ ok: true })).catch(e => sendResponse({ ok: false, error: String(e) }));
    return true;
  }
  if (msg?.type === 'reloadTab') {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]) chrome.tabs.reload(tabs[0].id);
    });
    sendResponse({ ok: true });
    return true;
  }
  if (msg?.type === 'reportHealth') {
    (async () => {
      const r = await chrome.storage.local.get('health');
      const health = r.health || {};
      if (!health[msg.origin]) health[msg.origin] = { byButton: {} };
      for (const [id, status] of Object.entries(msg.report || {})) {
        health[msg.origin].byButton[id] = { ...status, at: Date.now(), href: msg.href };
      }
      await chrome.storage.local.set({ health });
      chrome.runtime.sendMessage({ type: 'healthUpdated' }).catch(() => {});
    })();
    sendResponse({ ok: true });
    return true;
  }
  if (msg?.type === 'runJsInMainWorld') {
    const tabId = sender?.tab?.id;
    if (typeof tabId !== 'number') { sendResponse({ ok: false, error: 'no tab' }); return true; }
    const code = String(msg.code || '');
    chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: (src) => {
        try { (0, eval)(src); return { ok: true }; }
        catch (e) { return { ok: false, error: String(e && e.message || e) }; }
      },
      args: [code]
    }).then(results => {
      const r = results && results[0] && results[0].result;
      sendResponse(r && typeof r === 'object' ? r : { ok: true });
    }).catch(e => {
      sendResponse({ ok: false, error: String(e) });
    });
    return true;
  }
});