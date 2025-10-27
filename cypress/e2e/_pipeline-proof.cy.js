// Prueba mínima de la tubería: fuerza 1 violación y genera evidencias

// ===== Fallback robusto para la URL base del sitio =====
const SITE = Cypress.env('SITE_URL') || Cypress.config('baseUrl');
if (!SITE) throw new Error('Falta SITE_URL o baseUrl');
const U = (path = '/') => new URL(path, SITE).href;
// =======================================================

describe('Pipeline de evidencias A11y', () => {
  it('fuerza una violación y escribe CSV + capturas', () => {
    // Página mínima con <img> sin alt
    cy.visit('about:blank');
    cy.document().then((doc) => {
      doc.body.innerHTML = `
        <main>
          <h1>Prueba pipeline</h1>
          <img id="violacion" src="https://via.placeholder.com/150">
        </main>
      `;
    });

    cy.injectAxe();
    cy.checkA11yReport('main', {
      folderHint: 'pipeline-proof',
      maxNodesPerViolation: 1,
      viewports: [[1280, 800]],
    });
  });
});

