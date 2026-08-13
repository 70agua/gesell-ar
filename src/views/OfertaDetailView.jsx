// ============================================================
//  src/views/OfertaDetailView.jsx — Detalle de oferta/cupón
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronRight, Zap, Ticket, Check, Clock, ShieldCheck,
  MessageCircle, Star, Heart, Share2, Flag,
  MapPin, Users, Gift, X, Send, Home,
} from 'lucide-react';
import { CoinSVG } from '../components/Token';
import { useCarrito } from '../lib/carrito';
import { trackVistaOferta } from '../lib/tracking';
import CtaPase from '../components/CtaPase';
import useMiPase from '../hooks/useMiPase';
import EscanerCanje from '../components/EscanerCanje';
import LimitePase from '../components/LimitePase';
import { cuponPropioDe } from '../lib/compras';
import { quitarPremium } from '../lib/pases';
import SolicitarFecha from '../components/SolicitarFecha';
import { activarPaseAhora } from '../lib/pases';
import { elegirPremium } from '../lib/pases';
import InfoTooltip from '../components/InfoTooltip';
import HeartButton from '../components/HeartButton';
import { useFavoritos } from '../lib/favoritos';
import { useMostrarCreditos } from '../lib/sesion';
import { precioActivacionARS, creditosActivacion } from '../lib/cobros';
import { grupoConfig, useGroupPricing, descuentoMaximo } from '../lib/grupos';
import { consumirImpulso } from '../lib/impulso';
import GroupBadge from '../components/GroupBadge';
import PaxSelector from '../components/PaxSelector';
import DiscountTiers from '../components/DiscountTiers';
import GroupPriceBreakdown from '../components/GroupPriceBreakdown';

// ─── Design tokens ───────────────────────────────────────────
const C = {
  primary:     '#475BE1',
  primarySoft: '#EEF0FD',
  primaryDark: '#3347C8',
  ink:         '#0B1020',
  ink2:        '#3D4255',
  muted:       '#6B7280',
  line:        '#E7E9EE',
  bg:          '#F7F7F8',
  green:       '#10A36B',
  yellow:      '#FFC93C',
  red:         '#EF4444',
};

// ─── Pasos de "Cómo se usa" ──────────────────────────────────
const PASOS = [
  { num: 1, title: 'Sumás el cupón a tu carrito',    desc: 'Con el Cupon PASS la mayoría ya vienen incluidos; los descuentos PREMIUM los elegís (uno por día de pase) y el resto los sumás a mitad de precio. Sin pase, lo comprás suelto.' },
  { num: 2, title: '¡Tu cupón ya está listo! Te lo enviamos por mail, pero también podés descargarlo.',  desc: ' ahora. Al momento de tu visita, solo tenés que mostrar el código QR desde el celular. Si surge algún inconveniente, el comercio puede validar tu reserva con un código de 6 dígitos. Por seguridad, no compartas este código con nadie.' },
  { num: 3, title: 'Disfrutás el beneficio',  desc: 'El socio escanea y confirma. ¡Listo! El descuento se aplica en el momento.' },
];

// ─── Countdown Flash ─────────────────────────────────────────
function FlashCountdown({ fechaFin }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    function calcular() {
      const diff = new Date(fechaFin) - Date.now();
      if (diff <= 0) { setRemaining('Expirado'); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setRemaining(`${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`);
    }
    calcular();
    const id = setInterval(calcular, 1000);
    return () => clearInterval(id);
  }, [fechaFin]);

  return (
    <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-bold" style={{ background: '#FEF2F2', color: C.red }}>
      <Clock size={14} /> Oferta Flash — termina en {remaining}
    </div>
  );
}

// ─── Mini offer card (otras ofertas del socio) ───────────────
function MiniOfferCard({ promo, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors"
      style={{ border: `1px solid ${C.line}` }}
      onMouseEnter={e => e.currentTarget.style.borderColor = C.primary}
      onMouseLeave={e => e.currentTarget.style.borderColor = C.line}
    >
      <div className="relative shrink-0 w-14 h-14 rounded-xl overflow-hidden">
        <img src={promo.image || promo.imagen_url} alt={promo.title || promo.titulo}
          className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold leading-snug truncate" style={{ color: C.ink }}>{promo.title || promo.titulo}</div>
        <div className="text-[11px] mt-0.5" style={{ color: C.muted }}>{promo.badge || promo.proveedorNombre}</div>
      </div>
      <HeartButton id={promo.id} size={28} light />
      <ChevronRight size={14} color={C.muted} />
    </div>
  );
}

