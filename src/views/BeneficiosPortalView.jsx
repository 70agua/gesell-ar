// ============================================================
//  src/views/BeneficiosPortalView.jsx
//  Portal de beneficios exclusivos de un alojamiento
//  URL destino: /beneficios/:negocioSlug
//  Muestra las ofertas asociadas a ese alojamiento con cabecera
//  de marca y contexto claro de que son beneficios exclusivos.
// ============================================================
import React, { useState } from 'react';

// ─── Tokens ──────────────────────────────────────────────────
const P     = '#475be1';
const NAVY  = '#0f172a';
const GREEN = '#10b981';
const YELLOW= '#f59e0b';
const LINE  = '#e2e8f0';
const BG    = '#f8fafc';
const CARD  = '#fff';
const INK   = '#0f172a';
const INK2  = '#475569';
const MUTED = '#94a3b8';
const PS    = '#eef0fd';
const GREENS= '#ecfdf5';
const FONT  = "'Inter', system-ui, sans-serif";

// ─── Mock data ───────────────────────────────────────────────
const MOCK_NEGOCIO = {
  nombre:    'Apart Hotel Las Gaviotas',
  localidad: 'Las Gaviotas',
  logo:      null,
  portada:   'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&h=400&fit=crop',
  descripcion: 'Beneficios exclusivos para huéspedes y visitantes del Apart Hotel Las Gaviotas. Disfrutá descuentos en gastronomía, actividades y servicios de la zona.',
};

const MOCK_OFERTAS = [
  {
    id: 'b1',
    titulo: 'Cena para dos en La Parrilla del Puerto',
    tipo: 'Gastronomía',
    socio: 'La Parrilla del Puerto',
    descuento: 20,
    creditos: 6,
    img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=220&fit=crop',
  },
  {
    id: 'b2',
    titulo: 'Alquiler de bicicletas — día completo',
    tipo: 'Actividades',
    socio: 'BiciAventura',
    descuento: 15,
    creditos: 4,
    img: 'https://images.unsplash.com/photo-1558981033-0f0309284409?w=400&h=220&fit=crop',
  },
  {
    id: 'b3',
    titulo: '2x1 en entrada al spa & relax',
    tipo: 'Bienestar',
    socio: 'Spa del Mar',
    descuento: 50,
    creditos: 10,
    img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=220&fit=crop',
  },
  {
    id: 'b4',
    titulo: 'Excursión en kayak al atardecer',
    tipo: 'Actividades',
    socio: 'Aventura Costera',
    descuento: 25,
    creditos: 7,
    img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=220&fit=crop',
  },
];

// ─── SVG Coin ─────────────────────────────────────────────────
function CoinSVG({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="15" fill="url(#cg)" stroke="#e0a800" strokeWidth="1.5"/>
      <text x="16" y="21" textAnchor="middle" fontSize="14" fontWeight="800" fill="#7a4f00" fontFamily="system-ui">C</text>
      <defs>
        <linearGradient id="cg" x1="8" y1="4" x2="24" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffe066"/>
          <stop offset="100%" stopColor="#f0a211"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Chip de categoría ────────────────────────────────────────
const CATEGORIAS = ['Todas', 'Gastronomía', 'Actividades', 'Bienestar'];

// ─── Tarjeta de oferta ────────────────────────────────────────
function OfertaCard({ o, onActivar }) {
  const [hover, setHover] = useState(false);
  const ahorro = Math.round(o.descuento * 800);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: CARD,
        border: `1px solid ${LINE}`,
        borderRadius: 20,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: FONT,
        boxShadow: hover ? '0 16px 48px -16px rgba(11,16,32,0.16)' : 'none',
        transform: hover ? 'translateY(-2px)' : 'none',
        transition: 'box-shadow 0.2s, transform 0.2s',
      }}
    >
      {/* Imagen */}
      <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
        <img src={o.img} alt={o.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(11,16,32,0.65) 0%, rgba(11,16,32,0.1) 50%, transparent 100%)' }}/>
        <div style={{ position:'absolute', bottom:12, left:14, color:'#fff', fontSize:38, fontWeight:800, letterSpacing:'-0.025em', lineHeight:1 }}>
          −{o.descuento}%
        </div>
        <div style={{ position:'absolute', top:10, left:10, background:'rgba(11,16,32,0.55)', backdropFilter:'blur(4px)', color:'#fff', fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:999 }}>
          {o.tipo}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:'13px 14px 14px', flex:1, display:'flex', flexDirection:'column', gap:4 }}>
        <div style={{ fontSize:11, color:MUTED, fontWeight:600 }}>{o.socio}</div>
        <div style={{ fontSize:14, fontWeight:700, color:GREEN, lineHeight:1.3, flex:1 }}>{o.titulo}</div>

        {/* Cajita precios */}
        <div style={{ border:`1px solid ${LINE}`, borderRadius:10, overflow:'hidden', marginTop:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 11px' }}>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:MUTED }}>Ahorro estimado</span>
            <span style={{ fontSize:13, fontWeight:700, color:GREEN }}>~${ahorro.toLocaleString('es-AR')}</span>
          </div>
          <div style={{ height:1, background:LINE }}/>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 11px' }}>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:MUTED }}>Lo activás con</span>
            <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, fontWeight:700, color:INK }}>
              <CoinSVG size={15}/> {o.creditos} créditos
            </span>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => onActivar(o)}
          style={{ marginTop:10, padding:'10px 0', borderRadius:12, border:'none', background:P, color:'#fff', fontFamily:FONT, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          Agregar a mi cuponera
        </button>
      </div>
    </div>
  );
}

