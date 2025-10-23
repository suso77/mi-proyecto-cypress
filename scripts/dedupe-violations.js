// scripts/dedupe-violations.js
// Dedupe por (URL normalizada + Regla + snippet normalizado) y ordena por
// Severidad → WCAG → URL → Regla. Incluye helpers de normalización.

const TRACKING_PARAMS = new Set([
  'utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','fbclid','mc_cid','mc_eid'
]);

const SEVERITY_ORDER = { critical: 0, serious: 1, alta: 1, high: 1, media: 2, moderate: 2, minor: 3, baja: 3, low: 3, unknown: 4 };

function normalizeUrl(raw) {
  try {
    const u = new URL(String(raw).trim());
    u.hash = '';
    // limpia query de tracking
    const kept = [];
    u.searchParams.forEach((v, k) => {
      if (!TRACKING_PARAMS.has(k.toLowerCase())) kept.push([k, v]);
    });
    u.search = '';
    kept.forEach(([k, v]) => u.searchParams.append(k, v));
    // trailing slash sólo en raíz
    if (u.pathname !== '/' && u.pathname.endsWith('/')) {
      u.pathname = u.pathname.replace(/\/+$/, '');
    }
    return u.toString();
  } catch {
    return String(raw || '').trim();
  }
}

function stripHtml(input = '') {
  return String(input)
    .replace(/<\s*script[\s\S]*?<\/\s*script\s*>/gi, '')
    .replace(/<\s*style[\s\S]*?<\/\s*style\s*>/gi, '')
    .replace(/<[^>]*>/g, '');
}

function normalizeSnippet(snippet) {
  const t = stripHtml(snippet)
    .toLowerCase()
    .replace(/\d+/g, '0')
    .replace(/\s+/g, ' ')
    .trim();
  return t.slice(0, 400);
}

function pullFirstWcagTag(tags = []) {
  const t = (tags || []).find(x => /^wcag/i.test(x));
  return t || '';
}

function severityRank(impactRaw) {
  const impact = String(impactRaw || '').toLowerCase();
  return Object.prototype.hasOwnProperty.call(SEVERITY_ORDER, impact)
    ? SEVERITY_ORDER[impact]
    : SEVERITY_ORDER.unknown;
}

function dedupeRowsByKey(rows, { urlKey, ruleKey, snippetKey, wcagKey, severityKey }) {
  const map = new Map();

  for (const r of rows) {
    const url = normalizeUrl(r[urlKey]);
    const ruleId = String(r[ruleKey] || '').trim();
    const snippet = r[snippetKey] ?? '';
    const snorm = normalizeSnippet(snippet);
    const key = `${ruleId}|${url}|${snorm}`;

    if (!map.has(key)) {
      map.set(key, {
        ...r,
        [urlKey]: url, // ya normalizada
      });
    }
  }

  const deduped = Array.from(map.values());

  // orden: Severidad → WCAG → URL → Regla
  deduped.sort((a, b) => {
    const s = severityRank(a[severityKey]) - severityRank(b[severityKey]);
    if (s) return s;
    const w = String(a[wcagKey] || '').localeCompare(String(b[wcagKey] || ''), 'en', { numeric: true });
    if (w) return w;
    const u = String(a[urlKey] || '').localeCompare(String(b[urlKey] || ''));
    if (u) return u;
    return String(a[ruleKey] || '').localeCompare(String(b[ruleKey] || ''));
  });

  // resumen
  const bySeverity = deduped.reduce((acc, r) => {
    const k = String(r[severityKey] || 'unknown').toLowerCase();
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  const byWcag = deduped.reduce((acc, r) => {
    const k = String(r[wcagKey] || 'sin-wcag');
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  const totals = { count: deduped.length };

  return { deduped, summary: { bySeverity, byWcag, totals } };
}

function buildSummaryRows(summary) {
  const rows = [];
  rows.push(['Resumen', 'Valor']);
  rows.push(['Total violaciones (deduped)', summary.totals.count]);
  rows.push([]);
  rows.push(['Por severidad', 'Total']);
  for (const sev of ['critical','serious','alta','moderate','media','minor','baja','unknown']) {
    if (summary.bySeverity[sev]) rows.push([sev, summary.bySeverity[sev]]);
  }
  rows.push([]);
  rows.push(['Por WCAG', 'Total']);
  Object.entries(summary.byWcag)
    .sort((a,b) => a[0].localeCompare(b[0], 'en', { numeric: true }))
    .forEach(([k, n]) => rows.push([k, n]));
  rows.push([]);
  return rows;
}

module.exports = {
  normalizeUrl,
  normalizeSnippet,
  dedupeRowsByKey,
  buildSummaryRows,
  severityRank,
};
