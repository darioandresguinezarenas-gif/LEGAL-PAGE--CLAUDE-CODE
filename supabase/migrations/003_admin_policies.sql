-- ============================================================
-- Guíñez Galaz Abogados — Migración v3
-- Políticas de acceso completo para usuarios autenticados (admin)
-- ============================================================

-- El rol 'authenticated' corresponde a cualquier usuario con sesión activa
-- en Supabase Auth. El admin crea su cuenta desde Supabase Dashboard.
-- MFA TOTP se configura desde el panel /admin/setup-mfa.

CREATE POLICY "admin_full_areas"
  ON areas_practica FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "admin_full_abogados"
  ON abogados FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "admin_full_articulos"
  ON articulos FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "admin_full_clientes"
  ON clientes_destacados FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "admin_full_contactos"
  ON contactos FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "admin_full_pagos"
  ON pagos FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "admin_full_config"
  ON configuracion_estudio FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
