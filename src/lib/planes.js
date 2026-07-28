// ============================================================
//  src/lib/planes.js
//  Fuente única de verdad para el modelo de planes Gratis/Plus.
//  Reemplaza las copias duplicadas que existían en SociosView.jsx
//  y LoginView.jsx (incluyendo el plan Black, ya eliminado).
// ============================================================

import { supabase } from './supabase';
import { acreditarTokens } from './cobros';

// Créditos publicitarios que recibe un socio Plus: 15 por mes (recurrente).
// Al alta se acredita el primer mes; la reposición mensual todavía no está
// mecanizada (falta el job/top-up recurrente) — ver brief de planes.
const CREDITOS_PLUS_MENSUALES = 15;

// Tope de fotos en la galería del perfil, según plan.
export const FOTOS_GALERIA_MAX = { free: 4, plus: 20 };

// ─── Los tres tramos PRO — el modelo vigente ──────────────────
// Un solo plan con tres compromisos (1, 6, 12 meses). El precio por mes baja
// con el plazo y el total se paga por adelantado, así que lo que se muestra
// son las dos cifras: precioMes para comparar y total para saber qué se paga.
// `destacado` marca el "más elegido" — la base garantiza que haya uno solo.
export async function getPlanesPro() {
  const { data } = await supabase
    .from('planes')
    .select('*')
    .eq('activo', true)
    .order('meses_contrato', { ascending: true });

  return (data || []).map(p => ({
    id:            p.codigo,
    planId:        p.id,
    nombre:        p.nombre,
    descripcion:   p.descripcion || '',
    precioMes:     Number(p.precio_mes) || 0,
    meses:         p.meses_contrato || 1,
    total:         (Number(p.precio_mes) || 0) * (p.meses_contrato || 1),
    creditosMes:   p.creditos_incluidos || 0,
    creditosBono:  p.creditos_bono || 0,
    destacado:     !!p.destacado,
    beneficios:    Array.isArray(p.beneficios) ? p.beneficios : [],
  }));
}

// ─── LEGACY — copy/precios del modelo Freemium/Plus ───────────
// Sólo la consumen las pantallas de alta viejas (SociosView, PlanPicker y el
// onboarding comercial de LoginView). Sigue leyendo las filas 'gratis'/'plus',
// que quedaron en la tabla con activo=false para no romper las suscripciones
// que las referencian. Se va junto con esas pantallas.
export async function getPlanesConfig() {
  const { data } = await supabase
    .from('planes')
    .select('*')
    .in('codigo', ['gratis', 'plus'])
    .order('codigo', { ascending: true });
  const filas = data || [];
  // 'gratis' antes que 'plus' en el orden alfabético ya nos sirve, pero lo hacemos explícito
  const orden = { gratis: 0, plus: 1 };
  return filas
    .slice()
    .sort((a, b) => (orden[a.codigo] ?? 9) - (orden[b.codigo] ?? 9))
    .map(p => ({
      id: p.codigo === 'gratis' ? 'free' : p.codigo,
      planId: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      precioMes: p.precio_mes != null ? Number(p.precio_mes) : null,
      mesesContrato: p.meses_contrato,
      mesesGratisBono: p.meses_gratis_bono,
      beneficios: Array.isArray(p.beneficios) ? p.beneficios : [],
    }));
}

// ─── Edición de copy/precios (Superadmin) ─────────────────────
export async function actualizarPlanCopy(planId, campos) {
  const { error } = await supabase.from('planes').update(campos).eq('id', planId);
  return { error };
}

const ALIAS_INVALIDOS = new Set(['000000', '111111', '222222', '333333', '444444', '555555', '666666', '777777', '888888', '999999', '123456', '654321']);

function esAliasValido(codigo) {
  if (ALIAS_INVALIDOS.has(codigo)) return false;
  const digitos = codigo.split('').map(Number);
  const ascendente  = digitos.every((d, i) => i === 0 || d === digitos[i - 1] + 1);
  const descendente = digitos.every((d, i) => i === 0 || d === digitos[i - 1] - 1);
  return !ascendente && !descendente;
}

function generarCodigoCandidato() {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
}

