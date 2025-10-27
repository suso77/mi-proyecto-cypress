// cypress/support/commands.js
// Comandos de interacción "heurística". Todos son NO-OP seguros:
// si no encuentran elementos, simplemente continúan.

Cypress.Commands.add('auditCookieBannerThenAccept', () => {
  // ejemplos de selectores típicos (adáptalos a tu sitio si quieres)
  const candidates = [
    '[id*="cookie"] [id*="accept"]',
    '[id*="cookie"] button[aria-label*="accept" i]',
    '[role="dialog"] button:contains("Aceptar")',
  ];

  cy.get('body').then($body => {
    const btnSel = candidates.find((sel) => $body.find(sel).length);
    if (!btnSel) return; // no hay banner -> nada que hacer
    cy.injectAxe();
    cy.checkA11yReport('body', { folderHint: 'cookies', maxNodesPerViolation: 1 });
    cy.get(btnSel).click({ force: true });
  });
});

Cypress.Commands.add('openMenusHeuristics', () => {
  const selMenuButtons = 'button[aria-haspopup="menu"], [role="button"][aria-haspopup="true"]';
  cy.get('body').then($body => {
    const $btns = $body.find(selMenuButtons);
    if (!$btns.length) return;

    cy.wrap($btns.get().slice(0, 3)).each((btn) => {
      cy.wrap(btn).click({ force: true });
      cy.waitForHydration(150);
    });
  });
});

Cypress.Commands.add('openAndAuditModals', () => {
  const triggers = 'button[data-modal], [data-open-modal], a[href*="#modal"]';
  cy.get('body').then($body => {
    const $t = $body.find(triggers);
    if (!$t.length) return;
    const take = $t.get().slice(0, 2);

    cy.wrap(take).each((el, idx) => {
      cy.wrap(el).click({ force: true });
      cy.waitForHydration(150);
      cy.injectAxe();
      cy.checkA11yReport('body', { folderHint: `modal${idx + 1}`, maxNodesPerViolation: 1 });
      cy.get('body').type('{esc}', { force: true });
    });
  });
});

Cypress.Commands.add('checkA11yInSameOriginIframe', () => {
  // Ejemplo sencillo: primer iframe same-origin (si existe)
  cy.get('iframe').then($ifs => {
    const iframe = $ifs.get(0);
    if (!iframe) return;

    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc || !doc.body) return;
      cy.wrap(iframe).then(() => {
        cy.injectAxe();
        cy.checkA11yReport('body', { folderHint: 'iframe', maxNodesPerViolation: 1 });
      });
    } catch {
      // cross-origin -> lo ignoramos
    }
  });
});

Cypress.Commands.add('documentCrossOriginIframe', () => {
  // Placeholder intencional (no hace nada en fase 1)
  // Evita fallos si alguien lo llama.
});
