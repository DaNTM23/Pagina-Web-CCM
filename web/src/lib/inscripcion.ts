// Validación y folios de la inscripción. Sin dependencias de Cloudflare, para poder probarse.

export const TIPOS_PERMITIDOS = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
export const MAX_ARCHIVO_MB = 5;

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Quita < y >, recorta espacios y limita el largo (igual que limpiarTexto_ de Code.gs). */
export function limpiarTexto(texto: unknown, maxLen = 200): string {
  if (!texto) return '';
  return String(texto).replace(/[<>]/g, '').trim().substring(0, maxLen);
}

export type DatosInscripcion = { nombre: string; telefono: string; correo: string; cursoId: number };

export function validarDatos(entrada: {
  nombre?: unknown;
  telefono?: unknown;
  correo?: unknown;
  cursoId?: unknown;
}): { ok: true; datos: DatosInscripcion } | { ok: false; error: string } {
  const nombre = limpiarTexto(entrada.nombre, 120);
  const telefono = limpiarTexto(entrada.telefono, 30);
  const correo = limpiarTexto(entrada.correo, 120).toLowerCase(); // el correo siempre en minúsculas
  const cursoId = Number(entrada.cursoId);
  if (!nombre || !telefono || !correo || !Number.isInteger(cursoId) || cursoId <= 0) {
    return { ok: false, error: 'Faltan datos obligatorios.' };
  }
  if (!REGEX_CORREO.test(correo)) return { ok: false, error: 'El correo electrónico no es válido.' };
  return { ok: true, datos: { nombre, telefono, correo, cursoId } };
}

export function validarComprobante(archivo: { type: string; size: number }): string | null {
  if (!TIPOS_PERMITIDOS.includes(archivo.type)) return 'El comprobante debe ser JPG, PNG o PDF.';
  if (archivo.size === 0) return 'Debes adjuntar tu comprobante de pago.';
  if (archivo.size > MAX_ARCHIVO_MB * 1024 * 1024) {
    return `El comprobante supera el límite de ${MAX_ARCHIVO_MB} MB.`;
  }
  return null;
}

/** Inscripciones abiertas si hoy (AAAA-MM-DD) cae dentro del rango, ambos días incluidos. */
export function inscripcionesAbiertas(hoy: string, inicio?: string, fin?: string): boolean {
  if (!inicio || !fin) return false;
  return hoy >= inicio && hoy <= fin;
}

/** Folio con el formato del sistema actual: CCM-yyMMdd-HHmmss-####. Es la "contraseña" del alumno. */
export function generarFolio(ahora = new Date(), azar: () => number = Math.random): string {
  const p = (n: number) => String(n).padStart(2, '0');
  const marca =
    p(ahora.getUTCFullYear() % 100) + p(ahora.getUTCMonth() + 1) + p(ahora.getUTCDate()) +
    '-' + p(ahora.getUTCHours()) + p(ahora.getUTCMinutes()) + p(ahora.getUTCSeconds());
  return `CCM-${marca}-${Math.floor(1000 + azar() * 9000)}`;
}

export function extensionDe(tipo: string): string {
  return tipo === 'application/pdf' ? 'pdf' : tipo === 'image/png' ? 'png' : 'jpg';
}
