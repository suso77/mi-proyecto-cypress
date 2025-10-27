// cypress.config.cjs
const { defineConfig } = require('cypress');
const fs   = require('fs');
const path = require('path');
const axios = require('axios');
const https = require('https');
const crypto = require('crypto');
const { parseStringPromise } = require('xml2js');

// ====== Helpers ======
const hash8 = (s) => crypto.createHash('md5').update(String(s || '')).digest('hex').slice(0, 8);

// ===== I18N opcional (carga todo + helpers de fallback) =====
let AXE_I18N = {};
let makeEsForRule = null;
let autoTranslateEnToEs = null;
try {
  const i18n = require('./cypress/support/axe-i18n');
  AXE_I18N = i18n.AXE_I18N || {};
  makeEsForRule = i18n.makeEsForRule || null;
  autoTranslateEnToEs = i18n.autoTranslateEnToEs || null;
} catch (_) { /* noop */ }

// ===== Mapas WCAG (si los tienes) =====
let WCAG_MAP = {};
let AXE_RULE_TO_WCAG = {};
try {
  ({ WCAG_MAP, AXE_RULE_TO_WCAG } = require('./cypress/support/wcag-map'));
} catch (_) { /* noop */ }

// ===== Directorios base de informe =====
const SITE_SLUG = (process.env.SITE_URL || 'https://sitio-desconocido')
  .replace(/^https?:\/\//, '')
  .replace(/\/$/, '');
const FECHA   = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
const BASE_DIR = path.join('auditorias', `${FECHA}-${SITE_SLUG}`);

// El spec que hace capturas
const SPEC_SUBDIR = 'accesibilidad-sitemap.cy.js';

// Carpeta final de screenshots
const SCREENSHOTS_DIR = path.join(BASE_DIR, 'screenshots');

// ===== CSV / enlaces =====
const CSV_MODE = (process.env.CSV_MODE || 'tsv').toLowerCase(); // tsv | sheets | excel
const CSV_SEP  = CSV_MODE === 'tsv' ? '\t' : (CSV_MODE === 'sheets' ? ',' : ';');
const LINK_MODE = (process.env.LINK_MODE || 'plain').toLowerCase(); // plain | formula

const ensureDir = (p) => { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); };
const ensurePng = (n) => (String(n).endsWith('.png') ? n : `${n}.png`);

