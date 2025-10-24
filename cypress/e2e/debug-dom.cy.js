/// <reference types="cypress" />
import 'cypress-axe';

describe('🔍 Diagnóstico del DOM auditado', () => {
  it('📋 Muestra el contenido del DOM real antes del análisis', () => {
    const url = Cypress.env('SITE_URL') || '/';
    cy.visit(url, { failOnStatusCode: false, timeout: 120000 });
    cy.document().its('readyState').should('eq', 'complete');
    cy.get('body').should('be.visible');

    // dump del DOM
    cy.document().then((doc) => {
      const html = doc.documentElement.outerHTML;
      const out = 'cypress/downloads/debug-dom.html';
      cy.writeFile(out, html, 'utf8').then(() => cy.task('log', `📄 DOM exportado: ${out}`));
    });

    cy.injectAxe();
    cy.checkA11y(null, null, (violations) => {
      const n = violations?.length || 0;
      const file = 'cypress/downloads/debug-axe-results.json';
      cy.writeFile(file, JSON.stringify(violations, null, 2), 'utf8')
        .then(() => cy.task('log', `✅ Auditoría ejecutada. Resultados en ${file}`));
      // ⚠️ NO fallamos: es un spec de diagnóstico
      if (n > 0) {
        cy.task('log', `${n} violaciones detectadas (debug); no se falla este test`);
      }
    }, true);
  });
});
