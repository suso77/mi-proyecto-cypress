// cypress/support/e2e.js
// ===================================================
// ♿ Bootstrap global de Cypress + Axe + Evidencias
// ===================================================

// 1) Comandos base de tu proyecto (NO ejecutan nada al importar)
import './commands';

// 2) Esperas/no-anim/no-smooth (opcional)
try { import('./commands.waits'); } catch { /* noop */ }

// 3) Comandos de evidencias (cy.a11yEvidenceShot)
import './commands.evidence';

// 4) cypress-axe (injectAxe / checkA11y)
import 'cypress-axe';

// Ignorar errores JS del sitio (externos a las pruebas)
Cypress.on('uncaught:exception', (err) => {
  console.warn('⚠️ Error JS ignorado por Cypress:', err.message);
  return false;
});

/**
 * checkA11y por defecto en modo "no fallar".
 * Mantiene la firma nativa: (context?, options?, callback?, skipFailures?)
 */
Cypress.Commands.overwrite('checkA11y', (originalFn, ...args) => {
  let context = undefined, options = undefined, callback = undefined, skipFailures = true;

  // Rehidratamos la firma original respetando posiciones
  // Permitimos: checkA11y(), checkA11y(opts), checkA11y(ctx, opts), ...
  if (args.length) {
    // callback si viene
    const last = args[args.length - 1];
    if (typeof last === 'boolean') {
      skipFailures = last; // si alguien lo pasa explícito
      args.pop();
    }
    const maybeCallback = args[args.length - 1];
    if (typeof maybeCallback === 'function') {
      callback = maybeCallback;
      args.pop();
    }
    if (args.length === 1) {
      // único arg restante puede ser context (string|el) o options (obj)
      if (typeof args[0] === 'object' && args[0] !== null && !(args[0] instanceof Element)) {
        options = args[0];
      } else {
        context = args[0];
      }
    } else if (args.length >= 2) {
      context = args[0];
      options = args[1];
    }
  }

  return originalFn(context, options, callback, skipFailures);
});

/**
 * cy.checkA11yReport(contextOrOptions?, options?)
 * - Sin context (recomendado): cy.checkA11yReport({ runOnly: [...] })
 * - Con context: cy.checkA11yReport('main', { runOnly: [...] })
 */
Cypress.Commands.add('checkA11yReport', (contextOrOptions, maybeOptions) => {
  let context = undefined;
  let options = {};

  if (
    typeof contextOrOptions === 'string' ||
    (typeof contextOrOptions === 'object' && contextOrOptions !== null && (contextOrOptions.nodeType === 1 || Array.isArray(contextOrOptions)))
  ) {
    context = contextOrOptions;
    options = maybeOptions || {};
  } else if (typeof contextOrOptions === 'object' && contextOrOptions !== null) {
    options = contextOrOptions;
  }

  const defaultRunOnly = [
    'wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22a','wcag22aa',
    'best-practice','cat.aria','cat.name-role-value','cat.keyboard','cat.color',
  ];

  const mergedOpts = {
    runOnly: options.runOnly || defaultRunOnly,
    rules: options.rules || undefined,
  };

  return cy.checkA11y(
    context,                       // undefined = sin context (global)
    mergedOpts,
    (violations) => {
      cy.a11yEvidenceShot(violations, {
        maxNodesPerViolation: options.maxNodesPerViolation ?? 2,
        viewports: options.viewports ?? [[1280, 800], [375, 812]],
        folderHint: options.folderHint ?? 'a11y',
      });
    },
    true // skipFailures
  );
});

before(() => {
  console.log('♿ Auditoría de accesibilidad en modo INFORME (skipFailures=true).');
});


