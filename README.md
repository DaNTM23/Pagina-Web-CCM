# CCM — Sistema de cursos

Sistema de inscripciones, historial y calificaciones del Centro de Capacitación
Ministerial (Cornerstone, Querétaro), sobre Google Apps Script.

```
ccm-sistema/
├── CLAUDE.md              Contexto del proyecto para Claude Code
├── apps-script/           Lo que se sube a Google Apps Script
│   ├── Code.gs            Backend completo (~1,600 líneas)
│   ├── Index.html         Inscripción (alumnos)
│   ├── Consulta.html      Historial (alumnos)
│   ├── Maestro.html       Panel de maestros
│   ├── Reporte.html       Tablero de administración
│   └── appsscript.json    Manifiesto
├── visor/                 Demos navegables, se abren con doble clic
│   ├── Inicio_preview.html      ← portada nueva, empieza por aquí
│   ├── Index_preview.html
│   ├── Consulta_preview.html
│   ├── Maestro_preview.html
│   └── Reporte_preview.html
├── docs/
│   ├── despliegue.md      Cómo publicar sin romper la URL
│   ├── configuracion.md   Qué se cambia desde la hoja, sin tocar código
│   └── pendientes.md      Qué falta
└── pruebas/               Suite de pruebas (por reconstruir)
```

## Empezar en Claude Code

### 1. Instalar Claude Code

**Windows (PowerShell):**
```powershell
irm https://claude.ai/install.ps1 | iex
```

**macOS o Linux:**
```bash
curl -fsSL https://claude.ai/install.sh | bash
```

Cierra la terminal, abre una nueva y comprueba:
```bash
claude --version
```

Necesitas una cuenta Claude Pro, Max, Team o Enterprise. El plan gratuito no
incluye Claude Code.

### 2. Abrir el proyecto

```bash
cd ruta/a/ccm-sistema
claude
```

La primera vez pide iniciar sesión en el navegador. Claude Code lee `CLAUDE.md`
solo, así que ya llega sabiendo cómo está armado el sistema.

### 3. Llevar control de versiones (recomendado)

```bash
git init
git add .
git commit -m "Estado inicial del sistema CCM"
```

Con esto puedes deshacer cualquier cambio que no te guste.

## Subir cambios a Google Apps Script

Dos caminos. El segundo es el que vale la pena.

**A mano:** copias el contenido de cada archivo de `apps-script/` y lo pegas en
el editor de Apps Script. Funciona, pero es lo que has estado haciendo.

**Con `clasp`:** Claude Code edita los archivos y los sube con un comando.

```bash
npm install -g @google/clasp
clasp login
```

Luego crea `apps-script/.clasp.json` copiando `.clasp.json.ejemplo` y poniendo
el ID de tu proyecto (lo ves en la URL del editor de Apps Script, el tramo largo
después de `/projects/`):

```json
{ "scriptId": "TU_SCRIPT_ID_AQUI", "rootDir": "." }
```

Y desde entonces:

```bash
cd apps-script
clasp push
```

Publicar la versión nueva sigue siendo manual en el editor, a propósito: así no
se publica nada por accidente. Ver `docs/despliegue.md`.

## Ver las demos

Abre cualquier archivo de `visor/` con doble clic. No necesitan internet ni
conexión al sistema. `Inicio_preview.html` tiene un interruptor arriba para ver
la portada con inscripciones abiertas y cerradas.
