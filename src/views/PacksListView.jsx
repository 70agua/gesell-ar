// ============================================================
//  src/views/PacksListView.jsx — Listado de cuponeras "todo incluido"
//  Sin filtros: una fila por cuponera (título + tira de cupones en scroll
//  horizontal) y el CTA que compra el pack entero, sin pasar por el drawer.
// ============================================================
import React, { useEffect, useState } from 'react';
import { ChevronRight, ArrowRight, Check } from 'lucide-react';
import { getCuponeras } from '../lib/datos';
import { useCuponera } from '../lib/cuponera';
import { aplicarBeneficioCuponera } from '../lib/beneficiosCuponera';
import { getBeneficioIcon } from '../lib/beneficioIconos';
import CuponModalMock from '../components/CuponModalMock';
import PortadaCuponera from '../components/PortadaCuponera';
import { FAMILIAS_PACK, MAS_PACKS, familiaLabel } from '../lib/familiasPack';
import Icono from '../components/Icono';

const C = {
  primary:     '#2545E6',
  primarySoft: '#EEF1FF',
  ink:         '#0B1020',
  ink2:        '#3D4255',
  muted:       '#6B7280',
  line:        '#E7E9EE',
  bg:          '#F7F7F8',
  navy:        '#0B1733',
  green:       '#10A36B',
  yellow:      '#FFC93C',
  font:        "'Inter', system-ui, sans-serif",
};

const CUPON_W = 76;
const fmt = n => `$${Math.round(n || 0).toLocaleString('es-AR')}`;

// El precio de la cuponera es la suma de las activaciones, con el beneficio
// adicional aplicado si es de los que tocan el precio (mismo cálculo que la home).
function precioDeCuponera(cuponera) {
  const precioBase = (cuponera.cupones || []).reduce((s, c) => s + (Number(c.precio_activacion) || 0), 0);
  const { precio } = aplicarBeneficioCuponera({
    tipo: cuponera.beneficioTipo, valor: cuponera.beneficioValor, puntosBase: 0, precioBase,
  });
  return { precioBase, precio };
}