const q = (val) => {
  let s = val == null ? '' : String(val);
  s = s.replace(/\r?\n|\r/g, ' ')
       .replace(/\t/g, ' ')
       .replace(/\s{2,}/g, ' ')
       .trim()
       .replace(/"/g, '""');
  return `"${s}"`;
};
const clean = (txt = '') =>
  String(txt)
    .replace(/\r?\n|\r/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/"/g, '""')
    .trim();

const enc = (s) => (/%[0-9A-Fa-f]{2}/.test(String(s)) ? String(s) : encodeURIComponent(String(s)));
const asPlainUrl = (url) => { try { return decodeURI(String(url)); } catch { return String(url); } };

// HYPERLINK universal (usamos siempre fórmula en capturas)
const makeHyperlink = (url, text = 'Ver Captura') => {
  const u = String(url || '');
  const t = String(text || 'Ver Captura');
  if (!u) return q('');
  return CSV_MODE === 'sheets'
    ? `=HYPERLINK("${u}","${t}")`
    : `=HYPERLINK("${u}";"${t}")`;
};

const qOrCell = (val) => {
  const s = String(val ?? '');
  if (s.startsWith('=HYPERLINK(')) return s;
  if (LINK_MODE === 'plain' && /^https?:\/\//i.test(s)) return s; // URL cruda
  return q(s);
};

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

/* ============== SITEMAP ============== */
async function fetchSitemapUrls(opts = {}) {
  const {
    recursive = true,
    maxUrls = Number(process.env.A11Y_MAX_URLS || 5000),
  } = opts || {};

  const site = process.env.SITE_URL;
  if (!site) {
    console.error('❌ fetchSitemapUrls: falta SITE_URL en el entorno.');
    return [];
  }

  const root = new URL(site);
  const sameHost = (u) => {
    try { return new URL(u).host === root.host; } catch { return false; }
  };

  const incPatterns = String(process.env.A11Y_INCLUDE || '')
    .split(',').map(s => s.trim()).filter(Boolean)
    .map(s => new RegExp(s, 'i'));

  const excPatterns = String(process.env.A11Y_EXCLUDE || '')
    .split(',').map(s => s.trim()).filter(Boolean)
    .map(s => new RegExp(s, 'i'));

  const includeOk = (u) => incPatterns.length === 0 || incPatterns.some(r => r.test(u));
  const excludeOk = (u) => excPatterns.length === 0 || !excPatterns.some(r => r.test(u));

  const agent = new https.Agent({ rejectUnauthorized: false });

  async function fetchXml(url) {
    const res = await axios.get(url, { httpsAgent: agent, timeout: 20000 });
    return res.data;
  }

  async function parseXml(xml) {
    try { return await parseStringPromise(xml); } catch { return null; }
  }

  function extractLocsFromParsed(parsed) {
    return parsed?.urlset?.url?.map(u => u.loc?.[0]).filter(Boolean) || [];
  }
  function extractChildrenFromParsed(parsed) {
    return parsed?.sitemapindex?.sitemap?.map(s => s.loc?.[0]).filter(Boolean) || [];
  }

  function normalize(u) {
    try {
      const x = new URL(u);
      x.hostname = x.hostname.toLowerCase();
      x.hash = '';
      if (x.pathname !== '/' && x.pathname.endsWith('/')) x.pathname = x.pathname.slice(0, -1);
      if (/\/index\.html?$/i.test(x.pathname)) x.pathname = x.pathname.replace(/\/index\.html?$/i, '') || '/';
      return x.toString();
    } catch { return u; }
  }

  const seenXml = new Set();
  const out = new Set();

  async function walk(xmlUrl) {
    if (seenXml.has(xmlUrl) || out.size >= maxUrls) return;
    seenXml.add(xmlUrl);

    let xml;
    try { xml = await fetchXml(xmlUrl); }
    catch (e) { console.warn('⚠️ No se pudo leer XML:', xmlUrl, e.message); return; }

    const parsed = await parseXml(xml);
    if (!parsed) return;

    const children = extractChildrenFromParsed(parsed);
    if (children.length > 0 && recursive) {
      for (const child of children) {
        if (out.size >= maxUrls) break;
        await walk(child);
      }
    } else {
      const locs = extractLocsFromParsed(parsed);
      for (const u of locs) {
        if (out.size >= maxUrls) break;
        const nu = normalize(u);
        if (sameHost(nu) && includeOk(nu) && excludeOk(nu)) out.add(nu);
      }
    }
  }

  const rootSitemap = new URL('/sitemap.xml', root).toString();
  console.log('📥 Leyendo sitemap raíz:', rootSitemap);
  await walk(rootSitemap);

  const urls = Array.from(out);
  console.log(`✅ fetchSitemapUrls: ${urls.length} URLs finales (host=${root.host}).`);
  return urls;
}

/* ============== TEXTO EN ESPAÑOL (Resultado actual) ============== */
const RULE_ES = {
  // fallback de alta prioridad solo para algunas reglas clave si falla i18n
  'landmark-unique': 'Los landmarks deben tener una combinación única de rol y nombre accesible.',
  'heading-order'  : 'Los niveles de encabezado deben aumentar de uno en uno, sin saltos.',
  'color-contrast' : 'El texto no alcanza el contraste mínimo requerido.',
  'link-name'      : 'Los enlaces deben tener un nombre accesible que describe su propósito.',
  'image-alt'      : 'Las imágenes significativas deben tener texto alternativo adecuado.',
  'frame-title'    : 'Los iframes deben tener un título que describa su contenido.',
  'aria-allowed-role': 'Se ha usado un rol ARIA no permitido para ese elemento.',
  'empty-heading'  : 'Existe un encabezado sin texto.',
};

function buildResultadoActualES(v) {
  // 1) Preferimos i18n curado
  const fromI18n = AXE_I18N[v.id]?.resumen;
  // 2) Plantillas por patrón (cubre “todas”)
  const fromTemplate = makeEsForRule ? makeEsForRule(v.id, v.help || v.description) : null;
  // 3) Fallback local
  const fromLocal = RULE_ES[v.id];
  // 4) Último recurso: traducir help EN→ES
  const fromAuto  = autoTranslateEnToEs ? autoTranslateEnToEs(v.help || v.description || '') : '';

  const baseES = clean(
    v.resultadoActualES ||
    fromI18n ||
    (fromTemplate && fromTemplate.resumen) ||
    fromLocal ||
    fromAuto ||
    `Incumplimiento detectado en la regla ${v.id}.`
  );

  const fragmentHtml = clean(
    v.nodes?.[0]?.html ||
    v.nodes?.[0]?.failureSummary ||
    ''
  );

  const selector = clean(v.selector || v.nodes?.[0]?.target?.[0] || '');

  const parts = [];
  parts.push(baseES);
  if (selector) parts.push(`Selector: ${selector}`);
  if (fragmentHtml) parts.push(`HTML: ${fragmentHtml}`);

  return parts.join(' — ');
}

/* ============== GUARDAR RESULTADOS (13 columnas) ============== */
function saveA11yResults(payload = {}) {
  const { violations } = payload || {};
  if (!Array.isArray(violations) || violations.length === 0) return null;

  const effective = violations.filter(v => v && typeof v === 'object' && v.id && v.id !== 'sin-violaciones');
  if (effective.length === 0) return null;

  const SEVERIDAD_ES = { minor: 'Leve', moderate: 'Media', serious: 'Alta', critical: 'Crítica' };

  const CSV_NAME   = CSV_MODE === 'tsv' ? 'informe-accesibilidad.tsv' : 'informe-accesibilidad.csv';
  const RESULT_FILE = path.join(BASE_DIR, CSV_NAME);
  ensureDir(path.join(SCREENSHOTS_DIR, SPEC_SUBDIR));

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
    fs.writeFileSync(RESULT_FILE, '\uFEFF' + header, 'utf8');
  }

  const publicBase = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
  const forceFile  = String(process.env.FORCE_FILE_LINKS || '').trim() === '1';

  let wroteFirst = false;

  effective.forEach((v, idx) => {
    // Criterio + enlace (si hay mapas)
    let criterio = v.criterio || null;
    let enlace   = v.enlace   || null;
    if (!criterio || !enlace) {
      const tags = Array.isArray(v.tags) ? v.tags.map(t => String(t).toLowerCase()) : [];
      const criterionTag = tags.find(t => /^wcag\d{3,4}$/.test(t)) || null;
      if (criterionTag && WCAG_MAP[criterionTag]) {
        if (!criterio) criterio = WCAG_MAP[criterionTag][0];
        if (!enlace)   enlace   = WCAG_MAP[criterionTag][1];
      } else if (AXE_RULE_TO_WCAG[v.id]) {
        if (!criterio) criterio = AXE_RULE_TO_WCAG[v.id][0];
        if (!enlace)   enlace   = AXE_RULE_TO_WCAG[v.id][1];
      }
    }
    criterio = criterio || 'Criterio WCAG no identificado';
    enlace   = enlace   || 'https://www.w3.org/WAI/WCAG21/Understanding/overview.html';

    const i18n = AXE_I18N[v.id] || null;

    const resumen =
      (i18n && i18n.resumen) ||
      clean(v.helpES || v.help || v.description || v.id);

    const esperado =
      (i18n && i18n.esperado) ||
      (makeEsForRule ? makeEsForRule(v.id).esperado : null) ||
      clean(v.resultadoEsperadoES || v.resultadoEsperado) ||
      clean(v.helpES || v.help) ||
      `Debe cumplir el criterio: ${criterio}. Consulta la guía en ${enlace}`;

    const resultadoActualES = buildResultadoActualES(v);

    const severidad = SEVERIDAD_ES[v.impact] || 'Media';
    const screenshotName = ensurePng(v.screenshotName || `a11y-${Date.now()}-${idx + 1}`);

    // Prefijo público (si lo hay) sin duplicar /auditorias
    const prefix = (!forceFile && publicBase)
      ? (/\/auditorias$/.test(publicBase) ? publicBase : `${publicBase}/auditorias`)
      : null;

    const screenshotAbs  = path.resolve(SCREENSHOTS_DIR, SPEC_SUBDIR, screenshotName);
    const screenshotHref = prefix
      ? `${prefix}/${FECHA}-${SITE_SLUG}/screenshots/${enc(SPEC_SUBDIR)}/${enc(screenshotName)}`
      : `file://${screenshotAbs}`;

    const cellPagina     = LINK_MODE === 'formula' ? (CSV_MODE === 'sheets'
      ? `=HYPERLINK("${v.url || ''}","Abrir")` : `=HYPERLINK("${v.url || ''}";"Abrir")`) : asPlainUrl(v.url || '');

    // *** SIEMPRE enlace corto "Ver Captura" ***
    const cellScreenshot = makeHyperlink(screenshotHref, 'Ver Captura');

    const cellGuia       = LINK_MODE === 'formula'
      ? (CSV_MODE === 'sheets' ? `=HYPERLINK("${enlace}","Ver guía")` : `=HYPERLINK("${enlace}";"Ver guía")`)
      : asPlainUrl(enlace);

    // ID visible: ocultar hash de selector vacío (-d41d8cd9)
    const urlHash = hash8(v.url || '');
    const selHash = hash8(v.selector || '');
    const internalId = `${v.id}-${urlHash}-${selHash}`;
    const displayId  = selHash === 'd41d8cd9' ? `${v.id}-${urlHash}` : internalId;

    const fields = [
      displayId,
      'macOS + Electron (Cypress) + axe-core',
      resumen,
      clean(v.elementoAfectado || 'No identificado'),
      cellPagina,
      resultadoActualES,
      esperado,
      'WCAG 2.1 / 2.2 AA (automatizado con axe-core)',
      severidad,
      criterio,
      cellScreenshot,
      cellGuia,
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
}

module.exports = defineConfig({
  // Timeout global para cy.task (sitemaps grandes)
  taskTimeout: 600000,

  // Carpeta de capturas
  screenshotsFolder: SCREENSHOTS_DIR,

  // Timeouts globales
  defaultCommandTimeout: 60000,
  pageLoadTimeout: 300000,

  // === E2E ===
  e2e: {
    setupNodeEvents(on, config) {
      on('before:run', () => {
        ensureDir(path.join(SCREENSHOTS_DIR, SPEC_SUBDIR));
        console.log('📂 screenshotsFolder:', path.resolve(SCREENSHOTS_DIR));
      });

      on('before:browser:launch', (browser = {}, launchOptions) => {
        if (browser.name === 'electron' || browser.name === 'chrome') {
          launchOptions.args.push('--disable-web-security');
          launchOptions.args.push('--allow-file-access-from-files');
          launchOptions.args.push('--disable-site-isolation-trials');
          launchOptions.args.push('--disable-features=NetworkService');
          launchOptions.args.push('--ignore-certificate-errors');
          console.log(`🔓 ${browser.name} configurado para permitir win.eval(axeSource)`);
        }
        return launchOptions;
      });

      on('task', {
        fetchSitemapUrls,
        saveA11yResults,
        resetTodayReport() {
          const CSV_NAME = CSV_MODE === 'tsv' ? 'informe-accesibilidad.tsv' : 'informe-accesibilidad.csv';
          const RESULT_FILE = path.join(BASE_DIR, CSV_NAME);
          if (fs.existsSync(RESULT_FILE)) {
            fs.unlinkSync(RESULT_FILE);
            console.log(`🧹 ${CSV_NAME} eliminado: ${RESULT_FILE}`);
          } else {
            console.log('🧹 No había informe previo que eliminar.');
          }
          return null;
        },
        log(obj) { console.dir(obj, { depth: null }); return null; },
      });

      // Exponer env
      config.env.SITE_URL = process.env.SITE_URL || config.env.SITE_URL;
      config.env.PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || config.env.PUBLIC_BASE_URL;
      console.log('🌍 SITE_URL:', config.env.SITE_URL);
      console.log('📂 PUBLIC_BASE_URL:', config.env.PUBLIC_BASE_URL);
      return config;
    },

    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',

    baseUrl: process.env.SITE_URL || 'https://www.hiexperience.es',
    viewportWidth: 1440,
    viewportHeight: 900,
    video: false,
    screenshotOnRunFailure: true,
    retries: 0,
  },

  fixturesFolder: 'cypress/fixtures',
  downloadsFolder: 'cypress/downloads',
});



















