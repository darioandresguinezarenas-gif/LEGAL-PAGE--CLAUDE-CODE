// DOMPurify wrapper — segunda capa de sanitización al renderizar con set:html
// La primera capa ocurre en la Edge Function al guardar en Supabase.
import DOMPurify from 'dompurify';

export function sanitizeHtml(dirty: string): string {
  // Solo en el browser — en SSG el contenido viene ya sanitizado de Supabase
  if (typeof window === 'undefined') return dirty;
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'blockquote'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    FORCE_BODY: false,
  });
}
