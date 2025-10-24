// ♿ Auditoría WCAG 2.1 + 2.2 (flujo secuencial garantizado)
describe('♿ Auditoría WCAG 2.1 + 2.2 (flujo secuencial garantizado)', () => {
  // Lista real de URLs a auditar de forma secuencial
  const urls = ['/', '/lander']; // ajusta según tu sitemap

  urls.forEach((url) => {
    it(`Audita (secuencial) ${url}`, () => {
      // Si una URL puede devolver 404 (como /lander), evita que Cypress falle por el status
      cy.visit(url, { failOnStatusCode: false });
      cy.injectAxe();

      // Auditoría SIN context (no pasar null)
      cy.checkA11yReport({
        runOnly: ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22a','wcag22aa'],
        folderHint: 'wcag22',
      });
    });
  });
});






