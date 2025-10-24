// cypress/support/wcag-map.js
// ======================================================
// WCAG_MAP + AXE_RULE_TO_WCAG + HELP_ES + EXPECTED_ES
// + helpers para devolver criterio completo (code+title+url)
// ======================================================

// ------------------------------------------------------
// WCAG_MAP
// Claves: tags axe como "wcag111", "wcag131", "wcag22aa"…
// Valor: [ "N.N.N Título en español" o “WCAG 2.x Nivel Y”, "https://..." ]
// ------------------------------------------------------
const WCAG_MAP = {
  // Nivel global por versión/nivel (contexto)
  wcag2a:  ["WCAG 2.0 Nivel A", "https://www.w3.org/TR/WCAG20/"],
  wcag2aa: ["WCAG 2.0 Nivel AA", "https://www.w3.org/TR/WCAG20/"],
  wcag21a: ["WCAG 2.1 Nivel A", "https://www.w3.org/TR/WCAG21/"],
  wcag21aa:["WCAG 2.1 Nivel AA", "https://www.w3.org/TR/WCAG21/"],
  wcag22a: ["WCAG 2.2 Nivel A", "https://www.w3.org/TR/WCAG22/"],
  wcag22aa:["WCAG 2.2 Nivel AA", "https://www.w3.org/TR/WCAG22/"],

  // 1.1 Perceptible
  wcag111: ["1.1.1 Contenido no textual", "https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html"],

  // 1.3 Adaptable
  wcag131: ["1.3.1 Información y relaciones", "https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html"],
  wcag132: ["1.3.2 Secuencia significativa", "https://www.w3.org/WAI/WCAG21/Understanding/meaningful-sequence.html"],
  wcag133: ["1.3.3 Características sensoriales", "https://www.w3.org/WAI/WCAG21/Understanding/sensory-characteristics.html"],

  // 1.4 Distinguible
  wcag141:  ["1.4.1 Uso del color", "https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html"],
  wcag142:  ["1.4.2 Control del audio", "https://www.w3.org/WAI/WCAG21/Understanding/audio-control.html"],
  wcag143:  ["1.4.3 Contraste (mínimo)", "https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html"],
  wcag144:  ["1.4.4 Redimensionar texto", "https://www.w3.org/WAI/WCAG21/Understanding/resize-text.html"],
  wcag145:  ["1.4.5 Imágenes de texto", "https://www.w3.org/WAI/WCAG21/Understanding/images-of-text.html"],
  wcag1410: ["1.4.10 Reflujo", "https://www.w3.org/WAI/WCAG21/Understanding/reflow.html"],
  wcag1411: ["1.4.11 Contraste no textual", "https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html"],
  wcag1412: ["1.4.12 Espaciado del texto", "https://www.w3.org/WAI/WCAG21/Understanding/text-spacing.html"],
  wcag1413: ["1.4.13 Contenido al pasar el puntero o tener el foco", "https://www.w3.org/WAI/WCAG21/Understanding/content-on-hover-or-focus.html"],

  // 2.1 Accesible por teclado
  wcag211: ["2.1.1 Teclado", "https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html"],
  wcag212: ["2.1.2 Sin trampa para el foco del teclado", "https://www.w3.org/WAI/WCAG21/Understanding/no-keyboard-trap.html"],
  wcag214: ["2.1.4 Atajos del teclado", "https://www.w3.org/WAI/WCAG21/Understanding/character-key-shortcuts.html"],

  // 2.2 Tiempo suficiente
  wcag221: ["2.2.1 Tiempo ajustable", "https://www.w3.org/WAI/WCAG21/Understanding/timing-adjustable.html"],
  wcag222: ["2.2.2 Pausar, detener, ocultar", "https://www.w3.org/WAI/WCAG21/Understanding/pause-stop-hide.html"],

  // 2.3 Convulsiones y reacciones físicas
  wcag231: ["2.3.1 Tres destellos o menos", "https://www.w3.org/WAI/WCAG21/Understanding/three-flashes-or-below-threshold.html"],

  // 2.4 Navegable
  wcag241: ["2.4.1 Evitar bloques", "https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html"],
  wcag242: ["2.4.2 Títulos de página", "https://www.w3.org/WAI/WCAG21/Understanding/page-titled.html"],
  wcag243: ["2.4.3 Orden del foco", "https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html"],
  wcag244: ["2.4.4 Propósito de los enlaces (en contexto)", "https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context.html"],
  wcag246: ["2.4.6 Encabezados y etiquetas", "https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels.html"],
  wcag247: ["2.4.7 Foco visible", "https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html"],

  // 2.5 Modalidades de entrada
  wcag251: ["2.5.1 Gestos con el puntero", "https://www.w3.org/WAI/WCAG21/Understanding/pointer-gestures.html"],
  wcag252: ["2.5.2 Cancelación del puntero", "https://www.w3.org/WAI/WCAG21/Understanding/pointer-cancellation.html"],
  wcag253: ["2.5.3 Inclusión de la entrada de movimiento", "https://www.w3.org/WAI/WCAG21/Understanding/label-in-name.html"],
  wcag254: ["2.5.4 Activación por movimiento", "https://www.w3.org/WAI/WCAG21/Understanding/motion-actuation.html"],

  // 2.4.* (novedades 2.2)
  wcag2411: ["2.4.11 Foco no oculto (mínimo)", "https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html"],
  wcag2412: ["2.4.12 Foco no oculto (mejorado)", "https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-enhanced.html"],
  wcag2413: ["2.4.13 Apariencia del foco", "https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html"],

  // 2.5.* (novedades 2.2)
  wcag257: ["2.5.7 Movimientos de arrastre", "https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html"],
  wcag258: ["2.5.8 Tamaño del objetivo (mínimo)", "https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html"],

  // 3.1 Comprensible: legibilidad
  wcag311: ["3.1.1 Idioma de la página", "https://www.w3.org/WAI/WCAG21/Understanding/language-of-page.html"],
  wcag312: ["3.1.2 Idioma de las partes", "https://www.w3.org/WAI/WCAG21/Understanding/language-of-parts.html"],

  // 3.2 Predecible
  wcag321: ["3.2.1 Al recibir el foco", "https://www.w3.org/WAI/WCAG21/Understanding/on-focus.html"],
  wcag322: ["3.2.2 Al introducir datos", "https://www.w3.org/WAI/WCAG21/Understanding/on-input.html"],
  wcag323: ["3.2.3 Navegación coherente", "https://www.w3.org/WAI/WCAG21/Understanding/consistent-navigation.html"],
  wcag324: ["3.2.4 Identificación coherente", "https://www.w3.org/WAI/WCAG21/Understanding/consistent-identification.html"],
  wcag326: ["3.2.6 Ayuda coherente", "https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html"],

  // 3.3 Asistencia de entrada
  wcag331: ["3.3.1 Identificación de errores", "https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html"],
  wcag332: ["3.3.2 Etiquetas o instrucciones", "https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html"],
  wcag333: ["3.3.3 Sugerencias ante errores", "https://www.w3.org/WAI/WCAG21/Understanding/error-suggestion.html"],
  wcag334: ["3.3.4 Prevención de errores (legal, financiero, datos)", "https://www.w3.org/WAI/WCAG21/Understanding/error-prevention-legal-financial-data.html"],
  wcag337: ["3.3.7 Entrada redundante", "https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html"],
  wcag338: ["3.3.8 Autenticación accesible (mínimo)", "https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html"],

  // 4.1 Compatible
  wcag411: ["4.1.1 Procesamiento", "https://www.w3.org/WAI/WCAG21/Understanding/parsing.html"],
  wcag412: ["4.1.2 Nombre, función, valor", "https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html"],
  wcag413: ["4.1.3 Mensajes de estado", "https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html"],
};

