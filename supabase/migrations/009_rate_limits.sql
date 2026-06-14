-- Tabla para rate limiting de Edge Functions (webpay-init, etc.)
-- La tabla contacto ya usa la tabla contactos para rate limiting.
CREATE TABLE IF NOT EXISTS rate_limits (
  ip       TEXT        NOT NULL,
  endpoint TEXT        NOT NULL,
  hits     INTEGER     NOT NULL DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT pk_rate_limits PRIMARY KEY (ip, endpoint)
);

-- No necesita RLS — solo se accede con service_role desde Edge Functions
-- Índice para limpiar registros expirados periódicamente
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON rate_limits (reset_at);
