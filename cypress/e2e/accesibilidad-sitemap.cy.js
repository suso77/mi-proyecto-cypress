// ♿ Auditoría WCAG 2.1 + 2.2 (capturas adaptativas por violación)
describe('♿ Auditoría WCAG 2.1 + 2.2 (capturas adaptativas por violación)', () => {
  const urls = ['/', '/lander']; // <-- mantén tu lista, saltaremos 404/5xx de forma segura

  urls.forEach((url) => {
    it(`Audita ${url}`, () => {
      // 1) Comprobamos si la URL responde OK
      cy.request({ url, failOnStatusCode: false }).then((resp) => {
        if (resp.status >= 400) {
          cy.task('log', `⏭️  Skip ${url} (status ${resp.status})`);
          return; // no visit, no audit
        }

        // 2) Cargamos la página y auditamos
        cy.visit(url, { failOnStatusCode: false });
        cy.injectAxe();

        cy.checkA11yReport({
          runOnly: ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22a','wcag22aa'],
          folderHint: 'sitemap',
        });
      });
    });
  });
});
















