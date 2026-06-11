import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const msg = 'Config error: PUBLIC_SUPABASE_URL y/o PUBLIC_SUPABASE_ANON_KEY no están definidas en el build. Configúralas en Vercel (Project → Settings → Environment Variables, scope Production) y vuelve a desplegar.';
  if (typeof document !== 'undefined') {
    document.body.innerHTML = `<div style="font-family:system-ui;max-width:640px;margin:4rem auto;padding:2rem;background:#fff;border:1px solid #E8E8E0;border-radius:8px"><h1 style="color:#0D1F2D;font-size:1.25rem;margin:0 0 1rem">Configuración incompleta</h1><p style="color:#1A1A1A;line-height:1.6">${msg}</p></div>`;
  }
  throw new Error(msg);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Verifica sesión activa + nivel MFA.
 * Redirige a /admin si no hay sesión o falta verificar MFA.
 * @returns {Promise<import('@supabase/supabase-js').Session|null>}
 */
export async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.replace('/admin');
    return null;
  }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal && aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') {
    // Tiene MFA enrollado pero no lo ha verificado en esta sesión
    window.location.replace('/admin');
    return null;
  }

  return session;
}
