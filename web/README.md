# CCM web (Cloudflare)

Reescritura del sistema de Apps Script como un solo proyecto: SvelteKit + Cloudflare Workers + D1 (base de datos) + R2 (comprobantes).

`migrations/0001_inicial.sql` es el equivalente de las pestañas de la hoja de cálculo actual, con los 17 cursos ya sembrados.
`src/lib/calificacion.ts` trae las reglas de calificación del sistema actual, con pruebas.

```bash
npm install
npm run pruebas
wrangler d1 create ccm        # pega el database_id en wrangler.jsonc
npm run db:local
npm run dev
```

Pendiente: inscripción, historial con enlace mágico, panel de maestros, tablero de administración, login con Google.
