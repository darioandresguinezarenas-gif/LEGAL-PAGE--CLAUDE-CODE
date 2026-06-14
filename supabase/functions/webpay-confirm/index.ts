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
    .select('id, estado, email, nombre, descripcion, monto')
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

  // Enviar email de confirmación si el pago fue aprobado y hay correo
  if (aprobado && pagoRow.email) {
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (resendKey) {
      function escHtml(s: unknown) {
        return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      }
      const monto = Number(pagoRow.monto ?? tbkResult.amount);
      const montoFmt = monto.toLocaleString('es-CL');
      const emailHtml = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#F5F5F0;margin:0;padding:24px">
<div style="max-width:520px;margin:0 auto">
  <div style="background:#0D1F2D;padding:24px;border-radius:8px 8px 0 0;text-align:center">
    <h1 style="color:#C9A84C;font-family:Georgia,serif;margin:0;font-size:1.4rem;letter-spacing:.08em">GUÍÑEZ GALAZ</h1>
    <p style="color:#ffffff;margin:4px 0 0;font-size:.8rem;letter-spacing:.1em;text-transform:uppercase">Abogados</p>
  </div>
  <div style="background:#ffffff;border:1px solid #E8E8E0;border-top:none;padding:28px;border-radius:0 0 8px 8px">
    <h2 style="color:#0D1F2D;margin:0 0 .875rem;font-size:1.2rem">✅ Pago aprobado</h2>
    <p style="color:#1A1A1A;margin:0 0 1.25rem">Estimado/a <strong>${escHtml(pagoRow.nombre)}</strong>, su pago ha sido procesado exitosamente.</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:1.25rem">
      <tr><td style="padding:8px 0;border-bottom:1px solid #E8E8E0;color:#6B6B6B;font-size:.875rem">Orden de compra</td><td style="padding:8px 0;border-bottom:1px solid #E8E8E0;font-weight:600;font-size:.875rem;text-align:right">${escHtml(tbkResult.buy_order)}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #E8E8E0;color:#6B6B6B;font-size:.875rem">Descripción</td><td style="padding:8px 0;border-bottom:1px solid #E8E8E0;font-weight:600;font-size:.875rem;text-align:right">${escHtml(pagoRow.descripcion)}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #E8E8E0;color:#6B6B6B;font-size:.875rem">Monto</td><td style="padding:8px 0;border-bottom:1px solid #E8E8E0;font-weight:600;font-size:.875rem;text-align:right">$${montoFmt} CLP</td></tr>
      <tr><td style="padding:8px 0;color:#6B6B6B;font-size:.875rem">Cód. autorización</td><td style="padding:8px 0;font-weight:600;font-size:.875rem;text-align:right">${escHtml(tbkResult.authorization_code)}</td></tr>
    </table>
    <p style="color:#6B6B6B;font-size:.8125rem;line-height:1.6;margin:0">¿Tiene alguna consulta? Contáctenos en <a href="mailto:contacto@guinezgalaz.cl" style="color:#C9A84C">contacto@guinezgalaz.cl</a></p>
  </div>
  <p style="text-align:center;color:#9CA3AF;font-size:.75rem;margin-top:16px">Guíñez Galaz Abogados · Calle Hernán Correa 2140, Curicó, Chile</p>
</div>
</body></html>`;
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Guíñez Galaz Abogados <pagos@guinezgalaz.cl>',
            to: [pagoRow.email],
            subject: `Comprobante de pago — ${tbkResult.buy_order}`,
            html: emailHtml,
          }),
        });
      } catch (emailErr) {
        console.error('[webpay-confirm] Resend error (non-fatal):', emailErr);
      }
    }
  }

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
