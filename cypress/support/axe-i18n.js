// cypress/support/axe-i18n.js
// ============================================================
// Traducciones ES para resultados de axe-core
// - "Resumen"  -> helpES
// - "Resultado esperado" -> resultadoEsperadoES
// Puedes ampliar los mapas HELP_ES y EXPECTED_ES según necesites.
// ============================================================

/**
 * Mensaje corto y técnico que explica la infracción (Resumen).
 * Clave: id de la regla axe-core.
 */
const HELP_ES = {
  // Perceptible — Contraste, imágenes, multimedia
  "color-contrast": "El contraste entre el texto y su fondo es insuficiente.",
  "image-alt": "Las imágenes relevantes carecen de texto alternativo (atributo alt) o es inadecuado.",
  "image-redundant-alt": "El texto alternativo repite información redundante (p. ej., 'imagen de').",
  "video-caption": "El contenido de vídeo carece de subtítulos.",
  "audio-caption": "El audio carece de alternativa textual o transcripción.",
  "link-name": "El enlace no tiene nombre accesible (texto o aria-label) claro.",
  "button-name": "El botón no tiene nombre accesible.",
  "label": "El control de formulario no tiene etiqueta visible o programática.",
  "form-field-multiple-labels": "El campo de formulario tiene múltiples etiquetas conflictivas.",
  "input-image-alt": "Los botones de tipo imagen carecen de texto alternativo.",
  "frame-title": "El iframe carece de título (title) descriptivo.",

  // Operable — Teclado, navegación, foco
  "focusable-controls": "Los controles interactivos no son focalizables correctamente.",
  "focus-order-semantics": "El orden del foco no sigue una secuencia lógica.",
  "bypass": "Falta un mecanismo para saltar a contenido principal (skip link).",
  "heading-order": "El orden jerárquico de encabezados no es lógico.",
  "landmark-one-main": "Falta una región principal única (<main> o role=\"main\").",
  "landmark-unique": "Hay landmarks duplicados sin nombre único (aria-label/aria-labelledby).",
  "region": "Faltan landmarks que estructuren el contenido (header, main, nav, footer, etc.).",
  "skip-link": "El enlace de salto no funciona o no lleva al contenido principal.",

  // Comprensible — Lengua, títulos, errores
  "document-title": "La página carece de título o no es descriptivo.",
  "html-has-lang": "El elemento <html> no define el idioma principal (lang).",
  "html-lang-valid": "El valor de lang en <html> no es válido.",
  "page-has-heading-one": "Falta un encabezado de nivel 1 (h1) que describa el contenido.",
  "identical-links-same-purpose": "Enlaces con mismo destino tienen nombres diferentes (inconsistencia).",
  "label-content-name-mismatch": "El nombre visible y el accesible del control no coinciden.",
  "aria-allowed-role": "Se está usando un role ARIA no permitido para el elemento.",
  "aria-valid-attr": "Hay atributos ARIA no válidos.",
  "aria-valid-attr-value": "Algún atributo ARIA tiene un valor no válido.",
  "aria-required-attr": "Faltan atributos ARIA obligatorios para el role usado.",
  "aria-required-children": "Faltan hijos ARIA requeridos por el role.",
  "aria-required-parent": "Falta un contenedor ARIA requerido por el role del elemento.",
  "aria-roles": "Se usa un role ARIA no estándar o mal aplicado.",
  "aria-hidden-focus": "Un elemento con aria-hidden='true' puede recibir foco.",
  "aria-input-field-name": "El campo con role='textbox' no tiene nombre accesible.",
  "aria-meter-name": "El medidor (meter) no tiene nombre accesible.",
  "aria-progressbar-name": "La barra de progreso no tiene nombre accesible.",

  // Robustez — Estructura, listas, tablas, IDs
  "duplicate-id": "Hay atributos id duplicados en el documento.",
  "list": "La lista no está construida semánticamente (ul/ol + li).",
  "listitem": "Un elemento de lista no es hijo de una lista o carece de rol apropiado.",
  "dlitem": "Elemento de lista de definición incorrecto (dt/dd).",
  "table-fake": "Se usa tabla para maquetación sin roles/semántica apropiada.",
  "th-has-data-cells": "Celda de encabezado (th) no asocia correctamente celdas de datos.",
  "td-has-header": "Celdas de datos (td) carecen de encabezados asociados.",
  "scope-attr-valid": "Atributo scope no válido o mal aplicado.",

  // Otras frecuentes
  "meta-viewport": "Falta meta viewport o está mal configurado para dispositivos móviles.",
  "server-side-image-map": "Se usan mapas de imagen del lado del servidor, no accesibles.",
  "valid-lang": "Se usa un código de idioma no válido.",
  "heading-level": "Saltos de nivel de encabezado que rompen la jerarquía.",
};