// ------------------------------------------------------
// AXE_RULE_TO_WCAG: regla de axe -> [“N.N.N Título ES”, URL]
// ------------------------------------------------------
const AXE_RULE_TO_WCAG = {
  // Texto/Contraste
  "color-contrast":    ["1.4.3 Contraste (mínimo)", "https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html"],
  "non-text-contrast": ["1.4.11 Contraste no textual", "https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html"],
  "text-spacing":      ["1.4.12 Espaciado del texto", "https://www.w3.org/WAI/WCAG21/Understanding/text-spacing.html"],

  // Alternativas textuales
  "image-alt":           ["1.1.1 Contenido no textual", "https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html"],
  "input-image-alt":     ["1.1.1 Contenido no textual", "https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html"],
  "image-redundant-alt": ["1.1.1 Contenido no textual", "https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html"],
  "area-alt":            ["1.1.1 Contenido no textual", "https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html"],

  // Estructura/semántica
  "heading-order":     ["2.4.6 Encabezados y etiquetas", "https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels.html"],
  "empty-heading":     ["2.4.6 Encabezados y etiquetas", "https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels.html"],
  "region":            ["1.3.1 Información y relaciones", "https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html"],
  "landmark-one-main": ["1.3.1 Información y relaciones", "https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html"],
  "landmark-unique":   ["1.3.1 Información y relaciones", "https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html"],
  "duplicate-id":      ["4.1.1 Procesamiento", "https://www.w3.org/WAI/WCAG21/Understanding/parsing.html"],

  // Idioma/Título
  "document-title":         ["2.4.2 Títulos de página", "https://www.w3.org/WAI/WCAG21/Understanding/page-titled.html"],
  "frame-title":            ["2.4.2 Títulos de página", "https://www.w3.org/WAI/WCAG21/Understanding/page-titled.html"],
  "html-has-lang":          ["3.1.1 Idioma de la página", "https://www.w3.org/WAI/WCAG21/Understanding/language-of-page.html"],
  "html-xml-lang-mismatch": ["3.1.2 Idioma de las partes", "https://www.w3.org/WAI/WCAG21/Understanding/language-of-parts.html"],

  // Enlaces/Nombre accesible
  "link-name":             ["2.4.4 Propósito de los enlaces (en contexto)", "https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context.html"],
  "aria-input-field-name": ["4.1.2 Nombre, función, valor", "https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html"],

  // ARIA (roles/propiedades/estados)
  "aria-allowed-role":       ["4.1.2 Nombre, función, valor", "https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html"],
  "aria-roles":              ["4.1.2 Nombre, función, valor", "https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html"],
  "aria-required-attr":      ["4.1.2 Nombre, función, valor", "https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html"],
  "aria-required-children":  ["4.1.2 Nombre, función, valor", "https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html"],
  "aria-required-parent":    ["4.1.2 Nombre, función, valor", "https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html"],
  "aria-valid-attr":         ["4.1.2 Nombre, función, valor", "https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html"],
  "aria-valid-attr-value":   ["4.1.2 Nombre, función, valor", "https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html"],
  "aria-hidden-focus":       ["2.4.3 Orden del foco", "https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html"],
  "presentation-role-conflict": ["1.3.1 Información y relaciones", "https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html"],

  // Teclado/Foco
  "tabindex":              ["2.4.3 Orden del foco", "https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html"],
  "focus-order-semantics": ["2.4.3 Orden del foco", "https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html"],
  "skip-link":             ["2.4.1 Evitar bloques", "https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html"],

  // Formularios/labels
  "label":                       ["3.3.2 Etiquetas o instrucciones", "https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html"],
  "form-field-multiple-labels":  ["3.3.2 Etiquetas o instrucciones", "https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html"],
  "autocomplete-valid":          ["1.3.5 Identificación del propósito de la entrada (advisory)", "https://www.w3.org/WAI/WCAG21/Understanding/identify-input-purpose.html"],

  // Mobile/zoom
  "meta-viewport":         ["1.4.4 Redimensionar texto", "https://www.w3.org/WAI/WCAG21/Understanding/resize-text.html"],

  // 2.5.8 Target size
  "target-size":           ["2.5.8 Tamaño del objetivo (mínimo)", "https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html"],
};

