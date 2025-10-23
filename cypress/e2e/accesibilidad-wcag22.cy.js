/// <reference types="cypress" />
import "cypress-axe";

/* =========================================================================
   🌍 Vars
   ========================================================================= */
const SITE_URL = Cypress.env("SITE_URL") || process.env.SITE_URL;
if (!SITE_URL) throw new Error("❌ Falta SITE_URL. Ejecuta con: npm run test:evidencias");

// Ignorar errores JS del sitio
Cypress.on("uncaught:exception", () => false);

/* =========================================================================
   📘 Mapa WCAG (para enriquecer CSV)
   ========================================================================= */
const WCAG_MAP = {
  wcag111: ["1.1.1 Contenido no textual", "https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html"],
  wcag131: ["1.3.1 Información y relaciones", "https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html"],
  wcag143: ["1.4.3 Contraste mínimo", "https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html"],
  wcag1411: ["1.4.11 Contraste de elementos no textuales", "https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html"],
  wcag1410: ["1.4.10 Reflujo (Reflow)", "https://www.w3.org/WAI/WCAG21/Understanding/reflow.html"],
  wcag211: ["2.1.1 Teclado", "https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html"],
  wcag212: ["2.1.2 Sin trampas de teclado", "https://www.w3.org/WAI/WCAG21/Understanding/no-keyboard-trap.html"],
  wcag222: ["2.2.2 Pausar, detener, ocultar", "https://www.w3.org/WAI/WCAG21/Understanding/pause-stop-hide.html"],
  wcag243: ["2.4.3 Orden del foco", "https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html"],
  wcag244: ["2.4.4 Propósito del enlace", "https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context.html"],
  wcag247: ["2.4.7 Foco visible", "https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html"],
  wcag311: ["3.1.1 Idioma de la página", "https://www.w3.org/WAI/WCAG21/Understanding/language-of-page.html"],
  wcag312: ["3.1.2 Idioma de las partes", "https://www.w3.org/WAI/WCAG21/Understanding/language-of-parts.html"],
  wcag331: ["3.3.1 Identificación de errores", "https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html"],
  wcag332: ["3.3.2 Etiquetas o instrucciones", "https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html"],
  wcag412: ["4.1.2 Nombre, función, valor", "https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html"],
  wcag413: ["4.1.3 Mensajes de estado", "https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html"],
};

/* =========================================================================
   🏷️ Tags permitidos (para filtrar runOnly)
   ========================================================================= */
const ALLOWED_TAGS = new Set([
  "wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22a","wcag22aa",
  "best-practice","experimental","cat.color","cat.aria","cat.keyboard","cat.name-role-value"
]);

/* =========================================================================
   🧰 Helpers
   ========================================================================= */
// Normaliza config: filtra tags y convierte rules {} -> [{ id, enabled }]
const normalizeA11yConfig = (cfg) => {
  const out = { ...(cfg || {}) };

  // runOnly (filtraremos manualmente tras run())
  let runOnlyValues = null;
  if (out.runOnly && out.runOnly.type === "tag" && Array.isArray(out.runOnly.values)) {
    const filtered = out.runOnly.values
      .map((v) => String(v).trim().toLowerCase())
      .filter((v) => ALLOWED_TAGS.has(v));
    if (filtered.length) runOnlyValues = filtered;
  }

  // rules: objeto -> array { id, enabled }
  let rules = [];
  if (out.rules && typeof out.rules === "object") {
    rules = Object.entries(out.rules)
      .filter(([_, v]) => v && typeof v === "object" && "enabled" in v)
      .map(([id, v]) => ({ id, enabled: Boolean(v.enabled) }));
  }

  return { runOnlyValues, rules };
};

