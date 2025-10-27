// scripts/limpiar-auditoria.js
// Elimina el CSV/TSV del día para empezar limpio (no toca capturas previas)
const fs = require('fs');
const path = require('path');

const SITE = (process.env.SITE_URL || 'https://sitio-desconocido')
  .replace(/^https?:\/\//, '')
  .replace(/\/$/, '');
const FECHA = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
const BASE_DIR = path.join('auditorias', `${FECHA}-${SITE}`);

const CSV_MODE = (process.env.CSV_MODE || 'excel').toLowerCase();
const CSV_NAME = CSV_MODE === 'tsv' ? 'informe-accesibilidad.tsv' : 'informe-accesibilidad.csv';
const RESULT_FILE = path.join(BASE_DIR, CSV_NAME);

try {
  if (fs.existsSync(RESULT_FILE)) {
    fs.unlinkSync(RESULT_FILE);
    console.log(`🧹 Eliminado: ${RESULT_FILE}`);
  } else {
    console.log(`ℹ️ No había informe previo que eliminar en: ${BASE_DIR}`);
  }
} catch (e) {
  console.log('⚠️ No se pudo eliminar informe previo:', e.message);
}







