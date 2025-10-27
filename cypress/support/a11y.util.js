// cypress/support/a11y.util.js
export function getBaseSite() {
  return Cypress.env('SITE_URL') || Cypress.config('baseUrl') || '';
}

export function prettySelector(target) {
  if (Array.isArray(target) && target.length) return String(target[0]);
  if (typeof target === 'string') return target;
  return 'body';
}

export function shortStabilize() {
  cy.wait(250);
}




