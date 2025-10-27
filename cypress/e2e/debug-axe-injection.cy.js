// Asegura que axe-core se inyecta correctamente en la página

// ===== Fallback robusto para la URL base del sitio =====
const SITE = Cypress.env('SITE_URL') || Cypress.config('baseUrl');
if (!SITE) throw new Error('Falta SITE_URL o baseUrl');
// =======================================================

describe('🧪 Debug axe-core injection', () => {
  it('Comprueba si axe-core se inyecta correctamente', () => {
    cy.visit(SITE, { failOnStatusCode: false });
    cy.injectAxe();
    cy.window().its('axe').should('exist');
  });
});

