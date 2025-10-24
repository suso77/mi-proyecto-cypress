// cypress/support/commands.js

// --- Heurística segura para abrir menús (NO usa selectores con flags incompatibles de jQuery)
Cypress.Commands.add('openMenusHeuristics', () => {
  // Botones típicos de menú: "menu", "menú", "hamburguesa"...
  const candidates = [
    'button[aria-haspopup="menu"]',
    'button[aria-expanded="false"][aria-controls]',
    '[data-testid*="menu"]',
    '[data-test*="menu"]',
    'button[aria-label]',
  ];

  cy.document().then((doc) => {
    const clickables = [];
    candidates.forEach(sel => {
      doc.querySelectorAll(sel)?.forEach(el => {
        const label = (el.getAttribute('aria-label') || '').toLowerCase();
        if (sel.includes('aria-label')) {
          // filtro manual por texto (evita selector CSS con ` i`)
          if (label.includes('menu') || label.includes('menú') || label.includes('hamburg')) {
            clickables.push(el);
          }
        } else {
          clickables.push(el);
        }
      });
    });

    if (clickables.length) {
      cy.wrap(clickables).each(($btn) => {
        cy.wrap($btn).click({ force: true });
      });
    }
  });
});

// --- Banner de cookies (no falla si no existe)
Cypress.Commands.add('auditCookieBannerThenAccept', () => {
  const selectors = [
    '[id*="cookie"]',
    '[class*="cookie"]',
    '[aria-label*="cookie"]',
    '[role="dialog"]',
  ];

  cy.injectAxe();
  cy.checkA11yReport({ folderHint: 'cookies-pre' });

  cy.document().then((doc) => {
    const acceptLabels = ['accept','agree','consent','acept','consentir','de acuerdo','ok','entendido'];
    let clicked = false;
    selectors.forEach(sel => {
      doc.querySelectorAll(sel)?.forEach(container => {
        if (clicked) return;
        const buttons = container.querySelectorAll('button,[role="button"],a');
        for (const btn of buttons) {
          const txt = (btn.innerText || btn.getAttribute('aria-label') || '').toLowerCase();
          if (acceptLabels.some(k => txt.includes(k))) {
            clicked = true;
            cy.wrap(btn).click({ force: true });
            break;
          }
        }
      });
    });
  });

  cy.checkA11yReport({ folderHint: 'cookies-post' });
});

// --- Modales (audita antes y después)
Cypress.Commands.add('openAndAuditModals', () => {
  cy.injectAxe();
  cy.checkA11yReport({ folderHint: 'modals-pre' });

  // ejemplo genérico: abre posibles modales
  cy.get('button,[role="button"],a').then(($els) => {
    const triggers = [...$els].filter(el => {
      const txt = (el.innerText || el.getAttribute('aria-label') || '').toLowerCase();
      return txt.includes('modal') || txt.includes('abrir');
    });
    if (triggers.length) {
      cy.wrap(triggers[0]).click({ force: true });
      cy.checkA11yReport('[role="dialog"]', { folderHint: 'modal' });
    }
  });

  cy.checkA11yReport({ folderHint: 'modals-post' });
});

// --- iframes same-origin
Cypress.Commands.add('checkA11yInSameOriginIframe', (iframeSelector = 'iframe') => {
  cy.get(iframeSelector).its('0.contentDocument.body').should('not.be.empty');
  cy.get(iframeSelector).then(($iframe) => {
    const body = $iframe[0].contentDocument.body;
    cy.wrap(body).within(() => {
      cy.injectAxe();
      cy.checkA11yReport({ folderHint: 'iframe' });
    });
  });
});

// --- iframes cross-origin (documentación/placeholder)
Cypress.Commands.add('documentCrossOriginIframe', () => {
  // Para iframes cross-origin no se puede inyectar axe directamente.
  // Documenta el hallazgo y, si procede, captura pantalla:
  cy.task('log', '🔒 Iframe cross-origin detectado. Se documenta sin inyectar axe.');
});
