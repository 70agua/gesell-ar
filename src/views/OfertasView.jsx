// ============================================================
//  src/views/OfertasView.jsx — Listado de todas las ofertas
//  Diseño: mismo sistema Aire que MarketplaceView
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { secondsUntil } from '../lib/ofertas';
import { getPromos }    from '../lib/datos';
import { ALL_PROMOS }   from '../data/mockData';
import { useCuponera } from '../lib/cuponera';
import HeartButton     from '../components/HeartButton';

// ─── Tokens ──────────────────────────────────────────────────
const A = {
  primary:     '#2545E6',
  primaryDark: '#1731B8',
  primarySoft: '#EEF1FF',
  ink:         '#0B1020',
  ink2:        '#3D4255',
  muted:       '#6B7280',
  line:        '#E7E9EE',
  bg:          '#F7F7F8',
  yellow:      '#FFC93C',
  green:       '#10A36B',
  font:        "'Geist', system-ui, sans-serif",
};

const LOCALIDADES = ['Villa Gesell', 'Las Gaviotas', 'Mar de las Pampas', 'Mar Azul', 'Chacras del Mar'];

// ─── SVG Icons ───────────────────────────────────────────────
const IcoArrowL  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>;
const IcoBolt    = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>;
const IcoTicket  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z"/><path d="M13 6v12" strokeDasharray="2 3"/></svg>;
const IcoSearch  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;

function CoinSVG({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="9.25" fill="#FFC93C" stroke="#C8990A" strokeWidth="1.5"/>
      <circle cx="10" cy="10" r="6.5" fill="none" stroke="#C8990A" strokeWidth="1" opacity="0.4"/>
      <text x="10" y="14" textAnchor="middle" fill="#7A5A00" fontSize="8" fontWeight="800" fontFamily="system-ui">₲</text>
    </svg>
  );
}

