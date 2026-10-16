/**
 * ============================================================
 *  INSCRIPCIONES CCM — Backend (Google Apps Script) — v4
 * ============================================================
 *  Estructura de datos en DOS hojas relacionadas (como una base
 *  de datos real):
 *    - "Alumnos"   → un renglón por persona (correo, nombre, tel.)
 *    - "Historial" → un renglón por cada curso tomado, enlazado
 *                    al alumno por su correo
 *  Instrucciones de instalación al final de este archivo.
 * ============================================================
 */

// ---------- CONFIGURACIÓN (edita estos valores) ----------
const CONFIG = {
  SHEET_ALUMNOS: 'Alumnos',
  SHEET_HISTORIAL: 'Historial',
  SHEET_CURSOS: 'Config Cursos',
  SHEET_AJUSTES: 'Config General',
  SHEET_MAESTROS: 'Config Maestros',
  SHEET_CALIFICACIONES: 'Calificaciones',
  SHEET_ASISTENCIA: 'Asistencia',

  // Número de clases por curso (define la rúbrica de asistencia)
  CLASES_POR_CURSO: 8,
  DRIVE_FOLDER_ID: null,
  ADMIN_EMAIL: 'ccmcornerqro@gmail.com',

  // URL pública de tu implementación (la que termina en /exec).
  // Se usa para armar los enlaces internos (historial, volver a
  // inscripciones) y los que van dentro de los correos. Es necesaria
  // porque las páginas corren dentro de un iframe de Google, donde los
  // enlaces relativos no resuelven bien.
  // Si algún día vuelves a implementar y la URL cambia, actualízala aquí.
  URL_APP: 'https://script.google.com/macros/s/AKfycbzig46Cp5Tpo6cD00Nk3dM2jwKgacGy9JUITCj5ui7r9abgDTFznG1fVMpVfFYCFQR7/exec',

  // La palabra secreta del reporte YA NO vive aquí, porque el código
  // está en un repositorio público. Se guarda en las propiedades del
  // script: en el editor, "Configuración del proyecto" > "Propiedades
  // del script" > REPORTE_TOKEN. Ver tokenReporte_().

  // Periodo en el que se aceptan inscripciones (formato AAAA-MM-DD).
  // Fuera de este rango, la página muestra "Inscripciones cerradas"
  // y NADIE puede inscribirse (se bloquea también en el servidor,
  // no solo visualmente). Edita estas dos fechas cuando abras un
  // nuevo periodo.
  INSCRIPCIONES: {
    FECHA_INICIO: '2026-08-17',
    FECHA_FIN: '2026-08-30'
  },

  // Tamaño máximo de comprobante, en MB
  MAX_ARCHIVO_MB: 5,
  TIPOS_PERMITIDOS: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],

  // Todos los cursos cuestan lo mismo, sin importar el nivel.
  PRECIO_CURSO: 100,

  // Mensaje que se muestra cuando un curso está marcado como cerrado (abierto: false)
  // y no se le puso un mensaje propio en "mensaje". Cámbialo aquí si quieres otro texto por defecto.
  MENSAJE_CURSO_CERRADO_DEFAULT: 'No disponible en este periodo',

  // Carpeta de Drive con los manuales en PDF. El sistema busca ahí (y en
  // sus subcarpetas, si las tienes por nivel) un archivo cuyo nombre
  // coincida con el del curso — no importan mayúsculas/minúsculas ni
  // acentos. Ej.: el curso "Identidad" encuentra "Identidad.pdf" o
  // "identidad.pdf" por igual. Si un curso no tiene PDF con ese nombre,
  // el correo se manda igual, simplemente sin adjunto.
  CARPETA_MANUALES_ID: '1QD7DIebUQC0iy6g0MaDy34Ssy34dGGj1',

  // Logo CCM en PNG (base64), para incrustarlo en los correos con un
  // Content-ID — no depende de ningún link externo que se pueda romper,
  // y a diferencia de una imagen en línea (data:image/...), sí se ve
  // en Gmail y en la mayoría de los clientes de correo.
  LOGO_BASE64: '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',

  // ---- ÚNICA FUENTE DE VERDAD para cursos y datos bancarios ----
  // El frontend (Index.html) YA NO tiene esta información duplicada:
  // la pide aquí con google.script.run.getCatalogo(). Edita solo aquí.
  //
  // Para CERRAR un curso (que no se pueda inscribir), pon abierto: false.
  // Puedes darle un mensaje propio con "mensaje"; si lo dejas vacío ('')
  // se usa el MENSAJE_CURSO_CERRADO_DEFAULT de arriba.
  //
  // MANUALES EN PDF: no necesitas configurar nada aquí — el sistema busca
  // automáticamente, en CONFIG.CARPETA_MANUALES_ID (más abajo), un PDF cuyo
  // nombre de archivo coincida con el nombre del curso (ej. el curso
  // "Identidad" busca un archivo "Identidad.pdf"). Ver esa sección para más
  // detalles.
  //
  // Nota: son 17 cursos en total (6 + 6 + 5) — Nivel 3 solo tiene 5.
  NIVELES: [
    {
      nombre: 'Nivel 1',
      descripcion: 'Fundamentos',
      cursos: [
        { nombre: 'Identidad', abierto: true, mensaje: '' },
        { nombre: 'Propósito', abierto: true, mensaje: '' },
        { nombre: 'Carácter',  abierto: true, mensaje: '' },
        { nombre: 'Visión',    abierto: true, mensaje: '' },
        { nombre: 'Recursos',  abierto: true, mensaje: '' },
        { nombre: 'Destino',   abierto: true, mensaje: '' }
      ]
    },
    {
      nombre: 'Nivel 2',
      descripcion: 'Intermedio',
      cursos: [
        { nombre: 'Siervo Aprobado',   abierto: true, mensaje: '' },
        { nombre: 'Siervo Próspero',   abierto: true, mensaje: '' },
        { nombre: 'Siervo Sano',       abierto: true, mensaje: '' },
        { nombre: 'Siervo y Su Voz',   abierto: true, mensaje: '' },
        { nombre: 'Siervo y el Reino', abierto: true, mensaje: '' },
        { nombre: 'Siervo y Su Dios',  abierto: true, mensaje: '' }
      ]
    },
    {
      nombre: 'Nivel 3',
      descripcion: 'Avanzado',
      cursos: [
        { nombre: 'Liderazgo 1',       abierto: true, mensaje: '' },
        { nombre: 'Trabajo en Equipo', abierto: true, mensaje: '' },
        { nombre: 'Formación',         abierto: true, mensaje: '' },
        { nombre: 'Planeación',        abierto: true, mensaje: '' },
        { nombre: 'Cultura',           abierto: true, mensaje: '' }
      ]
    }
  ],

  DATOS_BANCARIOS: {
    banco: 'Inbursa / Walmart',
    titular: 'Ruben Peña Gutiérrez',
    cuenta: '50053555894',
    clabe: '036680500535558940',
    referencia: 'Tu nombre + curso'
  }
};

// ---------- Sirve la página ----------
// Devuelve la URL pública de la app. Usa CONFIG.URL_APP si está definida
// (más confiable), y si no, intenta obtenerla automáticamente.
function urlApp_() {
  if (CONFIG.URL_APP) return CONFIG.URL_APP;
  try {
    return ScriptApp.getService().getUrl() || '';
  } catch (err) {
    return '';
  }
}

// Palabra secreta del reporte, leída de las propiedades del script
// (nunca del código, que es público). Devuelve '' si no está configurada.
function tokenReporte_() {
  return PropertiesService.getScriptProperties().getProperty('REPORTE_TOKEN') || '';
}

// true solo si el token coincide con el configurado. Si no hay token
// configurado, nadie entra.
function tokenReporteValido_(token) {
  const esperado = tokenReporte_();
  return esperado !== '' && token === esperado;
}

// Devuelve el logo CCM como imagen (Blob) para incrustarlo en correos con
// un Content-ID, o null si algo sale mal (nunca debe tronar el envío del
// correo por esto).
function logoBlob_() {
  try {
    if (!CONFIG.LOGO_BASE64) return null;
    const bytes = Utilities.base64Decode(CONFIG.LOGO_BASE64);
    return Utilities.newBlob(bytes, 'image/png', 'logo-ccm.png');
  } catch (err) {
    return null;
  }
}

