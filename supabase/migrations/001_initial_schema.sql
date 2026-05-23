-- ============================================================
-- Güinez Galaz Abogados — Migración inicial v1
-- Todas las tablas con soft delete y RLS
-- ============================================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLA: areas_practica
-- ============================================================
CREATE TABLE areas_practica (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        TEXT UNIQUE NOT NULL,
  icono       TEXT NOT NULL DEFAULT 'scale',        -- Nombre ícono Lucide
  titulo      JSONB NOT NULL DEFAULT '{}',           -- {"es":"...","en":"...","zh":"..."}
  descripcion JSONB NOT NULL DEFAULT '{}',
  contenido   JSONB NOT NULL DEFAULT '{}',           -- Rich text por idioma
  faq         JSONB NOT NULL DEFAULT '[]',           -- [{pregunta:{...},respuesta:{...}}]
  activo      BOOLEAN NOT NULL DEFAULT true,
  orden       SMALLINT NOT NULL DEFAULT 0,
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: abogados
-- ============================================================
CREATE TABLE abogados (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug             TEXT UNIQUE NOT NULL,
  nombre           TEXT NOT NULL,
  cargo            JSONB NOT NULL DEFAULT '{}',      -- {"es":"Socio","en":"Partner","zh":"合伙人"}
  bio              JSONB NOT NULL DEFAULT '{}',      -- Bio multiidioma
  foto_url         TEXT,
  anos_trayectoria SMALLINT NOT NULL DEFAULT 0,
  formacion        TEXT[] NOT NULL DEFAULT '{}',     -- Array de strings
  especialidades   TEXT[] NOT NULL DEFAULT '{}',
  activo           BOOLEAN NOT NULL DEFAULT true,
  orden            SMALLINT NOT NULL DEFAULT 0,
  deleted_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: articulos
-- ============================================================
CREATE TABLE articulos (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug         TEXT UNIQUE NOT NULL,
  titulo       JSONB NOT NULL DEFAULT '{}',          -- {"es":"...","en":"...","zh":"..."}
  extracto     JSONB NOT NULL DEFAULT '{}',
  contenido    JSONB NOT NULL DEFAULT '{}',           -- HTML sanitizado por idioma
  imagen_url   TEXT,
  categoria    TEXT NOT NULL DEFAULT 'Laboral',       -- Laboral|Civil|Penal|Familia|Corporativo
  publicado    BOOLEAN NOT NULL DEFAULT false,
  autor_id     UUID REFERENCES abogados(id) ON DELETE SET NULL,
  deleted_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- ============================================================
-- TABLA: clientes_destacados
-- ============================================================
CREATE TABLE clientes_destacados (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre     TEXT NOT NULL,
  logo_url   TEXT NOT NULL,
  url        TEXT,
  activo     BOOLEAN NOT NULL DEFAULT true,
  orden      SMALLINT NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: contactos
-- ============================================================
CREATE TABLE contactos (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre     TEXT NOT NULL,
  email      TEXT NOT NULL,
  naturaleza TEXT NOT NULL CHECK (naturaleza IN ('Laboral','Civil','Penal','Familia','Otro')),
  mensaje    TEXT NOT NULL CHECK (char_length(mensaje) <= 3000),
  ip         TEXT,
  leido      BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: pagos
-- ============================================================
CREATE TABLE pagos (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monto              INTEGER NOT NULL CHECK (monto > 0),          -- En CLP, sin decimales
  token              TEXT UNIQUE NOT NULL,
  buy_order          TEXT UNIQUE NOT NULL,
  session_id         TEXT NOT NULL,
  estado             TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobado','rechazado','anulado')),
  response_code      SMALLINT,
  authorization_code TEXT,
  card_detail        JSONB,                                        -- Últimos 4 dígitos, etc.
  transaction_date   TIMESTAMPTZ,
  deleted_at         TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: configuracion_estudio
-- ============================================================
CREATE TABLE configuracion_estudio (
  clave      TEXT PRIMARY KEY,
  valor      TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- VALORES INICIALES
-- ============================================================
INSERT INTO configuracion_estudio (clave, valor) VALUES
  ('nombre_estudio', 'Güinez Galaz Abogados'),
  ('telefono',       '+56 9 XXXX XXXX'),
  ('email',          'contacto@guinezgalaz.cl'),
  ('direccion',      'Rancagua, Región de O''Higgins, Chile'),
  ('horario',        'Lunes a Viernes, 9:00 - 18:00'),
  ('whatsapp',       '+56 9 XXXX XXXX'),
  ('google_business',''),
  ('linkedin',       ''),
  ('instagram',      '');

-- ============================================================
-- TRIGGERS: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_areas_practica_updated_at
  BEFORE UPDATE ON areas_practica
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_abogados_updated_at
  BEFORE UPDATE ON abogados
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_articulos_updated_at
  BEFORE UPDATE ON articulos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE areas_practica      ENABLE ROW LEVEL SECURITY;
ALTER TABLE abogados             ENABLE ROW LEVEL SECURITY;
ALTER TABLE articulos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes_destacados  ENABLE ROW LEVEL SECURITY;
ALTER TABLE contactos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_estudio ENABLE ROW LEVEL SECURITY;

-- Lectura pública (anon): solo registros activos y no eliminados
CREATE POLICY "areas_public_read" ON areas_practica
  FOR SELECT TO anon
  USING (activo = true AND deleted_at IS NULL);

CREATE POLICY "abogados_public_read" ON abogados
  FOR SELECT TO anon
  USING (activo = true AND deleted_at IS NULL);

CREATE POLICY "articulos_public_read" ON articulos
  FOR SELECT TO anon
  USING (publicado = true AND deleted_at IS NULL);

CREATE POLICY "clientes_public_read" ON clientes_destacados
  FOR SELECT TO anon
  USING (activo = true AND deleted_at IS NULL);

CREATE POLICY "config_public_read" ON configuracion_estudio
  FOR SELECT TO anon
  USING (true);

-- Escritura solo via service_role (Edge Functions) — anon NUNCA puede escribir
-- service_role bypasses RLS by default en Supabase, pero dejamos explícito para claridad:
CREATE POLICY "service_role_full_access_areas"    ON areas_practica      FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access_abogados" ON abogados             FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access_articulos" ON articulos           FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access_clientes"  ON clientes_destacados FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access_contactos" ON contactos           FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access_pagos"     ON pagos               FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access_config"    ON configuracion_estudio FOR ALL TO service_role USING (true) WITH CHECK (true);