// ─── CheckRow (sidebar) — toda la fila es clickeable ─────────
function CheckRow({ label, checked, onChange }) {
  return (
    <div
      onClick={onChange}
      style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', padding: '5px 0', userSelect: 'none' }}
    >
      <div style={{
        width: 17, height: 17, borderRadius: 5, flexShrink: 0,
        border: `2px solid ${checked ? A.primary : A.line}`,
        background: checked ? A.primary : '#fff',
        display: 'grid', placeItems: 'center', transition: 'all 0.15s',
      }}>
        {checked && <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      <span style={{ fontSize: 13, color: checked ? A.ink : A.ink2, fontWeight: checked ? 600 : 400, fontFamily: A.font }}>{label}</span>
    </div>
  );
}


// ─── Oferta Card (misma estética que Home) ───────────────────
function OfertaCard({ promo, onAddToCuponera, onOpenOferta }) {
  const esFlash = promo.offerType === 'Flash';
  const [secs, setSecs] = useState(() => esFlash ? secondsUntil(promo.fechaFinFlash) : 0);

  useEffect(() => {
    if (!esFlash) return;
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [esFlash]);

  const pad = n => String(n).padStart(2, '0');
  const th = Math.floor(secs / 3600);
  const tm = Math.floor((secs % 3600) / 60);
  const ts = secs % 60;

  return (
    <div
      onClick={() => onOpenOferta && onOpenOferta(promo)}
      style={{ background: '#fff', border: `1px solid ${A.line}`, borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s', fontFamily: A.font }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 16px 48px -16px rgba(11,16,32,0.18)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* Imagen */}
      <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
        <img src={promo.image} alt={promo.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,16,32,0.65) 0%, rgba(11,16,32,0.1) 50%, transparent 100%)' }} />

        {/* Fila top: pill flash + timer */}
        {esFlash && secs > 0 && (
          <div style={{ position: 'absolute', top: 12, left: 12, right: 12, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ height: '100%', display: 'inline-flex', alignItems: 'center', gap: 5, background: '#EF4444', borderRadius: 999, padding: '0 13px 0 11px' }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: '#fff', letterSpacing: '0.05em' }}>OFERTA</span>
              <span style={{ fontSize: 11, fontWeight: 900, color: A.yellow, fontStyle: 'italic', letterSpacing: '0.05em' }}>FLASH</span>
              <span style={{ color: A.yellow, display: 'flex', alignItems: 'center' }}><IcoBolt /></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: '100%' }}>
              {[th, tm, ts].map((v, i) => (
                <React.Fragment key={i}>
                  <div style={{ background: '#fff', color: A.ink, borderRadius: 7, fontSize: 14, fontWeight: 800, height: '100%', minWidth: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
                    {i === 0 ? v : pad(v)}
                  </div>
                  {i < 2 && <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 900, fontSize: 15 }}>:</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Heart — abajo derecha imagen */}
        <div style={{ position: 'absolute', bottom: 12, right: 12 }}>
          <HeartButton id={promo.id} />
        </div>

        {/* Badge descuento — abajo izquierda */}
        <div style={{ position: 'absolute', bottom: 14, left: 14, color: '#fff' }}>
          <div style={{ fontSize: (promo.badge?.length || 0) > 5 ? 29 : 42, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1 }}>{promo.badge}</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 13, color: A.muted, fontWeight: 400, marginBottom: 4 }}>
          {promo.categoria === 'alojamiento' && promo.negocioLocalidad
            ? `${promo.proveedorNombre || promo.subtitle?.split('·')[0]?.trim()} · ${promo.negocioLocalidad}`
            : promo.proveedorNombre || promo.subtitle?.split('·')[0]?.trim()}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: A.ink, lineHeight: 1.3, flex: 1 }}>{promo.title}</div>
        {promo.tokens_costo != null && (
          promo.tokens_costo === 0
            ? <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F0FDF4', borderRadius: 10, padding: '8px 12px', border: '1px solid #BBF7D0', marginTop: 10 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10A36B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4.5 4.5L20 6"/></svg>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#10A36B' }}>Cupón GRATIS</span>
              </div>
            : <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: A.bg, borderRadius: 10, padding: '8px 12px', border: `1px solid ${A.line}`, marginTop: 10 }}>
                <CoinSVG size={14} />
                <span style={{ fontSize: 13, fontWeight: 700, color: A.ink }}>{promo.tokens_costo} crédito{promo.tokens_costo !== 1 ? 's' : ''}</span>
                <span style={{ fontSize: 12, color: A.muted }}>(${(promo.tokens_costo * 2000).toLocaleString('es-AR')} + IVA)</span>
              </div>
        )}
        <button
          onClick={e => { e.stopPropagation(); onAddToCuponera && onAddToCuponera(promo); }}
          style={{ marginTop: 10, background: A.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '10px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 0.15s', flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.background = A.primaryDark}
          onMouseLeave={e => e.currentTarget.style.background = A.primary}
        >
          <IcoTicket /> Agregar a cuponera
        </button>
      </div>
    </div>
  );
}