function doGet(e) {
  // Ruta protegida para generar/actualizar el reporte de inscripciones:
  // TU_URL_DE_IMPLEMENTACION/exec?accion=reporte&token=TU_REPORTE_TOKEN
  // El token se configura en las propiedades del script (REPORTE_TOKEN).
  if (e && e.parameter && e.parameter.accion === 'reporte') {
    if (!tokenReporteValido_(e.parameter.token)) {
      return HtmlService.createHtmlOutput('<p style="font-family:Arial;padding:40px;">No autorizado.</p>');
    }
    const tplRep = HtmlService.createTemplateFromFile('Reporte');
    tplRep.tokenJson = JSON.stringify(tokenReporte_());
    tplRep.urlAppJson = JSON.stringify(urlApp_());
    return tplRep.evaluate()
      .setTitle('Reporte — CCM')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  // Ruta protegida que lleva a la hoja de cálculo (la usa el botón del reporte).
  if (e && e.parameter && e.parameter.accion === 'abrirhoja') {
    if (!tokenReporteValido_(e.parameter.token)) {
      return HtmlService.createHtmlOutput('<p style="font-family:Arial;padding:40px;">No autorizado.</p>');
    }
    const idHoja = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    if (!idHoja) {
      return HtmlService.createHtmlOutput('<p style="font-family:Arial;padding:40px;">Todavía no hay hoja de cálculo: aún no se registra ninguna inscripción.</p>');
    }
    const urlHoja = SpreadsheetApp.openById(idHoja).getUrl();
    return HtmlService.createHtmlOutput(
      '<script>window.top.location.href = ' + JSON.stringify(urlHoja) + ';<\/script>' +
      '<p style="font-family:Arial;padding:40px;">Abriendo la hoja… si no pasa nada, ' +
      '<a href="' + urlHoja + '" target="_blank">haz clic aquí</a>.</p>'
    );
  }

  // Ruta pública para que el alumno consulte su historial completo
  // (todos sus cursos, con resultado) usando correo + folio, O dando
  // clic en un enlace mágico que le llegó por correo (?token=...).
  // TU_URL_DE_IMPLEMENTACION/exec?accion=consulta
  // Panel de maestros. Se sirve desde la implementación configurada como
  // "Ejecutar como: usuario que accede", para poder leer su correo de Google.
  // TU_URL_DE_MAESTROS/exec?accion=maestro
  if (e && e.parameter && e.parameter.accion === 'maestro') {
    const tplM = HtmlService.createTemplateFromFile('Maestro');
    tplM.urlAppJson = JSON.stringify(urlApp_());
    return tplM.evaluate()
      .setTitle('Panel del maestro — CCM')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  if (e && e.parameter && e.parameter.accion === 'consulta') {
    const tpl = HtmlService.createTemplateFromFile('Consulta');
    // El token viene de la URL (dato NO confiable) y se va a insertar
    // dentro de un <script> en el HTML. Primero se filtra a solo los
    // caracteres válidos de un UUID (el formato real que genera
    // Utilities.getUuid()), y luego se escapan los '<' del JSON para
    // que nadie pueda cerrar la etiqueta <script> con un token
    // manipulado (ej. ?token=</script><script>...).
    const tokenCrudo = (e.parameter && e.parameter.token) || '';
    const tokenSeguro = tokenCrudo.toString().replace(/[^a-zA-Z0-9\-]/g, '').substring(0, 60);
    tpl.tokenInicialJson = JSON.stringify(tokenSeguro).replace(/</g, '\\u003c');
    tpl.urlAppJson = JSON.stringify(urlApp_());
    return tpl.evaluate()
      .setTitle('Mi historial — CCM')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  const tplIndex = HtmlService.createTemplateFromFile('Index');
  // La página vive dentro de un iframe de Google, así que los enlaces
  // relativos ("?accion=consulta") no funcionan. Le inyectamos la URL
  // absoluta real para que pueda armar sus enlaces.
  tplIndex.urlAppJson = JSON.stringify(urlApp_());
  return tplIndex.evaluate()
    .setTitle('Inscripciones CCM')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Calcula si hoy cae dentro del periodo de inscripciones.
// Las fechas se leen de la hoja "Config General" (editables sin tocar
// código); si esa hoja no existe todavía, usa las del CONFIG de arriba.
function estadoInscripciones_() {
  const tz = Session.getScriptTimeZone() || 'America/Mexico_City';
  const hoy = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  const inicio = leerAjuste_('Fecha inicio inscripciones', CONFIG.INSCRIPCIONES.FECHA_INICIO);
  const fin = leerAjuste_('Fecha fin inscripciones', CONFIG.INSCRIPCIONES.FECHA_FIN);
  return {
    abiertas: hoy >= inicio && hoy <= fin,
    fechaInicio: inicio,
    fechaFin: fin
  };
}

/**
 * El frontend llama esta función al cargar para obtener niveles,
 * cursos y datos bancarios. El estado abierto/cerrado de cada curso,
 * las fechas y el precio vienen de las hojas de configuración.
 */
function getCatalogo() {
  return {
    niveles: nivelesEfectivos_(),
    datosBancarios: CONFIG.DATOS_BANCARIOS,
    maxArchivoMB: CONFIG.MAX_ARCHIVO_MB,
    precioCurso: precioEfectivo_(),
    mensajeCerradoDefault: CONFIG.MENSAJE_CURSO_CERRADO_DEFAULT,
    estadoInscripciones: estadoInscripciones_()
  };
}

/**
 * ============================================================
 *  ESTRUCTURA DE DATOS: dos hojas relacionadas por "Correo"
 * ============================================================
 *  "Alumnos"   → Correo | Nombre completo | Teléfono / WhatsApp | Primer registro
 *  "Historial" → Folio | Fecha | Correo | Nivel | Curso | Precio |
 *                Método de pago | Comprobante (link) | Estado | Resultado | Notas
 * ============================================================
 */

// Versión SIN bloqueo propio: se usa dentro de un lock más amplio que
// también cubre alta de alumno + verificación de duplicados + guardado
// de la fila (ver registrarInscripcion), para que todo el ciclo sea
// atómico y no puedan colarse dos inscripciones simultáneas.
function obtenerHojasSinLock_() {
  const props = PropertiesService.getScriptProperties();
  let ssId = props.getProperty('SHEET_ID');
  let ss;

  if (ssId) {
    try {
      ss = SpreadsheetApp.openById(ssId);
    } catch (err) {
      ssId = null;
    }
  }

  if (!ssId) {
    ss = SpreadsheetApp.create('Registro de Inscripciones CCM');
    props.setProperty('SHEET_ID', ss.getId());
    Logger.log('Hoja creada: ' + ss.getUrl());
  }

  let alumnos = ss.getSheetByName(CONFIG.SHEET_ALUMNOS);
  if (!alumnos) {
    alumnos = ss.insertSheet(CONFIG.SHEET_ALUMNOS);
    alumnos.appendRow(['Correo', 'Nombre completo', 'Teléfono / WhatsApp', 'Primer registro']);
    alumnos.setFrozenRows(1);
  }

  let historial = ss.getSheetByName(CONFIG.SHEET_HISTORIAL);
  if (!historial) {
    historial = ss.insertSheet(CONFIG.SHEET_HISTORIAL);
    historial.appendRow([
      'Folio', 'Fecha', 'Correo', 'Nivel', 'Curso', 'Precio',
      'Método de pago', 'Comprobante (link)', 'Estado', 'Resultado', 'Notas', 'Ciclo'
    ]);
    historial.setFrozenRows(1);
  } else {
    // Migración automática: si el Historial es de antes de que existiera
    // el concepto de "Ciclo", se le agrega la columna al final, y a las
    // inscripciones que ya tenía se les asigna "Ciclo 1" por defecto (para
    // no perder ese dato ni bloquear nada).
    const headersActuales = historial.getDataRange().getValues()[0] || [];
    if (headersActuales.indexOf('Ciclo') === -1) {
      const colNueva = historial.getLastColumn() + 1;
      historial.getRange(1, colNueva).setValue('Ciclo');
      const totalFilas = historial.getLastRow();
      if (totalFilas > 1) {
        const valoresPorDefecto = [];
        for (let i = 0; i < totalFilas - 1; i++) valoresPorDefecto.push(['Ciclo 1']);
        historial.getRange(2, colNueva, totalFilas - 1, 1).setValues(valoresPorDefecto);
      }
      Logger.log('Migración: se agregó la columna "Ciclo" al Historial. Inscripciones anteriores marcadas como "Ciclo 1".');
    }
  }

  const defaultSheet = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1');
  if (defaultSheet) ss.deleteSheet(defaultSheet);

  // Hojas de configuración editables por ti, sin tocar código
  crearHojaCursosSiFalta_(ss);
  crearHojaAjustesSiFalta_(ss);
  crearHojaMaestrosSiFalta_(ss);
  crearHojaCalificacionesSiFalta_(ss);
  crearHojaAsistenciaSiFalta_(ss);

  return { ss: ss, alumnos: alumnos, historial: historial };
}

/**
 * ============================================================
 *  CONFIGURACIÓN DESDE LA HOJA (sin editar código)
 * ============================================================
 *  "Config Cursos"  → abrir/cerrar cada curso y su mensaje
 *  "Config General" → fechas de inscripción y precio
 *
 *  Estas hojas se crean solas la primera vez, ya llenas con los
 *  valores que tiene CONFIG.NIVELES. A partir de ahí, MANDA LA
 *  HOJA: lo que cambies ahí surte efecto de inmediato, sin volver
 *  a implementar. Si borras una hoja, el sistema vuelve a usar los
 *  valores del código y la recrea la próxima vez.
 * ============================================================
 */
function crearHojaCursosSiFalta_(ss) {
  let hoja = ss.getSheetByName(CONFIG.SHEET_CURSOS);
  if (hoja) return hoja;

  hoja = ss.insertSheet(CONFIG.SHEET_CURSOS);
  hoja.appendRow(['Nivel', 'Curso', '¿Abierto? (SI/NO)', 'Mensaje si está cerrado (opcional)']);
  CONFIG.NIVELES.forEach(function (nivel) {
    nivel.cursos.forEach(function (curso) {
      hoja.appendRow([nivel.nombre, curso.nombre, curso.abierto ? 'SI' : 'NO', curso.mensaje || '']);
    });
  });
  hoja.setFrozenRows(1);
  hoja.getRange(1, 1, 1, 4).setFontWeight('bold');
  hoja.autoResizeColumns(1, 4);
  return hoja;
}

function crearHojaAjustesSiFalta_(ss) {
  let hoja = ss.getSheetByName(CONFIG.SHEET_AJUSTES);
  if (hoja) return hoja;

  hoja = ss.insertSheet(CONFIG.SHEET_AJUSTES);
  hoja.appendRow(['Ajuste', 'Valor', 'Notas']);
  hoja.appendRow(['Fecha inicio inscripciones', CONFIG.INSCRIPCIONES.FECHA_INICIO, 'Formato AAAA-MM-DD (ej. 2026-08-17)']);
  hoja.appendRow(['Fecha fin inscripciones', CONFIG.INSCRIPCIONES.FECHA_FIN, 'Formato AAAA-MM-DD. Fuera de este rango, la página muestra "Inscripciones cerradas"']);
  hoja.appendRow(['Precio por curso', CONFIG.PRECIO_CURSO, 'Solo el número, sin $ (ej. 100)']);
  hoja.setFrozenRows(1);
  hoja.getRange(1, 1, 1, 3).setFontWeight('bold');
  // Las fechas como texto plano, para que Sheets no las convierta a otro formato
  hoja.getRange(2, 2, 2, 1).setNumberFormat('@');
  hoja.autoResizeColumns(1, 3);
  return hoja;
}

/**
 * ============================================================
 *  HOJAS DEL MÓDULO DE MAESTROS
 * ============================================================
 *  "Config Maestros"  → quién da qué curso, en qué ciclo, y si ya cerró
 *  "Calificaciones"   → Participación y Trabajos por alumno
 *  "Asistencia"       → las 8 clases marcadas por alumno
 * ============================================================
 */
function crearHojaMaestrosSiFalta_(ss) {
  let hoja = ss.getSheetByName(CONFIG.SHEET_MAESTROS);
  if (hoja) return hoja;

  hoja = ss.insertSheet(CONFIG.SHEET_MAESTROS);
  hoja.appendRow([
    'Nombre del maestro', 'Correo Gmail', 'Nivel', 'Curso', 'Ciclo',
    'Estado (Abierto/Cerrado)', 'Fecha clase 1', 'Fecha clase 2', 'Fecha clase 3',
    'Fecha clase 4', 'Fecha clase 5', 'Fecha clase 6', 'Fecha clase 7', 'Fecha clase 8'
  ]);
  hoja.setFrozenRows(1);
  hoja.getRange(1, 1, 1, 14).setFontWeight('bold');
  hoja.autoResizeColumns(1, 14);
  return hoja;
}

function crearHojaCalificacionesSiFalta_(ss) {
  let hoja = ss.getSheetByName(CONFIG.SHEET_CALIFICACIONES);
  if (hoja) return hoja;

  hoja = ss.insertSheet(CONFIG.SHEET_CALIFICACIONES);
  hoja.appendRow(['Folio', 'Correo', 'Curso', 'Ciclo', 'Participación', 'Trabajos', 'Actualizado']);
  hoja.setFrozenRows(1);
  hoja.getRange(1, 1, 1, 7).setFontWeight('bold');
  hoja.autoResizeColumns(1, 7);
  return hoja;
}

function crearHojaAsistenciaSiFalta_(ss) {
  let hoja = ss.getSheetByName(CONFIG.SHEET_ASISTENCIA);
  if (hoja) return hoja;

  hoja = ss.insertSheet(CONFIG.SHEET_ASISTENCIA);
  const encabezados = ['Folio', 'Correo', 'Curso', 'Ciclo'];
  for (let i = 1; i <= CONFIG.CLASES_POR_CURSO; i++) encabezados.push('Clase ' + i);
  encabezados.push('Actualizado');
  hoja.appendRow(encabezados);
  hoja.setFrozenRows(1);
  hoja.getRange(1, 1, 1, encabezados.length).setFontWeight('bold');
  hoja.autoResizeColumns(1, encabezados.length);
  return hoja;
}

// Lee un ajuste de "Config General". Si la hoja no existe o el valor
// está vacío, devuelve el valor por defecto que viene del código.
function leerAjuste_(nombreAjuste, valorPorDefecto) {
  try {
    const ssId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    if (!ssId) return valorPorDefecto;
    const hoja = SpreadsheetApp.openById(ssId).getSheetByName(CONFIG.SHEET_AJUSTES);
    if (!hoja) return valorPorDefecto;
    const datos = hoja.getDataRange().getValues();
    for (let i = 1; i < datos.length; i++) {
      if ((datos[i][0] || '').toString().trim().toLowerCase() === nombreAjuste.toLowerCase()) {
        const v = datos[i][1];
        if (v === '' || v === null || v === undefined) return valorPorDefecto;
        // Si Sheets convirtió la fecha a objeto Date, la normalizamos a AAAA-MM-DD
        if (v instanceof Date) {
          return Utilities.formatDate(v, Session.getScriptTimeZone() || 'America/Mexico_City', 'yyyy-MM-dd');
        }
        return v.toString().trim();
      }
    }
    return valorPorDefecto;
  } catch (err) {
    return valorPorDefecto;
  }
}

// Devuelve el catálogo de niveles/cursos aplicando el estado abierto/cerrado
// que esté en la hoja "Config Cursos". Si la hoja no existe, usa el código.
function nivelesEfectivos_() {
  try {
    const ssId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    if (!ssId) return CONFIG.NIVELES;
    const hoja = SpreadsheetApp.openById(ssId).getSheetByName(CONFIG.SHEET_CURSOS);
    if (!hoja) return CONFIG.NIVELES;

    const datos = hoja.getDataRange().getValues();
    const mapa = {}; // "Nivel|Curso" -> {abierto, mensaje}
    for (let i = 1; i < datos.length; i++) {
      const nivel = (datos[i][0] || '').toString().trim();
      const curso = (datos[i][1] || '').toString().trim();
      if (!nivel || !curso) continue;
      const abiertoTexto = (datos[i][2] || '').toString().trim().toUpperCase();
      mapa[nivel + '|' + curso] = {
        abierto: (abiertoTexto === 'SI' || abiertoTexto === 'SÍ' || abiertoTexto === 'S' || abiertoTexto === 'TRUE'),
        mensaje: (datos[i][3] || '').toString().trim()
      };
    }

    // Copia del catálogo del código, con el estado de la hoja aplicado
    return CONFIG.NIVELES.map(function (nivel) {
      return {
        nombre: nivel.nombre,
        descripcion: nivel.descripcion,
        cursos: nivel.cursos.map(function (curso) {
          const cfg = mapa[nivel.nombre + '|' + curso.nombre];
          return {
            nombre: curso.nombre,
            abierto: cfg ? cfg.abierto : curso.abierto,
            mensaje: cfg ? cfg.mensaje : (curso.mensaje || '')
          };
        })
      };
    });
  } catch (err) {
    return CONFIG.NIVELES;
  }
}

function precioEfectivo_() {
  const v = leerAjuste_('Precio por curso', CONFIG.PRECIO_CURSO);
  const n = Number(v);
  return isNaN(n) || n <= 0 ? CONFIG.PRECIO_CURSO : n;
}

// Nombre del ciclo actual, calculado SOLO de la fecha de inicio que ya
// configuras en "Config General" cada vez que abres una nueva
// inscripción — no requiere ningún campo nuevo que llenar a mano.
// Cada vez que cambias esa fecha, automáticamente empieza un ciclo
// nuevo (ej. "Ciclo Agosto 2026").
function cicloActual_() {
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const inicio = leerAjuste_('Fecha inicio inscripciones', CONFIG.INSCRIPCIONES.FECHA_INICIO);
  const partes = inicio.split('-');
  const anio = partes[0] || '';
  const mesIdx = parseInt(partes[1], 10) - 1;
  const mes = MESES[mesIdx] || partes[1] || '';
  const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1);
  return 'Ciclo ' + mesCapitalizado + ' ' + anio;
}

// Versión pública con su propio bloqueo, por si necesitas las hojas
// fuera del flujo de inscripción (p. ej. desde el editor de Apps Script).
function getHojas_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    return obtenerHojasSinLock_();
  } finally {
    lock.releaseLock();
  }
}

/**
 * Lo mismo que getHojas_(), pero SIN guion bajo al final — así SÍ
 * aparece en el menú desplegable de funciones del editor (Apps Script
 * oculta del menú cualquier función terminada en "_", por convención
 * de "función privada"). Ejecuta esta para forzar la creación de todas
 * las hojas (Alumnos, Historial, Config Cursos, Config General) sin
 * esperar a una inscripción real.
 */
function inicializarHojas() {
  const hojas = getHojas_();
  Logger.log('Listo. Hojas creadas/verificadas: ' +
    [hojas.alumnos.getName(), hojas.historial.getName(), 'Config Cursos', 'Config General'].join(', '));
  Logger.log('Abre tu hoja aquí: ' + hojas.ss.getUrl());
}

// Da de alta al alumno en "Alumnos" si es la primera vez que se ve su
// correo, o actualiza su nombre/teléfono si ya existía (para que la
// hoja siempre refleje el dato más reciente que dio la persona).
function upsertAlumno_(alumnosSheet, correo, nombre, telefono) {
  const data = alumnosSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString().toLowerCase() === correo.toLowerCase()) {
      alumnosSheet.getRange(i + 1, 2, 1, 2).setValues([[celdaSegura_(nombre), celdaSegura_(telefono)]]);
      return;
    }
  }
  alumnosSheet.appendRow([celdaSegura_(correo), celdaSegura_(nombre), celdaSegura_(telefono), new Date()]);
}

