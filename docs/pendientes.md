# Pendientes

Ordenados por lo que conviene hacer primero en Claude Code.

## 1. Portada unificada — `?accion=inicio`

El diseño ya está aprobado: `visor/Inicio_preview.html`. Falta convertirlo en
`Inicio.html` dentro de `apps-script/` y agregar la ruta en `doGet`, con los
datos saliendo de la configuración en lugar de estar escritos a mano:

- Estado de inscripciones y fecha de cierre → `Config General`
- Precio → `Config General`
- Cursos abiertos del ciclo → `Config Cursos`
- Los tres botones → `urlApp_()` con `target="_top"`

**Dos decisiones bloquean esto:**

- **Número de WhatsApp.** El botón del pie ya está maquetado, falta el número.
- **Fecha de inicio de clases.** Hay dos caminos: tomar la columna *Fecha clase 1*
  de `Config Maestros` (ya existe, es la primera clase del ciclo) o agregar un
  renglón nuevo en `Config General` para escribirla a mano. La primera no requiere
  capturar nada extra; la segunda da control si la portada debe decir algo distinto
  a lo que ven los maestros.

Cuando la portada exista, los TinyURL pueden apuntar ahí en vez de a la
inscripción directa.

## 2. Reconstruir la suite de pruebas

Existía y se perdió al reiniciarse el entorno. Eran 289 pruebas sobre un
simulador de Apps Script hecho a mano (`mock-gas.js`), que fingía
`SpreadsheetApp`, `DriveApp`, `MailApp`, `LockService`, `Session` y
`Utilities`, para poder correr `Code.gs` en Node sin publicar nada.

Cubría cinco frentes: lógica de inscripción, frontend, estrés y concurrencia,
ciclos, y aislamiento entre maestros. Vale la pena rehacerla — fue la que
encontró los folios duplicados.

Lo que no puede faltar cuando se rehaga:

- Dos inscripciones al mismo curso y ciclo con el mismo correo → se rechaza la segunda
- Al mismo curso en **otro** ciclo → se acepta
- 200 inscripciones simultáneas → cero folios repetidos
- Un maestro no puede leer ni calificar el curso de otro
- Un maestro no ve ciclos pasados
- Con 0 de 8 asistencias, al cerrar el curso queda *Baja*
- La fórmula de calificación con todas las combinaciones de la rúbrica
- Texto con `=`, `+`, `@` al inicio no entra crudo a la hoja
- Correo con mayúsculas se guarda en minúsculas

## 3. Asistencia automática por Zoom

Investigado, no construido. Hay Zoom de paga, clases los lunes 7:30–8:30 pm,
8 sesiones. La idea era usar la API de Zoom para bajar el reporte de
participantes de cada reunión y precargar la asistencia, dejando que el maestro
solo revise y ajuste. Requiere credenciales de Zoom y un disparador por tiempo.

## 4. Mejoras ya identificadas, sin empezar

- Panel de administración que muestre de un vistazo el estado de los 17 cursos
- Correo automático al maestro recordándole cerrar su curso
- Correo al alumno cuando se publica su resultado
- Aviso de privacidad con casilla de aceptación en la inscripción
- Campo trampa (honeypot) contra registros automatizados
- Cupo máximo por curso
