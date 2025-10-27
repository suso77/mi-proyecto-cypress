// Diagnóstico: exporta DOM real y resultados de axe (sin aserciones duras)

// ===== Fallback robusto para la URL base del sitio =====
const SITE = Cypress.env('SITE_URL') || Cypress.config('baseUrl');
if (!SITE) throw new Error('Falta SITE_URL o baseUrl');
// =======================================================

describe('🔍 Diagnóstico del DOM auditado', () => {
  it('📋 Muestra el contenido del DOM real antes del análisis', () => {
    cy.visit(SITE, { failOnStatusCode: false });
    cy.injectAxe();

    cy.task('log', { info: 'Exportando DOM a cypress/downloads/debug-dom.html' });
    cy.document().then((doc) => {
      const html = doc.documentElement.outerHTML;
      cy.writeFile('cypress/downloads/debug-dom.html', html);
    });

    cy.checkA11yReport('body', {
      folderHint: 'debug',
      maxNodesPerViolation: 1,
      viewports: [[1280, 800]],
    });
  });
});

