// cypress/support/guarded-screenshot.js
// Overwrite robusto de cy.screenshot para evitar fallos con elementos de altura 0.
Cypress.Commands.overwrite('screenshot', (originalFn, subject, nameOrOptions, maybeOptions) => {
  // Normalizar firma: puede venir (name, opts) o (opts) sólo
  let name, options;
  if (typeof nameOrOptions === 'string') {
    name = nameOrOptions;
    options = maybeOptions || {};
  } else {
    name = undefined;
    options = nameOrOptions || {};
  }

  // Si no hay "subject" (screenshot global), llamamos tal cual
  const isJqueryEl = subject && subject.jquery && subject.length;
  if (!isJqueryEl) {
    return originalFn(subject, name, options);
  }

  const $el = subject.first();
  // A veces el elemento no está en el DOM en el tick actual → mejor encadenar
  return cy.wrap($el, { log: false }).then(($real) => {
    const el = $real[0];
    if (!el) {
      // Sin elemento => fallback a viewport
      return originalFn(null, name, { ...options, capture: 'viewport' });
    }

    // Comprobar caja y estilos computados
    const rect = el.getBoundingClientRect();
    const cs = el.ownerDocument && el.ownerDocument.defaultView
      ? el.ownerDocument.defaultView.getComputedStyle(el)
      : window.getComputedStyle(el);

    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);
    const isVisible =
      cs &&
      cs.visibility !== 'hidden' &&
      cs.display !== 'none' &&
      h > 1 &&
      w > 1;

    if (isVisible) {
      // Asegurar que está a la vista (evita cajas 0 por recortes del viewport)
      return cy.wrap($real, { log: false })
        .scrollIntoView({ ensureScrollable: false })
        .then(() => originalFn($real, name, options));
    }

    // Fallback silencioso a screenshot de viewport
    return originalFn(null, name, { ...options, capture: 'viewport' });
  });
});

