-- Migración 007: Actualiza tabla pagos para Webpay Transbank
-- La tabla 'pagos' ya existe desde migración 001 con schema básico.
-- Este ALTER adapta la estructura para las Edge Functions de Webpay.

-- 1. Renombrar columna 'token' → 'token_ws' y hacerla nullable
--    (Transbank usa el nombre token_ws; la columna se actualiza en un paso posterior al INSERT)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pagos' AND column_name = 'token'
  ) THEN
    ALTER TABLE pagos RENAME COLUMN token TO token_ws;
    ALTER TABLE pagos ALTER COLUMN token_ws DROP NOT NULL;
  END IF;
END $$;

-- 2. Agregar columnas nuevas
ALTER TABLE pagos
  ADD COLUMN IF NOT EXISTS descripcion       TEXT,
  ADD COLUMN IF NOT EXISTS nombre            TEXT,
  ADD COLUMN IF NOT EXISTS payment_type_code TEXT,
  ADD COLUMN IF NOT EXISTS raw_response      JSONB;

-- 3. Actualizar CHECK constraint de estado para incluir 'init_failed'
ALTER TABLE pagos DROP CONSTRAINT IF EXISTS pagos_estado_check;
ALTER TABLE pagos ADD CONSTRAINT pagos_estado_check
  CHECK (estado IN ('pendiente','aprobado','rechazado','anulado','init_failed'));

-- 4. Actualizar CHECK constraint de monto (>0 → >=50, mínimo Transbank)
ALTER TABLE pagos DROP CONSTRAINT IF EXISTS pagos_monto_check;
ALTER TABLE pagos ADD CONSTRAINT pagos_monto_check
  CHECK (monto >= 50);

-- 5. Habilitar RLS y agregar política para admin autenticado
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_select_pagos" ON pagos;
CREATE POLICY "admin_select_pagos" ON pagos
  FOR SELECT TO authenticated USING (true);
