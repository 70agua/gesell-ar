// ============================================================
//  src/components/SimuladorImpulso.jsx
//  "Simulador de Crédito Publicitario" — slider de impulso para
//  el panel de socios. Visibilidad y Ventas estimadas escalan de
//  forma directamente proporcional a los créditos invertidos
//  (30 créd. → +300% visibilidad, +50% ventas), con acento de
//  color reactivo (color principal → naranja del CTA).
//
//  El presupuesto (créditos) es lo único que mueve Visibilidad/
//  Ventas — si el socio quiere más resultado en menos tiempo, la
//  forma correcta es subir el presupuesto, no la duración. La
//  duración sólo cambia el RITMO de gasto: menos días = mismo
//  presupuesto se consume más rápido = sube el costo por evento
//  (CPC/CPV/CPR). Además, más créditos invertidos = descuento por
//  volumen (cada evento sale más barato) — ver src/lib/impulso.js.
// ============================================================
import { useEffect, useRef, useState } from 'react';
import { DIAS_REF, DIAS_MAX, CREDITOS_MIN, CREDITOS_MAX } from '../lib/impulso';

export { CREDITOS_MIN, CREDITOS_MAX, DIAS_REF };

const FONT  = "'Inter', system-ui, sans-serif";
const INK   = '#0f172a';
const INK2  = '#475569';
const MUTED = '#94a3b8';
const LINE  = '#e2e8f0';
const P     = '#475be1';
const PS    = '#eef0fd';
const GREEN = '#10b981';

export const VALOR_CREDITO = 2450; // $ por crédito publicitario (valor fijo de este simulador)

// 30 días es la base (se ve en el campo custom); acá sólo las alternativas más cortas.
const DIAS_OPCIONES = [3, 7, 15];

// Bucket de copy por umbral de créditos (sólo texto — los números salen de las
// fórmulas proporcionales de abajo, no de acá).
const ETIQUETAS = [
  { creditos: 5,  texto: 'Aumentá y dale un impulso inicial' },
  { creditos: 12, texto: '¡Este es un buen subidón!' },
  { creditos: 20, texto: 'Sé una potencia comercial' },
  { creditos: 30, texto: 'Dominá el mercado' },
];
function etiquetaPara(creditos) {
  for (let i = ETIQUETAS.length - 1; i >= 0; i--) if (creditos >= ETIQUETAS[i].creditos) return ETIQUETAS[i].texto;
  return ETIQUETAS[0].texto;
}

// Proporcionalidad directa (y = k·x, pasa por el origen): al doble de créditos,
// el doble de resultado. Ancladas a los topes pedidos: 30 créd. → +300% visibilidad,
// 30 créd. → +50% ventas (mucho más conservador: todavía no hay estadísticas reales
// de cuánto mejora la puja, así que preferimos subestimar el impacto en ventas).
const VISIBILIDAD_POR_CREDITO = 300 / CREDITOS_MAX;
const VENTAS_POR_CREDITO      = 50  / CREDITOS_MAX;

// Acento reactivo: color principal de la marca → naranja del CTA.
const STOPS_COLOR = [
  { t: 0, rgb: [71, 91, 225] },   // #475be1 — principal
  { t: 1, rgb: [234, 88, 12] },   // #ea580c — CTA
];
function colorParaProgreso(t) {
  const x = Math.min(1, Math.max(0, t));
  const [a, b] = STOPS_COLOR;
  const rgb = a.rgb.map((c, idx) => Math.round(c + (b.rgb[idx] - c) * x));
  return `rgb(${rgb.join(',')})`;
}

// Tween liviano por requestAnimationFrame (sin dependencias nuevas) para que
// los números y barras se animen suave al arrastrar la perilla. Clave para que
// no "parpadee": el punto de partida (`displayRef`) se actualiza en cada frame,
// no sólo al terminar — así, si el valor cambia a mitad de una animación (arrastre
// rápido del slider), la siguiente arranca desde donde de verdad está en pantalla.
function useAnimatedNumber(target, duration = 220) {
  const [display, setDisplay] = useState(target);
  const displayRef = useRef(target);
  const frameRef   = useRef(null);
  useEffect(() => {
    const from = displayRef.current;
    const start = performance.now();
    cancelAnimationFrame(frameRef.current);
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const value = from + (target - from) * eased;
      displayRef.current = value;
      setDisplay(value);
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);
  return display;
}

// El color se usa siempre para label + valor + barra (nunca rojo, nunca "incremental":
// quien llama decide un color fijo o el reactivo según corresponda).
function Metrica({ label, valor, max, color, jerarquica }) {
  const animado = useAnimatedNumber(valor);
  const pct = Math.min(100, (animado / max) * 100);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontFamily: FONT, fontSize: jerarquica ? 13 : 12, fontWeight: jerarquica ? 800 : 700, color }}>
          {label}
        </span>
        <span style={{ fontFamily: FONT, fontSize: jerarquica ? 16 : 13, fontWeight: 900, color }}>
          +{Math.round(animado)}%
        </span>
      </div>
      <div style={{ height: jerarquica ? 10 : 7, borderRadius: 999, background: LINE, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: color, transition: 'background 0.2s linear' }}/>
      </div>
    </div>
  );
}

