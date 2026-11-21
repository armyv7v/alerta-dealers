// Medidor LCP — PerformanceObserver instalado ANTES de la navegación
// (addInitScript), headless real de Chrome del sistema. Uso:
//   node lcp-measure.js <url> [desktop|mobile]
// Reporta: cadena LCP con elemento, paints, y orden de arranque de recursos.
const { chromium } = require('playwright-core');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.argv[2] || 'https://autored-coquimbo.vercel.app/login';
const FORMA = process.argv[3] || 'mobile';

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const ctx = await browser.newContext(FORMA === 'mobile'
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'es-CL' }
    : { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1, locale: 'es-CL' });

  // El observer vive desde el primer byte del documento: no se pierde ningún
  // candidato ni paint, a diferencia de inyectarlo después de la carga.
  await ctx.addInitScript(() => {
    window.__lcp = [];
    window.__paints = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        window.__lcp.push({
          ms: Math.round(e.startTime),
          tag: e.element ? e.element.tagName : '(img externa)',
          url: e.url || null,
          texto: e.element ? (e.element.textContent || '').trim().slice(0, 40) : null,
          clase: e.element ? (e.element.className || '').toString().slice(0, 50) : null,
        });
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__paints.push(e.name + ':' + Math.round(e.startTime));
    }).observe({ type: 'paint', buffered: true });
  });

  const page = await ctx.newPage();
  const t0 = Date.now();
  await page.goto(URL, { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(4000); // carrusel + fuentes + últimos candidatos LCP

  const out = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const recursos = performance.getEntriesByType('resource')
      .filter(r => r.initiatorType === 'script' || r.initiatorType === 'link' || r.name.includes('unsplash') || r.name.includes('/branding/'))
      .map(r => ({
        url: r.name.split('/').pop().slice(0, 44),
        tipo: r.initiatorType,
        inicioMs: Math.round(r.startTime),
        finMs: Math.round(r.responseEnd),
        kb: Math.round((r.transferSize || 0) / 1024),
      }))
      .sort((a, b) => a.inicioMs - b.inicioMs);
    return {
      ttfbMs: Math.round(nav.responseStart),
      paints: window.__paints,
      lcp: window.__lcp,
      recursos,
    };
  });
  console.log(`--- ${URL} (${FORMA}) · medición en ${Math.round((Date.now() - t0) / 1000)}s ---`);
  console.log('TTFB:', out.ttfbMs, 'ms');
  console.log('Paints:', out.paints.join(' · ') || '(ninguno)');
  console.log('Cadena LCP (candidato final = LCP):');
  for (const e of out.lcp) {
    console.log(`  ${e.ms}ms · ${e.tag} · ${e.texto || e.url || ''}`);
  }
  console.log('Orden de arranque de recursos:');
  for (const r of out.recursos) {
    console.log(`  ${String(r.inicioMs).padStart(5)}ms → ${String(r.finMs).padStart(5)}ms · ${String(r.kb).padStart(4)} kB · ${r.tipo} · ${r.url}`);
  }
  await browser.close();
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
