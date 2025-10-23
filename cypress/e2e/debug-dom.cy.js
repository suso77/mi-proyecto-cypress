/// <reference types="cypress" />
import 'cypress-axe';

describe('🔍 Diagnóstico del DOM auditado', () => {
  const testUrl = 'https://cashgalicia.net/'; // prueba con una página con contenido visible

  it('📋 Muestra el contenido del DOM real antes del análisis', () => {
    cy.visit(testUrl, { timeout: 120000, failOnStatusCode: false });
    cy.document().its('readyState').should('eq', 'complete');
    cy.get('body', { timeout: 60000 }).should('be.visible');
    cy.wait(5000);

    // Capturar el HTML actual del body
    cy.document().then((doc) => {
      const html = doc.body.outerHTML;
      cy.writeFile('cypress/downloads/debug-dom.html', html);
      cy.task('log', '📄 DOM exportado: cypress/downloads/debug-dom.html');
    });

    // Inyectar Axe y comprobar existencia
    cy.injectAxe();
    cy.window().its('axe').should('exist');

    // Ejecutar auditoría básica y guardar resultado JSON
    cy.checkA11y('body', null, (results) => {
      cy.writeFile('cypress/downloads/debug-axe-results.json', results);
      cy.task('log', `✅ Auditoría ejecutada. Resultados en debug-axe-results.json`);
    });
  });
});