// ─── Vista principal ──────────────────────────────────────────
export default function BeneficiosPortalView({ negocio: negocioProp, ofertas: ofertasProp, onBack, onActivarOferta }) {
  const negocio = negocioProp || MOCK_NEGOCIO;
  const todasOfertas = ofertasProp || MOCK_OFERTAS;

  const [categoria, setCategoria] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');

  const ofertas = todasOfertas.filter(o => {
    const matchCat = categoria === 'Todas' || o.tipo === categoria;
    const matchQ   = !busqueda || o.titulo.toLowerCase().includes(busqueda.toLowerCase()) || o.socio.toLowerCase().includes(busqueda.toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <div style={{ minHeight:'100vh', background:BG, fontFamily:FONT }}>

      {/* ── Hero / cabecera de marca ── */}
      <div style={{ position:'relative', height:280, overflow:'hidden' }}>
        {/* Portada */}
        <img
          src={negocio.portada}
          alt={negocio.nombre}
          style={{ width:'100%', height:'100%', objectFit:'cover' }}
        />
        {/* Gradiente oscuro */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(11,16,32,0.25) 0%, rgba(11,16,32,0.75) 100%)' }}/>

        {/* Botón volver */}
        {onBack && (
          <button onClick={onBack} style={{ position:'absolute', top:20, left:20, display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:999, padding:'7px 14px', color:'#fff', fontFamily:FONT, fontSize:13, fontWeight:600, cursor:'pointer' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>
            Volver
          </button>
        )}

        {/* Info del hotel */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'0 40px 28px' }}>
          {/* Pill "beneficios exclusivos" */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(71,91,225,0.85)', backdropFilter:'blur(6px)', borderRadius:999, padding:'5px 14px', marginBottom:12 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span style={{ fontSize:11, fontWeight:800, color:'#fff', letterSpacing:'0.06em', textTransform:'uppercase' }}>Beneficios exclusivos para huéspedes</span>
          </div>

          <div style={{ display:'flex', alignItems:'flex-end', gap:16 }}>
            {/* Logo o inicial */}
            <div style={{ width:56, height:56, borderRadius:14, background:'#fff', border:'2px solid rgba(255,255,255,0.5)', display:'grid', placeItems:'center', flexShrink:0, fontSize:22, fontWeight:800, color:P }}>
              {negocio.logo
                ? <img src={negocio.logo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:12 }}/>
                : negocio.nombre.charAt(0)
              }
            </div>
            <div>
              <div style={{ fontSize:22, fontWeight:800, color:'#fff', lineHeight:1.2, textShadow:'0 1px 8px rgba(0,0,0,0.3)' }}>{negocio.nombre}</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.75)', marginTop:3 }}>{negocio.localidad}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Descripción + stats ── */}
      <div style={{ background:CARD, borderBottom:`1px solid ${LINE}` }}>
        <div style={{ maxWidth:900, margin:'0 auto', padding:'20px 40px', display:'flex', alignItems:'center', gap:24, flexWrap:'wrap' }}>
          <p style={{ flex:1, fontSize:14, color:INK2, lineHeight:1.6, margin:0, minWidth:240 }}>
            {negocio.descripcion}
          </p>
          <div style={{ display:'flex', gap:20, flexShrink:0 }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:22, fontWeight:800, color:P }}>{todasOfertas.length}</div>
              <div style={{ fontSize:11, color:MUTED, fontWeight:600, marginTop:1 }}>beneficios</div>
            </div>
            <div style={{ width:1, background:LINE }}/>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:22, fontWeight:800, color:GREEN }}>hasta −{Math.max(...todasOfertas.map(o => o.descuento))}%</div>
              <div style={{ fontSize:11, color:MUTED, fontWeight:600, marginTop:1 }}>de descuento</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Contenido ── */}
      <div style={{ maxWidth:900, margin:'0 auto', padding:'28px 40px 60px' }}>

        {/* Filtros */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24, flexWrap:'wrap' }}>
          {/* Búsqueda */}
          <div style={{ position:'relative', flex:1, minWidth:200 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <input
              placeholder="Buscar beneficio o comercio..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ width:'100%', padding:'9px 12px 9px 36px', borderRadius:12, border:`1px solid ${LINE}`, background:CARD, fontFamily:FONT, fontSize:13, color:INK, outline:'none', boxSizing:'border-box' }}
            />
          </div>
          {/* Pills de categoría */}
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {CATEGORIAS.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoria(cat)}
                style={{ padding:'7px 14px', borderRadius:999, border:`1px solid ${categoria===cat ? P : LINE}`, background: categoria===cat ? P : CARD, color: categoria===cat ? '#fff' : INK2, fontFamily:FONT, fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Resultados */}
        {ofertas.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:MUTED, fontFamily:FONT }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={LINE} strokeWidth="1.5" style={{ display:'block', margin:'0 auto 14px' }}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <div style={{ fontSize:15, fontWeight:600, color:INK2, marginBottom:4 }}>Sin resultados</div>
            <div style={{ fontSize:13 }}>Probá con otra búsqueda o categoría.</div>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:18 }}>
            {ofertas.map(o => (
              <OfertaCard key={o.id} o={o} onActivar={onActivarOferta || (() => {})}/>
            ))}
          </div>
        )}

        {/* Footer del portal */}
        <div style={{ marginTop:48, padding:'20px 0', borderTop:`1px solid ${LINE}`, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          <img src="/logo-cuponera.svg" alt="Cuponera" style={{ height:20, opacity:0.5 }}/>
          <span style={{ fontSize:12, color:MUTED }}>Portal de beneficios exclusivos impulsado por <strong style={{ color:INK2 }}>Cuponera</strong></span>
        </div>
      </div>
    </div>
  );
}
