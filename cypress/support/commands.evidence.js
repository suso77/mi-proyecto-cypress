// cypress/support/commands.evidence.js
// Registro de evidencias: UNA captura por violación por defecto
import { getBaseSite, prettySelector, shortStabilize } from './a11y.util';

// ✅ cy.task no tiene .catch; usamos then(resolve, reject) para ignorar errores sin romper el test
function safeTask(taskName, payload) {
  return cy
    .then(() => cy.task(taskName, payload, { log: false }))
    .then(
      () => null, // ok
      () => {
        // si la task no está registrada o falla, no rompemos
        Cypress.log({ name: 'task', message: `task "${taskName}" ignorada (no registrada o falló)` });
        return null;
      }
    );
}

/**
 * checkA11yReport(context, opts)
 * - Se asume axe ya inyectado antes (cy.injectAxe())
 * - Ejecuta axe y genera UNA captura por violación (por defecto)
 * - Envía payload a `task('saveA11yResults')` para CSV/TSV
 */
Cypress.Commands.add('checkA11yReport', (context = 'body', opts = {}) => {
  const {
    folderHint = 'wcag',
    viewports = [[1280, 800]],       // una viewport por defecto
    maxNodesPerViolation = 1,        // UNA evidencia por violación
    axeOptions = null,               // opciones extra para axe si quieres
  } = opts;

  cy.location('href', { log: false }).then((currentUrl) => {
    const pageUrl = currentUrl || getBaseSite();

    viewports.forEach(([w, h]) => {
      cy.viewport(w, h);

      cy.checkA11y(context, axeOptions, (violations) => {
        if (!Array.isArray(violations) || violations.length === 0) {
          const payload = {
            violations: [{
              id: 'sin-violaciones',
              help: 'Sin violaciones en este contexto',
              impact: 'minor',
              tags: [],
              url: pageUrl,
              screenshotName: `sin-violaciones-${w}x${h}.png`,
              elementoAfectado: context,
              resultadoActual: 'N/A',
              resultadoEsperado: 'Cumplimiento',
            }],
          };
          return safeTask('saveA11yResults', payload);
        }

        const payload = { violations: [] };

        violations.forEach((v, vi) => {
          const node = (v.nodes && v.nodes[0]) ? v.nodes[0] : { target: [context] };
          const selector = prettySelector(node.target);

          const shotName = `${v.id}-${vi + 1}-${w}x${h}`;
          cy.get('body').then($body => {
            if ($body.find(selector).length) {
              cy.get(selector).scrollIntoView({ duration: 0 });
              shortStabilize();
              cy.get(selector).screenshot(shotName, { capture: 'viewport' });
            } else {
              cy.screenshot(shotName, { capture: 'viewport' });
            }
          });

          // ⬇️⬇️ CAMBIO CLAVE: priorizar HTML sobre failureSummary
          const resultadoActual =
            (node.html && String(node.html).trim()) ||
            (node.failureSummary && String(node.failureSummary).trim()) ||
            '';

          payload.violations.push({
            id: v.id,
            help: v.help,
            description: v.description,
            impact: v.impact,
            tags: v.tags,
            url: pageUrl,
            screenshotName: `${shotName}.png`,
            elementoAfectado: selector,
            resultadoActual,                 // <- ahora es el HTML cuando existe
            resultadoEsperado: v.help || '',
          });
          // ⬆️⬆️ FIN CAMBIO
        });

        // Enviamos TODO en una sola llamada a la task (sin romper si no existe)
        safeTask('saveA11yResults', payload);
      });
    });
  });
});

