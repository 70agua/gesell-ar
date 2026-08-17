// ============================================================
//  src/lib/pases.js
//  Pase — logica de negocio (Brief 1). Antes se lo llamaba 'Cuponera Gesell'.
//
//  Naming genérico: el producto es un `pase` multi-destino. El
//  destino ('gesell') es SIEMPRE un parámetro de dato, nunca se
//  hardcodea la lógica a un destino puntual.
//
//  Capas (derivadas en vivo del ahorro declarado — no hay columna
//  de "tramo", la comisión se calcula en cobros.js):
//    · base    = comisión 25% / 20%  → ahorro declarado <= $40.000
//    · premium = comisión 15/10/7    → ahorro declarado >  $40.000
//  Ambas: Salidas + Aventura & Relax, uso libre durante los N días.
//
//  Aparte va el DESCUENTO DE ESTADÍA (alojamiento): un uso por pase, y
//  utilizable con el pase todavía sin activar, para que el turista reserve
//  con descuento antes de viajar sin quemar los días. Los pases-regalo de
//  hotelero no lo incluyen.
//
//  Pagos: MOCK (mismo patrón que el resto de la app). Las refs de
//  MercadoPago se guardan como texto libre; no hay webhook real.
// ============================================================

import { supabase } from './supabase';
import { normalizePromo } from './datos';
import { acreditarPuntos } from './gamificacion';
import { AHORRO_BASE_MAX } from './cobros';

// ─── Parámetros de negocio ────────────────────────────────────
export const DESTINO_DEFAULT       = 'gesell';
// La frontera base/premium se mudó a cobros.js (2026-08-13): desde que el
// precio del cupón depende de ella —20% de comisión abajo, 15% arriba— es
// también una constante de precio, y cobros.js es el módulo que nadie del
// dominio importa, así que puede ser el dueño sin armar un ciclo. Se re-exporta
// con el mismo nombre para que los ocho lugares que ya la usan no cambien: es
// una sola definición, no un alias.
// Se importa además de re-exportarse: un `export ... from` no trae el nombre al
// scope del módulo, y acá adentro lo usan esBase/esPremium y el conteo.
export { AHORRO_BASE_MAX };
// El tope de pases regalo dejó de ser una constante de código y un atributo
// del plan: es GLOBAL y vive en `configuracion.pases_regalo_tope_mensual`
// (arranca en 150/mes), para poder calibrarlo en temporada sin deploy.
export const UPGRADE_PACK_MIN      = 10;      // compra mayorista mínima
export const UPGRADE_PACK_PRECIO   = 6000;    // $ por upgrade (50% de $12.000)
export const VENTANA_ACTIVACION_MESES = 12;   // tope para activar un pase comprado

// Puntos bajo pase (no aplica la tabla por tramo). Solo el pagador gana.
export const PUNTOS_PASE = { compra: 500, upgrade: 300, canje: 100 };

const TIPOS_ALOJAMIENTO = new Set([
  'alojamiento', 'Hotel', 'Cabaña', 'Departamento',
  'Domo', 'Dormi', 'Carpa', 'Casa', 'Hostel', 'Glamping',
]);

const esAlojamiento = (promo) => TIPOS_ALOJAMIENTO.has(promo.negocioTipo || '');

// El pase tiene DOS mitades, con relojes distintos:
//   · estadía  = alojamiento. UN uso por pase, y se puede usar con el pase
//                todavía sin activar → el turista reserva con descuento
//                meses antes sin quemar los días.
//   · libres   = Salidas + Aventura & Relax. Uso libre (1 por comercio)
//                durante los N días, desde que activa el pase.
export const esOfertaEstadia = (promo) => esAlojamiento(promo);
export const esOfertaLibre   = (promo) => !esAlojamiento(promo);

// Todo el catálogo entra al pase. Único lugar donde vive la regla — la
// consume también usePaseStats para el catálogo vivo del hero.
export const esCategoriaPase = () => true;

