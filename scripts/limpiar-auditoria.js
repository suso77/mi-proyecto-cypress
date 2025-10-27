// scripts/limpiar-auditoria.js
const fs = require('fs');
const path = require('path');

const SITE_SLUG = (process.env.SITE_URL || 'https://sitio-desconocido')
  .replace(/^https?:\/\//, '')
  .replace(/\/$/, '');
const FECHA = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
const BASE_DIR = path.join('auditorias', `${FECHA}-${SITE_SLUG}`);

const CSV = path.join(BASE_DIR, 'informe-accesibilidad.csv');
const TSV = path.join(BASE_DIR, 'informe-accesibilidad.tsv');

function rmIf(p) { if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true }); }

if (process.argv.includes('--pre')) {
  if (fs.existsSync(CSV)) { fs.unlinkSync(CSV); console.log('🧹 Eliminado:', CSV); }
  else if (fs.existsSync(TSV)) { fs.unlinkSync(TSV); console.log('🧹 Eliminado:', TSV); }
  else console.log('ℹ️ No había informe previo que eliminar en:', BASE_DIR);
} else {
  // post: nada agresivo
}








