// cypress.config.js
const { defineConfig } = require("cypress");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const https = require("https");
const { parseStringPromise } = require("xml2js");

// Mapas compartidos (NO declares otros aquí)
const { WCAG_MAP, AXE_RULE_TO_WCAG } = require("./cypress/support/wcag-map");

/* ===============================
   📅 Directorios base (COMUNES)
   =============================== */
const SITE_SLUG = (process.env.SITE_URL || "https://sitio-desconocido")
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "");
const FECHA = new Date().toLocaleDateString("es-ES").replace(/\//g, "-");
const BASE_DIR = path.join("auditorias", `${FECHA}-${SITE_SLUG}`);

// ⬅️ Nombre exacto del spec que hace capturas
const SPEC_SUBDIR = "accesibilidad-sitemap.cy.js";

// Carpeta final de screenshots
const SCREENSHOTS_DIR = path.join(BASE_DIR, "screenshots");

/* ===============================
   🧰 Helpers y modos de exportación
   =============================== */
// Modo de “CSV”: excel (;), sheets (,), tsv (\t)
const CSV_MODE = (process.env.CSV_MODE || "excel").toLowerCase(); // excel | sheets | tsv
const CSV_SEP  = CSV_MODE === "tsv" ? "\t" : (CSV_MODE === "sheets" ? "," : ";");

// Modo de enlaces: formula (=HYPERLINK) o plain (URL en claro)
const LINK_MODE = (process.env.LINK_MODE || (CSV_MODE === "tsv" ? "plain" : "formula")).toLowerCase(); // formula | plain

const ensureDir = (p) => { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); };
const ensurePng = (n) => (String(n).endsWith(".png") ? n : `${n}.png`);
const q = (val) => {
  let s = val == null ? "" : String(val);
  // Limpia tabs y saltos para TSV/CSV
  s = s.replace(/\r?\n|\r/g, " ")
       .replace(/\t/g, " ")
       .replace(/\s{2,}/g, " ")
       .trim();
  // CSV escaping: comillas dobles
  s = s.replace(/"/g, '""');
  return `"${s}"`;
};
const clean = (txt = "") =>
  String(txt)
    .replace(/\r?\n|\r/g, " ")
    .replace(/\t/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/"/g, '""')
    .trim();

// Evita doble codificación: si ya hay %xx, no vuelvas a encodear
const enc = (s) => (/%[0-9A-Fa-f]{2}/.test(String(s)) ? String(s) : encodeURIComponent(String(s)));

// En modo LINK_MODE=plain mostraremos la URL "bonita"
const asPlainUrl = (url) => {
  try { return decodeURI(String(url)); } catch (_) { return String(url); }
};

// Enlaces según modo:
const makeLink = (url, label) => {
  if (LINK_MODE === "plain") {
    // URL en claro (sin comillas para que Sheets/Numbers la auto-enlace).
    return asPlainUrl(url);
  }
  // Fórmula HYPERLINK según visor
  return CSV_MODE === "sheets"
    ? `=HYPERLINK("${url}","${label}")`
    : `=HYPERLINK("${url}";"${label}")`;
};

// Quota normal, pero si es fórmula HYPERLINK déjala cruda.
// Si es URL “plain” (http/https), también déjala cruda para auto-enlace en Sheets/Numbers.
const qOrCell = (val) => {
  const s = String(val ?? "");
  if (s.startsWith("=HYPERLINK(")) return s;               // fórmula cruda
  if (LINK_MODE === "plain" && /^https?:\/\//i.test(s)) return s; // URL cruda
  return q(s); // resto, con comillas
};

// Contador de columnas robusto (por si quieres verificar en logs)
function countCsvCols(line, sep = CSV_SEP) {
  if (sep === "\t") return line.split("\t").length; // TSV sencillo
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

/* ===============================
   🌐 OBTENER URLs DEL SITEMAP
   =============================== */
async function fetchSitemapUrls() {
  const sitemapUrl = `${process.env.SITE_URL}/sitemap.xml`;
  console.log(`📥 Leyendo sitemap desde: ${sitemapUrl}`);
  try {
    const agent = new https.Agent({ rejectUnauthorized: false });
    const response = await axios.get(sitemapUrl, { httpsAgent: agent, timeout: 15000 });
    const xml = response.data;
    const parsed = await parseStringPromise(xml);

    let urls =
      parsed.urlset?.url?.map((u) => u.loc[0]) ||
      parsed.sitemapindex?.sitemap?.map((s) => s.loc[0]) ||
      [];

    urls = urls.map((u) => {
      try {
        const x = new URL(u);
        x.hostname = x.hostname.toLowerCase();
        if (x.pathname !== "/" && x.pathname.endsWith("/")) x.pathname = x.pathname.slice(0, -1);
        return x.toString();
      } catch { return u; }
    });

    const initial = urls.length;
    urls = [...new Set(urls)];
    if (urls.length < initial) console.log(`⚠️ Se eliminaron ${initial - urls.length} URLs duplicadas.`);

    console.log(`✅ ${urls.length} URLs encontradas en sitemap.`);
    return urls;
  } catch (error) {
    console.error("❌ Error leyendo sitemap:", error.message);
    return [];
  }
}

/* ===============================
   📊 GUARDAR RESULTADOS WCAG
   =============================== */
function saveA11yResults(payload = {}) {
  const { violations } = payload || {};

  if (!Array.isArray(violations) || violations.length === 0) {
    console.log("🛡️ saveA11yResults: 0 violaciones -> no se escribe fichero.");
    return null;
  }
  const effective = violations.filter((v) => v && typeof v === "object" && v.id && v.id !== "sin-violaciones");
  if (effective.length === 0) {
    console.log("🛡️ Sólo registros informativos/sin-violaciones -> no se escribe fichero.");
    return null;
  }

  const SEVERIDAD_ES = { minor: "Leve", moderate: "Media", serious: "Alta", critical: "Crítica" };

  // Asegura carpetas base
  const CSV_NAME = CSV_MODE === "tsv" ? "informe-accesibilidad.tsv" : "informe-accesibilidad.csv";
  const RESULT_FILE = path.join(BASE_DIR, CSV_NAME);
  ensureDir(path.join(SCREENSHOTS_DIR, SPEC_SUBDIR)); // subcarpeta del spec

  // Cabecera (con BOM para Excel; Sheets lo ignora sin problema)
  if (!fs.existsSync(RESULT_FILE)) {
    const header = [
      "ID",
      "Sistema operativo, navegador y tecnología asistiva",
      "Resumen",
      "Elemento afectado",
      "Páginas Afectadas",
      "Resultado actual",
      "Resultado esperado",
      "Metodología de testing",
      "Severidad",
      "Criterio WCAG",
      "Captura de pantalla",
      "Recomendación (W3C)",
      "Notas",
    ].map(q).join(CSV_SEP) + "\n";
    fs.writeFileSync(RESULT_FILE, "\uFEFF" + header, "utf8");
  }

  const publicBase = (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, "");
  const forceFile  = String(process.env.FORCE_FILE_LINKS || "").trim() === "1";

  let wroteFirst = false;

  effective.forEach((v, idx) => {
    const url = v.url || "";
    const resumen = clean(v.helpES || v.help || v.description || v.id); // preferimos helpES si llega
    const elemento = clean(v.elementoAfectado || "No identificado");

    // ======== 🔧 Criterio + enlace (arreglo mínimo aquí) ========
    let criterio = v.criterio || null;
    let enlace   = v.enlace   || null;

    if (!criterio || !enlace) {
      const tags = Array.isArray(v.tags) ? v.tags.map(t => String(t).toLowerCase()) : [];

      // 1) PRIMERO: tag de criterio específico (wcag111, wcag131, wcag244, wcag411, wcag1411, etc.)
      const criterionTag =
        tags.find(t => /^wcag\d{3,4}$/.test(t)) || // 3-4 dígitos: 111, 131, 244, 411, 1411...
        null;

      if (criterionTag && WCAG_MAP[criterionTag]) {
        if (!criterio) criterio = WCAG_MAP[criterionTag][0];
        if (!enlace)   enlace   = WCAG_MAP[criterionTag][1];
      } else if (AXE_RULE_TO_WCAG[v.id]) {
        // 2) si no hay tag de criterio, intenta por id de regla de axe
        if (!criterio) criterio = AXE_RULE_TO_WCAG[v.id][0];
        if (!enlace)   enlace   = AXE_RULE_TO_WCAG[v.id][1];
      }
      // (NO usamos tags genéricos de nivel como "wcag2aa" para el campo Criterio WCAG)
    }

    // Fallback final (sin poner “WCAG 2.0/2.1 Nivel A/AA”)
    criterio = criterio || "Criterio WCAG no identificado";
    enlace   = enlace   || "https://www.w3.org/WAI/WCAG21/Understanding/overview.html";
    // ======== 🔧 FIN del cambio ========

    // Actual / Esperado (preferimos ES si viene en payload)
    const actual =
      clean(v.resultadoActualES || v.resultadoActual) ||
      clean(v.nodes?.[0]?.html) ||
      clean(v.nodes?.[0]?.failureSummary) ||
      "No disponible (sin fragmento HTML)";

    const esperado =
      clean(v.resultadoEsperadoES || v.resultadoEsperado) ||
      clean(v.helpES || v.help) ||
      `Debe cumplir el criterio: ${criterio}. Consulta la guía en ${enlace}`;

    const severidad = SEVERIDAD_ES[v.impact] || "Media";

    const screenshotName = ensurePng(v.screenshotName || `a11y-${Date.now()}-${idx + 1}`);

    // Prefijo público (si lo hay) sin duplicar /auditorias
    const prefix = (!forceFile && publicBase)
      ? (/\/auditorias$/.test(publicBase) ? publicBase : `${publicBase}/auditorias`)
      : null;

    // Ruta absoluta real (para file://)
    const screenshotAbs = path.resolve(SCREENSHOTS_DIR, SPEC_SUBDIR, screenshotName);

    // ⚠️ Usa 'enc' para NO re-encodear nombres que ya llevan %XX
    const screenshotHref = prefix
      ? `${prefix}/${FECHA}-${SITE_SLUG}/screenshots/${enc(SPEC_SUBDIR)}/${enc(screenshotName)}`
      : `file://${screenshotAbs}`;

    // Celdas (según modo enlaces)
    const cellPagina     = makeLink(url, "Ver página");
    const cellScreenshot = makeLink(screenshotHref, "Ver captura");
    const cellGuia       = makeLink(enlace, "Ver guía W3C");

    const fields = [
      `${v.id}-${idx + 1}`,
      "macOS + Electron (Cypress) + axe-core",
      resumen,
      elemento,
      cellPagina,         // fórmula o URL
      actual,
      esperado,
      "WCAG 2.1 / 2.2 AA (automatizado con axe-core)",
      severidad,
      criterio,
      cellScreenshot,     // fórmula o URL
      cellGuia,           // fórmula o URL
      "",
    ];

    const line = fields.map(qOrCell).join(CSV_SEP);
    fs.appendFileSync(RESULT_FILE, line + "\n", "utf8");

    if (!wroteFirst) {
      const cols = countCsvCols(line, CSV_SEP);
      console.log(`🧪 Primera fila: ${cols} columnas (esperadas 13) — modo=${CSV_MODE}, links=${LINK_MODE}`);
      wroteFirst = true;
    }
  });

  console.log(`📊 ${effective.length} violaciones registradas en ${path.join(BASE_DIR, CSV_NAME)}`);
  return null;
}

/* ===============================
   ⚙️ CONFIGURACIÓN CYPRESS
   =============================== */
module.exports = defineConfig({
  screenshotsFolder: SCREENSHOTS_DIR,
  e2e: {
    setupNodeEvents(on, config) {
      on("before:run", () => {
        ensureDir(path.join(SCREENSHOTS_DIR, SPEC_SUBDIR));
        console.log("📂 screenshotsFolder:", path.resolve(SCREENSHOTS_DIR));
      });

      on("before:browser:launch", (browser = {}, launchOptions) => {
        if (browser.name === "electron" || browser.name === "chrome") {
          launchOptions.args.push("--disable-web-security");
          launchOptions.args.push("--allow-file-access-from-files");
          launchOptions.args.push("--disable-site-isolation-trials");
          launchOptions.args.push("--disable-features=NetworkService");
          launchOptions.args.push("--ignore-certificate-errors"); // 👈 añadido para evitar errores SSL
          console.log(`🔓 ${browser.name} configurado para permitir win.eval(axeSource)`);
        }
        return launchOptions;
      });

      on("task", {
        fetchSitemapUrls,
        saveA11yResults,
        resetTodayReport() {
          const CSV_NAME = CSV_MODE === "tsv" ? "informe-accesibilidad.tsv" : "informe-accesibilidad.csv";
          const RESULT_FILE = path.join(BASE_DIR, CSV_NAME);
          if (fs.existsSync(RESULT_FILE)) {
            fs.unlinkSync(RESULT_FILE);
            console.log(`🧹 ${CSV_NAME} eliminado: ${RESULT_FILE}`);
          } else {
            console.log("🧹 No había informe previo que eliminar.");
          }
          return null;
        },
        log(obj) { console.dir(obj, { depth: null }); return null; },
      });

      // Exponer env a la spec
      config.env.SITE_URL = process.env.SITE_URL || config.env.SITE_URL;
      config.env.PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || config.env.PUBLIC_BASE_URL;
      console.log("🌍 SITE_URL:", config.env.SITE_URL);
      console.log("📂 PUBLIC_BASE_URL:", config.env.PUBLIC_BASE_URL);
      return config;
    },

    viewportWidth: 1440,
    viewportHeight: 900,
    defaultCommandTimeout: 60000,
    pageLoadTimeout: 300000,
    baseUrl: process.env.SITE_URL || "https://www.hiexperience.es",
    video: false,
    screenshotOnRunFailure: true,
    failOnStatusCode: false,
    retries: 0,
  },
});
