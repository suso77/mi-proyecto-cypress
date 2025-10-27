// cypress/support/commands.waits.js
// Pequeñas esperas/ayudas opcionales (no-op seguras)

Cypress.Commands.add('waitForHydration', (ms = 250) => {
  cy.wait(ms, { log: false });
});

Cypress.Commands.add('safeScrollIntoView', (sel) => {
  cy.get('body').then($body => {
    if ($body.find(sel).length) cy.get(sel).scrollIntoView({ duration: 0 });
  });
});
