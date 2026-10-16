# Cómo publicar cambios

## Lo más importante

La URL pública no debe cambiar nunca. Hay TinyURLs repartidos entre alumnos y
maestros que apuntan a ella, y `CONFIG.URL_APP` dentro del código también.

Para que no cambie:

> **Implementar → Administrar implementaciones → (ícono de lápiz) → Versión:
> Nueva versión → Implementar**

Si en vez de eso usas **"Nueva implementación"**, Google crea una URL distinta
y todo lo repartido deja de servir. Ya pasó una vez.

## Paso a paso

### 1. Subir el código

Con clasp (recomendado):
```bash
cd apps-script
clasp push
```

A mano: abre el editor de Apps Script, y para cada archivo selecciona todo
(Ctrl+A), borra y pega el contenido completo del archivo de `apps-script/`.

> Pegar solo un trozo encima del código viejo deja mezclados pedazos de las dos
> versiones y produce errores de sintaxis en líneas que parecen no tener nada
> que ver. Siempre Ctrl+A, borrar, pegar.

Los archivos HTML deben llamarse en Apps Script **exactamente** `Index`,
`Consulta`, `Reporte`, `Maestro`. Si falta uno, la ruta que lo usa truena con
un error del tipo `tokenJson is not defined`.

### 2. Publicar la versión

Implementar → Administrar implementaciones → lápiz → Nueva versión → Implementar.

### 3. Comprobar

Abre la URL real (no la de prueba `/dev`) y revisa que carga la inscripción,
que el enlace al historial funciona, y que el tablero responde con tu token.

## Las dos implementaciones

| | Ejecutar como | Quién tiene acceso | Para qué |
|---|---|---|---|
| **Pública** | Yo (`ccmcornerqro@gmail.com`) | Cualquier persona | Alumnos: inscripción, historial, y tu tablero |
| **Maestros** | El usuario que accede | Cualquiera con cuenta de Google | Panel de maestros |

El panel de maestros necesita saber quién entró, y eso solo funciona con
"Ejecutar como: el usuario que accede". La pública tiene que correr como tú para
poder escribir en tu hoja y tu Drive aunque el alumno no tenga sesión.

Son dos URLs distintas y eso está bien. La de maestros se reparte solo a los
maestros.

## Cambios que NO necesitan publicar nada

Abrir o cerrar un curso, cambiar las fechas de inscripción, el precio, el ciclo
activo, o asignar maestros: todo eso se edita en la hoja de cálculo y surte
efecto de inmediato. Ver `configuracion.md`.
