# Sibling Buttons

A Chrome/Edge extension that inserts your own buttons next to any element on any website. Point at an element with CSS or XPath, choose **before** or **after**, give it a label, optional CSS, and an action — a link or a JS snippet.

Per-origin, per-button, fully editable. No toolbar. No floating widget. Just a button where you asked for it.

![Manifest V3](https://img.shields.io/badge/manifest-v3-blue)
![Chrome 114+](https://img.shields.io/badge/chrome-114%2B-blue)
![License: MIT](https://img.shields.io/badge/license-MIT-green)
![No dependencies](https://img.shields.io/badge/dependencies-none-lightgrey)
![No tracking](https://img.shields.io/badge/tracking-none-lightgrey)
![No network](https://img.shields.io/badge/network-none-lightgrey)

📥 Download & Install • Features • Usage • Settings • Presets • How it works • Development

---

## 📥 Download & Install

The Chrome Web Store version is not published yet. Until then, install directly from **GitHub Releases**. It's a 2-minute manual install, works exactly the same, and is 100% free.

### Step 1 — Download the latest release

👉 **[Download the latest release](https://github.com/mimdal-code/sibling-buttons-chrome-extension/releases/latest)** 👈

On that page, scroll to the **Assets** section and click:

```
sibling-buttons-1.0.0.zip
```

(Or pick any version you want from the [Releases page](https://github.com/mimdal-code/sibling-buttons-chrome-extension/releases).)

### Step 2 — Extract the zip

Unzip the downloaded file somewhere **permanent** — for example `~/Extensions/sibling-buttons`. Do **not** unzip to a temp folder; the browser loads the folder, not the zip, and it needs to stay put.

### Step 3 — Load in Chrome or Edge

Open `chrome://extensions` (Chrome / Brave / Edge / Vivaldi — Edge also accepts `edge://extensions`).

1. Turn on **Developer mode** (top-right toggle).
2. Click **Load unpacked**.
3. Select the unzipped folder — the one that contains `manifest.json`.
4. The extension appears in your toolbar.

That's it. The extension is now installed and ready.

### Updating

When a new release is out: delete the old folder, unzip the new one in the same place, then click the ↻ icon on the extension card in `chrome://extensions`. Chrome caches the manifest by folder path, so replacing the files in place + reload is enough.

### Building from source

If you'd rather clone than download a zip:

```bash
git clone https://github.com/mimdal-code/sibling-buttons-chrome-extension.git
cd sibling-buttons
```

Then in `chrome://extensions` → **Load unpacked** → select the `sibling-buttons` folder. Reload the extension (↻ icon) after every code change. **Reload the tab you're testing** — content scripts are not injected retroactively into already-open tabs.

---

## ✨ Features

- **Point, don't describe.** Target any element with CSS (`a[href$="/support"]`) or XPath (`/html/body/.../a`). XPath is auto-detected from a leading `/` or `(`.
- **Before / after only.** The button is a real sibling of the target, never nested. This avoids the invalid-HTML trap (button inside `<a>`).
- **Optional per-button CSS.** Paste a style string, or pick a preset (Default, Primary green/blue, Ghost, Danger, Pill, Compact, Dark-friendly, Wikipedia/Vector).
- **Two action types.**
  - **Link** — open a URL in a new tab or the same tab.
  - **JS (bookmarklet)** — run a snippet in the page's MAIN world. The code sees page globals (`window.jQuery`, framework internals) and bypasses the page's own `eval` restrictions.
- **Edit anything, any time.** Every button can be edited in place — target, position, label, CSS, action. The button keeps its ID so health records stay consistent.
- **Preset library.** One-click starters: Open URL, GitHub (dark), Copy page title, Log to console, GitHub (Web Store).
- **Live test + preview.** "Test on current tab" resolves the selector and shows the matched tag/text. "Preview on current tab" inserts a temporary button in the real page so you can see it before saving.
- **Health badges.** Each page load reports ✅ (with the matched tag/text) or ❌ (with the reason) per button. When a site changes and a target stops resolving, the badge tells you which button to re-pick.
- **Survives SPA navigation.** A debounced `MutationObserver` re-inserts detached buttons; a URL poll re-renders on `pushState`.
- **No telemetry, no network calls.** Everything lives in `chrome.storage.local`. Nothing leaves your browser.

---

## 🚀 Usage

Example: add a **GitHub** button next to the "Visit support hub" link on any Chrome Web Store detail page.

1. Click the extension icon → **Open settings**.
2. Click **+ Add** → enter `https://chromewebstore.google.com` → accept the permission prompt.
3. On the right pane:
   - **URL pattern filter:** `https://chromewebstore.google.com/detail/*`
   - Tick **enabled**.
4. Click the **GitHub (Web Store)** preset — the editor opens prefilled.
5. Click **Test on current tab** (with a Web Store detail tab active). You should see `✅ <a> "Visit support hub"`.
6. Click **Preview on current tab** — the button appears next to the support link.
7. Click **Save button**.
8. Reload the Web Store detail page. The GitHub button is there.

### More examples

**Link button — open Gmail from Wikipedia**

- **Target:** `/html/body/div[2]/header/div[2]/nav/div[1]/div[4]/div/ul/li[2]`
- **Position:** `before`
- **Label:** `GMail`
- **CSS:** Primary (blue)
- **Action:** Link → `https://mail.google.com/mail/u/0/#inbox` → new tab

Result: a blue "GMail" button appears just before the "Create account" link in Wikipedia's header.

**JS button — copy the page title**

- **Target:** any element you want the button next to
- **Action:** JS → `navigator.clipboard.writeText(document.title)`
- **CSS:** Ghost

Result: a subtle button that copies the current page's title to the clipboard.

**JS button — hello-world modal**

```js
(function () {
  document.getElementById('__hw_modal_overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = '__hw_modal_overlay';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:2147483647',
    'background:rgba(0,0,0,.45)',
    'display:flex', 'align-items:center', 'justify-content:center',
    'font:14px system-ui,-apple-system,Segoe UI,sans-serif'
  ].join(';');

  const modal = document.createElement('div');
  modal.style.cssText = [
    'background:#fff', 'color:#1f2328', 'border-radius:10px',
    'box-shadow:0 10px 40px rgba(0,0,0,.25)',
    'min-width:320px', 'max-width:90vw', 'padding:20px 20px 16px'
  ].join(';');

  const title = document.createElement('h3');
  title.textContent = 'Hello, world!';
  title.style.cssText = 'margin:0 0 8px;font-size:16px';

  const body = document.createElement('p');
  body.textContent = 'Injected into the page DOM.';
  body.style.cssText = 'margin:0 0 16px;color:#57606a';

  const actions = document.createElement('div');
  actions.style.cssText = 'display:flex;justify-content:flex-end;gap:8px';

  const close = document.createElement('button');
  close.textContent = 'Close';
  close.style.cssText = 'padding:6px 12px;border:1px solid #d0d7de;background:#f6f8fa;border-radius:6px;cursor:pointer;font:inherit';
  close.onclick = () => overlay.remove();

  actions.appendChild(close);
  modal.append(title, body, actions);
  overlay.appendChild(modal);

  overlay.addEventListener('mousedown', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  const onKey = (e) => {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', onKey, true);
    }
  };
  document.addEventListener('keydown', onKey, true);

  document.body.appendChild(overlay);
})();
```

> **Note:** on pages that enforce **Trusted Types** (Gmail, Chrome Web Store, many Google properties), `eval`-style JS is blocked by the page's CSP. The extension surfaces the block as a flash message on the button. For those pages, use a **Link** action, or wait for the built-in DOM operations in a future release.

---

## ⚙️ Settings

The options page is a two-column layout.

**Left sidebar**
- Every origin you've added, with its button count.
- Click to switch. Selection persists across reloads.
- **+ Add** to add a new origin.

**Right pane** (for the selected origin)
- **Site header.** Enable / disable, remove, optional URL pattern filter (glob, e.g. `https://example.com/detail/*`).
- **Buttons.** One row per button: label, action summary, health badge, Edit, Remove.
- **Presets.** One-click starters. They **prefill** the editor — you still click **Save** to persist.
- **Editor.** Visible only when you click "+ New button", "Edit", or a preset:
  - Target selector (CSS or XPath), with **Test on current tab**.
  - Position: before / after.
  - Label.
  - CSS preset radio row + editable CSS textarea. Selecting a preset fills the textarea; editing the textarea switches the radio to **Custom** automatically.
  - Action type (Link / JS) with the matching fields.
  - **Preview on current tab**, **Clear preview**, **Save button**, **Cancel**.

### Data model

Everything lives in `chrome.storage.local["sites"]`:

```json
{
  "https://chromewebstore.google.com": {
    "enabled": true,
    "urlPattern": "https://chromewebstore.google.com/detail/*",
    "buttons": [
      {
        "id": "b_2dpayzbs",
        "label": "GitHub",
        "css": "padding:4px 10px;border:1px solid #1f883d;border-radius:6px;background:#1f883d;color:#fff;cursor:pointer;",
        "position": "after",
        "target": { "selector": "a[href$=\"/support\"]", "language": "css" },
        "action": { "type": "link", "url": "https://github.com", "newTab": true }
      }
    ]
  }
}
```

Health records live in `chrome.storage.local["health"]`; the options page remembers your selection in `chrome.storage.local["ui.selectedOrigin"]`.

---

## 🎨 Presets

### Button presets (prefill the editor)

| Preset | What it does |
|---|---|
| **Open URL** | Plain link button. New tab. |
| **GitHub (dark)** | Green primary button, opens `https://github.com`. |
| **Copy page title** | JS: copies `document.title` to the clipboard. |
| **Log to console** | JS: prints `location.href` to the page console. |
| **GitHub (Web Store)** | Anchored to `a[href$="/support"]` on Web Store detail pages. |

### CSS presets (radio row in the editor)

| Preset | Style |
|---|---|
| **Default** | Neutral grey, works anywhere. |
| **Primary (green)** | Green filled, white text. |
| **Primary (blue)** | Blue filled, white text. |
| **Ghost** | Transparent, inherits text color. |
| **Danger** | Red filled. |
| **Pill** | Rounded corners (999px radius). |
| **Compact** | Small padding, for tight toolbars. |
| **Dark-friendly** | Translucent grey, `backdrop-filter`, works on light and dark pages. |
| **Wikipedia / Vector** | Matches Wikipedia's `.cdx-button` look. |

All presets include `position:relative;z-index:9999;pointer-events:auto;` so the button sits above overlays and label hit-areas. Keep those on any custom CSS you write.

---

## 🔧 How it works

### Component summary

| File | Role |
|---|---|
| `manifest.json` | MV3 manifest. Permissions: `scripting`, `storage`, `tabs`. Optional host permissions: `*://*/*`. |
| `background.js` | Service worker. Registers one content script per enabled origin via `chrome.scripting.registerContentScripts`, re-syncs on storage change, permission change, install, and startup. `syncAll` is serialized so concurrent triggers don't race. Duplicate-ID registrations recover by falling back to `updateContentScripts`. Also runs `runJsInMainWorld` actions in MAIN world and persists health reports. |
| `content.js` | Runs on enabled origins. Resolves each button's target (CSS via `querySelector`, XPath via `document.evaluate`), inserts a `<button>` before/after it, wires the click handler, reports per-button status. A debounced `MutationObserver` re-inserts detached buttons. A 400ms URL poll catches SPA navigation. A short retry loop (~10s, 500ms interval) catches late-rendered targets. |
| `content.css` | Base `.sibling-btn` styling and the small flash toast. Per-button CSS is applied inline via `style.cssText`, so the page can't override it. |
| `options.html` / `options.css` / `options.js` | Sidebar + settings pane, buttons list, add/edit/remove, presets, CSS preset radio row, test + preview, health badges. |
| `popup.html` / `popup.js` | Small popup: current origin, configured button count, links to Settings / Reload tab. |

### Why JS actions run in MAIN world

Content scripts run in an isolated world. They can touch the DOM, but they can't see the page's JS variables (`window.jQuery`, framework internals) and some page APIs behave differently. To let user JS behave like a bookmarklet, `background.js` sends the code to `chrome.scripting.executeScript({ world: "MAIN", func, args })`. That runs the code in the page's real context. The privileged `executeScript` call bypasses the page's `eval` restrictions for the code you supply — but it does **not** bypass Trusted Types, which some pages enforce.

### Health reporting

Each content script run sends `{ type: "reportHealth", origin, href, report }` to the background, with a per-button `{ ok: true, tag, text }` or `{ ok: false, error }`. The background stores it under `health[origin].byButton[id]`, and the options page renders ✅/❌ badges per row. When a target stops resolving, the badge tells you which button to re-pick.

### Permissions

- `scripting` — register content scripts and run JS in MAIN world.
- `storage` — save your sites and buttons.
- `tabs` — read the active tab's URL for the popup, and reload the active tab.
- **Optional host permissions** — the extension requests host access only for origins you explicitly add and enable. It never reads pages you haven't opted into.

No analytics, no network calls, no telemetry. Everything is local.

---

## 💻 Development

No build step. Pure MV3, no bundler, no npm, no dependencies.

```bash
git clone https://github.com/mimdal-code/sibling-buttons-chrome-extension.git
cd sibling-buttons
```

Load unpacked in `chrome://extensions`. Edit files. Reload the extension card. Reload the tab you're testing.

### Useful console commands

In the extension's **service worker console** (Chrome: `chrome://extensions` → card → "service worker" link; Edge: `Details` → `Inspect views` → `service worker`):

```js
// What's registered?
chrome.scripting.getRegisteredContentScripts().then(console.log)

// What's stored?
chrome.storage.local.get('sites').then(r => console.log(JSON.stringify(r.sites, null, 2)))

// What permissions are actually granted?
chrome.permissions.getAll().then(console.log)
```

If `chrome.scripting` is `undefined` in that console, you're either in the wrong console or the extension wasn't reloaded after a manifest change.

In the **page console**:

```js
// Did the content script inject?
window.__siblingButtonsLoaded
```

### Known limitation: Edge Dev 154

Edge Dev `154.0.4251.0` has a `chrome.scripting` API bug where `getRegisteredContentScripts()` can return `undefined` or `[]` even after successful registration, and content scripts silently fail to inject. No amount of reloading or unregistering fixes it. **Use Chrome Stable or Edge Stable.** On those, the extension works normally.

### Known limitation: Trusted Types pages

Pages that enforce Trusted Types (Gmail, Chrome Web Store, many Google properties, some banks) block `eval`-style JS. Your `js` action will run but the injected code that calls `eval` is blocked before it executes. The flash message says so. For those pages, use a `link` action instead, or wait for the built-in DOM operations (see Roadmap).

---

## 🗺️ Roadmap

Not implemented, but the code is structured for them:

- **Built-in DOM operations** — instead of user-supplied JS, add action types like `modal`, `copy`, `scrollIntoView`. These are injected via `executeScript({ func })` (a real function, no `eval`), which works even on Trusted Types pages.
- **Import / export** — the `sites` storage object is already JSON. A small UI to download/upload it would let users share button sets.
- **Re-pick button** — one-click flow: open the target tab, run the picker, rewrite `button.target.selector`.
- **Sync across devices** — `chrome.storage.sync` instead of `local`. The schema is small enough.

---

## 🐛 Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Popup shows `Origin: …` or `unknown (no permission)` | `chrome.tabs.query` returned a tab without `url` — host permission wasn't granted | Re-enable the site in options, accept the permission prompt |
| Options page is blank | JavaScript error on load | Right-click the options tab → Inspect → Console → read the first red line |
| Button never appears, page console shows `target-not-found` | The selector doesn't match anything on this page | Use **Test on current tab**; adjust the selector |
| Button appears but clicking it does nothing | The button is under an overlay or a label's hit area | Move the target one level up (`/parent::div`), and add `position:relative;z-index:9999;pointer-events:auto;` to the button CSS |
| JS action shows `This document requires 'TrustedScript' assignment` | The page enforces Trusted Types | Use a link action, or wait for built-in DOM operations |
| `Duplicate script ID` in the service worker console | Two `syncAll` runs raced | Already handled by serialization — if it still appears, reload the extension |
| Everything worked, then stopped after a site redesign | The target element changed | The health badge in options will be ❌ for the affected button. Re-pick or edit the target |
| Only see `[SiblingButtons]` logs after installing the latest release | The old content script is still injected in the tab | Hard-reload the tab (`Ctrl+Shift+R`) or remove + re-add the extension |

---

## 🙏 Credits

Built with the Chrome Extensions MV3 APIs. No third-party libraries. No fonts loaded. No network calls.

---

## 📄 License

MIT — see [LICENSE](LICENSE).

---

## 🔗 Links

- [Download latest release](https://github.com/mimdal-code/sibling-buttons-chrome-extension/releases/latest)
- [All releases](https://github.com/mimdal-code/sibling-buttons-chrome-extension/releases)
- [Issue tracker](https://github.com/mimdal-code/sibling-buttons-chrome-extension/issues)
- [Chrome Extensions MV3 docs](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
- [Trusted Types docs](https://web.dev/articles/trusted-types)