const sanitizePath = (urlString) => {
  try {
    const u = new URL(urlString);
    const p = u.pathname.replace(/\//g, "_") || "home";
    return encodeURIComponent(p);
  } catch {
    return "pagina";
  }
};

const enrichViolations = (violations, url, index) =>
  violations.map((v) => {
    const nodo = v.nodes?.[0];
    const tag = v.tags?.find((t) => t.startsWith("wcag"))?.toLowerCase();
    const mapped = tag ? WCAG_MAP[tag] : null;
    const criterio = mapped?.[0] || "Criterio WCAG no identificado";
    const enlace = mapped?.[1] || "https://www.w3.org/WAI/WCAG21/quickref/";

    return {
      id: v.id,
      impact: v.impact || "none",
      help: v.help || "Sin descripción disponible",
      description: v.description || "Sin descripción",
      url,
      criterio,
      enlace,
      elementoAfectado: nodo?.target?.join(", ") || "No identificado",
      resultadoActual: nodo?.html || nodo?.failureSummary || "No disponible (sin fragmento HTML)",
      resultadoEsperado: v.help || `Debe cumplir el criterio: ${criterio}. Consulta la guía en ${enlace}`,
      // sin extensión (Cypress añade .png)
      screenshotName: `a11y-${index + 1}-${sanitizePath(url)}`,
    };
  });

/* =========================================================================
   ✅ SPEC
   ========================================================================= */
describe("♿ Auditoría WCAG 2.1 + 2.2 (flujo secuencial garantizado)", () => {
  it("Audita todas las URLs del sitemap una por una", () => {
    if (Cypress.env("sitemapFetched")) {
      cy.log("♻️ Sitemap ya cargado previamente, saltando recarga.");
      return;
    }
    Cypress.env("sitemapFetched", true);

    cy.task("fetchSitemapUrls").then((urls) => {
      cy.log(`✅ ${urls.length} URLs encontradas en sitemap.`);

      cy.readFile("./cypress/support/a11y-config.json").then((rawCfg) => {
        const { runOnlyValues, rules } = normalizeA11yConfig(rawCfg);
        cy.task("log", { runOnlyValues, rules }); // debug

        const runOnlySet = runOnlyValues ? new Set(runOnlyValues) : null;

        cy.wrap(urls).each((url, index) => {
          cy.log(`🌍 [${index + 1}/${urls.length}] Auditando: ${url}`);

          return cy
            .visit(url, { failOnStatusCode: false, timeout: 300000 })
            .then(() => cy.document().its("readyState").should("eq", "complete"))
            .then(() => cy.get("body").should("be.visible"))
            .then(() => cy.wait(800))
            .then(() => cy.injectAxe())
            .then(() => cy.window({ log: false }))
            .then((win) => {
              if (rules.length) win.axe.configure({ rules }); // reglas activas
              return win.axe.run(); // sin options
            })
            .then(
              (results) => {
                const totalAntesFiltrar = results?.violations?.length || 0;
                let violations = results?.violations || [];

                if (runOnlySet) {
                  violations = violations.filter((v) =>
                    Array.isArray(v.tags) &&
                    v.tags.some((t) => runOnlySet.has(String(t).toLowerCase()))
                  );
                }

                cy.task("log", {
                  url,
                  totalAntesFiltrar,
                  totalDespuesFiltrar: violations.length,
                  sampleIds: violations.slice(0, 5).map((v) => v.id),
                });

                if (violations.length) {
                  const enriched = enrichViolations(violations, url, index);
                  return cy
                    .screenshot(enriched[0].screenshotName) // sin extensión
                    .then(() => cy.task("saveA11yResults", { violations: enriched }));
                } else {
                  cy.task("log", { url, ok: true, msg: "Sin violaciones (no se escribe al CSV)" });
                  const screenshotName = `a11y-${index + 1}-sin-violaciones`; // sin extensión
                  return cy.screenshot(screenshotName);
                }
              },
              (err) => {
                // handler de error (NO usar .catch)
                cy.log(`⚠️ Error cargando ${url}: ${err.message}`);
                const screenshotName = `error-carga-${index + 1}`; // sin extensión
                return cy
                  .screenshot(screenshotName)
                  .then(() =>
                    cy.task("saveA11yResults", {
                      violations: [
                        {
                          id: "page-load-timeout",
                          url,
                          impact: "critical",
                          criterio: "Tiempo de carga excedido",
                          enlace: "",
                          help: "La página no completó la carga dentro del tiempo establecido",
                          screenshotName,
                          elementoAfectado: "N/A",
                          resultadoActual: "Página no cargada completamente",
                          resultadoEsperado: "La página debería cargar en menos de 30s",
                        },
                      ],
                    })
                  );
              }
            );
        });
      });
    });
  });
});
