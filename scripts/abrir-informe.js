// scripts/abrir-informe.js
const fs = require('fs');
const path = require('path');
const child = require('child_process');

const SITE_SLUG = (process.env.SITE_URL || 'https://sitio-desconocido')
  .replace(/^https?:\/\//, '')
  .replace(/\/$/, '');
const FECHA = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
const BASE_DIR = path.join('auditorias', `${FECHA}-${SITE_SLUG}`);

const TSV = path.join(BASE_DIR, 'informe-accesibilidad.tsv');
const CSV = path.join(BASE_DIR, 'informe-accesibilidad.csv');

const file = fs.existsSync(TSV) ? TSV : (fs.existsSync(CSV) ? CSV : null);
if (!file) {
  console.log('ℹ️ No se encontró informe para abrir.');
  process.exit(0);
}

const openCmd = process.platform === 'darwin'
  ? (p) => child.spawn('open', [p], { stdio: 'ignore', detached: true })
  : process.platform === 'win32'
    ? (p) => child.spawn('cmd', ['/c', 'start', '', p], { stdio: 'ignore', detached: true })
    : (p) => child.spawn('xdg-open', [p], { stdio: 'ignore', detached: true });

openCmd(file);
console.log('📄 Abriendo informe:', file);











