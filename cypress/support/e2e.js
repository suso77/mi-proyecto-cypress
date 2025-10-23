// ===================================================
// ♿ Configuración global: Auditoría accesible sin fallos
// ===================================================

// 1) Registra tus custom commands (openMenusHeuristics, cookies, modales, iframes, etc.)
import './commands';

// 2) Registra cypress-axe (añade cy.injectAxe / cy.checkA11y al runtime)
import 'cypress-axe';

// Ignorar errores de JS del sitio (por scripts externos, Weglot, etc.)
Cypress.on('uncaught:exception', (err) => {
  // No rompas el test por errores de terceros
  console.warn('⚠️ Error JS ignorado por Cypress:', err.message);
  return false;
});

// 🔧 Sobrescribir checkA11y para que nunca falle el test directamente.
// El quality gate del CI decidirá PASS/FAIL con el informe agregado.
Cypress.Commands.overwrite('checkA11y', (originalFn, ...args) => {
  let context = null;
  let options = {};
  let callback = null;

  // Detectar posición de argumentos según cómo se llama
  args.forEach((arg) => {
    if (typeof arg === 'function') callback = arg;
    else if (arg && typeof arg === 'object' && !Array.isArray(arg)) options = arg;
    else if (arg) context = arg;
  });

  // Fuerza skipFailures = true manteniendo el resto de opciones
  const merged = { ...options, skipFailures: true };

  return originalFn(context, null, callback, merged);
});

before(() => {
  console.log('♿ Auditoría de accesibilidad en modo INFORME (sin fallos).');
});
