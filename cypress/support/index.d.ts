/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    a11yEvidenceShot(options: {
      ruleId: string;
      selector?: string;
      pageUrl?: string;
      fileBase?: string;
      fullPageFallback?: boolean;
      hideSticky?: boolean;
    }): Chainable<string>;
    disableAnimationsAndSmooth(): Chainable<void>;
    waitForNetworkIdle(idleMs?: number, maxWaitMs?: number): Chainable<void>;
    ensureA11yReady(opts?: { idleMs?: number; maxWaitMs?: number; postScrollWait?: number }): Chainable<void>;
  }
}