// ─── Preguntas prediseñadas para consultar al socio ──────────
const PREGUNTAS = [
  '¿El cupón está disponible para el fin de semana?',
  '¿Se puede usar en temporada alta?',
  '¿Necesito reservar con anticipación?',
  '¿El cupón aplica a todo el servicio o hay restricciones?',
  '¿Hay alguna condición especial que deba conocer?',
];

// ─── Modal "Consultar con el socio" ──────────────────────────
function ConsultarModal({ socio, onClose }) {
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [custom, setCustom] = useState('');
  const [enviado, setEnviado] = useState(false);

  const toggle = (q) =>
    setSeleccionadas(prev =>
      prev.includes(q) ? prev.filter(x => x !== q) : [...prev, q]
    );

  const handleEnviar = () => {
    if (seleccionadas.length === 0 && !custom.trim()) return;
    setEnviado(true);
  };

  return (
    <>
      {/* Scrim */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(11,16,32,0.45)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
        }}
      />
      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 201, width: '100%', maxWidth: 520,
        background: '#fff', borderRadius: 20,
        boxShadow: '0 30px 80px rgba(11,16,32,0.28)',
        fontFamily: "'Inter', system-ui, sans-serif",
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 18px', borderBottom: `1px solid ${C.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.ink }}>Consultar con el socio</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{socio || 'Socio Cuponear'}</div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${C.line}`, background: '#fff', color: C.muted, display: 'grid', placeItems: 'center', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
            <X size={16} />
          </button>
        </div>

        {enviado ? (
          /* Estado de éxito */
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#F0FDF4', color: C.green, display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
              <Check size={24} />
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.ink, marginBottom: 6 }}>¡Consulta enviada!</div>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
              El socio recibirá tu consulta y te responderá en menos de 2hs.
            </p>
            <button
              onClick={onClose}
              style={{ marginTop: 20, padding: '10px 24px', borderRadius: 12, border: 'none', background: C.primary, color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
            >
              Cerrar
            </button>
          </div>
        ) : (
          <div style={{ padding: '20px 24px 24px' }}>
            <p style={{ fontSize: 13, color: C.ink2, marginBottom: 16, lineHeight: 1.5 }}>
              Seleccioná una o más preguntas, o escribí tu consulta propia:
            </p>

            {/* Preguntas prediseñadas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PREGUNTAS.map((q, i) => {
                const sel = seleccionadas.includes(q);
                return (
                  <button
                    key={i}
                    onClick={() => toggle(q)}
                    style={{
                      textAlign: 'left', padding: '11px 14px', borderRadius: 12, cursor: 'pointer',
                      border: `1.5px solid ${sel ? C.primary : C.line}`,
                      background: sel ? C.primarySoft : '#fff',
                      color: sel ? C.primary : C.ink2,
                      fontSize: 13.5, fontWeight: sel ? 600 : 400,
                      transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}
                  >
                    <span style={{
                      width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                      border: `1.5px solid ${sel ? C.primary : C.line}`,
                      background: sel ? C.primary : '#fff',
                      display: 'grid', placeItems: 'center',
                    }}>
                      {sel && <Check size={11} color="#fff" strokeWidth={3} />}
                    </span>
                    {q}
                  </button>
                );
              })}
            </div>

            {/* Campo libre */}
            <textarea
              value={custom}
              onChange={e => setCustom(e.target.value)}
              placeholder="O escribí tu propia consulta..."
              rows={3}
              style={{
                width: '100%', marginTop: 12, padding: '11px 14px',
                borderRadius: 12, border: `1.5px solid ${C.line}`,
                fontSize: 13.5, color: C.ink, resize: 'none',
                fontFamily: "'Inter', system-ui, sans-serif",
                boxSizing: 'border-box', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = C.primary}
              onBlur={e => e.target.style.borderColor = C.line}
            />

            {/* Botón enviar */}
            <button
              onClick={handleEnviar}
              disabled={seleccionadas.length === 0 && !custom.trim()}
              style={{
                marginTop: 14, width: '100%',
                padding: '13px 0', borderRadius: 14, border: 'none',
                background: (seleccionadas.length > 0 || custom.trim()) ? C.primary : C.line,
                color: (seleccionadas.length > 0 || custom.trim()) ? '#fff' : C.muted,
                fontSize: 14.5, fontWeight: 600, cursor: (seleccionadas.length > 0 || custom.trim()) ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.15s',
              }}
            >
              <Send size={15} /> Enviar consulta
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Íconos de stock tipo disco ───────────────────────────────
// Siempre 10 discos: los primeros `stockRestante` (1-5) en color, el resto grises
function StockDiscs({ stockRestante }) {
  const TOTAL = 10;
  const coloreados = Math.min(stockRestante, TOTAL);
  const grises = TOTAL - coloreados;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'nowrap' }}>
      {Array.from({ length: coloreados }).map((_, i) => (
        <img key={`c-${i}`} src="/ico-disc.svg" alt="" style={{ width: 40, height: 40, flexShrink: 0 }} />
      ))}
      {Array.from({ length: grises }).map((_, i) => (
        <img key={`g-${i}`} src="/ico-disc.svg" alt="" style={{ width: 40, height: 40, flexShrink: 0, filter: 'grayscale(1)', opacity: 0.22 }} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  MAIN — OfertaDetailView
// ═══════════════════════════════════════════════════════════
export default function OfertaDetailView({ oferta, onBack, onOpenOferta, allPromos = [], onOpenNegocio, onOpenLocalidad, onOpenSeccion, session, onComprarPase }) {
  // Estos dos van ANTES del return temprano: los hooks no pueden quedar
  // detrás de una condición.
  const miPase = useMiPase(session);
  const [avisoPase, setAvisoPase] = useState('');
  // Un cupón ya comprado cambia todo el pie: no hay nada que vender, sólo que
  // canjear. Se consulta acá y no en la mini-ficha porque es una consulta por
  // oferta y en una grilla serían veinte.
  const [cuponPropio, setCuponPropio] = useState(null);
  const [escaneando, setEscaneando] = useState(false);
  const [pidiendo, setPidiendo]     = useState(false);
  // Confirmación de arranque del pase: sin vuelta atrás, así que se avisa antes
  // y con la fecha real de vencimiento, no con "N días".
  // Guarda la fecha YA calculada, no un booleano: `Date.now()` en el cuerpo del
  // render es impuro y el compilador de React lo rechaza. El instante que
  // importa es cuando el turista abre el aviso, no cuando React repinta.
  const [confirmarActivar, setConfirmarActivar] = useState(null);
  const [activando, setActivando] = useState(false);

  // El pase arranca AHORA y recién después se abre la cámara. Al revés, el
  // turista podría canjear con un pase que todavía no corre y la RPC lo
  // rechazaría en el mostrador, que es el peor lugar para enterarse.
  useEffect(() => {
    let vivo = true;
    // Sin sesión no se toca el estado: un setState sincrónico en el cuerpo del
    // efecto dispara un re-render en cascada. Arranca en null, que ya es el
    // valor correcto, y el render de abajo lo vuelve a anular si se deslogueó.
    if (!session?.user?.id || !oferta?.id) return;
    cuponPropioDe(oferta.id).then(c => { if (vivo) setCuponPropio(c); });
    return () => { vivo = false; };
  }, [session, oferta?.id]);

  const soltarPremium = async () => {
    if (!miPase?.pase) return;
    const r = await quitarPremium(miPase.pase.id, oferta.id);
    setAvisoPase(r?.ok ? 'Listo, la soltaste. El beneficio volvió a tu Pase.' : 'No pudimos soltarla.');
  };

  const activarYCanjear = async () => {
    if (!miPase?.pase || activando) return;
    setActivando(true);
    const r = await activarPaseAhora(miPase.pase.id);
    setActivando(false);
    setConfirmarActivar(null);
    if (!r?.ok) { setAvisoPase('No pudimos activar tu Pase. Probá de nuevo.'); return; }
    setEscaneando(true);
  };
  useEffect(() => { if (oferta?.id) trackVistaOferta(oferta.id); }, [oferta?.id]);

  if (!oferta) return null;

  const { addCupon } = useCarrito();
  const mostrarCreditos = useMostrarCreditos();
  const favCtx = useFavoritos();
  const esFav  = favCtx?.esFavorito(oferta.id);
  const [added, setAdded]           = useState(false);
  const [consultarOpen, setConsultarOpen] = useState(false);

  // ── Cupón grupal ──
  const grupoCfg = grupoConfig(oferta);
  const [pax, setPax] = useState(grupoCfg?.minPax || 1);
  const pricing = useGroupPricing(oferta, pax);

  // Agregar al carrito. Para grupales, congelamos pax/descuento/total/QR.
  const handleAgregar = () => {
    if (grupoCfg && pricing) {
      const qr = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `qr-${oferta.id}-${Date.now()}`;
      addCupon({
        ...oferta,
        _grupal: {
          declared_pax:        pax,
          applied_discount_pct: pricing.discountPct,
          total_paid:          pricing.total,
          qr_token:            qr,
        },
      });
    } else {
      addCupon(oferta);
    }
    setAdded(true);
  };

  // Gastar una de las elecciones premium del pase en esta oferta. El RPC es
  // quien valida de verdad (tope, cupo del socio, que sea premium); acá sólo
  // se traduce el error a algo legible.
  const handleElegirPremium = async () => {
    if (!miPase?.pase) return;
    const r = await elegirPremium(miPase.pase.id, oferta.id);
    if (r?.ok) { setAdded(true); setAvisoPase('Listo: lo elegiste con tu pase.'); return; }
    const msg = {
      max_elecciones:   'Ya usaste todas tus elecciones. Podés sumarlo a mitad de precio.',
      cupo_agotado:     'El socio agotó su cupo del mes para esta oferta.',
      sin_cupo:         'Esta oferta no tiene cupo disponible para el pase.',
      ya_elegida:       'Esta oferta ya está entre tus elegidas.',
      pase_no_activo:   'Activá tu pase para usar las elecciones.',
      no_es_premium:    'Esta oferta ya viene incluida: no gastás elección.',
    }[r?.error] || 'No se pudo elegir. Probá de nuevo.';
    setAvisoPase(msg);
  };

  const isFlash  = oferta.offerType === 'Flash';
  const categoria = oferta.categoria || 'oferta';

  // Impulso publicitario: un acceso consume presupuesto (best-effort, una vez por apertura).
  useEffect(() => {
    if (oferta.impulsoActivo && oferta.id) consumirImpulso(oferta.id, 'acceso');
  }, [oferta.id]);

  // Calcular "otras ofertas del mismo socio" (o aleatorias si no hay negocioId)
  const otrasOfertas = allPromos
    .filter(p => p.id !== oferta.id && (oferta.negocioId ? p.negocioId === oferta.negocioId : true))
    .slice(0, 3);

  // Stock REAL o nada. Antes esto buscaba la oferta en el mock por título y, si
  // tampoco estaba, inventaba 28 totales con 11 usados: el aviso de "quedan
  // pocos" salía en ofertas que no llevan stock, y con números fabricados.
  // El socio decide si su oferta lleva stock (`tiene_stock`); si no, no hay
  // escasez que mostrar.
  const stockRestante = oferta.tieneStock ? oferta.stockRestante : null;

  // Precio del cupón: SIEMPRE desde la tabla escalonada (calcularPrecioCupon)
  // aplicada sobre el ahorro declarado. Fuente única en src/lib/cobros.js.
  const beneficioValor   = oferta.ahorroEstimado || oferta.beneficioValor || 0;
  const precioCreditosARS = precioActivacionARS({ ahorro: beneficioValor, tokensCosto: oferta.tokens_costo });
  const tokensCosto      = creditosActivacion({ ahorro: beneficioValor, tokensCosto: oferta.tokens_costo });

  // El primer item del breadcrumb siempre es "Ofertas" en esta vista
  const categoryLabel = 'Ofertas';

  return (
    <div className="min-h-screen bg-white" style={{ paddingTop: 100, fontFamily: "'Inter', system-ui, sans-serif", color: C.ink }}>

      {/* ── Breadcrumb + tipo de oferta ─────────────────────── */}
      <div className="max-w-[var(--site-max)] mx-auto px-[var(--site-pad)]">

          {/* Breadcrumb: Home › Ofertas (gris) › Localidad › Proveedor (bold, púrpura) */}
          <nav className="flex items-center gap-3 text-[13px] pt-4 pb-0 flex-wrap" style={{ color: C.muted }}>

            {/* 0 — Home */}
            <button
              onClick={() => onBack?.()}
              className="bg-transparent border-0 cursor-pointer p-0 flex items-center"
              style={{ color: C.primary }}
            >
              <Home size={16} strokeWidth={2.2} color={C.primary} />
            </button>
            <ChevronRight size={12} className="shrink-0" />

            {/* 1 — Ofertas */}
            <button
              onClick={() => onOpenSeccion ? onOpenSeccion('ofertas') : onBack()}
              className="bg-transparent border-0 cursor-pointer p-0 text-[13px] font-semibold"
              style={{ color: C.primary }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >
              {categoryLabel}
            </button>

            {/* 2 — Localidad ó Categoría */}
            {categoria !== 'aventura_relax'
              ? (oferta.negocioLocalidad || oferta.negocios?.localidad) && (
                <>
                  <ChevronRight size={12} className="shrink-0" />
                  <button
                    onClick={() => onOpenLocalidad?.((oferta.negocioLocalidad || oferta.negocios?.localidad))}
                    className="bg-transparent border-0 cursor-pointer p-0 text-[13px]"
                    style={{ color: C.muted }}
                    onMouseEnter={e => { e.currentTarget.style.color = C.ink; e.currentTarget.style.textDecoration = 'underline'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.textDecoration = 'none'; }}
                  >
                    {oferta.negocioLocalidad || oferta.negocios?.localidad}
                  </button>
                </>
              )
              : (oferta.categoriaSalida || oferta.subcategoria) && (
                <>
                  <ChevronRight size={12} className="shrink-0" />
                  <span className="text-[13px]" style={{ color: C.muted }}>
                    {oferta.categoriaSalida || oferta.subcategoria}
                  </span>
                </>
              )
            }

            {/* 3 — Nombre del socio */}
            {(oferta.proveedorNombre || oferta.negocios?.nombre) && (
              <>
                <ChevronRight size={12} className="shrink-0" />
                <button
                  onClick={() => oferta.negocioId && onOpenNegocio?.(oferta.negocioId)}
                  className="bg-transparent border-0 p-0 text-[13px]"
                  style={{ color: C.muted, cursor: oferta.negocioId ? 'pointer' : 'default' }}
                  onMouseEnter={e => { if (oferta.negocioId) { e.currentTarget.style.color = C.ink; e.currentTarget.style.textDecoration = 'underline'; } }}
                  onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.textDecoration = 'none'; }}
                >
                  {oferta.proveedorNombre || oferta.negocios?.nombre}
                </button>
              </>
            )}
          </nav>
      </div>

      {/* ── Main two-column ──────────────────────────────────── */}
      <div className="max-w-[var(--site-max)] mx-auto px-[var(--site-pad)]" style={{ paddingTop: 20 }}>
        <div className="grid gap-12 items-start" style={{ gridTemplateColumns: '1.6fr 1fr' }}>

          {/* ═══ LEFT ══════════════════════════════════════════ */}
          <div>

            {/* Flash countdown */}
            {isFlash && oferta.fechaFinFlash && (
              <div className="mb-3">
                <FlashCountdown fechaFin={oferta.fechaFinFlash} />
              </div>
            )}

            {/* 4 — Hero image con badge + título overlay */}
            <div className="relative w-full rounded-2xl overflow-hidden" style={{ height: 420 }}>
              <img
                src={oferta.image || oferta.imagen_url}
                alt={oferta.title || oferta.titulo}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(11,16,32,0.78) 0%,rgba(11,16,32,0.18) 60%,transparent 100%)' }} />


              {/* Badge + Título en la parte inferior de la imagen */}
              <div className="absolute bottom-0 left-0 right-0 px-7 pb-7">
                {oferta.badge && (
                  <div style={{ fontSize: 52, fontWeight: 800, color: '#fff', lineHeight: 1, marginBottom: 6 }}>
                    {oferta.badge}
                  </div>
                )}
                <h1 className="font-extrabold leading-[1.1] tracking-tight" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 22 }}>
                  {oferta.title || oferta.titulo}
                </h1>
              </div>
            </div>

            {/* Chip tipo + Guardar + Compartir */}
            <div className="flex items-center justify-between mt-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.8)', border: `1.5px solid ${isFlash ? C.red : C.primary}`, color: isFlash ? C.red : C.primary, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                {isFlash
                  ? <><Zap size={15} strokeWidth={2.5} /> Oferta Flash</>
                  : <><img src="/ico-disc.svg" style={{ width: 16, height: 16 }} /> Cupón de descuento</>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => favCtx?.toggleFavorito(oferta.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium cursor-pointer"
                  style={{ background: esFav ? '#FEF2F2' : '#fff', border: `1px solid ${esFav ? '#fecaca' : C.line}`, color: esFav ? '#EF4444' : C.ink }}>
                  <Heart size={15} fill={esFav ? '#EF4444' : 'none'} /> {esFav ? 'Guardado' : 'Guardar'}
                </button>
                <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium cursor-pointer"
                  style={{ background: '#fff', border: `1px solid ${C.line}`, color: C.ink }}>
                  <Share2 size={15} /> Compartir
                </button>
              </div>
            </div>

            {/* 5 — Descripción. Sin relleno: si el socio no la escribió, no se
                muestra. Acá había un párrafo genérico —"oferta exclusiva de uno
                de nuestros socios verificados…"— que se hacía pasar por texto
                del socio en las 33 ofertas que no la tienen. Un hueco es
                información; un texto inventado, no. */}
            {(oferta.description || oferta.desc) && (
              <p className="text-[15px] mt-6 mb-8" style={{ color: C.ink2, lineHeight: 1.7 }}>
                {oferta.description || oferta.desc}
              </p>
            )}

            {/* Cómo se usa */}
            <div className="mb-10">
              <h2 className="text-xl font-extrabold mb-5" style={{ color: C.ink }}>Cómo se usa</h2>
              <div className="flex flex-col gap-4">
                {PASOS.map(p => (
                  <div key={p.num} className="flex items-start gap-4">
                    <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-[14px] text-white"
                      style={{ background: C.primary }}>
                      {p.num}
                    </div>
                    <div>
                      <div className="text-[14px] font-bold mb-0.5" style={{ color: C.ink }}>{p.title}</div>
                      <div className="text-[13px] leading-snug" style={{ color: C.muted }}>{p.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Condiciones */}
            <div className="mb-10 p-5 rounded-2xl" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
              <h2 className="text-[15px] font-extrabold mb-3" style={{ color: C.ink }}>Condiciones</h2>
              <ul className="flex flex-col gap-2">
                {[
                  'Válido solo durante la temporada en curso.',
                  'Un cupón por persona / unidad habitacional.',
                  'No acumulable con otras promociones.',
                  'Sujeto a disponibilidad del socio.',
                  'Presentar el QR en el local al momento de la compra.',
                  isFlash ? 'Oferta Flash: válida por tiempo limitado.' : 'Sin fecha de vencimiento dentro de la temporada.',
                ].map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px]" style={{ color: C.ink2 }}>
                    <Check size={13} color={C.green} className="shrink-0 mt-0.5" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            {/* Otras ofertas del socio */}
            {otrasOfertas.length > 0 && (
              <div>
                <h2 className="text-xl font-extrabold mb-5" style={{ color: C.ink }}>Más ofertas del socio</h2>
                <div className="flex flex-col gap-2">
                  {otrasOfertas.map(p => (
                    <MiniOfferCard
                      key={p.id}
                      promo={{ ...p, title: p.titulo || p.title, image: p.imagen_url || p.image }}
                      onClick={() => onOpenOferta && onOpenOferta(p)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ═══ RIGHT — sticky card ═══════════════════════════ */}
          <div className="sticky" style={{ top: 84 }}>
            <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ border: `1px solid ${C.line}`, boxShadow: '0 8px 32px rgba(11,16,32,0.08)' }}>

              {/* Stock — aparece solo cuando quedan entre 1 y 5 cupones (sin línea divisora) */}
              {stockRestante >= 1 && stockRestante <= 5 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.red, marginBottom: 10 }}>
                    ¡Últimos cupones disponibles!
                  </div>
                  <StockDiscs stockRestante={stockRestante} />
                </div>
              )}

              {/* Cupón grupal: selector de pax + tramos + desglose */}
              {grupoCfg ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <GroupBadge descuentoMax={descuentoMaximo(grupoCfg.tramos)} />
                  <PaxSelector minPax={grupoCfg.minPax} maxPax={grupoCfg.maxPax} value={pax} onChange={setPax} />
                  <DiscountTiers tramos={grupoCfg.tramos} n={pax} />
                  <GroupPriceBreakdown pricing={pricing} />
                  <p style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.5, margin: 0 }}>
                    Paga una sola persona. El total se congela al agregar el cupón: si finalmente van menos, no se reajusta.
                  </p>
                </div>
              ) : tokensCosto === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F0FDF4', borderRadius: 14, padding: '14px 16px', border: '1px solid #BBF7D0' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10A36B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4.5 4.5L20 6"/></svg>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#10A36B' }}>Cupón DE REGALO para vos</span>
                </div>
              ) : (
                /* Grid 2 columnas: cada fila queda alineada automáticamente entre columnas */
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderRadius: 14, border: `1px solid ${C.line}`, overflow: 'hidden' }}>

                  {/* Fila 1 — Labels */}
                  <div style={{ padding: '16px 16px 6px', borderRight: `1px solid ${C.line}` }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: C.muted }}>Ahorrás</span>
                  </div>
                  <div style={{ padding: '16px 14px 6px' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: C.muted }}>Lo activás con</span>
                  </div>

                  {/* Fila 2 — Valores principales */}
                  <div style={{ padding: '4px 16px 4px', borderRight: `1px solid ${C.line}`, display: 'flex', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 30, fontWeight: 800, color: C.green, letterSpacing: '-0.03em', lineHeight: 1 }}>
                      ~${beneficioValor.toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div style={{ padding: '4px 14px 4px', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {mostrarCreditos ? (
                      <>
                        <CoinSVG size={26} />
                        <span style={{ fontSize: 30, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>{tokensCosto}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.ink2, alignSelf: 'flex-end', paddingBottom: 1 }}>
                          crédito{tokensCosto !== 1 ? 's' : ''}
                        </span>
                      </>
                    ) : (
                      <span style={{ fontSize: 30, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>${precioCreditosARS.toLocaleString('es-AR')}</span>
                    )}
                  </div>

                  {/* Fila 3 — Subtextos */}
                  <div style={{ padding: '4px 16px 16px', borderRight: `1px solid ${C.line}` }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.green }}>Aproximadamente</span>
                    <InfoTooltip />
                  </div>
                  <div style={{ padding: '4px 14px 16px' }}>
                    <span style={{ fontSize: 11, color: C.muted }}>{mostrarCreditos ? `($${precioCreditosARS.toLocaleString('es-AR')})` : 'IVA incluido'}</span>
                  </div>

                </div>
              )}

              {/* El límite, antes del CTA. Es lo que el sello de la mini-ficha
                  ya no dice: ahí no entra la explicación, acá sí. */}
              <LimitePase promo={oferta} onSoltar={soltarPremium} />

              {/* CTA principal — según lo que el pase haga con esta oferta */}
              <div>
                <CtaPase
                  promo={oferta}
                  precioLista={precioCreditosARS}
                  miPase={miPase}
                  sumado={added}
                  onSumar={handleAgregar}
                  onElegir={handleElegirPremium}
                  onComprarPase={() => onComprarPase?.(7)}
                  cuponPropio={session?.user?.id ? cuponPropio : null}
                  onCanjear={() => setEscaneando(true)}
                  onActivarPase={() => setConfirmarActivar(vencimientoDelPase(miPase?.pase))}
                  onSolicitarReserva={() => setPidiendo(true)}
                />
                {avisoPase && (
                  <div style={{ marginTop: 8, fontSize: 12.5, color: C.muted, textAlign: 'center' }}>{avisoPase}</div>
                )}
              </div>

              {/* Info del socio */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: C.muted }}>Ofrecido por</div>
                <div className="flex items-center gap-3">
                  {oferta.proveedorImage ? (
                    <img src={oferta.proveedorImage} alt={oferta.proveedorNombre}
                      className="w-11 h-11 rounded-full object-cover shrink-0"
                      style={{ border: `2px solid ${C.line}` }} />
                  ) : (
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-extrabold text-[18px] shrink-0"
                      style={{ background: C.primarySoft, color: C.primary }}>
                      {(oferta.proveedorNombre || 'S')[0]}
                    </div>
                  )}
                  <div>
                    <div className="text-[14px] font-bold leading-snug" style={{ color: C.ink }}>
                      {oferta.proveedorNombre || 'Socio Cuponear'}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] mt-0.5" style={{ color: C.muted }}>
                      <Clock size={10} /> Responde en menos de 2hs
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-1 text-[13px] font-bold" style={{ color: C.yellow }}>
                    <Star size={13} fill={C.yellow} color={C.yellow} /> 4.8
                  </div>
                </div>
                <button
                  onClick={() => setConsultarOpen(true)}
                  className="w-full py-3 rounded-2xl font-semibold text-[14px] cursor-pointer flex items-center justify-center gap-2 transition-colors mt-3"
                  style={{ border: `1px solid ${C.line}`, background: '#fff', color: C.ink2 }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.primary}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.line}
                >
                  <MessageCircle size={15} /> Consultar con el socio
                </button>
              </div>

              {/* Garantía */}
              <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl" style={{ background: '#F0FDF4' }}>
                <ShieldCheck size={16} color={C.green} className="shrink-0 mt-0.5" />
                <p className="text-[12px] leading-snug" style={{ color: '#15803D' }}>
                  <span className="font-bold">Compra protegida.</span> Si no podés canjear tu cupón por alguna razón, te lo devolvemos sin preguntas en <span className="font-bold">créditos a tu favor</span>.
                </p>
              </div>

              {/* Denunciar */}
              <div className="text-center pt-1">
                <button className="bg-transparent border-0 cursor-pointer text-[12px] flex items-center gap-1 mx-auto" style={{ color: C.muted }}>
                  <Flag size={11} /> Denunciar un problema
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Modal consultar */}
      {consultarOpen && (
        <ConsultarModal
          socio={oferta.proveedorNombre || oferta.negocios?.nombre || 'Socio Cuponear'}
          onClose={() => setConsultarOpen(false)}
        />
      )}

      {/* Arrancar el Pase no tiene vuelta atrás, así que se pregunta antes y
          con la FECHA real de vencimiento. "Te quedan 7 días" obliga a hacer la
          cuenta parado en el mostrador; una fecha con hora no. */}
      {confirmarActivar && (
        <AvisoActivar
          hasta={confirmarActivar}
          ocupado={activando}
          onCancelar={() => setConfirmarActivar(null)}
          onConfirmar={activarYCanjear}
        />
      )}

      {escaneando && (
        <EscanerCanje
          onCerrar={() => setEscaneando(false)}
          onNegocio={(negocioId) => { setEscaneando(false); window.location.search = `?canjear=${negocioId}`; }}
        />
      )}

      {pidiendo && (
        <SolicitarFecha
          oferta={oferta}
          onCerrar={() => setPidiendo(false)}
          onEnviada={() => { setPidiendo(false); setAvisoPase('Pedido enviado. El comercio tiene 72 horas para responder.'); }}
        />
      )}
    </div>
  );
}

