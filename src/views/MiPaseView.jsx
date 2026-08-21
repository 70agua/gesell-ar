// ============================================================
//  src/views/MiPaseView.jsx
//  El medio del recorrido del Pase, que hasta ahora sólo existía en
//  PaseDebugView: activar, ver la billetera y manejar los premium.
//
//  Dos estados que cambian todo:
//   · PENDIENTE — comprado y sin arrancar. Puede activarlo ahora o PROGRAMAR
//     la fecha. Programar es lo que le deja pedir fechas (Fase 5b) sin quemar
//     días de vigencia esperando que le contesten.
//   · ACTIVO — corriendo. Billetera + elección de premium.
//
//  §4.3: los slots premium se OCUPAN, no se consumen. Se llenan y vacían
//  libremente; recién al canjear quedan congelados.
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import {
  getMisPases,
  getElecciones,
  getOfertasPremium,
  getCanjes,
  getAhorroPase,
  elegirPremium,
  quitarPremium,
  activarPaseAhora,
  programarActivacion,
  estadoEstadia,
  getOfertasEstadia,
} from '../lib/pases';
import { getMisSolicitudes, cancelarSolicitud, ESTADOS as ESTADOS_SOL, textoError as txtSol } from '../lib/solicitudes';
import { getRegionPorId, getCiudadesDeRegion } from '../lib/scope';
import SolicitarFecha from '../components/SolicitarFecha';
import CupopacksParaPase from '../components/CupopacksParaPase';

const A = {
  ink: '#0B1020', ink2: '#3D4255', muted: '#6B7280', line: '#E7E9EE',
  primary: '#475BE1', primarySoft: '#EEF0FD', bg: '#F7F7F8',
  green: '#10A36B', greenSoft: '#ECFDF5', yellow: '#FFC93C',
  font: "'Inter', system-ui, sans-serif",
};
const fmt = n => '$' + Math.round(n || 0).toLocaleString('es-AR');
const fmtFecha = d => d
  ? new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
  : null;
const diasRestantes = venceEl => {
  if (!venceEl) return null;
  return Math.max(0, Math.ceil((new Date(venceEl).getTime() - Date.now()) / 86400000));
};

const ERRORES = {
  fecha_pasada:     'Elegí una fecha de hoy en adelante.',
  fuera_de_ventana: 'Esa fecha queda fuera de los 12 meses que tenés para activarlo.',
  ventana_vencida:  'Pasaron los 12 meses para activarlo. Te devolvimos el importe en puntos.',
  ya_canjeada:      'Ese beneficio ya lo usaste, no se puede soltar.',
  sin_cupo:         'Ese beneficio se quedó sin cupo este mes.',
};
const txt = e => ERRORES[e] || 'No pudimos completar la acción. Probá de nuevo.';

