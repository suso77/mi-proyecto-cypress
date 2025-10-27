// cypress/support/a11y.util.js
// Pequeñas utilidades comunes

// Devuelve SITE_URL o baseUrl; lanza si no hay ninguno (para avisar pronto)
export function getBaseSite() {
  const site = Cypress.env('SITE_URL') || Cypress.config('baseUrl');
  if (!site) throw new Error('Falta SITE_URL o baseUrl');
  return site;
}

// Construye URL absoluta segura
export function ABS(path = '/') {
  const site = getBaseSite();
  return new URL(path, site).href;
}

// Asegura selector simple para logging / evidencias
export function prettySelector(target) {
  if (Array.isArray(target) && target[0]) return String(target[0]);
  if (typeof target === 'string') return target;
  return 'body';
}

// Espera corta para estabilizar rehidrataciones
export function shortStabilize() {
  cy.wait(250, { log: false });
}



