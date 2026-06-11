import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

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