export default function SimuladorImpulso({ value, onChange, dias, onChangeDias }) {
  const creditos = Math.min(CREDITOS_MAX, Math.max(CREDITOS_MIN, value));
  const progreso = (creditos - CREDITOS_MIN) / (CREDITOS_MAX - CREDITOS_MIN);
  const color    = colorParaProgreso(progreso);
  const pesos    = creditos * VALOR_CREDITO;
  const pesosAnim = useAnimatedNumber(pesos);
  const creditosAnim = useAnimatedNumber(creditos);

  // Visibilidad/Ventas dependen únicamente del presupuesto (créditos) — más resultado
  // en menos tiempo se logra sumando crédito, no achicando la duración.
  const visibilidad = creditos * VISIBILIDAD_POR_CREDITO;
  const ventas       = creditos * VENTAS_POR_CREDITO;
  const etiqueta     = etiquetaPara(creditos);

  return (
    <div style={{ fontFamily: FONT }}>
      {/* Valor grande: moneda + créditos (pesos entre paréntesis, weight liviano) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src="/credito-coin.svg" alt="" style={{ width: 40, height: 40, flexShrink: 0 }}/>
        <div style={{ fontSize: 42, fontWeight: 900, lineHeight: 1, color: INK }}>
          {Math.round(creditosAnim)}{' '}
          <span style={{ fontSize: 20, fontWeight: 500, color: INK }}>créditos</span>{' '}
          <span style={{ fontSize: 20, fontWeight: 300, color: MUTED }}>(${Math.round(pesosAnim).toLocaleString('es-AR')})</span>
        </div>
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 400, color: MUTED, marginTop: 4 }}>
        1 crédito = ${VALOR_CREDITO.toLocaleString('es-AR')}
      </div>

      {/* Etiqueta dinámica del hito — título, arriba de la barra de créditos */}
      <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 800, color, margin: '18px 0 6px', transition: 'color 0.2s linear' }}>
        {etiqueta}
      </div>

      {/* Slider 5-30, step 1 */}
      <input type="range" min={CREDITOS_MIN} max={CREDITOS_MAX} step={1} value={creditos}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', margin: '0 0 4px', accentColor: color, cursor: 'pointer' }}/>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: MUTED }}>
        <span>{CREDITOS_MIN} créd.</span>
        <span>{CREDITOS_MAX} créd.</span>
      </div>

      {/* Métricas: Visibilidad (jerárquica, color reactivo) + Ventas estimadas (siempre verde) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 18 }}>
        <Metrica label="Visibilidad" valor={visibilidad} max={CREDITOS_MAX * VISIBILIDAD_POR_CREDITO} color={color} jerarquica/>
        <Metrica label="Ventas estimadas" valor={ventas} max={CREDITOS_MAX * VENTAS_POR_CREDITO} color={GREEN}/>
      </div>

      {/* Duración del objetivo: sólo cambia el ritmo de gasto (el costo, en pesos, se ve
          a la izquierda junto a la ilustración) */}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: INK2, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          ¿Por cuánto tiempo?
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {DIAS_OPCIONES.map(d => {
            const sel = dias === d;
            return (
              <button key={d} onClick={() => onChangeDias(d)}
                style={{ flex: 1, minWidth: 64, padding: '8px 0', borderRadius: 9, border: `1.5px solid ${sel ? P : LINE}`, background: sel ? PS : '#fff', color: sel ? P : INK2, fontFamily: FONT, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                {d} día{d !== 1 ? 's' : ''}
              </button>
            );
          })}
          <select value={dias} onChange={e => onChangeDias(Number(e.target.value))}
            title="Elegí un número puntual de días"
            style={{ flex: 1, minWidth: 110, padding: '8px 10px', borderRadius: 9, border: `1.5px solid ${!DIAS_OPCIONES.includes(dias) ? P : LINE}`, background: !DIAS_OPCIONES.includes(dias) ? PS : '#fff', color: !DIAS_OPCIONES.includes(dias) ? P : INK2, fontFamily: FONT, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
            {Array.from({ length: DIAS_MAX }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>{n} día{n !== 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
