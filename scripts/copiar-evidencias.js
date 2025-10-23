/**
 * 🧩 Script para preparar la ejecución de auditoría de accesibilidad con Cypress.
 * - Limpia carpetas de evidencias antiguas
 * - Lanza el test principal con el dominio indicado
 * - Deja listo el entorno para que luego el script limpiar-auditoria.js genere el informe final
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = process.cwd();
const screenshotsDir = path.join(projectRoot, 'cypress', 'screenshots');
const downloadsDir = path.join(projectRoot, 'cypress', 'downloads');
const auditoriasDir = path.join(projectRoot, 'auditorias');

// 🧹 Limpieza de carpetas previas
const cleanFolder = (folder) => {
  if (fs.existsSync(folder)) {
    fs.rmSync(folder, { recursive: true, force: true });
    console.log(`🧹 Limpieza: ${folder} eliminado por completo.`);
  }
};

// Ejecutar limpieza antes de lanzar Cypress
cleanFolder(screenshotsDir);
cleanFolder(downloadsDir);
cleanFolder(auditoriasDir);

// Obtener dominio desde variable de entorno
const siteUrl = process.env.SITE_URL;
if (!siteUrl) {
  console.error('❌ Falta SITE_URL. Ejecuta con: SITE_URL=https://tusitio.com npm run test:evidencias');
  process.exit(1);
}

// 🧭 Ejecutar el test principal
console.log('\n🚀 Ejecutando auditoría de accesibilidad completa...\n');
console.log(`🌐 Dominio a auditar: ${siteUrl}\n`);

try {
  // Pasamos la variable al entorno de Cypress
  execSync(`npx cypress run --spec 'cypress/e2e/accesibilidad-sitemap.cy.js' --env SITE_URL=${siteUrl}`, {
    stdio: 'inherit',
  });
  console.log('\n✅ Auditoría completada con éxito.');
  console.log('🧼 Se ejecutará automáticamente la limpieza y generación del informe final (limpiar-auditoria.js)...');
  console.log('⏳ Espera unos segundos para que se genere el CSV limpio dentro de /auditorias/\n');
} catch (error) {
  console.error('\n❌ Error al ejecutar la auditoría:', error.message);
  process.exit(1);
}