// ─── Tarjeta de dato de la billetera ──────────────────────────
function Dato({ label, valor, sub, acento }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${A.line}`, borderRadius: 14, padding: '14px 16px', flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: A.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: acento || A.ink, marginTop: 4, letterSpacing: '-0.02em' }}>{valor}</div>
      {sub && <div style={{ fontSize: 11.5, color: A.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Alcance regional del pase (2026-08-18) ────────────────────
// "Válido en toda la región X" + las ciudades que incluye. pase.region_id
// queda congelado en la compra (mismo criterio que premium_ilimitado): es
// la región del PASE, no necesariamente la que el viajero está mirando
// ahora en el header. Sin región (pases viejos, sin backfill) no muestra
// nada — más vale nada que un dato mal calculado.
function RegionDelPase({ pase }) {
  const [region, setRegion]     = useState(null);
  const [ciudades, setCiudades] = useState([]);

  useEffect(() => {
    // getRegionPorId/getCiudadesDeRegion ya devuelven null/[] sin regionId
    // (ver scope.js), así que no hace falta la rama especial acá — mismo
    // ajuste que useScope.js: nunca un setState síncrono en el cuerpo del
    // efecto, siempre a través del .then/await.
    let vivo = true;
    const regionId = pase?.region_id;
    (async () => {
      const [r, cs] = await Promise.all([getRegionPorId(regionId), getCiudadesDeRegion(regionId)]);
      if (!vivo) return;
      setRegion(r);
      setCiudades(cs);
    })();
    return () => { vivo = false; };
  }, [pase?.region_id]);

  if (!region) return null;
  return (
    <div style={{ fontSize: 13, color: A.ink2, lineHeight: 1.5 }}>
      Válido en toda la región <b style={{ color: A.ink }}>{region.nombre}</b>
      {ciudades.length > 0 && <>: {ciudades.map(c => c.nombre).join(', ')}</>}
    </div>
  );
}

// ─── Pase pendiente: activar o programar ──────────────────────
function PaseSinActivar({ pase, onActivado, onError }) {
  const [fecha, setFecha]       = useState(pase.activacion_programada || '');
  const [guardando, setGuardando] = useState(false);
  const dias = pase.dias || pase.pases?.duracion_dias || 7;

  async function activarAhora() {
    setGuardando(true);
    const r = await activarPaseAhora(pase.id);
    setGuardando(false);
    if (!r.ok) return onError(txt(r.error));
    onActivado();
  }

  async function programar() {
    setGuardando(true);
    const r = await programarActivacion(pase.id, fecha || null);
    setGuardando(false);
    if (!r.ok) return onError(txt(r.error));
    onActivado();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: A.primarySoft, border: `1px solid ${A.line}`, borderRadius: 16, padding: 20 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: A.ink, marginBottom: 4 }}>Tu Pase todavía no arrancó</div>
        <div style={{ fontSize: 13.5, color: A.ink2, lineHeight: 1.55 }}>
          Dura <b>{dias} días</b> desde que lo activás. Tenés 12 meses desde la compra para hacerlo,
          así que no corre nada hasta que vos digas.
        </div>
        <div style={{ marginTop: 10 }}><RegionDelPase pase={pase} /></div>
      </div>

      <div style={{ background: '#fff', border: `1px solid ${A.line}`, borderRadius: 16, padding: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: A.ink, marginBottom: 4 }}>Programalo para cuando viajes</div>
        <div style={{ fontSize: 12.5, color: A.ink2, lineHeight: 1.5, marginBottom: 14 }}>
          Se activa solo ese día. Así podés ir organizando el viaje sin gastar días de tu Pase.
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input type="date" value={fecha} min={new Date().toISOString().slice(0, 10)}
            onChange={e => setFecha(e.target.value)}
            style={{
              flex: 1, minWidth: 170, padding: '12px 14px', borderRadius: 12,
              border: `1.5px solid ${A.line}`, fontFamily: A.font, fontSize: 14, color: A.ink, outline: 'none',
            }} />
          <button onClick={programar} disabled={guardando || !fecha} style={{
            padding: '12px 20px', borderRadius: 12, border: 'none',
            background: guardando || !fecha ? A.line : A.primary,
            color: guardando || !fecha ? A.muted : '#fff',
            fontSize: 14, fontWeight: 700, cursor: guardando || !fecha ? 'not-allowed' : 'pointer', fontFamily: A.font,
          }}>Programar</button>
        </div>
        {pase.activacion_programada && (
          <div style={{ marginTop: 12, fontSize: 13, color: A.green, fontWeight: 600 }}>
            Programado para el {fmtFecha(pase.activacion_programada)}.{' '}
            <button onClick={() => { setFecha(''); programarActivacion(pase.id, null).then(onActivado); }}
              style={{ background: 'none', border: 'none', color: A.muted, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
              Cancelar
            </button>
          </div>
        )}
      </div>

      <div style={{ background: '#fff', border: `1px solid ${A.line}`, borderRadius: 16, padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 13.5, color: A.ink2, marginBottom: 12, lineHeight: 1.5 }}>
          ¿Ya estás en el destino?
        </div>
        <button onClick={activarAhora} disabled={guardando} style={{
          width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
          background: guardando ? A.line : A.green, color: guardando ? A.muted : '#fff',
          fontSize: 15.5, fontWeight: 800, cursor: guardando ? 'not-allowed' : 'pointer', fontFamily: A.font,
        }}>{guardando ? 'Activando…' : 'Activar ahora'}</button>
        <div style={{ fontSize: 11.5, color: A.muted, marginTop: 10 }}>
          Los {dias} días arrancan en este momento.
        </div>
      </div>
    </div>
  );
}

// ─── Elección de premium ──────────────────────────────────────
function Premium({ pase, elegidas, restantes, total, premiumIlimitado = false, canjeadas, pedidas = [], onCambio, onError, onPedirFecha }) {
  const [ofertas, setOfertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [enCurso, setEnCurso] = useState(null);

  useEffect(() => {
    let vivo = true;
    getOfertasPremium().then(o => { if (vivo) { setOfertas(o); setCargando(false); } });
    return () => { vivo = false; };
  }, []);

  const idsElegidas = new Set(elegidas.map(e => e.promocion_id));
  const idsCanjeadas = new Set(canjeadas);

  async function alternar(promoId) {
    setEnCurso(promoId);
    const yaEsta = idsElegidas.has(promoId);
    const r = yaEsta ? await quitarPremium(pase.id, promoId) : await elegirPremium(pase.id, promoId);
    setEnCurso(null);
    if (!r.ok) return onError(txt(r.error));
    onCambio();
  }

  // Las que necesitan confirmación no se eligen: se piden.
  const idsPedidas = new Set(pedidas);

  return (
    <div style={{ background: '#fff', border: `1px solid ${A.line}`, borderRadius: 16, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: A.ink }}>Tus beneficios PREMIUM</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: (premiumIlimitado || restantes > 0) ? A.green : A.muted }}>
          {premiumIlimitado ? 'Sin tope: todo el catálogo disponible' : `${restantes} de ${total} disponibles`}
        </div>
      </div>
      <div style={{ fontSize: 12.5, color: A.ink2, lineHeight: 1.5, marginBottom: 16 }}>
        Elegí los que quieras y cambialos las veces que necesites. Sólo quedan fijos cuando los usás.
      </div>

      {cargando ? (
        <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 13, color: A.muted }}>Cargando…</div>
      ) : ofertas.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 13, color: A.muted }}>
          No hay beneficios PREMIUM disponibles en este momento.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ofertas.map(o => {
            const elegida  = idsElegidas.has(o.id);
            const canjeada = idsCanjeadas.has(o.id);
            const bloqueada = !elegida && restantes === 0;
            return (
              <div key={o.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: 13, borderRadius: 13,
                border: `1.5px solid ${elegida ? A.green : A.line}`,
                background: elegida ? A.greenSoft : '#fff',
                opacity: bloqueada ? 0.5 : 1,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: A.ink, lineHeight: 1.3 }}>{o.title || o.titulo}</div>
                  <div style={{ fontSize: 12, color: A.muted, marginTop: 2 }}>
                    {o.proveedorNombre}{o.ahorroEstimado > 0 ? ` · ahorrás ${fmt(o.ahorroEstimado)}` : ''}
                  </div>
                </div>
                {canjeada ? (
                  <span style={{ fontSize: 11, fontWeight: 700, color: A.muted, background: A.bg, padding: '5px 10px', borderRadius: 999 }}>Usado</span>
                ) : o.requiereFecha ? (
                  idsPedidas.has(o.id) ? (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#B45309', background: '#FFF7E5', padding: '5px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                      Fecha pedida
                    </span>
                  ) : (
                    <button onClick={() => onPedirFecha(o)} disabled={bloqueada} style={{
                      padding: '8px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, fontFamily: A.font,
                      border: 'none', background: bloqueada ? A.line : A.primary, color: bloqueada ? A.muted : '#fff',
                      cursor: bloqueada ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                    }}>Pedir fecha</button>
                  )
                ) : (
                  <button onClick={() => alternar(o.id)} disabled={bloqueada || enCurso === o.id} style={{
                    padding: '8px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, fontFamily: A.font,
                    border: elegida ? `1px solid ${A.green}` : 'none',
                    background: elegida ? '#fff' : (bloqueada ? A.line : A.primary),
                    color: elegida ? A.green : (bloqueada ? A.muted : '#fff'),
                    cursor: bloqueada ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                  }}>
                    {enCurso === o.id ? '…' : elegida ? 'Quitar' : 'Elegir'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Descuento de estadía ─────────────────────────────────────
// Se usa una sola vez por Pase, y sólo en alojamiento. Mostrar DÓNDE vale
// evita que el turista lo busque en un restaurante.
function Estadia({ estado }) {
  const [ofertas, setOfertas] = useState([]);
  useEffect(() => {
    if (!estado?.disponible) return;
    let vivo = true;
    getOfertasEstadia().then(o => { if (vivo) setOfertas(o.slice(0, 6)); });
    return () => { vivo = false; };
  }, [estado?.disponible]);

  return (
    <div style={{ background: '#fff', border: `1px solid ${A.line}`, borderRadius: 16, padding: '16px 20px' }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: A.ink, marginBottom: 3 }}>Descuento de alojamiento</div>
      <div style={{ fontSize: 12.5, color: A.ink2, lineHeight: 1.5 }}>
        {estado?.disponible
          ? 'Lo tenés disponible: se usa una sola vez por Pase.'
          : estado?.motivo === 'ya_usada'
            ? `Ya lo usaste${estado.usadaEl ? ` el ${fmtFecha(estado.usadaEl)}` : ''}.`
            : 'Este Pase no incluye descuento de alojamiento.'}
      </div>
      {estado?.disponible && ofertas.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {ofertas.map(o => (
            <span key={o.id} style={{
              fontSize: 11.5, fontWeight: 600, color: A.ink2, background: A.bg,
              border: `1px solid ${A.line}`, padding: '5px 10px', borderRadius: 999,
            }}>{o.proveedorNombre}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Solicitudes de fecha ─────────────────────────────────────
// Los premium que necesitan confirmación no se eligen: se piden. Mientras
// esperan respuesta ocupan un slot "en suspenso"; si el comercio no puede,
// se libera solo.
//
// ⚠️ COPY: nunca "reservá" ni "disponibilidad" (Ley 18.829).
function Solicitudes({ userId, onCambio, onError, onReintentar }) {
  const [items, setItems] = useState([]);
  const [enCurso, setEnCurso] = useState(null);

  const cargar = useCallback(() => {
    if (userId) getMisSolicitudes(userId).then(setItems);
  }, [userId]);
  useEffect(() => { cargar(); }, [cargar]);

  const vivas = items.filter(s => ['enviada', 'contrapropuesta', 'aceptada'].includes(s.estado));
  if (vivas.length === 0) return null;

  async function cancelar(s) {
    setEnCurso(s.id);
    const r = await cancelarSolicitud(s.id);
    setEnCurso(null);
    if (!r.ok) return onError(txtSol(r.error));
    cargar(); onCambio();
  }

  return (
    <div style={{ background: '#fff', border: `1px solid ${A.line}`, borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${A.line}` }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: A.ink }}>Fechas que pediste</div>
        <div style={{ fontSize: 12.5, color: A.muted, marginTop: 2, lineHeight: 1.5 }}>
          El comercio confirma o te propone otra. Mientras esperás, el beneficio queda apartado.
        </div>
      </div>
      {vivas.map((s, i) => {
        const est = ESTADOS_SOL[s.estado] || ESTADOS_SOL.enviada;
        return (
          <div key={s.id} style={{
            padding: '13px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            borderBottom: i === vivas.length - 1 ? 'none' : `1px solid ${A.line}`,
          }}>
            <div style={{ flex: 1, minWidth: 190 }}>
              <span style={{
                display: 'inline-block', background: est.bg, color: est.color, fontSize: 10.5, fontWeight: 800,
                padding: '3px 9px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4,
              }}>{est.label}</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: A.ink, lineHeight: 1.3 }}>
                {s.promociones?.titulo || 'Beneficio'}
              </div>
              <div style={{ fontSize: 12, color: A.muted, marginTop: 2 }}>
                {s.negocios?.nombre} · {fmtFecha(s.fecha_pedida)} · {s.personas} persona{s.personas !== 1 ? 's' : ''}
              </div>
            </div>

            {s.estado === 'enviada' && (
              <button onClick={() => cancelar(s)} disabled={enCurso === s.id} style={{
                background: 'none', border: `1px solid ${A.line}`, borderRadius: 9, padding: '7px 12px',
                fontSize: 12, fontWeight: 600, color: A.ink2, cursor: 'pointer', fontFamily: A.font,
              }}>{enCurso === s.id ? '…' : 'Cancelar'}</button>
            )}

            {s.estado === 'contrapropuesta' && (
              <button onClick={() => onReintentar(s)} style={{
                background: A.primary, color: '#fff', border: 'none', borderRadius: 9, padding: '8px 13px',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: A.font, whiteSpace: 'nowrap',
              }}>Me sirve el {fmtFecha(s.fecha_propuesta)}</button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Vista ────────────────────────────────────────────────────
export default function MiPaseView({ session, onBack, onComprarPase, onExplorar }) {
  const [pase, setPase]         = useState(null);
  const [elecciones, setElecc]  = useState([]);
  const [canjes, setCanjes]     = useState([]);
  const [ahorro, setAhorro]     = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError]       = useState(null);
  const [solicitudes, setSolic] = useState([]);
  const [pidiendo, setPidiendo] = useState(null);   // { oferta, origenId, fechaSugerida }
  const [refrescar, setRefrescar] = useState(0);

  const cargar = useCallback(async () => {
    const uid = session?.user?.id;
    if (!uid) { setCargando(false); return; }
    const pases = await getMisPases(uid);
    // El activo manda; si no hay, el pendiente.
    const p = pases.find(x => x.estado === 'activo') || pases.find(x => x.estado === 'pendiente') || null;
    setPase(p);
    if (p) {
      const [el, cj, ah, sol] = await Promise.all([
        getElecciones(p.id), getCanjes(p.id), getAhorroPase(p.id), getMisSolicitudes(uid),
      ]);
      setElecc(el || []); setCanjes(cj || []); setAhorro(ah || 0); setSolic(sol || []);
    }
    setCargando(false);
  }, [session]);

  useEffect(() => { cargar(); }, [cargar]);

  const marco = hijo => (
    <div style={{ minHeight: '100vh', background: A.bg, fontFamily: A.font, paddingTop: 70 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 80px' }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: A.ink2, cursor: 'pointer',
          fontSize: 14, fontWeight: 600, padding: 0, marginBottom: 18, fontFamily: A.font,
        }}>← Volver</button>
        <h1 style={{ margin: '0 0 22px', fontSize: 30, fontWeight: 800, letterSpacing: '-0.025em', color: A.ink }}>Mi Pase</h1>
        {error && (
          <div style={{ marginBottom: 16, padding: '12px 15px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, fontSize: 13.5, color: '#B91C1C' }}>
            {error}
          </div>
        )}
        {hijo}
      </div>
    </div>
  );

  if (cargando) return marco(<div style={{ textAlign: 'center', padding: '60px 0', color: A.muted, fontSize: 14 }}>Cargando…</div>);

  if (!pase) return marco(
    <div style={{ background: '#fff', border: `1px solid ${A.line}`, borderRadius: 16, padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: A.ink, marginBottom: 6 }}>Todavía no tenés un Pase</div>
      <div style={{ fontSize: 13.5, color: A.muted, marginBottom: 20, lineHeight: 1.5 }}>
        Con el Pase accedés a todos los descuentos del destino durante tu viaje.
      </div>
      <button onClick={onComprarPase} style={{
        background: A.primary, color: '#fff', border: 'none', borderRadius: 12,
        padding: '12px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: A.font,
      }}>Ver el Pase</button>
    </div>
  );

  if (pase.estado === 'pendiente') return marco(
    <PaseSinActivar pase={pase} onError={setError}
      onActivado={() => { setError(null); cargar(); }} />
  );

  // ─── Activo: billetera ──────────────────────────────────────
  const dias      = diasRestantes(pase.vence_el);
  // Congelado en la compra (DIAS_PREMIUM_ILIMITADO en lib/pases.js): desde 10
  // días no hay tope. `total`/`restantes` pasan a Infinity —mismo criterio
  // que lib/pasePropio.jsx §infinito— para que la resta y el `encajeEnPase`
  // de los Cupopacks sigan andando solos; los textos de abajo SÍ tienen que
  // mirar `premiumIlimitado` antes de imprimir el número.
  const premiumIlimitado = pase.premium_ilimitado === true;
  const totalNum  = pase.elecciones_premium ?? pase.dias ?? pase.pases?.elecciones_premium ?? 0;
  const usadas    = elecciones.length;
  const total     = premiumIlimitado ? Infinity : totalNum;
  const restantes = premiumIlimitado ? Infinity : Math.max(0, totalNum - usadas);
  const estadia   = estadoEstadia(pase);
  const canjeadas = canjes.map(c => c.promocion_id);
  // Una oferta con solicitud viva no se puede volver a pedir.
  const pedidas = solicitudes.filter(s => ['enviada','aceptada'].includes(s.estado)).map(s => s.promocion_id);

  return marco(
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Dato label="Días restantes" valor={dias ?? '—'}
          sub={pase.vence_el ? `hasta el ${fmtFecha(pase.vence_el)}` : null}
          acento={dias != null && dias <= 1 ? '#DC2626' : A.ink} />
        <Dato label="Ahorro del viaje" valor={fmt(ahorro)} sub={`${canjes.length} canje${canjes.length !== 1 ? 's' : ''}`} acento={A.green} />
        <Dato label="Premium" valor={premiumIlimitado ? 'Sin tope' : `${restantes}/${total}`} sub="disponibles" acento={A.primary} />
      </div>

      <RegionDelPase pase={pase} />

      <Estadia estado={estadia} />

      <Solicitudes key={refrescar} userId={session?.user?.id} onError={setError}
        onCambio={() => cargar()}
        onReintentar={s => setPidiendo({
          oferta: { id: s.promocion_id, title: s.promociones?.titulo, proveedorNombre: s.negocios?.nombre },
          origenId: s.id, fechaSugerida: s.fecha_propuesta,
        })} />

      {/* El atajo para el que no quiere elegir entre cuarenta premium. Va
          ANTES del elector manual y no después: si ya eligió a mano, ofrecerle
          que le armemos la selección llega tarde. Se esconde solo cuando no
          queda ningún Cupopack que entre. */}
      <CupopacksParaPase
        paseId={pase.id} libres={restantes} total={total} premiumIlimitado={premiumIlimitado}
        elegidasIds={elecciones.map(e => e.promocion_id)}
        onCambio={async () => { setError(null); await cargar(); }} />

      <Premium pase={pase} elegidas={elecciones} restantes={restantes} total={total}
        premiumIlimitado={premiumIlimitado}
        canjeadas={canjeadas} pedidas={pedidas} onError={setError}
        onPedirFecha={o => setPidiendo({ oferta: o, origenId: null, fechaSugerida: '' })}
        onCambio={() => { setError(null); cargar(); }} />

      {pidiendo && (
        <SolicitarFecha
          oferta={pidiendo.oferta}
          origenId={pidiendo.origenId}
          fechaSugerida={pidiendo.fechaSugerida}
          onCerrar={() => setPidiendo(null)}
          onEnviada={() => { setPidiendo(null); setRefrescar(n => n + 1); cargar(); }}
        />
      )}

      <div style={{ background: '#fff', border: `1px solid ${A.line}`, borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: canjes.length ? `1px solid ${A.line}` : 'none' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: A.ink }}>Lo que usaste</div>
        </div>
        {canjes.length === 0 ? (
          <div style={{ padding: '28px 20px', textAlign: 'center', fontSize: 13, color: A.muted }}>
            Todavía no usaste ningún descuento.{' '}
            <button onClick={onExplorar} style={{ background: 'none', border: 'none', color: A.primary, fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
              Ver ofertas
            </button>
          </div>
        ) : canjes.map((c, i) => (
          <div key={c.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
            borderBottom: i === canjes.length - 1 ? 'none' : `1px solid ${A.line}`,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: A.ink }}>{c.promociones?.titulo || 'Oferta'}</div>
              <div style={{ fontSize: 11.5, color: A.muted, marginTop: 1 }}>{c.negocios?.nombre}</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: A.green }}>{fmt(c.ahorro_monto)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
