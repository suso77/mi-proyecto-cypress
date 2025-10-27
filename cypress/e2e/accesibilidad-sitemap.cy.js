// cypress/e2e/accesibilidad-sitemap.cy.js
// Auditoría WCAG 2.1/2.2 – Sitemap + Discovery robusta (sin promesas colgadas)

const SITE = Cypress.env('SITE_URL') || Cypress.config('baseUrl');
if (!SITE) throw new Error('Falta SITE_URL o baseUrl');

const MAX = Number(Cypress.env('A11Y_MAX_URLS') || 5000);

// tiempo generoso para la task (en ms) + preflights
const TASK_TIMEOUT     = 600000; // 10 min (match con taskTimeout del config)
const REQUEST_TIMEOUT  = 15000;  // 15 s por preflight
const VISIT_TIMEOUT    = 45000;  // 45 s por visita

// Visitar con tolerancia (no rompe si la página responde 4xx/5xx)
function visitSafely(url) {
  // preflight rápido (HEAD -> si falla, probamos GET con failOnStatusCode:false; si también falla, saltamos)
  return cy
    .request({ url, method: 'HEAD', failOnStatusCode: false, timeout: REQUEST_TIMEOUT, log: false })
    .then(
      () => null, // ok HEAD
      () => null  // HEAD falló, seguimos (no colgamos)
    )
    .then(() => {
      // intento GET “silencioso” para calentar conexiones/redirecciones
      return cy.request({ url, method: 'GET', failOnStatusCode: false, timeout: REQUEST_TIMEOUT, log: false });
    })
    .then(
      () => {
        // ahora sí, visit real (permitimos 4xx/5xx y subimos timeout)
        cy.visit(url, { failOnStatusCode: false, timeout: VISIT_TIMEOUT });
      },
      () => {
        // GET preflight falló → probamos a visitar igualmente
        cy.visit(url, { failOnStatusCode: false, timeout: VISIT_TIMEOUT });
      }
    )
    .then(
      () => true,  // visit ok (o al menos no explotó)
      (err) => {
        // si visit falla por red dura (ECONNRESET, etc.), no paramos el runner
        Cypress.log({ name: 'skip:url', message: `Omitida por error de red: ${url} — ${err.message}` });
        return false;
      }
    );
}

describe('♿ Auditoría WCAG 2.1/2.2 – Sitemap + Discovery (robusta)', () => {
  it('Rastrea y audita', () => {
    // 1) Obtén TODAS las URLs desde la task recursiva (con timeout alto)
    cy.task('fetchSitemapUrls', { recursive: true }, { timeout: TASK_TIMEOUT })
      .then((allUrls) => {
        const uniq = Array.from(new Set(allUrls || []));
        const limited = uniq.slice(0, MAX);
        cy.log(`Se auditarán ${limited.length} URLs (de ${uniq.length} detectadas)`);

        // 2) Audita secuencialmente cada URL (sin promesas colgadas)
        cy.wrap(limited, { log: false }).each((url) => {
          // visita con tolerancia
          visitSafely(url).then((ok) => {
            if (!ok) return; // omitida

            cy.wait(250);
            cy.injectAxe();

            cy.checkA11yReport('body', {
              folderHint: 'sitemap',
              maxNodesPerViolation: 1,      // 1 captura por violación/elemento
              viewports: [[1280, 800], [375, 812]],
              // axeOptions: { // si quieres excluir regiones dinámicas, etc.
              //   rules: { }
              // }
            });
          });
        });
      });
  });
});

















