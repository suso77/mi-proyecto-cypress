// cypress/support/axe-i18n.js
// I18N en español para axe-core + plantillas + traductor de respaldo
// Exporta: AXE_I18N, makeEsForRule, autoTranslateEnToEs, applySpanishToPayload

// ======== DICCIONARIO CURADO (resumen/esperado por id) ========
const AXE_I18N = {
  // ---- Landmark / regiones ----
  'landmark-unique': {
    resumen: 'Los landmarks deben tener una combinación única de rol y nombre accesible.',
    esperado: 'Cada landmark (banner, main, nav, complementary, contentinfo, etc.) debe ser único por rol+nombre dentro de la página.',
  },
  'landmark-one-main': {
    resumen: 'Debe existir exactamente un landmark “main”.',
    esperado: 'La página debe tener un único landmark con rol main.',
  },
  'landmark-main-is-top-level': {
    resumen: 'El landmark main debe estar al nivel superior del documento.',
    esperado: 'El landmark main no debe estar anidado en elementos que oculten su semántica.',
  },
  'landmark-banner-is-top-level': {
    resumen: 'El landmark banner debe estar al nivel superior del documento.',
    esperado: 'El banner no debe estar dentro de contenedores semánticos que invaliden su rol.',
  },
  'landmark-navigation-is-top-level': {
    resumen: 'El landmark navigation debe estar al nivel superior del documento.',
    esperado: 'El landmark de navegación no debe estar anidado de forma que pierda semántica.',
  },
  'landmark-complementary-is-top-level': {
    resumen: 'El landmark complementary debe estar al nivel superior del documento.',
    esperado: 'El landmark complementary debe estar bien posicionado y con nombre si es necesario.',
  },
  'landmark-contentinfo-is-top-level': {
    resumen: 'El landmark contentinfo (footer informativo) debe estar al nivel superior.',
    esperado: 'El contenido informativo final debe usarse correctamente y sin duplicados.',
  },
  region: {
    resumen: 'Las regiones ARIA deben tener nombre accesible si no son únicas.',
    esperado: 'Añade aria-label/aria-labelledby a regiones que lo requieran o usa landmarks apropiados.',
  },

  // ---- Encabezados ----
  'page-has-heading-one': {
    resumen: 'La página debe tener un encabezado de nivel 1 (h1).',
    esperado: 'Incluye un h1 representativo del contenido principal.',
  },
  'heading-order': {
    resumen: 'Los niveles de encabezado deben aumentar de uno en uno, sin saltos.',
    esperado: 'Estructura jerárquicamente con h1 → h2 → h3 … sin saltar niveles.',
  },
  'empty-heading': {
    resumen: 'Existe un encabezado sin texto.',
    esperado: 'Elimina el encabezado vacío o añade contenido textual adecuado.',
  },

  // ---- Idioma / título / meta ----
  'html-has-lang': {
    resumen: 'El elemento <html> debe declarar el idioma del documento.',
    esperado: 'Añade el atributo lang al elemento <html> (p. ej., lang="es").',
  },
  'html-lang-valid': {
    resumen: 'El atributo lang de <html> debe ser un código de idioma válido.',
    esperado: 'Usa códigos válidos BCP 47 (p. ej., "es", "es-ES").',
  },
  'document-title': {
    resumen: 'La página debe tener un título (<title>) significativo.',
    esperado: 'Incluye un título descriptivo y único en <head>.',
  },
  'meta-viewport': {
    resumen: 'La meta viewport no debe impedir el zoom.',
    esperado: 'Evita máximo de escala fijo y user-scalable="no" para permitir zoom.',
  },

  // ---- Color / contraste ----
  'color-contrast': {
    resumen: 'El texto no alcanza el contraste mínimo requerido.',
    esperado: 'Asegura contraste AA (4.5:1 texto normal; 3:1 texto grande).',
  },
  'color-contrast-enhanced': {
    resumen: 'El texto no alcanza el contraste mejorado (AAA).',
    esperado: 'Asegura contraste AAA (7:1 texto normal; 4.5:1 texto grande) si apuntas a AAA.',
  },

  // ---- Enlaces / botones ----
  'link-name': {
    resumen: 'Los enlaces deben tener un nombre accesible que describe su propósito.',
    esperado: 'Proporciona texto visible o aria-label/aria-labelledby significativo.',
  },
  'button-name': {
    resumen: 'Los botones deben tener un nombre accesible.',
    esperado: 'Añade texto visible o nombre accesible mediante atributos ARIA.',
  },
  'link-in-text-block': {
    resumen: 'Un enlace dentro de texto debe diferenciarse lo suficiente del texto circundante.',
    esperado: 'Usa contraste y/o estilo distinguible (no solo color).',
  },
  'skip-link': {
    resumen: 'Debe existir un enlace de salto al contenido principal o mecanismo equivalente.',
    esperado: 'Añade un skip link visible al enfocar (p. ej., “Saltar al contenido”).',
  },

  // ---- Imágenes / multimedia ----
  'image-alt': {
    resumen: 'Las imágenes significativas deben tener texto alternativo adecuado.',
    esperado: 'Añade alt descriptivo o rol/presentación apropiado si es decorativa.',
  },
  'image-redundant-alt': {
    resumen: 'El texto alternativo repite exactamente el texto adyacente.',
    esperado: 'Ajusta el alt para que aporte valor o déjalo decorativo si procede.',
  },
  'object-alt': {
    resumen: 'Los objetos incrustados deben tener alternativa textual.',
    esperado: 'Proporciona contenido alternativo o descripción textual.',
  },
  'svg-img-alt': {
    resumen: 'Los SVG usados como imagen deben tener nombre accesible.',
    esperado: 'Añade <title> referenciado o aria-label/aria-labelledby.',
  },
  'video-caption': {
    resumen: 'Los vídeos con audio deben tener subtítulos.',
    esperado: 'Incluye pistas de subtítulos sincronizados (track kind="captions").',
  },
  'video-description': {
    resumen: 'Los vídeos deben proporcionar audiodescripción cuando sea necesario.',
    esperado: 'Incluye pista de descripción o alternativa equivalente.',
  },
  'audio-caption': {
    resumen: 'El contenido solo-audio debe tener transcripción.',
    esperado: 'Proporciona transcripción textual completa.',
  },

  // ---- Iframes ----
  'frame-title': {
    resumen: 'Los iframes deben tener un título que describa su contenido.',
    esperado: 'Usa title significativo o aria-label/aria-labelledby.',
  },

  // ---- Formularios ----
  label: {
    resumen: 'Los controles de formulario deben tener etiqueta asociada.',
    esperado: 'Asocia <label for> o usa aria-label/aria-labelledby de forma correcta.',
  },
  'fieldset-legend': {
    resumen: 'Los grupos de controles deben usar <fieldset> y <legend> descriptivo.',
    esperado: 'Agrupa controles relacionados y proporciona un legend claro.',
  },
  'autocomplete-valid': {
    resumen: 'Los atributos autocomplete deben ser válidos.',
    esperado: 'Usa tokens autocomplete reconocidos por HTML estándar.',
  },
  'form-field-multiple-labels': {
    resumen: 'Un control de formulario tiene varias etiquetas conflictivas.',
    esperado: 'Evita etiquetas duplicadas o contradictorias.',
  },

  // ---- ARIA ----
  'aria-allowed-role': {
    resumen: 'Se ha usado un rol ARIA no permitido para ese elemento.',
    esperado: 'Usa roles compatibles con la semántica del elemento.',
  },
  'aria-allowed-attr': {
    resumen: 'Se ha usado un atributo ARIA no permitido con este rol.',
    esperado: 'Utiliza solo atributos ARIA válidos para el rol actual.',
  },
  'aria-required-attr': {
    resumen: 'Falta un atributo ARIA requerido por el rol.',
    esperado: 'Añade los atributos ARIA obligatorios para ese rol.',
  },
  'aria-required-children': {
    resumen: 'Faltan hijos requeridos por la especificación ARIA para ese rol.',
    esperado: 'Incluye la estructura hija obligatoria (roles/elementos hijos).',
  },
  'aria-required-parent': {
    resumen: 'Falta el padre requerido por ARIA para ese rol.',
    esperado: 'Anida el elemento dentro del contenedor/rol padre correcto.',
  },
  'aria-roles': {
    resumen: 'Se usa un rol ARIA desconocido o no válido.',
    esperado: 'Usa roles definidos por la especificación WAI-ARIA.',
  },
  'aria-valid-attr': {
    resumen: 'Existe un atributo ARIA desconocido.',
    esperado: 'Usa únicamente atributos ARIA válidos.',
  },
  'aria-valid-attr-value': {
    resumen: 'Un atributo ARIA contiene un valor no válido.',
    esperado: 'Corrige el valor para ajustarlo a la especificación ARIA.',
  },
  'aria-hidden-focus': {
    resumen: 'Un elemento con aria-hidden puede recibir foco.',
    esperado: 'Evita foco en elementos ocultos para tecnologías asistivas.',
  },
  'aria-input-field-name': {
    resumen: 'Campos con rol de entrada deben tener nombre accesible.',
    esperado: 'Añade etiqueta visible o aria-label/aria-labelledby.',
  },
  'aria-toggle-field-name': {
    resumen: 'Interruptores deben tener nombre accesible.',
    esperado: 'Incluye etiqueta visible o nombre ARIA válido.',
  },
  'aria-command-name': {
    resumen: 'Comandos (button, link, menuitem) deben tener nombre accesible.',
    esperado: 'Añade texto visible o nombre ARIA significativo.',
  },
  'aria-tooltip-name': {
    resumen: 'Los tooltips deben tener nombre accesible.',
    esperado: 'Proporciona aria-label/aria-labelledby o contenido apropiado.',
  },
  'aria-progressbar-name': {
    resumen: 'Las barras de progreso deben tener nombre accesible.',
    esperado: 'Nombra la barra de progreso para su identificación.',
  },
  'aria-meter-name': {
    resumen: 'Los medidores (meter) deben tener nombre accesible.',
    esperado: 'Incluye etiqueta o nombre ARIA significativo.',
  },
  'aria-text': {
    resumen: 'Los elementos con rol text deben cumplir requisitos de nombre/estructura.',
    esperado: 'Asegura nombre accesible cuando proceda.',
  },

  // ---- IDs / duplicados ----
  'duplicate-id': {
    resumen: 'Se han encontrado IDs duplicados en el DOM.',
    esperado: 'Cada id debe ser único en la página.',
  },
  'duplicate-id-aria': {
    resumen: 'Referencias ARIA apuntan a IDs duplicados.',
    esperado: 'Asegura unicidad de IDs a los que se referencia via ARIA.',
  },
  'duplicate-id-active': {
    resumen: 'IDs duplicados activos pueden provocar comportamiento inesperado.',
    esperado: 'Usa identificadores únicos por elemento.',
  },

  // ---- Listas / tablas ----
  list: {
    resumen: 'Las listas deben contener elementos de lista válidos.',
    esperado: 'Usa <ul>/<ol> con <li> correctos; evita estructuras falsas.',
  },
  listitem: {
    resumen: 'Un elemento de lista carece de contenedor de lista válido.',
    esperado: 'Anida <li> dentro de <ul>/<ol> apropiados.',
  },
  'scope-attr-valid': {
    resumen: 'El atributo scope se usa de forma no válida.',
    esperado: 'Usa scope="col" o scope="row" en celdas de encabezado apropiadas.',
  },
  'td-headers-attr': {
    resumen: 'El atributo headers de <td> referencia IDs inexistentes o incorrectos.',
    esperado: 'Asegura que headers apunte a IDs de <th> válidos.',
  },

  // ---- Focus / teclado ----
  keyboard: {
    resumen: 'Un componente no es completamente operable mediante teclado.',
    esperado: 'Garantiza navegación y activación por teclado sin trampas de foco.',
  },
  tabindex: {
    resumen: 'Se usan valores tabindex positivos que alteran el orden natural.',
    esperado: 'Evita tabindex > 0; usa 0 o maneja el orden con el DOM.',
  },
  'focus-order-semantics': {
    resumen: 'El orden de foco no sigue la semántica visual/estructural.',
    esperado: 'Alinea el orden de tabulación con el orden visual/DOM lógico.',
  },

  // ---- Varios ----
  accesskeys: {
    resumen: 'No se recomiendan accesskeys por conflictos con atajos de usuario.',
    esperado: 'Evita accesskeys o gestiona conflictos cuidadosamente.',
  },
};