// ---------- Carpeta de comprobantes (con bloqueo) ----------
function getFolder_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const props = PropertiesService.getScriptProperties();
    let folderId = CONFIG.DRIVE_FOLDER_ID || props.getProperty('FOLDER_ID');
    let folder;

    if (folderId) {
      try {
        folder = DriveApp.getFolderById(folderId);
        return folder;
      } catch (err) {
        // sigue abajo y crea una nueva
      }
    }

    folder = DriveApp.createFolder('Comprobantes - Inscripciones CCM');
    props.setProperty('FOLDER_ID', folder.getId());
    Logger.log('Carpeta creada: ' + folder.getId());
    return folder;
  } finally {
    lock.releaseLock();
  }
}

// ---------- Utilidades de validación / sanitización ----------

// Quita acentos, caracteres especiales y rutas; deja un nombre de archivo seguro.
function sanitizarNombreArchivo_(texto) {
  if (!texto) return 'archivo';
  return texto
    .toString()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita acentos
    .replace(/[\/\\:*?"<>|]/g, '') // quita caracteres inválidos / de ruta
    .replace(/\.\./g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 80);
}

// Limpia texto simple de campos de formulario (nombre, teléfono, correo).
function limpiarTexto_(texto, maxLen) {
  if (!texto) return '';
  return texto.toString().replace(/[<>]/g, '').trim().substring(0, maxLen || 200);
}

// Evita "formula injection" en Sheets: si un valor empieza con =,+,-,@
// Google Sheets podría interpretarlo como fórmula. Le antepone un
// apóstrofo para que siempre se guarde como texto plano.
function celdaSegura_(valor) {
  const v = (valor === null || valor === undefined) ? '' : valor.toString();
  if (/^[=+\-@]/.test(v)) return "'" + v;
  return v;
}

// Escapa HTML antes de insertarlo en el cuerpo de un correo.
function escapeHtml_(texto) {
  if (!texto) return '';
  return texto.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Busca el objeto completo del curso, aplicando el estado abierto/cerrado
// que esté en la hoja "Config Cursos".
function buscarCurso_(nivel, curso) {
  const niveles = nivelesEfectivos_();
  const n = niveles.find(function (x) { return x.nombre === nivel; });
  if (!n) return null;
  return n.cursos.find(function (x) { return x.nombre === curso; }) || null;
}

function cursoValido_(nivel, curso) {
  const c = buscarCurso_(nivel, curso);
  return !!(c && c.abierto);
}

// Normaliza un nombre de archivo/curso para comparar: minúsculas, sin
// acentos, sin extensión, sin espacios sobrantes.
function normalizarNombreArchivo_(texto) {
  return texto.toString()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita acentos
    .replace(/\.[^/.]+$/, '') // quita extensión (.pdf)
    .trim();
}

// Busca, dentro de una carpeta de Drive y todas sus subcarpetas, un PDF
// cuyo nombre (sin acentos/mayúsculas/extensión) coincida con el nombre
// del curso. Devuelve el archivo (File) o null si no lo encuentra.
function buscarManualPorNombre_(folderId, nombreCurso) {
  if (!folderId) return null;
  const objetivo = normalizarNombreArchivo_(nombreCurso);
  const carpeta = DriveApp.getFolderById(folderId);
  return buscarManualEnCarpeta_(carpeta, objetivo);
}

function buscarManualEnCarpeta_(carpeta, objetivo) {
  const archivos = carpeta.getFilesByType(MimeType.PDF);
  while (archivos.hasNext()) {
    const archivo = archivos.next();
    if (normalizarNombreArchivo_(archivo.getName()) === objetivo) {
      return archivo;
    }
  }
  const subcarpetas = carpeta.getFolders();
  while (subcarpetas.hasNext()) {
    const encontrado = buscarManualEnCarpeta_(subcarpetas.next(), objetivo);
    if (encontrado) return encontrado;
  }
  return null;
}

// Revisa si esta persona (por correo) ya tiene una inscripción
// registrada para el mismo curso EN EL MISMO CICLO. Si ya lo tomó en
// un ciclo anterior (lo repitió porque reprobó, o pasó mucho tiempo),
// NO cuenta como duplicado — solo bloquea reintentos dentro del mismo
// periodo de inscripción.
function yaInscrito_(historialSheet, correo, curso, ciclo) {
  const data = historialSheet.getDataRange().getValues();
  const headers = data[0];
  const idxCorreo = headers.indexOf('Correo');
  const idxCurso = headers.indexOf('Curso');
  const idxCiclo = headers.indexOf('Ciclo');
  for (let i = 1; i < data.length; i++) {
    const fila = data[i];
    if (!fila[0]) continue;
    const mismoCorreo = fila[idxCorreo] && fila[idxCorreo].toString().toLowerCase() === correo.toLowerCase();
    const mismoCurso = fila[idxCurso] === curso;
    const mismoCiclo = idxCiclo === -1 || (fila[idxCiclo] || '').toString() === ciclo;
    if (mismoCorreo && mismoCurso && mismoCiclo) {
      return true;
    }
  }
  return false;
}

// Junta el nombre + todos los cursos de un correo ya autenticado
// (por folio o por enlace mágico — a este punto ya no importa cómo).
// Lee "Historial" y "Alumnos" de la misma hoja de cálculo.
function historialPorCorreo_(ss, correoLimpio) {
  const historial = ss.getSheetByName(CONFIG.SHEET_HISTORIAL);
  const data = historial.getDataRange().getValues();
  const headers = data[0];
  const idx = {
    folio: headers.indexOf('Folio'),
    fecha: headers.indexOf('Fecha'),
    correo: headers.indexOf('Correo'),
    nivel: headers.indexOf('Nivel'),
    curso: headers.indexOf('Curso'),
    estado: headers.indexOf('Estado'),
    resultado: headers.indexOf('Resultado'),
    ciclo: headers.indexOf('Ciclo')
  };

  const cursos = [];
  for (let i = 1; i < data.length; i++) {
    const fila = data[i];
    if (!fila[idx.folio]) continue;
    if (fila[idx.correo] && fila[idx.correo].toString().toLowerCase() === correoLimpio) {
      const resultadoCrudo = (fila[idx.resultado] || '').toString().trim();
      cursos.push({
        nivel: fila[idx.nivel],
        curso: fila[idx.curso],
        estado: fila[idx.estado],
        resultado: resultadoCrudo || 'En curso',
        fecha: Utilities.formatDate(new Date(fila[idx.fecha]), Session.getScriptTimeZone() || 'America/Mexico_City', 'dd/MM/yyyy'),
        ciclo: idx.ciclo !== -1 ? (fila[idx.ciclo] || '') : ''
      });
    }
  }

  let nombre = '';
  const alumnos = ss.getSheetByName(CONFIG.SHEET_ALUMNOS);
  if (alumnos) {
    const dataAlumnos = alumnos.getDataRange().getValues();
    for (let i = 1; i < dataAlumnos.length; i++) {
      if (dataAlumnos[i][0] && dataAlumnos[i][0].toString().toLowerCase() === correoLimpio) {
        nombre = dataAlumnos[i][1] || '';
        break;
      }
    }
  }

  return { nombre: nombre, cursos: cursos };
}

/**
 * Llamada pública desde Consulta.html. El alumno escribe su CORREO
 * + CUALQUIERA de sus folios (el que le llegó en cualquiera de sus
 * correos de confirmación). El folio tiene suficiente aleatoriedad
 * para funcionar como "contraseña" — nadie puede entrar solo con
 * el correo. Una vez comprobado, se le muestra el HISTORIAL
 * completo de todas sus inscripciones con ese correo.
 */
function buscarMiHistorial(correo, folio) {
  try {
    const correoLimpio = limpiarTexto_(correo, 120).toLowerCase();
    const folioLimpio = limpiarTexto_(folio, 40);
    if (!correoLimpio || !folioLimpio) {
      return { encontrado: false, error: 'Escribe tu correo y un folio.' };
    }

    const props = PropertiesService.getScriptProperties();
    const ssId = props.getProperty('SHEET_ID');
    if (!ssId) {
      return { encontrado: false, error: 'No se encontró ninguna inscripción.' };
    }

    const ss = SpreadsheetApp.openById(ssId);
    const historial = ss.getSheetByName(CONFIG.SHEET_HISTORIAL);
    const data = historial.getDataRange().getValues();
    const headers = data[0];
    const idxFolio = headers.indexOf('Folio');
    const idxCorreo = headers.indexOf('Correo');

    // ---- Comprobar identidad — el folio dado debe existir y
    // pertenecer exactamente a ese correo. ----
    let identidadValida = false;
    for (let i = 1; i < data.length; i++) {
      const fila = data[i];
      if (!fila[idxFolio]) continue;
      if (fila[idxFolio].toString() === folioLimpio &&
          fila[idxCorreo] && fila[idxCorreo].toString().toLowerCase() === correoLimpio) {
        identidadValida = true;
        break;
      }
    }
    if (!identidadValida) {
      return { encontrado: false, error: 'No encontramos ese folio asociado a ese correo.' };
    }

    const resultado = historialPorCorreo_(ss, correoLimpio);
    return { encontrado: true, nombre: resultado.nombre, cursos: resultado.cursos };
  } catch (err) {
    return { encontrado: false, error: 'Ocurrió un error al buscar tu historial.' };
  }
}

/**
 * ============================================================
 *  ENLACE MÁGICO — acceso al historial con un clic, sin folio
 * ============================================================
 *  El alumno pide un enlace desde Consulta.html con solo su correo.
 *  Se genera un token aleatorio (UUID, imposible de adivinar), se
 *  guarda en la hoja "AccesosMagicos" con una expiración de 30
 *  minutos, y se le manda por correo un botón que apunta a:
 *  TU_URL/exec?accion=consulta&token=ESE_TOKEN
 *  Al abrir ese enlace, doGet() detecta el token y Consulta.html
 *  entra directo a verificarlo — sin pedir folio.
 * ============================================================
 */
const MINUTOS_VIGENCIA_ENLACE_MAGICO = 30;

/**
 * ============================================================
 *  UTILIDAD: verificar que cada curso tenga su PDF
 * ============================================================
 *  No la usa el sistema — es solo para que TÚ la corras cuando
 *  quieras confirmar que los 17 manuales están bien nombrados en
 *  CONFIG.CARPETA_MANUALES_ID (y sus subcarpetas, si las tienes).
 *
 *  Cómo usarla:
 *  1. En el editor de Apps Script, selecciona esta función
 *     ("verificarManuales") en el menú de funciones y dale
 *     ▶ Ejecutar.
 *  2. Ve a "Ver" > "Registros" (o Ctrl+Enter): te dice, curso por
 *     curso, si encontró su PDF (✅) o no (❌ — revisa el nombre
 *     del archivo, debe coincidir con el nombre del curso).
 * ============================================================
 */
function verificarManuales() {
  let encontrados = 0;
  let faltantes = 0;

  CONFIG.NIVELES.forEach(function (nivel) {
    Logger.log('--- ' + nivel.nombre + ' ---');
    nivel.cursos.forEach(function (curso) {
      const archivo = buscarManualPorNombre_(CONFIG.CARPETA_MANUALES_ID, curso.nombre);
      if (archivo) {
        Logger.log('✅ ' + curso.nombre + '  →  ' + archivo.getName());
        encontrados++;
      } else {
        Logger.log('❌ ' + curso.nombre + '  (no se encontró un PDF con ese nombre)');
        faltantes++;
      }
    });
  });

  Logger.log('--- Resultado: ' + encontrados + ' encontrados, ' + faltantes + ' faltantes ---');
}


function obtenerHojaAccesos_(ss) {
  let hoja = ss.getSheetByName('AccesosMagicos');
  if (!hoja) {
    hoja = ss.insertSheet('AccesosMagicos');
    hoja.appendRow(['Token', 'Correo', 'Creado', 'Expira']);
    hoja.setFrozenRows(1);
  }
  return hoja;
}

/**
 * Llamada pública desde Consulta.html. Genera y envía el enlace
 * mágico si ese correo tiene al menos una inscripción. Por
 * privacidad, la respuesta es la MISMA tanto si el correo existe
 * como si no — así nadie puede usar este formulario para adivinar
 * qué correos están registrados en CCM.
 */
function solicitarEnlaceMagico(correo) {
  const mensajeGenerico = { ok: true, mensaje: 'Si ese correo tiene inscripciones registradas, te enviamos un enlace de acceso. Revisa tu bandeja de entrada (y spam).' };
  try {
    const correoLimpio = limpiarTexto_(correo, 120).toLowerCase();
    const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correoLimpio || !REGEX_CORREO.test(correoLimpio)) {
      return { ok: false, error: 'Escribe un correo electrónico válido.' };
    }

    const props = PropertiesService.getScriptProperties();
    const ssId = props.getProperty('SHEET_ID');
    if (!ssId) {
      return mensajeGenerico; // nada registrado todavía — misma respuesta genérica
    }

    const ss = SpreadsheetApp.openById(ssId);
    const historial = ss.getSheetByName(CONFIG.SHEET_HISTORIAL);
    const data = historial.getDataRange().getValues();
    const headers = data[0];
    const idxCorreo = headers.indexOf('Correo');
    let tieneInscripciones = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][idxCorreo] && data[i][idxCorreo].toString().toLowerCase() === correoLimpio) {
        tieneInscripciones = true;
        break;
      }
    }
    if (!tieneInscripciones) {
      return mensajeGenerico; // no delatamos que ese correo no existe
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    let token;
    try {
      const hojaAccesos = obtenerHojaAccesos_(ss);

      // Limpieza ligera: borra tokens ya vencidos para que la hoja no crezca sin control.
      const filasAccesos = hojaAccesos.getDataRange().getValues();
      const ahora = new Date();
      for (let i = filasAccesos.length - 1; i >= 1; i--) {
        if (filasAccesos[i][3] && new Date(filasAccesos[i][3]) < ahora) {
          hojaAccesos.deleteRow(i + 1);
        }
      }

      token = Utilities.getUuid();
      const expira = new Date(Date.now() + MINUTOS_VIGENCIA_ENLACE_MAGICO * 60 * 1000);
      hojaAccesos.appendRow([token, celdaSegura_(correoLimpio), new Date(), expira]);
    } finally {
      lock.releaseLock();
    }

    const enlace = urlApp_() + '?accion=consulta&token=' + token;
    const logoEnlace = logoBlob_();
    const encabezadoLogoEnlace = logoEnlace
      ? '<div style="text-align:center;margin-bottom:14px;"><img src="cid:logoCCM" alt="CCM" style="width:120px;height:auto;"></div>'
      : '';
    const htmlBody =
      '<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;">' +
      encabezadoLogoEnlace +
      '<h2 style="color:#187095;">CCM — Tu enlace de acceso</h2>' +
      '<p>Da clic en el siguiente botón para ver tu historial CCM. Este enlace es válido por ' + MINUTOS_VIGENCIA_ENLACE_MAGICO + ' minutos.</p>' +
      '<p style="text-align:center;margin:24px 0;">' +
      '<a href="' + enlace + '" style="background:#f7a41d;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Ver mi historial CCM</a>' +
      '</p>' +
      '<p style="font-size:12px;color:#888;">Si tú no pediste este enlace, puedes ignorar este correo.</p>' +
      '</div>';

    const opcionesEnlace = {
      to: correoLimpio,
      subject: 'Tu enlace de acceso — Historial CCM',
      htmlBody: htmlBody
    };
    if (logoEnlace) {
      opcionesEnlace.inlineImages = { logoCCM: logoEnlace };
    }
    MailApp.sendEmail(opcionesEnlace);

    return mensajeGenerico;
  } catch (err) {
    return { ok: false, error: 'Ocurrió un error al enviar tu enlace. Intenta de nuevo.' };
  }
}

