// ===================================================
// ♿ A11y helpers (menús, cookies, modales, iframes)
// Requiere tener importado en e2e.js:
//   import './commands';
//   import 'cypress-axe';
// ===================================================

// ---- Helpers de evidencia ----
const __sanitize = (s = '') =>
  String(s)
    .replace(/[^\w\-]+/g, '-')   // sólo letras/números/_/-
    .replace(/-+/g, '-')         // colapsa guiones
    .slice(0, 80)                // nombre razonable
    || 'evidencia';

const __ss = (name, opts = {}) => {
  const n = __sanitize(name);
  cy.screenshot(n, { capture: 'viewport', ...opts });
};

// ===================================================
// Menús (hamburguesa/colapsables)
// ===================================================
Cypress.Commands.add('openMenusHeuristics', () => {
  // Evitamos CSS4 ([attr*='x' i]); usamos CSS estándar + heurística de texto/aria.
  const selectors = [
    'button[aria-expanded="false"][aria-controls]',
    'button[aria-label*="menú"],button[aria-label*="menu"]',
    'button[aria-haspopup="true"]',
    '[data-test*="menu"],[data-testid*="menu"]',
    'button.hamburger, .hamburger button, .menu-toggle, .navbar-toggler'
  ];

  cy.log('🔎 Buscando menús colapsables');
  cy.document().then((doc) => {
    let candidates = selectors
      .flatMap(sel => Array.from(doc.querySelectorAll(sel)))
      .filter(el => Cypress.$(el).is(':visible'));

    const textMatch = (el) => {
      const txt = (el.innerText || el.textContent || '').toLowerCase();
      const aria = (el.getAttribute('aria-label') || '').toLowerCase();
      return /menú|menu|hamburg/.test(txt) || /menú|menu|hamburg/.test(aria);
    };

    if (!candidates.length) {
      cy.log('ℹ️ No se detectaron menús colapsables visibles');
      return;
    }

    const prioritized = candidates.filter(el =>
      el.matches('button[aria-expanded][aria-controls],button[aria-haspopup="true"],[data-testid],[data-test]')
    );
    if (prioritized.length) candidates = prioritized;

    if (candidates.length > 6) candidates = candidates.filter(textMatch);

    // Click + log del estado (sin invoke para evitar re-renders)
    candidates.forEach((el, idx) => {
      cy.wrap(el, { log: false }).click({ force: true });
      cy.wait(200);
      cy.wrap(el, { log: false }).then(($btn) => {
        const v = $btn.attr('aria-expanded') || '(sin attr)';
        cy.log(`☰ Menú ${idx + 1} aria-expanded=${v}`);
      });
    });
  });
});

// ===================================================
// Cookies: auditar antes/después y evidencias
// ===================================================
Cypress.Commands.add('auditCookieBannerThenAccept', (options = {}) => {
  const {
    // Selectores SIN modificador " i "
    bannerSel = "[id*='cookie'],[class*='cookie'],[role='dialog']",
    acceptSel = "button:contains('Aceptar'), button:contains('Accept'), [aria-label*='accept'], [data-accept]"
  } = options;

  cy.log('🍪 Auditando banner de cookies (antes de aceptar)');
  cy.get('body').then(($body) => {
    let $cands = $body.find(bannerSel).filter(':visible');

    const $filtered = $cands.filter((_, el) => {
      const role = (el.getAttribute('role') || '').toLowerCase();
      const id = (el.id || '');
      const cls = (el.className || '');
      const hasCookieWord = /cookie/i.test(id + ' ' + cls + ' ' + (el.textContent || ''));
      return hasCookieWord || role === 'dialog';
    });

    if ($filtered.length) {
      const $banner = $filtered.first();

      // 📸 evidencia ANTES
      __ss('cookies--antes-de-aceptar');

      // Audit antes de aceptar
      cy.wrap($banner).then(($bn) => {
        cy.injectAxe();
        cy.checkA11y($bn, null, null, { skipFailures: true });
      });

      // Intentar aceptar
      let $accept = $banner.find(acceptSel).filter(':visible');
      if (!$accept.length) {
        $accept = $banner.find('button, [role="button"]').filter((_, el) => {
          const txt = (el.innerText || el.textContent || '').toLowerCase();
          const aria = (el.getAttribute('aria-label') || '').toLowerCase();
          return /acept|accept/.test(txt) || /acept|accept/.test(aria);
        });
      }

      if ($accept.length) {
        cy.wrap($accept.first()).click({ force: true });
        cy.wait(500);

        // 📸 evidencia DESPUÉS
        __ss('cookies--despues-de-aceptar');

        cy.log('✅ Banner aceptado; re-auditando vista sin banner');
        cy.injectAxe();
        cy.checkA11y(null, null, null, { skipFailures: true });
      } else {
        cy.log('⚠️ No se encontró botón de aceptar en el banner');
      }
    } else {
      cy.log('ℹ️ No se encontró banner de cookies visible');
    }
  });
});

