// cypress/support/commands.evidence.js
import { violationsToCsvRows, violationsToMarkdown } from './a11y.util';

Cypress.Commands.add('a11yEvidenceShot', (violations, opts = {}) => {
  const {
    maxNodesPerViolation = 2,
    viewports = [[1280, 800], [375, 812]],
    folderHint = 'a11y',
  } = opts;

  const takeShots = () => {
    if (!violations || !violations.length) {
      cy.task('log', { ok: true, msg: 'Sin violaciones (no se escribe al CSV/MD)' });
      return;
    }

    cy.url().then((url) => {
      // CSV
      const rows = violationsToCsvRows(url, violations, maxNodesPerViolation);
      cy.task('a11y:appendCsv', rows);

      // Markdown
      const md = violationsToMarkdown(url, violations, maxNodesPerViolation);
      cy.task('a11y:appendMd', md + '\n');

      // Screens por viewport y por id de violación
      violations.forEach((v) => {
        viewports.forEach(([w, h]) => {
          cy.viewport(w, h);
          const safeId = v.id.replace(/[^\w\-]+/g, '_');
          const name = `${folderHint}/${safeId}-${w}x${h}`;
          cy.screenshot(name, { capture: 'viewport' });
        });
      });
    });
  };

  takeShots();
});
