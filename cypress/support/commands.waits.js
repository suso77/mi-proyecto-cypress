// cypress/support/commands.waits.js

// Desactiva transiciones/animaciones que rompen capturas
Cypress.Commands.add('disableAnimations', () => {
  const css = `
    *, *::before, *::after { 
      -webkit-transition: none !important; 
      transition: none !important; 
      animation: none !important; 
      caret-color: transparent !important;
    }
    html { scroll-behavior: auto !important; }
  `;
  cy.document().then((doc) => {
    const style = doc.createElement('style');
    style.appendChild(doc.createTextNode(css));
    doc.head.appendChild(style);
  });
});

// Espera corta para estabilizar DOM antes de lanzar axe
Cypress.Commands.add('waitA11yIdle', (ms = 150) => {
  cy.wait(ms, { log: false });
});

beforeEach(() => {
  cy.disableAnimations();
});

