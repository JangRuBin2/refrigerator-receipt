/**
 * Post-build script for .ait static bundle.
 *
 * KEY INSIGHT: The Toss WebView uses SPA-fallback routing.
 * ALL paths (e.g. /ko/, /ko/fridge/) serve the root index.html.
 *
 * Problem: Next.js static export generates per-route HTML with route-specific
 * RSC (React Server Component) payloads. If the wrong HTML is served for a route,
 * hydration fails and the UI breaks.
 *
 * CRITICAL: document.write() CANNOT be used because it destroys the Toss SDK
 * (window.AppsInToss) that the WebView injects into the page.
 *
 * Solution: Copy ko/index.html as root index.html, inject a script that
 * uses history.replaceState() to normalize the URL to /ko/ before hydration.
 * After React hydrates, a DeepLinkHandler component navigates to the actual path.
 * This preserves the Toss SDK since no document replacement occurs.
 *
 * Modes (controlled by AIT_DEBUG env var):
 *   AIT_DEBUG=true  → Debug diagnostic landing page + error overlay on all pages
 *   AIT_DEBUG=false → Copy ko/index.html + URL normalization (production)
 *
 * Usage:
 *   AIT_DEBUG=true  npx granite build   # debug build
 *   npx granite build                   # production build
 */
import { writeFileSync, readFileSync, readdirSync, statSync, copyFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, '..', 'out');
const isDebug = process.env.AIT_DEBUG === 'true';

