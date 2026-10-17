import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { inscripcionesAbiertas, limpiarTexto, validarComprobante, validarDatos } from '$lib/inscripcion';
import { inscribir, InscripcionError } from '$lib/server/inscribir';

const hoyMexico = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

export const load: PageServerLoad = async ({ platform }) => {
  const { DB } = platform!.env;
  const cursos = await DB.prepare('SELECT id, nivel, nombre, abierto, mensaje_cerrado FROM cursos ORDER BY orden')
    .all<{ id: number; nivel: string; nombre: string; abierto: number; mensaje_cerrado: string }>();
  const ajustes = await DB.prepare('SELECT clave, valor FROM ajustes').all<{ clave: string; valor: string }>();
  const a = Object.fromEntries(ajustes.results.map((x) => [x.clave, x.valor]));
  return {
    cursos: cursos.results,
    precio: Number(a.precio_curso),
    abiertas: inscripcionesAbiertas(hoyMexico(), a.fecha_inicio_inscripciones, a.fecha_fin_inscripciones),
    fechaFin: a.fecha_fin_inscripciones,
    pago: {
      banco: a.pago_banco, titular: a.pago_titular, cuenta: a.pago_cuenta,
      clabe: a.pago_clabe, referencia: a.pago_referencia
    }
  };
};

export const actions: Actions = {
  default: async ({ request, platform }) => {
    const env = platform!.env;
    const form = await request.formData();

    // Campo trampa contra registros automáticos: las personas no lo ven ni lo llenan.
    if (limpiarTexto(form.get('sitio_web'))) return fail(400, { error: 'No se pudo procesar el registro.' });

    const ajustes = await env.DB.prepare(
      "SELECT clave, valor FROM ajustes WHERE clave IN ('fecha_inicio_inscripciones','fecha_fin_inscripciones')"
    ).all<{ clave: string; valor: string }>();
    const a = Object.fromEntries(ajustes.results.map((x) => [x.clave, x.valor]));
    if (!inscripcionesAbiertas(hoyMexico(), a.fecha_inicio_inscripciones, a.fecha_fin_inscripciones)) {
      return fail(400, { error: 'Las inscripciones están cerradas en este momento.' });
    }

    const v = validarDatos({
      nombre: form.get('nombre'), telefono: form.get('telefono'),
      correo: form.get('correo'), cursoId: form.get('curso')
    });
    if (!v.ok) return fail(400, { error: v.error });

    const archivo = form.get('comprobante');
    if (!(archivo instanceof File)) return fail(400, { error: 'Debes adjuntar tu comprobante de pago.' });
    const errorArchivo = validarComprobante(archivo);
    if (errorArchivo) return fail(400, { error: errorArchivo });

    try {
      const folio = await inscribir(env, v.datos, archivo);
      return { ok: true, folio };
    } catch (e) {
      if (e instanceof InscripcionError) return fail(400, { error: e.message });
      console.error(e);
      return fail(500, { error: 'Ocurrió un error al guardar tu inscripción. Intenta de nuevo.' });
    }
  }
};
