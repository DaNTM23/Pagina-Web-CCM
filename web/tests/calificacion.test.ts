import { describe, expect, it } from 'vitest';
import { calificacionFinal, puntosAsistencia, resultadoFinal } from '../src/lib/calificacion';

describe('puntosAsistencia', () => {
  it('mapea 0-8 asistencias a 1-4 puntos', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8].map(puntosAsistencia)).toEqual([1, 1, 1, 2, 2, 3, 3, 4, 4]);
  });
});

describe('resultadoFinal', () => {
  it('calificación máxima', () => expect(calificacionFinal(8, 4, 4)).toBe(10));
  it('7 de 12 puntos (5.83) no acredita', () => expect(resultadoFinal(5, 2, 2)).toBe('No aprobado'));
  it('8 de 12 puntos (6.67) acredita', () => expect(resultadoFinal(5, 3, 2)).toBe('Aprobado'));
  it('0 asistencias es Baja', () => expect(resultadoFinal(0, 4, 4)).toBe('Baja'));
});
