// Verifica que los custom commands están cargados en Cypress
describe('Custom commands están registrados', () => {
  it('openMenusHeuristics existe', () => {
    expect(cy.openMenusHeuristics, 'openMenusHeuristics').to.be.a('function');
  });

  it('auditCookieBannerThenAccept existe', () => {
    expect(cy.auditCookieBannerThenAccept, 'auditCookieBannerThenAccept').to.be.a('function');
  });

  it('openAndAuditModals existe', () => {
    expect(cy.openAndAuditModals, 'openAndAuditModals').to.be.a('function');
  });

  it('checkA11yInSameOriginIframe existe', () => {
    expect(cy.checkA11yInSameOriginIframe, 'checkA11yInSameOriginIframe').to.be.a('function');
  });

  it('documentCrossOriginIframe existe', () => {
    expect(cy.documentCrossOriginIframe, 'documentCrossOriginIframe').to.be.a('function');
  });
});
