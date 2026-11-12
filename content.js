// content.js
(function () {
  if (window.__siblingButtonsLoaded) return;
  window.__siblingButtonsLoaded = true;

  const STORAGE_KEY = 'sites';
  const origin = location.origin;
  const ATTR = 'data-sibling-btn-id';

  function resolveSelector(selector, language) {
    if (!selector) return null;
    try {
      if (language === 'xpath' || /^\s*\//.test(selector) || /^\s*\(/.test(selector)) {
        const r = document.evaluate(selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        return r.singleNodeValue || null;
      }
      return document.querySelector(selector);
    } catch (e) {
      return null;
    }
  }

  function detectLanguage(sel) {
    return (/^\s*\/|^\s*\(/.test(sel || '')) ? 'xpath' : 'css';
  }

  function matchesUrlPattern(pattern, href) {
    if (!pattern) return true;
    const esc = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    try {
      return new RegExp('^' + esc + '$').test(href);
    } catch (_) {
      return true;
    }
  }

  function buildButton(btn) {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute(ATTR, btn.id);
    b.className = 'sibling-btn';
    b.textContent = btn.label || 'Action';
    if (btn.css) b.style.cssText = btn.css;
    b.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      runAction(btn);
    });
    return b;
  }

  function runAction(btn) {
    const a = btn.action || {};
    if (a.type === 'link') {
      if (!a.url) return flash('No URL set');
      if (a.newTab === false) location.href = a.url;
      else window.open(a.url, '_blank', 'noopener');
    } else if (a.type === 'js') {
      if (!a.code) return flash('No JS code set');
      chrome.runtime.sendMessage({ type: 'runJsInMainWorld', code: a.code }, (res) => {
        if (chrome.runtime.lastError) {
          return flash('BG error: ' + chrome.runtime.lastError.message);
        }
        if (res && res.ok === false) flash('JS error: ' + (res.error || 'unknown'));
      });
    } else {
      flash('Unknown action');
    }
  }

  let flashTimer;
  function flash(msg) {
    let f = document.getElementById('__sibling_flash');
    if (!f) {
      f = document.createElement('div');
      f.id = '__sibling_flash';
      f.className = 'sibling-flash';
      document.body.appendChild(f);
    }
    f.textContent = msg;
    f.classList.add('show');
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => f.classList.remove('show'), 2200);
  }

  let currentSite = null;

  function isAttached(btnId) {
    return !!document.querySelector(`[${ATTR}="${CSS.escape(btnId)}"]`);
  }

  function insertOne(btn, report) {
    if (isAttached(btn.id)) {
      report[btn.id] = { ok: true, note: 'already-present' };
      return;
    }
    const tgt = btn.target || {};
    const node = resolveSelector(tgt.selector, tgt.language || detectLanguage(tgt.selector));
    if (!node) {
      report[btn.id] = { ok: false, error: 'target-not-found' };
      return;
    }
    const parent = node.parentNode;
    if (!parent) {
      report[btn.id] = { ok: false, error: 'target-has-no-parent' };
      return;
    }
    const el = buildButton(btn);
    try {
      if (btn.position === 'before') parent.insertBefore(el, node);
      else parent.insertBefore(el, node.nextSibling);
      report[btn.id] = {
        ok: true,
        tag: node.tagName.toLowerCase(),
        text: (node.textContent || '').trim().slice(0, 80)
      };
    } catch (e) {
      report[btn.id] = { ok: false, error: String(e && e.message || e) };
    }
  }

  function renderAll(reason) {
    if (!currentSite) return;
    if (!matchesUrlPattern(currentSite.urlPattern, location.href)) return;
    const report = {};
    for (const btn of (currentSite.buttons || [])) insertOne(btn, report);
    chrome.runtime.sendMessage({ type: 'reportHealth', origin, href: location.href, report }).catch(() => {});
  }

  function load() {
    chrome.storage.local.get(STORAGE_KEY, (r) => {
      const sites = r[STORAGE_KEY] || {};
      const cfg = sites[origin];
      if (!cfg || !cfg.enabled) return;
      currentSite = cfg;
      renderAll('load');
    });
  }

  let obsTimer = null;
  const observer = new MutationObserver((mutations) => {
    let relevant = false;
    for (const m of mutations) {
      if (m.type !== 'childList') continue;
      for (const n of m.addedNodes) {
        if (n.nodeType === 1 && n.hasAttribute && n.hasAttribute(ATTR)) continue;
        relevant = true; break;
      }
      if (!relevant) for (const n of m.removedNodes) {
        if (n.nodeType === 1 && n.hasAttribute && n.hasAttribute(ATTR)) continue;
        relevant = true; break;
      }
      if (relevant) break;
    }
    if (!relevant) return;
    clearTimeout(obsTimer);
    obsTimer = setTimeout(() => {
      if (currentSite) renderAll('observer');
    }, 150);
  });

  let retries = 0;
  const retry = setInterval(() => {
    if (!currentSite) {
      if (retries++ > 40) clearInterval(retry);
      return;
    }
    if (retries++ > 20) return clearInterval(retry);
    renderAll('retry');
  }, 500);

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'resolveSelector') {
      const node = resolveSelector(msg.selector, msg.language || detectLanguage(msg.selector));
      if (!node) { sendResponse({ ok: false, error: 'not-found' }); return true; }
      sendResponse({ ok: true, tag: node.tagName.toLowerCase(), text: (node.textContent || '').trim().slice(0, 120) });
      return true;
    }
    if (msg?.type === 'previewInsert') {
      document.querySelectorAll('[data-sibling-preview]').forEach(n => n.remove());
      const node = resolveSelector(msg.selector, msg.language || detectLanguage(msg.selector));
      if (!node || !node.parentNode) { sendResponse({ ok: false, error: 'target-not-found' }); return true; }
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('data-sibling-preview', '1');
      b.className = 'sibling-btn sibling-btn-preview';
      b.textContent = msg.label || 'Preview';
      if (msg.css) b.style.cssText = msg.css;
      b.addEventListener('click', (e) => { e.preventDefault(); flash('Preview (not saved)'); });
      if (msg.position === 'before') node.parentNode.insertBefore(b, node);
      else node.parentNode.insertBefore(b, node.nextSibling);
      sendResponse({ ok: true, tag: node.tagName.toLowerCase() });
      return true;
    }
    if (msg?.type === 'clearPreview') {
      document.querySelectorAll('[data-sibling-preview]').forEach(n => n.remove());
      sendResponse({ ok: true });
      return true;
    }
    if (msg?.type === 'ping') { sendResponse({ ok: true }); return true; }
  });

  load();
  chrome.storage.onChanged.addListener((ch, area) => {
    if (area === 'local' && ch[STORAGE_KEY]) load();
  });
  const attachObserver = () => {
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      setTimeout(attachObserver, 50);
    }
  };
  attachObserver();
  let lastHref = location.href;
  setInterval(() => {
    if (location.href !== lastHref) {
      lastHref = location.href;
      setTimeout(() => { if (currentSite) renderAll('spa-nav'); }, 300);
    }
  }, 400);
})();