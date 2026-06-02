// ============================================================
//  src/views/OfertaDetailView.jsx — Detalle de oferta/cupón
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronRight, Zap, Ticket, Check, Clock, ShieldCheck,
  MessageCircle, Star, Heart, Share2, Flag,
  MapPin, Users, Gift, X, Send,
} from 'lucide-react';
import { CoinSVG } from '../components/Token';
import { useCuponera } from '../lib/cuponera';

// ─── Design tokens ───────────────────────────────────────────
const C = {
  primary:     '#2545E6',
  primarySoft: '#EEF1FF',
  primaryDark: '#1731B8',
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
  { num: 1, title: 'Agregás la oferta a tu cuponera',    desc: 'Seleccioná "Agregar a cuponera" desde el botón azul. Si no lo abonás en el momento quedará en tu lista pendientes hasta que termines de sumar otras ofertas en la zona. Cuantas más agregues, más beneficios recibirás.' },
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
        fontFamily: "'Geist', system-ui, sans-serif",
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 18px', borderBottom: `1px solid ${C.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.ink }}>Consultar con el socio</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{socio || 'Socio gesell.ar'}</div>
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
                fontFamily: "'Geist', system-ui, sans-serif",
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
export default function OfertaDetailView({ oferta, onBack, onOpenOferta, allPromos = [], onOpenNegocio, onOpenLocalidad, onOpenSeccion }) {
  if (!oferta) return null;

  const { addCupon } = useCuponera();
  const [added, setAdded]           = useState(false);
  const [consultarOpen, setConsultarOpen] = useState(false);

  const isFlash  = oferta.offerType === 'Flash';
  const categoria = oferta.categoria || 'oferta';

  // Calcular "otras ofertas del mismo socio" (o aleatorias si no hay negocioId)
  const otrasOfertas = allPromos
    .filter(p => p.id !== oferta.id && (oferta.negocioId ? p.negocioId === oferta.negocioId : true))
    .slice(0, 3);

  // Stock: real promo puede no tener los campos → fallback a mock por título
  const mockRef       = allPromos.find(p =>
    (p.title || p.titulo) === (oferta.title || oferta.titulo)
  );
  const stockTotal    = oferta.stock      ?? mockRef?.stock      ?? 28;
  const stockUsado    = oferta.stockUsado ?? mockRef?.stockUsado ?? 11;
  const stockRestante = stockTotal - stockUsado;
  const stockPct      = Math.round((stockUsado / stockTotal) * 100);

  // Precio del cupón en créditos y en pesos
  const tokensCosto      = oferta.tokens_costo ?? 3;
  const precioCreditosARS = tokensCosto * 2000;          // 1 crédito = $2.000
  // Valor del beneficio que otorga el cupón (siempre mayor al costo del crédito)
  const beneficioValor   = oferta.beneficioValor || 30000;
  const ahorro           = beneficioValor - precioCreditosARS;

  // El primer item del breadcrumb siempre es "Ofertas" en esta vista
  const categoryLabel = 'Ofertas';

  return (
    <div className="min-h-screen bg-white" style={{ paddingTop: 70, fontFamily: "'Geist', system-ui, sans-serif", color: C.ink }}>

      {/* ── Breadcrumb + tipo de oferta ─────────────────────── */}
      <div className="max-w-[1328px] mx-auto px-10">
        <div className="pt-6 pb-1">

          {/* Tipo de oferta — ocupa ahora la posición del breadcrumb */}
          <div className="flex items-center gap-2 mb-2"
            style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: isFlash ? C.red : C.primary }}>
            {isFlash
              ? <><Zap size={12} strokeWidth={2.5} /> Oferta Flash</>
              : <><Ticket size={12} strokeWidth={2} /> Cupón de descuento</>}
          </div>

          {/* Breadcrumb: Ofertas (gris) › Localidad › Proveedor (bold, púrpura) */}
          <nav className="flex items-center gap-2 flex-wrap" style={{ fontSize: 15 }}>

            {/* 1 — Ofertas: gris, sin bold */}
            <button
              onClick={() => onOpenSeccion ? onOpenSeccion('ofertas') : onBack()}
              className="bg-transparent border-0 cursor-pointer p-0"
              style={{ color: C.muted, fontWeight: 400, fontSize: 15 }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >
              {categoryLabel}
            </button>

            {/* 2 — Localidad ó Categoría */}
            {categoria !== 'experiencia'
              ? (oferta.negocioLocalidad || oferta.negocios?.localidad) && (
                <>
                  <ChevronRight size={13} className="shrink-0" style={{ color: C.muted }} />
                  <button
                    onClick={() => onOpenLocalidad?.((oferta.negocioLocalidad || oferta.negocios?.localidad))}
                    className="bg-transparent border-0 cursor-pointer p-0"
                    style={{ color: C.muted, fontWeight: 400, fontSize: 15 }}
                    onMouseEnter={e => { e.currentTarget.style.color = C.ink; e.currentTarget.style.textDecoration = 'underline'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.textDecoration = 'none'; }}
                  >
                    {oferta.negocioLocalidad || oferta.negocios?.localidad}
                  </button>
                </>
              )
              : (oferta.categoriaExperiencia || oferta.subcategoria) && (
                <>
                  <ChevronRight size={13} className="shrink-0" style={{ color: C.muted }} />
                  <span style={{ color: C.muted, fontWeight: 400, fontSize: 15 }}>
                    {oferta.categoriaExperiencia || oferta.subcategoria}
                  </span>
                </>
              )
            }

            {/* 3 — Nombre del socio: bold + púrpura */}
            {(oferta.proveedorNombre || oferta.negocios?.nombre) && (
              <>
                <ChevronRight size={13} className="shrink-0" style={{ color: C.muted }} />
                <button
                  onClick={() => oferta.negocioId && onOpenNegocio?.(oferta.negocioId)}
                  className="bg-transparent border-0 p-0"
                  style={{ color: C.primary, fontWeight: 700, fontSize: 15, cursor: oferta.negocioId ? 'pointer' : 'default' }}
                  onMouseEnter={e => { if (oferta.negocioId) e.currentTarget.style.textDecoration = 'underline'; }}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                >
                  {oferta.proveedorNombre || oferta.negocios?.nombre}
                </button>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* ── Main two-column ──────────────────────────────────── */}
      <div className="max-w-[1328px] mx-auto px-10 py-10">
        <div className="grid gap-12 items-start" style={{ gridTemplateColumns: '1.6fr 1fr' }}>

          {/* ═══ LEFT ══════════════════════════════════════════ */}
          <div>

            {/* Flash countdown */}
            {isFlash && oferta.fechaFinFlash && (
              <div className="mb-5">
                <FlashCountdown fechaFin={oferta.fechaFinFlash} />
              </div>
            )}

            {/* Título */}
            <h1 className="text-[38px] font-extrabold leading-[1.08] tracking-tight" style={{ color: C.ink }}>
              {oferta.title || oferta.titulo}
            </h1>

            {/* 3 — Acciones: Compartir + Guardar */}
            <div className="flex items-center gap-6 mt-5">
              <button
                className="flex items-center gap-2 bg-transparent border-0 cursor-pointer p-0 text-[14px] font-semibold"
                style={{ color: C.ink2 }}
                onMouseEnter={e => e.currentTarget.style.color = C.ink}
                onMouseLeave={e => e.currentTarget.style.color = C.ink2}
              >
                <Share2 size={15} strokeWidth={1.8} /> Compartir
              </button>
              <button
                className="flex items-center gap-2 bg-transparent border-0 cursor-pointer p-0 text-[14px] font-semibold"
                style={{ color: C.ink2 }}
                onMouseEnter={e => e.currentTarget.style.color = C.ink}
                onMouseLeave={e => e.currentTarget.style.color = C.ink2}
              >
                <Heart size={15} strokeWidth={1.8} /> Guardar
              </button>
            </div>

            {/* 4 — Hero image */}
            <div className="relative w-full rounded-2xl overflow-hidden mt-6" style={{ height: 400 }}>
              <img
                src={oferta.image || oferta.imagen_url}
                alt={oferta.title || oferta.titulo}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(11,16,32,0.6) 0%,rgba(11,16,32,0.06) 50%,transparent 100%)' }} />

              {/* Descuento grande sobre la imagen */}
              {oferta.badge && (
                <div className="absolute bottom-5 left-6 text-white font-extrabold leading-none tracking-tight" style={{ fontSize: 52, textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
                  {oferta.badge}
                </div>
              )}

              {/* Chip Flash sobre imagen */}
              {isFlash && (
                <div className="absolute top-4 left-4 flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-bold" style={{ background: C.red, color: '#fff' }}>
                  <Zap size={11} /> Flash
                </div>
              )}
            </div>

            {/* 5 — Descripción */}
            <p className="text-[15px] mt-6 mb-8" style={{ color: C.ink2, lineHeight: 1.7 }}>
              {oferta.description || oferta.desc ||
                'Aprovechá esta oferta exclusiva de uno de nuestros socios verificados. Guardala en tu cuponera y canjeala cuando quieras durante tu estadía en Villa Gesell.'}
            </p>

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

              {/* Ahorro + Costo — dos columnas con divisor vertical */}
              {tokensCosto === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F0FDF4', borderRadius: 14, padding: '14px 16px', border: '1px solid #BBF7D0' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10A36B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4.5 4.5L20 6"/></svg>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#10A36B' }}>Cupón GRATIS</span>
                </div>
              ) : (
                /* Grid 2 columnas: cada fila queda alineada automáticamente entre columnas */
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderRadius: 14, border: `1px solid ${C.line}`, overflow: 'hidden' }}>

                  {/* Fila 1 — Labels */}
                  <div style={{ padding: '16px 16px 6px', borderRight: `1px solid ${C.line}` }}>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: C.muted }}>Ahorro estimado</span>
                  </div>
                  <div style={{ padding: '16px 14px 6px' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: C.muted }}>Lo activás con</span>
                  </div>

                  {/* Fila 2 — Valores principales */}
                  <div style={{ padding: '4px 16px 4px', borderRight: `1px solid ${C.line}`, display: 'flex', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 30, fontWeight: 800, color: C.green, letterSpacing: '-0.03em', lineHeight: 1 }}>
                      ~${beneficioValor.toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div style={{ padding: '4px 14px 4px', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <CoinSVG size={26} />
                    <span style={{ fontSize: 30, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>{tokensCosto}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.ink2, alignSelf: 'flex-end', paddingBottom: 1 }}>
                      crédito{tokensCosto !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Fila 3 — Subtextos */}
                  <div style={{ padding: '4px 16px 16px', borderRight: `1px solid ${C.line}` }}>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.green }}>Aproximadamente</span>
                  </div>
                  <div style={{ padding: '4px 14px 16px' }}>
                    <span style={{ fontSize: 11, color: C.muted }}>(${precioCreditosARS.toLocaleString('es-AR')} + IVA)</span>
                  </div>

                </div>
              )}

              {/* CTA principal */}
              <button
                onClick={() => { addCupon(oferta); setAdded(true); }}
                className="w-full py-3.5 rounded-2xl font-bold text-[15px] text-white cursor-pointer border-0 flex items-center justify-center gap-2 transition-colors"
                style={{ background: added ? C.green : C.primary, boxShadow: `0 8px 24px ${added ? 'rgba(16,163,107,0.25)' : 'rgba(37,69,230,0.25)'}` }}
                onMouseEnter={e => { if (!added) e.currentTarget.style.background = C.primaryDark; }}
                onMouseLeave={e => { if (!added) e.currentTarget.style.background = C.primary; }}
              >
                {added
                  ? <><Check size={17} strokeWidth={2.5} /> Agregado a tu cuponera</>
                  : <><Ticket size={17} /> Agregar a cuponera</>
                }
              </button>

              {/* CTA secundario */}
              <button
                onClick={() => setConsultarOpen(true)}
                className="w-full py-3 rounded-2xl font-semibold text-[14px] cursor-pointer flex items-center justify-center gap-2 transition-colors"
                style={{ border: `1px solid ${C.line}`, background: '#fff', color: C.ink2 }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.primary}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.line}
              >
                <MessageCircle size={15} /> Consultar con el socio
              </button>

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
                      {oferta.proveedorNombre || 'Socio gesell.ar'}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] mt-0.5" style={{ color: C.muted }}>
                      <Clock size={10} /> Responde en menos de 2hs
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-1 text-[13px] font-bold" style={{ color: C.yellow }}>
                    <Star size={13} fill={C.yellow} color={C.yellow} /> 4.8
                  </div>
                </div>
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
          socio={oferta.proveedorNombre || oferta.negocios?.nombre || 'Socio gesell.ar'}
          onClose={() => setConsultarOpen(false)}
        />
      )}
    </div>
  );
}
