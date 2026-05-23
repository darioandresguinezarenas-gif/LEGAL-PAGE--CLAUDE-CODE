// Edge Function: webpay-init
// Inicia transacción Webpay Plus y retorna token + URL de pago
// TODO: Fase 7 — implementación completa con transbank-sdk
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (_req) => {
  return new Response(JSON.stringify({ message: 'TODO: implementar en Fase 7' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' },
  });
});
