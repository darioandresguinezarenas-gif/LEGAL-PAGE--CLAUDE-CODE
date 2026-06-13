-- ============================================================
-- 005 — Imagen del hero del home + sede textual
--
-- Agrega claves editables desde el panel /admin/configuracion:
--   · hero_image_url: URL pública de la foto del banner del home
--                     (alojada en bucket 'branding' de Supabase Storage)
--   · sede: texto único que aparece en footer/contacto/SEO,
--           típicamente "Curicó y Valparaíso, Chile"
-- ============================================================

INSERT INTO configuracion_estudio (clave, valor)
VALUES ('hero_image_url', '')
ON CONFLICT (clave) DO NOTHING;

INSERT INTO configuracion_estudio (clave, valor)
VALUES ('sede', 'Curicó y Valparaíso, Chile')
ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW();

-- ============================================================
-- IMPORTANTE — crear el bucket 'branding' manualmente en
-- Supabase Studio (Storage → New bucket → public, name=branding)
-- antes de subir imágenes desde el panel admin.
-- ============================================================
