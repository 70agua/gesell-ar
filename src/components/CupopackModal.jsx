// ============================================================
//  src/components/CupopackModal.jsx
//  Modal de un Cupopack: la pila de sus cupones + resumen de checkout.
//
//  Vista de entrada: una VENTANA FLOTANTE (no pantalla completa) con un solo
//  eje de scroll, y adentro, en orden: cabecera con identidad Cuponear y la
//  pila de cupones, coronada por la barra fija "Resumen del Cupopack" y
//  cerrada por el precio. Pila + barra + precio son UN paquete: ver §cierre.
//
//  La pila es lo único no evidente. Cada cupón entra grande y, al llegar a su
//  altura de anclaje, se encoge hasta quedar de un renglón y se queda ahí:
//  arriba se va acumulando la lista de los que ya viste, abajo sigue el que
//  estás mirando. Cómo está hecho, en §pila.
//
//  Vista de detalle (coverflow) idéntica al original.
// ============================================================
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getBeneficioIcon } from '../lib/beneficioIconos';
import { aplicarBeneficioCupopack, tipoBeneficio } from '../lib/beneficiosCupopack';
import { usePasePropio } from '../lib/pasePropio';
import { encajeEnPase, cupopackAplicado, aplicarCupopack, deshacerCupopack, sobrantesDeCupopack, precioSobrantes, cuponAOferta } from '../lib/cupopacks';
import { useCarrito } from '../lib/carrito';
import { puntosDeCompra } from '../lib/gamificacion';
import PaSSMark from './PaSSMark';

const C = {
  ink:      '#0B1020',
  ink2:     '#3D4255',
  muted:    '#6B7280',
  line:     '#E7E9EE',
  primary:  '#475BE1',
  primaryDeep: '#1b265d',
  primarySoft: '#EEF0FD',
  green:    '#10A36B',
  bg:       '#F7F7F8',
  yellow:   '#FFC93C',
  font:     "'Inter', system-ui, sans-serif",
};

const TABS = [
  { key: 'detalles', label: 'Detalles del cupón' },
  { key: 'acerca',   label: 'Acerca de' },
  { key: 'mapa',     label: 'Mapa' },
];

const ChevL = ({ s = 22 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
const ChevR = ({ s = 22 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6"/></svg>;
const IcoClose = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>;
const IcoPin = ({ s = 13 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="9" r="2"/></svg>;
const IcoCheck = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M20 6 9 17l-5-5"/></svg>;
const Share = ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;
const Heart = ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ─── Cover lateral (el "lomo" de las fichas vecinas) ─────────
function SideCover({ cupon, side, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={side === 'left' ? 'Cupón anterior' : 'Cupón siguiente'}
      className="cupon-sidecover"
      style={{
        position: 'absolute', top: '50%', [side]: 0,
        transform: `translateY(-50%) translateX(${side === 'left' ? '-62%' : '62%'}) scale(0.92)`,
        width: 320, height: '76%', borderRadius: 22, overflow: 'hidden',
        border: 'none', padding: 0, cursor: 'pointer',
        boxShadow: '0 20px 50px -20px rgba(5,10,25,0.6)',
        opacity: 0.62, zIndex: 1, transition: 'opacity .25s, transform .25s',
        filter: 'saturate(0.9)',
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '0.62'; }}
    >
      <img src={cupon.imagen} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,10,25,0.9) 0%, rgba(5,10,25,0.35) 55%, rgba(5,10,25,0.1) 100%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '18px 18px 22px', textAlign: 'left' }}>
        {cupon.badge && <div style={{ fontSize: 20, fontWeight: 900, color: C.yellow, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 8 }}>{cupon.badge}</div>}
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{cupon.titulo}</div>
      </div>
    </button>
  );
}

function DetalleItem({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: C.ink2, lineHeight: 1.5 }}>
      <span style={{ marginTop: 2 }}><IcoCheck /></span>
      <span>{children}</span>
    </div>
  );
}

// ─── Mini-mapa con un solo punto (la ubicación del cupón) ───
function PuntoMapa({ lat, lng, label }) {
  const mapRef     = useRef(null);
  const leafletRef = useRef(null);
  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;
    const L = window.L;
    if (!L) return;
    const map = L.map(mapRef.current, { center: [lat, lng], zoom: 15, zoomControl: true, scrollWheelZoom: false });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 19, attribution: '&copy; <a href="https://carto.com/">CARTO</a>' }).addTo(map);
    const icon = L.divIcon({
      className: '',
      html: `<div style="background:#475BE1;border:3px solid #fff;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(71,91,225,0.45)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>
      </div>`,
      iconSize: [40, 40], iconAnchor: [20, 20],
    });
    L.marker([lat, lng], { icon }).addTo(map).bindTooltip(label || 'Ubicación', { direction: 'top', offset: [0, -22] });
    leafletRef.current = map;
    setTimeout(() => map.invalidateSize(), 120);
    return () => { map.remove(); leafletRef.current = null; };
  }, [lat, lng, label]);
  return <div ref={mapRef} style={{ height: 340, borderRadius: 16, border: `1px solid ${C.line}` }} />;
}

