# Lo que se cambia sin tocar código

Todo esto vive en la hoja de cálculo. Lo editas, guardas, y la página lo toma
de inmediato. No hay que volver a publicar.

La hoja se crea sola la primera vez con la función `inicializarHojas()` desde el
editor de Apps Script. Si borras una pestaña, el sistema la vuelve a crear con
los valores que trae el código.

## Config General

| Ajuste | Valor | Nota |
|---|---|---|
| Fecha inicio inscripciones | `AAAA-MM-DD` | Antes de esta fecha la página dice "Inscripciones cerradas" |
| Fecha fin inscripciones | `AAAA-MM-DD` | Después de esta fecha, igual |
| Precio por curso | `100` | Solo el número, sin el signo de pesos |

## Config Cursos

Una fila por cada uno de los 17 cursos.

| Nivel | Curso | ¿Abierto? | Mensaje si está cerrado |
|---|---|---|---|
| Nivel 1 | Identidad | `SI` | |
| Nivel 1 | Propósito | `NO` | No disponible en este periodo |

Poner `NO` deja el curso en gris y sin poder seleccionarse. Si dejas vacío el
mensaje, usa el de siempre: *No disponible en este periodo*.

Así manejas que cada ciclo abras solo algunos cursos, según tengas maestros.

## Config Maestros

Una fila por maestro y curso del ciclo.

| Columna | Qué va |
|---|---|
| Nombre del maestro | Como quieres que aparezca |
| Correo Gmail | **Tiene que ser el mismo con el que inicia sesión** |
| Nivel, Curso, Ciclo | A qué grupo entra |
| Estado | `Abierto` mientras da clases, `Cerrado` cuando ya publicó resultados |
| Fecha clase 1 … 8 | Las ocho fechas, para que el maestro las vea en su panel |

El maestro entra con su correo y el sistema le muestra únicamente las filas que
coinciden con su correo **y** con el ciclo activo. No puede ver ni calificar
otro curso.

## Preparar un ciclo nuevo

Corre `prepararNuevoCiclo()` desde el editor. Eso avanza el ciclo activo y deja
listas las hojas del ciclo que empieza. Después:

1. En **Config Cursos**, pon `SI` en los cursos que vas a abrir y `NO` en el resto.
2. En **Config Maestros**, captura quién da cada curso y las ocho fechas.
3. En **Config General**, ajusta las fechas de inscripción.

Los alumnos del ciclo anterior quedan en el historial con su resultado. El
listado del maestro se llena solo conforme la gente se inscribe.
