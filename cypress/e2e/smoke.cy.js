/// <reference types="cypress" />

// Opcional: ignora warnings ruidosos específicos (rellena patterns si quieres)
const WARN_WHITELIST = [
  // /Deprecated .* API/i,
  // /Some benign third-party warning/i,
];

describe('Smoke', () => {
  beforeEach(() => {
    cy.on('window:before:load', (win) => {
      // Stub de consola
      cy.stub(win.console, 'error').as('consoleError');
      cy.stub(win.console, 'warn').callsFake((...args) => {
        const msg = args?.[0]?.toString?.() ?? '';
        // Filtra warnings "ruidosos" conocidos
        if (WARN_WHITELIST.some((re) => re.test(msg))) return;
        // Si no está en whitelist, pasa el warn (no fallamos el test)
        // eslint-disable-next-line no-console
        console.warn(...args);
      }).as('consoleWarn');
    });
  });

  it('abre la home y no hay errores JS (permitimos warnings)', () => {
    // baseUrl viene del entorno (CYPRESS_baseUrl)
    cy.visit('/');
    cy.contains('body', /./, { timeout: 20000 });
    cy.title().should('be.a', 'string').and('not.be.empty');

    // ❗️Fallar solo si hay errores JS
    cy.get('@consoleError').should('not.be.called');

    // Log de warnings para diagnóstico (no bloquea)
    cy.get('@consoleWarn').then((stub) => {
      const count = stub?.callCount ?? 0;
      cy.log(`⚠️ console.warn count: ${count}`);
    });
  });
});





