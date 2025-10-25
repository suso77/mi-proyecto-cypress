/// <reference types="cypress" />

describe('Smoke', () => {
  // Capturamos errores/warnings de consola ANTES de cargar la página
  beforeEach(() => {
    cy.on('window:before:load', (win) => {
      cy.stub(win.console, 'error').as('consoleError');
      cy.stub(win.console, 'warn').as('consoleWarn');
    });
  });

  it('abre la home sin errores JS', () => {
    cy.visit('/');                // Usa CYPRESS_baseUrl definido en CI
    cy.contains('body', /./);     // Sanity check mínimo (la página renderiza algo)

    // Asegura que no hubo errores ni warnings en consola
    cy.get('@consoleError').should('not.be.called');
    cy.get('@consoleWarn').should('not.be.called');

    // (Opcional) Validación rápida extra
    cy.title().should('be.a', 'string').and('not.be.empty');
  });
});


