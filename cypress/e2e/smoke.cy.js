/// <reference types="cypress" />

describe('Smoke', () => {
  it('abre la home y no hay errores JS (permitimos warnings)', () => {
    const errors = [];
    cy.on('window:before:load', (win) => {
      const origError = win.console.error;
      // intercepta console.error
      win.console.error = (...args) => {
        errors.push(args.join(' '));
        if (origError) origError.apply(win.console, args);
      };
    });

    cy.visit(Cypress.env('SITE_URL') || '/', { failOnStatusCode: false, timeout: 120000 });
    cy.document().its('readyState').should('eq', 'complete');
    cy.get('body').should('be.visible');

    // Aquí SÍ: no debe haber errores
    cy.then(() => {
      // Permite filtrar mensajes si quieres ignorar libs de terceros:
      const relevantes = errors.filter((m) => !/weglot|3rdparty|deprecation/i.test(m));
      expect(relevantes.join('\n'), 'console.error vacío en smoke').to.eq('');
    });
  });
});

