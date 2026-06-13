# CLAUDE.md — Guíñez Galaz Abogados

## Proyecto

Sitio web institucional trilingüe (es/en/zh) para estudio jurídico con sede principal en Curicó (Calle Hernán Correa 2140, Galilea — Región del Maule, Chile) y atención presencial en Valparaíso (sin oficina física aún). Siempre referirse a la cobertura como "Curicó y Valparaíso".
Stack: Astro 5 SSG · Supabase · Vercel · Transbank Webpay · Resend · TypeScript.

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Framework | Astro 5 (`output: 'static'`) |
| CSS | Scoped `<style>` en componentes — `build.inlineStylesheets: 'never'` fuerza extracción a `/_astro/*.css` |
| Tipografías | Cormorant Garamond (títulos serif) · DM Sans (cuerpo) |
| Base de datos | Supabase (PostgreSQL) con RLS + soft delete (`deleted_at`) |
| Deploy | Vercel (CDN estático) |
| Pagos | Transbank Webpay Plus (CLP, sin decimales) |
| Email | Resend API vía Edge Function |
| i18n | `src/i18n/{es,en,zh}.json` + `src/i18n/utils.ts` con función `t(lang, 'key')` |

## Paleta y diseño

```
#0D1F2D  — Navy oscuro (fondos hero, navbar)
#C9A84C  — Dorado (acentos, CTAs, iconos)
#F5F5F0  — Blanco hueso (fondo de página)
#1A1A1A  — Texto principal
#6B6B6B  — Texto secundario
#E8E8E0  — Bordes
```

Grids: 3 col → 2 col (@960px) → 1 col (@600px). Border-radius: 8px. Nunca `border-radius: 50%` en botones.

## Restricciones de seguridad — INNEGOCIABLES

1. **CSP sin `unsafe-inline`**: `vercel.json` tiene `style-src 'self' https://fonts.googleapis.com` y `script-src 'self'`. Nunca agregar `'unsafe-inline'` ni `'unsafe-eval'`.
2. **`.env` nunca al repositorio**: Está en `.gitignore`. Innegociable.
3. **`SUPABASE_SERVICE_ROLE_KEY` nunca en el frontend**: Solo en Edge Functions de Supabase con `service_role`. La anon key es de solo lectura.
4. **Escritura vía Edge Functions**: Todo INSERT/UPDATE/DELETE pasa por Supabase Edge Functions autenticadas. La anon key no tiene permisos de escritura.
5. **Scripts externos**: Los `<script>` en componentes Astro no deben usar `is:inline`. Astro los bundlea automáticamente a `/_astro/*.js`.

## Convenciones de código

- Componentes Astro: PascalCase (`AreaDetail.astro`, `FaqAccordion.astro`)
- Scripts externos: `src/scripts/nombre.js`
- i18n: `t(lang, 'seccion.clave')` — nunca strings hardcodeados en otro idioma que no sea ES como fallback
- Iconos: SVG inline con `set:html={svgPaths}` (no instalar librerías de iconos)
- Soft delete: `deleted_at TIMESTAMPTZ NULL` en todas las tablas — nunca `DELETE` físico
- UUIDs: `gen_random_uuid()` (nativo PG 13+, sin extensión)
- Imágenes externas permitidas en CSP: `*.supabase.co`, `images.unsplash.com`, `*.googleusercontent.com`

## Estructura de rutas

```
/es/          /en/          /zh/
├── index
├── areas-practica
│   └── [slug]   (laboral|civil|penal|familia|corporativo|contratos)
├── quienes-somos
├── blog
│   └── [slug]
├── contacto
└── admin/
    ├── login
    └── dashboard/...
```

## Fases del proyecto

| Fase | Estado | Descripción |
|------|--------|-------------|
| 1 | ✅ | Infraestructura base (Astro, i18n, CSP, deploy Vercel) |
| 2 | ✅ | Diseño y componentes (navbar, footer, home, áreas, equipo) |
| 3 | ✅ | Páginas de detalle áreas (`/[lang]/areas-practica/[slug]`) con FAQs |
| 4 | ⏳ | Integración Supabase (datos dinámicos desde BD) |
| 5 | ⏳ | Blog con markdown + Supabase |
| 6 | ⏳ | Formulario de contacto (Resend Edge Function) |
| 7 | ⏳ | Panel admin (MFA TOTP + CRUD completo) |
| 8 | ⏳ | Pasarela de pago Transbank Webpay |
| 9 | ⏳ | SEO avanzado (JSON-LD: LegalService, FAQPage, BreadcrumbList) |
| 10 | ⏳ | QA + auditoría de seguridad final |
| 11 | ⏳ | Deploy producción + monitoreo |

## Variables de entorno requeridas

Ver `.env.example`. Nunca commitear `.env`.

```
PUBLIC_SUPABASE_URL
PUBLIC_SUPABASE_ANON_KEY       # Solo lectura — anon, nunca escribe
SUPABASE_SERVICE_ROLE_KEY      # Solo Edge Functions — nunca frontend
RESEND_API_KEY
TRANSBANK_COMMERCE_CODE
TRANSBANK_API_KEY
TRANSBANK_ENV                  # integration | production
PUBLIC_GA4_MEASUREMENT_ID
PUBLIC_GOOGLE_PLACE_ID
PUBLIC_GOOGLE_PLACES_API_KEY
```

## Push al repositorio

El proxy de red bloquea git push estándar. Usar token en URL:

```bash
set -a; . ./.env; set +a
git push "https://${GITHUB_TOKEN}@github.com/darioandresguinezarenas-gif/LEGAL-PAGE--CLAUDE-CODE.git" HEAD:claude/awesome-johnson-4bvX1
git fetch origin claude/awesome-johnson-4bvX1
```

`GITHUB_TOKEN` debe estar en `.env` (gitignored).
