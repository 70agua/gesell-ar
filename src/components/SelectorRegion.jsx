// ============================================================
//  src/components/SelectorRegion.jsx
//  La pill de región del header — scope persistente (brief 2026-08-18).
//  El destino no es un filtro, es un SCOPE: define qué catálogo existe y
//  en qué alcance vale el Cupon PASS. Ver src/lib/scope.js.
//
//  Portal a <body>, medición de viewport, apertura arriba/abajo, mismo
//  mecanismo que BuscadorUbicacion en HeroPase.jsx (retirado de ahí el
//  mismo día — ver ese archivo). Se reescribe la mecánica, no se inventa
//  una nueva: portal porque este componente puede vivir en un contexto
//  con overflow recortado (igual que el hero antes), medir() porque el
//  panel de acá es más alto que un simple dropdown de 3 ítems —regiones +
//  ciudades + waitlist— y puede no entrar hacia abajo.
// ============================================================

import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, ChevronDown, Check } from 'lucide-react';
import useScope from '../hooks/useScope';
import { usePasePropio } from '../lib/pasePropio';
import { getRegionPorId } from '../lib/scope';
import { registrarDemandaDestino, completarEmailDemanda } from '../lib/demanda';

const C = {
  primary:     '#475BE1',
  primarySoft: '#EEF0FD',
  ink:         '#0B1020',
  ink2:        '#3D4255',
  muted:       '#6B7280',
  line:        '#E7E9EE',
  bg:          '#F7F7F8',
  font:        "'Inter', system-ui, sans-serif",
};

// Mismas constantes que BuscadorUbicacion — el panel entra en la misma
// cuenta de aire contra el borde de la ventana.
const MENU_AIRE     = 16;
const MENU_GAP      = 8;
const MENU_ALTO_MIN = 200;

