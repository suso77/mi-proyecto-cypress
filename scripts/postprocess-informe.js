// scripts/postprocess-informe.js
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const CSV_MODE = (process.env.CSV_MODE || 'excel').toLowerCase();
const CSV_SEP  = CSV_MODE === 'tsv' ? '\t' : (CSV_MODE === 'sheets' ? ',' : ';');

function getBaseDir() {
  const SITE_SLUG = (process.env.SITE_URL || 'https://sitio-desconocido')
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
  const FECHA = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
  return path.join('auditorias', `${FECHA}-${SITE_SLUG}`);
}

(function main() {
  const baseDir = getBaseDir();
  const file = path.join(baseDir, CSV_MODE === 'tsv' ? 'informe-accesibilidad.tsv' : 'informe-accesibilidad.csv');
  if (!fs.existsSync(file)) {
    console.log('ℹ️ No hay informe que postprocesar:', file);
    return;
  }
  const raw = fs.readFileSync(file, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) {
    console.log('ℹ️ Informe vacío, sin cambios.');
    return;
  }

  // Mantener BOM + cabecera y normalizar columnas (no tocamos valores)
  const header = lines[0];
  const body   = lines.slice(1);
  const out = [header].concat(body).join('\n');
  fs.writeFileSync(file, out + '\n', 'utf8');
  console.log('✅ Postproceso finalizado.');
})();