// ======== PLANTILLAS POR PATRÓN ========
const PATTERN_TEMPLATES = [
  {
    test: /^aria-/,
    resumen: 'Se ha detectado un problema con ARIA (rol/atributo/estructura).',
    esperado: 'Usa roles y atributos ARIA válidos, e incluye los requeridos por cada rol.',
  },
  {
    test: /^landmark-/,
    resumen: 'Los landmarks están mal definidos (unicidad, nivel o cantidad).',
    esperado: 'Estructura y nombra landmarks según WAI-ARIA; evita duplicados y respeta jerarquía.',
  },
  {
    test: /^color-contrast/,
    resumen: 'El texto no cumple el contraste de color requerido.',
    esperado: 'Aumenta el contraste entre texto y fondo hasta cumplir nivel AA/AAA.',
  },
  {
    test: /^heading-/,
    resumen: 'Los encabezados no siguen una jerarquía correcta.',
    esperado: 'Usa niveles consecutivos y evita saltos.',
  },
  {
    test: /^duplicate-id/,
    resumen: 'Hay identificadores (id) duplicados.',
    esperado: 'Asegura que cada id del documento sea único.',
  },
  {
    test: /^(image|svg-img|object|area)-/,
    resumen: 'El elemento gráfico carece de texto alternativo adecuado.',
    esperado: 'Añade alt/label descriptivo o márcalo como decorativo si procede.',
  },
  {
    test: /^(link|button)-name$/,
    resumen: 'El control interactivo no tiene nombre accesible.',
    esperado: 'Añade texto visible o aria-label/aria-labelledby significativo.',
  },
  {
    test: /^frame-title/,
    resumen: 'El iframe no tiene título descriptivo.',
    esperado: 'Proporciona title o nombre ARIA significativo.',
  },
  {
    test: /^(list|listitem)$/,
    resumen: 'La lista o sus elementos no están bien estructurados.',
    esperado: 'Usa <ul>/<ol> con <li> en relación válida.',
  },
  {
    test: /^(document-title|html-has-lang|html-lang-valid|meta-viewport)$/,
    resumen: 'Falta o es incorrecta la metainformación del documento.',
    esperado: 'Corrige título, idioma y viewport para accesibilidad y usabilidad.',
  },
];

