import { describe, expect, it } from 'vitest';
import {
  generarFolio, inscripcionesAbiertas, limpiarTexto, validarComprobante, validarDatos
} from '../src/lib/inscripcion';

describe('validarDatos', () => {
  const base = { nombre: ' Ana ', telefono: '442', correo: 'ANA@Correo.COM', cursoId: '3' };
  it('guarda el correo en minúsculas y recorta espacios', () => {
    const r = validarDatos(base);
    expect(r).toEqual({ ok: true, datos: { nombre: 'Ana', telefono: '442', correo: 'ana@correo.com', cursoId: 3 } });
  });
  it('rechaza campos vacíos aunque solo traigan espacios', () => {
    expect(validarDatos({ ...base, nombre: '   ' }).ok).toBe(false);
  });
  it('rechaza correos inválidos y cursos inválidos', () => {
    expect(validarDatos({ ...base, correo: 'ana@' }).ok).toBe(false);
    expect(validarDatos({ ...base, cursoId: 'x' }).ok).toBe(false);
  });
  it('quita < y > del texto', () => expect(limpiarTexto('<b>Ana</b>')).toBe('bAna/b'));
});

describe('validarComprobante', () => {
  it('acepta pdf e imágenes dentro del límite', () => {
    expect(validarComprobante({ type: 'application/pdf', size: 1000 })).toBeNull();
  });
  it('rechaza otros tipos, vacíos y archivos de más de 5 MB', () => {
    expect(validarComprobante({ type: 'text/html', size: 10 })).not.toBeNull();
    expect(validarComprobante({ type: 'image/png', size: 0 })).not.toBeNull();
    expect(validarComprobante({ type: 'image/png', size: 5 * 1024 * 1024 + 1 })).not.toBeNull();
  });
});

describe('inscripcionesAbiertas', () => {
  it('incluye el primer y el último día', () => {
    expect(inscripcionesAbiertas('2026-08-17', '2026-08-17', '2026-08-30')).toBe(true);
    expect(inscripcionesAbiertas('2026-08-30', '2026-08-17', '2026-08-30')).toBe(true);
    expect(inscripcionesAbiertas('2026-08-31', '2026-08-17', '2026-08-30')).toBe(false);
  });
  it('sin fechas configuradas, está cerrado', () => expect(inscripcionesAbiertas('2026-08-20')).toBe(false));
});

describe('generarFolio', () => {
  it('tiene el formato CCM-yyMMdd-HHmmss-####', () => {
    expect(generarFolio(new Date('2026-08-17T19:30:05Z'), () => 0)).toBe('CCM-260817-193005-1000');
    expect(generarFolio()).toMatch(/^CCM-\d{6}-\d{6}-\d{4}$/);
  });
});
