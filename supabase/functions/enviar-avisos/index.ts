// ============================================================
//  supabase/functions/enviar-avisos/index.ts
//  Drena la cola de `avisos` con mail_estado = 'pendiente' y los manda por
//  Resend.
//
//  NO se despliega hasta que exista el secret RESEND_API_KEY. Sin él la
//  función arranca y devuelve 503 explícito en vez de fallar en silencio.
//
//  Por qué una función que DRENA y no un envío al vuelo desde el trigger:
//  un trigger que hace HTTP bloquea la transacción que lo disparó. Si Resend
//  tarda, la respuesta del socio a una solicitud tarda con él; si Resend está
//  caído, la respuesta falla. El aviso ya está guardado —el usuario lo ve
//  in-app— y el mail es un intento aparte que puede reintentarse.
// ============================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_KEY = Deno.env.get('RESEND_API_KEY');
const DESDE      = Deno.env.get('AVISOS_FROM') ?? 'Cuponear <avisos@gesell.ar>';
const APP_URL    = Deno.env.get('APP_URL') ?? 'https://gesell.ar';
const MAX_INTENTOS = 3;
const LOTE = 50;

// El mismo texto que la app, duplicado a propósito: el mail lo arma el server
// y no puede importar de src/. Si cambia un copy, cambia en los dos lados —
// está anotado en src/lib/avisos.js.
const fecha = (d?: string) =>
  d ? new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' }) : '';

function enCuanto(iso?: string) {
  if (!iso) return '';
  const hs = Math.round((new Date(iso).getTime() - Date.now()) / 36e5);
  if (hs <= 1) return 'en menos de una hora';
  if (hs < 24) return `en ${hs} horas`;
  const d = Math.round(hs / 24);
  return d === 1 ? 'mañana' : `en ${d} días`;
}

type Payload = Record<string, any>;
const TEXTOS: Record<string, (p: Payload) => { titulo: string; cuerpo: string; cta?: string }> = {
  solicitud_recibida: p => ({
    titulo: 'Te pidieron una fecha',
    cuerpo: `${p.personas || 1} persona${p.personas > 1 ? 's' : ''} para <b>${p.oferta}</b>, el ${fecha(p.fecha_pedida)}. Tenés 72 horas para responder.`,
    cta: 'Responder',
  }),
  solicitud_por_vencer: p => ({
    titulo: 'Una solicitud está por vencer',
    cuerpo: `La de <b>${p.oferta}</b> (${fecha(p.fecha_pedida)}) vence ${enCuanto(p.expira_at)}. Si no respondés, el turista pierde el beneficio.`,
    cta: 'Responder ahora',
  }),
  solicitud_aceptada: p => ({
    titulo: '¡Te confirmaron la fecha!',
    cuerpo: `${p.negocio || 'El comercio'} aceptó tu pedido para <b>${p.oferta}</b> el ${fecha(p.fecha_pedida)}.`,
    cta: 'Ver mi Pase',
  }),
  solicitud_rechazada: p => ({
    titulo: 'No pudieron con esa fecha',
    cuerpo: `${p.negocio || 'El comercio'} no puede el ${fecha(p.fecha_pedida)} para <b>${p.oferta}</b>. Tu beneficio PREMIUM quedó libre.`,
    cta: 'Elegir otro',
  }),
  solicitud_contrapropuesta: p => ({
    titulo: 'Te proponen otra fecha',
    cuerpo: `Para <b>${p.oferta}</b>: ${fecha(p.fecha_propuesta)} en vez del ${fecha(p.fecha_pedida)}.`,
    cta: 'Ver la propuesta',
  }),
  solicitud_vencida: p => ({
    titulo: 'La solicitud venció',
    cuerpo: `${p.negocio || 'El comercio'} no respondió a tiempo por <b>${p.oferta}</b>. Tu beneficio PREMIUM quedó libre.`,
    cta: 'Elegir otro',
  }),
  oferta_aprobada: p => ({
    titulo: 'Tu oferta ya está publicada',
    cuerpo: `<b>${p.oferta}</b> pasó la revisión y los turistas ya pueden verla.`,
    cta: 'Ver mi panel',
  }),
  oferta_rechazada: p => ({
    titulo: 'Tu oferta necesita cambios',
    cuerpo: `<b>${p.oferta}</b> no pasó la revisión. Entrá a tu panel para corregirla.`,
    cta: 'Corregir',
  }),
  pase_por_vencer: p => ({
    titulo: 'Tu Pase está por vencer',
    cuerpo: `Vence ${enCuanto(p.vence_el)}. Usá los beneficios que te queden antes de esa fecha.`,
    cta: 'Ver mi Pase',
  }),
  cupon_por_vencer: p => ({
    titulo: 'Un cupón tuyo está por vencer',
    cuerpo: `<b>${p.oferta}</b> vence ${enCuanto(p.vence_el)}.`,
    cta: 'Ver mis cupones',
  }),
};