/**
 * Llamada pública desde Consulta.html al detectar ?token= en la URL.
 * Verifica que el token exista y no haya expirado, y de ser así
 * regresa el historial directamente — sin pedir folio.
 */
function verificarEnlaceMagico(token) {
  try {
    const tokenLimpio = limpiarTexto_(token, 60);
    if (!tokenLimpio) {
      return { encontrado: false, error: 'Enlace inválido.' };
    }

    const props = PropertiesService.getScriptProperties();
    const ssId = props.getProperty('SHEET_ID');
    if (!ssId) {
      return { encontrado: false, error: 'Enlace inválido o expirado. Solicita uno nuevo.' };
    }

    const ss = SpreadsheetApp.openById(ssId);
    const hojaAccesos = obtenerHojaAccesos_(ss);
    const data = hojaAccesos.getDataRange().getValues();

    let correoEncontrado = null;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString() === tokenLimpio) {
        const expira = new Date(data[i][3]);
        if (expira >= new Date()) {
          correoEncontrado = data[i][1].toString().toLowerCase();
        }
        break;
      }
    }

    if (!correoEncontrado) {
      return { encontrado: false, error: 'Enlace inválido o expirado. Solicita uno nuevo.' };
    }

    const resultado = historialPorCorreo_(ss, correoEncontrado);
    return { encontrado: true, nombre: resultado.nombre, cursos: resultado.cursos };
  } catch (err) {
    return { encontrado: false, error: 'Ocurrió un error al verificar tu enlace.' };
  }
}

/**
 * Función principal llamada desde el formulario (google.script.run).
 * data = {
 *   nombre, telefono, correo, nivel, curso, metodoPago,
 *   comprobanteBase64, comprobanteNombre, comprobanteTipo
 * }
 */