// Hasta cuándo va a durar el pase si se activa AHORA. Se calcula al abrir el
// aviso y no dentro del render: el pase todavía no arrancó, así que `vence_el`
// está en null y hay que proyectarlo. Mismo cálculo que `activar_pase` en SQL.
function vencimientoDelPase(pase) {
  const dias = pase?.dias ?? pase?.pases?.duracion_dias ?? 0;
  const h = new Date(Date.now() + dias * 86400000);
  // Si el turista había programado el arranque para más adelante, activar ahora
  // PISA esa programación y le come los días que faltaban. No se puede resolver
  // solo: se avisa y se pide una confirmación aparte.
  const prog = pase?.activacion_programada ? new Date(pase.activacion_programada) : null;
  const pisaProgramacion = prog && prog.getTime() > Date.now();
  return {
    fecha: h.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }),
    hora:  h.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    programadaPara: pisaProgramacion
      ? prog.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
      : null,
  };
}

// ─── Aviso previo a arrancar el Pase ──────────────────────────
function AvisoActivar({ hasta, ocupado, onCancelar, onConfirmar }) {
  // Con programación pisada, el "entiendo" es obligatorio: son dos pérdidas
  // distintas —los días que faltaban y la fecha elegida— y un solo botón las
  // mete a las dos en un tap.
  const [entendido, setEntendido] = useState(false);
  const trabado = !!hasta.programadaPara && !entendido;

  return (
    <div onClick={onCancelar} style={{ position: 'fixed', inset: 0, zIndex: 9400, background: 'rgba(5,10,25,0.6)', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} role="alertdialog" aria-modal="true" style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 20, padding: '26px 24px 20px', fontFamily: C.font, boxShadow: '0 30px 70px -20px rgba(5,10,25,0.6)' }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em', marginBottom: 10 }}>
          Tu Pase arranca ahora
        </div>
        <p style={{ fontSize: 14.5, color: C.ink2, lineHeight: 1.55, margin: '0 0 6px' }}>
          Vas a poder usarlo hasta el <strong style={{ color: C.ink }}>{hasta.fecha}</strong> a las <strong style={{ color: C.ink }}>{hasta.hora}</strong>.
        </p>
        <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, margin: '0 0 16px' }}>
          Una vez que arranca no se puede pausar ni volver atrás.
        </p>

        {hasta.programadaPara && (
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', marginBottom: 18, borderRadius: 12, background: '#FFF7ED', border: '1px solid #FED7AA', cursor: 'pointer' }}>
            <input type="checkbox" checked={entendido} onChange={e => setEntendido(e.target.checked)} style={{ marginTop: 2, accentColor: C.primary }} />
            <span style={{ fontSize: 12.5, color: '#9A3412', lineHeight: 1.5 }}>
              Tenías el arranque programado para el <strong>{hasta.programadaPara}</strong>. Si activás ahora, esa programación se cancela y los días corren desde hoy.
            </span>
          </label>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancelar} disabled={ocupado} style={{ flex: 1, padding: '13px 16px', borderRadius: 12, border: `1px solid ${C.line}`, background: '#fff', color: C.ink2, fontFamily: C.font, fontSize: 14.5, fontWeight: 700, cursor: 'pointer' }}>
            Todavía no
          </button>
          <button onClick={onConfirmar} disabled={ocupado || trabado} style={{ flex: 1, padding: '13px 16px', borderRadius: 12, border: 'none', background: C.primary, color: '#fff', fontFamily: C.font, fontSize: 14.5, fontWeight: 800, cursor: (ocupado || trabado) ? 'default' : 'pointer', opacity: (ocupado || trabado) ? 0.6 : 1 }}>
            {ocupado ? 'Activando…' : 'Activar y canjear'}
          </button>
        </div>
      </div>
    </div>
  );
}
