/**
 * Genera global.css a partir de src/theme/tokens.json.
 * Los colores se exponen como variables CSS con canales RGB para que Tailwind
 * pueda aplicar opacidad (`bg-surface/15`). Se ejecuta con `npm run theme:build`.
 */
const fs = require('node:fs');
const path = require('node:path');

const tokens = require('../src/theme/tokens.json');

function hexToChannels(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

function declarations(colors) {
  return Object.entries(colors)
    .map(([name, hex]) => `  --color-${name}: ${hexToChannels(hex)};`)
    .join('\n');
}

function buildThemeCss() {
  return `/* Generado por scripts/build-theme-css.js a partir de src/theme/tokens.json. No editar a mano. */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
${declarations(tokens.light)}
}

.dark {
${declarations(tokens.dark)}
}
`;
}

if (require.main === module) {
  fs.writeFileSync(path.join(__dirname, '..', 'global.css'), buildThemeCss());
  console.log('global.css generado');
}

module.exports = { buildThemeCss };
