/* Scanner QA dinámico: contraste WCAG 2.1 + overflow horizontal + touch targets + errores de consola.
   Uso: node scan.js <url> <width> <height> <outJson> [outPng] ['[{"click":"texto"},{"wait":800}]'] */
const { chromium } = require('playwright-core');
const fs = require('fs');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [, , url, w, h, outJson, outPng, actionsJson] = process.argv;

function parseColor(str) {
  const m = str.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(',').map(s => parseFloat(s));
  return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
}
function composite(fg, bg) {
  return {
    r: Math.round(fg.r * fg.a + bg.r * (1 - fg.a)),
    g: Math.round(fg.g * fg.a + bg.g * (1 - fg.a)),
    b: Math.round(fg.b * fg.a + bg.b * (1 - fg.a)),
  };
}
function relLum({ r, g, b }) {
  const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(fg, bg) {
  const l1 = relLum(fg), l2 = relLum(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const SCAN = () => {
  function parseColor(str) {
    if (!str || str === 'transparent' || str === 'none') return null;
    str = str.trim();
    // hex
    let m = str.match(/^#([0-9a-f]{3,8})$/i);
    if (m) {
      let hex = m[1];
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
      if (hex.length === 8) return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16), a: parseInt(hex.slice(6, 8), 16) / 255 };
      return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16), a: 1 };
    }
    const num = '[\\d.]+%?';
    const sep = '[\\s,]+';
    const alpha = '(?:\\s*/\\s*([\\d.]+%?))?';
    // rgb / rgba (coma o espacio, alfa numérico o %)
    m = str.match(new RegExp(`^rgba?\\(\\s*(${num})${sep}(${num})${sep}(${num})(?:${sep}(${num}))?\\s*\\)$`, 'i'));
    if (m) {
      const pc = v => v.endsWith('%') ? parseFloat(v) * 2.55 : parseFloat(v);
      const a = m[4] ? (m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4])) : 1;
      return { r: pc(m[1]), g: pc(m[2]), b: pc(m[3]), a };
    }
    // oklab( L a b [/alpha] )
    m = str.match(new RegExp(`^oklab\\(\\s*(${num})${sep}(-?[\\d.]+)${sep}(-?[\\d.]+)${alpha}\\s*\\)$`, 'i'));
    if (m) return okToRgb(parseFloat(m[1]) / (m[1].endsWith('%') ? 100 : 1), parseFloat(m[2]), parseFloat(m[3]), m[4] ? parseAlpha(m[4]) : 1);
    // oklch( L C H [/alpha] )
    m = str.match(new RegExp(`^oklch\\(\\s*(${num})${sep}([\\d.]+)${sep}(-?[\\d.]+)${alpha}\\s*\\)$`, 'i'));
    if (m) {
      const L = parseFloat(m[1]) / (m[1].endsWith('%') ? 100 : 1);
      const C = parseFloat(m[2]);
      const H = parseFloat(m[3]);
      const A = parseFloat(m[2]) * Math.cos(H * Math.PI / 180);
      const B = parseFloat(m[2]) * Math.sin(H * Math.PI / 180);
      return okToRgb(L, A, B, m[4] ? parseAlpha(m[4]) : 1);
    }
    return null;
  }
  function parseAlpha(v) { return v.endsWith('%') ? parseFloat(v) / 100 : parseFloat(v); }
  function okToRgb(L, A, B, alpha) {
    const l_ = L + 0.3963377774 * A + 0.2158037573 * B;
    const m_ = L - 0.1055613458 * A - 0.0638541728 * B;
    const s_ = L - 0.0894841775 * A - 1.2914855480 * B;
    const l = l_ * l_ * l_, mm = m_ * m_ * m_, s = s_ * s_ * s_;
    const lr = +4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s;
    const lg = -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s;
    const lb = -0.0041960863 * l - 0.7034186147 * mm + 1.7076147010 * s;
    const gam = c => { c = Math.min(1, Math.max(0, c)); return Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055)); };
    return { r: gam(lr), g: gam(lg), b: gam(lb), a: alpha === undefined ? 1 : alpha };
  }
  function composite(fg, bg) {
    if (!fg) return bg;
    if (!bg) return fg;
    return {
      r: Math.round(fg.r * fg.a + bg.r * (1 - fg.a)),
      g: Math.round(fg.g * fg.a + bg.g * (1 - fg.a)),
      b: Math.round(fg.b * fg.a + bg.b * (1 - fg.a)),
    };
  }
  function relLum({ r, g, b }) {
    const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  }
  function ratio(fg, bg) {
    if (!fg || !bg) return Infinity;
    const l1 = relLum(fg), l2 = relLum(bg);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  const results = { contrast: [], overflow: { horizontal: false, offenders: [] }, touchTargets: [], jsTitle: document.title };
  const base = parseColor(getComputedStyle(document.documentElement).backgroundColor) || { r: 241, g: 245, b: 249, a: 1 };

  // ---- contraste ----
  const groups = new Map();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  const scanErrors = [];
  while (walker.nextNode()) {
    const text = walker.currentNode.textContent.trim();
    if (!text) continue;
    const el = walker.currentNode.parentElement;
    if (!el || seen.has(el)) continue;
    seen.add(el);
    try {
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    const opacity = parseFloat(cs.opacity || '1');
    if (opacity === 0) continue;
    // texto con gradiente recortado (bg-clip-text): no medible, es marca
    const clip = cs.webkitBackgroundClip || cs.backgroundClip;
    if (clip === 'text' || cs.color === 'rgba(0, 0, 0, 0)' || cs.color === 'transparent') continue;
    // texto efectivo (color con alfa compone sobre el fondo efectivo)
    let fg = parseColor(cs.color) || { r: 0, g: 0, b: 0, a: 1 };
    const fgAlpha = fg.a;
    // fondo efectivo: recolectar capas cerca→lejos y plegarlas lejos→cerca
    // (un ancestro opaco lejano queda DETRÁS de las capas ya acumuladas)
    const layers = [];
    let node = el;
    while (node && node.nodeType === 1) {
      const ncs = getComputedStyle(node);
      const bi = ncs.backgroundImage;
      if (bi && bi !== 'none') {
        const rgbRe = /(?:rgba?|oklab|oklch)\([^)]+\)|#[0-9a-fA-F]{3,8}/g;
        const stops = [...bi.matchAll(rgbRe)].map(m => parseColor(m[0])).filter(Boolean);
        if (stops.length >= 2) { layers.push({ type: 'grad', stops }); }
      }
      const c = parseColor(ncs.backgroundColor);
      if (c && c.a > 0) { layers.push({ type: 'flat', c }); }
      node = node.parentElement;
    }
    let acc = [base];
    for (let i = layers.length - 1; i >= 0; i--) {
      const L = layers[i];
      if (L.type === 'flat') {
        // plegar sin cortar: las capas más cercanas pintan SIEMPRE encima
        acc = acc.map(c => composite(L.c, c));
      } else {
        // gradiente translúcido: cada candidato se ramifica por sus stops
        // (cap 64 para no explotar); los gradients opacos dejan 1-2 oscuros
        const next = [];
        for (const c of acc) {
          for (const s of L.stops) next.push(s.a < 1 ? composite(s, c) : { ...s });
        }
        acc = next.slice(0, 64);
      }
    }
    let fgFinal = fg;
    if (fg.a < 1) { fgFinal = { ...composite({ ...fg, a: fg.a }, acc[0]), a: 1 }; }
    if (opacity < 1) { fgFinal = { ...composite({ ...fgFinal, a: opacity }, acc[0]), a: 1 }; }
    const worstCand = acc.reduce((a, b) => ratio(fgFinal, b) < ratio(fgFinal, a) ? b : a);
    const worst = ratio(fgFinal, worstCand);
    const fs_ = parseFloat(cs.fontSize);
    const fw = parseInt(cs.fontWeight) || 400;
    const isLarge = fs_ >= 24 || (fw >= 700 && fs_ >= 18.66);
    const min = isLarge ? 3.0 : 4.5;
    if (worst < min) {
      const key = `${fgFinal.r},${fgFinal.g},${fgFinal.b}|${worstCand.r},${worstCand.g},${worstCand.b}|${fs_}`;
      if (!groups.has(key)) groups.set(key, { fg: `rgb(${fgFinal.r},${fgFinal.g},${fgFinal.b})`, bg: `rgb(${worstCand.r},${worstCand.g},${worstCand.b})`, ratio: +worst.toFixed(2), min, fontSize: +fs_.toFixed(1), large: isLarge, count: 0, sample: text.slice(0, 40), el: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').slice(0, 3).join('.') : '') });
      groups.get(key).count++;
    }
    } catch (err) {
      scanErrors.push(String(err && err.message).slice(0, 120) + ' @ ' + el.tagName + '."' + String(el.className).slice(0, 50) + '"');
    }
  }
  results.scanErrors = scanErrors.slice(0, 8);
  results.contrast = [...groups.values()].sort((a, b) => a.ratio - b.ratio).slice(0, 50);

  // ---- overflow horizontal ----
  const de = document.documentElement;
  results.overflow.horizontal = de.scrollWidth > de.clientWidth + 1;
  if (results.overflow.horizontal) {
    for (const el of document.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.right > de.clientWidth + 1 && r.width > 0) {
        results.overflow.offenders.push(el.tagName.toLowerCase() + (typeof el.className === 'string' ? '.' + el.className.split(' ').slice(0, 3).join('.') : '') + ` (right=${Math.round(r.right)})`);
        if (results.overflow.offenders.length >= 10) break;
      }
    }
  }

  // ---- touch targets (solo si viewport táctil) ----
  if (window.innerWidth < 900) {
    const seenT = new Set();
    for (const el of document.querySelectorAll('button, a[href], [role="button"], input[type="submit"], select')) {
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.bottom < 0 || r.top > window.innerHeight) continue;
      if (r.height < 44 && r.width < 44) {
        const key = `${el.tagName}|${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30)}`;
        if (seenT.has(key)) continue;
        seenT.add(key);
        results.touchTargets.push({ el: key, w: Math.round(r.width), h: Math.round(r.height) });
        if (results.touchTargets.length >= 30) break;
      }
    }
  }
  return results;
};

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 160)); });
  page.on('pageerror', e => consoleErrors.push('PAGEERROR: ' + String(e).slice(0, 160)));
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);

  if (actionsJson) {
    for (const a of JSON.parse(actionsJson)) {
      if (a.click) {
        // Triple fallback: text= → role/name → click por coordenadas. Los
        // botones con animación continua (pulsos de marca, gradientes)
        // rechazan clicks sintéticos aun con force (lección fase D/E).
        const ok1 = await page.click(`text=${a.click}`, { timeout: 4000, force: true }).then(() => true).catch(() => false);
        if (!ok1) {
          const loc = page.getByRole('button', { name: a.click }).first();
          const ok2 = await loc.click({ timeout: 4000, force: true }).then(() => true).catch(() => false);
          if (!ok2) {
            const box = await loc.boundingBox().catch(() => null);
            if (box) { await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); }
            else consoleErrors.push('click-fallo: ' + a.click);
          }
        }
      }
      if (a.fill) { await page.fill(a.fill.sel, a.fill.val, { timeout: 4000 }).catch(e => consoleErrors.push('fill-fallo')); }
      if (a.press) { await page.press(a.press.sel, a.press.key, { timeout: 4000 }).catch(() => consoleErrors.push('press-fallo')); }
      if (a.scrollY) { await page.mouse.wheel(0, a.scrollY); }
      if (a.wait) await page.waitForTimeout(a.wait);
    }
    await page.waitForTimeout(800);
  }

  const results = await page.evaluate(SCAN);
  results.consoleErrors = [...new Set(consoleErrors)].slice(0, 12);
  if (outPng) await page.screenshot({ path: outPng });
  fs.writeFileSync(outJson, JSON.stringify(results, null, 1));
  const c = results.contrast.length, t = results.touchTargets.length;
  console.log(`OK ${url} ${w}x${h} :: contraste-fails=${c} touch-fails=${t} hOverflow=${results.overflow.horizontal} jsErrors=${results.consoleErrors.length}`);
  await browser.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