// ======== Traductor de respaldo EN → ES (frases comunes) ========
const REPLACE_EN_ES = [
  [/heading levels should only increase by one/gi, 'los niveles de encabezado deben aumentar de uno en uno'],
  [/elements? must have sufficient color contrast/gi, 'el texto debe tener contraste de color suficiente'],
  [/links? must have discernible text/gi, 'los enlaces deben tener texto discernible (nombre accesible)'],
  [/buttons? must have discernible text/gi, 'los botones deben tener texto discernible (nombre accesible)'],
  [/iframes? must have a unique title attribute value/gi, 'los iframes deben tener un título (title) descriptivo y único'],
  [/images? must have alternate text/gi, 'las imágenes deben tener texto alternativo'],
  [/page must have a level one heading/gi, 'la página debe tener un encabezado de nivel 1'],
  [/the html element must have a lang attribute/gi, 'el elemento html debe declarar el atributo lang'],
  [/the document must have a title element/gi, 'el documento debe tener un título (<title>)'],
  [/aria (attributes?|roles?) must be valid/gi, 'los atributos/roles ARIA deben ser válidos'],
  [/id attribute value must be unique/gi, 'cada valor de id debe ser único'],
  [/must have an accessible name/gi, 'debe tener un nombre accesible'],
  [/region must have an accessible name/gi, 'la región debe tener un nombre accesible'],
  [/skip link/gi, 'enlace de salto'],
  [/keyboard/gi, 'teclado'],
];