// ------------------------------------------------------
// HELP_ES y EXPECTED_ES (igual que ya tenías)
// ------------------------------------------------------
const HELP_ES = {
  "color-contrast": "El contraste entre el texto y el fondo es insuficiente. Aumenta el contraste para cumplir 1.4.3.",
  "non-text-contrast": "Controles, iconos o gráficos carecen de contraste suficiente con el fondo (1.4.11).",
  "image-alt": "Las imágenes deben tener texto alternativo que describa su propósito (1.1.1).",
  "image-redundant-alt": "Evita textos alternativos redundantes como 'imagen de...'.",
  "input-image-alt": "Los botones de tipo imagen requieren alt que describa la acción.",
  "area-alt": "Las áreas de mapas de imagen requieren alt para describir su destino o propósito.",
  "link-name": "Los enlaces deben tener un nombre accesible que describa su propósito (texto o aria-label).",
  "heading-order": "Mantén una jerarquía correcta de encabezados (h1, h2, h3...) sin saltos ilógicos.",
  "empty-heading": "Evita encabezados vacíos; úsalos sólo para estructurar contenido.",
  "document-title": "Cada página debe tener un título descriptivo y único.",
  "frame-title": "Los iframes necesitan un título que describa su contenido.",
  "html-has-lang": "Define el idioma principal del documento en <html lang=\"...\">.",
  "html-xml-lang-mismatch": "El lang de HTML y xml:lang deben coincidir si ambos se usan.",
  "aria-allowed-role": "No asignes roles ARIA no permitidos para ese elemento.",
  "aria-required-attr": "Faltan atributos ARIA obligatorios para el rol usado.",
  "aria-required-children": "Faltan elementos hijos requeridos por el rol ARIA.",
  "aria-required-parent": "El elemento con rol ARIA debe estar dentro de un contenedor padre requerido.",
  "aria-roles": "Usa roles ARIA válidos y estandarizados.",
  "aria-hidden-focus": "No ocultes con aria-hidden elementos que pueden recibir foco.",
  "presentation-role-conflict": "No uses role=\"presentation\"/\"none\" en elementos interactivos o con hijos requeridos.",
  "region": "Usa landmarks de forma coherente para estructurar regiones (main, nav, header...).",
  "landmark-one-main": "Debe existir una región main única por página.",
  "landmark-unique": "Cada landmark debe ser única o tener un nombre único (aria-label/aria-labelledby).",
  "skip-link": "Incluye un enlace para saltar al contenido principal y hazlo visible al enfocar.",
  "duplicate-id": "Los atributos id deben ser únicos en la página.",
  "label": "Cada control de formulario necesita etiqueta visible o nombre accesible.",
  "form-field-multiple-labels": "Evita múltiples etiquetas que confundan el nombre accesible de un campo.",
  "autocomplete-valid": "Usa valores de autocomplete válidos para mejorar la asistencia al usuario.",
  "meta-viewport": "No desactives el zoom; permite escalado del viewport para mejorar legibilidad.",
  "focus-order-semantics": "El orden del foco debe seguir el orden visual y semántico.",
  "tabindex": "Evita tabindex positivos; usa orden natural del DOM y tabindex=\"0\" cuando haga falta.",
  "text-spacing": "Respeta espaciados mínimos cuando el usuario los aumenta (1.4.12).",
  "target-size": "Asegura objetivos de interacción con tamaño mínimo suficiente (2.5.8)."
};

