// cypress/support/wcag-map.js
// ======================================================================
// WCAG_MAP  ..........  "wcagNNN" -> [ "X.Y.Z Título (Nivel)", URL W3C Understanding ]
// AXE_RULE_TO_WCAG ....  "axeRuleId" -> [ "X.Y.Z Título (Nivel)", URL ]
// getWcagForAxe(id) ...  helper para obtener el par [etiqueta, url]
// ----------------------------------------------------------------------
// Cobertura “mínimo útil pero amplia”: mapea las reglas de axe-core más
// habituales para informes profesionales. Puedes ampliar sin romper nada.
// ======================================================================

/** Utilidad interna para crear URLs de Understanding WCAG */
const U = (short, series = "WCAG22") =>
  `https://www.w3.org/WAI/${series}/Understanding/${short}.html`;

/** Etiquetas cómodas en ES (nivel aproximado indicado) */
const L = {
  "1.1.1": '1.1.1 Contenido no textual (A)',
  "1.2.2": '1.2.2 Subtítulos (grabado) (A)',
  "1.3.1": '1.3.1 Información y relaciones (A)',
  "1.3.2": '1.3.2 Secuencia significativa (A)',
  "1.3.3": '1.3.3 Características sensoriales (A)',
  "1.3.5": '1.3.5 Identificación del propósito de entrada (AA)',
  "1.4.1": '1.4.1 Uso del color (A)',
  "1.4.3": '1.4.3 Contraste (mínimo) (AA)',
  "1.4.4": '1.4.4 Redimensionar texto (AA)',
  "1.4.10": '1.4.10 Reflujo (AA)',
  "1.4.11": '1.4.11 Contraste no textual (AA)',
  "1.4.12": '1.4.12 Espaciado del texto (AA)',
  "1.4.13": '1.4.13 Contenido al pasar el puntero o al enfocarlo (AA)',

  "2.1.1": '2.1.1 Teclado (A)',
  "2.1.2": '2.1.2 Sin trampas para el foco (A)',
  "2.1.4": '2.1.4 Atajos de teclado (A)',
  "2.2.1": '2.2.1 Tiempo ajustable (A)',
  "2.2.2": '2.2.2 Poner en pausa, detener, ocultar (A)',
  "2.4.1": '2.4.1 Evitar bloques (A)',
  "2.4.2": '2.4.2 Título de página (A)',
  "2.4.3": '2.4.3 Orden del foco (A)',
  "2.4.4": '2.4.4 Propósito de los enlaces (en contexto) (A)',
  "2.4.6": '2.4.6 Encabezados y etiquetas (AA)',
  "2.4.7": '2.4.7 Foco visible (AA)',
  "2.4.10": '2.4.10 Títulos de sección (AAA)',
  "2.4.11": '2.4.11 Apariencia del foco (mínima) (AA)',
  "2.4.12": '2.4.12 No ocultar el foco (AA)',
  "2.4.13": '2.4.13 Punto de referencia del foco (AA)',

  "2.5.1": '2.5.1 Gestos con puntero (A)',
  "2.5.3": '2.5.3 Inclusión de la etiqueta en el nombre (A)',
  "2.5.5": '2.5.5 Tamaño del objetivo (AAA)',
  "2.5.7": '2.5.7 Arrastre de puntero (AA)',
  "2.5.8": '2.5.8 Tamaño del objetivo (mínimo) (AA)',

  "3.1.1": '3.1.1 Idioma de la página (A)',
  "3.1.2": '3.1.2 Idioma de las partes (AA)',
  "3.2.1": '3.2.1 Al recibir foco (A)',
  "3.2.2": '3.2.2 Al recibir entradas (A)',
  "3.2.6": '3.2.6 Ayuda coherente (A)',
  "3.3.1": '3.3.1 Identificación de errores (A)',
  "3.3.2": '3.3.2 Etiquetas o instrucciones (A)',
  "3.3.3": '3.3.3 Sugerencias ante errores (AA)',
  "3.3.4": '3.3.4 Prevención de errores (AA)',

  "4.1.1": '4.1.1 Procesamiento (A)',
  "4.1.2": '4.1.2 Nombre, función, valor (A)',
  "4.1.3": '4.1.3 Mensajes de estado (AA)',
};

