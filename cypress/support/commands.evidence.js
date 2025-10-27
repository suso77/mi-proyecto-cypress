// cypress/support/commands.evidence.js
import { getBaseSite, prettySelector, shortStabilize } from './a11y.util';

let applySpanishToPayload = (p) => p;
try {
  ({ applySpanishToPayload } = require('./axe-i18n'));
} catch { /* noop */ }

function safeTask(taskName, payload) {
  return cy.then(() => cy.task(taskName, payload, { log: false }))
           .then(() => null, () => { Cypress.log({ name:'task', message:`task "${taskName}" ignorada` }); return null; });
}

function normUrl(u) {
  try {
    const x = new URL(u);
    x.hostname = x.hostname.toLowerCase();
    x.hash = '';
    if (x.pathname !== '/' && x.pathname.endsWith('/')) x.pathname = x.pathname.slice(0,-1);
    if (/\/index\.html?$/i.test(x.pathname)) x.pathname = x.pathname.replace(/\/index\.html?$/i, '') || '/';
    return x.toString();
  } catch { return String(u||''); }
}

function safeSlug(s, max=80) {
  const base = String(s||'').replace(/\s+/g,' ').replace(/[^\w\-@.:#]/g,'_').slice(0,max);
  return base || 'elem';
}

Cypress.Commands.add('checkA11yReport', (context='body', opts={}) => {
  const { folderHint='wcag', viewports=[[1280,800],[375,812]], maxNodesPerViolation=3, axeOptions=null } = opts;

  cy.location('href', { log:false }).then((currentUrl) => {
    const pageUrl = currentUrl || getBaseSite();
    const pageKey = normUrl(pageUrl);
    const seen = new Set(); // URL+regla+selector

    viewports.forEach(([w,h]) => {
      cy.viewport(w,h);

      cy.checkA11y(context, axeOptions, (violations) => {
        const payload = { violations: [] };

        if (!Array.isArray(violations) || violations.length === 0) {
          payload.violations.push({
            id:'sin-violaciones', help:'Sin violaciones', impact:'minor', tags:[],
            url: pageUrl, screenshotName:`sin-violaciones-${folderHint}-${w}x${h}.png`,
            elementoAfectado: context, resultadoActual:'N/A', resultadoEsperado:'Cumplimiento',
          });
          applySpanishToPayload(payload);
          return safeTask('saveA11yResults', payload);
        }

        violations.forEach((v) => {
          const nodes = Array.isArray(v.nodes) ? v.nodes.slice(0, maxNodesPerViolation) : [];
          const list = nodes.length ? nodes : [{ target:[context] }];

          list.forEach((node) => {
            const selector = prettySelector(node.target);
            const key = `${pageKey}::${v.id}::${selector}`;
            if (seen.has(key)) return;

            const shotBase = `${v.id}-${safeSlug(selector)}-${folderHint}-${w}x${h}`;
            cy.get('body').then($b => {
              if ($b.find(selector).length) {
                cy.get(selector).scrollIntoView({ duration: 0 });
                shortStabilize();
                cy.get(selector).screenshot(shotBase, { capture:'viewport' });
              } else {
                cy.screenshot(shotBase, { capture:'viewport' });
              }
            });

            payload.violations.push({
              id: v.id,
              help: v.help,
              description: v.description,
              impact: v.impact,
              tags: v.tags,
              url: pageUrl,
              screenshotName: `${shotBase}.png`,
              elementoAfectado: selector,
              resultadoActual: node.failureSummary || node.html || '',
              resultadoEsperado: v.help || '',
            });

            seen.add(key);
          });
        });

        applySpanishToPayload(payload);
        if (payload.violations.length > 0) safeTask('saveA11yResults', payload);
      });
    });
  });
});



