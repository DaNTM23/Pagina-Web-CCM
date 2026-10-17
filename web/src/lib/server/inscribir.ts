import { extensionDe, generarFolio, type DatosInscripcion } from '$lib/inscripcion';

export class InscripcionError extends Error {}

type Archivo = { type: string; arrayBuffer(): Promise<ArrayBuffer> };

/**
 * Guarda alumno + inscripción. El duplicado (mismo correo, curso y ciclo) lo impide el índice
 * único `inscripcion_unica` de la base, así que dos solicitudes simultáneas no pueden ambas pasar.
 * Un folio repetido choca con la llave primaria y se reintenta con otro.
 */
export async function inscribir(
  env: { DB: D1Database; COMPROBANTES: R2Bucket },
  datos: DatosInscripcion,
  comprobante: Archivo
): Promise<string> {
  const { DB, COMPROBANTES } = env;

  const curso = await DB.prepare('SELECT id, abierto, mensaje_cerrado FROM cursos WHERE id = ?')
    .bind(datos.cursoId).first<{ id: number; abierto: number; mensaje_cerrado: string }>();
  if (!curso) throw new InscripcionError('El curso seleccionado no es válido.');
  if (!curso.abierto) throw new InscripcionError(curso.mensaje_cerrado || 'No disponible en este periodo');

  const ajustes = await DB.prepare("SELECT clave, valor FROM ajustes WHERE clave IN ('ciclo_activo','precio_curso')")
    .all<{ clave: string; valor: string }>();
  const mapa = Object.fromEntries(ajustes.results.map((a) => [a.clave, a.valor]));
  const ciclo = mapa.ciclo_activo;
  const precio = Number(mapa.precio_curso);
  if (!ciclo || !Number.isFinite(precio)) throw new InscripcionError('El sistema no está configurado todavía.');

  const repetida = await DB.prepare(
    "SELECT 1 FROM inscripciones WHERE correo = ? AND curso_id = ? AND ciclo = ? AND estado <> 'Rechazado'"
  ).bind(datos.correo, datos.cursoId, ciclo).first();
  if (repetida) throw new InscripcionError('Ya tienes una inscripción registrada para este curso en este ciclo.');

  for (let intento = 0; intento < 5; intento++) {
    const folio = generarFolio();
    const llave = `comprobantes/${ciclo}/${folio}.${extensionDe(comprobante.type)}`;
    await COMPROBANTES.put(llave, await comprobante.arrayBuffer(), { httpMetadata: { contentType: comprobante.type } });
    try {
      await DB.batch([
        DB.prepare(
          `INSERT INTO alumnos (correo, nombre, telefono) VALUES (?, ?, ?)
           ON CONFLICT(correo) DO UPDATE SET nombre = excluded.nombre, telefono = excluded.telefono`
        ).bind(datos.correo, datos.nombre, datos.telefono),
        DB.prepare(
          'INSERT INTO inscripciones (folio, correo, curso_id, ciclo, precio, comprobante_key) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(folio, datos.correo, datos.cursoId, ciclo, precio, llave)
      ]);
      return folio;
    } catch (e) {
      await COMPROBANTES.delete(llave);
      const msg = String(e);
      if (msg.includes('inscripciones.correo')) {
        throw new InscripcionError('Ya tienes una inscripción registrada para este curso en este ciclo.');
      }
      if (!msg.includes('inscripciones.folio')) throw e;
      // folio repetido: se genera otro
    }
  }
  throw new Error('No se pudo generar un folio único.');
}
