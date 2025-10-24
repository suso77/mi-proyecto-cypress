// cypress.config.js
const { defineConfig } = require('cypress');
const fs = require('fs');
const path = require('path');

function todayFolderFor(baseUrl) {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const host = (new URL(baseUrl || 'http://localhost')).host.replace(/[:/\\]/g, '-');
  return path.join('auditorias', `${dd}-${mm}-${yyyy}-${host}`);
}

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_baseUrl || process.env.SITE_URL || 'https://www.hiexperience.es',
    video: false,
    defaultCommandTimeout: 15000,
    pageLoadTimeout: 120000,

    setupNodeEvents(on, config) {
      on('task', {
        // ----- LOG -----
        log(msg) {
          const text = typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2);
          console.log('[task:log]', text);
          return null; // siempre devolver algo
        },

        // ----- RESET CARPETA DE HOY -----
        resetTodayReport() {
          const folder = todayFolderFor(config.baseUrl);
          if (fs.existsSync(folder)) {
            fs.rmSync(folder, { recursive: true, force: true });
          }
          console.log('[task:resetTodayReport] Eliminada carpeta', path.resolve(folder));
          return true;
        },

        // ----- PREPARAR CARPETA/ARCHIVOS -----
        'a11y:prepareTodayReport'() {
          const folder = todayFolderFor(config.baseUrl);
          const csvPath = path.join(folder, 'informe.csv');
          const mdPath  = path.join(folder, 'informe.md');
          fs.mkdirSync(folder, { recursive: true });

          const sep =
            process.env.CSV_MODE === 'excel' ? ';' :
            process.env.CSV_MODE === 'tsv'   ? '\t' : ',';

          if (!fs.existsSync(csvPath)) {
            const header = [
              'url','id','impact','description','help','helpUrl','selector','html','failureSummary'
            ].join(sep) + '\n';
            fs.writeFileSync(csvPath, header);
          }
          if (!fs.existsSync(mdPath)) {
            fs.writeFileSync(mdPath, `# Informe A11y – ${new Date().toLocaleString()}\n\n`);
          }

          console.log('[task:prepareTodayReport] Carpeta:', path.resolve(folder));
          return { folder, csv: csvPath, md: mdPath };
        },

        // ----- APPEND CSV -----
        'a11y:appendCsv'(rows) {
          const folder = todayFolderFor(config.baseUrl);
          const csvPath = path.join(folder, 'informe.csv');
          fs.mkdirSync(folder, { recursive: true });

          const sep =
            process.env.CSV_MODE === 'excel' ? ';' :
            process.env.CSV_MODE === 'tsv'   ? '\t' : ',';

          const lines = rows.map(r => [
            r.url, r.id, r.impact, r.description, r.help, r.helpUrl,
            (r.selector || '').replace(/[\r\n]+/g, ' '),
            (r.html || '').replace(/[\r\n]+/g, ' '),
            (r.failureSummary || '').replace(/[\r\n]+/g, ' ')
          ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(sep)).join('\n');

          fs.appendFileSync(csvPath, lines + '\n');
          return true;
        },

        // ----- APPEND MARKDOWN -----
        'a11y:appendMd'(markdown) {
          const folder = todayFolderFor(config.baseUrl);
          const mdPath = path.join(folder, 'informe.md');
          fs.mkdirSync(folder, { recursive: true });
          fs.appendFileSync(mdPath, markdown);
          return true;
        },
      });

      return config;
    },
  },
});