const esBase        = (promo) => (promo.ahorroEstimado || 0) <= AHORRO_BASE_MAX;
const esPremium     = (promo) => (promo.ahorroEstimado || 0) >  AHORRO_BASE_MAX;

// `incluidaEnPase()` se eliminó (Fase 6): devolvía exactamente
// `nivelEnPase(promo) === 'incluida'`, que es la función que ya consumen
// OfertaCard y CtaPase. Dos nombres para la misma regla es justo cómo se
// desincroniza una regla.

// ─── Qué le pasa a una oferta cuando tenés pase ───────────────
// DOS situaciones, y sólo dos. Es la regla que tiene que contar TODA la
// comunicación del sitio, así que vive acá y nadie la reescribe por su cuenta:
//
//   'incluida' → ahorro <= $40.000. Entra siempre, uso libre (1 por comercio).
//   'premium'  → ahorro > $40.000. Entran ELECCIONES_PREMIUM por pase; a partir
//                de la siguiente, se compra suelta pero a mitad de precio.
//
// El alojamiento NO tiene régimen propio: como casi siempre ahorra más de
// $40.000, cae en premium y consume una elección. Eso hace innecesario un cupo
// aparte de "N alojamientos por pase" — el turista reparte sus 3 como quiera.
// Lo único que el alojamiento conserva es su reloj: se puede usar con el pase
// todavía sin activar (ver esOfertaEstadia), porque se reserva antes de viajar.
// Las elecciones escalan con la duración: UNA POR DÍA de pase. No es capricho,
// es lo único que evita el arbitraje — con un número fijo, dos pases de 3 días
// ($40.000) daban el doble de premium que uno de 7 ($35.000) y nadie compraría
// el largo. Atado a los días, el pase más largo siempre rinde mejor por premium.
export const eleccionesPremium = (dias) => Math.max(1, Number(dias) || 0);

// A partir de esta duración, el pase deja de tener tope de premium: entra TODO
// el catálogo, sin elección. Por debajo, una por día sigue siendo lo que evita
// el arbitraje de arriba; por encima, seguir contando "una por día" sería
// aritmética sin sentido — nadie necesita 30 elecciones si el catálogo entero
// tiene 33. Se frena directamente en "sin límite".
//
// Se congela en `usuario_pases.premium_ilimitado` al momento de la compra
// (ver vincularComprasPase) y las RPCs `elegir_premium_pase` /
// `enviar_solicitud_fecha` lo leen desde ahí — NO recalculan esto por su
// cuenta, para que un pase ya vendido no cambie de régimen si este número se
// mueve más adelante.
export const DIAS_PREMIUM_ILIMITADO = 10;
export const esPremiumIlimitado = (dias) => Number(dias) >= DIAS_PREMIUM_ILIMITADO;

export const DESCUENTO_SUELTO_CON_PASE = 0.5;

export function nivelEnPase(promo) {
  return esPremium(promo) ? 'premium' : 'incluida';
}

// Lo que sale la oferta suelta teniendo el pase: la mitad. Sin pase paga el
// precio de lista, que es el que calcula cobros.js.
export const precioSueltoConPase = (precioLista) =>
  Math.round((Number(precioLista) || 0) * DESCUENTO_SUELTO_CON_PASE);

// ═══════════════════════════════════════════════════════════
//  Catálogo del pase
// ═══════════════════════════════════════════════════════════
// Todos los pases vigentes de un destino, del más corto al más largo. Hoy son
// dos duraciones (3 y 7 días); el hero y el checkout leen los precios de acá,
// así no quedan hardcodeados en la UI.
export async function getPasesDestino(destino = DESTINO_DEFAULT) {
  const { data } = await supabase
    .from('pases')
    .select('*')
    .eq('destino_slug', destino)
    .eq('activo', true)
    .order('duracion_dias', { ascending: true });
  return data || [];
}

