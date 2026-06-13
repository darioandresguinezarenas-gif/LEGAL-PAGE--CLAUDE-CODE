-- Migración 007: tabla de transacciones Webpay
-- Usa nombres de columna que coinciden con admin/pagos.astro (monto, estado, card_detail)

CREATE TABLE IF NOT EXISTS pagos (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  buy_order        TEXT        NOT NULL UNIQUE,
  session_id       TEXT        NOT NULL,
  monto            INTEGER     NOT NULL CHECK (monto >= 50),
  descripcion      TEXT,
  nombre           TEXT,
  token_ws         TEXT,
  estado           TEXT        NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente','aprobado','rechazado','anulado','init_failed')),
  authorization_code TEXT,
  response_code    INTEGER,
  payment_type_code TEXT,
  card_detail      JSONB,
  transaction_date TIMESTAMPTZ,
  raw_response     JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ
);

ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

-- Admin autenticado puede ver todas las transacciones
CREATE POLICY "admin_select_pagos" ON pagos
  FOR SELECT TO authenticated USING (true);

-- Las Edge Functions usan service_role (bypass RLS) para INSERT/UPDATE
-- No se necesita policy pública de escritura
