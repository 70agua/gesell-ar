// ============================================================
//  src/components/pase/SelectorDuracion.jsx
//  "ELEGÍ TU PASE" — extraído de CheckoutPaseView (brief checkout
//  2026-08-18, §C/§E). Los pases oficiales compiten de igual a igual en
//  un grid de a dos; el pase a medida bajó de nivel: es un link que
//  expande el stepper, no una tercera tarjeta que ensucia la comparación.
//
//  Jerarquía nueva (§E):
//    · "El más elegido" sale de `pases.destacado` (leído de la base,
//      nunca hardcodeado — ver 20260818_pases_destacado.sql).
//    · precio por día, para que se note que el pase largo conviene.
//    · ahorro estimado por pase (getEstimacionAhorro + ahorroEstimadoPase
//      en lib/pases.js): real, sale del catálogo vivo, no un promedio
//      inventado — es el mejor caso alcanzable con las elecciones que
//      ese pase habilita.
// ============================================================
import { useState } from 'react';
import { Check, Minus, Plus } from 'lucide-react';
import { eleccionesPremium, esPremiumIlimitado, ahorroEstimadoPase } from '../../lib/pases';
import PaSSMark from '../PaSSMark';
import { C, fmt } from './checkoutTokens';

// Tercera opción: pase a medida. Arranca donde termina el de 7 días y se cobra
// proporcional a ese pase (mismo precio por día), sin recargo ni descuento.
export const DIAS_CUSTOM_MIN = 8;
export const DIAS_CUSTOM_MAX = 30;
// El selector arranca posicionado en 10 y no en el mínimo: es la cantidad de
// días que el negocio quiere mostrar primero (aunque el turista pueda igual
// bajarlo a 9 u 8 con el paso a paso). Un default != mínimo es una decisión de
// producto, no un olvido — por eso queda como constante nombrada y no un
// número suelto en el useState.
export const DIAS_CUSTOM_INICIAL = 10;
export const DIAS_BASE_PRORRATEO = 7;

const labelSt = { display: 'block', fontSize: 12.5, fontWeight: 700, color: C.ink2, marginBottom: 6 };

// ─── Botón −/+ del pase a medida ─────────────────────────────
function StepBtn({ children, label, disabled, onClick }) {
  return (
    <button
      type="button" aria-label={label} disabled={disabled}
      onClick={e => { e.stopPropagation(); onClick(); }}
      style={{
        display: 'grid', placeItems: 'center', width: 26, height: 26, flexShrink: 0,
        borderRadius: 8, border: `1px solid ${C.line}`, background: '#475BE1',
        color: disabled ? '#5f76ea' : C.line, cursor: disabled ? 'not-allowed' : 'pointer',
        padding: 0, fontFamily: C.font,
      }}
    >
      {children}
    </button>
  );
}

// ─── Tilde de selección, arriba a la derecha de cada tarjeta ─
function TildePase({ activo }) {
  return (
    <span aria-hidden="true"
      style={{
        flexShrink: 0, display: 'grid', placeItems: 'center',
        width: 20, height: 20, borderRadius: '50%',
        border: `1.5px solid ${activo ? C.primary : C.line}`,
        background: activo ? C.primary : '#fff',
        transition: 'all .15s',
      }}
    >
      {activo && <Check size={12} color="#fff" strokeWidth={3.5} />}
    </span>
  );
}

function BadgeDestacado() {
  return (
    <span style={{
      background: C.primary, color: '#fff', fontSize: 9.5, fontWeight: 800,
      letterSpacing: '0.04em', textTransform: 'uppercase',
      padding: '3px 8px', borderRadius: 999, whiteSpace: 'nowrap',
    }}>
      El más elegido
    </span>
  );
}

// ─── Qué trae cada pase, al pie de su tarjeta ────────────────
// Tres renglones, en el orden en que se entiende la oferta: primero el ahorro
// (lo que se compra), después el catálogo que entra entero (igual para todos
// los pases) y por último las elecciones premium, que crecen con los días.
export function Incluye({ incluidas, dias, ahorro }) {
  return (
    <div style={{ marginTop: 8 }}>
      {ahorro > 0 && (
        <div style={{ fontSize: 13, fontWeight: 800, color: C.primary, lineHeight: 1.3 }}>
          Ahorrás hasta {fmt(ahorro)}
        </div>
      )}
      {esPremiumIlimitado(dias) ? (
        <div style={{ fontSize: 11.5, color: C.muted, fontWeight: 600, lineHeight: 1.35, marginTop: 3 }}>
          Todo el catálogo disponible
        </div>
      ) : (
        <div style={{ fontSize: 11.5, fontWeight: 500, color: C.muted, marginTop: 3 }}>
          {incluidas > 0 && <div>{incluidas} descuentos incluidos</div>}
          <div>+ {eleccionesPremium(dias)} descuentos PREMIUM</div>
        </div>
      )}
    </div>
  );
}