function registrarInscripcion(data) {
  try {
    // ---- El periodo de inscripciones debe estar abierto ----
    if (!estadoInscripciones_().abiertas) {
      throw new Error('Las inscripciones están cerradas en este momento.');
    }

    if (!data) {
      throw new Error('Faltan datos obligatorios.');
    }

    // ---- Limpia PRIMERO, valida DESPUÉS (evita que " " pase el check) ----
    const nombre = limpiarTexto_(data.nombre, 120);
    const telefono = limpiarTexto_(data.telefono, 30);
    // El correo se guarda SIEMPRE en minúsculas: es la llave que une
    // "Alumnos" con "Historial", así que debe quedar consistente aunque
    // la persona lo escriba con mayúsculas.
    const correo = limpiarTexto_(data.correo, 120).toLowerCase();
    const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!nombre || !telefono || !correo || !data.nivel || !data.curso) {
      throw new Error('Faltan datos obligatorios.');
    }
    if (!REGEX_CORREO.test(correo)) {
      throw new Error('El correo electrónico no es válido.');
    }
    if (!data.comprobanteBase64) {
      throw new Error('Debes adjuntar tu comprobante de pago.');
    }

    // ---- Validación server-side del curso contra el catálogo oficial ----
    if (!cursoValido_(data.nivel, data.curso)) {
      throw new Error('El nivel o curso seleccionado no es válido.');
    }

    // ---- Validación del comprobante (tipo y tamaño) ----
    const tipo = data.comprobanteTipo || '';
    if (CONFIG.TIPOS_PERMITIDOS.indexOf(tipo) === -1) {
      throw new Error('El comprobante debe ser JPG, PNG o PDF.');
    }
    const base64Limpio = data.comprobanteBase64.split(',').pop();
    const bytes = Utilities.base64Decode(base64Limpio);
    const tamanoMB = bytes.length / (1024 * 1024);
    if (tamanoMB > CONFIG.MAX_ARCHIVO_MB) {
      throw new Error('El comprobante supera el límite de ' + CONFIG.MAX_ARCHIVO_MB + ' MB.');
    }

    // ---- Revisión temprana de duplicado (antes de gastar tiempo/espacio
    // subiendo el archivo a Drive). No es la verificación definitiva —
    // esa ocurre más abajo, dentro del lock — pero evita el caso común
    // de alguien reenviando el mismo formulario dos veces. ----
    const ciclo = cicloActual_();
    const hojasPrevias = getHojas_();
    if (yaInscrito_(hojasPrevias.historial, correo, data.curso, ciclo)) {
      throw new Error('Ya tienes una inscripción registrada para este curso en este ciclo.');
    }

    // ---- Sube el comprobante a Drive (fuera del lock: puede tardar) ----
    const folder = getFolder_();
    const nombreArchivo = sanitizarNombreArchivo_(nombre) + ' - ' + sanitizarNombreArchivo_(data.comprobanteNombre || 'comprobante');
    const blob = Utilities.newBlob(bytes, tipo, nombreArchivo);
    const file = folder.createFile(blob);
    const comprobanteUrl = file.getUrl();

    // ---- Sección crítica: dar de alta/actualizar al alumno + revisar
    // duplicado OTRA VEZ (por si dos solicitudes pasaron la revisión
    // temprana casi al mismo tiempo) + guardar fila en "Historial",
    // TODO bajo el mismo bloqueo — esta es la verificación que de
    // verdad evita el duplicado. ----
    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    let historial, folio, filaGuardada;
    try {
      const hojas = obtenerHojasSinLock_();
      historial = hojas.historial;

      upsertAlumno_(hojas.alumnos, correo, nombre, telefono);

      if (yaInscrito_(historial, correo, data.curso, ciclo)) {
        throw new Error('Ya tienes una inscripción registrada para este curso en este ciclo.');
      }

      // Folio único. El timestamp con segundos + azar puede repetirse si
      // dos personas se inscriben en el mismo segundo, y el folio es la
      // "contraseña" del historial — así que verificamos contra los ya
      // existentes y reintentamos hasta obtener uno realmente libre.
      // (Estamos dentro del lock, así que nadie más puede insertar aquí.)
      const foliosExistentes = {};
      const datosPrevios = historial.getDataRange().getValues();
      for (let i = 1; i < datosPrevios.length; i++) {
        if (datosPrevios[i][0]) foliosExistentes[datosPrevios[i][0].toString()] = true;
      }
      const marcaTiempo = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'America/Mexico_City', 'yyMMdd-HHmmss');
      let intentos = 0;
      do {
        folio = 'CCM-' + marcaTiempo + '-' + Math.floor(1000 + Math.random() * 9000);
        intentos++;
      } while (foliosExistentes[folio] && intentos < 50);
      if (foliosExistentes[folio]) {
        // Caso extremadamente improbable: añadimos un sufijo aleatorio extra
        folio = folio + '-' + Utilities.getUuid().substring(0, 6);
      }

      historial.appendRow([
        celdaSegura_(folio),
        new Date(),
        celdaSegura_(correo),
        celdaSegura_(data.nivel),
        celdaSegura_(data.curso),
        precioEfectivo_(),
        celdaSegura_(data.metodoPago || 'Transferencia/Depósito'),
        comprobanteUrl,
        'Inscrito',
        '',
        '',
        celdaSegura_(ciclo)
      ]);
      filaGuardada = historial.getLastRow();
    } finally {
      lock.releaseLock();
    }

    // A partir de aquí la inscripción YA QUEDÓ GUARDADA. Cualquier fallo
    // secundario (correo, o incluso anotar el error en "Notas") NO debe
    // convertir esto en un error para el alumno — siempre devolvemos éxito
    // con su folio a partir de este punto.
    const notasErrores = [];

    if (CONFIG.ADMIN_EMAIL) {
      try {
        MailApp.sendEmail({
          to: CONFIG.ADMIN_EMAIL,
          subject: 'Nueva inscripción CCM: ' + nombre + ' (' + folio + ')',
          body: 'Folio: ' + folio + '\n' +
                'Nombre: ' + nombre + '\n' +
                'Teléfono: ' + telefono + '\n' +
                'Correo: ' + (correo || '-') + '\n' +
                'Nivel: ' + data.nivel + '\n' +
                'Curso: ' + data.curso + '\n' +
                'Precio: $' + precioEfectivo_() + ' MXN\n' +
                'Comprobante: ' + comprobanteUrl
        });
      } catch (errCorreo) {
        notasErrores.push('Falló correo a admin: ' + errCorreo.message);
      }
    }

    try {
      // ---- Busca automáticamente el PDF del manual por nombre de archivo ----
      let manualBlob = null;
      let manualAdjuntado = false;
      if (CONFIG.CARPETA_MANUALES_ID) {
        try {
          const archivoManual = buscarManualPorNombre_(CONFIG.CARPETA_MANUALES_ID, data.curso);
          if (archivoManual) {
            manualBlob = archivoManual.getBlob();
            manualAdjuntado = true;
          }
        } catch (errManual) {
          notasErrores.push('No se pudo buscar/adjuntar el manual: ' + errManual.message);
        }
      }

      const lineaManual = manualAdjuntado
        ? '<p>Va adjunto el manual del curso en PDF.</p>'
        : '';

      const logo = logoBlob_();
      const encabezadoLogo = logo
        ? '<div style="text-align:center;margin-bottom:14px;"><img src="cid:logoCCM" alt="CCM" style="width:120px;height:auto;"></div>'
        : '';

      const htmlBody =
        '<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;">' +
        encabezadoLogo +
        '<h2 style="color:#187095;">CCM — Confirmación de inscripción</h2>' +
        '<p>Hola <strong>' + escapeHtml_(nombre) + '</strong>,</p>' +
        '<p>Recibimos tu inscripción con los siguientes datos:</p>' +
        '<table style="width:100%;border-collapse:collapse;font-size:14px;">' +
        '<tr><td style="padding:4px 0;color:#666;">Folio</td><td><strong>' + escapeHtml_(folio) + '</strong></td></tr>' +
        '<tr><td style="padding:4px 0;color:#666;">Nivel</td><td>' + escapeHtml_(data.nivel) + '</td></tr>' +
        '<tr><td style="padding:4px 0;color:#666;">Curso</td><td>' + escapeHtml_(data.curso) + '</td></tr>' +
        '<tr><td style="padding:4px 0;color:#666;">Monto</td><td>$' + precioEfectivo_() + ' MXN</td></tr>' +
        '<tr><td style="padding:4px 0;color:#666;">Estado</td><td>Inscrito</td></tr>' +
        '</table>' +
        '<p style="margin-top:16px;">Guarda este folio como comprobante de tu inscripción.</p>' +
        lineaManual +
        '<p>Más adelante, cuando termine el curso, podrás consultar tu resultado (aprobado o no) y todo tu historial de cursos en: ' +
        '<a href="' + urlApp_() + '?accion=consulta">' + urlApp_() + '?accion=consulta</a>. ' +
        'Necesitarás tu correo y este folio (o cualquier otro que tengas de CCM).</p>' +
        '<p>Gracias por inscribirte a CCM.</p>' +
        '</div>';

      const opcionesCorreo = {
        to: correo,
        subject: 'Confirmación de inscripción — ' + data.curso,
        htmlBody: htmlBody
      };
      if (logo) {
        opcionesCorreo.inlineImages = { logoCCM: logo };
      }
      if (manualBlob) {
        opcionesCorreo.attachments = [manualBlob];
      }

      MailApp.sendEmail(opcionesCorreo);
    } catch (errCorreo) {
      notasErrores.push('Falló correo a alumno: ' + errCorreo.message);
    }

    if (notasErrores.length > 0) {
      try {
        historial.getRange(filaGuardada, 11).setValue(notasErrores.join(' | '));
      } catch (errNotas) {
        Logger.log('No se pudo escribir Notas para ' + folio + ': ' + errNotas.message);
      }
    }

    return { ok: true, folio: folio };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * ============================================================
 *  REPORTE DE INSCRIPCIONES (alumnos, dinero, por curso/nivel/estado)
 * ============================================================
 *  Se genera dentro de la MISMA hoja de cálculo, en una pestaña
 *  llamada "Reporte", con tablas y gráficas nativas de Google
 *  Sheets (gratis, sin API externa). Lee la hoja "Historial".
 *
 *  Toda inscripción entra directo como "Inscrito" (no hay paso de
 *  confirmación manual). Si alguna vez detectas un comprobante
 *  inválido, puedes marcar esa fila escribiendo en la columna
 *  "Estado" cualquier texto que CONTENGA la palabra "rechaz" (ej.
 *  "Rechazado") y el reporte la separará del total.
 *
 *  Para actualizarlo tienes DOS formas, elige la que prefieras:
 *  A) Navegador: TU_URL/exec?accion=reporte&token=TU_REPORTE_TOKEN
 *  B) Editor de Apps Script: selecciona "generarReporte" y ▶ Ejecutar.
 * ============================================================
 */
function clasificarEstado_(estado) {
  const e = (estado || '').toString().toLowerCase();
  if (e.indexOf('rechaz') !== -1) return 'rechazado';
  return 'inscrito';
}

/**
 * Entrega TODOS los registros al dashboard (Reporte.html) para que
 * ahí se filtren y grafiquen. Protegida por el mismo token del
 * reporte: sin token válido no devuelve nada.
 */
/**
 * Marca el resultado de una inscripción (Aprobado / No aprobado / En curso)
 * desde el dashboard, sin tener que abrir la hoja. Protegida por token.
 * Se ubica la fila por FOLIO, que es único.
 */