// ─── Sección colapsable del sidebar ──────────────────────────
function SideSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: `1px solid ${A.line}`, paddingBottom: 16, marginBottom: 16 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0 10px', fontFamily: A.font }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: A.ink, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{title}</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={A.muted} strokeWidth="2" strokeLinecap="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  VISTA PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function OfertasView({ onBack, onOpenOferta }) {
  const [promos,      setPromos]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [busqueda,    setBusqueda]    = useState('');
  const { addCupon }                  = useCuponera();

  // Filtros
  const [tipoAloj,    setTipoAloj]    = useState(false);
  const [tipoGastro,  setTipoGastro]  = useState(false);
  const [tipoExp,     setTipoExp]     = useState(false);
  const [soloFlash,   setSoloFlash]   = useState(false);
  const [localidad,   setLocalidad]   = useState('');
  const [creditosMin, setCreditosMin] = useState(''); // '' | 'bajo' | 'alto'

  useEffect(() => {
    async function cargar() {
      setLoading(true);
      const { supabase } = await import('../lib/supabase');
      const now = new Date().toISOString();

      const { data } = await supabase
        .from('promociones')
        .select('*, negocios(nombre, tipo, ubicacion, localidad, zona, foto_perfil, imagen_url)')
        .eq('activa', true)
        .eq('aprobada', true)
        .order('creado_en', { ascending: false });

      const TIPOS_ALOJ   = new Set(['Hotel', 'Cabaña', 'Departamento', 'Casa', 'Hostel', 'Dormi']);
      const TIPOS_GASTRO = new Set(['Restaurante', 'Bar', 'Café', 'Balneario', 'Gourmet', 'Pastelería', 'Parrilla', 'Heladería', 'Bodegón', 'Café & Dulces']);
      const catDe = (tipo, nid) => {
        if (!tipo && nid)        return 'alojamiento';
        if (!tipo)               return 'experiencia';
        if (TIPOS_ALOJ.has(tipo))   return 'alojamiento';
        if (TIPOS_GASTRO.has(tipo)) return 'gastronomia';
        return nid ? 'alojamiento' : 'experiencia';
      };

      const reales = (data || [])
        .map(p => ({
          id:               p.id,
          negocioId:        p.negocio_id,
          offerType:        p.offer_type || 'Normal',
          title:            p.titulo,
          subtitle:         p.subtitulo || p.negocios?.nombre || '',
          badge:            p.badge || 'Promo',
          image:            p.imagen_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
          fechaFinFlash:    p.fecha_fin_flash,
          tokens_costo:     p.tokens_costo,
          categoria:        catDe(p.negocios?.tipo, p.negocio_id),
          proveedorNombre:  p.negocios?.nombre || '',
          negocioLocalidad: p.negocios?.localidad || p.negocios?.ubicacion || '',
          negocioZone:      p.negocios?.zona || '',
          esReal:           true,
        }))
        // filtrar flash expiradas
        .filter(p => p.offerType !== 'Flash' || !p.fechaFinFlash || new Date(p.fechaFinFlash) > new Date());

      const { PROMO_META } = await import('../data/mockData');
      const idsReales = new Set(reales.map(p => String(p.id)));
      const mockExtra = ALL_PROMOS
        .filter(p => !idsReales.has(String(p.id)))
        .filter(p => p.offerType !== 'Flash' || !p.fechaFinFlash || new Date(p.fechaFinFlash) > new Date())
        .map(p => ({ ...p, ...(PROMO_META[p.id] || {}) }));

      setPromos([...reales, ...mockExtra]);
      setLoading(false);
    }
    cargar();
  }, []);

  // ── Aplicar filtros ─────────────────────────────────────────
  const hayTipo  = tipoAloj || tipoGastro || tipoExp;
  const visibles = promos.filter(p => {
    if (busqueda && !p.title.toLowerCase().includes(busqueda.toLowerCase()) &&
        !(p.proveedorNombre || p.subtitle || '').toLowerCase().includes(busqueda.toLowerCase())) return false;
    if (hayTipo) {
      const ok = (tipoAloj && p.categoria === 'alojamiento') ||
                 (tipoGastro && p.categoria === 'gastronomia') ||
                 (tipoExp && p.categoria === 'experiencia');
      if (!ok) return false;
    }
    if (soloFlash && p.offerType !== 'Flash') return false;
    if (localidad && p.negocioLocalidad !== localidad && p.negocioZone !== localidad) return false;
    if (creditosMin === 'bajo' && (p.tokens_costo == null || p.tokens_costo > 3)) return false;
    if (creditosMin === 'alto' && (p.tokens_costo == null || p.tokens_costo < 5)) return false;
    return true;
  });

  const limpiarFiltros = () => {
    setTipoAloj(false); setTipoGastro(false); setTipoExp(false);
    setSoloFlash(false); setLocalidad(''); setCreditosMin('');
    setBusqueda('');
  };
  const hayFiltros = tipoAloj || tipoGastro || tipoExp || soloFlash || localidad || creditosMin || busqueda;

  return (
    <div style={{ minHeight: '100vh', background: A.bg, fontFamily: A.font, paddingTop: 70 }}>
      {/* ── Header ── */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${A.line}`, padding: '18px 40px', display: 'flex', alignItems: 'center', gap: 16, maxWidth: 1328, margin: '0 auto' }}>
        <button
          onClick={onBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', fontSize: 14, fontWeight: 600, color: A.ink2, cursor: 'pointer', flexShrink: 0, fontFamily: A.font }}
          onMouseEnter={e => e.currentTarget.style.color = A.primary}
          onMouseLeave={e => e.currentTarget.style.color = A.ink2}
        >
          <IcoArrowL /> Volver
        </button>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: A.muted, display: 'flex' }}><IcoSearch /></span>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar ofertas, negocios..."
            style={{ width: '100%', paddingLeft: 42, paddingRight: 16, paddingTop: 10, paddingBottom: 10, border: `1.5px solid ${A.line}`, borderRadius: 12, fontSize: 14, fontFamily: A.font, background: A.bg, color: A.ink, outline: 'none' }}
            onFocus={e => e.target.style.borderColor = A.primary}
            onBlur={e => e.target.style.borderColor = A.line}
          />
        </div>
      </div>

      {/* ── Layout dos columnas ── */}
      <div style={{ maxWidth: 1328, margin: '0 auto', padding: '32px 40px', display: 'flex', gap: 32, alignItems: 'flex-start' }}>

        {/* ── SIDEBAR ── */}
        <aside style={{ width: 260, flexShrink: 0, background: '#fff', borderRadius: 18, border: `1px solid ${A.line}`, padding: '20px 20px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: A.ink }}>Filtros</span>
            {hayFiltros && (
              <button onClick={limpiarFiltros} style={{ background: 'none', border: 'none', fontSize: 12, color: A.primary, cursor: 'pointer', fontWeight: 600, fontFamily: A.font }}>
                Limpiar
              </button>
            )}
          </div>

          {/* TIPO DE OFERTA */}
          <SideSection title="Tipo de oferta">
            <CheckRow label="Alojamientos"    checked={tipoAloj}   onChange={() => setTipoAloj(v => !v)} />
            <CheckRow label="Gastronomía"     checked={tipoGastro} onChange={() => setTipoGastro(v => !v)} />
            <CheckRow label="Aventura & Relax" checked={tipoExp}   onChange={() => setTipoExp(v => !v)} />
          </SideSection>

          {/* FLASH SALE */}
          <SideSection title="Flash Sale">
            <CheckRow label="Solo ofertas Flash" checked={soloFlash} onChange={() => setSoloFlash(v => !v)} />
            <p style={{ fontSize: 11, color: A.muted, marginTop: 6, lineHeight: 1.5 }}>Las Flash Sale expiran en horas. ¡Aprovechalas a tiempo!</p>
          </SideSection>

          {/* DESTINO — sugerencia 1 */}
          <SideSection title="Destino">
            <CheckRow label="Todos los destinos" checked={!localidad} onChange={() => setLocalidad('')} />
            {LOCALIDADES.map(loc => (
              <CheckRow key={loc} label={loc} checked={localidad === loc} onChange={() => setLocalidad(l => l === loc ? '' : loc)} />
            ))}
          </SideSection>

          {/* PRECIO EN CRÉDITOS — sugerencia 2 */}
          <SideSection title="Créditos" defaultOpen={false}>
            <CheckRow label="Cualquier precio"   checked={!creditosMin}          onChange={() => setCreditosMin('')} />
            <CheckRow label="1–3 créditos (gastro & exp)" checked={creditosMin === 'bajo'} onChange={() => setCreditosMin(v => v === 'bajo' ? '' : 'bajo')} />
            <CheckRow label="5+ créditos (alojamiento)"   checked={creditosMin === 'alto'} onChange={() => setCreditosMin(v => v === 'alto' ? '' : 'alto')} />
          </SideSection>
        </aside>

        {/* ── CONTENIDO ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Título */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: A.ink, letterSpacing: '-0.02em', margin: 0 }}>Ofertas imperdibles</h1>
            <p style={{ fontSize: 13, color: A.muted, marginTop: 4 }}>
              {loading ? 'Cargando...' : `${visibles.length} oferta${visibles.length !== 1 ? 's' : ''} disponible${visibles.length !== 1 ? 's' : ''} en Villa Gesell y alrededores`}
            </p>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={{ height: 340, background: A.line, borderRadius: 20, opacity: 0.5 }} />
              ))}
            </div>
          ) : visibles.length === 0 ? (
            <div style={{ background: '#fff', border: `1px solid ${A.line}`, borderRadius: 18, padding: '60px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: 15, color: A.muted, margin: 0 }}>No hay ofertas para esta combinación de filtros.</p>
              <button onClick={limpiarFiltros} style={{ marginTop: 14, background: A.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: A.font }}>
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {visibles.map(promo => (
                <OfertaCard
                  key={promo.id}
                  promo={promo}
                  onAddToCuponera={addCupon}
                  onOpenOferta={onOpenOferta}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