export default function SelectorRegion({ condensed = false }) {
  const { region, ciudad, setRegion, setCiudad, regiones, ciudades, regionesWaitlist, listo } = useScope();

  const [abierto, setAbierto] = useState(false);
  const [pos, setPos]         = useState(null);
  const wrapRef = useRef(null);
  const menuRef = useRef(null);

  // "No bloquear, pero avisar" (brief §6): el Pase es de UNA región —
  // congelada en la compra— y cambiar el scope de navegación no lo lleva
  // con vos. `pase.region_id` puede diferir de `region.id` (el scope que se
  // está por cambiar), así que se resuelve el NOMBRE de la región del Pase
  // aparte, sólo cuando hace falta mostrarlo.
  const { pase } = usePasePropio();
  const [regionDelPase, setRegionDelPase] = useState(null);
  useEffect(() => {
    let vivo = true;
    getRegionPorId(pase?.region_id).then(r => { if (vivo) setRegionDelPase(r); });
    return () => { vivo = false; };
  }, [pase?.region_id]);

  const medir = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) { setAbierto(false); return; }
    const abajo  = window.innerHeight - r.bottom - MENU_GAP - MENU_AIRE;
    const arriba = r.top - MENU_GAP - MENU_AIRE;
    const haciaArriba = abajo < MENU_ALTO_MIN && arriba > abajo;
    setPos({
      left: r.left,
      width: Math.max(r.width, 300),
      haciaArriba,
      top:    haciaArriba ? undefined : r.bottom + MENU_GAP,
      bottom: haciaArriba ? window.innerHeight - r.top + MENU_GAP : undefined,
      maxHeight: Math.max(MENU_ALTO_MIN, haciaArriba ? arriba : abajo),
    });
  }, []);

  useLayoutEffect(() => { if (abierto) medir(); }, [abierto, medir]);

  useEffect(() => {
    if (!abierto) return;
    const onFuera = (e) => {
      if (wrapRef.current?.contains(e.target)) return;
      if (menuRef.current?.contains(e.target)) return;
      setAbierto(false);
    };
    const onEsc = (e) => { if (e.key === 'Escape') setAbierto(false); };
    document.addEventListener('mousedown', onFuera);
    document.addEventListener('keydown', onEsc);
    window.addEventListener('scroll', medir, { capture: true, passive: true });
    window.addEventListener('resize', medir);
    return () => {
      document.removeEventListener('mousedown', onFuera);
      document.removeEventListener('keydown', onEsc);
      window.removeEventListener('scroll', medir, { capture: true });
      window.removeEventListener('resize', medir);
    };
  }, [abierto, medir]);

  // Sin región resuelta todavía (fetch en curso) no hay nada sobrio que
  // mostrar — mejor nada que un rótulo vacío parpadeando.
  if (!listo || !region) return null;

  return (
    <div className="sr-wrap" ref={wrapRef}>
      <button
        type="button"
        className="sr-btn"
        aria-expanded={abierto}
        aria-haspopup="listbox"
        onClick={() => setAbierto(a => !a)}
        style={{ fontSize: condensed ? 13 : 14, padding: condensed ? '7px 12px' : '8px 14px' }}
      >
        <MapPin size={15} strokeWidth={2.2} className="sr-pin" aria-hidden="true" />
        <span className="sr-nombre">{region.nombre_corto}</span>
        <ChevronDown size={14} strokeWidth={2.2} className="sr-chevron" aria-hidden="true" />
      </button>

      {abierto && pos && createPortal(
        <div
          ref={menuRef}
          className="sr-panel"
          role="listbox"
          aria-label="Región"
          data-lenis-prevent
          style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxHeight }}
        >
          {/* Sólo si el Pase es de OTRA región que la actual — si coincide
              (el caso normal, ver §6: "navega a una ciudad de su misma
              región: no mostrar nada") no hay nada que avisar. */}
          {regionDelPase && region && regionDelPase.id !== region.id && (
            <div className="sr-aviso-pase">
              Tu Cupon PASS es de <b>{regionDelPase.nombre}</b> y no viaja con vos: es un pago único por viaje.
            </div>
          )}
          <div className="sr-lista">
            {regiones.map(r => (
              <button
                key={r.id}
                type="button"
                role="option"
                aria-selected={r.id === region.id}
                className={`sr-item${r.id === region.id ? ' sr-item--activa' : ''}`}
                onClick={() => { setRegion(r); setAbierto(false); }}
              >
                <span className="sr-item-nombre">{r.nombre}</span>
                {r.id === region.id && <Check size={15} strokeWidth={2.4} className="sr-check" />}
              </button>
            ))}
          </div>

          {ciudades.length > 0 && (
            <>
              <div className="sr-divisor" />
              <div className="sr-nota">Tu Cupon PASS vale en toda la región</div>
              <div className="sr-ciudades">
                <button
                  type="button"
                  className={`sr-chip${!ciudad ? ' sr-chip--activa' : ''}`}
                  onClick={() => setCiudad(null)}
                >
                  Todas
                </button>
                {ciudades.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className={`sr-chip${ciudad?.id === c.id ? ' sr-chip--activa' : ''}`}
                    onClick={() => setCiudad(c)}
                  >
                    {c.nombre}
                  </button>
                ))}
              </div>
            </>
          )}

          {regionesWaitlist.length > 0 && (
            <>
              <div className="sr-divisor" />
              <div className="sr-nota sr-nota--muted">Próximamente</div>
              <div className="sr-waitlist">
                {regionesWaitlist.map(r => <FilaWaitlist key={r.id} region={r} />)}
              </div>
            </>
          )}
        </div>,
        document.body,
      )}

      <style>{`
        .sr-wrap { position: relative; }
        .sr-btn {
          display: inline-flex; align-items: center; gap: 7px;
          background: #fff; border: 1px solid ${C.line}; border-radius: 999px;
          cursor: pointer; font-family: ${C.font}; font-weight: 600; color: ${C.ink};
          white-space: nowrap; transition: border-color .15s, padding .38s ease;
        }
        .sr-btn:hover, .sr-btn[aria-expanded="true"] { border-color: ${C.primary}; }
        .sr-pin { flex-shrink: 0; color: ${C.primary}; }
        .sr-chevron { flex-shrink: 0; transition: transform .18s ease; }
        .sr-btn[aria-expanded="true"] .sr-chevron { transform: rotate(180deg); }

        .sr-panel {
          position: fixed; z-index: 2000; background: #fff; border-radius: 16px;
          border: 1px solid ${C.line}; box-shadow: 0 24px 64px -16px rgba(11,16,32,0.20);
          overflow-y: auto; padding: 8px; box-sizing: border-box; font-family: ${C.font};
        }
        .sr-aviso-pase {
          background: #FFF7ED; color: #9A5B13; border: 1px solid #FDE4C0;
          border-radius: 10px; padding: 9px 11px; margin-bottom: 8px;
          font-size: 12px; line-height: 1.45;
        }
        .sr-lista { display: flex; flex-direction: column; gap: 2px; }
        .sr-item {
          display: flex; align-items: center; justify-content: space-between; gap: 8px;
          width: 100%; text-align: left; padding: 10px 12px; border: none; border-radius: 10px;
          background: transparent; cursor: pointer; font-family: ${C.font};
          font-size: 14px; font-weight: 600; color: ${C.ink}; transition: background .13s;
        }
        .sr-item:hover { background: ${C.bg}; }
        .sr-item--activa { color: ${C.primary}; background: ${C.primarySoft}; }
        .sr-check { flex-shrink: 0; color: ${C.primary}; }

        .sr-divisor { height: 1px; background: ${C.line}; margin: 8px 4px; }
        .sr-nota { padding: 2px 12px 8px; font-size: 12px; font-weight: 600; color: ${C.ink2}; }
        .sr-nota--muted { color: ${C.muted}; text-transform: uppercase; letter-spacing: 0.06em; font-size: 10.5px; }

        .sr-ciudades { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 8px 4px; }
        .sr-chip {
          padding: 6px 12px; border-radius: 999px; border: 1px solid ${C.line}; background: #fff;
          cursor: pointer; font-family: ${C.font}; font-size: 12.5px; font-weight: 600; color: ${C.ink2};
          transition: background .13s, border-color .13s, color .13s;
        }
        .sr-chip:hover { border-color: ${C.primary}; }
        .sr-chip--activa { background: ${C.primarySoft}; border-color: ${C.primary}; color: ${C.primary}; }

        .sr-waitlist { display: flex; flex-direction: column; gap: 6px; padding: 0 8px 4px; }

        /* Mobile: mismo componente, panel a pantalla completa tipo sheet
           (a pedido explícito del brief — no un componente aparte). */
        @media (max-width: 640px) {
          .sr-panel {
            position: fixed !important; inset: 0 !important; left: 0 !important; right: 0 !important;
            top: 0 !important; bottom: 0 !important; width: 100% !important; max-height: 100vh !important;
            border-radius: 0; border: none; padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Fila de región en waitlist, con captura de email inline ──
// Mismo mecanismo que BuscarDestinoModal.jsx (src/lib/demanda.js): se
// registra la demanda al abrir interés (acá, al tipear un email válido y
// confirmar) y se completa el email en el mismo registro. No hay FK a
// `regiones` en `demanda_destinos` —esa tabla es de búsqueda libre por
// georef, pensada para "cualquier pueblo del país", no para el catálogo
// cerrado de regiones—: se reutiliza pasando el nombre de la región como
// `destino` y `categoria: 'region_pass'`, así el panel del superadmin
// puede seguir leyendo todo desde un solo lugar y filtrar por categoría.
function FilaWaitlist({ region }) {
  const [email, setEmail]     = useState('');
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo]     = useState(false);
  const emailValido = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

  async function enviar(e) {
    e.preventDefault();
    if (!emailValido || enviando) return;
    setEnviando(true);
    const id = await registrarDemandaDestino({ destino: region.nombre, categoria: 'region_pass' });
    if (id) await completarEmailDemanda(id, email.trim());
    setEnviando(false);
    setListo(true);
  }

  return (
    <form onSubmit={enviar} className="sr-wl-fila" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px' }}>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.ink }}>{region.nombre}</span>
      {listo ? (
        <span style={{ fontSize: 12, fontWeight: 700, color: '#10A36B' }}>¡Listo! Te avisamos</span>
      ) : (
        <>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@email.com"
            style={{ width: 140, padding: '6px 8px', border: `1px solid ${C.line}`, borderRadius: 8, fontSize: 12.5, fontFamily: C.font, outline: 'none' }}
          />
          <button
            type="submit"
            disabled={!emailValido || enviando}
            style={{
              padding: '6px 10px', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: emailValido ? C.primary : C.line, color: emailValido ? '#fff' : C.muted,
              cursor: emailValido ? 'pointer' : 'default', fontFamily: C.font, whiteSpace: 'nowrap',
            }}
          >
            Avisame
          </button>
        </>
      )}
    </form>
  );
}
