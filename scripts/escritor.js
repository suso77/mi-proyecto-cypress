// scripts/escritor.js
const fs = require('fs');
const path = require('path');

const { getWcagForRule, helpES, expectedES } = require('../cypress/support/wcag-map');

// ==========================================
// Entorno de auditoría (coherente con cypress.config.js)
// ==========================================
const SITE_SLUG = (process.env.SITE_URL || 'https://sitio-desconocido')
  .replace(/^https?:\/\//, '')
  .replace(/\/$/, '');
const FECHA = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
const BASE_DIR = path.join('auditorias', `${FECHA}-${SITE_SLUG}`);
const SPEC_SUBDIR = 'accesibilidad-sitemap.cy.js';
const SCREENSHOTS_DIR = path.join(BASE_DIR, 'screenshots');

// Expuesto por cypress.config.js (por si generas URL pública)
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
const AUDIT_DIR_NAME  = process.env.AUDIT_DIR_NAME || `${FECHA}-${SITE_SLUG}`;

// ==========================================
// Modos CSV / Links
// ==========================================
const CSV_MODE  = (process.env.CSV_MODE || 'excel').toLowerCase();           // excel | sheets | tsv
const CSV_SEP   = CSV_MODE === 'tsv' ? '\t' : (CSV_MODE === 'sheets' ? ',' : ';');
const LINK_MODE = (process.env.LINK_MODE || (CSV_MODE === 'tsv' ? 'plain' : 'formula')).toLowerCase(); // plain | formula

const ensureDir = (p) => { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); };
const ensurePng = (n) => (String(n).endsWith('.png') ? n : `${n}.png`);

// Escapado de celdas (CSV/TSV)
const clean = (txt = '') =>
  String(txt)
    .replace(/\r?\n|\r/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/"/g, '""')
    .trim();

const q = (val) => `"${clean(val)}"`;

// No encerrar fórmulas ni URLs planas
const qOrCell = (val) => {
  const s = String(val ?? '');
  if (s.startsWith('=HYPERLINK(')) return s;
  if (LINK_MODE === 'plain' && /^https?:\/\//i.test(s)) return s;
  return q(s);
};

// Contar columnas (debug)
function countCsvCols(line, sep = CSV_SEP) {
  if (sep === '\t') return line.split('\t').length;
  let inQuotes = false, parenDepth = 0, cols = 1;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { i++; continue; }
      inQuotes = !inQuotes; continue;
    }
    if (!inQuotes) {
      if (ch === '(') { parenDepth++; continue; }
      if (ch === ')') { if (parenDepth > 0) parenDepth--; continue; }
      if (ch === sep && parenDepth === 0) cols++;
    }
  }
  return cols;
}

const asPlainUrl = (url) => { try { return decodeURI(String(url)); } catch { return String(url); } };
const enc = (s) => (/%[0-9A-Fa-f]{2}/.test(String(s)) ? String(s) : encodeURIComponent(String(s)));

// Link según modo
const makeLink = (url, label) => {
  if (!url) return '';
  if (LINK_MODE === 'plain') return asPlainUrl(url);
  return CSV_MODE === 'sheets'
    ? `=HYPERLINK("${url}","${label}")`
    : `=HYPERLINK("${url}";"${label}")`;
};

// ==========================================
// Helpers específicos
// ==========================================

// Tag WCAG específico (111, 131, 244, 1411, …); ignora wcag2a, wcag21aa, etc.
function pickSpecificWcagTag(tags = []) {
  const arr = Array.isArray(tags) ? tags.map(t => String(t).toLowerCase()) : [];
  return arr.find(t => /^wcag\d{3,4}$/.test(t)) || ''; // 3-4 dígitos
}

// Construye URL pública o file:// a la captura
function buildScreenshotHref(baseNamePng) {
  const fileName = ensurePng(baseNamePng || 'a11y');
  const abs = path.resolve(SCREENSHOTS_DIR, SPEC_SUBDIR, fileName);
  const prefix = PUBLIC_BASE_URL
    ? (/\/auditorias$/.test(PUBLIC_BASE_URL) ? PUBLIC_BASE_URL : `${PUBLIC_BASE_URL}/auditorias`)
    : null;

  return prefix
    ? `${prefix}/${enc(AUDIT_DIR_NAME)}/screenshots/${enc(SPEC_SUBDIR)}/${enc(fileName)}`
    : `file://${abs}`;
}

