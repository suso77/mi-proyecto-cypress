// scripts/abrir-informe.js
const fs = require("fs");
const path = require("path");
const cp = require("child_process");

function hoyES() {
  return new Date().toLocaleDateString("es-ES").replace(/\//g, "-"); // DD-MM-YYYY
}

function slugSitio() {
  const raw = (process.env.SITE_URL || "https://www.hiexperience.es")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  return raw;
}

function carpetasDeHoy() {
  const base = path.join("auditorias");
  const today = hoyES();
  const prefer = path.join(base, `${today}-${slugSitio()}`);

  const out = [];
  if (fs.existsSync(prefer)) out.push(prefer);

  if (fs.existsSync(base)) {
    for (const d of fs.readdirSync(base)) {
      if (d.startsWith(today + "-")) {
        const p = path.join(base, d);
        try {
          if (fs.statSync(p).isDirectory() && !out.includes(p)) out.push(p);
        } catch {}
      }
    }
  }
  return out;
}

function candidatosInformes(dir) {
  const files = [];
  for (const name of ["informe-accesibilidad.csv", "informe-accesibilidad.tsv"]) {
    const f = path.join(dir, name);
    if (fs.existsSync(f)) {
      try {
        files.push({ file: f, mtime: fs.statSync(f).mtimeMs });
      } catch {}
    }
  }
  return files;
}

(function main () {
  const dirs = carpetasDeHoy();
  if (!dirs.length) {
    console.log("ℹ️ No hay carpeta de auditoría para hoy todavía.");
    return;
  }

  let best = null;
  for (const dir of dirs) {
    for (const cand of candidatosInformes(dir)) {
      if (!best || cand.mtime > best.mtime) best = cand;
    }
  }

  if (!best) {
    console.log("ℹ️ Aún no existe informe CSV/TSV en las carpetas de hoy.");
    return;
  }

  const opener =
    process.platform === "darwin" ? "open" :
    process.platform === "win32" ? "start" :
    "xdg-open";

  try {
    cp.execSync(`${opener} ${JSON.stringify(best.file)}`, { stdio: "ignore" });
    console.log("✅ Informe abierto:", best.file);
  } catch {
    console.log("⚠️ No se pudo abrir automáticamente. Archivo listo en:", best.file);
  }
})();


