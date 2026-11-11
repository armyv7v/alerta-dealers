/* Corre la matriz de escaneos QA sobre las 5 apps: spawns scan.js por caso. */
const { spawnSync } = require('child_process');
const fs = require('fs');

const CASES = [
  // ---- main (5173) ----
  { name: 'main-landing-m', url: 'http://localhost:5173/', w: 375, h: 812 },
  { name: 'main-landing-d', url: 'http://localhost:5173/', w: 1440, h: 900 },
  { name: 'main-panel-m', url: 'http://localhost:5173/', w: 375, h: 812, actions: [{ click: 'Acceso a la Red' }, { wait: 900 }, { click: 'Acceso Operador' }, { wait: 2500 }] },
  { name: 'main-panel-d', url: 'http://localhost:5173/', w: 1440, h: 900, actions: [{ click: 'Acceso a la Red' }, { wait: 900 }, { click: 'Acceso Operador' }, { wait: 2500 }] },
  { name: 'main-form-m', url: 'http://localhost:5173/', w: 375, h: 812, actions: [{ click: 'Acceso a la Red' }, { wait: 900 }, { click: 'Acceso Operador' }, { wait: 2500 }, { click: 'Alerta de Seguridad' }, { wait: 1500 }] },
  { name: 'main-feed-d', url: 'http://localhost:5173/', w: 1440, h: 900, actions: [{ click: 'Acceso a la Red' }, { wait: 900 }, { click: 'Acceso Operador' }, { wait: 2500 }, { click: 'Feed' }, { wait: 1800 }] },
  { name: 'main-flash-m', url: 'http://localhost:5173/', w: 375, h: 812, actions: [{ click: 'Acceso a la Red' }, { wait: 900 }, { click: 'Acceso Operador' }, { wait: 2500 }, { click: 'Alerta' }, { wait: 1800 }] },
  { name: 'main-admin-d', url: 'http://localhost:5173/', w: 1440, h: 900, actions: [{ click: 'Acceso a la Red' }, { wait: 900 }, { click: 'Acceso Administrador' }, { wait: 2500 }] },
  // ---- variantes ----
  ...['operations-5174', 'badge-5175', 'integration-5176', 'sheet-5177'].flatMap(tag => {
    const port = tag.split('-')[1];
    return [
      { name: `v-${tag}-landing-m`, url: `http://localhost:${port}/`, w: 375, h: 812 },
      { name: `v-${tag}-landing-d`, url: `http://localhost:${port}/`, w: 1440, h: 900 },
      { name: `v-${tag}-panel-d`, url: `http://localhost:${port}/`, w: 1440, h: 900, actions: [{ click: 'Acceso a la Red' }, { wait: 900 }, { click: 'Acceso Operador' }, { wait: 2500 }] },
    ];
  }),
];

for (const c of CASES) {
  const args = ['scan.js', c.url, String(c.w), String(c.h), `out/${c.name}.json`, `shots/${c.name}.png`];
  if (c.actions) args.push(JSON.stringify(c.actions));
  const r = spawnSync('node', args, { cwd: __dirname, encoding: 'utf8', timeout: 120000 });
  const out = (r.stdout || '').trim();
  console.log(out || `ERR ${c.name}: ${(r.stderr || '').trim().slice(0, 120)}`);
}
console.log('MATRIZ COMPLETA');
