/// <reference types="cypress" />
import "cypress-axe";
import { WCAG_MAP, AXE_RULE_TO_WCAG, HELP_ES, EXPECTED_ES } from "../support/wcag-map";

/* =========================================================================
   🌍 Vars
   ========================================================================= */
const SITE_URL = Cypress.env("SITE_URL") || process.env.SITE_URL;
if (!SITE_URL) throw new Error("❌ Falta SITE_URL. Ejecuta con: npm run test:evidencias");

// Ignorar errores JS del sitio (que no paren el test)
Cypress.on("uncaught:exception", () => false);

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
// Normaliza config: filtra tags y acepta rules como objeto O array [{ id, enabled }]
const normalizeA11yConfig = (cfg) => {
  const out = { ...(cfg || {}) };

  // runOnly (filtraremos manualmente tras checkA11y)
  let runOnlyValues = null;
  if (out.runOnly && out.runOnly.type === "tag" && Array.isArray(out.runOnly.values)) {
    const filtered = out.runOnly.values
      .map((v) => String(v).trim().toLowerCase())
      .filter((v) => ALLOWED_TAGS.has(v));
    if (filtered.length) runOnlyValues = filtered;
  }

  // rules: acepta objeto O array de { id, enabled }
  let rules = [];
  if (Array.isArray(out.rules)) {
    rules = out.rules
      .filter((r) => r && r.id)
      .map((r) => ({ id: String(r.id), enabled: Boolean(r.enabled) }));
  } else if (out.rules && typeof out.rules === "object") {
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

// Fallback breve si no hay texto en EXPECTED_ES
const deriveExpectedFromCriterio = (criterio = "") => {
  if (/1\.1\.1/.test(criterio)) return "Todos los contenidos no textuales tienen alternativa textual equivalente.";
  if (/1\.3\.1/.test(criterio)) return "La estructura y relaciones están representadas con semántica adecuada.";
  if (/1\.4\.3/.test(criterio)) return "El contraste de texto cumple mínimos (4.5:1 / 3:1 para texto grande).";
  if (/2\.4\.2/.test(criterio)) return "La página define un título descriptivo y único.";
  if (/2\.4\.3/.test(criterio)) return "El foco avanza siguiendo el orden lógico.";
  if (/2\.4\.4/.test(criterio)) return "El propósito de cada enlace es claro por su texto o contexto.";
  if (/4\.1\.2/.test(criterio)) return "Cada componente expone nombre, rol y valor correctamente.";
  return "La implementación cumple las condiciones del criterio indicado según WCAG.";
};

const enrichViolations = (violations, url, index) =>
  violations.map((v) => {
    const nodo = v.nodes?.[0];

    // 1) intenta encontrar un tag wcag*** entre los tags de la violación
    const wcagTag =
      (v.tags || [])
        .map((t) => String(t).toLowerCase())
        .find((t) => /^wcag\d+/.test(t)) || null;

    // 2) criterio/enlace: prioridad -> wcagTag -> id de regla -> fallback
    let criterio = null;
    let enlace   = null;

    if (wcagTag && WCAG_MAP[wcagTag]) {
      criterio = WCAG_MAP[wcagTag][0];
      enlace   = WCAG_MAP[wcagTag][1];
    } else if (AXE_RULE_TO_WCAG[v.id]) {
      criterio = AXE_RULE_TO_WCAG[v.id][0];
      enlace   = AXE_RULE_TO_WCAG[v.id][1];
    } else {
      criterio = "Criterio WCAG no identificado";
      enlace   = "https://www.w3.org/WAI/WCAG21/Understanding/overview.html";
    }

    // ---- AQUI los dos campos en español ----
    // Resumen (helpES) prioriza nuestro diccionario en ES
    const helpES = HELP_ES[v.id] || v.help || v.description || v.id;

    // Resultado esperado en ES (SIN enlaces ni frase genérica)
    // Prioridad: por ID de regla -> por tag wcag*** -> por código de criterio -> fallback derivado
    const critCode = (criterio.match(/^\d(?:\.\d+)+/) || [null])[0]; // p.ej. "1.3.1"
    const resultadoEsperadoES =
      EXPECTED_ES[v.id] ||
      (wcagTag && EXPECTED_ES[wcagTag]) ||
      (critCode && EXPECTED_ES[critCode]) ||
      deriveExpectedFromCriterio(criterio);
    // ----------------------------------------

    return {
      id: v.id,
      impact: v.impact || "none",
      // Guardamos ambas versiones para compatibilidad, pero el task prioriza *_ES
      helpES,
      help: v.help || "Sin descripción disponible",
      description: v.description || "Sin descripción",
      url,
      wcagTag,                   // <- lo enviamos por si el task lo quiere usar
      criterio,
      enlace,
      tags: v.tags || [],        // <- útil para depurar y como backup en el task
      elementoAfectado: nodo?.target?.join(", ") || "No identificado",
      resultadoActual: nodo?.html || nodo?.failureSummary || "No disponible (sin fragmento HTML)",
      resultadoActualES: nodo?.html || nodo?.failureSummary || "No disponible (sin fragmento HTML)",
      // ES: limpio, sin "Consulta la guía ..."
      resultadoEsperadoES,
      // compat (no se usa ya, pero lo dejamos por si algún script antiguo lo leyera)
      resultadoEsperado: v.help || resultadoEsperadoES,
      screenshotName: `a11y-${index + 1}-${sanitizePath(url)}`, // sin extensión; Cypress añade .png
    };
  });

/* =========================================================================
   ✅ SPEC con checkA11y (skipFailures) + guardarraíl CSV
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

          cy.visit(url, { failOnStatusCode: false, timeout: 300000 })
            .then(() => cy.document().its("readyState").should("eq", "complete"))
            .then(() => cy.get("body").should("be.visible"))
            .then(() => cy.wait(800))
            .then(() => cy.injectAxe())
            .then(() => cy.window({ log: false }))
            .then((win) => {
              // Configurar reglas (no pasamos options a checkA11y)
              if (rules.length && win.axe && typeof win.axe.configure === "function") {
                win.axe.configure({ rules });
              }
            })
            // checkA11y: obtenemos violaciones en el callback; no falla el test (skipFailures: true)
            .then(() =>
              cy.checkA11y(
                null,
                null, // dejamos las opciones por defecto
                (violations) => {
                  const totalAntesFiltrar = Array.isArray(violations) ? violations.length : 0;
                  let vios = Array.isArray(violations) ? violations : [];

                  if (runOnlySet) {
                    vios = vios.filter(
                      (v) =>
                        Array.isArray(v.tags) &&
                        v.tags.some((t) => runOnlySet.has(String(t).toLowerCase()))
                    );
                  }

                  cy.task("log", {
                    url,
                    totalAntesFiltrar,
                    totalDespuesFiltrar: vios.length,
                    sampleIds: vios.slice(0, 5).map((v) => v.id),
                  });

                  if (vios.length > 0) {
                    const enriched = enrichViolations(vios, url, index);
                    cy.screenshot(enriched[0].screenshotName) // sin extensión
                      .then(() => cy.task("saveA11yResults", { violations: enriched }));
                  } else {
                    // sin violaciones: captura “conforme” y NO escribir CSV
                    cy.task("log", { url, ok: true, msg: "Sin violaciones (no se escribe al CSV)" });
                    const screenshotName = `a11y-${index + 1}-sin-violaciones`; // sin extensión
                    cy.screenshot(screenshotName);
                  }
                },
                true // skipFailures
              )
            );
        });
      });
    });
  });
});
