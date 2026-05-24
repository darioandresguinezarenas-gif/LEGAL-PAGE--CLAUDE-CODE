-- ============================================================
-- Guíñez Galaz Abogados — Migración v2
-- Columnas faltantes vs. Spec v8 FINAL
-- ============================================================

-- ============================================================
-- TABLA: areas_practica
-- Agregar meta_titulo y meta_descripcion como columnas TEXT separadas
-- (el spec las define fuera del JSONB para uso directo en <meta>)
-- ============================================================
ALTER TABLE areas_practica
  ADD COLUMN IF NOT EXISTS meta_titulo      TEXT,
  ADD COLUMN IF NOT EXISTS meta_descripcion TEXT;

-- ============================================================
-- TABLA: abogados
-- ============================================================
ALTER TABLE abogados
  ADD COLUMN IF NOT EXISTS email        VARCHAR(255),
  ADD COLUMN IF NOT EXISTS telefono     VARCHAR(20),
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- ============================================================
-- TABLA: articulos
-- ============================================================
ALTER TABLE articulos
  ADD COLUMN IF NOT EXISTS meta_descripcion TEXT,
  ADD COLUMN IF NOT EXISTS tiempo_lectura   INT     CHECK (tiempo_lectura > 0),
  ADD COLUMN IF NOT EXISTS destacado        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS idioma           VARCHAR(5) CHECK (idioma IN ('es', 'en', 'zh'));

-- ============================================================
-- TABLA: contactos
-- ============================================================
ALTER TABLE contactos
  ADD COLUMN IF NOT EXISTS telefono      VARCHAR(20),
  ADD COLUMN IF NOT EXISTS idioma_sesion VARCHAR(5) CHECK (idioma_sesion IN ('es', 'en', 'zh'));

-- ============================================================
-- ÍNDICES útiles para las columnas nuevas
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_articulos_destacado ON articulos (destacado) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_articulos_idioma    ON articulos (idioma)    WHERE deleted_at IS NULL;