const EXPECTED_ES = {
  "color-contrast": "Aumentar el contraste de texto hasta ≥4.5:1 (o ≥3:1 si el texto es grande).",
  "non-text-contrast": "Asegurar contraste ≥3:1 en controles, iconos y gráficos esenciales.",
  "image-alt": "Añadir texto alternativo que describa el propósito de la imagen o marcarla como decorativa.",
  "input-image-alt": "El botón/imagen debe tener alt que describa la acción.",
  "area-alt": "Cada área del mapa de imagen debe tener un texto alternativo significativo.",
  "document-title": "Definir un título de página único y descriptivo.",
  "frame-title": "Añadir un título al iframe que describa su contenido o función.",
  "link-name": "Dar a cada enlace un nombre accesible que deje claro su propósito.",
  "heading-order": "Mantener una jerarquía de encabezados lógica (h1→h2→h3…) sin saltos incoherentes.",
  "empty-heading": "Eliminar encabezados vacíos o usar elementos no semánticos para estilo.",
  "region": "Usar landmarks/roles (main, nav, header, footer, complementary…) para expresar estructura.",
  "landmark-one-main": "Tener exactamente una región principal (<main>) por página.",
  "landmark-unique": "Nombrar de forma única las regiones repetidas (aria-label/aria-labelledby).",
  "skip-link": "Incluir un enlace ‘Saltar al contenido’ visible al enfocar que lleve a la región principal.",
  "duplicate-id": "Hacer únicos todos los atributos id.",
  "label": "Asociar etiqueta visible o nombre accesible a cada control de formulario.",
  "form-field-multiple-labels": "Unificar múltiples etiquetas en un único nombre accesible claro.",
  "aria-allowed-role": "Usar roles ARIA válidos para el elemento.",
  "aria-required-attr": "Añadir los atributos ARIA requeridos por el rol.",
  "aria-required-children": "Incluir los elementos hijos requeridos por el rol ARIA.",
  "aria-required-parent": "Anidar el elemento en el contenedor padre requerido por el rol.",
  "aria-roles": "Usar roles ARIA reconocidos y apropiados.",
  "aria-valid-attr": "Eliminar/Corregir atributos ARIA no válidos.",
  "aria-valid-attr-value": "Corregir valores ARIA no válidos según la especificación.",
  "aria-hidden-focus": "No ocultar con aria-hidden elementos que pueden recibir foco.",
  "presentation-role-conflict": "No usar role=\"presentation/none\" en elementos interactivos o estructurales.",
  "focus-order-semantics": "Alinear el orden de tabulación con el orden visual y semántico.",
  "tabindex": "Evitar tabindex positivos; usar el orden natural y tabindex=\"0\" cuando proceda.",
  "text-spacing": "Mantener la legibilidad cuando el usuario aumenta espaciados de texto.",
  "meta-viewport": "Permitir zoom del usuario; no bloquear el escalado del viewport.",
  "target-size": "Asegurar objetivos táctiles con tamaño mínimo suficiente.",
  "aria-input-field-name": "Los campos con ARIA deben exponer un nombre accesible claro.",
  "name-role-value": "Cada componente debe exponer correctamente nombre, rol y valor.",
  "link-in-text-block": "No depender sólo del color para distinguir enlaces; añadir indicios adicionales.",
  "button-name": "Todo botón debe tener un nombre accesible que describa su acción.",
  "empty-link": "Evitar enlaces sin texto/nombre accesible; añadir un propósito claro.",

  // Fallback por código (si lo deduces)
  "1.1.1": "Proveer alternativas textuales significativas para el contenido no textual.",
  "1.3.1": "Representar estructura y relaciones con HTML semántico, roles y etiquetas.",
  "1.4.3": "Garantizar contraste suficiente entre texto y fondo para la lectura.",
  "1.4.11": "Asegurar contraste suficiente en componentes no textuales e iconos.",
  "1.4.12": "Mantener legibilidad si el usuario aumenta espaciados de texto.",
  "2.4.1": "Permitir saltar bloques repetidos para llegar al contenido principal.",
  "2.4.2": "Definir un título de página único y descriptivo.",
  "2.4.3": "Hacer que el foco avance siguiendo el orden lógico.",
  "2.4.4": "El propósito de cada enlace debe ser claro por su nombre o contexto.",
  "2.4.6": "Usar encabezados y etiquetas descriptivas y coherentes con la estructura.",
  "2.4.7": "Mostrar un indicador de foco visible para navegación por teclado.",
  "3.1.1": "Declarar el idioma principal de la página en el elemento raíz.",
  "3.1.2": "Marcar el idioma de los fragmentos cuando difiere del principal.",
  "3.3.2": "Proveer etiquetas o instrucciones claras para cada control de entrada.",
  "4.1.1": "Mantener el marcado procesable (sin ids duplicados ni errores de sintaxis).",
  "4.1.2": "Exponer correctamente nombre, rol y valor en los componentes.",
  "4.1.3": "Comunicar los mensajes de estado a tecnologías de asistencia."
};

