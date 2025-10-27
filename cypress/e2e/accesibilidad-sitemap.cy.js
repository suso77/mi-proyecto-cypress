// cypress/e2e/accesibilidad-sitemap.cy.js
// ===================================================================
// Auditoría WCAG 2.1/2.2 híbrida:
// 1) Lee TODAS las URLs del/los sitemap(s) vía task('fetchSitemapUrls').
// 2) (Opcional) Descubre enlaces internos no listados (BFS ligero).
// 3) Lanza axe (cy.checkA11yReport) y genera UNA captura por violación.
// - No rompe el test: el informe se guarda con task('saveA11yResults').
// ===================================================================

// ===== Fallback robusto de SITE_URL / baseUrl =====
const SITE = Cypress.env('SITE_URL') || Cypress.config('baseUrl');
if (!SITE) throw new Error('Falta SITE_URL o baseUrl');
const ROOT = new URL(SITE);
// ==================================================

// ================== Helpers ==================
const normalize = (u) => {
  try {
    const x = new URL(u, ROOT); // soporta relativos
    x.hostname = x.hostname.toLowerCase();
    if (x.pathname !== '/' && x.pathname.endsWith('/')) x.pathname = x.pathname.slice(0, -1);
    return x.toString();
  } catch {
    return u;
  }
};
const sameHost = (u) => {
  try { return new URL(u).host === ROOT.host; } catch { return false; }
};
const uniqArray = (arr) => Array.from(new Set(arr));

function regexListFromEnv(name) {
  return String(Cypress.env(name) || '').split(',')
    .map(s => s.trim()).filter(Boolean)
    .map(s => new RegExp(s, 'i'));
}

const INC = regexListFromEnv('A11Y_INCLUDE'); // ej: "/blog, /servicios"
const EXC = regexListFromEnv('A11Y_EXCLUDE'); // ej: "/tag/, /categoria/"

const includeOk = (u) => INC.length === 0 || INC.some(r => r.test(u));
const excludeOk = (u) => EXC.length === 0 || !EXC.some(r => r.test(u));

/**
 * Descubre enlaces internos de una página (sin visitar con navegador).
 * - Usa cy.request para traer el HTML y DOMParser para extraer <a href>.
 * - Devuelve un array de URL absolutas del mismo host.
 */
function discoverLinksFrom(url, { perPageLimit = 200 } = {}) {
  const abs = normalize(url);
  return cy.request({ url: abs, failOnStatusCode: false }).then((res) => {
    const html = res.body || '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const anchors = Array.from(doc.querySelectorAll('a[href]'));
    const urls = anchors
      .map(a => a.getAttribute('href'))
      .filter(Boolean)
      .map(href => normalize(href))
      .filter(u => sameHost(u) && includeOk(u) && excludeOk(u));
    return uniqArray(urls).slice(0, perPageLimit);
  });
}

/**
 * BFS ligero sobre enlaces internos partiendo de un seed de URLs.
 * depth=0 -> sin descubrimiento (solo sitemap)
 * depth=1..2 recomendado
 */
function breadthFirstDiscover(seeds, {
  depth = 1,
  maxUrls = 2000,
  perPageLimit = 200,
  seedLimit = 50,
} = {}) {
  const MAX = Number(Cypress.env('A11Y_MAX_URLS') || maxUrls);
  const DEPTH = Number(Cypress.env('A11Y_DISCOVER_DEPTH') || depth);
  const SEEDS = Number(Cypress.env('A11Y_DISCOVER_SEEDS') || seedLimit);
  const PERPAGE = Number(Cypress.env('A11Y_DISCOVER_PERPAGE') || perPageLimit);

  const out = new Set(uniqArray(seeds).slice(0, SEEDS));
  if (DEPTH <= 0) return cy.wrap(Array.from(out));

  let frontier = Array.from(out);
  let level = 0;

  function step() {
    if (level >= DEPTH || frontier.length === 0 || out.size >= MAX) {
      return cy.wrap(Array.from(out));
    }

    const nextFrontier = [];

    // Procesa cada URL de la frontera secuencialmente
    return cy.wrap(frontier).each((u) => {
      if (out.size >= MAX) return;

      return discoverLinksFrom(u, { perPageLimit: PERPAGE }).then((found) => {
        for (const f of found) {
          if (out.size >= MAX) break;
          if (!out.has(f)) {
            out.add(f);
            nextFrontier.push(f);
          }
        }
      });
    }).then(() => {
      level += 1;
      frontier = nextFrontier;
      return step();
    });
  }

  return step();
}
// ============================================

describe('♿ Auditoría WCAG 2.1 + 2.2 (Sitemap + Descubrimiento)', () => {
  it('Audita URLs del sitio (sitemap recursivo + BFS opcional)', () => {
    const MAX_AUDIT = Number(Cypress.env('A11Y_MAX_URLS') || 50);

    // 1) Lee URLs desde los sitemaps (recursivo desde la task del config)
    cy.task('fetchSitemapUrls', { recursive: true }).then((sitemapUrls = []) => {
      let pool = uniqArray(
        (sitemapUrls || [])
          .map(normalize)
          .filter(u => sameHost(u) && includeOk(u) && excludeOk(u))
      );

      cy.log(`Sitemap: ${pool.length} URLs iniciales.`);

      // 2) (Opcional) Descubrimiento BFS 0–2 niveles
      return breadthFirstDiscover(pool, {
        depth: Number(Cypress.env('A11Y_DISCOVER_DEPTH') || 1),  // 0 = desactivar
        maxUrls: Number(Cypress.env('A11Y_MAX_URLS') || 5000),
        perPageLimit: Number(Cypress.env('A11Y_DISCOVER_PERPAGE') || 200),
        seedLimit: Number(Cypress.env('A11Y_DISCOVER_SEEDS') || 50),
      }).then((allFound) => {
        const uniq = uniqArray(allFound).filter(u => sameHost(u) && includeOk(u) && excludeOk(u));
        const limited = uniq.slice(0, MAX_AUDIT);

        cy.log(`Se auditarán ${limited.length} URLs (de ${uniq.length} finales).`);

        // 3) Auditoría secuencial (para capturas limpias)
        cy.wrap(limited).each((url) => {
          cy.visit(url, { failOnStatusCode: false });
          cy.wait(250);       // estabiliza render/hidratación
          cy.injectAxe();

          cy.checkA11yReport('body', {
            folderHint: 'sitemap',
            maxNodesPerViolation: 1,                     // UNA captura por violación
            viewports: [[1280, 800], [375, 812]],        // escritorio + móvil
            // axeOptions: { runOnly: ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22a','wcag22aa'] },
          });
        });
      });
    });
  });
});














