// scripts/postprocess-informe.js
// - Localiza el último informe CSV/TSV en auditorias/<fecha>-<site>/
// - Aplica dedupe/orden/resumen (usando scripts/dedupe-violations.js)
// - Reescribe el informe
// - Imprime RESUMEN CORTO en consola (útil para CI)

const fs = require('fs');
const path = require('path');
const { dedupeViolations, buildSummaryRows } = require('./dedupe-violations');

const ROOT = process.cwd();
const AUDIT_DIR = path.join(ROOT, 'auditorias');

function findLatestReport() {
  if (!fs.existsSync(AUDIT_DIR)) return null;

  // Encuentra el subdirectorio más nuevo (por mtime)
  const dirs = fs.readdirSync(AUDIT_DIR)
    .map(name => path.join(AUDIT_DIR, name))
    .filter(p => fs.statSync(p).isDirectory())
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

  for (const dir of dirs) {
    const files = fs.readdirSync(dir)
      .filter(f => /informe-accesibilidad\.(csv|tsv)$/i.test(f))
      .map(f => path.join(dir, f));
    if (files.length) {
      // Prioriza TSV (más robusto), si no hay, coge CSV
      const tsv = files.find(f => f.toLowerCase().endsWith('.tsv'));
      return tsv || files[0];
    }
  }
  return null;
}