// ------------------------------------------------------
// Helpers
// ------------------------------------------------------
function pickSpecificWcagTag(tagsOrString = []) {
  // Acepta array de tags o un string (fallback)
  if (Array.isArray(tagsOrString)) {
    const arr = tagsOrString.map(t => String(t).toLowerCase());
    return arr.find(t => /^wcag\d{3,4}$/.test(t)) || '';
  }
  const s = String(tagsOrString).toLowerCase();
  return /^wcag\d{3,4}$/.test(s) ? s : '';
}

function normalizeWcagTag(input = '') {
  // Devuelve "N.N.N" si existe en el texto; si no, cadena vacía
  const m = String(input).match(/\b\d\.\d\.\d\b/);
  return m ? m[0] : '';
}

/**
 * Devuelve { code:'1.3.1', title:'Información y relaciones', url:'https://...' } o null.
 * Prioridad:
 *  1) tag WCAG específico presente en tags
 *  2) mapeo por regla de axe (AXE_RULE_TO_WCAG)
 *  3) null
 */
function getWcagForRule(ruleId = '', tagsOrFallback = []) {
  // 1) Buscar tag específico (wcag111, wcag131, wcag244, wcag1411, ...)
  const tag = pickSpecificWcagTag(tagsOrFallback);
  if (tag && WCAG_MAP[tag]) {
    const [titleFull, url] = WCAG_MAP[tag];
    const code = normalizeWcagTag(titleFull);
    if (code) return { code, title: titleFull.replace(/^(\d\.\d\.\d)\s*/, ''), url };
  }

  // 2) Fallback por regla axe
  const hit = AXE_RULE_TO_WCAG[ruleId];
  if (hit) {
    const [titleFull, url] = hit;
    const code = normalizeWcagTag(titleFull);
    if (code) return { code, title: titleFull.replace(/^(\d\.\d\.\d)\s*/, ''), url };
  }

  // 3) Nada
  return null;
}

function helpES(ruleId = '', originalHelp = '') {
  return HELP_ES[ruleId] || originalHelp || 'Revisar el requisito WCAG aplicable.';
}

function expectedES(ruleId = '') {
  if (EXPECTED_ES[ruleId]) return EXPECTED_ES[ruleId];
  const wcag = getWcagForRule(ruleId, []);
  if (wcag && EXPECTED_ES[wcag.code]) return EXPECTED_ES[wcag.code];
  return 'Aplicar la recomendación de la regla o del criterio WCAG equivalente.';
}

// ------------------------------------------------------
// Exports
// ------------------------------------------------------
module.exports = {
  WCAG_MAP,
  AXE_RULE_TO_WCAG,
  HELP_ES,
  EXPECTED_ES,

  // helpers
  pickSpecificWcagTag,
  normalizeWcagTag,
  getWcagForRule, // <-- ahora devuelve {code,title,url}
  helpES,
  expectedES,
};

