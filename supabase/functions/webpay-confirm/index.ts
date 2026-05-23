// Edge Function: webpay-confirm
// Confirma resultado de transacción Transbank y registra en tabla pagos
// TODO: Fase 7 — implementación completa
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (_req) => {
  return new Response(JSON.stringify({ message: 'TODO: implementar en Fase 7' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' },
  });
});