// ─────────────────────────────────────────────
// Root index.html — Debug (diagnostic page)
// ─────────────────────────────────────────────
const debugHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<title>MealKeeper - Debug</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #1a1a2e;
    color: #eee;
    padding: 16px;
    min-height: 100vh;
  }
  h1 { font-size: 20px; margin-bottom: 16px; color: #fff; text-align: center; padding: 12px 0; border-bottom: 2px solid #333; }
  .section { margin-bottom: 20px; }
  .section-title { font-size: 14px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .row { background: #16213e; border-radius: 8px; padding: 10px 12px; margin-bottom: 6px; word-break: break-all; font-size: 13px; line-height: 1.5; }
  .label { font-weight: 700; color: #aaa; display: block; font-size: 11px; margin-bottom: 2px; }
  .value { font-size: 15px; font-weight: 600; }
  .ok { color: #00e676; }
  .fail { color: #ff1744; }
  .pending { color: #ffab00; }
  .btn { display: block; width: 100%; padding: 16px; margin-top: 24px; font-size: 18px; font-weight: 700; color: #fff; background: #3182F6; border: none; border-radius: 12px; cursor: pointer; text-align: center; text-decoration: none; }
  .btn:active { opacity: 0.8; }
  .fetch-row { background: #16213e; border-radius: 8px; padding: 10px 12px; margin-bottom: 6px; font-size: 13px; line-height: 1.5; }
  .fetch-url { font-weight: 700; color: #aaa; display: block; font-size: 11px; margin-bottom: 4px; word-break: break-all; }
  .fetch-status { font-size: 15px; font-weight: 600; }
  .timestamp { text-align: center; font-size: 11px; color: #555; margin-top: 12px; }
</style>
</head>
<body>
<h1>MealKeeper Debug Page</h1>

<div class="section">
  <div class="section-title">Environment</div>
  <div class="row"><span class="label">window.location.href</span><span class="value" id="loc-href"></span></div>
  <div class="row"><span class="label">window.location.origin</span><span class="value" id="loc-origin"></span></div>
  <div class="row"><span class="label">window.location.protocol</span><span class="value" id="loc-protocol"></span></div>
  <div class="row"><span class="label">navigator.userAgent</span><span class="value" id="ua"></span></div>
  <div class="row"><span class="label">document.URL</span><span class="value" id="doc-url"></span></div>
  <div class="row"><span class="label">localStorage available</span><span class="value" id="ls-avail"></span></div>
  <div class="row"><span class="label">window.fetch available</span><span class="value" id="fetch-avail"></span></div>
</div>

<div class="section">
  <div class="section-title">Fetch Tests</div>
  <div class="fetch-row"><span class="fetch-url">fetch('/ko/index.html') — absolute</span><span class="fetch-status pending" id="fetch-abs">Testing...</span></div>
  <div class="fetch-row"><span class="fetch-url">fetch('/_next/static/css/...') — static asset</span><span class="fetch-status pending" id="fetch-css">Testing...</span></div>
</div>

<a class="btn" href="/ko/">Go to /ko/</a>
<div class="timestamp" id="ts"></div>

<script>
(function () {
  document.getElementById('loc-href').textContent = window.location.href;
  document.getElementById('loc-origin').textContent = window.location.origin;
  document.getElementById('loc-protocol').textContent = window.location.protocol;
  document.getElementById('ua').textContent = navigator.userAgent;
  document.getElementById('doc-url').textContent = document.URL;

  var lsEl = document.getElementById('ls-avail');
  try { localStorage.setItem('__debug_test__', '1'); localStorage.removeItem('__debug_test__'); lsEl.textContent = 'YES'; lsEl.className = 'value ok'; }
  catch (e) { lsEl.textContent = 'NO (' + e.message + ')'; lsEl.className = 'value fail'; }

  var fetchEl = document.getElementById('fetch-avail');
  fetchEl.textContent = typeof window.fetch === 'function' ? 'YES' : 'NO';
  fetchEl.className = 'value ' + (typeof window.fetch === 'function' ? 'ok' : 'fail');

  document.getElementById('ts').textContent = 'Page loaded: ' + new Date().toISOString();

  function runFetchTest(url, elementId) {
    var el = document.getElementById(elementId);
    if (typeof window.fetch !== 'function') { el.textContent = 'SKIP'; el.className = 'fetch-status fail'; return; }
    var t = Date.now();
    window.fetch(url, { method: 'GET', cache: 'no-store' })
      .then(function (r) { var ms = Date.now() - t; el.textContent = (r.ok ? 'OK' : 'FAIL') + ' — status ' + r.status + ' (' + ms + 'ms)'; el.className = 'fetch-status ' + (r.ok ? 'ok' : 'fail'); })
      .catch(function (e) { var ms = Date.now() - t; el.textContent = 'ERROR — ' + e.message + ' (' + ms + 'ms)'; el.className = 'fetch-status fail'; });
  }
  runFetchTest('/ko/index.html', 'fetch-abs');

  fetch('/ko/index.html').then(function(r){return r.text()}).then(function(html){
    var m = html.match(/\\/_next\\/static\\/css\\/[^"]+\\.css/);
    if (m) runFetchTest(m[0], 'fetch-css');
    else { var el = document.getElementById('fetch-css'); el.textContent = 'SKIP (no CSS found)'; el.className = 'fetch-status pending'; }
  }).catch(function(){ runFetchTest('/_next/static/css/test.css', 'fetch-css'); });
})();
</script>
</body>
</html>
`;

// ─────────────────────────────────────────────
// Error overlay script (injected into all pages in debug mode)
// ─────────────────────────────────────────────
const errorOverlayScript = `<script>
(function(){
  var errors = [];
  var overlay = null;
  function showOverlay() {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = '__debug_overlay__';
      overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#1a1a2e;color:#ff1744;font-family:monospace;font-size:12px;padding:12px;max-height:60vh;overflow:auto;border-bottom:3px solid #ff1744;';
      var title = document.createElement('div');
      title.style.cssText = 'font-size:16px;font-weight:bold;margin-bottom:8px;color:#fff;';
      title.textContent = 'JS ERRORS (' + window.location.pathname + ')';
      overlay.appendChild(title);
      (document.body || document.documentElement).appendChild(overlay);
    }
    while (overlay.childNodes.length > 1) overlay.removeChild(overlay.lastChild);
    errors.forEach(function(e, i) {
      var row = document.createElement('div');
      row.style.cssText = 'background:#16213e;border-radius:6px;padding:8px;margin-bottom:6px;word-break:break-all;white-space:pre-wrap;';
      row.textContent = '[' + (i+1) + '] ' + e;
      overlay.appendChild(row);
    });
  }
  window.onerror = function(msg, src, line, col, err) {
    errors.push(msg + '\\n  at ' + (src||'?') + ':' + (line||0) + ':' + (col||0) + (err && err.stack ? '\\n' + err.stack : ''));
    showOverlay();
  };
  window.addEventListener('unhandledrejection', function(ev) {
    var reason = ev.reason;
    var msg = reason instanceof Error ? reason.message + '\\n' + (reason.stack||'') : String(reason);
    errors.push('UnhandledRejection: ' + msg);
    showOverlay();
  });
  var origCreateElement = document.createElement.bind(document);
  var scriptCount = 0;
  var scriptErrors = 0;
  document.createElement = function(tag) {
    var el = origCreateElement(tag);
    if (tag.toLowerCase() === 'script') {
      scriptCount++;
      el.addEventListener('error', function() {
        scriptErrors++;
        errors.push('Script load FAILED: ' + (el.src || 'inline'));
        showOverlay();
      });
    }
    return el;
  };
  setTimeout(function() {
    var s = document.createElement('div');
    s.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#16213e;color:#00e676;font-family:monospace;font-size:11px;padding:8px 12px;border-top:1px solid #333;';
    s.textContent = 'DEBUG [5s]: errors=' + errors.length + ' scripts=' + scriptCount + ' scriptFails=' + scriptErrors + ' readyState=' + document.readyState + ' bodyChildren=' + (document.body ? document.body.children.length : 'nobody');
    (document.body || document.documentElement).appendChild(s);
  }, 5000);
})();
</script>`;

// ─────────────────────────────────────────────
// 1. Replace root index.html
// ─────────────────────────────────────────────
if (isDebug) {
  writeFileSync(resolve(outDir, 'index.html'), debugHtml, 'utf-8');
  console.log('🔧 [AIT_DEBUG] Replaced out/index.html with DEBUG diagnostic page');
} else {
  // Production: Copy ko/index.html as root, inject URL normalization script.
  // This approach preserves the Toss SDK (window.AppsInToss) because
  // NO document.write() is used — the page renders normally.
  const koIndexPath = resolve(outDir, 'ko', 'index.html');
  if (!existsSync(koIndexPath)) {
    console.error('ERROR: ko/index.html not found in output directory!');
    process.exit(1);
  }

  let koHtml = readFileSync(koIndexPath, 'utf-8');

  // Inject URL normalization script at the very start of <head>.
  // This MUST run before React/Next.js scripts read window.location.pathname.
  // It ensures the URL matches the RSC payload (which is for /ko/).
  const urlFixScript = `<script>
(function(){
  var p = window.location.pathname;
  if (p === '/' || p === '/index.html') {
    // Root path → normalize to /ko/
    history.replaceState(null, '', '/ko/');
  } else if (p !== '/ko/' && p !== '/ko/index.html') {
    // Deep-linked to a sub-route (e.g. /ko/shopping/)
    // Save actual path for DeepLinkHandler to pick up after hydration
    window.__MK_ACTUAL_PATH__ = p;
    // Temporarily change URL to /ko/ so hydration matches the RSC payload
    history.replaceState(null, '', '/ko/');
  }
})();
</script>`;

  if (koHtml.includes('<head>')) {
    koHtml = koHtml.replace('<head>', '<head>' + urlFixScript);
  } else if (koHtml.includes('<head ')) {
    koHtml = koHtml.replace(/<head([^>]*)>/, '<head$1>' + urlFixScript);
  }

  writeFileSync(resolve(outDir, 'index.html'), koHtml, 'utf-8');
  console.log('✅ Created root index.html (copy of ko/index.html + URL normalization)');
}

// ─────────────────────────────────────────────
// 2. Inject error overlay (debug mode only)
// ─────────────────────────────────────────────
if (isDebug) {
  function injectAllHtml(dir) {
    let count = 0;
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        count += injectAllHtml(fullPath);
      } else if (entry.endsWith('.html')) {
        if (fullPath === resolve(outDir, 'index.html')) continue;
        const html = readFileSync(fullPath, 'utf-8');
        if (html.includes('__debug_overlay__')) continue;
        let modified;
        if (html.includes('<head>')) {
          modified = html.replace('<head>', '<head>' + errorOverlayScript);
        } else if (html.includes('<head ')) {
          modified = html.replace(/<head([^>]*)>/, '<head$1>' + errorOverlayScript);
        } else {
          modified = errorOverlayScript + html;
        }
        writeFileSync(fullPath, modified, 'utf-8');
        count++;
      }
    }
    return count;
  }

  const injected = injectAllHtml(outDir);
  console.log(`🔧 [AIT_DEBUG] Injected error overlay into ${injected} HTML files`);
} else {
  console.log('✅ Production mode — no debug overlay injected');
}
