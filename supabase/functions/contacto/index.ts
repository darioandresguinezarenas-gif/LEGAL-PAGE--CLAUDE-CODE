import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://www.guinezgalaz.cl',
  'https://guinezgalaz.cl',
];

function corsHeaders(origin: string | null) {
  const allowed =
    origin &&
    (ALLOWED_ORIGINS.includes(origin) || /\.vercel\.app$/.test(origin));
  return {
    'Access-Control-Allow-Origin': allowed ? origin! : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

const NATURALEZA_MAP: Record<string, string> = {
  laboral: 'Laboral',
  civil:   'Civil',
  penal:   'Penal',
  familia: 'Familia',
  otro:    'Otro',
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  const cors = corsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }

  const { nombre, email, naturaleza, mensaje, website } = body;

  // Honeypot: si el campo oculto está lleno, es un bot — responder OK para no revelar el filtro
  if (website) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }

  // Validación de campos
  if (!nombre?.trim() || !email?.trim() || !naturaleza || !mensaje?.trim()) {
    return new Response(
      JSON.stringify({ error: 'Todos los campos son obligatorios' }),
      { status: 422, headers: { 'Content-Type': 'application/json', ...cors } },
    );
  }

  if (nombre.length > 120 || email.length > 160 || mensaje.length > 3000) {
    return new Response(
      JSON.stringify({ error: 'Un campo excede el límite de caracteres' }),
      { status: 422, headers: { 'Content-Type': 'application/json', ...cors } },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(
      JSON.stringify({ error: 'Email inválido' }),
      { status: 422, headers: { 'Content-Type': 'application/json', ...cors } },
    );
  }

  const naturalezaDB = NATURALEZA_MAP[naturaleza.toLowerCase()] ?? 'Otro';

  // Supabase con service_role (bypasses RLS)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // IP para rate limiting (sin bloquear el request si no está disponible)
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    null;

  // Rate limiting: máximo 3 mensajes por IP en 10 minutos
  if (ip) {
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('contactos')
      .select('id', { count: 'exact', head: true })
      .eq('ip', ip)
      .gte('created_at', since);

    if ((count ?? 0) >= 3) {
      return new Response(
        JSON.stringify({ error: 'Demasiados intentos. Espera 10 minutos.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '600',
            ...cors,
          },
        },
      );
    }
  }

  // Insertar en la tabla contactos
  const { error: insertError } = await supabase.from('contactos').insert({
    nombre:     nombre.trim(),
    email:      email.trim().toLowerCase(),
    naturaleza: naturalezaDB,
    mensaje:    mensaje.trim(),
    ip,
  });

  if (insertError) {
    console.error('[contacto] insert error:', insertError.message);
    return new Response(
      JSON.stringify({ error: 'Error al guardar el mensaje. Inténtalo nuevamente.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...cors } },
    );
  }

  // Notificación por email via Resend (fallo no bloquea la respuesta)
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (resendKey) {
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:     'Guíñez Galaz <notificaciones@guinezgalaz.cl>',
        to:       ['dguinezlegal@gmail.com'],
        reply_to: email.trim(),
        subject:  `[Contacto Web] ${naturalezaDB} — ${nombre.trim()}`,
        html: `
<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#1A1A1A">
  <div style="background:#0D1F2D;padding:1.5rem 2rem;margin-bottom:0">
    <p style="color:#C9A84C;font-weight:700;letter-spacing:.14em;margin:0;font-size:.75rem;text-transform:uppercase">Guíñez Galaz Abogados</p>
    <p style="color:rgba(255,255,255,.65);margin:.375rem 0 0;font-size:.875rem">Nuevo mensaje de contacto desde la web</p>
  </div>
  <div style="border:1px solid #E8E8E0;border-top:0;padding:1.75rem 2rem">
    <table style="border-collapse:collapse;width:100%;margin-bottom:1.75rem">
      <tr>
        <td style="padding:.625rem .5rem;border-bottom:1px solid #E8E8E0;font-weight:600;color:#6B6B6B;font-size:.75rem;text-transform:uppercase;width:100px">Nombre</td>
        <td style="padding:.625rem .5rem;border-bottom:1px solid #E8E8E0">${nombre.trim()}</td>
      </tr>
      <tr>
        <td style="padding:.625rem .5rem;border-bottom:1px solid #E8E8E0;font-weight:600;color:#6B6B6B;font-size:.75rem;text-transform:uppercase">Email</td>
        <td style="padding:.625rem .5rem;border-bottom:1px solid #E8E8E0"><a href="mailto:${email.trim()}" style="color:#C9A84C;text-decoration:none">${email.trim()}</a></td>
      </tr>
      <tr>
        <td style="padding:.625rem .5rem;border-bottom:1px solid #E8E8E0;font-weight:600;color:#6B6B6B;font-size:.75rem;text-transform:uppercase">Consulta</td>
        <td style="padding:.625rem .5rem;border-bottom:1px solid #E8E8E0">${naturalezaDB}</td>
      </tr>
    </table>
    <p style="font-weight:600;color:#6B6B6B;font-size:.75rem;text-transform:uppercase;margin:0 0 .75rem">Mensaje</p>
    <div style="background:#F5F5F0;padding:1.25rem 1.5rem;border-radius:4px;white-space:pre-wrap;font-size:.9375rem;line-height:1.7">${mensaje.trim()}</div>
    <p style="margin-top:1.75rem;font-size:.75rem;color:#6B6B6B;border-top:1px solid #E8E8E0;padding-top:1rem">
      Puedes responder a este email directamente o ver el mensaje en el
      <a href="https://www.guinezgalaz.cl/admin/contactos" style="color:#C9A84C">panel de administración</a>.
    </p>
  </div>
</div>`,
      }),
    }).catch((e: Error) => console.error('[contacto] resend error (non-fatal):', e.message));
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
});
