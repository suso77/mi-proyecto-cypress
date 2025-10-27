// Auditoría WCAG 2.1 + 2.2 de páginas clave (flujo secuencial)

// ===== Fallback robusto para la URL base del sitio =====
const SITE = Cypress.env('SITE_URL') || Cypress.config('baseUrl');
if (!SITE) throw new Error('Falta SITE_URL o baseUrl');
const U = (path = '/') => new URL(path, SITE).href;
// =======================================================

describe('♿ Auditoría WCAG 2.1 + 2.2 (flujo secuencial garantizado)', () => {
  it('Audita home /', () => {
    cy.visit(SITE, { failOnStatusCode: false });
    cy.wait(250);
    cy.injectAxe();

    const c = Cypress.Commands._commands || {};
    if (c.openMenusHeuristics) cy.openMenusHeuristics();

    cy.checkA11yReport('body', {
      folderHint: 'wcag22',
      maxNodesPerViolation: 1,
      viewports: [[1280, 800], [375, 812]],
    });
  });

  it('Audita /lander', () => {
    cy.visit(U('/lander'), { failOnStatusCode: false });
    cy.wait(250);
    cy.injectAxe();

    const c = Cypress.Commands._commands || {};
    if (c.openMenusHeuristics) cy.openMenusHeuristics();

    cy.checkA11yReport('body', {
      folderHint: 'wcag22',
      maxNodesPerViolation: 1,
      viewports: [[1280, 800], [375, 812]],
    });
  });
});

