/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const {
  getWcagDisplay,
  criterionUrlFor,
  helpES,
  expectedES,
} = require('../cypress/support/wcag-map');

const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
const AUDIT_DIR_NAME  = process.env.AUDIT_DIR_NAME  || '';
const SPEC_SUBDIR     = process.env.SPEC_SUBDIR     || 'accesibilidad-sitemap.cy.js';

const CSV_MODE  = (process.env.CSV_MODE  || 'excel').toLowerCase(); // excel|sheets|tsv
const LINK_MODE = (process.env.LINK_MODE || (CSV_MODE === 'tsv' ? 'plain' : 'formula')).toLowerCase(); // formula|plain

const ensureDir = (p) => { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); };
const ensurePng = (n) => (String(n).endsWith('.png') ? n : `${n}.png`);

const clean = (txt = '') =>
  String(txt).replace(/\r?\n|\r/g,' ').replace(/\t/g,' ').replace(/\s{2,}/g,' ').replace(/"/g,'""').trim();

const CSV_SEP = CSV_MODE === 'tsv' ? '\t' : (CSV_MODE === 'sheets' ? ',' : ';');
const q = (val) => `"${String(val ?? '').replace(/"/g,'""')}"`;
const qOrCell = (val) => { const s=String(val??''); if(s.startsWith('=HYPERLINK(')) return s; if (LINK_MODE==='plain' && /^https?:\/\//i.test(s)) return s; return q(s); };

const enc = (s) => (/%[0-9A-Fa-f]{2}/.test(String(s)) ? String(s) : encodeURIComponent(String(s)));
const asPlainUrl = (url) => { try { return decodeURI(String(url)); } catch { return String(url); } };

const makeHyperlink = (url, label) => {
  if (!url) return '';
  return CSV_MODE === 'sheets' ? `=HYPERLINK("${url}","${label}")` : `=HYPERLINK("${url}";"${label}")`;
};
const makeLink = (url, label) => { if(!url) return ''; if (LINK_MODE==='plain') return asPlainUrl(url); return makeHyperlink(url,label); };

function getBaseDir() {
  const SITE_SLUG = (process.env.SITE_URL || 'https://sitio-desconocido').replace(/^https?:\/\//,'').replace(/\/$/,'');
  const FECHA = new Date().toLocaleDateString('es-ES').replace(/\//g,'-');
  return path.join('auditorias', `${FECHA}-${SITE_SLUG}`);
}
function buildScreenshotUrl(fileNamePng) {
  if (!fileNamePng) return '';
  if (!PUBLIC_BASE_URL || !AUDIT_DIR_NAME) return '';
  return `${PUBLIC_BASE_URL}/auditorias/${AUDIT_DIR_NAME}/screenshots/${enc(SPEC_SUBDIR)}/${enc(fileNamePng)}`;
}

// — Evidencia (Playwright) para el MD —
function buildEvidenceBlock(ruleId, selector, url, screenshotName) {
  const safeSel = selector && selector.trim() ? selector : '[REEMPLAZA_CON_SELECTOR]';
  const code = `// SUGERENCIA DE CÓDIGO DE CAPTURA (Playwright)
// Cubre: ${ruleId} en ${url}
import { test, expect } from '@playwright/test';
test('evidencia ${ruleId}', async ({ page }) => {
  await page.goto('${url}', { waitUntil: 'networkidle' });
  const el = page.locator(${JSON.stringify(safeSel)});
  await el.scrollIntoViewIfNeeded();
  await page.evaluate((sel) => {
    const n = document.querySelector(sel);
    if (!n) return;
    n.style.outline = '3px solid red';
    n.style.outlineOffset = '2px';
  }, ${JSON.stringify(safeSel)});
  await el.screenshot({ path: ${JSON.stringify(screenshotName || 'evidencia.png')} });
});`;
  const todo = `// TODO: [Asegurar evidencia manual]
 // Foco: selector ${safeSel}
 // Página: ${url}
 // Mostrar inequívocamente la condición que incumple "${ruleId}" (contraste, nombre accesible, etc.).`;
  return { snippet: code, todo };
}

function appendMarkdown(mdPath, row, evidence) {
  const lines = [];
  lines.push(`## ${row['ID']} — ${row['Criterio WCAG'] || row['Resumen'] || row['ID']}`);
  lines.push('');
  lines.push(`**Página:** ${row['Páginas Afectadas']}`);
  lines.push(`**Severidad:** ${row['Severidad']}`);
  lines.push(`**Regla (axe):** ${row['ID'].split('-')[0]}`);
  lines.push(`**Elemento:** \`${row['Elemento afectado']}\``);
  lines.push(`**Criterio WCAG:** ${row['Criterio WCAG']}`);
  if (row['Recomendación (W3C)']) lines.push(`**Guía W3C:** ${row['Recomendación (W3C)']}`);
  if (row['Captura de pantalla']) lines.push(`**Captura:** ${row['Captura de pantalla']}`);
  if (row['Resumen']) { lines.push(''); lines.push(`> ${row['Resumen']}`); }
  if (row['Resultado actual']) {
    lines.push(''); lines.push('**Snippet HTML / estado actual:**'); lines.push('```html');
    lines.push(String(row['Resultado actual']).slice(0,4000)); lines.push('```');
  }
  const { snippet, todo } = evidence || {};
  if (snippet) { lines.push(''); lines.push('**Sugerencia de código de captura (Playwright):**'); lines.push('```ts'); lines.push(snippet); lines.push('```'); }
  else if (todo) { lines.push(''); lines.push('**TODO de captura manual:**'); lines.push('```'); lines.push(todo); lines.push('```'); }
  lines.push('');
  fs.appendFileSync(mdPath, lines.join('\n') + '\n', 'utf8');
}

function createSaveA11yResultsTask() {
  const baseDir = getBaseDir();
  const screenshotsDir = path.join(baseDir, 'screenshots', SPEC_SUBDIR);
  ensureDir(screenshotsDir);

  const CSV_NAME   = CSV_MODE === 'tsv' ? 'informe-accesibilidad.tsv' : 'informe-accesibilidad.csv';
  const RESULT_CSV = path.join(baseDir, CSV_NAME);
  const RESULT_MD  = path.join(baseDir, 'informe-accesibilidad.md');

  if (!fs.existsSync(RESULT_CSV)) {
    const header = [
      'ID','Sistema operativo, navegador y tecnología asistiva','Resumen','Elemento afectado','Páginas Afectadas',
      'Resultado actual','Resultado esperado','Metodología de testing','Severidad','Criterio WCAG',
      'Captura de pantalla','Recomendación (W3C)','Notas',
    ].map(q).join(CSV_SEP) + '\n';
    fs.writeFileSync(RESULT_CSV, '\uFEFF' + header, 'utf8');
  }
  if (!fs.existsSync(RESULT_MD)) fs.writeFileSync(RESULT_MD, `# Informe de Accesibilidad — Evidencias\n\n`, 'utf8');

  const SEVERIDAD_ES = { minor:'Leve', moderate:'Media', serious:'Alta', critical:'Crítica' };

  return (payload={}) => {
    const { violations } = payload || {};
    if (!Array.isArray(violations) || !violations.length) return null;

    violations.forEach((v, idxV) => {
      const url           = v.url || v.nodes?.[0]?.pageUrl || '';
      const criterionText = getWcagDisplay(v.id, v.tags || []);
      const criterionUrl  = criterionUrlFor(v.id, v.tags || []);
      const resumen       = clean(helpES(v.id, v.help || v.description || v.id));
      const esperado      = clean(expectedES(v.id));
      const severidad     = SEVERIDAD_ES[v.impact] || 'Media';

      const nodes = Array.isArray(v.nodes) && v.nodes.length ? v.nodes : [ {} ];
      nodes.forEach((n, idxN) => {
        const sel    = Array.isArray(n?.target) ? n.target[0] : (n?.target || '');
        const actual = clean(n?.html || n?.failureSummary || v.resultadoActual || 'No disponible (sin fragmento HTML)');

        const shotFile = ensurePng(n?._screenshotName || v.screenshotName || `a11y-${Date.now()}-${idxV+1}.png`);
        const httpHref = buildScreenshotUrl(shotFile);
        const fileHref = `file://${path.resolve(screenshotsDir, shotFile)}`;
        const screenshotCell = makeHyperlink(httpHref || fileHref, 'Ver captura');

        const row = {
          'ID': `${v.id}-${idxN + 1}`,
          'Sistema operativo, navegador y tecnología asistiva': 'macOS + Electron (Cypress) + axe-core',
          'Resumen': resumen,
          'Elemento afectado': Array.isArray(n?.target) ? n.target.join(' ') : (n?.target || ''),
          'Páginas Afectadas': makeLink(url, 'Ver página'),
          'Resultado actual': actual,
          'Resultado esperado': esperado,
          'Metodología de testing': 'WCAG 2.1 / 2.2 AA (automatizado con axe-core)',
          'Severidad': severidad,
          'Criterio WCAG': criterionText || '—',
          'Captura de pantalla': screenshotCell,
          'Recomendación (W3C)': makeHyperlink(criterionUrl, 'Ver guía W3C'),
          'Notas': '',
        };

        const line = [
          row['ID'],row['Sistema operativo, navegador y tecnología asistiva'],row['Resumen'],row['Elemento afectado'],
          row['Páginas Afectadas'],row['Resultado actual'],row['Resultado esperado'],row['Metodología de testing'],
          row['Severidad'],row['Criterio WCAG'],row['Captura de pantalla'],row['Recomendación (W3C)'],row['Notas'],
        ].map(qOrCell).join(CSV_SEP);

        fs.appendFileSync(RESULT_CSV, line + '\n', 'utf8');

        const evidence = buildEvidenceBlock(v.id, sel, url, shotFile);
        appendMarkdown(RESULT_MD, row, evidence);
      });
    });

    console.log(`📊 Informe actualizado: ${RESULT_CSV}`);
    console.log(`📝 Evidencias MD: ${path.join(getBaseDir(), 'informe-accesibilidad.md')}`);
    return null;
  };
}

module.exports = { createSaveA11yResultsTask };










