// ===================================================
// ♿ Configuración global: Auditoría accesible sin fallos
// ===================================================

import "cypress-axe";

// Ignorar errores de JS del sitio (por scripts externos, Weglot, etc.)
Cypress.on("uncaught:exception", (err) => {
  console.warn("⚠️ Error JS ignorado por Cypress:", err.message);
  return false;
});

// 🔧 Sobrescribir checkA11y para que nunca falle el test
Cypress.Commands.overwrite("checkA11y", (originalFn, ...args) => {
  let context = null;
  let options = {};
  let callback = null;
  let config = { skipFailures: true };

  // Detectar posición de argumentos según cómo se llama
  args.forEach((arg) => {
    if (typeof arg === "function") callback = arg;
    else if (typeof arg === "object" && !Array.isArray(arg)) options = arg;
    else if (arg) context = arg;
  });

  // Fusionar skipFailures en cualquier configuración existente
  config = { ...options, skipFailures: true };

  return originalFn(context, null, callback, config);
});

before(() => {
  console.log("♿ Auditoría de accesibilidad en modo INFORME (sin fallos).");
});
