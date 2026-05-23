// Edge Function: contacto
// Valida formulario + honeypot + rate limiting + guarda en Supabase + envía email via Resend
// TODO: Fase 6 — implementación completa
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (_req) => {
  return new Response(JSON.stringify({ message: 'TODO: implementar en Fase 6' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' },
  });
});