// ─── Generar alias único de 6 dígitos para un socio Plus ─────
export async function generarAliasUnico(negocioId, unidadesDeclaradas = 0) {
  let codigo;
  for (let libre = false; !libre; ) {
    codigo = generarCodigoCandidato();
    if (!esAliasValido(codigo)) continue;
    const { data } = await supabase.from('socio_alias').select('id').eq('codigo', codigo).maybeSingle();
    libre = !data;
  }

  const { data, error } = await supabase
    .from('socio_alias')
    .insert({ negocio_id: negocioId, codigo, unidades_declaradas: unidadesDeclaradas })
    .select()
    .single();
  return { data, error };
}

// ─── Registrar intención de pago con tarjeta (alta de Plus) ───
// Nunca recibe ni guarda el número completo de tarjeta ni el CVV — solo
// titular, últimos 4 dígitos y vencimiento, a modo de referencia. No hay
// gateway real conectado todavía: se confirma al instante, igual que
// confirmarCompra() en cobros.js hace hoy con forma_pago 'tarjeta'/'mercadopago'.
// Para transferencia, el negocio queda operativo pero sin poder compartir
// cuponeras hasta que el comprobante se apruebe manualmente (ver Superadmin).
export async function registrarIntentoPagoTarjeta(negocioId, { titular, ultimos4, vencimiento, unidadesDeclaradas = 0, formaPago = 'tarjeta', comprobanteUrl = null }) {
  const { error } = await supabase.from('intentos_pago_tarjeta').insert({
    negocio_id: negocioId, titular, ultimos_4: ultimos4, vencimiento, estado: 'confirmado',
    forma_pago: formaPago, comprobante_url: comprobanteUrl,
  });
  if (error) return { error };
  if (formaPago === 'transferencia') {
    await supabase.from('negocios').update({ puede_compartir_cuponeras: false }).eq('id', negocioId);
  }
  return crearSuscripcionPlus(negocioId, { unidadesDeclaradas });
}

// ─── Alta de suscripción de pago para un negocio ──────────────
// `codigoPlan` es el tramo elegido: 'pro_1' | 'pro_6' | 'pro_12' (o el viejo
// 'plus', que sigue funcionando para las pantallas que todavía lo usan).
//
// `negocios.plan` queda en 'plus' para CUALQUIER tramo pagado. Esa columna es
// el flag denormalizado que consultan media docena de componentes para saber
// si el socio paga o no; el tramo concreto vive en `suscripciones_socio`. Si
// se le metieran los tres códigos habría que tocar todos esos gates para
// ganar nada — la pregunta que se hacen es "¿paga?", no "¿cuánto se comprometió?".
export async function crearSuscripcionPro(negocioId, { codigoPlan = 'pro_12', unidadesDeclaradas = 0 } = {}) {
  const { data: plan } = await supabase
    .from('planes')
    .select('id, creditos_incluidos, creditos_bono')
    .eq('codigo', codigoPlan)
    .single();
  if (!plan) return { error: `Plan ${codigoPlan} no encontrado` };

  const ahora = new Date().toISOString();

  await supabase.from('suscripciones_socio').upsert({
    negocio_id: negocioId,
    plan_id: plan.id,
    estado: 'activa',
    fecha_inicio: ahora,
  }, { onConflict: 'negocio_id' });

  await supabase.from('negocios').update({ plan: 'plus', fecha_alta_plus: ahora }).eq('id', negocioId);

  // El alias sólo existe si el negocio ya pagó antes → sirve de proxy de "alta
  // nueva": generamos alias y acreditamos el primer mes más el bono del tramo.
  const { data: aliasExistente } = await supabase.from('socio_alias').select('id').eq('negocio_id', negocioId).maybeSingle();
  if (!aliasExistente) {
    await generarAliasUnico(negocioId, unidadesDeclaradas);
    const creditos = (plan.creditos_incluidos ?? CREDITOS_PLUS_MENSUALES) + (plan.creditos_bono || 0);
    await acreditarTokens(negocioId, creditos);
  }

  return { error: null };
}

// Alias del modelo viejo, para las pantallas que todavía no migraron.
export async function crearSuscripcionPlus(negocioId, opts = {}) {
  return crearSuscripcionPro(negocioId, { ...opts, codigoPlan: 'plus' });
}

// ─── Leer el plan vigente de un negocio ───────────────────────
export async function getPlanActual(negocioId) {
  const { data } = await supabase
    .from('suscripciones_socio')
    .select('*, planes(codigo, nombre)')
    .eq('negocio_id', negocioId)
    .single();
  return data;
}
