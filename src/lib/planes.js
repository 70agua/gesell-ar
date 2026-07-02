// ============================================================
//  src/lib/planes.js
//  Fuente única de verdad para el modelo de planes Gratis/Plus.
//  Reemplaza las copias duplicadas que existían en SociosView.jsx
//  y LoginView.jsx (incluyendo el plan Black, ya eliminado).
// ============================================================

import { supabase } from './supabase';

// ─── Copy/precios de los planes — editable desde Superadmin → Ajustes → Planes ─
export async function getPlanesConfig() {
  const { data } = await supabase.from('planes').select('*').order('codigo', { ascending: true });
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
export async function registrarIntentoPagoTarjeta(negocioId, { titular, ultimos4, vencimiento, unidadesDeclaradas = 0 }) {
  const { error } = await supabase.from('intentos_pago_tarjeta').insert({
    negocio_id: negocioId, titular, ultimos_4: ultimos4, vencimiento, estado: 'confirmado',
  });
  if (error) return { error };
  return crearSuscripcionPlus(negocioId, { unidadesDeclaradas });
}

// ─── Alta de suscripción Plus para un negocio ─────────────────
export async function crearSuscripcionPlus(negocioId, { unidadesDeclaradas = 0 } = {}) {
  const { data: planPlus } = await supabase.from('planes').select('id').eq('codigo', 'plus').single();
  if (!planPlus) return { error: 'Plan Plus no encontrado' };

  const ahora = new Date().toISOString();

  await supabase.from('suscripciones_socio').upsert({
    negocio_id: negocioId,
    plan_id: planPlus.id,
    estado: 'activa',
    fecha_inicio: ahora,
  }, { onConflict: 'negocio_id' });

  await supabase.from('negocios').update({ plan: 'plus', fecha_alta_plus: ahora }).eq('id', negocioId);

  const { data: aliasExistente } = await supabase.from('socio_alias').select('id').eq('negocio_id', negocioId).maybeSingle();
  if (!aliasExistente) {
    await generarAliasUnico(negocioId, unidadesDeclaradas);
  }

  return { error: null };
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
