// scripts/postprocess-informe.js
// Localiza el último informe CSV/TSV en auditorias/<fecha>-<site>/,
// deduplica filas y genera informe-accesibilidad.dedupe.(csv|tsv) con resumen al inicio.

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const {
  dedupeRowsByKey,
  buildSummaryRows,
} = require('./dedupe-violations');

// Heurística: detecta el informe más reciente
function getLatestAuditDir() {
  const root = path.resolve('auditorias');
  if (!fs.existsSync(root)) return null;
  const dirs = fs.readdirSync(root)
    .map(d => path.join(root, d))
    .filter(p => fs.statSync(p).isDirectory());
  if (!dirs.length) return null;
  dirs.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return dirs[0];
}

function findReportFile(dir) {
  const candidates = [
    'informe-accesibilidad.tsv',
    'informe-accesibilidad.csv',
  ].map(n => path.join(dir, n));

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }

  // fallback: busca por patrón
  const files = fs.readdirSync(dir)
    .filter(f => /informe-accesibilidad\.(csv|tsv)$/i.test(f));
  if (files.length) return path.join(dir, files[0]);
  return null;
}

function detectDelimiter(fp) {
  return fp.toLowerCase().endsWith('.tsv') ? '\t' : ',';
}

// Mapeo flexible de cabeceras (ES / variantes)
function pickColumn(headers, candidates) {
  const lower = headers.map(h => String(h).toLowerCase());
  for (const name of candidates) {
    const i = lower.indexOf(name.toLowerCase());
    if (i !== -1) return headers[i];
  }
  return null;
}

function main() {
  const dir = getLatestAuditDir();
  if (!dir) {
    console.log('ℹ️ No se encontró carpeta auditorias/*');
    process.exit(0);
  }

  const inFile = findReportFile(dir);
  if (!inFile) {
    console.log(`ℹ️ No se encontró informe en ${dir}`);
    process.exit(0);
  }

  const delimiter = detectDelimiter(inFile);
  const outFile = inFile.replace(/(\.csv|\.tsv)$/i, '.dedupe$1');

  const raw = fs.readFileSync(inFile, 'utf8');
  const parsed = Papa.parse(raw, { header: true, delimiter, skipEmptyLines: 'greedy' });

  if (!parsed.data || !parsed.data.length) {
    console.log(`ℹ️ Informe vacío: ${inFile}`);
    process.exit(0);
  }

  const headers = parsed.meta.fields || Object.keys(parsed.data[0] || {});
  // Campos típicos de tu informe:
  const urlKey = pickColumn(headers, ['Páginas Afectadas', 'url', 'páginas afectadas', 'pagina', 'página']);
  const ruleKey = pickColumn(headers, ['ID', 'Regla', 'id', 'rule', 'ruleId']);
  const snippetKey = pickColumn(headers, ['Resultado actual', 'snippet', 'Elemento afectado', 'elemento afectado']);
  const wcagKey = pickColumn(headers, ['Criterio WCAG', 'wcag', 'criterio wcag']);
  const severityKey = pickColumn(headers, ['Severidad', 'severidad', 'impact', 'severity']);

  if (!urlKey || !ruleKey || !snippetKey || !severityKey) {
    console.log('⚠️ Cabeceras no reconocidas. Detectado:', { urlKey, ruleKey, snippetKey, severityKey, wcagKey });
    console.log('   Asegúrate de usar el formato estándar del informe.');
    process.exit(0);
  }

  const { deduped, summary } = dedupeRowsByKey(parsed.data, {
    urlKey, ruleKey, snippetKey, wcagKey, severityKey
  });

  // Re-construir datos con mismas cabeceras y orden
  const outHeaders = headers;
  const outRows = deduped.map(row => {
    const obj = {};
    for (const h of outHeaders) obj[h] = row[h] ?? '';
    return obj;
  });

  // Construir CSV/TSV con resumen al inicio (2 columnas) + línea en blanco + cabeceras + datos
  const summaryRows = buildSummaryRows(summary); // array de arrays
  const summaryStr = Papa.unparse(summaryRows, { delimiter, quotes: true, header: false });

  const dataStr = Papa.unparse(outRows, { delimiter, quotes: true, header: true });

  const final = [summaryStr, '', dataStr].join('\n');
  fs.writeFileSync(outFile, final, 'utf8');

  console.log(`✅ Informe deduplicado con resumen: ${outFile}`);
  console.log(`   Origen (sin tocar):              ${inFile}`);
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    console.error('❌ postprocess-informe error:', e?.message || e);
    process.exit(0); // no “romper” el CI
  }
}
