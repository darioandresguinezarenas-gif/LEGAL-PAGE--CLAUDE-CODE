// Edge Function: backup (cron semanal)
// Exporta todas las tablas a JSON y las sube a Google Drive
// TODO: Fase 8 — implementación completa
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (_req) => {
  return new Response(JSON.stringify({ message: 'TODO: implementar en Fase 8' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' },
  });
});
