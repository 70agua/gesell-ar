// ============================================================
//  src/lib/grupos.js
//  Cupones grupales "Más ahorro viajando en grupo" (Modelo A).
//  Toda la matemática y las validaciones de tramos viven acá:
//  los componentes solo pintan.
// ============================================================
import { useMemo } from 'react';

// Tramos por defecto que se ofrecen al socio al activar el modo grupal.
// (Coinciden con el ejemplo del brief.)
export const DEFAULT_TIERS = [
  { min_pax: 2,  max_pax: 3,  discount_pct: 10 },
  { min_pax: 4,  max_pax: 6,  discount_pct: 15 },
  { min_pax: 7,  max_pax: 9,  discount_pct: 25 },
  { min_pax: 10, max_pax: 12, discount_pct: 35 },
];

// ─── Normalización ────────────────────────────────────────────
// Devuelve la config grupal de una promo (acepta la fila cruda de
// Supabase o el objeto ya normalizado camelCase).
export function grupoConfig(p) {
  if (!p) return null;
  const esGrupal = p.esGrupal ?? p.is_group ?? false;
  if (!esGrupal) return null;
  return {
    esGrupal:   true,
    minPax:     Number(p.grupoMinPax ?? p.group_min_pax ?? 0) || 0,
    maxPax:     Number(p.grupoMaxPax ?? p.group_max_pax ?? 0) || 0,
    basePricePp: Number(p.basePricePp ?? p.base_price_pp ?? 0) || 0,
    tramos:     Array.isArray(p.grupoTramos ?? p.group_tiers) ? (p.grupoTramos ?? p.group_tiers) : [],
  };
}

// ─── Resolución de tramo ──────────────────────────────────────
export function resolveTier(tramos, n) {
  if (!Array.isArray(tramos)) return null;
  return tramos.find(t => n >= t.min_pax && n <= t.max_pax) || null;
}

// El siguiente tramo con mayor descuento (para el microcopy "Sumá X más…").
export function siguienteTramo(tramos, n) {
  if (!Array.isArray(tramos)) return null;
  const actual = resolveTier(tramos, n);
  const pctActual = actual ? actual.discount_pct : -1;
  return tramos
    .filter(t => t.min_pax > n && t.discount_pct > pctActual)
    .sort((a, b) => a.min_pax - b.min_pax)[0] || null;
}

// ─── Cálculo de precio grupal ─────────────────────────────────
// Dado la config grupal + N beneficiarios → { tier, discountPct, pricePp, total }.
export function calcularPrecioGrupal(config, n) {
  const cfg = config?.esGrupal ? config : grupoConfig(config);
  const base = Number(cfg?.basePricePp) || 0;
  const N = Math.max(0, Math.floor(Number(n) || 0));
  const tier = resolveTier(cfg?.tramos, N);
  const discountPct = tier ? Number(tier.discount_pct) || 0 : 0;
  const pricePp = Math.round(base * (1 - discountPct / 100));
  // El valor final del cupón grupal se redondea a la centena SIEMPRE hacia
  // abajo (termina en 00), favoreciendo al grupo a medida que crece N.
  const total = Math.floor((pricePp * N) / 100) * 100;
  return { tier, discountPct, pricePp, total, base, n: N };
}

// Hook: memoiza el cálculo. `offer` puede ser la promo cruda o normalizada.
export function useGroupPricing(offer, n) {
  const cfg = useMemo(() => grupoConfig(offer), [offer]);
  return useMemo(() => (cfg ? calcularPrecioGrupal(cfg, n) : null), [cfg, n]);
}

// ─── Validación de tramos (panel del socio) ───────────────────
// Reglas del brief §2:
//  - rangos contiguos y sin solaparse
//  - primer min_pax = minPax; último max_pax = maxPax
//  - discount_pct estrictamente creciente
export function validarTramos({ minPax, maxPax, basePricePp, tramos }) {
  const errores = [];
  const min = Number(minPax), max = Number(maxPax);

  if (!Number.isFinite(min) || min < 2) errores.push('El mínimo de personas debe ser al menos 2.');
  if (!Number.isFinite(max) || max < min) errores.push('El máximo debe ser mayor o igual al mínimo.');
  // Precio por persona: opcional (el socio ya no lo fija). Sólo se valida si vino un valor.
  if (basePricePp != null && basePricePp !== '' && !(Number(basePricePp) > 0))
    errores.push('El precio por persona debe ser mayor a 0.');

  const list = Array.isArray(tramos) ? tramos : [];
  if (list.length === 0) {
    errores.push('Agregá al menos un tramo de descuento.');
    return { ok: false, errores };
  }

  // Normalizamos a números y ordenamos por min_pax para chequear contigüidad.
  const norm = list
    .map(t => ({ min_pax: Number(t.min_pax), max_pax: Number(t.max_pax), discount_pct: Number(t.discount_pct) }))
    .sort((a, b) => a.min_pax - b.min_pax);

  norm.forEach((t, i) => {
    if (!Number.isFinite(t.min_pax) || !Number.isFinite(t.max_pax) || t.min_pax > t.max_pax)
      errores.push(`Tramo ${i + 1}: rango de personas inválido.`);
    if (!Number.isFinite(t.discount_pct) || t.discount_pct < 0 || t.discount_pct > 100)
      errores.push(`Tramo ${i + 1}: el descuento debe estar entre 0 y 100%.`);
  });

  // Contigüidad: el siguiente min_pax = anterior max_pax + 1.
  for (let i = 1; i < norm.length; i++) {
    if (norm[i].min_pax !== norm[i - 1].max_pax + 1)
      errores.push(`Los tramos deben ser contiguos y sin huecos (entre el tramo ${i} y el ${i + 1}).`);
  }

  // Descuento estrictamente creciente.
  for (let i = 1; i < norm.length; i++) {
    if (norm[i].discount_pct <= norm[i - 1].discount_pct)
      errores.push('El descuento debe aumentar en cada tramo.');
  }

  // Bordes contra piso/techo declarados.
  if (Number.isFinite(min) && norm[0].min_pax !== min)
    errores.push(`El primer tramo debe empezar en ${min} personas.`);
  if (Number.isFinite(max) && norm[norm.length - 1].max_pax !== max)
    errores.push(`El último tramo debe terminar en ${max} personas.`);

  return { ok: errores.length === 0, errores: [...new Set(errores)] };
}

// Rango de descuento para el gancho del chip ("hasta 35% off").
export function descuentoMaximo(tramos) {
  const list = Array.isArray(tramos) ? tramos : [];
  return list.reduce((mx, t) => Math.max(mx, Number(t.discount_pct) || 0), 0);
}
