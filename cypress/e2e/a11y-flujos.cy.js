/// <reference types="cypress" />
import 'cypress-axe';

const CFG = Cypress.env('A11Y') || {};

describe('A11y – Cobertura de flujos (menús, cookies, modales, iframes)', () => {
  beforeEach(() => { cy.visit('/'); });

  it('Abre menús, audita banner de cookies (antes/después), modales e iframes', () => {
    // 1) Menús
    cy.openMenusHeuristics();

    // 2) Cookies (antes/después)
    cy.auditCookieBannerThenAccept({
      bannerSel: CFG.cookieBannerSelector,
      acceptSel: CFG.cookieAcceptSelector
    });

    // 3) Vista principal tras interacciones
    cy.injectAxe();
    cy.checkA11y(null, null, null, { skipFailures: true });

    // 4) Modales
    cy.openAndAuditModals();

    // 5) iframes same-origin
    (CFG.sameOriginIframes || []).forEach(({ iframe, inner }) => {
      cy.checkA11yInSameOriginIframe(iframe, inner || 'body');
    });

    // 6) iframes cross-origin
    (CFG.crossOriginIframes || []).forEach((sel) => {
      cy.documentCrossOriginIframe(sel);
    });
  });
});
