-- Equivalente a las pestañas de la hoja de cálculo actual.
-- Correos siempre en minúsculas (regla del sistema actual).

CREATE TABLE alumnos (
  correo TEXT PRIMARY KEY CHECK (correo = lower(correo)),
  nombre TEXT NOT NULL,
  telefono TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Config Cursos
CREATE TABLE cursos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nivel TEXT NOT NULL,
  nombre TEXT NOT NULL UNIQUE,
  orden INTEGER NOT NULL,
  abierto INTEGER NOT NULL DEFAULT 1,
  mensaje_cerrado TEXT NOT NULL DEFAULT ''
);

-- Config General (clave/valor): fecha_inicio_inscripciones, fecha_fin_inscripciones,
-- precio_curso, ciclo_activo
CREATE TABLE ajustes (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);

-- Config Maestros: un maestro por curso y ciclo, con sus 8 fechas
CREATE TABLE asignaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  maestro_nombre TEXT NOT NULL,
  maestro_correo TEXT NOT NULL CHECK (maestro_correo = lower(maestro_correo)),
  curso_id INTEGER NOT NULL REFERENCES cursos(id),
  ciclo TEXT NOT NULL,
  cerrado INTEGER NOT NULL DEFAULT 0,
  fechas_clases TEXT NOT NULL DEFAULT '[]', -- JSON: hasta 8 fechas AAAA-MM-DD
  UNIQUE (curso_id, ciclo, maestro_correo)
);

-- Historial: una fila por inscripción. El folio es la "contraseña" del alumno.
CREATE TABLE inscripciones (
  folio TEXT PRIMARY KEY,
  correo TEXT NOT NULL REFERENCES alumnos(correo),
  curso_id INTEGER NOT NULL REFERENCES cursos(id),
  ciclo TEXT NOT NULL,
  precio INTEGER NOT NULL,
  metodo_pago TEXT NOT NULL DEFAULT 'Transferencia/Depósito',
  comprobante_key TEXT,                 -- llave del objeto en R2
  estado TEXT NOT NULL DEFAULT 'Inscrito', -- Inscrito | Rechazado
  resultado TEXT NOT NULL DEFAULT '',   -- '' | En curso | Aprobado | No aprobado | Baja
  notas TEXT NOT NULL DEFAULT '',
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);
-- Un alumno no puede repetir el mismo curso dentro del mismo ciclo.
-- (Una inscripción rechazada no bloquea volver a intentar.)
CREATE UNIQUE INDEX inscripcion_unica
  ON inscripciones (correo, curso_id, ciclo) WHERE estado <> 'Rechazado';

CREATE TABLE calificaciones (
  folio TEXT PRIMARY KEY REFERENCES inscripciones(folio),
  participacion INTEGER CHECK (participacion BETWEEN 1 AND 4),
  trabajos INTEGER CHECK (trabajos BETWEEN 1 AND 4),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Asistencia: una fila por folio y clase (1 a 8)
CREATE TABLE asistencia (
  folio TEXT NOT NULL REFERENCES inscripciones(folio),
  clase INTEGER NOT NULL CHECK (clase BETWEEN 1 AND 8),
  presente INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (folio, clase)
);

-- Enlaces mágicos del alumno para ver su historial
CREATE TABLE accesos (
  token TEXT PRIMARY KEY,
  correo TEXT NOT NULL,
  expira_en TEXT NOT NULL
);

-- Siembra: los 17 cursos y ajustes iniciales (CONFIG.NIVELES de Code.gs)
INSERT INTO cursos (nivel, nombre, orden) VALUES
 ('Nivel 1','Identidad',1),('Nivel 1','Propósito',2),('Nivel 1','Carácter',3),
 ('Nivel 1','Visión',4),('Nivel 1','Recursos',5),('Nivel 1','Destino',6),
 ('Nivel 2','Siervo Aprobado',7),('Nivel 2','Siervo Próspero',8),('Nivel 2','Siervo Sano',9),
 ('Nivel 2','Siervo y Su Voz',10),('Nivel 2','Siervo y el Reino',11),('Nivel 2','Siervo y Su Dios',12),
 ('Nivel 3','Liderazgo 1',13),('Nivel 3','Trabajo en Equipo',14),('Nivel 3','Formación',15),
 ('Nivel 3','Planeación',16),('Nivel 3','Cultura',17);

INSERT INTO ajustes (clave, valor) VALUES ('precio_curso','100'), ('ciclo_activo','Ciclo 1');
