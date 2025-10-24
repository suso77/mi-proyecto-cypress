// scripts/dedupe-violations.js
/* eslint-disable no-console */

function normSnippet(html = '') {
  return String(html)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s?style="[^"]*"/g, '')  // quita estilos inline
    .replace(/\s?class="[^"]*"/g, '')  // quita clases (ruido)
    .trim();
}

function dedupeViolations(violations = []) {
  const byKey = new Map();
  const summary = {
    porSeveridad: {}, // { Alta: n, Media: n, ... }
    porCriterio: {},  // { '1.4.3 Contraste (mínimo)': n, ... }
  };

  const impactMap = { minor: 'Leve', moderate: 'Media', serious: 'Alta', critical: 'Crítica' };

  for (const v of (violations || [])) {
    if (!v || typeof v !== 'object') continue;

    const ruleId   = v.id || 'unknown';
    const impactES = impactMap[v.impact] || 'Media';
    const criterio = v.criterio || v.wcag || 'Criterio WCAG no identificado';

    // Acumula para el resumen (por número de nodos)
    const count = (Array.isArray(v.nodes) && v.nodes.length) ? v.nodes.length : 1;
    summary.porSeveridad[impactES] = (summary.porSeveridad[impactES] || 0) + count;
    summary.porCriterio[criterio]  = (summary.porCriterio[criterio]  || 0) + count;

    // Clave de de-dup: URL + regla + snippet normalizado
    (v.nodes && v.nodes.length ? v.nodes : [{}]).forEach((n) => {
      const url = n.pageUrl || v.url || '';
      const sn  = normSnippet(n.html || n.failureSummary || '');
      const key = `${url}::${ruleId}::${sn}`;

      if (!byKey.has(key)) {
        byKey.set(key, {
          ...v,
          url,
          nodes: [{ ...n }],
          snippet: sn,
        });
      }
    });
  }

  const sevOrder = { 'Crítica': 1, 'Alta': 2, 'Media': 3, 'Leve': 4 };

  const deduped = Array.from(byKey.values())
    .sort((a, b) => {
      const aSev = sevOrder[impactMap[a.impact] || 'Media'] || 99;
      const bSev = sevOrder[impactMap[b.impact] || 'Media'] || 99;
      if (aSev !== bSev) return aSev - bSev;

      const aCrit = a.criterio || a.wcag || '';
      const bCrit = b.criterio || b.wcag || '';
      const cCmp  = aCrit.localeCompare(bCrit);
      if (cCmp !== 0) return cCmp;

      return (a.url || '').localeCompare(b.url || '');
    });

  return { deduped, summary };
}

function buildSummaryRows(summary = {}) {
  const rows = [];
  rows.push(['Resumen ejecutivo', 'Totales (nodos)']);
  rows.push(['— Por severidad —', '']);

  // Ordena severidad de mayor a menor
  const sevKeys = ['Crítica', 'Alta', 'Media', 'Leve'];
  sevKeys.forEach((k) => {
    if (summary.porSeveridad && summary.porSeveridad[k]) {
      rows.push([k, String(summary.porSeveridad[k])]);
    }
  });

  rows.push(['— Por criterio —', '']);
  Object.entries(summary.porCriterio || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([k, v]) => rows.push([k, String(v)]));

  rows.push(['', '']);
  return rows;
}

module.exports = { dedupeViolations, buildSummaryRows, normSnippet };


