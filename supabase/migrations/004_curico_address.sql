-- ============================================================
-- 004 — Actualiza dirección y sede del estudio a Curicó
--       (corrige Rancagua → Curicó según handoff junio 2026)
--
-- Sede principal: Calle Hernán Correa 2140, Galilea, Curicó, Región del Maule
-- Atención secundaria: Valparaíso (presencial, sin oficina física)
-- ============================================================

UPDATE configuracion_estudio
SET valor = 'Calle Hernán Correa 2140, Galilea, Curicó, Región del Maule, Chile',
    updated_at = NOW()
WHERE clave = 'direccion';

-- Idempotente: si la clave no existía (instalación previa) la inserta.
INSERT INTO configuracion_estudio (clave, valor)
VALUES ('direccion', 'Calle Hernán Correa 2140, Galilea, Curicó, Región del Maule, Chile')
ON CONFLICT (clave) DO NOTHING;

-- Sede secundaria (informativa — usada por SeoHead y footer si está presente).
INSERT INTO configuracion_estudio (clave, valor)
VALUES ('sede_secundaria', 'Valparaíso, Chile · atención presencial bajo cita')
ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW();

-- Ciudad principal (clave nueva, útil para meta tags y schema.org).
INSERT INTO configuracion_estudio (clave, valor)
VALUES ('ciudad', 'Curicó')
ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW();

INSERT INTO configuracion_estudio (clave, valor)
VALUES ('region', 'Región del Maule')
ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW();