/**
 * Recomendación/resultado esperado breve que indique cómo cumplir (Resultado esperado).
 */
const EXPECTED_ES = {
  "color-contrast": "Asegura una relación de contraste mínima 4.5:1 (texto normal) o 3:1 (texto grande) entre texto y fondo.",
  "image-alt": "Añade alt descriptivo a imágenes informativas; deja alt=\"\" en decorativas.",
  "image-redundant-alt": "Evita prefijos redundantes en alt (p. ej., 'imagen de'); describe directamente el contenido.",
  "video-caption": "Proporciona subtítulos sincronizados para el contenido de vídeo.",
  "audio-caption": "Ofrece transcripción o alternativa textual equivalente para el audio.",
  "link-name": "Proporciona nombre accesible al enlace (texto visible, aria-label o aria-labelledby).",
  "button-name": "Añade texto visible o nombre accesible (aria-label/aria-labelledby) al botón.",
  "label": "Asocia cada control con una etiqueta visible y programática (label for/aria-label).",
  "form-field-multiple-labels": "Usa una única etiqueta fuente de verdad o armoniza varias mediante aria-labelledby.",
  "input-image-alt": "Aporta alt significativo al input de tipo imagen.",
  "frame-title": "Incluye atributo title descriptivo en iframes que indique su propósito.",

  "focusable-controls": "Asegura que los controles interactivos son alcanzables con teclado y reciben foco.",
  "focus-order-semantics": "Ajusta el DOM/orden de tabulación para seguir la lectura visual y semántica.",
  "bypass": "Incluye un enlace 'Saltar al contenido' visible al foco que apunte al contenido principal.",
  "heading-order": "Reestructura los encabezados para mantener la jerarquía (h1>h2>h3...).",
  "landmark-one-main": "Añade un <main> único (o role=\"main\") por página.",
  "landmark-unique": "Nombra landmarks duplicados con aria-label/aria-labelledby para distinguirlos.",
  "region": "Introduce landmarks semánticos (header, nav, main, aside, footer) apropiados.",
  "skip-link": "Asegura que el enlace de salto existe, es visible al foco y apunta a un id válido.",

  "document-title": "Define un <title> único y descriptivo por página.",
  "html-has-lang": "Establece lang en <html> con el idioma principal del documento (p. ej., es, en).",
  "html-lang-valid": "Usa un código BCP 47 válido (p. ej., es, es-ES).",
  "page-has-heading-one": "Incluye un h1 que describa el propósito principal de la página.",
  "identical-links-same-purpose": "Estándariza el nombre accesible para mismo destino; evita ambigüedad.",
  "label-content-name-mismatch": "Haz coincidir el nombre visible y el accesible del control.",
  "aria-allowed-role": "Usa roles ARIA permitidos para el tipo de elemento.",
  "aria-valid-attr": "Usa sólo atributos ARIA válidos según especificación.",
  "aria-valid-attr-value": "Asigna valores válidos a los atributos ARIA según su tipo.",
  "aria-required-attr": "Incluye todos los atributos ARIA requeridos por el role aplicado.",
  "aria-required-children": "Asegura que existen los elementos hijos ARIA requeridos.",
  "aria-required-parent": "Coloca el elemento dentro del contenedor ARIA requerido.",
  "aria-roles": "Corrige o elimina roles ARIA no estándar o mal aplicados.",
  "aria-hidden-focus": "Evita que elementos con aria-hidden='true' puedan recibir foco.",
  "aria-input-field-name": "Proporciona nombre accesible al campo con role='textbox'.",
  "aria-meter-name": "Añade nombre accesible al medidor.",
  "aria-progressbar-name": "Añade nombre accesible a la barra de progreso.",

  "duplicate-id": "Garantiza que cada atributo id del documento sea único.",
  "list": "Construye listas con ul/ol y elementos li correctamente anidados.",
  "listitem": "Asegura que los items de lista sean hijos de una lista (ul/ol) o tengan role adecuado.",
  "dlitem": "Usa dt y dd dentro de dl con estructura correcta.",
  "table-fake": "Evita tablas para maquetación; usa CSS o roles apropiados si procede.",
  "th-has-data-cells": "Relaciona celdas de encabezado (th) con las de datos (td) por scope o headers.",
  "td-has-header": "Asocia cada td con su th por scope o headers.",
  "scope-attr-valid": "Usa scope=\"col\"/\"row\" solo en celdas th donde corresponda.",

  "meta-viewport": "Añade meta viewport adecuado (p. ej., width=device-width, initial-scale=1).",
  "server-side-image-map": "Evita mapas de imagen de servidor; usa soluciones accesibles en cliente.",
  "valid-lang": "Usa un código de idioma BCP 47 válido.",
  "heading-level": "Evita saltos de nivel; sigue la jerarquía de encabezados."
};

