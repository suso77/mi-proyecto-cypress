// scripts/postprocess-informe.js
// Normaliza enlaces a TEXTO PLANO en los artefactos del informe (CSV y MD)

const fs = require('fs');
const path = require('path');

function todayFolderFor(baseUrl) {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const host = (new URL(baseUrl || 'http://localhost')).host.replace(/[:/\\]/g, '-');
  return path.join('auditorias', `${dd}-${mm}-${yyyy}-${host}`);
}

const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || process.env.SITE_URL || 'http://localhost';
const REPORT_DIR = todayFolderFor(PUBLIC_BASE_URL);
const CSV_FILE = path.join(REPORT_DIR, 'informe.csv');
const MD_FILE  = path.join(REPORT_DIR, 'informe.md');

// Convierte =HYPERLINK("URL","Texto")  ->  URL
// Acepta comillas simples/dobles y posibles espacios tras la coma
const HYPERLINK_RX = /=\s*HYPERLINK\s*\(\s*["']([^"']+)["']\s*,\s*["'][^"']*["']\s*\)/gi;

// En Markdown, por si hubiera [Texto](=HYPERLINK("URL","Texto")) -> URL
const MD_HYPERLINK_RX = /\[([^\]]+)\]\(=\s*HYPERLINK\s*\(\s*["']([^"']+)["']\s*,\s*["'][^"']*["']\s*\)\)/gi;

// Además, capturamos casos con separador punto y coma (Excel ES)
// =HYPERLINK("URL";"Texto")
const HYPERLINK_SEMI_RX = /=\s*HYPERLINK\s*\(\s*["']([^"']+)["']\s*;\s*["'][^"']*["']\s*\)/gi;

// Limpia un contenido de archivo convirtiendo todas las fórmulas a URL plano
function stripHyperlinkFormulas(str) {
  let out = str;

  // Primero variantes de punto y coma
  out = out.replace(HYPERLINK_SEMI_RX, (_, url) => url);

  // Variante estándar con coma
  out = out.replace(HYPERLINK_RX, (_, url) => url);

  // Markdown que envuelve la fórmula
  out = out.replace(MD_HYPERLINK_RX, (_, _text, url) => url);

  return out;
}

function processFileIfExists(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const original = fs.readFileSync(filePath, 'utf8');
  const cleaned = stripHyperlinkFormulas(original);
  if (cleaned !== original) {
    fs.writeFileSync(filePath, cleaned, 'utf8');
    console.log(`[postprocess] Limpio HYPERLINK() -> texto en: ${filePath}`);
  } else {
    console.log(`[postprocess] Sin cambios (no había fórmulas) en: ${filePath}`);
  }
  return true;
}

(function main() {
  if (!fs.existsSync(REPORT_DIR)) {
    console.warn(`[postprocess] Carpeta de informe NO encontrada: ${path.resolve(REPORT_DIR)}`);
    process.exit(0);
  }

  const okCsv = processFileIfExists(CSV_FILE);
  const okMd  = processFileIfExists(MD_FILE);

  if (!okCsv && !okMd) {
    console.warn('[postprocess] No hay informe.csv ni informe.md para limpiar (aún).');
  }
})();