const html = (t: string, c: string, cta: string, url: string) => `
<div style="font-family:Inter,system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0B1020">
  <div style="font-size:13px;font-weight:800;color:#2545E6;letter-spacing:.08em;text-transform:uppercase">Cuponear</div>
  <h1 style="font-size:22px;font-weight:800;margin:14px 0 10px;letter-spacing:-.02em">${t}</h1>
  <p style="font-size:15px;line-height:1.6;color:#3D4255;margin:0 0 24px">${c}</p>
  <a href="${url}" style="display:inline-block;background:#2545E6;color:#fff;text-decoration:none;padding:13px 22px;border-radius:12px;font-size:15px;font-weight:700">${cta}</a>
  <p style="font-size:12px;color:#6B7280;line-height:1.5;margin:28px 0 0;border-top:1px solid #E7E9EE;padding-top:16px">
    Recibís este aviso porque tenés una cuenta en Cuponear.
  </p>
</div>`;

Deno.serve(async () => {
  if (!RESEND_KEY) {
    return new Response(JSON.stringify({ error: 'falta_resend_api_key' }), {
      status: 503, headers: { 'Content-Type': 'application/json' },
    });
  }

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: pendientes } = await sb
    .from('avisos').select('*')
    .eq('mail_estado', 'pendiente')
    .lt('mail_intentos', MAX_INTENTOS)
    .order('creado_en', { ascending: true })
    .limit(LOTE);

  let enviados = 0, fallidos = 0;

  for (const av of pendientes ?? []) {
    const armar = TEXTOS[av.tipo];
    // Un tipo que esta versión no conoce se marca 'omitido', no 'fallido': no
    // hay nada que reintentar, y dejarlo pendiente lo haría reaparecer en cada
    // corrida para siempre.
    if (!armar || !av.email) {
      await sb.from('avisos').update({ mail_estado: 'omitido' }).eq('id', av.id);
      continue;
    }
    const { titulo, cuerpo, cta } = armar(av.payload ?? {});
    const url = `${APP_URL}${av.destino ? `/?ir=${av.destino}` : ''}`;

    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: DESDE, to: [av.email], subject: titulo,
          html: html(titulo, cuerpo, cta ?? 'Abrir Cuponear', url),
        }),
      });
      if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
      await sb.from('avisos').update({
        mail_estado: 'enviado', mail_enviado_el: new Date().toISOString(),
        mail_intentos: av.mail_intentos + 1, mail_error: null,
      }).eq('id', av.id);
      enviados++;
    } catch (e) {
      const intentos = av.mail_intentos + 1;
      await sb.from('avisos').update({
        // Sólo se rinde al agotar los intentos: un 500 de Resend no puede
        // matar el aviso en el primer try.
        mail_estado: intentos >= MAX_INTENTOS ? 'fallido' : 'pendiente',
        mail_intentos: intentos, mail_error: String(e).slice(0, 500),
      }).eq('id', av.id);
      fallidos++;
    }
  }

  return new Response(JSON.stringify({ enviados, fallidos, revisados: pendientes?.length ?? 0 }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
