/// <reference types="cypress" />

describe("🧪 Debug axe-core injection", () => {
  it("Comprueba si axe-core se inyecta correctamente", () => {
    const url = "https://www.hiexperience.es";

    cy.visit(url, { failOnStatusCode: false })
      .then(() => cy.readFile("node_modules/axe-core/axe.min.js"))
      .then((axeSource) =>
        cy.window().then((win) => {
          try {
            win.eval(axeSource);
            cy.log("✅ axe.min.js evaluado correctamente");
          } catch (e) {
            cy.log(`❌ Error al evaluar axe.min.js: ${e.message}`);
          }

          cy.log(`🧩 typeof win.axe = ${typeof win.axe}`);
          cy.log(`🧩 typeof win.axe.run = ${win.axe ? typeof win.axe.run : "undefined"}`);

          if (win.axe && typeof win.axe.run === "function") {
            cy.log("✅ axe-core cargado correctamente, ejecutando test rápido...");
            return win.axe.run(win.document).then((results) => {
              cy.log(`Violaciones encontradas: ${results.violations.length}`);
            });
          } else {
            cy.log("⚠️ axe-core NO se cargó en la página.");
          }
        })
      );
  });
});