// Un pase puntual. Sin `dias` devuelve el más largo, que es el histórico.
export async function getPaseDestino(destino = DESTINO_DEFAULT, dias = null) {
  const pases = await getPasesDestino(destino);
  if (!pases.length) return null;
  if (dias == null) return pases[pases.length - 1];
  return pases.find(p => p.duracion_dias === dias) || null;
}

// ═══════════════════════════════════════════════════════════
//  Compra sin cuenta (MOCK de pago)
//  El turista paga dejando mail y teléfono; el alta como turista viene
//  después. La compra queda en `pase_compras` hasta que se registre.
// ═══════════════════════════════════════════════════════════
export async function comprarPaseAnonimo({ paseId, precio, email, telefono = null, nombre = null, apellido = null, dias = null, pagoRef = null }) {
  if (!paseId || !email) return { ok: false, error: 'datos_incompletos' };
  const { data, error } = await supabase
    .from('pase_compras')
    .insert({
      pase_id:  paseId,
      email:    email.trim().toLowerCase(),
      telefono: telefono?.trim() || null,
      // Los días REALES comprados. El pase a medida se registra contra la fila
      // del de 7 días, así que sin esto perdería su duración y sus elecciones.
      dias:     dias ? Number(dias) : null,
      // Solo vienen cuando el comprador todavía no tiene cuenta; el que ya la
      // tiene los trae en su perfil.
      nombre:   nombre?.trim() || null,
      apellido: apellido?.trim() || null,
      precio,
      // Sin pasarela real: la referencia es un mock, igual que el resto de la app.
      pago_ref: pagoRef || `mock-${Date.now()}`,
      estado:   'pagado',
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, compra: data };
}

// Al terminar el registro, las compras hechas con ese mail se convierten en
// pases del usuario. Es idempotente: una compra ya vinculada no se toca.
export async function vincularComprasPase(userId, email) {
  if (!userId || !email) return { ok: false, vinculadas: 0 };

  const { data: compras } = await supabase
    .from('pase_compras')
    .select('*')
    .eq('estado', 'pagado')
    .is('user_id', null)
    .ilike('email', email.trim());

  if (!compras?.length) return { ok: true, vinculadas: 0 };

  let vinculadas = 0;
  for (const compra of compras) {
    const { data: up, error } = await supabase
      .from('usuario_pases')
      .insert({
        pase_id:       compra.pase_id,
        user_id:       userId,
        tipo:          'comprado',
        estado:        'pendiente',
        pago_ref_pase: compra.pago_ref,
        // Días comprados y su cupo premium (uno por día). En null cuando la
        // compra no los trae: ahí mandan los del catálogo.
        dias:               compra.dias || null,
        elecciones_premium: compra.dias ? eleccionesPremium(compra.dias) : null,
        // Congelado acá y no recalculado después: si el pase se activa meses
        // después de comprado y este umbral cambió mientras tanto, el turista
        // se queda con lo que compró, no con la regla del día de hoy.
        premium_ilimitado:  compra.dias ? esPremiumIlimitado(compra.dias) : false,
      })
      .select()
      .single();
    if (error) continue;

    await supabase
      .from('pase_compras')
      .update({ estado: 'vinculada', user_id: userId, vinculada_en: new Date().toISOString() })
      .eq('id', compra.id);

    await acreditarPuntos(userId, PUNTOS_PASE.compra, 'pase_compra', 'Compra del Pase', up.id);
    vinculadas += 1;
  }
  return { ok: true, vinculadas };
}

// ═══════════════════════════════════════════════════════════
//  Capa base — query dinámica en vivo (refleja altas/bajas al toque)
// ═══════════════════════════════════════════════════════════
export async function getOfertasBase() {
  const { data } = await supabase
    .from('promociones')
    .select('*, negocios(nombre, tipo, categoria, localidad, zona, foto_perfil, imagen_url, activo)')
    .eq('activa', true)
    .eq('aprobada', true)
    .order('creado_en', { ascending: false });

  return (data || [])
    .filter(p => p.negocios?.activo !== false)
    .map(normalizePromo)
    .filter(p => !esAlojamiento(p) && esBase(p));
}

// Cuántos descuentos hay hoy en el catálogo del pase, abiertos en sus dos
// capas. NO depende de la duración: lo incluido entra entero en cualquier
// pase, sin cupo ni elecciones — lo que crece con los días son los premium.
//
// Cuenta OFERTAS, no comercios, y NO deja afuera al alojamiento: la frontera
// es exactamente la de nivelEnPase (ahorro <= AHORRO_BASE_MAX → incluida, por
// encima → premium), sea del rubro que sea. Como esCategoriaPase() es true para
// todo, `total` es el catálogo entero: es el número que puede prometer la home.
//
// Vive del lado del server y sin `limit`: cualquier conteo que traiga N filas y
// las cuente en el cliente miente apenas el catálogo pasa de N.
//
// Se descuentan dos cosas que la tabla igual marca como activas:
//   · Flash vencidas — siguen `activa` hasta que alguien las apague, pero ya
//     no se pueden usar. Mismo criterio que getPromos.
//   · Ofertas de regalo (tokens_costo = 0) — son otro producto y están
//     ocultas de todos los listados regulares. Contarlas haría que el botón
//     de la home prometa más cupones de los que después muestra el listado.
//
// Es un número de catálogo — cuántos cupones tenés disponibles —, no de canjes:
// el tope de uso (1 por comercio, 1 estadía por pase) es otra regla y va aparte.
// Devuelve ceros ante error o catálogo vacío; la UI oculta la línea, no inventa.
export async function contarDescuentosDelPase() {
  const { data, error } = await supabase
    .from('promociones')
    .select('id, ahorro_estimado, tokens_costo, offer_type, fecha_fin_flash, negocios(activo)')
    .eq('activa', true)
    .eq('aprobada', true);

  if (error) return { incluidas: 0, plus: 0, total: 0 };

  const ahora = Date.now();
  const vigentes = (data || []).filter(p =>
    p.negocios?.activo !== false &&
    p.tokens_costo !== 0 &&
    (p.offer_type !== 'Flash' || (p.fecha_fin_flash && new Date(p.fecha_fin_flash).getTime() > ahora))
  );

  const incluidas = vigentes.filter(p => (p.ahorro_estimado || 0) <= AHORRO_BASE_MAX).length;
  return { incluidas, plus: vigentes.length - incluidas, total: vigentes.length };
}

// Atajo para la capa incluida sola, que es lo que muestra el checkout al pie
// de cada pase. Una sola consulta y una sola regla, compartidas con el total.
export async function contarIncluidasEnPase() {
  const { incluidas } = await contarDescuentosDelPase();
  return incluidas;
}

// ═══════════════════════════════════════════════════════════
//  Capa premium — mismas categorías, tramos 15/10/7, con cupo
//  mensual disponible por socio (usos del mes vía RPC agregada).
// ═══════════════════════════════════════════════════════════
export async function getOfertasPremium({ soloConCupo = true } = {}) {
  const [{ data: promos }, { data: usos }] = await Promise.all([
    supabase
      .from('promociones')
      .select('*, negocios(nombre, tipo, categoria, localidad, zona, foto_perfil, imagen_url, activo)')
      .eq('activa', true)
      .eq('aprobada', true)
      .order('creado_en', { ascending: false }),
    supabase.rpc('pase_premium_usos_mes'),
  ]);

  const usadosPorPromo = new Map((usos || []).map(u => [u.promocion_id, Number(u.usados) || 0]));

  return (promos || [])
    .filter(p => p.negocios?.activo !== false)
    .map(p => {
      const norm  = normalizePromo(p);
      const ilimitado = p.premium_ilimitado === true;
      const cupo  = p.cupo_mensual_premium;
      const usados = usadosPorPromo.get(p.id) || 0;
      return {
        ...norm,
        premiumIlimitado: ilimitado,
        // Las que necesitan confirmación de fecha se PIDEN, no se eligen.
        requiereFecha: p.requiere_fecha === true,
        cupoMensualPremium: cupo,
        // `null` en cupoRestante significa "sin tope", no "sin datos".
        cupoRestante: ilimitado ? null : (cupo != null ? Math.max(0, cupo - usados) : 0),
      };
    })
    .filter(p => !esAlojamiento(p) && esPremium(p))
    // El socio eligió participar: o puso un cupo, o dijo ilimitado.
    .filter(p => p.premiumIlimitado || (p.cupoMensualPremium || 0) > 0)
    .filter(p => !soloConCupo || p.premiumIlimitado || (p.cupoRestante || 0) > 0);
}

// ═══════════════════════════════════════════════════════════
//  Descuento de estadía — el alojamiento del pase.
//  Sin capas base/premium: cualquier oferta de alojamiento vigente,
//  una sola vez por pase.
// ═══════════════════════════════════════════════════════════
export async function getOfertasEstadia() {
  const { data } = await supabase
    .from('promociones')
    .select('*, negocios(nombre, tipo, categoria, localidad, zona, foto_perfil, imagen_url, activo)')
    .eq('activa', true)
    .eq('aprobada', true)
    .order('creado_en', { ascending: false });

  return (data || [])
    .filter(p => p.negocios?.activo !== false)
    .map(normalizePromo)
    .filter(esOfertaEstadia);
}

// Estado del descuento de estadía de un pase, para la UI.
//   disponible → se puede usar ahora (incluso con el pase sin activar)
export function estadoEstadia(usuarioPase) {
  if (!usuarioPase)                     return { disponible: false, motivo: 'sin_pase' };
  if (!usuarioPase.incluye_estadia)     return { disponible: false, motivo: 'no_incluida' };
  if (usuarioPase.estadia_usada_el)     return { disponible: false, motivo: 'ya_usada', usadaEl: usuarioPase.estadia_usada_el };
  if (usuarioPase.estado === 'vencido') return { disponible: false, motivo: 'pase_vencido' };
  return { disponible: true, motivo: null };
}

// ═══════════════════════════════════════════════════════════
//  Pases del usuario
// ═══════════════════════════════════════════════════════════
export async function getMisPases(userId) {
  if (!userId) return [];
  const { data } = await supabase
    .from('usuario_pases')
    .select('*, pases(*)')
    .eq('user_id', userId)
    .order('creado_en', { ascending: false });
  return data || [];
}

// ═══════════════════════════════════════════════════════════
//  Compra B2C (MOCK) → pase 'pendiente' + 500 puntos al pagador
// ═══════════════════════════════════════════════════════════
export async function comprarPase({ userId, destino = DESTINO_DEFAULT, pagoRef = null }) {
  if (!userId) return { ok: false, error: 'no_auth' };
  const pase = await getPaseDestino(destino);
  if (!pase) return { ok: false, error: 'pase_inexistente' };

  const { data, error } = await supabase
    .from('usuario_pases')
    .insert({
      pase_id:       pase.id,
      user_id:       userId,
      tipo:          'comprado',
      estado:        'pendiente',
      pago_ref_pase: pagoRef,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };

  await acreditarPuntos(userId, PUNTOS_PASE.compra, 'pase_compra', 'Compra del Pase', data.id);
  return { ok: true, usuarioPase: data };
}

// ═══════════════════════════════════════════════════════════
//  Activación de un pase comprado (1 tap)
//  Valida la ventana de 12 meses; si expiró → vencido + devolución.
// ═══════════════════════════════════════════════════════════
export async function activarPase(usuarioPaseId) {
  const { data: up, error } = await supabase
    .from('usuario_pases')
    .select('*, pases(*)')
    .eq('id', usuarioPaseId)
    .single();
  if (error || !up) return { ok: false, error: 'pase_no_encontrado' };
  if (up.estado === 'activo') return { ok: true, usuarioPase: up };
  if (up.estado !== 'pendiente') return { ok: false, error: 'estado_invalido' };

  const compra = new Date(up.fecha_compra).getTime();
  const limite = compra + VENTANA_ACTIVACION_MESES * 30 * 24 * 3600 * 1000;
  if (Date.now() > limite) {
    await supabase.from('usuario_pases').update({ estado: 'vencido' }).eq('id', usuarioPaseId);
    // Devolución automática del precio en puntos (solo pases comprados)
    if (up.tipo === 'comprado' && up.pases?.precio_final) {
      await acreditarPuntos(up.user_id, Math.round(up.pases.precio_final),
        'pase_devolucion', 'Devolución de Pase no activado', usuarioPaseId);
    }
    return { ok: false, error: 'ventana_vencida' };
  }

  // Los días de la instancia mandan sobre los del catálogo: el pase a medida
  // se apoya en la fila del de 7 días pero puede durar hasta 30.
  const dias   = up.dias || up.pases?.duracion_dias || 7;
  const venceEl = new Date(Date.now() + dias * 24 * 3600 * 1000).toISOString();
  const { data, error: e2 } = await supabase
    .from('usuario_pases')
    .update({ estado: 'activo', fecha_activacion: new Date().toISOString(), vence_el: venceEl })
    .eq('id', usuarioPaseId)
    .select('*, pases(*)')
    .single();
  if (e2) return { ok: false, error: e2.message };
  return { ok: true, usuarioPase: data };
}

// ═══════════════════════════════════════════════════════════
//  Upgrade B2C (MOCK): solo sobre pase 'regalo' activo sin upgrade.
//  +300 puntos al pagador (turista). Habilita las 2 elecciones.
// ═══════════════════════════════════════════════════════════
export async function upgradePaseB2C({ usuarioPaseId, userId, pagoRef = null }) {
  const { data: up } = await supabase
    .from('usuario_pases').select('*').eq('id', usuarioPaseId).single();
  if (!up) return { ok: false, error: 'pase_no_encontrado' };
  if (up.tipo !== 'regalo')       return { ok: false, error: 'no_es_regalo' };
  if (up.upgrade_aplicado)        return { ok: false, error: 'ya_upgradeado' };
  if (up.estado !== 'activo')     return { ok: false, error: 'pase_no_activo' };

  const { error } = await supabase
    .from('usuario_pases')
    .update({ upgrade_aplicado: true, pago_ref_upgrade: pagoRef })
    .eq('id', usuarioPaseId);
  if (error) return { ok: false, error: error.message };

  await acreditarPuntos(userId, PUNTOS_PASE.upgrade, 'pase_upgrade', 'Upgrade del Pase', usuarioPaseId);
  return { ok: true };
}

// ═══════════════════════════════════════════════════════════
//  Activación de pase-regalo (turista abre link/QR del hotel).
//  Vía RPC: valida cupo mensual Free (10) atómicamente. Sin puntos.
// ═══════════════════════════════════════════════════════════
// El turista valida el código ANTES de registrarse: si no sirve, no tiene
// sentido pedirle una cuenta. Va por RPC porque socio_alias está cerrada por
// RLS — ver db/20260728_validar_alias_regalo.sql.
// Devuelve { ok, negocio_id, negocio_nombre } | { ok:false, error }
// con error en 'formato' | 'inexistente' | 'negocio_inactivo' | 'cupo_agotado'.
export async function validarAliasRegalo(codigo) {
  const { data, error } = await supabase.rpc('validar_alias_regalo', {
    p_codigo: String(codigo || ''),
  });
  if (error) return { ok: false, error: 'rpc' };
  return data;
}

export async function activarRegalo({ destino = DESTINO_DEFAULT, origenNegocioId }) {
  const { data, error } = await supabase.rpc('activar_regalo_pase', {
    p_destino: destino,
    p_origen_negocio: origenNegocioId,
  });
  if (error) return { ok: false, error: error.message };
  return data; // { ok, usuario_pase_id } | { ok:false, error }
}

// ═══════════════════════════════════════════════════════════
//  Elección premium (máx = pase.elecciones_premium). Vía RPC
//  SECURITY DEFINER: valida régimen, tope, elegibilidad y cupo.
// ═══════════════════════════════════════════════════════════
export async function elegirPremium(usuarioPaseId, promocionId) {
  const { data, error } = await supabase.rpc('elegir_premium_pase', {
    p_usuario_pase: usuarioPaseId,
    p_promocion:    promocionId,
  });
  if (error) return { ok: false, error: error.message };
  return data; // { ok } | { ok:false, error }
}

// §4.3: los slots se OCUPAN, no se consumen. Soltar una elección devuelve el
// slot, siempre que todavía no se haya canjeado — ahí sí queda congelado.
export async function quitarPremium(usuarioPaseId, promocionId) {
  const { data, error } = await supabase.rpc('quitar_premium_pase', {
    p_usuario_pase_id: usuarioPaseId, p_promocion_id: promocionId,
  });
  if (error) return { ok: false, error: error.message };
  if (!data?.ok) return { ok: false, error: data?.error };
  return { ok: true };
}

// ─── Activación ───────────────────────────────────────────────
// Server-side: la activación define la vigencia, así que no puede depender
// del reloj del cliente.
export async function activarPaseAhora(usuarioPaseId) {
  const { data, error } = await supabase.rpc('activar_pase', { p_usuario_pase_id: usuarioPaseId });
  if (error) return { ok: false, error: error.message };
  if (!data?.ok) return { ok: false, error: data?.error };
  return { ok: true, dias: data.dias, venceEl: data.vence_el, yaEstaba: !!data.ya_estaba };
}

// Programar el arranque. `fecha` null desprograma.
// Es lo que le permite al turista comprar, pedir fechas (Fase 5b) y recién
// arrancar el día que viaja, sin quemar días esperando respuestas.
export async function programarActivacion(usuarioPaseId, fecha) {
  const { data, error } = await supabase.rpc('programar_activacion_pase', {
    p_usuario_pase_id: usuarioPaseId, p_fecha: fecha || null,
  });
  if (error) return { ok: false, error: error.message };
  if (!data?.ok) return { ok: false, error: data?.error, limite: data?.limite };
  return { ok: true, fecha: data.fecha };
}

export async function getElecciones(usuarioPaseId) {
  const { data } = await supabase
    .from('pase_elecciones')
    .select('*, promociones(*, negocios(nombre, tipo, localidad, foto_perfil, imagen_url, activo))')
    .eq('usuario_pase_id', usuarioPaseId);
  return (data || []).map(e => ({
    ...e,
    promo: e.promociones ? normalizePromo(e.promociones) : null,
  }));
}

// ═══════════════════════════════════════════════════════════
//  Canje — DELEGADO al mecanismo único (Fase 5).
//
//  Acá vivían `canjearPase()` y `canjearEstadia()`, que escribían
//  `pase_canjes` y sólo se alcanzaban desde PaseDebugView. Eran el segundo
//  camino de canje, en paralelo al del cupón comprado.
//
//  Ahora los dos pasan por la RPC `canjear_beneficio`, que valida del lado
//  del servidor (elegibilidad base/premium, 1 canje por comercio, estadía
//  una sola vez), escribe el libro único `canjes` y acredita los puntos.
//  Estas funciones quedan como envoltorio para lo que todavía las llama.
//
//  La promoción alcanza para resolver todo: la RPC busca sola el pase activo
//  del usuario de la sesión, así que `usuarioPaseId` y `userId` se ignoran.
// ═══════════════════════════════════════════════════════════
export async function canjearPase({ promocionId }) {
  const { data, error } = await supabase.rpc('canjear_beneficio', { p_tipo: 'pase', p_ref: promocionId });
  if (error) return { ok: false, error: error.message };
  if (!data?.ok) return { ok: false, error: data?.error };
  return { ok: true, ahorro: Number(data.ahorro) || 0, comprobante: data.comprobante };
}

// La estadía la resuelve la misma RPC: si la promo es de un alojamiento,
// entra por la rama 'estadia' sola.
export const canjearEstadia = canjearPase;

// Los canjes del Pase viven en `canjes`, el libro ÚNICO que comparten el
// cupón comprado y el Pase (Fase 5). `pase_canjes` quedó obsoleta.
export async function getCanjes(usuarioPaseId) {
  const { data } = await supabase
    .from('canjes')
    .select('*, promociones(titulo), negocios(nombre)')
    .eq('usuario_pase_id', usuarioPaseId)
    .eq('estado', 'confirmado')
    .order('canjeado_el', { ascending: false });
  return data || [];
}

// Contador de ahorro del viaje ("Ahorraste $X este viaje").
export async function getAhorroPase(usuarioPaseId) {
  const { data } = await supabase
    .from('canjes')
    .select('ahorro_monto')
    .eq('usuario_pase_id', usuarioPaseId)
    .eq('estado', 'confirmado');
  return (data || []).reduce((acc, c) => acc + (Number(c.ahorro_monto) || 0), 0);
}

// ═══════════════════════════════════════════════════════════
//  Bloque Pase del panel del socio
//
//  El tope de regalos es GLOBAL (configuracion.pases_regalo_tope_mensual,
//  arranca en 150/mes) y no depende del plan: antes el plan pago daba
//  regalos ilimitados y eso socavaba el precio de las tandas del
//  distribuidor. Por encima del tope, el socio compra tandas.
// ═══════════════════════════════════════════════════════════

// Todo el bloque en una sola llamada: alias, cupo del mes, saldo de packs,
// activaciones y ahorro generado.
export async function getBloquePase(negocioId) {
  if (!negocioId) return null;
  const { data, error } = await supabase.rpc('bloque_pase_socio', { p_negocio_id: negocioId });
  if (error) { console.error('getBloquePase', error); return null; }
  if (!data?.ok) return null;
  return data;
}

// Asignar un upgrade pack a un pase regalo: +1 premium.
//
// Antes esto era un read-then-write desde el cliente que podía gastar dos
// veces el mismo saldo, y el upgrade sólo habilitaba PUNTOS — el hotel pagaba
// $6.000 para que su turista ganara 300. Ahora otorga premium, y el descuento
// del saldo es atómico del lado del servidor.
export async function asignarUpgradePack(usuarioPaseId) {
  const { data, error } = await supabase.rpc('asignar_upgrade_pack', {
    p_usuario_pase_id: usuarioPaseId,
  });
  if (error) return { ok: false, error: error.message };
  if (!data?.ok) return { ok: false, error: data?.error };
  return { ok: true, premiumTotal: data.premium_total };
}

// La compra de packs sigue del lado del cliente porque no hay pasarela real:
// es el mismo mock que el resto de los pagos.
export async function comprarUpgradePack({ negocioId, cantidad, pagoRef = null }) {
  if (!cantidad || cantidad < UPGRADE_PACK_MIN) {
    return { ok: false, error: `minimo_${UPGRADE_PACK_MIN}` };
  }
  const { data: actual } = await supabase
    .from('negocio_upgrade_packs').select('*').eq('negocio_id', negocioId).maybeSingle();

  const { error } = actual
    ? await supabase.from('negocio_upgrade_packs')
        .update({ comprados: (actual.comprados || 0) + cantidad, pago_ref: pagoRef, updated_at: new Date().toISOString() })
        .eq('negocio_id', negocioId)
    : await supabase.from('negocio_upgrade_packs')
        .insert({ negocio_id: negocioId, comprados: cantidad, usados: 0, pago_ref: pagoRef });

  if (error) return { ok: false, error: error.message };
  return { ok: true, cantidad, total: cantidad * UPGRADE_PACK_PRECIO };
}

