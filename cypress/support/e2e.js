// cypress/support/e2e.js
// Bootstrap global de Cypress + Axe + Evidencias

import './commands';             // si tienes comandos base
try { import('./commands.waits'); } catch { /* noop */ }

import 'cypress-axe';            // 1) SIEMPRE antes de overwrite/commands
import './guarded-screenshot';   // ⬅️ añade este import para activar el overwrite
import './commands.evidence';    // 2) checkA11yReport con dedupe

// No romper por errores JS externos
Cypress.on('uncaught:exception', (err) => {
  console.warn('⚠️ Error JS ignorado por Cypress:', err.message);
  return false;
});

// Overwrite: checkA11y nunca rompe (skipFailures=true)
Cypress.Commands.overwrite('checkA11y', (originalFn, ...args) => {
  let context, options, callback, skipFailures;
  if (args.length === 0) { /* noop */ }
  else if (args.length === 1) {
    const a0 = args[0];
    if (typeof a0 === 'function') callback = a0;
    else if (a0 && typeof a0 === 'object' && !('jquery' in a0)) options = a0;
    else context = a0;
  } else if (args.length === 2) {
    const [a0, a1] = args;
    if (typeof a1 === 'function') { if (a0 && typeof a0 === 'object' && !('jquery' in a0)) options = a0; else context = a0; callback = a1; }
    else { context = a0; options = a1; }
  } else { [context, options, callback, skipFailures] = args; }

  const mergedOptions = { ...(options || {}) };
  return originalFn(context, mergedOptions, callback, true);
});

before(() => {
  cy.then(() => cy.task?.('resetTodayReport')).then(() => null, () => null);
  console.log('♿ Auditoría en modo INFORME (skipFailures=true)');
});
