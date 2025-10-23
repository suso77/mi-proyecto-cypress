// scripts/limpiar-auditoria.js
const fs = require("fs");
const path = require("path");

function hoyES() {
  return new Date().toLocaleDateString("es-ES").replace(/\//g, "-"); // DD-MM-YYYY
}

function slugSitio() {
  const raw = (process.env.SITE_URL || "https://www.hiexperience.es")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  return raw;
}

function dirDeHoyPreferido() {
  const base = path.join("auditorias");
  const today = hoyES();
  const prefer = path.join(base, `${today}-${slugSitio()}`);
  if (fs.existsSync(prefer)) return prefer;

  if (!fs.existsSync(base)) return null;
  const candidates = fs.readdirSync(base)
    .filter(d => d.startsWith(today + "-"))
    .map(d => path.join(base, d))
    .filter(p => {
      try { return fs.statSync(p).isDirectory(); } catch { return false; }
    });
  return candidates[0] || null;
}

function borrarSiExiste(file) {
  try {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log("🧹 Eliminado:", file);
      return true;
    }
  } catch (e) {
    console.log("⚠️ No se pudo eliminar:", file, e.message);
  }
  return false;
}

(function main () {
  const isPre = process.argv.includes("--pre");
  const carpeta = dirDeHoyPreferido();

  if (!isPre) {
    console.log("ℹ️ limpiar-auditoria.js sin --pre: no se borra nada.");
    return;
  }

  if (!carpeta) {
    // Crea la carpeta base de hoy si hace falta (por si Cypress aún no lo hizo)
    const base = path.join("auditorias");
    if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true });
    const prefer = path.join(base, `${hoyES()}-${slugSitio()}`);
    if (!fs.existsSync(prefer)) fs.mkdirSync(prefer, { recursive: true });
    console.log("📂 Preparado directorio de hoy:", prefer);
    return;
  }

  // Borra informe de hoy (CSV/TSV) si existiera
  const csv = path.join(carpeta, "informe-accesibilidad.csv");
  const tsv = path.join(carpeta, "informe-accesibilidad.tsv");
  const anyDeleted = borrarSiExiste(csv) | borrarSiExiste(tsv);

  if (!anyDeleted) {
    console.log("ℹ️ No había informe previo que eliminar en:", carpeta);
  }
})();