/** Mapa de criterios WCAG por código corto "wcagNNN" (para when tags usan wcag111, wcag1411, etc.) */
const WCAG_MAP = {
  // 1.x Perceptible
  wcag111: [L["1.1.1"], U("non-text-content")],
  wcag122: [L["1.2.2"], U("captions-prerecorded")],
  wcag131: [L["1.3.1"], U("info-and-relationships")],
  wcag132: [L["1.3.2"], U("meaningful-sequence")],
  wcag133: [L["1.3.3"], U("sensory-characteristics")],
  wcag135: [L["1.3.5"], U("identify-input-purpose")],
  wcag141: [L["1.4.1"], U("use-of-color")],
  wcag143: [L["1.4.3"], U("contrast-minimum")],
  wcag144: [L["1.4.4"], U("resize-text")],
  wcag1410: [L["1.4.10"], U("reflow")],
  wcag1411: [L["1.4.11"], U("non-text-contrast")],
  wcag1412: [L["1.4.12"], U("text-spacing")],
  wcag1413: [L["1.4.13"], U("content-on-hover-or-focus")],

  // 2.x Operable
  wcag211: [L["2.1.1"], U("keyboard")],
  wcag212: [L["2.1.2"], U("no-keyboard-trap")],
  wcag214: [L["2.1.4"], U("character-key-shortcuts")],
  wcag221: [L["2.2.1"], U("timing-adjustable")],
  wcag222: [L["2.2.2"], U("pause-stop-hide")],
  wcag241: [L["2.4.1"], U("bypass-blocks")],
  wcag242: [L["2.4.2"], U("page-titled")],
  wcag243: [L["2.4.3"], U("focus-order")],
  wcag244: [L["2.4.4"], U("link-purpose-in-context")],
  wcag246: [L["2.4.6"], U("headings-and-labels")],
  wcag247: [L["2.4.7"], U("focus-visible")],
  wcag2410: [L["2.4.10"], U("section-headings")],
  wcag2411: [L["2.4.11"], U("focus-appearance-minimum")],
  wcag2412: [L["2.4.12"], U("focus-not-obscured-minimum")],
  wcag2413: [L["2.4.13"], U("focus-appearance")],

  // 2.5
  wcag251: [L["2.5.1"], U("pointer-gestures")],
  wcag253: [L["2.5.3"], U("label-in-name")],
  wcag255: [L["2.5.5"], U("target-size-enhanced")],
  wcag257: [L["2.5.7"], U("dragging-movements")],
  wcag258: [L["2.5.8"], U("target-size")],

  // 3.x Comprensible
  wcag311: [L["3.1.1"], U("language-of-page")],
  wcag312: [L["3.1.2"], U("language-of-parts")],
  wcag321: [L["3.2.1"], U("on-focus")],
  wcag322: [L["3.2.2"], U("on-input")],
  wcag326: [L["3.2.6"], U("consistent-help")],
  wcag331: [L["3.3.1"], U("error-identification")],
  wcag332: [L["3.3.2"], U("labels-or-instructions")],
  wcag333: [L["3.3.3"], U("error-suggestion")],
  wcag334: [L["3.3.4"], U("error-prevention-legal-financial-data")],

  // 4.x Robustez
  wcag411: [L["4.1.1"], U("parsing", "WCAG21")], // en WCAG 2.2 se desaconseja, se referencia a 2.1 Understanding
  wcag412: [L["4.1.2"], U("name-role-value")],
  wcag413: [L["4.1.3"], U("status-messages")]
};

