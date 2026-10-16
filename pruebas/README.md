# Pruebas

Esta carpeta está vacía a propósito. La suite anterior (289 pruebas sobre un
simulador de Apps Script escrito en Node) se perdió al reiniciarse el entorno
donde se desarrolló, y rehacerla de memoria sería inventarla.

Reconstruirla es una buena primera tarea en Claude Code. En
`docs/pendientes.md`, punto 2, está la lista de lo que cubría y de los casos
que no pueden faltar.

Idea del montaje, por si ayuda: un archivo `mock-gas.js` que define globales
falsos — `SpreadsheetApp`, `DriveApp`, `MailApp`, `LockService`, `Session`,
`Utilities` — respaldados por objetos en memoria, carga `apps-script/Code.gs`
con `eval` y luego llama a las funciones reales. Así se prueba el código de
producción tal cual, sin publicar nada y sin tocar la hoja de verdad.