// ==========================================
// Task factory
// ==========================================
function createSaveA11yResultsTask(config) {
  return function saveA11yResults(payload = {}) {
    const { violations } = payload || {};
    if (!Array.isArray(violations) || violations.length === 0) {
      console.log('🛡️ saveA11yResults: 0 violaciones -> no se escribe fichero.');
      return null;
    }
    const effective = violations.filter(v => v && typeof v === 'object' && v.id && v.id !== 'sin-violaciones');
    if (effective.length === 0) {
      console.log('🛡️ Sólo registros informativos/sin-violaciones -> no se escribe fichero.');
      return null;
    }

    ensureDir(path.join(SCREENSHOTS_DIR, SPEC_SUBDIR));

    const CSV_NAME    = CSV_MODE === 'tsv' ? 'informe-accesibilidad.tsv' : 'informe-accesibilidad.csv';
    const RESULT_FILE = path.join(BASE_DIR, CSV_NAME);

    // Cabecera (13 columnas)
    if (!fs.existsSync(RESULT_FILE)) {
      const header = [
        'ID',
        'Sistema operativo, navegador y tecnología asistiva',
        'Resumen',
        'Elemento afectado',
        'Páginas Afectadas',
        'Resultado actual',
        'Resultado esperado',
        'Metodología de testing',
        'Severidad',
        'Criterio WCAG',
        'Captura de pantalla',
        'Recomendación (W3C)',
        'Notas',
      ].map(q).join(CSV_SEP) + '\n';
      // BOM para Excel
      fs.writeFileSync(RESULT_FILE, '\uFEFF' + header, 'utf8');
    }

    const SEVERIDAD_ES = { minor: 'Leve', moderate: 'Media', serious: 'Alta', critical: 'Crítica' };
    let wroteFirst = false;

    effective.forEach((v, idx) => {
      // --- 1) WCAG concreto ---
      const tagEspecifico = pickSpecificWcagTag(v.tags);
      const wcag = getWcagForRule(v.id, tagEspecifico); // -> { code:'1.3.1', title:'Información y relaciones', url:'...' } | null

      const criterioNombre = wcag ? `${wcag.code} ${wcag.title}` : 'Criterio WCAG no identificado';
      const criterioUrl    = wcag ? wcag.url : 'https://www.w3.org/WAI/WCAG21/Understanding/overview.html';

      // --- 2) Textos ES (Resumen / Esperado) ---
      const resumen  = clean(v.helpES || helpES(v.id, v.help) || v.help || v.description || v.id);
      const esperado = clean(v.resultadoEsperadoES || expectedES(v.id) || v.help || `Debe cumplir el criterio: ${criterioNombre}`);

      // --- 3) Campos varios ---
      const url       = v.url || '';
      const elemento  = clean(v.elementoAfectado || 'No identificado');
      const severidad = SEVERIDAD_ES[v.impact] || 'Media';

      // Resultado actual
      const actual =
        clean(v.resultadoActualES || v.resultadoActual) ||
        clean(v.nodes?.[0]?.html) ||
        clean(v.nodes?.[0]?.failureSummary) ||
        'No disponible (sin fragmento HTML)';

      // --- 4) Captura: usa la que venga o constrúyela ---
      const screenshotName = ensurePng(v.screenshotName || `a11y-${Date.now()}-${idx + 1}`);
      const screenshotHref = buildScreenshotHref(screenshotName);

      // --- 5) Celdas (con modo enlaces correcto) ---
      const cellPagina     = makeLink(url, 'Ver página');
      const cellScreenshot = makeLink(screenshotHref, 'Ver captura');
      const cellGuia       = makeLink(criterioUrl, 'Ver guía W3C'); // 🔗 siempre al WCAG concreto

      const fields = [
        `${v.id}-${idx + 1}`,
        'macOS + Electron (Cypress) + axe-core',
        resumen,
        elemento,
        cellPagina,
        actual,
        esperado,
        'WCAG 2.1 / 2.2 AA (automatizado con axe-core)',
        severidad,
        criterioNombre,   // p. ej., "1.3.1 Información y relaciones"
        cellScreenshot,
        cellGuia,         // 🔗 criterio WCAG
        '',
      ];

      const line = fields.map(qOrCell).join(CSV_SEP);
      fs.appendFileSync(RESULT_FILE, line + '\n', 'utf8');

      if (!wroteFirst) {
        const cols = countCsvCols(line, CSV_SEP);
        console.log(`🧪 Primera fila: ${cols} columnas (esperadas 13) — modo=${CSV_MODE}, links=${LINK_MODE}`);
        wroteFirst = true;
      }
    });

    console.log(`📊 ${effective.length} violaciones registradas en ${path.join(BASE_DIR, CSV_NAME)}`);
    return null;
  };
}

module.exports = { createSaveA11yResultsTask };