// ----------------------------------------------------------------------
// Mapeo de reglas axe-core -> criterio principal WCAG (etiqueta + URL)
// (lista ampliable sin romper; cubre las más frecuentes/problema real)
// ----------------------------------------------------------------------
const AXE_RULE_TO_WCAG = {
  // Perceptible
  "image-alt": [L["1.1.1"], U("non-text-content")],
  "area-alt": [L["1.1.1"], U("non-text-content")],
  "input-image-alt": [L["1.1.1"], U("non-text-content")],
  "image-redundant-alt": [L["1.1.1"], U("non-text-content")],

  "video-caption": [L["1.2.2"], U("captions-prerecorded")],
  "audio-caption": [L["1.2.2"], U("captions-prerecorded")],

  "label": [L["1.3.1"], U("info-and-relationships")],
  "form-field-multiple-labels": [L["1.3.1"], U("info-and-relationships")],
  "list": [L["1.3.1"], U("info-and-relationships")],
  "listitem": [L["1.3.1"], U("info-and-relationships")],
  "dlitem": [L["1.3.1"], U("info-and-relationships")],
  "table-fake": [L["1.3.1"], U("info-and-relationships")],
  "th-has-data-cells": [L["1.3.1"], U("info-and-relationships")],
  "td-has-header": [L["1.3.1"], U("info-and-relationships")],
  "scope-attr-valid": [L["1.3.1"], U("info-and-relationships")],
  "heading-order": [L["1.3.2"], U("meaningful-sequence")],
  "heading-level": [L["1.3.2"], U("meaningful-sequence")],

  "color-contrast": [L["1.4.3"], U("contrast-minimum")],
  "contrast": [L["1.4.3"], U("contrast-minimum")], // alias antiguo
  "image-text-contrast": [L["1.4.3"], U("contrast-minimum")],
  "non-text-contrast": [L["1.4.11"], U("non-text-contrast")],
  "text-spacing": [L["1.4.12"], U("text-spacing")],
  "content-on-hover": [L["1.4.13"], U("content-on-hover-or-focus")],
  "meta-viewport": [L["1.4.10"], U("reflow")], // ancho fijo/no escalable

  // Operable
  "bypass": [L["2.4.1"], U("bypass-blocks")],
  "document-title": [L["2.4.2"], U("page-titled")],
  "focus-order-semantics": [L["2.4.3"], U("focus-order")],
  "link-name": [L["4.1.2"], U("name-role-value")], // también incide en 2.4.4, pero principal NRV
  "button-name": [L["4.1.2"], U("name-role-value")],
  "skip-link": [L["2.4.1"], U("bypass-blocks")],
  "landmark-one-main": [L["2.4.1"], U("bypass-blocks")],
  "landmark-unique": [L["2.4.1"], U("bypass-blocks")],
  "region": [L["2.4.1"], U("bypass-blocks")],
  "focusable-controls": [L["2.1.1"], U("keyboard")],
  "aria-hidden-focus": [L["2.4.7"], U("focus-visible")], // conflicto foco/visibilidad
  "target-size": [L["2.5.8"], U("target-size")], // WCAG 2.2 (mínimo)

  // Comprensible
  "html-has-lang": [L["3.1.1"], U("language-of-page")],
  "html-lang-valid": [L["3.1.1"], U("language-of-page")],
  "valid-lang": [L["3.1.1"], U("language-of-page")],
  "page-has-heading-one": [L["2.4.10"], U("section-headings")], // título seccional (AAA)
  "identical-links-same-purpose": [L["2.4.4"], U("link-purpose-in-context")],
  "label-content-name-mismatch": [L["2.5.3"], U("label-in-name")],

  // ARIA / Robustez
  "aria-allowed-role": [L["4.1.2"], U("name-role-value")],
  "aria-roles": [L["4.1.2"], U("name-role-value")],
  "aria-valid-attr": [L["4.1.2"], U("name-role-value")],
  "aria-valid-attr-value": [L["4.1.2"], U("name-role-value")],
  "aria-required-attr": [L["4.1.2"], U("name-role-value")],
  "aria-required-children": [L["4.1.2"], U("name-role-value")],
  "aria-required-parent": [L["4.1.2"], U("name-role-value")],
  "aria-input-field-name": [L["4.1.2"], U("name-role-value")],
  "aria-meter-name": [L["4.1.2"], U("name-role-value")],
  "aria-progressbar-name": [L["4.1.2"], U("name-role-value")],
  "duplicate-id": [L["4.1.1"], U("parsing", "WCAG21")], // Parsing (referencia WCAG 2.1)
  "frame-title": [L["2.4.2"], U("page-titled")] // título/propósito de iframes
};

/**
 * Devuelve [etiqueta, url] del criterio WCAG para una regla de axe.
 * Si no hay mapeo, retorna null.
 * @param {string} axeId
 * @returns {[string,string] | null}
 */
function getWcagForAxe(axeId) {
  return AXE_RULE_TO_WCAG[axeId] || null;
}

module.exports = {
  WCAG_MAP,
  AXE_RULE_TO_WCAG,
  getWcagForAxe
};
