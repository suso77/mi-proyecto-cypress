// cypress.config.js
const { defineConfig } = require("cypress");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const https = require("https");
const { parseStringPromise } = require("xml2js");

// 👉 usamos el task externo que escribe el informe con i18n WCAG
const { createSaveA11yResultsTask } = require("./scripts/escritor");

/* ===============================
   📅 Directorios base (COMUNES)
   =============================== */
const SITE_SLUG = (process.env.SITE_URL || "https://sitio-desconocido")
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "");
const FECHA = new Date().toLocaleDateString("es-ES").replace(/\//g, "-");
const BASE_DIR = path.join("auditorias", `${FECHA}-${SITE_SLUG}`);

// Aseguramos que el escritor conozca el subdirectorio de auditoría.
process.env.AUDIT_DIR_NAME = process.env.AUDIT_DIR_NAME || `${FECHA}-${SITE_SLUG}`;

// ⬅️ Nombre exacto del spec que hace capturas
const SPEC_SUBDIR = "accesibilidad-sitemap.cy.js";

// Carpeta final de screenshots
const SCREENSHOTS_DIR = path.join(BASE_DIR, "screenshots");

/* ===============================
   🧰 Helpers (solo sitemap aquí)
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
   ⚙️ CONFIGURACIÓN CYPRESS
   =============================== */
module.exports = defineConfig({
  screenshotsFolder: SCREENSHOTS_DIR,
  e2e: {
    setupNodeEvents(on, config) {
      on("before:run", () => {
        if (!fs.existsSync(path.join(SCREENSHOTS_DIR, SPEC_SUBDIR))) {
          fs.mkdirSync(path.join(SCREENSHOTS_DIR, SPEC_SUBDIR), { recursive: true });
        }
        console.log("📂 screenshotsFolder:", path.resolve(SCREENSHOTS_DIR));
      });

      on("before:browser:launch", (browser = {}, launchOptions) => {
        if (browser.name === "electron" || browser.name === "chrome") {
          launchOptions.args.push("--disable-web-security");
          launchOptions.args.push("--allow-file-access-from-files");
          launchOptions.args.push("--disable-site-isolation-trials");
          launchOptions.args.push("--disable-features=NetworkService");
          launchOptions.args.push("--ignore-certificate-errors");
          console.log(`🔓 ${browser.name} configurado para permitir win.eval(axeSource)`);
        }
        return launchOptions;
      });

      // 👉 Integramos tasks (incluye el writer externo actualizado)
      on("task", {
        fetchSitemapUrls,
        log(obj) { console.dir(obj, { depth: null }); return null; },

        resetTodayReport() {
          const CSV_MODE = (process.env.CSV_MODE || "excel").toLowerCase(); // excel|sheets|tsv
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

        // ⬇️ Nuestro task que escribe el informe (i18n + enlaces OK)
        saveA11yResults: createSaveA11yResultsTask(config, {
          FECHA,
          SITE_SLUG,
          BASE_DIR,
          SPEC_SUBDIR,
          SCREENSHOTS_DIR,
        }),
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