export default function SelectorDuracion({
  pases, elegido, setElegido, diasCustom, setDiasCustom, incluidas, estimacion, customRef, precioCustom,
}) {
  const esCustom = elegido === 'custom';
  // El link "a medida" abre el stepper la primera vez que se toca; una vez
  // abierto se queda así aunque `elegido` cambie. `|| esCustom` cubre la
  // entrada por el "+ días" del hero (viene con `elegido==='custom'` desde
  // el arranque) sin necesitar un efecto que sincronice un booleano derivado.
  const [customTocado, setCustomTocado] = useState(false);
  const customAbierto = customTocado || esCustom;

  // El precio del pase a medida lo calcula el orquestador (mismo número que
  // termina cobrándose): recalcularlo acá de nuevo sería la misma cuenta en
  // dos lugares, y es justo el patrón que ya mordió en este proyecto (ver
  // "los CHECK constraints se desactualizan" en CLAUDE.md — dos fuentes de
  // la misma regla se desincronizan tarde o temprano).
  const ahorroCustom = estimacion ? ahorroEstimadoPase(estimacion, diasCustom) : 0;

  return (
    <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 20, padding: 20, marginBottom: 16 }}>
      <div style={{ ...labelSt, marginBottom: 12 }}>ELEGÍ TU PASE</div>
      {pases === null ? (
        <div style={{ color: C.muted, fontSize: 14, padding: '10px 0' }}>Cargando pases…</div>
      ) : pases.length === 0 ? (
        <div style={{ color: C.muted, fontSize: 14, padding: '10px 0' }}>No hay pases disponibles por ahora.</div>
      ) : (
        <>
          <div role="radiogroup" aria-label="Elegí tu pase"
            style={{ display: 'grid', gridTemplateColumns: `repeat(${pases.length}, 1fr)`, gap: 12 }}>
            {pases.map(p => {
              const activo = !esCustom && p.duracion_dias === elegido;
              const ahorro = estimacion ? ahorroEstimadoPase(estimacion, p.duracion_dias) : 0;
              const precioDia = p.duracion_dias ? Math.round(p.precio_final / p.duracion_dias) : 0;
              return (
                <button key={p.id} onClick={() => setElegido(p.duracion_dias)}
                  role="radio" aria-checked={activo}
                  style={{
                    textAlign: 'left', padding: '16px 14px 14px', borderRadius: 16, cursor: 'pointer',
                    background: activo ? C.primarySoft : '#fff',
                    border: `1.5px solid ${activo ? C.primary : C.line}`,
                    fontFamily: C.font, transition: 'all .15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <PaSSMark size={12} />
                    <TildePase activo={activo} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: activo ? C.primary : C.ink }}>
                      {p.duracion_dias} días
                    </span>
                    {p.destacado && <BadgeDestacado />}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em' }}>
                      {fmt(p.precio_final)}
                    </span>
                    <span style={{ fontSize: 11, color: C.muted }}>· {fmt(precioDia)}/día</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>por única vez</div>
                  <Incluye incluidas={incluidas} dias={p.duracion_dias} ahorro={ahorro} />
                </button>
              );
            })}
          </div>

          {/* A medida: bajó de nivel a propósito (§E) — no compite de igual a
              igual con los pases fijos, es la salida para quien necesita otra
              cantidad de días. */}
          <div ref={customRef} style={{ marginTop: 12 }}>
            {!customAbierto ? (
              <button
                type="button"
                onClick={() => setCustomTocado(true)}
                style={{
                  background: 'none', border: 'none', padding: '4px 0', color: C.primary,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: C.font,
                }}
              >
                Necesito otra cantidad de días →
              </button>
            ) : (
              <div
                role="radio" aria-checked={esCustom} tabIndex={0}
                onClick={() => setElegido('custom')}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setElegido('custom'); } }}
                style={{
                  textAlign: 'left', padding: '14px 14px 12px', borderRadius: 14, cursor: 'pointer',
                  background: esCustom ? C.primarySoft : C.bg,
                  border: `1.5px solid ${esCustom ? C.primary : C.line}`,
                  fontFamily: C.font, transition: 'all .15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: C.ink2 }}>Pase a medida</span>
                  <TildePase activo={esCustom} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                  <StepBtn
                    label="Un día menos"
                    disabled={diasCustom <= DIAS_CUSTOM_MIN}
                    onClick={() => { setElegido('custom'); setDiasCustom(d => Math.max(DIAS_CUSTOM_MIN, d - 1)); }}
                  ><Minus size={18} /></StepBtn>
                  <span style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 800, color: esCustom ? C.primary : C.ink, whiteSpace: 'nowrap' }}>
                    {diasCustom} días
                  </span>
                  <StepBtn
                    label="Un día más"
                    disabled={diasCustom >= DIAS_CUSTOM_MAX}
                    onClick={() => { setElegido('custom'); setDiasCustom(d => Math.min(DIAS_CUSTOM_MAX, d + 1)); }}
                  ><Plus size={18} /></StepBtn>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em' }}>
                    {fmt(precioCustom)}
                  </span>
                  <span style={{ fontSize: 11, color: C.muted }}>por única vez</span>
                </div>
                <Incluye incluidas={incluidas} dias={diasCustom} ahorro={ahorroCustom} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
