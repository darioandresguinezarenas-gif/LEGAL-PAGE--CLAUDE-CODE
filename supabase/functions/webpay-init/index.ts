import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = ['https://www.guinezgalaz.cl', 'https://guinezgalaz.cl'];

function corsHeaders(origin: string | null) {
  const allowed = origin && (ALLOWED_ORIGINS.includes(origin) || /\.vercel\.app$/.test(origin));
  return {
    'Access-Control-Allow-Origin': allowed ? origin! : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// Credenciales de integración Transbank (ambiente de pruebas)
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
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método no permitido' }), {
      status: 405, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  let body: { monto?: unknown; descripcion?: unknown; nombre?: unknown; lang?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Cuerpo JSON inválido' }), {
      status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const monto = Number(body.monto);
  if (!Number.isInteger(monto) || monto < 50 || monto > 999_999_999) {
    return new Response(JSON.stringify({ error: 'Monto inválido. Mínimo $50 CLP, debe ser número entero.' }), {
      status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const descripcion = String(body.descripcion ?? '').slice(0, 200);
  const nombre      = String(body.nombre ?? '').slice(0, 100);
  const lang        = ['es', 'en', 'zh'].includes(String(body.lang)) ? String(body.lang) : 'es';

  const env = (Deno.env.get('TRANSBANK_ENV') ?? 'integration') as 'integration' | 'production';
  const commerceCode = Deno.env.get('TRANSBANK_COMMERCE_CODE') ?? (env === 'integration' ? TBK_INTEGRATION_CODE : '');
  const apiKey       = Deno.env.get('TRANSBANK_API_KEY')       ?? (env === 'integration' ? TBK_INTEGRATION_KEY : '');

  if (!commerceCode || !apiKey) {
    return new Response(JSON.stringify({ error: 'Configuración Transbank incompleta en el servidor.' }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Generar identificadores únicos
  const buyOrder = `ORD-${Date.now()}`;
  const sessionId = `SES-${crypto.randomUUID()}`;
  const returnUrl = `https://www.guinezgalaz.cl/${lang}/pago-resultado`;

  // Crear registro previo (estado pendiente)
  const { data: pagoRow, error: dbErr } = await supabase
    .from('pagos')
    .insert({ buy_order: buyOrder, session_id: sessionId, monto, descripcion, nombre, estado: 'pendiente' })
    .select('id')
    .single();

  if (dbErr) {
    console.error('[webpay-init] DB insert error:', dbErr.message);
    return new Response(JSON.stringify({ error: 'Error interno al registrar la transacción.' }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  // Iniciar transacción en Transbank
  let tbkJson: { token: string; url: string };
  try {
    const tbkRes = await fetch(
      `${TBK_BASE[env]}/rswebpaytransaction/api/webpay/v1.2/transactions`,
      {
        method: 'POST',
        headers: {
          'Tbk-Api-Key-Id': commerceCode,
          'Tbk-Api-Key-Secret': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ buy_order: buyOrder, session_id: sessionId, amount: monto, return_url: returnUrl }),
      },
    );

    if (!tbkRes.ok) {
      const errText = await tbkRes.text();
      console.error('[webpay-init] Transbank API error:', tbkRes.status, errText);
      await supabase.from('pagos').update({ estado: 'init_failed' }).eq('id', pagoRow.id);
      return new Response(JSON.stringify({ error: 'Error al iniciar el pago en Transbank. Intente nuevamente.' }), {
        status: 502, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    tbkJson = await tbkRes.json();
  } catch (err) {
    console.error('[webpay-init] Transbank fetch error:', err);
    await supabase.from('pagos').update({ estado: 'init_failed' }).eq('id', pagoRow.id);
    return new Response(JSON.stringify({ error: 'No se pudo conectar con Transbank. Intente nuevamente.' }), {
      status: 502, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  // Guardar token en el registro
  await supabase.from('pagos').update({ token_ws: tbkJson.token }).eq('id', pagoRow.id);

  return new Response(JSON.stringify({ token: tbkJson.token, url: tbkJson.url, buy_order: buyOrder }), {
    status: 200, headers: { ...cors, 'Content-Type': 'application/json' },
  });
});