function marcarResultado(token, folio, resultado) {
  try {
    if (!tokenReporteValido_(token)) {
      return { ok: false, error: 'No autorizado.' };
    }
    const permitidos = ['Aprobado', 'No aprobado', 'En curso'];
    if (permitidos.indexOf(resultado) === -1) {
      return { ok: false, error: 'Resultado no válido.' };
    }
    const folioLimpio = limpiarTexto_(folio, 40);
    if (!folioLimpio) return { ok: false, error: 'Folio no válido.' };

    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
      const ssId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
      if (!ssId) return { ok: false, error: 'No hay registros todavía.' };

      const hoja = SpreadsheetApp.openById(ssId).getSheetByName(CONFIG.SHEET_HISTORIAL);
      const datos = hoja.getDataRange().getValues();
      const headers = datos[0];
      const idxFolio = headers.indexOf('Folio');
      const idxResultado = headers.indexOf('Resultado');
      if (idxResultado === -1) return { ok: false, error: 'No existe la columna "Resultado".' };

      for (let i = 1; i < datos.length; i++) {
        if (datos[i][idxFolio] && datos[i][idxFolio].toString() === folioLimpio) {
          // "En curso" se guarda como celda vacía, que es el estado por defecto
          const valor = (resultado === 'En curso') ? '' : resultado;
          hoja.getRange(i + 1, idxResultado + 1).setValue(valor);
          return { ok: true, folio: folioLimpio, resultado: resultado };
        }
      }
      return { ok: false, error: 'No se encontró ese folio.' };
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * ============================================================
 *  PANEL DE MAESTROS
 * ============================================================
 *  El maestro entra con su cuenta de Google a la implementación
 *  configurada como "Ejecutar como: usuario que accede". El sistema
 *  lee su correo y le muestra SOLO los cursos que tiene asignados
 *  en el CICLO ACTIVO (los ciclos pasados solo los ve el admin).
 * ============================================================
 */

// Correo del maestro que está usando el panel en este momento.
function correoMaestroActual_() {
  try {
    return (Session.getActiveUser().getEmail() || '').toLowerCase();
  } catch (err) {
    return '';
  }
}

// Devuelve las asignaciones (cursos) de un maestro en el ciclo activo.
function asignacionesDeMaestro_(ss, correoMaestro, ciclo) {
  const hoja = ss.getSheetByName(CONFIG.SHEET_MAESTROS);
  if (!hoja) return [];
  const datos = hoja.getDataRange().getValues();
  const asignaciones = [];

  for (let i = 1; i < datos.length; i++) {
    const f = datos[i];
    const correoFila = (f[1] || '').toString().trim().toLowerCase();
    const cicloFila = (f[4] || '').toString().trim();
    if (correoFila !== correoMaestro || cicloFila !== ciclo) continue;

    const fechas = [];
    for (let c = 0; c < CONFIG.CLASES_POR_CURSO; c++) {
      const v = f[6 + c];
      fechas.push(v ? formatearFechaCorta_(v) : '');
    }

    asignaciones.push({
      fila: i + 1,
      maestro: (f[0] || '').toString(),
      nivel: (f[2] || '').toString(),
      curso: (f[3] || '').toString(),
      ciclo: cicloFila,
      estado: ((f[5] || 'Abierto').toString().trim().toLowerCase().indexOf('cerrad') !== -1) ? 'Cerrado' : 'Abierto',
      fechas: fechas
    });
  }
  return asignaciones;
}

function formatearFechaCorta_(valor) {
  try {
    if (valor instanceof Date) {
      return Utilities.formatDate(valor, Session.getScriptTimeZone() || 'America/Mexico_City', 'dd/MM');
    }
    return valor.toString().trim();
  } catch (err) {
    return '';
  }
}

// Convierte número de asistencias a puntos de rúbrica (1 a 4).
function puntosAsistencia_(asistencias) {
  if (asistencias <= 2) return 1;
  if (asistencias <= 4) return 2;
  if (asistencias <= 6) return 3;
  return 4;
}

/**
 * Llamada desde Maestro.html al cargar. Devuelve los cursos del maestro
 * en el ciclo activo, cada uno con su lista de alumnos inscritos,
 * asistencia y calificaciones ya cargadas.
 */
function getPanelMaestro() {
  try {
    const correoMaestro = correoMaestroActual_();
    if (!correoMaestro) {
      return { ok: false, error: 'No pudimos identificar tu cuenta de Google. Asegúrate de haber iniciado sesión.' };
    }

    const ssId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    if (!ssId) return { ok: false, error: 'Todavía no hay datos registrados.' };
    const ss = SpreadsheetApp.openById(ssId);

    const ciclo = cicloActual_();
    const asignaciones = asignacionesDeMaestro_(ss, correoMaestro, ciclo);
    if (asignaciones.length === 0) {
      return { ok: true, correo: correoMaestro, ciclo: ciclo, cursos: [] };
    }

    // ---- Índices de las hojas que vamos a cruzar ----
    const historial = ss.getSheetByName(CONFIG.SHEET_HISTORIAL);
    const datosHist = historial.getDataRange().getValues();
    const hH = datosHist[0];
    const iH = {
      folio: hH.indexOf('Folio'), correo: hH.indexOf('Correo'),
      nivel: hH.indexOf('Nivel'), curso: hH.indexOf('Curso'),
      resultado: hH.indexOf('Resultado'), ciclo: hH.indexOf('Ciclo')
    };

    const nombrePorCorreo = {};
    const alumnosSheet = ss.getSheetByName(CONFIG.SHEET_ALUMNOS);
    if (alumnosSheet) {
      const da = alumnosSheet.getDataRange().getValues();
      for (let i = 1; i < da.length; i++) {
        if (da[i][0]) nombrePorCorreo[da[i][0].toString().toLowerCase()] = da[i][1] || '';
      }
    }

    const califPorFolio = {};
    const hojaCalif = ss.getSheetByName(CONFIG.SHEET_CALIFICACIONES);
    if (hojaCalif) {
      const dc = hojaCalif.getDataRange().getValues();
      for (let i = 1; i < dc.length; i++) {
        if (!dc[i][0]) continue;
        califPorFolio[dc[i][0].toString()] = {
          participacion: dc[i][4] === '' || dc[i][4] === null ? null : Number(dc[i][4]),
          trabajos: dc[i][5] === '' || dc[i][5] === null ? null : Number(dc[i][5])
        };
      }
    }

    const asistPorFolio = {};
    const hojaAsist = ss.getSheetByName(CONFIG.SHEET_ASISTENCIA);
    if (hojaAsist) {
      const da2 = hojaAsist.getDataRange().getValues();
      for (let i = 1; i < da2.length; i++) {
        if (!da2[i][0]) continue;
        const clases = [];
        for (let c = 0; c < CONFIG.CLASES_POR_CURSO; c++) {
          clases.push(da2[i][4 + c] === true || da2[i][4 + c] === 'SI');
        }
        asistPorFolio[da2[i][0].toString()] = clases;
      }
    }

    // ---- Arma cada curso con sus alumnos ----
    const cursos = asignaciones.map(function (asig) {
      const alumnos = [];
      for (let i = 1; i < datosHist.length; i++) {
        const f = datosHist[i];
        if (!f[iH.folio]) continue;
        if ((f[iH.curso] || '').toString() !== asig.curso) continue;
        if ((f[iH.ciclo] || '').toString() !== asig.ciclo) continue;

        const folio = f[iH.folio].toString();
        const correo = (f[iH.correo] || '').toString().toLowerCase();
        const clases = asistPorFolio[folio] || new Array(CONFIG.CLASES_POR_CURSO).fill(false);
        const totalAsist = clases.filter(function (x) { return x; }).length;
        const cal = califPorFolio[folio] || { participacion: null, trabajos: null };

        alumnos.push({
          folio: folio,
          correo: correo,
          nombre: nombrePorCorreo[correo] || correo,
          clases: clases,
          asistencias: totalAsist,
          puntosAsistencia: puntosAsistencia_(totalAsist),
          participacion: cal.participacion,
          trabajos: cal.trabajos,
          resultadoPublicado: (f[iH.resultado] || '').toString().trim()
        });
      }
      alumnos.sort(function (a, b) { return a.nombre.localeCompare(b.nombre); });

      return {
        nivel: asig.nivel, curso: asig.curso, ciclo: asig.ciclo,
        estado: asig.estado, fechas: asig.fechas, maestro: asig.maestro,
        alumnos: alumnos
      };
    });

    return {
      ok: true,
      correo: correoMaestro,
      ciclo: ciclo,
      clasesPorCurso: CONFIG.CLASES_POR_CURSO,
      cursos: cursos
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// Verifica que el maestro tenga permiso sobre ese curso y que siga abierto.
function validarAccesoMaestro_(ss, curso, ciclo) {
  const correoMaestro = correoMaestroActual_();
  if (!correoMaestro) return { ok: false, error: 'No pudimos identificar tu cuenta.' };
  const asignaciones = asignacionesDeMaestro_(ss, correoMaestro, ciclo);
  const asig = asignaciones.find(function (a) { return a.curso === curso; });
  if (!asig) return { ok: false, error: 'No tienes asignado este curso en el ciclo actual.' };
  if (asig.estado === 'Cerrado') return { ok: false, error: 'Este curso ya fue cerrado. Pide al administrador que lo reabra si necesitas corregir algo.' };
  return { ok: true, asignacion: asig };
}

/** Guarda Participación y Trabajos de un alumno. */
function guardarCalificacion(folio, curso, ciclo, participacion, trabajos) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const ssId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    if (!ssId) return { ok: false, error: 'No hay datos.' };
    const ss = SpreadsheetApp.openById(ssId);

    const acceso = validarAccesoMaestro_(ss, curso, ciclo);
    if (!acceso.ok) return acceso;

    const valida = function (v) {
      if (v === null || v === '' || v === undefined) return '';
      const n = Number(v);
      return (n >= 1 && n <= 4) ? n : '';
    };
    const p = valida(participacion);
    const t = valida(trabajos);

    const hoja = crearHojaCalificacionesSiFalta_(ss);
    const datos = hoja.getDataRange().getValues();
    const folioLimpio = limpiarTexto_(folio, 40);

    for (let i = 1; i < datos.length; i++) {
      if (datos[i][0] && datos[i][0].toString() === folioLimpio) {
        hoja.getRange(i + 1, 5, 1, 3).setValues([[p, t, new Date()]]);
        return { ok: true };
      }
    }
    hoja.appendRow([celdaSegura_(folioLimpio), '', celdaSegura_(curso), celdaSegura_(ciclo), p, t, new Date()]);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  } finally {
    lock.releaseLock();
  }
}

/** Guarda la asistencia de un alumno (arreglo de 8 valores true/false). */
function guardarAsistencia(folio, curso, ciclo, clases) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const ssId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    if (!ssId) return { ok: false, error: 'No hay datos.' };
    const ss = SpreadsheetApp.openById(ssId);

    const acceso = validarAccesoMaestro_(ss, curso, ciclo);
    if (!acceso.ok) return acceso;

    if (!Array.isArray(clases) || clases.length !== CONFIG.CLASES_POR_CURSO) {
      return { ok: false, error: 'Datos de asistencia no válidos.' };
    }
    const valores = clases.map(function (x) { return x === true; });

    const hoja = crearHojaAsistenciaSiFalta_(ss);
    const datos = hoja.getDataRange().getValues();
    const folioLimpio = limpiarTexto_(folio, 40);
    const colActualizado = 5 + CONFIG.CLASES_POR_CURSO;

    for (let i = 1; i < datos.length; i++) {
      if (datos[i][0] && datos[i][0].toString() === folioLimpio) {
        hoja.getRange(i + 1, 5, 1, CONFIG.CLASES_POR_CURSO).setValues([valores]);
        hoja.getRange(i + 1, colActualizado).setValue(new Date());
        return { ok: true, asistencias: valores.filter(function (x) { return x; }).length };
      }
    }
    hoja.appendRow([celdaSegura_(folioLimpio), '', celdaSegura_(curso), celdaSegura_(ciclo)]
      .concat(valores).concat([new Date()]));
    return { ok: true, asistencias: valores.filter(function (x) { return x; }).length };
  } catch (err) {
    return { ok: false, error: err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Cierra el curso: publica los resultados al historial de cada alumno,
 * marca como "Baja" a quien tenga 0 asistencias, y bloquea el panel.
 */
function cerrarCurso(curso, ciclo) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ssId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    if (!ssId) return { ok: false, error: 'No hay datos.' };
    const ss = SpreadsheetApp.openById(ssId);

    const acceso = validarAccesoMaestro_(ss, curso, ciclo);
    if (!acceso.ok) return acceso;

    // Trae el estado actual de los alumnos de ese curso
    const panel = getPanelMaestro();
    if (!panel.ok) return panel;
    const cursoDatos = panel.cursos.find(function (c) { return c.curso === curso && c.ciclo === ciclo; });
    if (!cursoDatos) return { ok: false, error: 'No se encontró el curso.' };

    const historial = ss.getSheetByName(CONFIG.SHEET_HISTORIAL);
    const datosHist = historial.getDataRange().getValues();
    const hH = datosHist[0];
    const iFolio = hH.indexOf('Folio');
    const iResultado = hH.indexOf('Resultado');

    let acreditados = 0, noAcreditados = 0, bajas = 0;

    cursoDatos.alumnos.forEach(function (al) {
      let resultado;
      if (al.asistencias === 0) {
        resultado = 'Baja';
        bajas++;
      } else {
        const p = al.participacion === null ? 0 : al.participacion;
        const t = al.trabajos === null ? 0 : al.trabajos;
        const calificacion = ((al.puntosAsistencia + p + t) / 12) * 10;
        if (calificacion > 6) { resultado = 'Acreditado'; acreditados++; }
        else { resultado = 'No acreditado'; noAcreditados++; }
      }

      for (let i = 1; i < datosHist.length; i++) {
        if (datosHist[i][iFolio] && datosHist[i][iFolio].toString() === al.folio) {
          historial.getRange(i + 1, iResultado + 1).setValue(resultado);
          break;
        }
      }
    });

    // Marca la asignación como cerrada
    const hojaMaestros = ss.getSheetByName(CONFIG.SHEET_MAESTROS);
    hojaMaestros.getRange(acceso.asignacion.fila, 6).setValue('Cerrado');

    return {
      ok: true,
      acreditados: acreditados,
      noAcreditados: noAcreditados,
      bajas: bajas,
      total: cursoDatos.alumnos.length
    };
  } catch (err) {
    return { ok: false, error: err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * ============================================================
 *  PREPARAR NUEVO CICLO (para el administrador)
 * ============================================================
 *  Ejecuta esta función desde el editor de Apps Script cuando vayas
 *  a abrir un nuevo ciclo. Hace tres cosas:
 *   1. Te pide las fechas de inscripción y la fecha de la clase 1
 *   2. Genera las 8 fechas de clase (semanales) automáticamente
 *   3. Copia las asignaciones de maestros del ciclo anterior al nuevo,
 *      con estado "Abierto", para que solo edites las que cambian
 *
 *  Los datos de ciclos anteriores NO se borran: quedan en las hojas
 *  para consulta desde tu reporte.
 * ============================================================
 */
function prepararNuevoCiclo() {
  const ui = SpreadsheetApp.getUi ? null : null; // el editor no tiene UI de hoja
  const hojas = getHojas_();
  const ss = hojas.ss;

  // ---- EDITA ESTOS TRES VALORES ANTES DE EJECUTAR ----
  const FECHA_INICIO_INSCRIPCIONES = '2026-09-01';  // AAAA-MM-DD
  const FECHA_FIN_INSCRIPCIONES    = '2026-09-15';  // AAAA-MM-DD
  const FECHA_PRIMERA_CLASE        = '2026-09-21';  // AAAA-MM-DD (normalmente un lunes)
  // ----------------------------------------------------

  // 1. Actualiza las fechas de inscripción
  const hAjustes = ss.getSheetByName(CONFIG.SHEET_AJUSTES);
  const datosAj = hAjustes.getDataRange().getValues();
  for (let i = 1; i < datosAj.length; i++) {
    const clave = (datosAj[i][0] || '').toString().trim().toLowerCase();
    if (clave === 'fecha inicio inscripciones') hAjustes.getRange(i + 1, 2).setValue(FECHA_INICIO_INSCRIPCIONES);
    if (clave === 'fecha fin inscripciones') hAjustes.getRange(i + 1, 2).setValue(FECHA_FIN_INSCRIPCIONES);
  }

  const cicloNuevo = cicloActual_();

  // 2. Genera las 8 fechas de clase, una por semana
  const fechas = [];
  const base = new Date(FECHA_PRIMERA_CLASE + 'T12:00:00');
  for (let i = 0; i < CONFIG.CLASES_POR_CURSO; i++) {
    const d = new Date(base.getTime());
    d.setDate(d.getDate() + (i * 7));
    fechas.push(Utilities.formatDate(d, Session.getScriptTimeZone() || 'America/Mexico_City', 'dd/MM'));
  }

  // 3. Copia las asignaciones del ciclo anterior (el más reciente que no sea el nuevo)
  const hMaestros = crearHojaMaestrosSiFalta_(ss);
  const datosM = hMaestros.getDataRange().getValues();

  const ciclosPrevios = {};
  for (let i = 1; i < datosM.length; i++) {
    const c = (datosM[i][4] || '').toString().trim();
    if (c && c !== cicloNuevo) ciclosPrevios[c] = i;
  }
  const nombresPrevios = Object.keys(ciclosPrevios);
  const cicloAnterior = nombresPrevios.length ? nombresPrevios[nombresPrevios.length - 1] : null;

  let copiadas = 0;
  const yaExiste = datosM.some(function (f) { return (f[4] || '').toString().trim() === cicloNuevo; });

  if (cicloAnterior && !yaExiste) {
    for (let i = 1; i < datosM.length; i++) {
      if ((datosM[i][4] || '').toString().trim() !== cicloAnterior) continue;
      const fila = [
        datosM[i][0], datosM[i][1], datosM[i][2], datosM[i][3],
        cicloNuevo, 'Abierto'
      ].concat(fechas);
      hMaestros.appendRow(fila);
      copiadas++;
    }
  }

  Logger.log('--- Nuevo ciclo preparado ---');
  Logger.log('Ciclo: ' + cicloNuevo);
  Logger.log('Inscripciones: ' + FECHA_INICIO_INSCRIPCIONES + ' al ' + FECHA_FIN_INSCRIPCIONES);
  Logger.log('Fechas de clase: ' + fechas.join(', '));
  if (yaExiste) {
    Logger.log('Ya existían asignaciones para este ciclo — no se copió nada.');
  } else if (copiadas > 0) {
    Logger.log('Se copiaron ' + copiadas + ' asignaciones de "' + cicloAnterior + '".');
    Logger.log('AHORA: abre "Config Maestros" y ajusta qué maestro da cada curso este ciclo.');
  } else {
    Logger.log('No había ciclo anterior. Agrega las asignaciones a mano en "Config Maestros".');
  }
  Logger.log('Recuerda también marcar en "Config Cursos" qué cursos abres este ciclo.');
  Logger.log('Hoja: ' + ss.getUrl());
}

function getDatosReporte(token) {
  try {
    if (!tokenReporteValido_(token)) {
      return { ok: false, error: 'No autorizado.' };
    }

    const props = PropertiesService.getScriptProperties();
    const ssId = props.getProperty('SHEET_ID');
    if (!ssId) {
      return { ok: true, registros: [], nota: 'Todavía no hay inscripciones registradas.' };
    }

    const ss = SpreadsheetApp.openById(ssId);
    const historialSheet = ss.getSheetByName(CONFIG.SHEET_HISTORIAL);
    if (!historialSheet) {
      return { ok: true, registros: [], nota: 'Todavía no hay inscripciones registradas.' };
    }

    // Mapa correo -> nombre, desde la hoja "Alumnos"
    const nombrePorCorreo = {};
    const alumnosSheet = ss.getSheetByName(CONFIG.SHEET_ALUMNOS);
    if (alumnosSheet) {
      const da = alumnosSheet.getDataRange().getValues();
      for (let i = 1; i < da.length; i++) {
        if (da[i][0]) nombrePorCorreo[da[i][0].toString().toLowerCase()] = da[i][1] || '';
      }
    }

    const data = historialSheet.getDataRange().getValues();
    const headers = data[0];
    const idx = {
      folio: headers.indexOf('Folio'),
      fecha: headers.indexOf('Fecha'),
      correo: headers.indexOf('Correo'),
      nivel: headers.indexOf('Nivel'),
      curso: headers.indexOf('Curso'),
      precio: headers.indexOf('Precio'),
      estado: headers.indexOf('Estado'),
      resultado: headers.indexOf('Resultado'),
      ciclo: headers.indexOf('Ciclo')
    };

    const tz = Session.getScriptTimeZone() || 'America/Mexico_City';
    const registros = [];
    for (let i = 1; i < data.length; i++) {
      const f = data[i];
      if (!f[idx.folio]) continue;
      const correo = (f[idx.correo] || '').toString().toLowerCase();
      const fechaObj = f[idx.fecha] ? new Date(f[idx.fecha]) : null;
      registros.push({
        folio: f[idx.folio].toString(),
        fechaTexto: fechaObj ? Utilities.formatDate(fechaObj, tz, 'dd/MM/yyyy') : '',
        anio: fechaObj ? Number(Utilities.formatDate(fechaObj, tz, 'yyyy')) : null,
        mes: fechaObj ? Number(Utilities.formatDate(fechaObj, tz, 'MM')) : null,
        correo: correo,
        nombre: nombrePorCorreo[correo] || '',
        nivel: (f[idx.nivel] || '').toString(),
        curso: (f[idx.curso] || '').toString(),
        precio: Number(f[idx.precio]) || 0,
        estado: (f[idx.estado] || '').toString(),
        resultado: ((f[idx.resultado] || '').toString().trim()) || 'En curso',
        ciclo: idx.ciclo !== -1 ? (f[idx.ciclo] || '').toString() : ''
      });
    }

    return { ok: true, registros: registros };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function generarReporte() {
  const props = PropertiesService.getScriptProperties();
  const ssId = props.getProperty('SHEET_ID');
  if (!ssId) {
    throw new Error('Todavía no hay ninguna inscripción registrada.');
  }

  const ss = SpreadsheetApp.openById(ssId);
  const alumnosSheet = ss.getSheetByName(CONFIG.SHEET_ALUMNOS);
  const historialSheet = ss.getSheetByName(CONFIG.SHEET_HISTORIAL);
  const data = historialSheet.getDataRange().getValues();
  const headers = data[0];
  const filas = data.slice(1).filter(function (r) { return r[0]; }); // ignora filas vacías

  const totalAlumnosUnicos = alumnosSheet ? Math.max(0, alumnosSheet.getLastRow() - 1) : 0;

  const idx = {
    nivel: headers.indexOf('Nivel'),
    curso: headers.indexOf('Curso'),
    precio: headers.indexOf('Precio'),
    estado: headers.indexOf('Estado')
  };

  const porCurso = {};   // "Nivel — Curso" -> {nivel, curso, registros, monto}
  const porNivel = {};   // "Nivel 1" -> {registros, monto}

  let totalRegistros = 0;
  let montoEsperado = 0;
  const totales = {
    inscrito:  { registros: 0, monto: 0 },
    rechazado: { registros: 0, monto: 0 }
  };

  filas.forEach(function (r) {
    const nivel = r[idx.nivel] || '(sin nivel)';
    const curso = r[idx.curso] || '(sin curso)';
    const precio = Number(r[idx.precio]) || 0;
    const categoria = clasificarEstado_(r[idx.estado]);
    const key = nivel + ' — ' + curso;

    if (!porCurso[key]) porCurso[key] = { nivel: nivel, curso: curso, registros: 0, monto: 0 };
    porCurso[key].registros++;
    porCurso[key].monto += precio;

    if (!porNivel[nivel]) porNivel[nivel] = { registros: 0, monto: 0 };
    porNivel[nivel].registros++;
    porNivel[nivel].monto += precio;

    totales[categoria].registros++;
    totales[categoria].monto += precio;

    totalRegistros++;
    montoEsperado += precio;
  });

  // ---- Recrea la pestaña "Reporte" desde cero ----
  let rep = ss.getSheetByName('Reporte');
  if (rep) ss.deleteSheet(rep);
  rep = ss.insertSheet('Reporte');

  rep.getRange('A1').setValue('Reporte de Inscripciones CCM').setFontSize(16).setFontWeight('bold');
  rep.getRange('A2').setValue('Generado: ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'America/Mexico_City', 'dd/MM/yyyy HH:mm'));

  const resumen = [
    ['Alumnos únicos (Alumnos):', totalAlumnosUnicos],
    ['Total de registros (Historial):', totalRegistros],
    ['Inscritos:', totales.inscrito.registros],
    ['Rechazados:', totales.rechazado.registros],
    ['Monto total (todos los registros):', '$' + montoEsperado + ' MXN'],
    ['Monto de inscritos:', '$' + totales.inscrito.monto + ' MXN'],
    ['Monto rechazado:', '$' + totales.rechazado.monto + ' MXN']
  ];
  rep.getRange(4, 1, resumen.length, 1).setValues(resumen.map(function (r) { return [r[0]]; })).setFontWeight('bold');
  rep.getRange(4, 2, resumen.length, 1).setValues(resumen.map(function (r) { return [r[1]]; }));

  // ---- Tabla por curso ----
  let fila = 4 + resumen.length + 2;
  rep.getRange(fila, 1, 1, 4).setValues([['Nivel', 'Curso', 'Registros', 'Monto esperado ($ MXN)']]).setFontWeight('bold');
  fila++;
  const cursoInicio = fila;
  Object.keys(porCurso).sort().forEach(function (k) {
    const c = porCurso[k];
    rep.getRange(fila, 1, 1, 4).setValues([[c.nivel, c.curso, c.registros, c.monto]]);
    fila++;
  });
  const cursoFin = fila - 1;

  // ---- Tabla por nivel ----
  fila += 2;
  rep.getRange(fila, 1, 1, 3).setValues([['Nivel', 'Registros', 'Monto esperado ($ MXN)']]).setFontWeight('bold');
  fila++;
  const nivelInicio = fila;
  Object.keys(porNivel).sort().forEach(function (n) {
    const v = porNivel[n];
    rep.getRange(fila, 1, 1, 3).setValues([[n, v.registros, v.monto]]);
    fila++;
  });
  const nivelFin = fila - 1;

  // ---- Gráficas ----
  if (cursoFin >= cursoInicio) {
    const chartRegistros = rep.newChart()
      .setChartType(Charts.ChartType.COLUMN)
      .addRange(rep.getRange(cursoInicio, 2, cursoFin - cursoInicio + 1, 1))
      .addRange(rep.getRange(cursoInicio, 3, cursoFin - cursoInicio + 1, 1))
      .setPosition(4, 6, 0, 0)
      .setOption('title', 'Registros por curso')
      .setOption('width', 650).setOption('height', 320)
      .build();
    rep.insertChart(chartRegistros);

    const chartMonto = rep.newChart()
      .setChartType(Charts.ChartType.COLUMN)
      .addRange(rep.getRange(cursoInicio, 2, cursoFin - cursoInicio + 1, 1))
      .addRange(rep.getRange(cursoInicio, 4, cursoFin - cursoInicio + 1, 1))
      .setPosition(24, 6, 0, 0)
      .setOption('title', 'Monto esperado por curso ($ MXN)')
      .setOption('width', 650).setOption('height', 320)
      .build();
    rep.insertChart(chartMonto);
  }

  if (nivelFin >= nivelInicio) {
    const chartNivel = rep.newChart()
      .setChartType(Charts.ChartType.PIE)
      .addRange(rep.getRange(nivelInicio, 1, nivelFin - nivelInicio + 1, 2))
      .setPosition(44, 6, 0, 0)
      .setOption('title', 'Distribución de registros por nivel')
      .setOption('width', 650).setOption('height', 320)
      .build();
    rep.insertChart(chartNivel);
  }

  rep.autoResizeColumns(1, 4);

  return {
    ok: true,
    totalAlumnos: totalAlumnosUnicos,
    totalRegistros: totalRegistros,
    totalMonto: montoEsperado,
    montoInscritos: totales.inscrito.monto,
    url: ss.getUrl()
  };
}

// Página simple que se muestra al abrir .../exec?accion=reporte&token=...
function generarReporteHtml_() {
  try {
    const res = generarReporte();
    return HtmlService.createHtmlOutput(
      '<div style="font-family:Arial,sans-serif;max-width:420px;margin:60px auto;text-align:center;">' +
      '<h2 style="color:#187095;">✅ Reporte actualizado</h2>' +
      '<p>Alumnos únicos: <strong>' + res.totalAlumnos + '</strong></p>' +
      '<p>Registros totales: <strong>' + res.totalRegistros + '</strong></p>' +
      '<p>Monto total: <strong>$' + res.totalMonto + ' MXN</strong></p>' +
      '<p>Monto de inscritos: <strong>$' + res.montoInscritos + ' MXN</strong></p>' +
      '<p style="margin-top:20px;"><a href="' + res.url + '" target="_blank" ' +
      'style="background:#f7a41d;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">' +
      'Abrir hoja con gráficas</a></p>' +
      '</div>'
    ).setTitle('Reporte CCM');
  } catch (err) {
    return HtmlService.createHtmlOutput('<p style="font-family:Arial;padding:40px;">Error: ' + err.message + '</p>');
  }
}

/**
 * ============================================================
 *  INSTRUCCIONES DE INSTALACIÓN
 * ============================================================
 *  1. Ve a https://script.google.com y crea un proyecto nuevo.
 *  2. Borra el contenido de "Code.gs" y pega TODO este archivo.
 *  3. Crea TRES archivos HTML nuevos (Archivo > Nuevo > Archivo HTML):
 *     - "Index" — pega el contenido de Index.html
 *     - "Consulta" — pega el contenido de Consulta.html (página
 *       donde el alumno ve su historial completo)
 *     - "Reporte" — pega el contenido de Reporte.html (tu dashboard
 *       privado con gráficas y filtros)
 *  4. Edita el bloque CONFIG de arriba:
 *     - ADMIN_EMAIL: tu correo real (obligatorio, antes de publicar)
 *     (La palabra secreta del reporte NO va aquí: ponla en
 *     "Configuración del proyecto" > "Propiedades del script"
 *     con el nombre REPORTE_TOKEN.)
 *     - NIVELES: tus 17 cursos reales (ya están cargados)
 *     - DATOS_BANCARIOS: tu cuenta real (ya está cargada)
 *  5. Haz clic en "Implementar" > "Nueva implementación".
 *     - Tipo: "Aplicación web"
 *     - Ejecutar como: "Yo"
 *     - Quién tiene acceso: "Cualquier usuario"
 *  6. Copia la URL que te da (termina en /exec). Esa es tu
 *     landing page pública, gratis, sin costo de hosting.
 *  7. La primera vez que alguien se inscriba, el script crea
 *     automáticamente una hoja de cálculo "Registro de
 *     Inscripciones CCM" con DOS pestañas — "Alumnos" e
 *     "Historial" — y una carpeta de Drive para los comprobantes.
 *     Búscalas en tu Drive.
 *  8. Si editas el código después (incluidos los cursos), debes
 *     crear una nueva implementación (o "Administrar
 *     implementaciones" > editar > Nueva versión) para que los
 *     cambios se vean en la URL pública.
 *  9. Para ver tu reporte de inscripciones, abre en el navegador:
 *     TU_URL_DE_IMPLEMENTACION/exec?accion=reporte&token=TU_REPORTE_TOKEN
 *     (usa el valor de la propiedad REPORTE_TOKEN). Guárdala
 *     como marcador — sin el token correcto, la ruta responde
 *     "No autorizado".
 *  10. Toda inscripción queda como "Inscrito" automáticamente — no
 *      hay paso de confirmación manual. Si alguna vez necesitas
 *      marcar una como inválida, edita a mano la columna "Estado"
 *      en la hoja "Historial" con cualquier texto que contenga
 *      "rechaz" (ej. "Rechazado") — el reporte la separa del total.
 *  11. Cuando un curso termine, marca el resultado de cada alumno
 *      escribiendo en la columna "Resultado" de la hoja
 *      "Historial": "Aprobado" o "No aprobado" (déjalo vacío
 *      mientras el curso sigue en proceso). El alumno puede
 *      consultarlo él mismo con su correo + folio en:
 *      TU_URL_DE_IMPLEMENTACION/exec?accion=consulta
 *      (esa liga también aparece en su correo de confirmación y al
 *      pie de la página principal).
 *  12. PARA AGREGAR HISTORIAL DE ALUMNOS ANTERIORES (cursos que
 *      tomaron antes de tener este sistema):
 *      a) En la hoja "Alumnos", agrega una fila por cada persona
 *         nueva: Correo | Nombre completo | Teléfono | (fecha,
 *         opcional).
 *      b) En la hoja "Historial", agrega una fila por cada curso
 *         que esa persona ya tomó: Folio (invéntalo, único, ej.
 *         "CCM-HIST-001") | Fecha real del curso | Correo (debe
 *         coincidir exacto con el de "Alumnos") | Nivel | Curso |
 *         Precio (100) | Método de pago ("Registro histórico") |
 *         Comprobante (déjalo vacío) | Estado ("Inscrito") |
 *         Resultado ("Aprobado"/"No aprobado") | Notas (opcional).
 *      c) Avísale tú al alumno cuál es su folio (por WhatsApp, por
 *         ejemplo) — como no pasó por el formulario, no le llegó
 *         ningún correo automático con ese dato.
 *  13. PANEL DE MAESTROS — instalación (una sola vez):
 *      a) Crea un archivo HTML llamado exactamente "Maestro" y pega
 *         el contenido de Maestro.html.
 *      b) Necesitas una SEGUNDA implementación, distinta de la pública:
 *         Implementar > Nueva implementación > Aplicación web
 *           - Ejecutar como: "Usuario que accede a la app web"
 *           - Quién tiene acceso: "Cualquier usuario"
 *         (La pública debe seguir siendo "Ejecutar como: Yo" +
 *          "Cualquier usuario", para que los alumnos se inscriban
 *          sin iniciar sesión. Son configuraciones incompatibles,
 *          por eso van en dos implementaciones del mismo proyecto.)
 *      c) La URL de maestros es esa nueva, con ?accion=maestro al final.
 *         Compártela solo con tus maestros.
 *      d) En la hoja "Config Maestros" agrega un renglón por curso:
 *         Nombre | Correo Gmail | Nivel | Curso | Ciclo | Estado |
 *         y las 8 fechas de clase. El maestro entra con esa cuenta de
 *         Google y ve SOLO sus cursos del ciclo activo.
 *      e) Para reabrir un curso ya cerrado (corregir algo), cambia
 *         "Cerrado" por "Abierto" en esa hoja. El maestro no puede.
 *  14. ABRIR UN NUEVO CICLO: edita las 3 fechas al inicio de la función
 *      "prepararNuevoCiclo" y ejecútala desde el editor. Actualiza las
 *      fechas de inscripción, genera las 8 fechas de clase semanales y
 *      copia las asignaciones de maestros del ciclo anterior para que
 *      solo ajustes las que cambian. Luego marca en "Config Cursos"
 *      qué cursos abres este ciclo.
 *  15. CONFIGURACIÓN SIN TOCAR CÓDIGO: la hoja de cálculo tiene dos
 *      pestañas que se crean solas y mandan sobre lo que dice este
 *      archivo. Lo que cambies ahí surte efecto INMEDIATO, sin volver
 *      a implementar:
 *      · "Config Cursos"  → una fila por curso. En la columna
 *        "¿Abierto? (SI/NO)" escribe SI o NO para abrir o cerrar ese
 *        curso, y opcionalmente un mensaje propio para cuando está
 *        cerrado.
 *      · "Config General" → fechas de inscripción (formato AAAA-MM-DD)
 *        y precio por curso.
 *      Si borras alguna de esas hojas, el sistema vuelve a usar los
 *      valores de CONFIG de arriba y la recrea sola.
 *  16. MARCAR RESULTADOS: en el dashboard del reporte, cada fila de la
 *      tabla trae botones "Aprobó / No aprobó / En curso". Se guardan
 *      directo en la hoja "Historial" sin que tengas que abrirla.
 *  17. MANUALES EN PDF: se adjuntan solos, por nombre — no hay nada
 *      que editar en el código. Solo sube cada PDF a la carpeta de
 *      CONFIG.CARPETA_MANUALES_ID con el nombre EXACTO del curso
 *      (ej. "Identidad.pdf" para el curso "Identidad"; no importan
 *      mayúsculas ni acentos). Puedes tenerlos todos juntos en esa
 *      carpeta, o organizados en subcarpetas por nivel — el sistema
 *      busca en todas. Corre la función "verificarManuales" desde
 *      el editor de Apps Script (▶ Ejecutar, luego Ver > Registros)
 *      para confirmar que los 17 se encontraron correctamente. Un
 *      curso sin PDF con ese nombre no adjunta nada — el correo se
 *      manda igual, sin manual.
 * ============================================================
 */
