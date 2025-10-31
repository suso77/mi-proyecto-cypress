// scripts/quality-gate.js
const fs = require('fs');
const path = require('path');

const FECHA = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
const SITE = (process.env.SITE_URL || 'https://www.hiexperience.es')
  .replace(/^https?:\/\//, '').replace(/\/$/, '');
const BASE = path.join('auditorias', `${FECHA}-${SITE}`);
const FILE = path.join(BASE, 'informe-accesibilidad.tsv');

const MAX_CRIT = Number(process.env.A11Y_MAX_CRITICAL ?? 0);
const MAX_SER  = Number(process.env.A11Y_MAX_SERIOUS  ?? 10);

if (!fs.existsSync(FILE)) {
  console.error('❌ No existe el informe:', FILE);
  process.exit(1);
}

const tsv = fs.readFileSync(FILE, 'utf8');
let crit = 0, ser = 0;
tsv.split('\n').slice(1).forEach(line => {
  if (!line.trim()) return;
  const cols = line.split('\t');
  const sev = (cols[8] || '').toLowerCase(); // columna "Severidad"
  if (sev.includes('crític')) crit++;
  else if (sev.includes('alta') || sev.includes('serious')) ser++;
});

console.log(`Quality Gate → critical=${crit} (max ${MAX_CRIT}), serious=${ser} (max ${MAX_SER})`);
if (crit > MAX_CRIT || ser > MAX_SER) {
  console.error('❌ Quality gate FAILED');
  process.exit(1);
}
console.log('✅ Quality gate PASSED');
