# CCM — Sistema de cursos ministeriales

Contexto para Claude Code. Léelo antes de tocar nada.

## Qué es esto

Sistema de inscripciones, historial y calificaciones del **Centro de Capacitación
Ministerial (CCM)** de Cornerstone, Querétaro. Corre **gratis** sobre Google
Apps Script + Google Sheets + Google Drive. No hay servidor, no hay base de
datos, no hay pasarela de pago.

Dueño y único administrador: Daniel Treviño Moreno (`ccmcornerqro@gmail.com`).

## Cómo está armado

Un solo proyecto de Apps Script publicado como aplicación web. `doGet(e)` enruta
por el parámetro `?accion=`:

| Ruta | Archivo HTML | Quién entra |
|---|---|---|
| (sin parámetro) | `Index.html` | Alumnos — inscripción |
| `?accion=consulta` | `Consulta.html` | Alumnos — su historial |
| `?accion=maestro` | `Maestro.html` | Maestros — calificaciones y asistencia |
| `?accion=reporte&token=…` | `Reporte.html` | Solo el administrador — tablero |
| `?accion=abrirhoja&token=…` | — | Redirige a la hoja de cálculo |

Falta por construir: `?accion=inicio`, la portada unificada. El diseño ya está
aprobado y vive en `visor/Inicio_preview.html`.

### Datos

Todo en una sola hoja de cálculo, creada por `inicializarHojas()`:

- `Alumnos` — una fila por persona (correo en minúsculas es la llave)
- `Historial` — una fila por inscripción: folio, correo, curso, ciclo, resultado
- `Config Cursos` — qué curso está abierto o cerrado, y el mensaje si está cerrado
- `Config General` — fechas de inscripción, precio, ciclo activo
- `Config Maestros` — correo del maestro ↔ curso que le toca este ciclo
- `Calificaciones`, `Asistencia` — captura del maestro

**Regla de oro: la hoja manda sobre el código.** `CONFIG.NIVELES` y demás solo
siembran los valores iniciales. Daniel abre y cierra cursos y cambia fechas
editando la hoja, sin volver a publicar. No muevas esa lógica al código.

### Conceptos del negocio

- **17 cursos** en 3 niveles (6 + 6 + 5). Se cursan en orden sugerido, no forzado.
- **Ciclo**: hasta 4 por año. Cada ciclo son 8 sesiones, lunes 7:30–8:30 pm por Zoom.
  El mismo alumno puede repetir un curso en otro ciclo; el duplicado se bloquea
  solo dentro del mismo ciclo.
- **$100 MXN** por curso, pago por transferencia con comprobante subido a Drive.
  No hay validación automática del comprobante — se decidió no gastar en eso.
- **Calificación**: `((puntosAsistencia + participación + trabajos) / 12) * 10`,
  cada rubro de 1 a 4. Más de 6 es *Acreditado*. Con 0 de 8 asistencias el sistema
  pone *Baja* automáticamente, pero solo al cerrar el curso.
- El maestro solo ve su curso del ciclo activo. Los ciclos pasados los ve
  únicamente el administrador.

## Cosas que ya nos mordieron

Son errores reales que costaron horas. No los repitas.

1. **Los enlaces relativos no funcionan.** Apps Script sirve la página dentro de
   un iframe de `googleusercontent.com`, así que `href="?accion=consulta"` termina
   en `userCodeAppPanel?accion=consulta`. Usa siempre la URL absoluta inyectada
   desde el servidor (`urlApp_()` → `urlAppJson` en la plantilla) y
   `target="_top"`.
2. **`ScriptApp.getService().getUrl()` devuelve vacío** en varios contextos. Por eso
   `CONFIG.URL_APP` está escrita a mano. Si cambia la URL, actualiza esa constante.
3. **Al republicar, usa "Administrar implementaciones → lápiz → Nueva versión".**
   "Nueva implementación" genera una URL distinta y rompe los TinyURL que ya se
   repartieron.
4. **Las funciones que terminan en `_` no aparecen** en el menú de ejecución del
   editor. Por eso existe `inicializarHojas()` pública como envoltura.
5. **Folios duplicados.** El folio es la contraseña del historial del alumno. Se
   genera dentro de `LockService` y se verifica contra los folios existentes antes
   de aceptarlo. No simplifiques eso.
6. **El correo se guarda siempre en minúsculas.**

## Convenciones al escribir código

- Español en la interfaz, los comentarios y los nombres de función. Sin acentos
  en los identificadores.
- `celdaSegura_()` antes de escribir cualquier texto del usuario en la hoja
  (inyección de fórmulas). `escapeHtml_()` en el servidor y `escapeHtml()` en el
  cliente antes de pintar texto del usuario.
- `LockService.getScriptLock()` alrededor de cualquier leer-verificar-escribir.
- Nada de `XFrameOptionsMode.ALLOWALL`.
- El logo va embebido en base64 (`CONFIG.LOGO_BASE64`), no como imagen externa.
- Sin dependencias nuevas. Chart.js desde jsDelivr es la única excepción, ya está.
- Un archivo `*.html` de producción tiene su gemelo `*_preview.html` en `visor/`
  con datos simulados, para poder verlo sin publicar. Si cambias el diseño de uno,
  actualiza el otro.

## Cómo publicar

Ver `docs/despliegue.md`. En corto: `clasp push`, y luego desde el editor
"Administrar implementaciones → lápiz → Nueva versión".

Hay **dos implementaciones** y es a propósito:

| | Ejecutar como | Acceso |
|---|---|---|
| Pública (alumnos) | Yo | Cualquiera |
| Maestros | El usuario que accede | Cualquiera con cuenta de Google |

La de maestros necesita `Session.getActiveUser().getEmail()`, que solo devuelve
algo cuando corre como el usuario que accede.

## Pendientes

Ver `docs/pendientes.md`. Dos decisiones bloquean la portada: el número de
WhatsApp y de dónde sale la fecha de inicio de clases.