/** Mensaje de fallback si no hay traducción específica */
const FALLBACKS = {
  help: "Se ha detectado una infracción de accesibilidad en este elemento.",
  expected: "Ajusta el marcado/estilos para cumplir el criterio WCAG correspondiente."
};

/**
 * Devuelve helpES (resumen) en español para un id de regla.
 * @param {string} id - id de la regla axe
 * @param {string} [helpEn] - texto original de axe (por si quieres mostrarlo como backup)
 */
function helpES(id, helpEn) {
  return HELP_ES[id] || helpEn || FALLBACKS.help;
}

/**
 * Devuelve resultadoEsperadoES (recomendación) en español para un id de regla.
 * @param {string} id - id de la regla axe
 * @param {string} [helpEn] - texto original (opcional, se ignora si hay ES)
 */
function expectedES(id, helpEn) {
  return EXPECTED_ES[id] || FALLBACKS.expected;
}

/**
 * Enriquecer una violación axe con campos ES (mutación ligera).
 * @param {object} v - objeto violation de axe
 * @returns {object} el mismo objeto con helpES y resultadoEsperadoES
 */
function applySpanishToViolation(v) {
  if (!v || typeof v !== "object") return v;
  const id = String(v.id || "").trim();
  const helpEn = v.help || v.description || "";
  v.helpES = helpES(id, helpEn);
  v.resultadoEsperadoES = expectedES(id, helpEn);
  return v;
}

/**
 * Enriquecer un payload de resultados con ES (violations:[]).
 * @param {object} payload - { violations: [...] }
 * @returns {object} payload con violations enriquecidas
 */
function applySpanishToPayload(payload) {
  if (!payload || typeof payload !== "object") return payload;
  if (Array.isArray(payload.violations)) {
    payload.violations = payload.violations.map(applySpanishToViolation);
  }
  return payload;
}

module.exports = {
  helpES,
  expectedES,
  applySpanishToViolation,
  applySpanishToPayload,
  // por si quieres reutilizar/expandir los mapas:
  __HELP_ES: HELP_ES,
  __EXPECTED_ES: EXPECTED_ES
};