function parseDelimited(content, delimiter) {
  const lines = content.split(/\r?\n/).filter(l => l.trim().length);
  if (!lines.length) return { header: [], rows: [] };
  // Si la primera línea tiene comillas, las respetamos muy simple (sin CSV complejo)
  // Asumimos que nuestro propio writer usa comillas al exportar celdas con comas/puntos y listo.
  const split = (line) => {
    // separación simple por delimitador sin parseo de comillas “duro”.
    // Para nuestros informes (sin comas internas cuando TSV), es suficiente.
    return line.split(delimiter);
  };
  const header = split(lines[0]).map(s => s.replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map(l => split(l).map(s => s.replace(/^"|"$/g, '')));
  return { header, rows };
}

function toDelimited(rows, delimiter) {
  const esc = (v) => {
    const s = String(v ?? '');
    // En TSV no hace falta comillar casi nunca; mantenemos comillas ligeras solo si hay tabs o comillas
    if (delimiter === '\t') {
      return s.includes('\t') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    }
    // En CSV, comillar cuando hay comas, saltos o comillas
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map(r => r.map(esc).join(delimiter)).join('\n') + '\n';
}

function severityRank(impact) {
  const order = { critical: 0, serious: 1, moderate: 2, minor: 3, unknown: 4 };
  return order.hasOwnProperty(impact) ? order[impact] : order.unknown;
}

// Imprime un bloque conciso en consola para CI
function printConsoleSummary(summary, filePath) {
  const sevOrder = ['critical', 'serious', 'moderate', 'minor', 'unknown'];
  const sevLines = sevOrder
    .filter(s => summary.bySeverity[s])
    .map(s => `  - ${s}: ${summary.bySeverity[s]}`);

  // Top 6 WCAG por volumen
  const topWcag = Object.entries(summary.byWcag || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([k, n]) => `  - ${k}: ${n}`);

  console.log('\n──────────────── A11y post-proceso (resumen) ────────────────');
  console.log(`Archivo: ${path.relative(process.cwd(), filePath)}`);
  console.log(`Total (dedupe): ${summary.totals.count}`);
  if (sevLines.length) {
    console.log('Por severidad:');
    sevLines.forEach(l => console.log(l));
  }
  if (topWcag.length) {
    console.log('Top WCAG:');
    topWcag.forEach(l => console.log(l));
  }
  console.log('──────────────────────────────────────────────────────────────\n');
}

// Mapea filas del informe original -> objetos “violation-like” mínimos
// NOTA: este script es un postproceso “a posteriori”, así que reconstruimos lo esencial
function rowsToViolations(header, rows) {
  // Campos esperados en tu informe actual:
  // "ID","Sistema ...","Resumen","Elemento afectado","Páginas Afectadas","Resultado actual",
  // "Resultado esperado","Metodología de testing","Severidad","Criterio WCAG",
  // "Captura de pantalla","Recomendación (W3C)","Notas"
  const colIndex = (name) => header.findIndex(h => h.trim().toLowerCase() === name.trim().toLowerCase());

  const idx = {
    url: colIndex('Páginas Afectadas'),
    ruleId: colIndex('ID'),
    impact: colIndex('Severidad'),
    wcag: colIndex('Criterio WCAG'),
    help: colIndex('Resumen'),
    helpUrl: colIndex('Recomendación (W3C)'),
    snippet: colIndex('Resultado actual'),
    target: colIndex('Elemento afectado'),
  };

  const violations = [];
  for (const row of rows) {
    const v = {
      id: row[idx.ruleId] || '',
      impact: (row[idx.impact] || '').toString().toLowerCase(), // “Alta/Media” → normalizamos luego
      tags: [],
      help: row[idx.help] || '',
      helpUrl: row[idx.helpUrl] || '',
      description: '',
      nodes: [{
        html: row[idx.snippet] || '',
        target: row[idx.target] || '',
        pageUrl: row[idx.url] || '',
      }]
    };

    // WCAG tag “wcagXX…”: intentamos derivarlo
    const wcagCol = (row[idx.wcag] || '').toString();
    if (/wcag/i.test(wcagCol)) {
      v.tags.push(wcagCol.replace(/\s+/g, '').toLowerCase()); // ej. "WCAG 2.0 Nivel AA" → "wcag2.0nivelaa" (no perfecto, pero nos sirve para agrupar)
    }

    // Normaliza severidad “Alta/Media/Baja” → axe-style si es posible
    const s = (row[idx.impact] || '').toString().toLowerCase();
    if (s.includes('crit')) v.impact = 'critical';
    else if (s.includes('alta')) v.impact = 'serious';
    else if (s.includes('media')) v.impact = 'moderate';
    else if (s.includes('baja')) v.impact = 'minor';
    else v.impact = v.impact || 'unknown';

    violations.push(v);
  }

  return violations;
}

function violationsToRows(deduped) {
  // Volvemos al mismo formato de columnas que tu informe
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
  ];

  // Nota: “Sistema…”, “Resultado esperado”, “Metodología…”, “Captura…”, “Notas”
  // no se deducen del dedupe; mantenemos textos base “estándar” (igual que antes)
  return {
    header,
    rows: deduped.map(r => ([
      r.ruleId,
      'macOS + Electron (Cypress) + axe-core',
      r.help || '',
      r.target || '',
      r.url || '',
      r.snippet || '',
      'Aplicar la recomendación de la regla o patrón WCAG equivalente.',
      'WCAG 2.1 / 2.2 AA (automatizado con axe-core)',
      // Convertimos severidad axe → etiquetas de tu informe
      (r.impact === 'critical' ? 'Crítica'
        : r.impact === 'serious' ? 'Alta'
        : r.impact === 'moderate' ? 'Media'
        : r.impact === 'minor' ? 'Baja'
        : 'Desconocida'),
      r.wcag || '',
      '',                 // captura no la reconstruimos en este paso
      r.helpUrl || '',
      ''
    ]))
  };
}

function main() {
  const file = findLatestReport();
  if (!file) {
    console.log('ℹ️ No se encontró informe para postprocesar en auditorias/**/informe-accesibilidad.(csv|tsv)');
    process.exit(0);
  }

  const isTSV = file.toLowerCase().endsWith('.tsv');
  const delimiter = isTSV ? '\t' : ',';

  const raw = fs.readFileSync(file, 'utf8');
  const { header, rows } = parseDelimited(raw, delimiter);

  if (!header.length || !rows.length) {
    console.log(`ℹ️ Informe vacío: ${path.relative(process.cwd(), file)}`);
    process.exit(0);
  }

  // Reconstruimos “violations” mínimos desde el informe actual
  const violations = rowsToViolations(header, rows);

  // Dedupe + resumen
  const { deduped, summary } = dedupeViolations(violations);

  // Construimos bloque de resumen de 2 columnas
  const summaryRows = buildSummaryRows(summary); // array de arrays (2 cols)

  // Re-serializamos: primero el resumen, luego las filas deduped con el header original-equivalente
  const { header: newHeader, rows: newRows } = violationsToRows(deduped);
  const summaryTable = toDelimited(summaryRows, delimiter);
  const bodyTable = toDelimited([newHeader, ...newRows], delimiter);

  fs.writeFileSync(file, summaryTable + '\n' + bodyTable, 'utf8');

  // Imprime resumen corto para consola (CI)
  printConsoleSummary(summary, file);
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    console.error('❌ postprocess-informe error:', e?.message || e);
    process.exit(0); // no romper el CI por el postproceso
  }
}