// ─── Ficha central (se remonta por key={idx} → resetea tab/scroll) ─
function CuponCard({ cupon, cupones, idx, dir, onClose, onBack }) {
  const [tab, setTab]           = useState('detalles');
  const [mapReady, setMapReady] = useState(false);
  const scrollRef = useRef(null);
  const detRef    = useRef(null);
  const aboRef    = useRef(null);
  const mapRef    = useRef(null);
  const spyLock   = useRef(false);

  const goTab = (key) => {
    setTab(key);
    if (key === 'mapa') setMapReady(true);
    const map = { detalles: detRef, acerca: aboRef, mapa: mapRef };
    const el  = map[key]?.current;
    const cont = scrollRef.current;
    if (el && cont) {
      spyLock.current = true;
      cont.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
      setTimeout(() => { spyLock.current = false; }, 500);
    }
  };

  const onScroll = () => {
    const cont = scrollRef.current;
    if (!cont) return;
    if (mapRef.current && mapRef.current.offsetTop - cont.scrollTop < cont.clientHeight * 0.9) {
      setMapReady(true);
    }
    if (spyLock.current) return;
    const y = cont.scrollTop + 80;
    let active = 'detalles';
    if (aboRef.current && y >= aboRef.current.offsetTop) active = 'acerca';
    if (mapRef.current && y >= mapRef.current.offsetTop) active = 'mapa';
    setTab(active);
  };

  return (
    <div
      className="cupon-card"
      style={{
        position: 'relative', zIndex: 2,
        width: '100%', height: '100%',
        background: '#fff', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        animation: `${dir >= 0 ? 'cuponInR' : 'cuponInL'} .34s cubic-bezier(0.22,1,0.36,1)`,
      }}
    >
      {/* Header */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 18px 12px', borderBottom: `1px solid ${C.line}`, minHeight: 52 }}>
        <button onClick={onBack} aria-label="Volver" style={{ position: 'absolute', left: 18, flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px 0 10px', borderRadius: 999, border: `1px solid ${C.line}`, background: '#fff', color: C.ink2, cursor: 'pointer', fontFamily: C.font, fontSize: 13.5, fontWeight: 600 }}
          onMouseEnter={e => { e.currentTarget.style.background = C.bg; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
        ><ChevL s={18} /> Volver</button>

        <div style={{ fontSize: 17, fontWeight: 800, color: C.ink, letterSpacing: '-0.01em' }}>Cupón {idx + 1} de {cupones.length}</div>

        <button onClick={onClose} aria-label="Cerrar" style={{ position: 'absolute', right: 18, flexShrink: 0, width: 36, height: 36, borderRadius: '50%', border: `1px solid ${C.line}`, background: '#fff', color: C.ink2, display: 'grid', placeItems: 'center', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.background = C.bg; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
        ><IcoClose /></button>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, padding: '0 12px', borderBottom: `1px solid ${C.line}`, flexShrink: 0, overflowX: 'auto' }} className="cupon-tabs">
        {TABS.map(t => (
          <button key={t.key} onClick={() => goTab(t.key)}
            style={{
              position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
              padding: '13px 12px', fontSize: 13.5, fontWeight: tab === t.key ? 700 : 500,
              color: tab === t.key ? C.primary : C.ink2, whiteSpace: 'nowrap', fontFamily: C.font,
            }}
          >
            {t.label}
            {tab === t.key && <span style={{ position: 'absolute', left: 12, right: 12, bottom: 0, height: 2.5, borderRadius: 3, background: C.primary }} />}
          </button>
        ))}
      </div>

      {/* Contenido scrolleable con las 3 subsecciones */}
      <div ref={scrollRef} onScroll={onScroll} style={{ flex: 1, overflowY: 'auto', position: 'relative' }} className="cupon-scroll">
        <section ref={detRef}>
          <div style={{ position: 'relative', height: 220 }}>
            <img src={cupon.imagen} alt={cupon.titulo} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,10,25,0.6) 0%, transparent 60%)' }} />
            {cupon.badge && (
              <div style={{ position: 'absolute', top: 14, left: 16, background: C.yellow, color: C.ink, padding: '7px 14px', borderRadius: 999, fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 }}>{cupon.badge}</div>
            )}
            {cupon.localidad && (
              <div style={{ position: 'absolute', bottom: 12, left: 16, display: 'inline-flex', alignItems: 'center', gap: 5, color: '#fff', fontSize: 12, fontWeight: 600 }}>
                <IcoPin /> {cupon.localidad}
              </div>
            )}
          </div>

          <div style={{ padding: '20px 22px 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: C.primarySoft, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: C.primary }}>{cupon.socio?.[0]}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.ink2 }}>{cupon.socio}</span>
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em', lineHeight: 1.2, margin: '0 0 10px' }}>{cupon.titulo}</h3>
            {cupon.beneficio && <p style={{ fontSize: 14.5, color: C.ink2, lineHeight: 1.6, margin: '0 0 18px' }}>{cupon.beneficio}</p>}

            {cupon.detalles?.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Qué incluye</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 20 }}>
                  {cupon.detalles.map((d, i) => <DetalleItem key={i}>{d}</DetalleItem>)}
                </div>
              </>
            )}
          </div>

          {cupon.terminos?.length > 0 && (
            <div style={{ margin: '0 22px 8px', padding: '16px 18px', background: C.bg, borderRadius: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Términos y condiciones del canje</div>
              <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {cupon.terminos.map((t, i) => (
                  <li key={i} style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5 }}>{t}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section ref={aboRef} style={{ padding: '22px 22px 8px', borderTop: `1px solid ${C.line}`, marginTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.primary, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Acerca de</div>
          <h3 style={{ fontSize: 19, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em', margin: '0 0 8px' }}>{cupon.socio}</h3>
          {cupon.descripcionSocio && <p style={{ fontSize: 14, color: C.ink2, lineHeight: 1.65, margin: '0 0 16px' }}>{cupon.descripcionSocio}</p>}

          {cupon.galeria?.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {cupon.galeria.slice(0, 3).map((g, i) => (
                <div key={i} style={{ aspectRatio: '1/1', borderRadius: 12, overflow: 'hidden', background: C.line }}>
                  <img src={g} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section ref={mapRef} style={{ padding: '22px 22px 26px', borderTop: `1px solid ${C.line}`, marginTop: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.primary, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Mapa</div>
          <h3 style={{ fontSize: 19, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em', margin: '0 0 4px' }}>Dónde canjear</h3>
          <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, margin: '0 0 16px' }}>
            Ubicación de <strong style={{ color: C.ink2 }}>{cupon.socio}</strong>{cupon.localidad ? ` · ${cupon.localidad}` : ''}.
          </p>
          {mapReady && cupon.lat && cupon.lng ? (
            <PuntoMapa lat={cupon.lat} lng={cupon.lng} label={cupon.socio} />
          ) : (
            <div style={{ height: 320, borderRadius: 16, border: `1px solid ${C.line}`, background: C.bg, display: 'grid', placeItems: 'center', color: C.muted, fontSize: 13 }}>
              {cupon.lat && cupon.lng ? 'Cargando mapa…' : 'Sin ubicación disponible'}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ─── Recuadro del beneficio adicional ──
// Dos renglones y nada más: el rótulo y el beneficio. La tercera línea repetía
// en jerga lo que el título ya dice ("Triplicás los puntos" / "Multiplicás tus
// puntos ×3") y engordaba el recuadro justo arriba del precio.
function BeneficioBox({ texto, icono }) {
  const Icon = getBeneficioIcon(icono);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: 'rgba(255,201,60,0.14)',
      border: '1px solid rgba(255,201,60,0.4)', borderRadius: 16, padding: '13px 16px',
    }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.yellow, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <Icon size={18} color={C.ink} strokeWidth={2.4} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: C.yellow, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
          Beneficio adicional
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: '#fff', lineHeight: 1.25 }}>{texto}</div>
      </div>
    </div>
  );
}

// ─── §pila · Ficha de un cupón dentro de la pila ─────────────
// UNA sola caja para los dos estados, no dos componentes que se intercambian:
// cambiar de componente a mitad de camino corta la continuidad justo en el
// momento en que el usuario está mirando el cambio. Acá todo interpola contra
// --p (0 = ficha grande, 1 = renglón), que escribe el scroll en el nodo.
function CuponPila({ cupon, i, esRegalo, onOpen }) {
  const fmt = n => `$${Math.round(Number(n) || 0).toLocaleString('es-AR')}`;
  return (
    <div className={`cp-card${esRegalo ? ' cp-card-regalo' : ''}`} style={{ '--i': i }}>
      {/* Contenido en <span>: el modelo de contenido de <button> no admite
          <div>, y toda la ficha tiene que ser un solo objetivo clickeable. */}
      <button className="cp-inner" onClick={onOpen} aria-label={`Ver el cupón ${cupon.titulo}`}>
        <span className="cp-thumb">
          <img src={cupon.imagen} alt="" />
          {esRegalo && <span className="cp-regalo">REGALO</span>}
        </span>
        <span className="cp-texto">
          {/* Socio y localidad juntos, y los dos enteros. Lo que los cortaba
              no era el espacio sino el `nowrap`: sin él la línea envuelve, y
              como el alto de fila se mide (§medida), la fila crece sola para
              alojarla. El · va pegado al socio con espacio duro para que el
              corte, si pasa, caiga antes de la localidad y no deje el punto
              huérfano abriendo el segundo renglón. */}
          <span className="cp-socio">
            {cupon.socio}{cupon.localidad ? <>{'\u00A0·'} {cupon.localidad}</> : null}
          </span>
          <span className="cp-titulo">{cupon.titulo}</span>
          {cupon.beneficio && <span className="cp-benef">{cupon.beneficio}</span>}
        </span>
        <span className="cp-lado">
          {cupon.badge && <span className="cp-badge">{cupon.badge}</span>}
          {cupon.ahorro_estimado > 0 && <span className="cp-ahorro">Ahorrás {fmt(cupon.ahorro_estimado)} aprox.</span>}
        </span>
      </button>
    </div>
  );
}

// ─── §plantilla · Pie para el que YA tiene el Pase ───────────
//
// Al que tiene Pase activo no se le vende nada: sus cupones regulares ya vienen
// con el Pase, y los premium se ELIGEN — ocupan uno de los slots que ya pagó.
// Por eso este pie reemplaza al checkout entero en vez de convivir con él;
// mostrarle un precio a quien no tiene que pagar es la peor de las dos.
//
// Reversible en un tap, como manda §5 de 3-cupopacks.md: un pack cerrado que no
// se puede deshacer genera rechazo, y la elección se libera hasta el canje.
function PieConPase({ cupones, onVerPase }) {
  const fmt = n => `$${Math.round(n).toLocaleString('es-AR')}`;
  const { pase, libres, total, premiumIlimitado, elegidasIds, refrescar } = usePasePropio();
  const { addCupon } = useCarrito();
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState(null);

  const { premium, entran, sobran } = encajeEnPase(cupones, libres);
  // §3, tercer caso: los premium que no entran se pagan sueltos, a precio
  // individual y sin beneficio adicional ni descuento. Una sola vía —el mismo
  // botón llena los slots y manda el resto al carrito—: ofrecerle además el
  // pack completo sería venderle de nuevo lo que ya pagó con el Pase.
  const sobrantes = sobrantesDeCupopack(cupones, libres);
  const aPagar    = precioSobrantes(sobrantes);
  const puesto    = cupopackAplicado(cupones, elegidasIds, libres || premium.length);
  const regulares = cupones.length - premium.length;

  // Si está puesto, lo que hay que soltar es lo elegido, no lo que "entra":
  // con los slots llenos `libres` es 0 y `entran` vendría vacío.
  const aDeshacer = premium.filter(c => elegidasIds.includes(c.id));

  const accionar = async () => {
    if (!pase || ocupado) return;
    setOcupado(true); setAviso(null);
    const r = puesto
      ? await deshacerCupopack(pase.id, cupones, elegidasIds)
      : await aplicarCupopack(pase.id, cupones, libres);
    await refrescar();
    setOcupado(false);

    if (puesto) {
      // Lo ya canjeado no se suelta, y eso no es un error: es el único estado
      // que congela la elección. Se dice, no se esconde.
      if (r.fallidos.length) setAviso(`${r.quitados.length} liberados. ${r.fallidos.length} ya los canjeaste y quedan en tu Pase.`);
      else setAviso(null);
    } else {
      if (r.fallidos.length) setAviso(r.fallidos[0].texto);
      // Los sobrantes van al carrito recién después de ocupar los slots: si el
      // llenado falla, no queremos haberle cobrado la parte de arriba.
      sobrantes.forEach(c => addCupon(cuponAOferta(c)));
    }
  };

  const sinLugar = !puesto && entran.length === 0 && premium.length > 0;

  return (
    <section className="cp-checkout">
      <p className="cp-pase-rotulo">Tenés el <PaSSMark size={12} conPrefijo /></p>

      {/* El estado se dice en una frase, no en una tabla: cuántos ya vienen y
          cuántos ocupan lugar. Nunca "incluye": los regulares vienen con el
          Pase, los premium se eligen. */}
      <p className="cp-promesa" style={{ textAlign: 'left' }}>
        {regulares > 0 && (
          <>{regulares} {regulares === 1 ? 'cupón ya viene' : 'cupones ya vienen'} con tu Pase. </>
        )}
        {premium.length > 0
          ? <>Los {premium.length === 1 ? 'otro' : `otros ${premium.length}`} son beneficios PREMIUM <strong>elegidos por nosotros</strong>.</>
          : <>No hay nada más que elegir.</>}
      </p>

      {premium.length > 0 && (
        <p className="cp-puntos" style={{ textAlign: 'left', fontStyle: 'normal' }}>
          {puesto
            ? (premiumIlimitado
                ? `Puestos: sin tope de beneficios PREMIUM en tu Pase. Podés sacarlos cuando quieras.`
                : `Ocupan ${aDeshacer.length} de tus ${total}. Podés sacarlos o cambiar cualquiera cuando quieras.`)
            : sinLugar
              ? 'No te quedan beneficios PREMIUM disponibles.'
              : sobran > 0
                ? `${entran.length} ocupan los ${libres} que te quedan. ${sobran === 1 ? 'El otro no entra y va suelto' : `Los otros ${sobran} no entran y van sueltos`}, a precio individual.`
                : premiumIlimitado
                  ? `Los ${entran.length} entran sin tope: tu Pase no tiene límite de premium.`
                  : `Ocupan ${entran.length} de los ${libres} que te quedan.`}
        </p>
      )}

      {/* El precio del tercer caso va acá y no en el botón: el botón hace dos
          cosas —ocupar slots y sumar al carrito— y meterle la cifra adentro
          haría parecer que se paga todo. */}
      {!puesto && !sinLugar && aPagar > 0 && (
        <p className="cp-pase-pagar">
          A pagar por {sobran === 1 ? 'ese cupón' : `esos ${sobran} cupones`}: <strong>{fmt(aPagar)}</strong>
          <span> · te deja {puntosDeCompra(aPagar).toLocaleString('es-AR')} puntos</span>
        </p>
      )}

      {aviso && <p className="cp-pase-aviso">{aviso}</p>}

      {premium.length > 0 && (
        sinLugar
          ? <button className="cp-cta cp-cta-hueco" onClick={onVerPase}>Ver mi Pase</button>
          : (
            <button className={`cp-cta${puesto ? ' cp-cta-hueco' : ''}`} onClick={accionar} disabled={ocupado}>
              {ocupado ? 'Un segundo…'
                : puesto ? 'Sacarlos de mi Pase'
                : sobran > 0 ? 'Elegirlos y sumar el resto' : 'Elegirlos con mi Pase'}
            </button>
          )
      )}

      <p className="cp-legal">
        Elegir un beneficio PREMIUM no lo reserva ni lo confirma: lo guarda para que lo canjees
        en el comercio. Cada uno tiene sus propios términos, que podés ver en su detalle.
      </p>
    </section>
  );
}

// ─── Pie del paquete: el precio y nada más ───────────────────
// Ya no lleva título propio: el del paquete es la barra fija "Resumen del
// Cupopack" que corona la pila, y repetirlo acá partía en dos algo que es una
// sola cosa. Cierra el recorrido —se llega después de haber pasado por todos
// los cupones, que es cuando el precio se puede juzgar.
//
// Todo apilado, sin tabular: qué se lleva (los N cupones y el ahorro, en una
// frase), los puntos que deja, el botón —que lleva el precio adentro— y la
// letra chica. Ni el ahorro ni los puntos son filas propias: enfrentados en
// columna contra el precio parecían tres cifras a comparar. Y el precio no es
// un bloque aparte: dentro del botón, la decisión queda entera en un objeto.
function CheckoutResumen({ cupopack, totalAhorro, totalPuntos, puntosTachado, precioFinal, precioTachado }) {
  const fmt = n => `$${Math.round(n).toLocaleString('es-AR')}`;

  // Dónde impacta el beneficio adicional: 'puntos' | 'precio' | null.
  const afecta = cupopack?.beneficioAdicional ? tipoBeneficio(cupopack.beneficioTipo).afecta : null;
  const beneficioBox = (
    <BeneficioBox texto={cupopack?.beneficioAdicional} icono={cupopack?.beneficioIcono} />
  );

  return (
    <section className="cp-checkout">
      {/* El beneficio adicional, sea del tipo que sea, va junto al precio: es
          lo único que queda en este bloque de lo que puede modificarlo. */}
      {(afecta === 'puntos' || afecta === 'precio') && (
        <div style={{ marginBottom: 20 }}>{beneficioBox}</div>
      )}

      {/* Qué se lleva. Generoso pero no del tamaño del precio: es la promesa,
          y la cifra del botón es la que se decide. El conteo salió de acá: ya
          está en el chip de la cabecera, que además queda fijo, y repetirlo le
          robaba el renglón al único dato que este bloque tiene para aportar. */}
      {totalAhorro > 0 && (
        <p className="cp-promesa">
          Ahorro total estimado de <strong>{fmt(totalAhorro)}</strong>
        </p>
      )}

      {/* Los puntos, colgados de la promesa: son un vuelto de la compra, no
          otro número de la cuenta. En itálica y amarillo —el del CTA— para que
          se lean como un aparte y no como parte del precio; sin negrita, que es
          el peso que en este bloque se reserva para las cifras que se deciden. */}
      {totalPuntos > 0 && (
        <p className="cp-puntos">
          Ganás {totalPuntos.toLocaleString('es-AR')} puntos
          {afecta === 'puntos' && puntosTachado != null && <> (×{cupopack.beneficioValor})</>}
        </p>
      )}

      {/* El precio va DENTRO del botón: es la decisión completa en un solo
          objeto, sin que el ojo tenga que juntar una cifra de arriba con una
          acción de abajo. Y si hay descuento, el precio viejo se tacha acá
          mismo —al lado del que se paga—, que es donde la comparación sirve. */}
      <button className="cp-cta" style={{ marginTop: 22 }}>
        <span>Comprar Cupopack</span>
        <span className="cp-cta-sep" aria-hidden="true" />
        <span className="cp-cta-precio">
          {precioTachado != null && <s>{fmt(precioTachado)}</s>}
          {fmt(precioFinal)}
        </span>
      </button>
      <p className="cp-legal">
        Estás comprando los descuentos, no los servicios ni productos en sí. Cada beneficio tiene sus propios términos y condiciones de canje, que podés ver en la sección "Qué incluye" de cada cupón.
      </p>
    </section>
  );
}

export default function CupopackModal({ cupopack, startIndex = 0, onClose, onVerPase }) {
  const cupones = cupopack?.cupones || [];
  // Pendiente cuenta igual: ya lo compró. Venderle los cupones sueltos a quien
  // pagó el Pase es cobrarle dos veces por lo mismo.
  const { activo, pendiente } = usePasePropio();
  const tienePase = activo || pendiente;
  const [view, setView] = useState('grid');  // 'grid' o 'detail'
  const [idx, setIdx] = useState(startIndex);
  const [dir, setDir] = useState(0);
  // Índice del cupón cuyo detalle se está por abrir, a la espera de confirmar.
  const [aConfirmar, setAConfirmar] = useState(null);
  const scrollRef = useRef(null);
  const stackRef  = useRef(null);
  const rafRef    = useRef(0);

  const go = useCallback((d) => {
    setIdx(prev => {
      const next = clamp(prev + d, 0, cupones.length - 1);
      if (next !== prev) setDir(d);
      return next;
    });
  }, [cupones.length]);

  const totalPrecio = cupones.reduce((sum, c) => {
    const precio = c.precio_activacion || c.precioDe || parseFloat(c.precio) || 0;
    return sum + precio;
  }, 0);
  const totalAhorro = cupones.reduce((sum, c) => sum + (Number(c.ahorro_estimado) || 0), 0);

  // Los puntos salen de acá y no se calculan en esta pantalla: son el 5% de lo
  // que se paga, igual que en cualquier compra. Ver la advertencia en
  // lib/beneficiosCupopack.js sobre por qué no se derivan del ahorro.
  const { puntos: totalPuntos, precio: precioFinal, puntosTachado, precioTachado } =
    aplicarBeneficioCupopack({
      tipo:  cupopack?.beneficioTipo,
      valor: cupopack?.beneficioValor,
      precioBase: totalPrecio,
    });

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      else if (view === 'detail') {
        if (e.key === 'ArrowRight') go(1);
        else if (e.key === 'ArrowLeft') go(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; };
  }, [go, onClose, view]);

  // §pila · El encogido de cada ficha.
  //
  // No pasa por el estado de React: sería un re-render de todo el modal por
  // frame de scroll. El rAF escribe --p directo en el nodo y el resto lo
  // resuelve el CSS interpolando contra esa variable.
  //
  // Las medidas se leen de las custom properties de .cp-scroll en vez de estar
  // acá: así el breakpoint que achica la pila en mobile no obliga a mantener
  // los mismos números sincronizados en dos lugares.
  useEffect(() => {
    const cont = scrollRef.current;
    const stack = stackRef.current;
    if (view !== 'grid' || !cont || !stack) return;

    const cards = Array.from(stack.querySelectorAll('.cp-card'));

    // §medida · Cuánto mide un renglón, de verdad.
    //
    // El alto de fila no puede ser una constante: un título de dos o tres
    // líneas no entra en una fila pensada para una, y recortarlo no es opción
    // —tiene que leerse entero—. Así que se pregunta.
    //
    // Sale UN alto para todas y no uno por ficha a propósito. El anclaje de
    // cada una es `título + i × alto`, y con filas de alturas distintas habría
    // que acumular sumas parciales en cuatro fórmulas más (el margen y el
    // mínimo del checkout de §cierre entre ellas). Una lista de renglones
    // parejos además se lee mejor que una de renglones de alturas caprichosas.
    const hero = cont.querySelector('.cp-hero');
    const medir = () => {
      // La clase fuerza el estado final —cabecera reducida, fichas de un
      // renglón— para poder preguntar cuánto miden así. Es un ciclo de layout
      // sincrónico, sin pintado en el medio, así que no parpadea.
      cont.classList.add('cp-midiendo');

      // La cabecera reducida es el techo del que cuelgan todos los anclajes.
      // Se mide REDUCIDA y no entera porque para cuando la primera ficha llega
      // a anclarse ya terminó de encogerse hace rato.
      if (hero) cont.style.setProperty('--title-h', `${Math.ceil(hero.offsetHeight)}px`);

      let alto = 0;
      cards.forEach(el => {
        const inner = el.querySelector('.cp-inner');
        if (inner) alto = Math.max(alto, inner.offsetHeight);
      });
      cont.classList.remove('cp-midiendo');

      const cs = getComputedStyle(cont);
      const rowGap = parseFloat(cs.getPropertyValue('--row-gap')) || 8;
      if (alto > 0) cont.style.setProperty('--row-h', `${Math.ceil(alto) + rowGap}px`);
    };

    const pintar = () => {
      rafRef.current = 0;
      const cs = getComputedStyle(cont);
      const rowH   = parseFloat(cs.getPropertyValue('--row-h'))   || 58;
      const titleH = parseFloat(cs.getPropertyValue('--title-h')) || 54;
      const tope   = parseFloat(cs.getPropertyValue('--tope'))     || 0;
      const trans  = parseFloat(cs.getPropertyValue('--trans'))   || 130;
      const transH = parseFloat(cs.getPropertyValue('--trans-h')) || 150;

      // La cabecera se encoge contra el scroll crudo, no contra la posición de
      // ningún elemento: es lo primero que se mueve y no depende de nada.
      if (hero) hero.style.setProperty('--h', clamp(cont.scrollTop / transH, 0, 1).toFixed(3));

      // El alto visible del scroll no se puede escribir en CSS, y de él depende
      // el mínimo del checkout —lo que hace que el último scroll termine justo
      // con el paquete armado y no en un vacío. Ver §cierre.
      cont.style.setProperty('--vh', `${cont.clientHeight}px`);

      const contTop = cont.getBoundingClientRect().top;
      cards.forEach((el, i) => {
        // Distancia de la ficha al techo del área visible del scroll, contra
        // la altura en la que le toca anclarse. Una vez anclada, `rel` queda
        // clavado en `anclaje` y --p se queda en 1 sin trabajo extra.
        const rel = el.getBoundingClientRect().top - contTop;
        const anclaje = titleH + tope + i * rowH;
        const p = clamp((anclaje + trans - rel) / trans, 0, 1);
        el.style.setProperty('--p', p.toFixed(3));
      });
    };
    const agendar = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(pintar); };
    // Sólo el ANCHO obliga a volver a medir: es lo que cambia los cortes de
    // línea. El alto cambia solo por la barra del navegador al scrollear en
    // mobile, y remedir en cada scroll es trabajo al pedo sobre el eje caliente.
    let anchoPrevio = cont.clientWidth;
    const alRedimensionar = () => {
      if (cont.clientWidth !== anchoPrevio) { anchoPrevio = cont.clientWidth; medir(); }
      agendar();
    };

    medir();
    pintar();
    // Si Inter todavía no cargó, la medición sale con la tipografía de reserva
    // y los títulos cortan en otro lado. Se vuelve a preguntar cuando esté.
    document.fonts?.ready.then(() => { if (stackRef.current) alRedimensionar(); });
    cont.addEventListener('scroll', agendar, { passive: true });
    window.addEventListener('resize', alRedimensionar);
    return () => {
      cont.removeEventListener('scroll', agendar);
      window.removeEventListener('resize', alRedimensionar);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [view, cupones.length]);

  const cupon = cupones[idx];
  const portada = cupopack?.images?.[0];
  // Si el beneficio regala un cupón, marcamos el último como "de regalo".
  const regaloIdx = cupopack?.beneficioTipo === 'cupon_regalo' ? cupones.length - 1 : -1;

  const overlay = (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9500, fontFamily: C.font }}>
      {view === 'grid' ? (
        // ─── Vista de entrada: ventana flotante con un solo scroll ───
        <div className="cp-overlay" onClick={onClose}>
          <div className="cp-window" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={cupopack?.title}>

            {/* Acciones: van sobre la imagen de cabecera, pero colgadas de la
                ventana y no del scroll. Al bajar la cabecera se va y el cierre
                tiene que seguir estando; el fondo oscuro traslúcido las hace
                legibles tanto sobre la foto como sobre el blanco de la pila. */}
            <div className="cp-acciones">
              <button aria-label="Compartir" className="cp-ico"><Share size={17} /></button>
              <button aria-label="Favorito" className="cp-ico"><Heart size={17} /></button>
              <button onClick={onClose} aria-label="Cerrar" className="cp-ico"><IcoClose /></button>
            </div>

            {/* Salir del Cupopack al detalle de un cupón es un cambio de
                contexto completo —se pierde la pila y el precio de vista—, así
                que se avisa antes en vez de después. */}
            {aConfirmar != null && (
              <div className="cp-confirm" onClick={() => setAConfirmar(null)}>
                <div className="cp-confirm-caja" onClick={e => e.stopPropagation()} role="alertdialog" aria-modal="true">
                  <div className="cp-confirm-tit">Vas a salir del Cupopack</div>
                  <p className="cp-confirm-txt">
                    Se abre el detalle de <strong>{cupones[aConfirmar]?.titulo}</strong>. Vas a poder volver al Cupopack desde ahí.
                  </p>
                  <div className="cp-confirm-btns">
                    <button className="cp-confirm-no" onClick={() => setAConfirmar(null)}>Cancelar</button>
                    <button className="cp-confirm-si" onClick={() => { setIdx(aConfirmar); setAConfirmar(null); setView('detail'); }}>
                      Ver el cupón
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div
              className="cp-scroll cupon-scroll"
              ref={scrollRef}
              style={{ '--n': cupones.length }}
            >
              {/* Cabecera: identidad Cuponear + nombre del Cupopack */}
              {/* Cabecera: la de siempre —portada, logo, título, descripción y
                  chip— pero fija arriba y encogiéndose al scrollear.

                  Al reducirse quedan el nombre del Cupopack y el chip, los dos
                  a tamaño pleno y sobre la misma imagen. Se van el logo y la
                  descripción, que son contexto de entrada y no hacen falta para
                  saber qué estás mirando mientras recorrés los cupones. Los
                  botones de acción no participan: cuelgan de la ventana, no del
                  scroll, así que ya estaban siempre.

                  El encogido lo maneja --h (0 entera → 1 reducida), que escribe
                  el scroll igual que --p en las fichas. */}
              <header className="cp-hero">
                {portada && (
                  <>
                    <img src={portada} alt="" className="cp-hero-bg" />
                    <div className="cp-hero-velo" />
                  </>
                )}
                <div className="cp-hero-in">
                  <span className="cp-logo-caja">
                    <img src="/logo-cuponear-wh.svg" alt="Cuponear" className="cp-logo" />
                  </span>

                  <h1 className="cupon-title">{cupopack?.title}</h1>

                  {cupopack?.subtitle && <p className="cp-hero-sub">{cupopack.subtitle}</p>}

                  {/* El conteo va DESPUÉS de la descripción: es el dato que
                      cierra la promesa, no el que la abre. */}
                  <div className="cp-chip-caja">
                    <span className="cp-chip">{cupones.length} cupones incluidos</span>
                  </div>
                </div>
              </header>

              {/* §pila · Las fichas son hermanas de UN mismo contenedor junto al
                  título, y ahí está la gracia: `sticky` se suelta al terminar el
                  bloque que lo contiene, así que si cada una tuviera su propia
                  caja se despegaría al pasar y no se acumularía nada.

                  El checkout queda AFUERA a propósito. Siendo hermano, el borde
                  de .cp-pack es su techo: cuando el paquete no entra —mobile—
                  el checkout al subir empuja al título y a los renglones fuera
                  de cuadro, que es la única salida honesta cuando no hay lugar
                  para todo. Adentro, en cambio, nada se movería nunca. */}
              <div className="cp-pack" ref={stackRef}>
                {cupones.map((c, i) => (
                  <CuponPila
                    key={c.id}
                    cupon={c}
                    i={i}
                    esRegalo={i === regaloIdx}
                    onOpen={() => setAConfirmar(i)}
                  />
                ))}
              </div>

              {/* Dos pies para el mismo Cupopack, y sólo uno a la vez. Con el
                  Pase activo no hay nada que comprar —los regulares vienen con
                  él y los premium se eligen—, así que el checkout no se
                  atenúa: se reemplaza. Ver §plantilla. */}
              {tienePase ? (
                <PieConPase cupones={cupones} onVerPase={() => { onClose?.(); onVerPase?.(); }} />
              ) : (
                <CheckoutResumen
                  cupopack={cupopack}
                  totalAhorro={totalAhorro} totalPuntos={totalPuntos} puntosTachado={puntosTachado}
                  precioFinal={precioFinal} precioTachado={precioTachado}
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        // ─── Vista Detail: detalle de cupón (idéntica al original) ───
        <div
          onClick={onClose}
          style={{
            position: 'absolute', inset: 0, background: 'rgba(5,10,25,0.72)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="cupon-stage"
            style={{ position: 'relative', width: '100%', maxWidth: 640, height: '86vh', maxHeight: 780, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {idx > 0 && <SideCover cupon={cupones[idx - 1]} side="left" onClick={() => go(-1)} />}
            {idx < cupones.length - 1 && <SideCover cupon={cupones[idx + 1]} side="right" onClick={() => go(1)} />}

            <div style={{
              position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
              background: '#fff', borderRadius: 24, overflow: 'hidden',
              boxShadow: '0 40px 90px -30px rgba(5,10,25,0.7), 0 0 0 1px rgba(255,255,255,0.14)',
            }}>
              <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
                <CuponCard
                  key={idx}
                  cupon={cupon}
                  cupopack={cupopack}
                  cupones={cupones}
                  idx={idx}
                  dir={dir}
                  onClose={onClose}
                  onBack={() => setView('grid')}
                />
              </div>
            </div>

            <button
              onClick={e => { e.stopPropagation(); go(-1); }}
              disabled={idx === 0}
              className="cupon-nav-arrow"
              style={{ ...arrowSt, left: -75, opacity: idx === 0 ? 0.3 : 1, pointerEvents: idx === 0 ? 'none' : 'auto', cursor: idx === 0 ? 'default' : 'pointer' }}
              aria-label="Anterior"
            ><ChevL /></button>
            <button
              onClick={e => { e.stopPropagation(); go(1); }}
              disabled={idx === cupones.length - 1}
              className="cupon-nav-arrow"
              style={{ ...arrowSt, right: -75, opacity: idx === cupones.length - 1 ? 0.3 : 1, pointerEvents: idx === cupones.length - 1 ? 'none' : 'auto', cursor: idx === cupones.length - 1 ? 'default' : 'pointer' }}
              aria-label="Siguiente"
            ><ChevR /></button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes cuponInR { from { opacity: 0; transform: translateX(40px) scale(0.97); } to { opacity: 1; transform: translateX(0) scale(1); } }
        @keyframes cuponInL { from { opacity: 0; transform: translateX(-40px) scale(0.97); } to { opacity: 1; transform: translateX(0) scale(1); } }
        .cupon-scroll::-webkit-scrollbar { width: 8px; }
        .cupon-scroll::-webkit-scrollbar-thumb { background: rgba(120,130,150,0.35); border-radius: 8px; }
        .cupon-tabs::-webkit-scrollbar { display: none; }

        /* ─── Ventana flotante ───────────────────────────────── */
        .cp-overlay {
          position: absolute; inset: 0;
          background: rgba(5,10,25,0.62); backdrop-filter: blur(5px);
          display: flex; align-items: center; justify-content: center; padding: 26px;
        }
        .cp-window {
          position: relative; display: flex; flex-direction: column;
          width: min(940px, 100%); height: min(90vh, 940px);
          background: #fff; border-radius: 26px; overflow: hidden;
          box-shadow: 0 50px 110px -30px rgba(5,10,25,0.75), 0 0 0 1px rgba(255,255,255,0.12);
        }
        .cp-acciones {
          position: absolute; top: 16px; right: 16px; z-index: 40;
          display: flex; gap: 8px;
        }
        .cp-ico {
          display: grid; place-items: center; cursor: pointer;
          width: 36px; height: 36px; border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.22);
          background: rgba(11,16,32,0.55); backdrop-filter: blur(6px); color: #fff;
          transition: background .15s;
        }
        .cp-ico:hover { background: rgba(11,16,32,0.8); }

        /* Las medidas del paquete viven acá, en el ancestro común de la pila y
           del checkout: los dos las necesitan y el breakpoint las cambia en un
           solo lugar. El JS también las lee de acá para el anclaje. */
        .cp-scroll {
          --big-h: 172px;
          --row-h: 84px;
          --row-gap: 12px;
          --title-h: 54px;
          --gap: 28px;
          --tope: 18px;
          --aire: 26px;
          --aire-fin: 20px;
          --pad-x: 34px;
          --thumb: 150px;
          --thumb-min: 84px;
          --trans: 130px;
          --trans-h: 150px;
          --runway: 140px;
          /* overscroll-behavior: sin esto, al llegar al final de la pila el
             scroll se lo lleva la página de atrás.

             overflow-anchor: OBLIGATORIO acá. El browser, cuando algo que está
             por encima del viewport cambia de alto, corrige el scroll para que
             lo visible no se mueva. Con una cabecera que se encoge contra el
             scroll eso es un bucle: encoge → el browser corrige el scroll →
             cambia --h → cambia el alto → vuelve a corregir. Se ve como un
             parpadeo al bajar y volver a subir. */
          flex: 1; min-height: 0; overflow-y: auto;
          overscroll-behavior: contain; overflow-anchor: none;
        }

        /* Cabecera fija que se encoge. Conserva SU imagen de fondo —no un
           color plano—: la portada es parte de la identidad del Cupopack y al
           reducirse queda de franja, que es lo que había que lograr.

           z-index 3 para ganarle a la pila (2), que al tener z-index propio
           encierra a sus fichas y no las deja pasar por encima.

           El alto reducido no está acá: lo mide el JS (§medida), porque el
           título usa clamp() y cambia con el ancho, y de ese alto cuelga el
           anclaje de todos los renglones. */
        .cp-hero {
          --h: 0;
          position: sticky; top: 0; z-index: 3;
          overflow: hidden;
          padding: calc(18px + (1 - var(--h)) * 14px) var(--pad-x) calc(18px + (1 - var(--h)) * 16px);
          background: linear-gradient(120deg, ${C.primaryDeep} 0%, ${C.primary} 100%);
          color: #fff;
        }
        .cp-hero-bg   { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.9; }
        .cp-hero-velo { position: absolute; inset: 0; background: linear-gradient(120deg, rgba(11,16,32,0.9) 0%, rgba(27,38,93,0.62) 58%, rgba(71,91,225,0.42) 100%); }
        .cp-hero-in   { position: relative; }

        /* El logo colapsa desde una caja y no por su propio max-height: sobre
           el <img> el alto máximo lo escala, y encogerse no es lo mismo que
           irse. Se desvanece ×2.6 para estar fuera bastante antes de cerrar. */
        .cp-logo-caja {
          display: block; overflow: hidden;
          max-height: calc((1 - var(--h)) * 48px);
          margin-bottom: calc((1 - var(--h)) * 22px);
          opacity: calc(1 - var(--h) * 2.6);
        }
        .cp-logo { display: block; height: 48px; width: auto; }

        /* Lo único que NO se encoge. El tope de ancho deja libre la esquina de
           los botones de acción: sin eso, en pantallas angostas un título largo
           se metía debajo de ellos. */
        .cupon-title {
          font-size: 38px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.05;
          margin: 0; max-width: min(20ch, calc(100% - 132px));
        }
        .cp-hero-sub {
          margin: calc((1 - var(--h)) * 12px) 0 0; max-width: 52ch;
          max-height: calc((1 - var(--h)) * 100px); overflow: hidden;
          opacity: calc(1 - var(--h) * 2.6);
          font-size: 15.5px; line-height: 1.55; color: rgba(255,255,255,0.82);
        }
        /* El chip acompaña al título en la franja reducida: dice de cuántos
           cupones es la pila que estás recorriendo, y eso sirve todo el rato.
           Sólo achica su margen, no su cuerpo. */
        .cp-chip-caja { margin-top: calc(10px + (1 - var(--h)) * 6px); }
        .cp-chip {
          display: inline-flex; align-items: center;
          background: rgba(255,201,60,0.18); border: 1px solid rgba(255,201,60,0.4);
          color: ${C.yellow}; padding: 5px 13px; border-radius: 999px;
          font-size: 12.5px; font-weight: 700;
        }

        /* ─── §pila ──────────────────────────────────────────────
           Todo el encogido sale de --p (0 grande → 1 renglón), que escribe el
           scroll.

           z-index 2 sobre el checkout (1): mientras la última ficha sigue
           grande tiene que taparlo, porque el checkout ya está ahí abajo
           —subido por su margen negativo— esperando a que la ficha se cierre
           para aparecer justo debajo del renglón. */
        /* flow-root: sin eso el margen inferior de la última ficha se escapa
           del contenedor en vez de contarse dentro, y toda la aritmética de
           §cierre —que depende del alto exacto de .cp-pack— queda 16px corrida. */
        .cp-pack { position: relative; z-index: 2; display: flow-root; padding: var(--aire) 0 var(--runway); }
        /* La CAJA mide un renglón; la ficha grande le desborda por abajo y la
           siguiente —que pinta encima por tener mayor z-index— tapa lo que
           sobra. El margen inferior repone la diferencia, así el alto del flujo
           sigue siendo el mismo de antes: si cambiara, cada encogido movería el
           scroll bajo el dedo.

           Que la caja mida --row-h y no --big-h es lo que arregla el
           solapamiento. El sticky suelta al elemento cuando su caja ya no entra
           en lo que queda del contenedor: con una caja de 172px la última ficha
           se despegaba apenas 16px después de anclarse y se iba trepando por
           encima de las anteriores. Con 72px el margen pasa a ser de más de
           200px, sumando --runway. */
        /* §medida · Estado efímero: las fichas se pintan como renglón y con
           alto libre para poder preguntarles cuánto miden de verdad. El thumb
           baja a 1px porque su <img> al 100% de un alto automático se resuelve
           contra el alto intrínseco de la foto y falseaba la cuenta; y sin
           stretch, .cp-texto entrega su alto real en vez del del contenedor. */
        .cp-midiendo .cp-hero  { --h: 1 !important; }
        .cp-midiendo .cp-card  { --p: 1 !important; }
        .cp-midiendo .cp-inner { height: auto !important; align-items: flex-start; }
        .cp-midiendo .cp-thumb { height: 1px; }

        .cp-card {
          --p: 0;
          position: sticky;
          top: calc(var(--title-h) + var(--tope) + var(--i) * var(--row-h));
          z-index: calc(var(--i) + 1);
          height: var(--row-h);
          margin: 0 var(--pad-x) calc(var(--big-h) + var(--gap) - var(--row-h));
          pointer-events: none;
        }
        .cp-inner {
          pointer-events: auto;
          display: flex; align-items: stretch; width: 100%; overflow: hidden;
          height: calc(var(--big-h) - var(--p) * (var(--big-h) - var(--row-h) + var(--row-gap)));
          padding: 0; text-align: left; cursor: pointer; font-family: inherit;
          background: #fff; border: 1px solid ${C.line};
          border-radius: calc(20px - var(--p) * 8px);
          box-shadow: 0 calc(20px - var(--p) * 16px) calc(44px - var(--p) * 36px) -22px rgba(5,10,25,0.5);
          transition: border-color .15s;
        }
        .cp-inner:hover { border-color: ${C.primary}; }
        .cp-card-regalo .cp-inner { border: 2px solid ${C.yellow}; }

        .cp-thumb {
          position: relative; flex-shrink: 0; overflow: hidden; background: ${C.line};
          width: calc(var(--thumb) - var(--p) * (var(--thumb) - var(--thumb-min)));
        }
        .cp-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .cp-regalo {
          position: absolute; top: 8px; left: 8px;
          background: ${C.yellow}; color: ${C.ink};
          font-size: 9.5px; font-weight: 900; letter-spacing: 0.08em;
          padding: 3px 7px; border-radius: 999px;
          opacity: calc(1 - var(--p) * 3);
        }

        .cp-texto {
          flex: 1; min-width: 0; overflow: hidden;
          display: flex; flex-direction: column; justify-content: center;
          gap: calc(2px + (1 - var(--p)) * 4px);
          padding: 0 calc(16px + (1 - var(--p)) * 6px);
        }
        .cp-socio { font-size: 12px; line-height: 1.35; font-weight: 600; color: ${C.muted}; }
        /* Sin recorte a un renglón: el título tiene que leerse entero, y para
           eso la fila se mide y crece (ver §medida). El clamp a 3 queda de tope
           de cordura para un título desmedido. */
        .cp-titulo {
          font-size: calc(19px - var(--p) * 5px); font-weight: 800; color: ${C.ink};
          line-height: 1.25; letter-spacing: -0.01em;
          display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
        }
        /* Se desvanecen rápido (×2.6) PERO además colapsan su alto. Con opacity
           sola seguían ocupando lugar: el contenido centrado del renglón medía
           ~90px dentro de una caja de 56 y se cortaba arriba y abajo, que es de
           dónde salía el solapamiento entre fichas. */
        .cp-benef {
          font-size: 13px; color: ${C.ink2}; line-height: 1.45;
          opacity: calc(1 - var(--p) * 2.6);
          max-height: calc((1 - var(--p)) * 40px);
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .cp-lado {
          flex-shrink: 0; display: flex; flex-direction: column;
          align-items: flex-end; justify-content: center;
          gap: calc((1 - var(--p)) * 6px);
          padding-right: calc(16px + (1 - var(--p)) * 6px);
        }
        .cp-badge {
          background: ${C.yellow}; color: ${C.ink}; white-space: nowrap;
          font-size: calc(19px - var(--p) * 5px); font-weight: 900; letter-spacing: -0.02em; line-height: 1;
          padding: calc(6px - var(--p) * 1px) calc(11px - var(--p) * 2px); border-radius: 999px;
        }
        .cp-ahorro {
          font-size: 12px; line-height: 1.4; font-weight: 600; color: ${C.green}; white-space: nowrap;
          opacity: calc(1 - var(--p) * 2.6);
          max-height: calc((1 - var(--p)) * 18px); overflow: hidden;
        }

        /* ─── §cierre ────────────────────────────────────────────
           Los dos números que hacen que el paquete termine armado y no en un
           vacío blanco:

           · margin-top negativo = -(big-h + gap - row-h), más --aire-fin. Lo
             primero es exactamente lo que sobra de la caja de la última ficha
             cuando pasa a renglón, así que el checkout aterriza pegado abajo del
             último renglón en el mismo instante en que ese renglón termina de
             cerrarse; sin eso quedaban 130px de blanco esperando. Lo segundo lo
             baja un poco para que la pila respire antes del precio.

             El --aire de arriba de la pila, en cambio, NO entra en ninguna de
             las dos cuentas: se cancela solo, porque corre por igual al techo
             de la pila y al lugar donde cae el checkout.

             --tope (la separación entre la cabecera y el primer renglón) sí
             entra en el min-height: baja el anclaje de TODOS los renglones, así
             que el paquete armado ocupa esos píxeles de más.

           · min-height = alto visible - título - renglones - --aire-fin. Con eso el último
             scroll posible deja la pantalla mostrando exactamente el paquete
             completo: título arriba, los N renglones, y el pago llenando lo que
             queda. Un checkout más bajo dejaría scroll de sobra —y blanco al
             final—; uno más alto es el caso mobile, donde no entra y entonces
             sí empuja al título fuera de cuadro.

           z-index 1, DEBAJO de la pila: mientras la última ficha sigue grande
           el checkout ya está posicionado detrás de ella, y se descubre solo al
           encogerse. */

        .cp-legal {
          margin: 12px 0 0; text-align: center;
          font-size: 11.5px; line-height: 1.4; color: rgba(255,255,255,0.45);
        }

        /* ─── §plantilla · pie del que tiene Pase ─────────────── */
        .cp-pase-rotulo {
          display: flex; align-items: center; gap: 5px;
          margin: 0 0 12px; font-size: 12.5px; font-weight: 700;
          color: rgba(255,255,255,0.6);
        }
        .cp-pase-pagar {
          margin: 12px 0 0; font-size: 13.5px; line-height: 1.45; color: rgba(255,255,255,0.72);
        }
        .cp-pase-pagar strong { color: ${C.yellow}; font-weight: 800; font-size: 15px; }
        .cp-pase-aviso {
          margin: 14px 0 0; padding: 10px 13px; border-radius: 10px;
          background: rgba(255,201,60,0.14); border: 1px solid rgba(255,201,60,0.35);
          font-size: 12.5px; line-height: 1.45; color: ${C.yellow};
        }
        /* La versión hueca es para las acciones que no son la principal:
           deshacer y salir a Mi Pase. Mismo tamaño, otro peso. */
        .cp-cta-hueco {
          background: none; border: 1.5px solid rgba(255,255,255,0.35); color: #fff;
        }
        .cp-cta-hueco:hover { background: rgba(255,255,255,0.1); }
        .cp-cta:disabled { opacity: 0.6; cursor: default; }

        /* Libre de envolver: el precio dejó de estar debajo —ahora vive en el
           botón—, así que que la frase crezca ya no le roba lugar a nada.
           Centrados los dos: son el pie de la pila, que va a lo ancho, y el CTA
           de abajo también está centrado. */
        .cp-promesa {
          margin: 0; text-align: center;
          font-size: clamp(15px, 1.9vw, 19px);
          font-weight: 600; color: rgba(255,255,255,0.9); line-height: 1.45;
        }
        .cp-promesa strong { color: #fff; font-weight: 800; }
        .cp-puntos {
          margin: 10px 0 0; text-align: center;
          font-size: 13.5px; font-style: italic; font-weight: 400;
          color: ${C.yellow}; line-height: 1.4;
        }

        /* La decisión completa en un solo objeto: qué hago y cuánto pago. El
           tachado va pegado al precio vivo, que es donde la comparación sirve. */
        .cp-cta {
          width: 100%; display: flex; align-items: center; justify-content: center;
          gap: 14px; padding: 16px 20px; border: none; border-radius: 14px;
          background: ${C.yellow}; color: ${C.ink};
          font-family: inherit; font-size: 16px; font-weight: 800; cursor: pointer;
          transition: background .15s;
        }
        .cp-cta:hover { background: #FFD966; }
        .cp-cta-sep { width: 1px; align-self: stretch; margin: 2px 0; background: rgba(11,16,32,0.22); }
        .cp-cta-precio {
          display: inline-flex; align-items: baseline; gap: 7px;
          font-variant-numeric: tabular-nums; white-space: nowrap;
        }
        .cp-cta-precio s { font-size: 13px; font-weight: 700; color: rgba(11,16,32,0.45); }

        /* Aviso de salida. Va dentro de .cp-window y no del scroll: tapa la
           ventana entera, incluidas las acciones flotantes. */
        .cp-confirm {
          position: absolute; inset: 0; z-index: 60;
          background: rgba(5,10,25,0.55); backdrop-filter: blur(3px);
          display: flex; align-items: center; justify-content: center; padding: 24px;
        }
        .cp-confirm-caja {
          width: 100%; max-width: 380px; padding: 24px 24px 20px;
          background: #fff; border-radius: 20px;
          box-shadow: 0 30px 70px -20px rgba(5,10,25,0.6);
        }
        .cp-confirm-tit { font-size: 18px; font-weight: 800; color: ${C.ink}; letter-spacing: -0.02em; margin-bottom: 8px; }
        .cp-confirm-txt { font-size: 14px; color: ${C.ink2}; line-height: 1.5; margin: 0 0 20px; }
        .cp-confirm-txt strong { color: ${C.ink}; font-weight: 700; }
        .cp-confirm-btns { display: flex; gap: 10px; }
        .cp-confirm-no, .cp-confirm-si {
          flex: 1; padding: 13px 16px; border-radius: 12px; cursor: pointer;
          font-family: inherit; font-size: 14.5px; font-weight: 700;
          transition: background .15s, border-color .15s;
        }
        .cp-confirm-no { border: 1px solid ${C.line}; background: #fff; color: ${C.ink2}; }
        .cp-confirm-no:hover { background: ${C.bg}; }
        .cp-confirm-si { border: none; background: ${C.primary}; color: #fff; }
        .cp-confirm-si:hover { background: #1b34b8; }

        .cp-checkout {
          position: relative; z-index: 1;
          margin-top: calc(var(--row-h) - var(--big-h) - var(--gap) - var(--runway) + var(--aire-fin));
          min-height: calc(var(--vh, 640px) - var(--title-h) - var(--tope) - var(--n) * var(--row-h) - var(--aire-fin));
          background: ${C.primaryDeep}; color: #fff;
          padding: 22px var(--pad-x) 30px;
          /* El min-height casi siempre sobra sobre el contenido, y ese sobrante
             tiene que ir ARRIBA. Como bloque normal el contenido se apoyaba en
             el techo y dejaba el resto vacío abajo, que se leía como que la
             pantalla no terminaba. Empujado al pie, el sobrante queda de aire
             entre los renglones y el precio, y el CTA cierra contra el borde. */
          display: flex; flex-direction: column; justify-content: flex-end;
        }

        @media (max-width: 760px) {
          .cp-overlay { padding: 0; }
          .cp-window { width: 100%; height: 100%; border-radius: 0; }
          .cp-scroll { --big-h: 150px; --row-h: 78px; --title-h: 48px; --thumb: 100px; --thumb-min: 70px; --pad-x: 20px; --trans: 110px; --trans-h: 120px; --gap: 20px; --row-gap: 10px; --tope: 14px; --aire: 18px; --aire-fin: 14px; --runway: 120px; }
          .cp-hero { padding: 22px var(--pad-x) 26px; }
          .cp-logo { height: 38px; margin-bottom: 18px; }
          .cupon-title { font-size: 28px; }
        }
        @media (max-width: 720px) {
          .cupon-sidecover { display: none !important; }
          .cupon-nav-arrow { width: 40px !important; height: 40px !important; }
        }
      `}</style>
    </div>
  );

  return createPortal(overlay, document.body);
}

const arrowSt = {
  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
  zIndex: 5, width: 52, height: 52, borderRadius: '50%',
  background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255,255,255,0.25)', color: '#fff',
  display: 'grid', placeItems: 'center', cursor: 'pointer',
  transition: 'background .15s',
};
