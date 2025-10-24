// A11y – Cobertura de flujos (menús, cookies, modales, iframes)
describe('A11y – Cobertura de flujos (menús, cookies, modales, iframes)', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.injectAxe(); // axe-core listo en el DOM
  });

  it('Abre menús, audita banner de cookies (antes/después), modales e iframes', () => {
    // Opcional: activa pasos de flujo si ya tienes selectores válidos
    // cy.openMenusHeuristics();
    // cy.auditCookieBannerThenAccept();
    // cy.openAndAuditModals();

    // Auditoría SIN context (NO pasar null)
    cy.checkA11yReport({
      runOnly: ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22a','wcag22aa'],
      // Puedes personalizar evidencias si quieres:
      // maxNodesPerViolation: 3,
      // viewports: [[1366, 900], [390, 844]],
      folderHint: 'flujos',
    });
  });
});











