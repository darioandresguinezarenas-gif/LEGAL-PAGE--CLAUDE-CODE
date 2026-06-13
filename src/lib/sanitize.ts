// DOMPurify wrapper.
//
// Capa 1 (guardado): el panel /admin sanitiza antes del upsert/insert
//   usando sanitizeRich() exportada por src/scripts/admin/tiptap.js
//   (importa DOMPurify directamente y se bundlea para el navegador).
//
// Capa 2 (render SSG): Astro embebe el HTML guardado vía set:html.
// Como el guardado ya pasó por DOMPurify, el HTML almacenado en la
// BD es seguro. Esta capa "client-only" actúa de red de seguridad en
// caso de hidratación dinámica futura.
import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 's',
  'h2', 'h3', 'h4',
  'ul', 'ol', 'li',
  'a', 'blockquote', 'code', 'hr',
];
const ALLOWED_ATTR = ['href', 'target', 'rel'];

export function sanitizeHtml(dirty: string): string {
  // En build (SSG) no hay window → confiamos en la sanitización del admin.
  if (typeof window === 'undefined') return dirty;
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORCE_BODY: false,
    ALLOW_DATA_ATTR: false,
  });
}