function autoTranslateEnToEs(str = '') {
  let s = String(str || '').trim();
  if (!s) return '';
  REPLACE_EN_ES.forEach(([re, rep]) => { s = s.replace(re, rep); });
  s = s
    .replace(/\bshould\b/gi, 'debe')
    .replace(/\bmust\b/gi, 'debe')
    .replace(/\belements?\b/gi, 'elementos')
    .replace(/\blandmarks?\b/gi, 'landmarks')
    .replace(/\baccessible name\b/gi, 'nombre accesible');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ======== Generador por id (diccionario → plantillas → help traducido) ========
function makeEsForRule(id, help = '') {
  const fromDict = AXE_I18N[id];
  if (fromDict) return { resumen: fromDict.resumen, esperado: fromDict.esperado };

  const pat = PATTERN_TEMPLATES.find((p) => p.test.test(id));
  if (pat) return { resumen: pat.resumen, esperado: pat.esperado };

  const resumen = autoTranslateEnToEs(help || `Incumplimiento detectado en la regla ${id}.`);
  const esperado = 'Debe cumplir el criterio correspondiente; revisa la guía WCAG para este caso.';
  return { resumen, esperado };
}

// ======== applySpanishToPayload ========
// Recibe el payload de cypress-axe (con violations) y:
// - Inyecta helpES (resumen) y resultadoEsperadoES (esperado) SIEMPRE en español.
// - Elimina cualquier "resultadoActual" previo (para evitar mezclar inglés).
// - NO forma el “Resultado actual” aquí: eso lo compone el task saveA11yResults con selector/HTML.
function applySpanishToPayload(payload = {}) {
  if (!payload || !Array.isArray(payload.violations)) return payload;

  payload.violations.forEach((v) => {
    const { resumen, esperado } = makeEsForRule(v.id, v.help || v.description || '');
    v.helpES = resumen;
    v.resultadoEsperadoES = esperado;

    // Evitar que quede inglés previo
    if (v.resultadoActual) delete v.resultadoActual;
    if (typeof v.resultadoActualES === 'string') v.resultadoActualES = v.resultadoActualES.trim();

    // Limpieza ligera de failureSummary para que luego el task lo use si hace falta
    if (typeof v.description === 'string' && !v.help) {
      v.help = v.description;
    }
  });

  return payload;
}

module.exports = {
  AXE_I18N,
  makeEsForRule,
  autoTranslateEnToEs,
  applySpanishToPayload,
};