// ─── Miniatura de un cupón dentro de la tira ─────────────────
function CuponMini({ cupon, onClick }) {
  return (
    <button
      onClick={onClick}
      title={`${cupon.badge ? cupon.badge + ' · ' : ''}${cupon.titulo}${cupon.socio ? ' — ' + cupon.socio : ''}`}
      style={{
        width: CUPON_W, height: CUPON_W, flexShrink: 0, padding: 0, cursor: 'pointer',
        borderRadius: 14, overflow: 'hidden', border: `1px solid ${C.line}`, background: C.bg,
        transition: 'transform .18s, box-shadow .18s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 28px -16px rgba(11,16,32,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
      <img src={cupon.imagen} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    </button>
  );
}

// ─── Una cuponera: portada a la izquierda, contenido a la derecha ───
function CuponeraFila({ cuponera, onVerDetalle, onComprar }) {
  const cupones = cuponera.cupones || [];
  const { precio } = precioDeCuponera(cuponera);
  const ahorro = cupones.reduce((s, c) => s + (Number(c.ahorro_estimado) || 0), 0);
  const localidades = [...new Set(cupones.map(c => c.localidad).filter(Boolean))];

  return (
    <article style={{ display: 'flex', background: '#fff', border: `1px solid ${C.line}`, borderRadius: 20, overflow: 'hidden' }}>

      {/* Portada — ocupa todo el alto de la fila */}
      <div style={{ position: 'relative', width: 300, flexShrink: 0, alignSelf: 'stretch', minHeight: 260, background: C.bg }}>
        <PortadaCuponera cuponera={cuponera} alt={cuponera.title} />
      </div>

      <div style={{ flex: 1, minWidth: 0, padding: '22px 26px 20px', display: 'flex', flexDirection: 'column' }}>

        {/* Familia + beneficio adicional, en una sola línea */}
        {(cuponera.badge || cuponera.beneficioAdicional) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 12, flexWrap: 'wrap' }}>
            {cuponera.badge && (
              <span style={{ background: C.yellow, color: C.ink, fontSize: 12, fontWeight: 800, padding: '4px 12px', borderRadius: 999, flexShrink: 0 }}>
                {cuponera.badge}
              </span>
            )}
            {cuponera.beneficioAdicional && (
              <>
                <span style={{ display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: '50%', background: C.yellow, flexShrink: 0 }}>
                  {React.createElement(getBeneficioIcon(cuponera.beneficioIcono), { size: 18, color: C.navy, strokeWidth: 2.4 })}
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#B98900', lineHeight: 1.25 }}>{cuponera.beneficioAdicional}</span>
              </>
            )}
          </div>
        )}

        <h2 style={{ fontSize: 27, fontWeight: 800, letterSpacing: '-0.025em', color: C.ink, margin: 0, lineHeight: 1.15 }}>
          {cuponera.title}
        </h2>
        {cuponera.subtitle && (
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.5, margin: '7px 0 0', maxWidth: 720 }}>
            {cuponera.subtitle}
          </p>
        )}

        {/* Qué incluye — badge + título de cada oferta */}
        {cupones.length > 0 && (
          <ul style={{ listStyle: 'none', margin: '14px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 9, maxWidth: 720 }}>
            {cupones.map(c => (
              <li key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, lineHeight: 1.45, minWidth: 0 }}>
                <Check size={14} color={C.primary} strokeWidth={3} style={{ flexShrink: 0 }} />
                {c.badge && (
                  <span style={{ background: C.primarySoft, color: C.primary, fontWeight: 800, padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {c.badge}
                  </span>
                )}
                <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span style={{ color: C.ink2, fontWeight: 600 }}>{c.titulo}</span>
                  {c.socio && <span style={{ color: C.muted, fontWeight: 500 }}> — {c.socio}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Tira de cupones — scroll horizontal */}
        <div style={{ position: 'relative', marginTop: 18 }}>
          <div className="no-scrollbar" style={{ overflowX: 'auto', paddingBottom: 2 }}>
            <div style={{ display: 'flex', gap: 10, width: 'max-content' }}>
              {cupones.map(c => <CuponMini key={c.id} cupon={c} onClick={onVerDetalle} />)}
            </div>
          </div>
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 70, background: 'linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,1))', pointerEvents: 'none' }} />
        </div>

        {/* Pie: totales a la izquierda · CTA a la derecha */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginTop: 'auto', paddingTop: 16, borderTop: `1px solid ${C.line}`, fontSize: 13.5 }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 22, minWidth: 0 }}>
            <span style={{ color: C.muted }}>{cupones.length} cupones</span>
            {ahorro > 0 && <span style={{ color: C.green, fontWeight: 700 }}>Ahorro declarado {fmt(ahorro)}</span>}
            <span style={{ color: C.ink2, fontWeight: 700 }}>Valor de activación {fmt(precio)}</span>
            {localidades.length > 0 && <span style={{ color: C.muted }}>· {localidades.join(' · ')}</span>}
          </div>

          {/* CTA: compra directa del pack completo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0, marginLeft: 'auto' }}>
            <button
              onClick={onVerDetalle}
              style={{ background: 'none', border: 'none', color: C.primary, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: C.font, padding: '2px 0', whiteSpace: 'nowrap' }}
            >
              Ver el detalle
            </button>
            <button
              onClick={onComprar}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: '13px 22px', borderRadius: 14, border: 'none', background: C.ink, color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: C.font, whiteSpace: 'nowrap', transition: 'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = C.primary}
              onMouseLeave={e => e.currentTarget.style.background = C.ink}
            >
              Comprar por {fmt(precio)} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

// ═══════════════════════════════════════════════════════════
export default function PacksListView({ onBack, familia = null, onFamiliaChange }) {
  const [cuponeras, setCuponeras] = useState(null); // null = cargando
  const [modal, setModal] = useState(null);
  const { comprarAhora } = useCuponera();
  const visibles = familia ? (cuponeras || []).filter(c => c.familia === familia) : cuponeras;

  useEffect(() => {
    let vivo = true;
    getCuponeras().then(data => { if (vivo) setCuponeras(data); });
    return () => { vivo = false; };
  }, []);

  // El checkout trabaja con la forma de "oferta" de la app, no con la del
  // cupón de cuponera: acá se traduce antes de mandarlo al pago.
  const comprarCuponera = (cuponera) => comprarAhora((cuponera.cupones || []).map(c => ({
    id:              c.id,
    titulo:          c.titulo,
    badge:           c.badge,
    ahorroEstimado:  c.ahorro_estimado,
    proveedorNombre: c.socio,
    categoria:       c.categoria,
  })));

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, paddingTop: 70 }}>

      {/* ── Header ── */}
      <div style={{ background: C.navy, color: '#fff' }}>
        <div style={{ maxWidth: 1328, margin: '0 auto', padding: '48px 40px 52px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 24 }}>
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: C.font }}>Inicio</button>
            <ChevronRight size={12} />
            <span>Packs todo incluido</span>
          </div>

          <h1 style={{ fontSize: 'clamp(34px,4.4vw,54px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, margin: '0 0 12px' }}>
            Packs <span style={{ color: C.yellow }}>todo incluido</span>
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.62)', lineHeight: 1.6, margin: 0, maxWidth: 720 }}>
            Cuponeras armadas por la plataforma: alojamiento, gastronomía y experiencias combinadas.
            Comprás el pack completo de una y activás todos los cupones juntos.
          </p>
        </div>
      </div>

      {/* ── Familias, como filtro del listado ── */}
      <div style={{ maxWidth: 1328, margin: '0 auto', padding: '30px 40px 0' }}>
        {/* Sin pop de CSS sobre el ícono: la única animación del hover es la que
            trae el propio Lottie (ver components/Icono.jsx). */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${FAMILIAS_PACK.length + 1}, 1fr)`, gap: 12 }}>
          {[...FAMILIAS_PACK, MAS_PACKS].map(f => {
            const activa = familia === f.id;
            return (
              <button
                key={f.label}
                onClick={() => onFamiliaChange?.(f.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                  padding: '20px 8px 16px', borderRadius: 18, cursor: 'pointer', fontFamily: C.font,
                  fontSize: 13, fontWeight: 700, lineHeight: 1.3, textAlign: 'center',
                  background: activa ? '#fff' : 'transparent',
                  border: `1.5px solid ${activa ? C.primary : C.line}`,
                  color: activa ? C.primary : C.ink2,
                  transition: 'background .15s, border-color .15s, color .15s',
                }}
                onMouseEnter={e => { if (!activa) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = C.primary; } }}
                onMouseLeave={e => { if (!activa) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = C.line; } }}
              >
                <Icono src={f.icono} hoverEn="padre" style={{ width: 72, height: 72, display: 'block' }} />
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Listado ── */}
      <div style={{ maxWidth: 1328, margin: '0 auto', padding: '30px 40px 80px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        {visibles === null ? (
          <>
            <style>{`@keyframes packSkel { 0%,100% { opacity: .9 } 50% { opacity: .35 } }`}</style>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ height: 330, borderRadius: 24, background: '#E7E9EE', animation: 'packSkel 1.4s ease-in-out infinite', animationDelay: `${i * 0.12}s` }} />
            ))}
          </>
        ) : visibles.length === 0 ? (
          <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 24, padding: '64px 24px', textAlign: 'center', color: C.muted }}>
            {familia
              ? <>No hay packs en <strong style={{ color: C.ink }}>{familiaLabel(familia)}</strong> por ahora. <button onClick={() => onFamiliaChange?.(null)} style={{ background: 'none', border: 'none', color: C.primary, fontWeight: 700, fontSize: 'inherit', cursor: 'pointer', fontFamily: C.font }}>Ver todos</button></>
              : 'Todavía no hay packs publicados.'}
          </div>
        ) : (
          visibles.map(c => (
            <CuponeraFila
              key={c.id}
              cuponera={c}
              onVerDetalle={() => setModal(c)}
              onComprar={() => comprarCuponera(c)}
            />
          ))
        )}
      </div>

      {modal && (
        <CuponModalMock cuponera={modal} startIndex={0} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
