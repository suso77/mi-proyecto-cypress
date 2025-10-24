// scripts/evidence.js
// Genera evidencia accionable por violación: código de captura (preferido) o TODO descriptivo.

const MAX_SELECTOR_LEN = 450;

function firstGoodSelector(n) {
  const raw = Array.isArray(n?.target) ? n.target : (n?.target ? [n.target] : []);
  const cleaned = raw.map(String).map(s => s.trim()).filter(Boolean);
  const candidates = cleaned.sort((a, b) => a.length - b.length);
  const cssish = candidates.find(s => !s.startsWith('/') && s.length <= MAX_SELECTOR_LEN);
  return cssish || candidates[0] || '';
}

function shortHtml(html = '') {
  const s = String(html).replace(/\s+/g, ' ').trim();
  return s.length > 400 ? s.slice(0, 400) + '…' : s;
}

function ruleSummary(ruleId = '') {
  const map = {
    'color-contrast': 'Contraste de texto insuficiente respecto al fondo.',
    'non-text-contrast': 'Contraste insuficiente en componentes no textuales.',
    'link-name': 'Enlace sin nombre accesible claro.',
    'heading-order': 'Orden de encabezados incoherente.',
    'document-title': 'La página carece de título descriptivo.',
    'frame-title': 'Iframe sin título que describa su contenido.',
  };
  return map[ruleId] || 'Regla de accesibilidad incumplida según axe-core.';
}

function makeCypressSnippet(selector, fileBase = 'evidencia-violacion') {
  return `// SUGERENCIA DE CÓDIGO (Cypress)
cy.get(${JSON.stringify(selector)})
  .scrollIntoView()
  .then($el => { $el[0].style.outline = '3px solid red'; $el[0].style.outlineOffset = '2px'; })
  .screenshot(${JSON.stringify(fileBase + '-elemento')});
cy.screenshot(${JSON.stringify(fileBase + '-viewport')});`;
}

function makePlaywrightSnippet(selector, fileBase = 'evidencia-violacion') {
  return `// SUGERENCIA DE CÓDIGO (Playwright)
await page.locator(${JSON.stringify(selector)}).scrollIntoViewIfNeeded();
await page.evaluate((sel) => {
  const el = document.querySelector(sel);
  if (el) { el.style.outline = '3px solid red'; el.style.outlineOffset = '2px'; }
}, ${JSON.stringify(selector)});
await page.locator(${JSON.stringify(selector)}).screenshot({ path: ${JSON.stringify(fileBase + '-elemento.png')} });
await page.screenshot({ path: ${JSON.stringify(fileBase + '-viewport.png')} });`;
}

function makeTodo(selector, htmlFrag, wcagText) {
  const selTxt = selector ? `Usa el selector ${selector}` : 'Identifica un selector robusto del elemento problemático';
  const wcagMsg = wcagText ? ` y que evidencie el incumplimiento de “${wcagText}”` : '';
  return `// TODO: [Asegurar evidencia manual]
/*
  Toma una captura centrada en el elemento violatorio.
  ${selTxt} para enfocarlo${wcagMsg}.
  Incluye en la imagen el fragmento visible que pruebe la violación.
  Fragmento HTML de referencia (recortado):
  ${shortHtml(htmlFrag || '')}
*/`;
}

/**
 * buildEvidenceBlock(v, n, opts)
 * v: violación axe
 * n: nodo (v.nodes[i])
 * opts: { index, url, wcagText, driver, filePrefix }
 */
function buildEvidenceBlock(v, n, opts = {}) {
  const selector = firstGoodSelector(n);
  const desc = v.help || v.description || ruleSummary(v.id || '');
  const i = Number.isFinite(opts.index) ? opts.index : 1;
  const filePrefix = (opts.filePrefix || 'evidencia') + `-${i}`;
  const driver = (opts.driver || process.env.EVIDENCE_DRIVER || 'cypress').toLowerCase();
  const wcagText = opts.wcagText || '';

  const canAutomate = !!selector && !selector.startsWith('/') && selector.length <= MAX_SELECTOR_LEN;

  const evidencia = canAutomate
    ? (driver === 'playwright'
        ? makePlaywrightSnippet(selector, filePrefix)
        : makeCypressSnippet(selector, filePrefix))
    : makeTodo(selector, n?.html || n?.failureSummary || '', wcagText);

  return {
    regla: v.id || 'axe-rule',
    selector,
    descripcion: desc,
    evidencia,
  };
}

module.exports = { buildEvidenceBlock };
