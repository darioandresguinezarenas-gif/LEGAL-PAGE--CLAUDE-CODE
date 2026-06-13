import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = ['https://www.guinezgalaz.cl', 'https://guinezgalaz.cl'];

function corsHeaders(origin: string | null) {
  const allowed = origin && (ALLOWED_ORIGINS.includes(origin) || /\.vercel\.app$/.test(origin));
  return {
    'Access-Control-Allow-Origin': allowed ? origin! : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

const TBK_INTEGRATION_CODE = '597055555532';
const TBK_INTEGRATION_KEY = '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1';

const TBK_BASE = {
  integration: 'https://webpay3gint.transbank.cl',
  production:  'https://webpay3g.transbank.cl',
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  const cors = corsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Método no permitido' }), {
      status: 405, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(req.url);
  const tokenWs = url.searchParams.get('token_ws');

  if (!tokenWs) {
    return new Response(JSON.stringify({ error: 'Parámetro token_ws requerido' }), {
      status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const env = (Deno.env.get('TRANSBANK_ENV') ?? 'integration') as 'integration' | 'production';
  const commerceCode = Deno.env.get('TRANSBANK_COMMERCE_CODE') ?? (env === 'integration' ? TBK_INTEGRATION_CODE : '');
  const apiKey       = Deno.env.get('TRANSBANK_API_KEY')       ?? (env === 'integration' ? TBK_INTEGRATION_KEY : '');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Verificar que el token existe en nuestra BD (previene confirmaciones duplicadas)
  const { data: pagoRow, error: findErr } = await supabase
    .from('pagos')
    .select('id, estado')
    .eq('token_ws', tokenWs)
    .maybeSingle();

  if (findErr || !pagoRow) {
    return new Response(JSON.stringify({ error: 'Transacción no encontrada.' }), {
      status: 404, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  // Si ya fue procesada, retornar el estado actual
  if (pagoRow.estado !== 'pendiente') {
    return new Response(JSON.stringify({ ok: pagoRow.estado === 'aprobado', estado: pagoRow.estado, already_processed: true }), {
      status: 200, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  // Confirmar con Transbank (PUT)
  let tbkResult: Record<string, unknown>;
  try {
    const tbkRes = await fetch(
      `${TBK_BASE[env]}/rswebpaytransaction/api/webpay/v1.2/transactions/${tokenWs}`,
      {
        method: 'PUT',
        headers: {
          'Tbk-Api-Key-Id': commerceCode,
          'Tbk-Api-Key-Secret': apiKey,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!tbkRes.ok) {
      const errText = await tbkRes.text();
      console.error('[webpay-confirm] Transbank API error:', tbkRes.status, errText);
      await supabase.from('pagos').update({ estado: 'rechazado' }).eq('id', pagoRow.id);
      return new Response(JSON.stringify({ ok: false, error: 'Error al confirmar en Transbank.' }), {
        status: 502, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    tbkResult = await tbkRes.json();
  } catch (err) {
    console.error('[webpay-confirm] Transbank fetch error:', err);
    return new Response(JSON.stringify({ ok: false, error: 'No se pudo conectar con Transbank.' }), {
      status: 502, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  // response_code = 0 → aprobado; cualquier otro valor → rechazado
  const aprobado = tbkResult.response_code === 0;
  const nuevoEstado = aprobado ? 'aprobado' : 'rechazado';

  await supabase.from('pagos').update({
    estado:            nuevoEstado,
    authorization_code: tbkResult.authorization_code as string ?? null,
    response_code:     tbkResult.response_code as number ?? null,
    payment_type_code: tbkResult.payment_type_code as string ?? null,
    card_detail:       tbkResult.card_detail as Record<string, unknown> ?? null,
    transaction_date:  tbkResult.transaction_date as string ?? null,
    raw_response:      tbkResult,
  }).eq('id', pagoRow.id);

  return new Response(
    JSON.stringify({
      ok:                 aprobado,
      estado:             nuevoEstado,
      authorization_code: tbkResult.authorization_code,
      monto:              tbkResult.amount,
      buy_order:          tbkResult.buy_order,
      card_detail:        tbkResult.card_detail,
      payment_type_code:  tbkResult.payment_type_code,
      transaction_date:   tbkResult.transaction_date,
    }),
    { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } },
  );
});
