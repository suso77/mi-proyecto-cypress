// cypress/support/e2e.js
// ♿ Bootstrap global de Cypress + Axe + Evidencias
// ===================================================

// (opcional) si no tienes comandos propios, deja este import y el archivo vacío
try { require('./commands'); } catch { /* noop: no custom commands */ }

// cypress-axe debe cargarse ANTES de sobreescribir checkA11y
require('cypress-axe');

// comandos de evidencias y checkA11yReport
require('./commands.evidence');

// Ignorar errores JS externos (para no romper la auditoría)
Cypress.on('uncaught:exception', (err) => {
  console.warn('⚠️ Error JS ignorado por Cypress:', err.message);
  return false;
});

// ----------------- OVERWRITE: cy.checkA11y NO rompe tests -----------------
// Firma original: checkA11y(context?, options?, violationCallback?, skipFailures?)
Cypress.Commands.overwrite('checkA11y', (originalFn, ...args) => {
  let context, options, callback, skipFailures;

  if (args.length === 1) {
    const a0 = args[0];
    if (typeof a0 === 'function') callback = a0;
    else if (a0 && typeof a0 === 'object' && !('jquery' in a0)) options = a0;
    else context = a0;
  } else if (args.length === 2) {
    const [a0, a1] = args;
    if (typeof a1 === 'function') {
      if (a0 && typeof a0 === 'object' && !('jquery' in a0)) options = a0;
      else context = a0;
      callback = a1;
    } else {
      context = a0;
      options = a1;
    }
  } else if (args.length >= 3) {
    [context, options, callback, skipFailures] = args;
  }

  const mergedOptions = { ...(options || {}) };
  const finalSkip = true; // ✅ jamás falla la spec por violaciones
  return originalFn(context, mergedOptions, callback, finalSkip);
});

// (Opcional) preparar/limpiar informe al inicio de la suite
before(() => {
  cy.then(() => cy.task?.('resetTodayReport')).then(
    () => null,
    () => null
  );
  console.log('♿ Auditoría en modo INFORME (skipFailures=true)');
});











