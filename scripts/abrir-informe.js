// scripts/abrir-informe.js
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function findLatestReportDir(base = "auditorias") {
  if (!fs.existsSync(base)) return null;
  const dirs = fs.readdirSync(base)
    .filter(d => fs.statSync(path.join(base, d)).isDirectory())
    .sort((a,b) => fs.statSync(path.join(base,b)).mtimeMs - fs.statSync(path.join(base,a)).mtimeMs);
  return dirs[0] ? path.join(base, dirs[0]) : null;
}

function openFile(filepath) {
  try {
    if (process.platform === "darwin") {
      execSync(`open "${filepath}"`, { stdio: "ignore" });
    } else if (process.platform === "win32") {
      execSync(`start "" "${filepath}"`, { stdio: "ignore", shell: "cmd.exe" });
    } else {
      execSync(`xdg-open "${filepath}"`, { stdio: "ignore" });
    }
    console.log("📄 Abriendo:", filepath);
  } catch (e) {
    console.log("ℹ️ No se pudo abrir automáticamente. Ruta:", filepath);
  }
}

(function main() {
  const dir = findLatestReportDir();
  if (!dir) {
    console.log("⚠️ No se encontró carpeta de auditorías.");
    return;
  }
  // Preferimos TSV por compatibilidad universal
  const tsv = path.join(dir, "informe-accesibilidad.tsv");
  const csv = path.join(dir, "informe-accesibilidad.csv");
  if (fs.existsSync(tsv)) {
    openFile(tsv);
  } else if (fs.existsSync(csv)) {
    openFile(csv);
  } else {
    console.log("⚠️ No se encontró informe .tsv/.csv en:", dir);
  }
})();










