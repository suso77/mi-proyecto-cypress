// Cobertura de flujos: menús, cookies, modales, iframes (si existen los comandos)

// ===== Fallback robusto para la URL base del sitio =====
const SITE = Cypress.env('SITE_URL') || Cypress.config('baseUrl');
if (!SITE) throw new Error('Falta SITE_URL o baseUrl');
const U = (path = '/') => new URL(path, SITE).href;
// =======================================================

describe('A11y – Cobertura de flujos (menús, cookies, modales, iframes)', () => {
  it('Abre menús, audita banner de cookies (antes/después), modales e iframes', () => {
    cy.visit(SITE, { failOnStatusCode: false });
    cy.injectAxe();

    // Ejecuta comandos solo si existen (no rompas la suite si no están)
    const c = Cypress.Commands._commands || {};
    if (c.auditCookieBannerThenAccept) cy.auditCookieBannerThenAccept();
    if (c.openMenusHeuristics)        cy.openMenusHeuristics();
    if (c.openAndAuditModals)         cy.openAndAuditModals();
    if (c.checkA11yInSameOriginIframe) cy.checkA11yInSameOriginIframe();

    cy.checkA11yReport('body', {
      folderHint: 'flujos',
      maxNodesPerViolation: 1,
      viewports: [[1280, 800], [375, 812]],
    });
  });
});