// ===================================================
// Modales: abrir, auditar y evidenciar
// ===================================================
Cypress.Commands.add('openAndAuditModals', () => {
  const openerSelectors = [
    '[data-modal-open]',
    '[data-open-modal]',
    '[aria-haspopup="dialog"]',
    '[aria-controls*="modal"]',
    '.modal-open',
    'button',          // se filtra por texto/aria
    'a[role="button"]'
  ];

  const modalSel = [
    '[role="dialog"]',
    '[role="alertdialog"]',
    '.modal[open]',
    '.modal.show',
    '[aria-modal="true"]'
  ].join(',');

  cy.log('🪟 Abriendo modales y auditando su contenido');

  cy.document().then((doc) => {
    let candidates = openerSelectors
      .flatMap(sel => Array.from(doc.querySelectorAll(sel)))
      .filter(el => Cypress.$(el).is(':visible'));

    const textMatch = (el) => {
      const txt = (el.innerText || el.textContent || '').toLowerCase();
      const aria = (el.getAttribute('aria-label') || '').toLowerCase();
      return /abrir\s*modal|open\s*modal|modal/.test(txt) || /open|modal|abrir/.test(aria);
    };

    const prioritized = candidates.filter(el =>
      el.matches('[aria-haspopup="dialog"],[aria-controls*="modal"],[data-modal-open],[data-open-modal]')
    );
    if (prioritized.length) candidates = prioritized;
    else candidates = candidates.filter(textMatch);

    if (!candidates.length) {
      cy.log('ℹ️ No se detectaron disparadores de modales visibles');
      return;
    }

    candidates.forEach((btn) => {
      cy.wrap(btn).click({ force: true });
      cy.wait(300);

      cy.get('body').within(() => {
        cy.get(modalSel, { timeout: 5000 })
          .first()
          .then($modal => {
            // 📸 evidencia modal abierta
            __ss('modal--abierta');

            cy.injectAxe();
            cy.checkA11y($modal, null, null, { skipFailures: true });

            // 📸 evidencia tras auditoría
            __ss('modal--auditada');

            // Cierre modal
            const closeBtn = $modal.find(
              '[data-modal-close],[aria-label*="cerrar"],[aria-label*="close"],.modal-close,button'
            ).filter((_, el) => {
              const t = (el.innerText || el.textContent || '').toLowerCase();
              const a = (el.getAttribute('aria-label') || '').toLowerCase();
              return /cerrar|close|×/.test(t) || /cerrar|close/.test(a);
            });

            if (closeBtn.length) cy.wrap(closeBtn.first()).click({ force: true });
            else cy.get('body').type('{esc}', { force: true });

            // 📸 evidencia modal cerrada
            __ss('modal--cerrada');
          });
      });
    });
  });
});

// ===================================================
// Iframes
// ===================================================

// Same-origin: NO romper si no existe / no accesible / sin inner selector
Cypress.Commands.add('checkA11yInSameOriginIframe', (iframeSelector, innerSelector = 'body') => {
  cy.document().then((doc) => {
    const iframe = doc.querySelector(iframeSelector);
    if (!iframe) {
      cy.log(`ℹ️ same-origin iframe no encontrado: ${iframeSelector}`);
      return; // no falla el test
    }

    const idoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!idoc) {
      cy.log(`⚠️ No se pudo acceder al documento del iframe: ${iframeSelector}`);
      return;
    }

    const target = idoc.querySelector(innerSelector);
    if (!target) {
      cy.log(`⚠️ Selector interno no encontrado en iframe: ${innerSelector}`);
      return;
    }

    // Inyecta axe en el documento del iframe
    const script = idoc.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js';
    idoc.head.appendChild(script);

    return new Cypress.Promise((resolve) => {
      script.onload = () => resolve();
      setTimeout(resolve, 1500);
    }).then(() => {
      // Ejecutar axe directamente en el contexto del iframe
      // @ts-ignore
      iframe.contentWindow.axe.run(target, {}, (err, results = { violations: [] }) => {
        if (err) {
          cy.log(`⚠️ axe.run error en iframe: ${err?.message || err}`);
          return;
        }
        cy.log(`iframe a11y: ${results.violations.length} violations`);

        // 📸 evidencia del iframe auditado
        const short = __sanitize(`${iframeSelector}--${innerSelector}`);
        __ss(`iframe-same-origin--${short}`);
      });
    });
  });
});

// Cross-origin: documentar exclusión + screenshot (no romper si no hay iframe)
Cypress.Commands.add('documentCrossOriginIframe', (iframeSelector) => {
  cy.document().then((doc) => {
    const iframe = doc.querySelector(iframeSelector);
    if (!iframe) {
      cy.log(`ℹ️ iframe cross-origin no encontrado: ${iframeSelector}`);
      return;
    }
    const src = iframe.getAttribute('src') || '';
    cy.log(`🌐 Iframe cross-origin detectado: ${src}`);
    const host = (() => { try { return new URL(src).host; } catch { return 'desconocido'; } })();
    __ss(`iframe-cross-origin--${host}`);
  });
});
