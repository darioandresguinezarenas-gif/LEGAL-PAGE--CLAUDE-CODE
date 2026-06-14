-- Migración 008: Agregar email a tabla pagos
-- Para enviar confirmación de pago al cliente por correo

ALTER TABLE pagos
  ADD COLUMN IF NOT EXISTS email TEXT;
