-- ============================================================
-- 005 — Imagen del hero del home + sede textual + bucket branding
--
-- Agrega claves editables desde el panel /admin/configuracion:
--   · hero_image_url: URL pública de la foto del banner del home
--   · sede: texto único que aparece en footer/contacto/SEO
--           ("Curicó y Valparaíso, Chile")
--
-- También crea el bucket 'branding' en Supabase Storage con las
-- mismas políticas que 'abogados' y 'clientes', para que el
-- uploader del hero funcione sin intervención manual.
-- ============================================================

-- 1. Claves de configuración ---------------------------------
INSERT INTO configuracion_estudio (clave, valor)
VALUES ('hero_image_url', '')
ON CONFLICT (clave) DO NOTHING;

INSERT INTO configuracion_estudio (clave, valor)
VALUES ('sede', 'Curicó y Valparaíso, Chile')
ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW();

-- 2. Bucket 'branding' (público) -----------------------------
-- Idempotente: si ya existe, no hace nada.
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas de Storage para el bucket 'branding' ----------
-- Lectura pública: cualquier visitante puede ver las imágenes.
DROP POLICY IF EXISTS "branding_public_read" ON storage.objects;
CREATE POLICY "branding_public_read"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'branding');

-- Escritura solo para admins autenticados (uploader del panel).
DROP POLICY IF EXISTS "branding_admin_write" ON storage.objects;
CREATE POLICY "branding_admin_write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'branding');

DROP POLICY IF EXISTS "branding_admin_update" ON storage.objects;
CREATE POLICY "branding_admin_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'branding')
  WITH CHECK (bucket_id = 'branding');

DROP POLICY IF EXISTS "branding_admin_delete" ON storage.objects;
CREATE POLICY "branding_admin_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'branding');
