// Reglas de calificación, iguales a puntosAsistencia_ y CLAUDE.md del sistema actual.

export const CLASES_POR_CURSO = 8;

export type Resultado = 'Aprobado' | 'No aprobado' | 'Baja';

export function puntosAsistencia(asistencias: number): number {
  if (asistencias <= 2) return 1;
  if (asistencias <= 4) return 2;
  if (asistencias <= 6) return 3;
  return 4;
}

/** ((asistencia + participación + trabajos) / 12) * 10, cada rubro de 1 a 4. */
export function calificacionFinal(asistencias: number, participacion: number, trabajos: number): number {
  const total = puntosAsistencia(asistencias) + participacion + trabajos;
  return (total / 12) * 10;
}

/** Más de 6 acredita. Con 0 asistencias queda Baja (solo al cerrar el curso). */
export function resultadoFinal(asistencias: number, participacion: number, trabajos: number): Resultado {
  if (asistencias === 0) return 'Baja';
  return calificacionFinal(asistencias, participacion, trabajos) > 6 ? 'Aprobado' : 'No aprobado';
}
