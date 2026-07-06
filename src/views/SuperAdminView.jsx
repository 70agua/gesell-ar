// ============================================================
//  src/views/SuperAdminView.jsx  —  Aire design (AdminA)
// ============================================================
import React, { useState, useEffect } from 'react';
import { Pencil, Eye, EyeOff, CheckCircle2, XCircle, ChevronDown, ChevronUp, Calendar, List, LayoutGrid, BarChart2 } from 'lucide-react';
import OfertaEditorDrawer from '../components/OfertaEditorDrawer';
import { CoinSVG } from '../components/Token';
const MiniLoader = () => <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:240 }}><video autoPlay loop muted playsInline style={{ width:90, height:'auto' }}><source src="/loading-casa.webm" type="video/webm"/></video></div>;
import { descontarToken, debeUsarTokens, CREDITO_TOTAL, calcularPrecioCupon } from '../lib/cobros';
import { getPlanesConfig, actualizarPlanCopy } from '../lib/planes';
import { supabase } from '../lib/supabase';
import { PUBLI_CATEGORIAS, listarPublicidadesAdmin, crearPublicidad, actualizarPublicidad, eliminarPublicidad } from '../lib/publicidad';

// ─── Aire tokens ─────────────────────────────────────────────
const A = {
  primary:     '#2545E6',
  primarySoft: '#EEF1FF',
  ink:         '#0B1020',
  ink2:        '#3D4255',
  muted:       '#6B7280',
  line:        '#E7E9EE',
  bg:          '#F7F7F8',
  navy:        '#0B1733',
  yellow:      '#FFC93C',
  green:       '#10A36B',
  font:        "'Inter', system-ui, sans-serif",
};

const TABS = [
  { id: 'resumen',   label: 'Resumen'   },
  { id: 'negocios',  label: 'Socios'    },
  { id: 'ofertas',   label: 'Ofertas'   },
  { id: 'publicidad',label: 'Publicidad'},
  { id: 'ventas',    label: 'Ventas'    },
  { id: 'usuarios',  label: 'Usuarios'  },
  { id: 'consultas', label: 'Consultas' },
  { id: 'ajustes',   label: 'Ajustes'   },
];

// ─── Reusable UI atoms ───────────────────────────────────────
function StatusBadge({ aprobado, activo }) {
  if (!aprobado) return <span style={{ background:'#FFF4E0', color:'#C28A1B', padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:600, fontFamily:A.font }}>Pendiente</span>;
  if (aprobado && activo) return <span style={{ background:'#E8F5EC', color:A.green, padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:600, fontFamily:A.font }}>Activo</span>;
  return <span style={{ background:A.bg, color:A.muted, padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:600, fontFamily:A.font }}>Inactivo</span>;
}

function ABtn({ onClick, children, variant = 'ghost', style: extStyle = {} }) {
  const base = { border:'none', borderRadius:10, fontFamily:A.font, fontWeight:600, fontSize:13, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px', transition:'opacity .15s' };
  const variants = {
    primary: { background:A.primary, color:'#fff' },
    ghost:   { background:'#fff', border:`1px solid ${A.line}`, color:A.ink2 },
    danger:  { background:'#FCEAEA', color:'#C03030' },
    success: { background:'#E8F5EC', color:A.green },
  };
  return <button onClick={onClick} style={{ ...base, ...variants[variant], ...extStyle }}>{children}</button>;
}

// ─── Sidebar ─────────────────────────────────────────────────
function Sidebar({ tab, setTab, stats, perfil, onLogout, onGoHome }) {
  return (
    <aside style={{ background:A.navy, color:'#fff', padding:'22px 16px', display:'flex', flexDirection:'column', width:240, minWidth:240, minHeight:'100vh', position:'sticky', top:0, alignSelf:'flex-start' }}>
      {/* Logo */}
      <button onClick={onGoHome} style={{ display:'flex', alignItems:'center', gap:10, padding:'4px 8px 18px', background:'transparent', border:'none', cursor:'pointer', color:'#fff' }}>
        <div style={{ width:32, height:32, borderRadius:8, background:A.primary, display:'grid', placeItems:'center', fontFamily:A.font, fontWeight:900, fontSize:16 }}>G</div>
        <div style={{ textAlign:'left' }}>
          <div style={{ fontFamily:A.font, fontSize:14, fontWeight:700 }}>Cuponear</div>
          <div style={{ fontFamily:A.font, fontSize:11, color:'rgba(255,255,255,0.55)' }}>Superadmin</div>
        </div>
      </button>

      {/* Nav */}
      <nav style={{ display:'flex', flexDirection:'column', gap:2, marginTop:10 }}>
        {TABS.map(t => {
          const active = tab === t.id;
          const badge = t.id === 'negocios' ? stats.pendientes : t.id === 'ofertas' ? stats.ofertas : t.id === 'consultas' ? stats.consultas : 0;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
              border:'none', borderRadius:10,
              background: active ? A.primary : 'transparent',
              color: active ? '#fff' : 'rgba(255,255,255,0.7)',
              fontFamily:A.font, fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left',
            }}>
              <span style={{ flex:1 }}>{t.label}</span>
              {badge > 0 && <span style={{ background:A.yellow, color:A.ink, fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:999 }}>{badge}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ marginTop:'auto', padding:'14px 8px 4px', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontFamily:A.font, fontSize:10, color:'rgba(255,255,255,0.5)', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>Sesión activa</div>
        <div style={{ fontFamily:A.font, fontSize:13, fontWeight:600, marginTop:4 }}>{perfil?.nombre || 'Superadmin'}</div>
        <button onClick={onLogout} style={{ marginTop:10, background:'transparent', border:'none', color:'rgba(255,255,255,0.5)', fontFamily:A.font, fontSize:12, cursor:'pointer', padding:'4px 0' }}>
          Cerrar sesión →
        </button>
      </div>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function SuperAdminView({ perfil, onEditarSocio, onGoHome }) {
  const [tab, setTab]             = useState('resumen');
  const [negocios, setNegocios]   = useState([]);
  const [usuarios, setUsuarios]   = useState([]);
  const [consultas, setConsultas] = useState([]);
  const [ofertas, setOfertas]     = useState([]);
  const [ventas, setVentas]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState(null);

  useEffect(() => { cargarTodo(); }, []);

  async function cargarTodo() {
    setLoading(true);
    const [negRes, usrRes, conRes, ofRes, ventRes] = await Promise.all([
      supabase.from('negocios').select('*').order('creado_en', { ascending: false }),
      supabase.from('perfiles').select('*, negocios(nombre)').order('creado_en', { ascending: false }),
      supabase.from('consultas').select('*, negocios(nombre)').order('creado_en', { ascending: false }),
      supabase.from('promociones').select('*, negocios(nombre, tipo, localidad)').order('creado_en', { ascending: false }),
      supabase.from('ventas').select('*, venta_items(*, negocios(nombre), promociones(titulo))').order('creado_en', { ascending: false }),
    ]);
    if (negRes.data) setNegocios(negRes.data);
    if (usrRes.data) setUsuarios(usrRes.data);
    if (conRes.data) setConsultas(conRes.data);
    if (ofRes.data) {
      setOfertas(ofRes.data);
      const vencidas = ofRes.data.filter(o => o.activa && o.fecha_vencimiento && new Date(o.fecha_vencimiento) < new Date());
      if (vencidas.length > 0) {
        await supabase.from('promociones').update({ activa: false, motivo_inactiva: 'vencida' }).in('id', vencidas.map(v => v.id));
        setOfertas(prev => prev.map(o => vencidas.find(v => v.id === o.id) ? { ...o, activa: false, motivo_inactiva: 'vencida' } : o));
      }
    }
    if (ventRes.data) setVentas(ventRes.data);
    setLoading(false);
  }

  function showToast(msg, type = 'ok') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function aprobar(id) {
    const { error } = await supabase.from('negocios').update({ aprobado: true, activo: true }).eq('id', id);
    if (error) return showToast('Error al aprobar', 'error');
    setNegocios(prev => prev.map(n => n.id === id ? { ...n, aprobado: true, activo: true } : n));
    showToast('Negocio aprobado y publicado');
  }

  async function toggleActivo(id, activo) {
    const { error } = await supabase.from('negocios').update({ activo: !activo }).eq('id', id);
    if (error) return showToast('Error al actualizar', 'error');
    setNegocios(prev => prev.map(n => n.id === id ? { ...n, activo: !activo } : n));
    showToast(activo ? 'Negocio desactivado' : 'Negocio activado');
  }

  async function aprobarComprobante(id) {
    const { error } = await supabase.from('negocios').update({ puede_compartir_cuponeras: true }).eq('id', id);
    if (error) return showToast('Error al aprobar comprobante', 'error');
    setNegocios(prev => prev.map(n => n.id === id ? { ...n, puede_compartir_cuponeras: true } : n));
    showToast('Comprobante aprobado — ya puede compartir cuponeras');
  }

  async function marcarLeida(id) {
    await supabase.from('consultas').update({ leida: true }).eq('id', id);
    setConsultas(prev => prev.map(c => c.id === id ? { ...c, leida: true } : c));
  }

  const handleLogout = async () => { await supabase.auth.signOut(); window.location.reload(); };

  const ofertasPendientes = ofertas.filter(o => !o.aprobada).length;
  const stats = {
    activos:    negocios.filter(n => n.activo && n.aprobado).length,
    pendientes: negocios.filter(n => !n.aprobado).length,
    consultas:  consultas.filter(c => !c.leida).length,
    ofertas:    ofertasPendientes,
    ventas:     ventas.length,
    ingresos:   ventas.reduce((acc, v) => acc + (Number(v.monto_total) || 0), 0),
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:A.bg, fontFamily:A.font, color:A.ink }}>
      <Sidebar tab={tab} setTab={setTab} stats={stats} perfil={perfil} onLogout={handleLogout} onGoHome={onGoHome} />

      <main style={{ flex:1, padding:'22px 28px', overflow:'hidden' }}>
        {/* Toast */}
        {toast && (
          <div style={{
            position:'fixed', top:24, right:24, zIndex:50,
            display:'flex', alignItems:'center', gap:8,
            padding:'12px 20px', borderRadius:14,
            background: toast.type === 'error' ? '#C03030' : A.green,
            color:'#fff', fontFamily:A.font, fontWeight:600, fontSize:13,
            boxShadow:'0 8px 32px rgba(0,0,0,0.18)',
          }}>
            {toast.type === 'error' ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
          <div>
            <h1 style={{ fontFamily:A.font, fontSize:28, fontWeight:700, margin:0, letterSpacing:'-0.025em' }}>
              {TABS.find(t => t.id === tab)?.label}
            </h1>
            <div style={{ fontFamily:A.font, fontSize:13, color:A.muted, marginTop:4 }}>
              Panel de administración · Cuponear
            </div>
          </div>
          <ABtn onClick={cargarTodo}>↻ Actualizar</ABtn>
        </div>

        {loading ? (
          <MiniLoader />
        ) : (
          <>
            {tab === 'resumen'   && <TabResumen stats={stats} negocios={negocios} consultas={consultas} ofertas={ofertas} ventas={ventas} onEditarSocio={onEditarSocio} setTab={setTab} setOfertas={setOfertas} showToast={showToast} />}
            {tab === 'negocios'  && <TabNegocios negocios={negocios} onAprobar={aprobar} onToggle={toggleActivo} onEditarComoSocio={onEditarSocio} onAprobarComprobante={aprobarComprobante} />}
            {tab === 'ofertas'   && <TabOfertas ofertas={ofertas} setOfertas={setOfertas} showToast={showToast} />}
            {tab === 'publicidad'&& <TabPublicidad showToast={showToast} />}
            {tab === 'ventas'    && <TabVentas ventas={ventas} />}
            {tab === 'usuarios'  && <TabUsuarios usuarios={usuarios} />}
            {tab === 'consultas' && <TabConsultas consultas={consultas} onLeer={marcarLeida} />}
            {tab === 'ajustes'   && <TabAjustes showToast={showToast} />}
          </>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB: RESUMEN
// ═══════════════════════════════════════════════════════════
function TabResumen({ stats, negocios, ofertas, ventas, onEditarSocio, setTab, setOfertas, showToast }) {
  const [ofertaEditando, setOfertaEditando] = useState(null);

  const kpis = [
    { t:'Socios activos',  v: stats.activos,    d:'+4 este mes',        bg:'#E8F5EC', col:A.green  },
    { t:'Pendientes',      v: stats.pendientes, d:'por aprobar',         bg:'#FFF7E5', col:'#C28A1B' },
    { t:'Ofertas pend.',   v: stats.ofertas,    d:'revisión requerida',  bg:A.primarySoft, col:A.primary },
    { t:'Ventas totales',  v: stats.ventas,     d:`$${stats.ingresos.toLocaleString('es-AR')} acumulados`, bg:'#F3E8FF', col:'#7A3FD8' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {ofertaEditando !== null && (
        <OfertaEditorDrawer
          oferta={ofertaEditando?.id ? ofertaEditando : null}
          negocioId={ofertaEditando?.negocio_id}
          onClose={() => setOfertaEditando(null)}
          onSave={(result) => { setOfertas(prev => prev.map(o => o.id === result.id ? { ...o, ...result } : o)); setOfertaEditando(null); showToast('Oferta actualizada'); }}
        />
      )}

      {/* KPI cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, padding:16 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:k.bg, color:k.col, display:'grid', placeItems:'center', marginBottom:12, fontSize:18 }}>
              {['✓','⏳','🏷','💰'][i]}
            </div>
            <div style={{ fontFamily:A.font, fontSize:28, fontWeight:700, color:A.ink, letterSpacing:'-0.02em' }}>{k.v}</div>
            <div style={{ fontFamily:A.font, fontSize:13, color:A.ink2, fontWeight:500, marginTop:2 }}>{k.t}</div>
            <div style={{ fontFamily:A.font, fontSize:11, color:A.muted, marginTop:4 }}>{k.d}</div>
          </div>
        ))}
      </div>

      {/* 3 cols */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
        {/* Últimos socios */}
        <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, overflow:'hidden' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 18px', borderBottom:`1px solid ${A.line}` }}>
            <div style={{ fontFamily:A.font, fontSize:15, fontWeight:600 }}>Últimos socios</div>
            <button onClick={() => setTab('negocios')} style={{ background:'transparent', border:'none', fontFamily:A.font, fontSize:12, color:A.primary, fontWeight:600, cursor:'pointer' }}>Ver todos →</button>
          </div>
          {negocios.slice(0, 6).map((n, i) => (
            <button key={n.id} onClick={() => onEditarSocio && onEditarSocio(n.id)} style={{
              width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 18px',
              borderTop: i > 0 ? `1px solid ${A.line}` : 'none',
              background:'transparent', border:'none', cursor:'pointer', textAlign:'left',
            }}>
              <div style={{ width:36, height:36, borderRadius:10, overflow:'hidden', background:A.bg, shrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:A.muted, flexShrink:0 }}>
                {n.foto_perfil ? <img src={n.foto_perfil} alt={n.nombre} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : n.imagen_url ? <img src={n.imagen_url} alt={n.nombre} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : n.nombre?.[0]}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:A.font, fontSize:13, fontWeight:600, color:A.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.nombre}</div>
                <div style={{ fontFamily:A.font, fontSize:11, color:A.muted, marginTop:1 }}>{n.tipo} · {n.localidad || '—'}</div>
              </div>
              <StatusBadge aprobado={n.aprobado} activo={n.activo} />
            </button>
          ))}
          {negocios.length === 0 && <div style={{ padding:'32px 18px', textAlign:'center', color:A.muted, fontSize:13 }}>Sin socios aún</div>}
        </div>

        {/* Últimas ofertas */}
        <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, overflow:'hidden' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 18px', borderBottom:`1px solid ${A.line}` }}>
            <div style={{ fontFamily:A.font, fontSize:15, fontWeight:600 }}>Últimas ofertas</div>
            <button onClick={() => setTab('ofertas')} style={{ background:'transparent', border:'none', fontFamily:A.font, fontSize:12, color:A.primary, fontWeight:600, cursor:'pointer' }}>Ver todas →</button>
          </div>
          {ofertas.slice(0, 6).map((o, i) => (
            <button key={o.id} onClick={() => setOfertaEditando(o)} style={{
              width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 18px',
              borderTop: i > 0 ? `1px solid ${A.line}` : 'none',
              background:'transparent', border:'none', cursor:'pointer', textAlign:'left',
            }}>
              <div style={{ width:44, height:44, borderRadius:10, overflow:'hidden', background:A.bg, flexShrink:0 }}>
                {o.imagen_url
                  ? <img src={o.imagen_url} alt={o.titulo} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <div style={{ width:'100%', height:'100%', display:'grid', placeItems:'center', background:A.primarySoft, color:A.primary, fontFamily:A.font, fontWeight:700, fontSize:11 }}>{o.badge || '🏷'}</div>
                }
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:A.font, fontSize:11, color:A.muted, fontWeight:500, marginBottom:2 }}>{o.negocios?.nombre || '—'}</div>
                <div style={{ fontFamily:A.font, fontSize:13, fontWeight:600, color:A.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {o.badge && <span style={{ fontWeight:700 }}>{o.badge} · </span>}{o.titulo}
                </div>
              </div>
            </button>
          ))}
          {ofertas.length === 0 && <div style={{ padding:'32px 18px', textAlign:'center', color:A.muted, fontSize:13 }}>Sin ofertas aún</div>}
        </div>

        {/* Últimas ventas */}
        <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, overflow:'hidden' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 18px', borderBottom:`1px solid ${A.line}` }}>
            <div style={{ fontFamily:A.font, fontSize:15, fontWeight:600 }}>Últimas ventas</div>
            <button onClick={() => setTab('ventas')} style={{ background:'transparent', border:'none', fontFamily:A.font, fontSize:12, color:A.primary, fontWeight:600, cursor:'pointer' }}>Ver todas →</button>
          </div>
          {ventas.slice(0, 6).map((v, i) => (
            <div key={v.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 18px', borderTop: i > 0 ? `1px solid ${A.line}` : 'none' }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'#F3E8FF', display:'grid', placeItems:'center', flexShrink:0, fontSize:16 }}>💰</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:A.font, fontSize:13, fontWeight:700, color:A.ink }}>${Number(v.monto_total).toLocaleString('es-AR')}</div>
                <div style={{ fontFamily:A.font, fontSize:11, color:A.muted, display:'flex', alignItems:'center', gap:4 }}><img src="/cuponera-coin.svg" alt="crédito" style={{width:12,height:12}}/> {v.tokens_total} créditos · {v.venta_items?.length || 0} ofertas</div>
              </div>
              <span style={{ background: v.estado === 'completada' ? '#E8F5EC' : '#FFF7E5', color: v.estado === 'completada' ? A.green : '#C28A1B', padding:'3px 8px', borderRadius:999, fontSize:10, fontWeight:600, fontFamily:A.font }}>{v.estado}</span>
            </div>
          ))}
          {ventas.length === 0 && <div style={{ padding:'32px 18px', textAlign:'center', color:A.muted, fontSize:13 }}>Sin ventas aún</div>}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB: SOCIOS
// ═══════════════════════════════════════════════════════════
function TabNegocios({ negocios, onAprobar, onToggle, onEditarComoSocio, onAprobarComprobante }) {
  const [filtroEstado, setFiltroEstado]       = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [busqueda, setBusqueda]               = useState('');
  const [seleccionados, setSeleccionados]     = useState([]);
  const [accion, setAccion]                   = useState('');

  const comprobantesPendientes = negocios.filter(n => n.plan === 'plus' && n.puede_compartir_cuponeras === false);

  const tiposAloj   = ['Hotel','Cabaña','Departamento','Domo','Dormi','Carpa'];
  const tiposGastro = ['Restaurante','Bar','Café','Balneario','Pastelería','Gourmet'];
  const tiposExp    = ['Experiencia'];

  const filtrados = negocios.filter(n => {
    const matchEstado =
      filtroEstado === 'todos'      ? true :
      filtroEstado === 'pendientes' ? !n.aprobado :
      filtroEstado === 'activos'    ? n.aprobado && n.activo :
      filtroEstado === 'inactivos'  ? n.aprobado && !n.activo : true;
    const matchCategoria =
      filtroCategoria === 'todas'        ? true :
      filtroCategoria === 'alojamiento'  ? tiposAloj.includes(n.tipo) :
      filtroCategoria === 'salidas'  ? tiposGastro.includes(n.tipo) :
      filtroCategoria === 'aventura_relax'  ? tiposExp.includes(n.tipo) : true;
    const matchBusqueda = busqueda === '' || n.nombre.toLowerCase().includes(busqueda.toLowerCase()) || (n.localidad || '').toLowerCase().includes(busqueda.toLowerCase());
    return matchEstado && matchCategoria && matchBusqueda;
  });

  const todosSeleccionados = filtrados.length > 0 && filtrados.every(n => seleccionados.includes(n.id));
  const toggleSeleccion = id => setSeleccionados(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  const toggleTodos = () => { if (todosSeleccionados) setSeleccionados([]); else setSeleccionados(filtrados.map(n => n.id)); };

  const ejecutarAccion = async () => {
    if (!accion || seleccionados.length === 0) return;
    for (const id of seleccionados) {
      const n = negocios.find(x => x.id === id);
      if (!n) continue;
      if (accion === 'aprobar')    await onAprobar(id);
      if (accion === 'activar')    await onToggle(id, false);
      if (accion === 'desactivar') await onToggle(id, true);
    }
    setSeleccionados([]); setAccion('');
  };

  const inputStyle = { padding:'10px 14px', borderRadius:10, border:`1px solid ${A.line}`, fontSize:13, fontFamily:A.font, background:'#fff', color:A.ink, outline:'none' };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Comprobantes de transferencia pendientes de aprobación */}
      {comprobantesPendientes.length > 0 && (
        <div style={{ background:'#FFF9E8', border:'1px solid #FDE68A', borderRadius:14, padding:16 }}>
          <div style={{ fontFamily:A.font, fontSize:13, fontWeight:700, color:'#92400E', marginBottom:10 }}>
            Comprobantes de transferencia pendientes ({comprobantesPendientes.length})
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {comprobantesPendientes.map(n => (
              <div key={n.id} style={{ display:'flex', alignItems:'center', gap:12, background:'#fff', borderRadius:10, padding:'10px 14px' }}>
                <span style={{ flex:1, fontFamily:A.font, fontSize:13, fontWeight:600, color:A.ink }}>{n.nombre}</span>
                <span style={{ fontFamily:A.font, fontSize:12, color:A.muted }}>{n.tipo}{n.localidad ? ` · ${n.localidad}` : ''}</span>
                <ABtn onClick={() => onAprobarComprobante(n.id)} variant="success" style={{ fontSize:12, padding:'6px 10px' }}>Aprobar comprobante</ABtn>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barra filtros */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar socio o localidad..." style={{ ...inputStyle, flex:1, minWidth:200 }} />
        <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} style={inputStyle}>
          <option value="todas">Todas las categorías</option>
          <option value="alojamiento">Alojamientos</option>
          <option value="salidas">Salidas</option>
          <option value="aventura_relax">Aventura & Relax</option>
        </select>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={inputStyle}>
          <option value="todos">Todos los estados</option>
          <option value="pendientes">Pendientes</option>
          <option value="activos">Activos</option>
          <option value="inactivos">Inactivos</option>
        </select>
        {seleccionados.length > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:'auto' }}>
            <span style={{ fontFamily:A.font, fontSize:13, color:A.muted }}>{seleccionados.length} seleccionados</span>
            <select value={accion} onChange={e => setAccion(e.target.value)} style={inputStyle}>
              <option value="">Elegir acción...</option>
              <option value="aprobar">✓ Aprobar todos</option>
              <option value="activar">▶ Activar todos</option>
              <option value="desactivar">⏸ Desactivar todos</option>
            </select>
            <ABtn onClick={ejecutarAccion} variant="primary" style={{ opacity: accion ? 1 : 0.4 }}>Aplicar</ABtn>
          </div>
        )}
      </div>

      <div style={{ fontFamily:A.font, fontSize:13, color:A.muted }}>{filtrados.length} socios{busqueda ? ` · "${busqueda}"` : ''}</div>

      <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, overflow:'hidden' }}>
        {filtrados.length === 0 ? (
          <div style={{ padding:'48px 24px', textAlign:'center', color:A.muted, fontFamily:A.font }}>No hay socios</div>
        ) : (
          <>
            {/* Select all header */}
            <div style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 18px', background:A.bg, borderBottom:`1px solid ${A.line}` }}>
              <input type="checkbox" checked={todosSeleccionados} onChange={toggleTodos} style={{ accentColor:A.primary, width:16, height:16, cursor:'pointer' }} />
              <span style={{ fontFamily:A.font, fontSize:11, color:A.muted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                {todosSeleccionados ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </span>
            </div>
            {filtrados.map((n, i) => (
              <div key={n.id} style={{
                display:'flex', alignItems:'center', gap:14, padding:'14px 18px',
                borderTop: i === 0 ? 'none' : `1px solid ${A.line}`,
                background: seleccionados.includes(n.id) ? A.primarySoft : 'transparent',
              }}>
                <input type="checkbox" checked={seleccionados.includes(n.id)} onChange={() => toggleSeleccion(n.id)} style={{ accentColor:A.primary, width:16, height:16, cursor:'pointer', flexShrink:0 }} />
                <div style={{ width:44, height:44, borderRadius:10, overflow:'hidden', background:A.bg, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color:A.muted }}>
                  {n.foto_perfil ? <img src={n.foto_perfil} alt={n.nombre} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : n.imagen_url ? <img src={n.imagen_url} alt={n.nombre} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : n.nombre[0]}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3, flexWrap:'wrap' }}>
                    <span style={{ fontFamily:A.font, fontSize:14, fontWeight:600, color:A.ink }}>{n.nombre}</span>
                    <StatusBadge aprobado={n.aprobado} activo={n.activo} />
                  </div>
                  <div style={{ fontFamily:A.font, fontSize:12, color:A.muted }}>{n.tipo}{n.localidad ? ` · ${n.localidad}` : ''}{n.zona ? ` · ${n.zona}` : ''}</div>
                </div>
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  <ABtn onClick={() => onEditarComoSocio && onEditarComoSocio(n.id)} style={{ fontSize:12, padding:'6px 10px' }}>
                    <Pencil size={12} /> Editar
                  </ABtn>
                  {!n.aprobado && (
                    <ABtn onClick={() => onAprobar(n.id)} variant="success" style={{ fontSize:12, padding:'6px 10px' }}>
                      <CheckCircle2 size={12} /> Aprobar
                    </ABtn>
                  )}
                  {n.aprobado && (
                    <ABtn onClick={() => onToggle(n.id, n.activo)} style={{ fontSize:12, padding:'6px 10px' }}>
                      {n.activo ? <><EyeOff size={12} /> Desactivar</> : <><Eye size={12} /> Activar</>}
                    </ABtn>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB: OFERTAS
// ═══════════════════════════════════════════════════════════
function OfertaStatsPanel({ ofertaId }) {
  const [stats, setStats]     = useState(null);
  const [desde, setDesde]     = useState('');
  const [hasta, setHasta]     = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { cargar(); }, [desde, hasta]);

  async function cargar() {
    setLoading(true);
    let q = supabase.from('oferta_stats').select('evento, creado_en').eq('promocion_id', ofertaId);
    if (desde) q = q.gte('creado_en', desde);
    if (hasta) q = q.lte('creado_en', hasta + 'T23:59:59');
    const { data } = await q;
    const vistas   = (data || []).filter(e => e.evento === 'vista').length;
    const cuponera = (data || []).filter(e => e.evento === 'click_cuponera').length;
    const ampliar  = (data || []).filter(e => e.evento === 'click_ampliar').length;
    setStats({ vistas, cuponera, ampliar });
    setLoading(false);
  }

  const inputStyle = { padding:'6px 10px', borderRadius:8, border:`1px solid ${A.line}`, fontSize:12, fontFamily:A.font, background:'#fff', outline:'none', cursor:'pointer' };

  return (
    <div style={{ marginTop:14, borderTop:`1px solid ${A.line}`, paddingTop:14 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:12 }}>
        <span style={{ fontFamily:A.font, fontSize:12, fontWeight:600, color:A.muted }}>📅 Rango:</span>
        <input type="date" value={desde} onChange={e => setDesde(e.target.value)} style={inputStyle} />
        <span style={{ fontFamily:A.font, fontSize:12, color:A.muted }}>hasta</span>
        <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} style={inputStyle} />
        {(desde || hasta) && <button onClick={() => { setDesde(''); setHasta(''); }} style={{ background:'transparent', border:'none', color:A.primary, fontFamily:A.font, fontSize:12, fontWeight:600, cursor:'pointer' }}>Ver todo</button>}
      </div>
      {loading ? (
        <MiniLoader />
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10 }}>
          {[
            { label:'Vistas', value:stats.vistas, bg:A.primarySoft, col:A.primary },
            { label:'Añadir a cuponera', value:stats.cuponera, bg:'#E8F5EC', col:A.green },
            { label:'Clicks Ampliar', value:stats.ampliar, bg:'#F3E8FF', col:'#7A3FD8' },
          ].map(s => (
            <div key={s.label} style={{ background:s.bg, borderRadius:10, padding:'14px 16px' }}>
              <div style={{ fontFamily:A.font, fontSize:24, fontWeight:700, color:s.col }}>{s.value}</div>
              <div style={{ fontFamily:A.font, fontSize:12, color:s.col, marginTop:2, opacity:0.8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TabOfertas({ ofertas, setOfertas, showToast }) {
  const [filtro, setFiltro]             = useState('todas');
  const [vistaOferta, setVistaOferta]   = useState('lista');
  const [expandida, setExpandida]       = useState(null);
  const [ofertaEditando, setOfertaEditando] = useState(null);
  const [tokensVal, setTokensVal]       = useState('');
  const [aprobando, setAprobando]       = useState(null);

  const estaVencida = o => o.fecha_vencimiento && new Date(o.fecha_vencimiento) < new Date();
  const activas        = ofertas.filter(o => o.aprobada && o.activa && !estaVencida(o));
  const pendientesApro = ofertas.filter(o => !o.aprobada && o.activa !== false);
  const inactivas      = ofertas.filter(o => (!o.aprobada && o.activa === false) || (o.aprobada && !o.activa) || estaVencida(o));

  const filtradas = (() => {
    if (filtro === 'pendientes') return pendientesApro;
    if (filtro === 'inactivas')  return inactivas;
    if (filtro === 'activas')    return activas;
    return [...pendientesApro, ...activas, ...inactivas];
  })();

  async function aprobarOferta(oferta) {
    const tokens = parseInt(tokensVal);
    if (isNaN(tokens) || tokens < 0) return showToast('Ingresá un valor válido (0 o más)', 'error');
    const { error } = await supabase.from('promociones').update({ aprobada: true, activa: true, tokens_costo: tokens }).eq('id', oferta.id);
    if (error) return showToast('Error al aprobar', 'error');
    setOfertas(prev => prev.map(o => o.id === oferta.id ? { ...o, aprobada: true, activa: true, tokens_costo: tokens } : o));
    const negRes = await supabase.from('negocios').select('plan, tipo').eq('id', oferta.negocio_id).single();
    if (debeUsarTokens(negRes.data?.tipo, negRes.data?.plan)) {
      const ok = await descontarToken(oferta.negocio_id);
      if (!ok) return showToast('El socio no tiene tokens suficientes', 'error');
    }
    setAprobando(null); setTokensVal('');
    showToast(tokens === 0 ? 'Aprobada — SIN CARGO' : `Aprobada — ${tokens} crédito${tokens !== 1 ? 's' : ''}`);
  }

  async function desaprobarOferta(id) {
    await supabase.from('promociones').update({ aprobada: false, activa: false, motivo_inactiva: 'superadmin' }).eq('id', id);
    setOfertas(prev => prev.map(o => o.id === id ? { ...o, aprobada: false, activa: false, motivo_inactiva: 'superadmin' } : o));
    showToast('Oferta desactivada');
  }

  const filterBtns = [
    { id:'todas', label:'Todas', count: ofertas.length },
    { id:'activas', label:'Activas', count: activas.length },
    { id:'pendientes', label:'Pendientes', count: pendientesApro.length },
    { id:'inactivas', label:'Inactivas', count: inactivas.length },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {ofertaEditando !== null && (
        <OfertaEditorDrawer
          oferta={ofertaEditando?.id ? ofertaEditando : null}
          negocioId={ofertaEditando?.negocio_id}
          onClose={() => setOfertaEditando(null)}
          onSave={(result) => { setOfertas(prev => prev.map(o => o.id === result.id ? { ...o, ...result } : o)); setOfertaEditando(null); showToast('Oferta actualizada'); }}
        />
      )}

      {/* Filter bar */}
      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:6 }}>
          {filterBtns.map(f => (
            <button key={f.id} onClick={() => setFiltro(f.id)} style={{
              padding:'8px 16px', borderRadius:999, fontFamily:A.font, fontWeight:600, fontSize:13, cursor:'pointer',
              background: filtro === f.id ? A.ink : '#fff',
              color: filtro === f.id ? '#fff' : A.ink2,
              border: filtro === f.id ? 'none' : `1px solid ${A.line}`,
            }}>{f.label} <span style={{ opacity:0.6 }}>{f.count}</span></button>
          ))}
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:6, background:A.bg, borderRadius:10, padding:4 }}>
          <button onClick={() => setVistaOferta('lista')} style={{ padding:'6px 10px', borderRadius:8, background: vistaOferta === 'lista' ? '#fff' : 'transparent', border:'none', cursor:'pointer', color: vistaOferta === 'lista' ? A.primary : A.muted }}>
            <List size={16} />
          </button>
          <button onClick={() => setVistaOferta('cuadricula')} style={{ padding:'6px 10px', borderRadius:8, background: vistaOferta === 'cuadricula' ? '#fff' : 'transparent', border:'none', cursor:'pointer', color: vistaOferta === 'cuadricula' ? A.primary : A.muted }}>
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      <div style={{ fontFamily:A.font, fontSize:13, color:A.muted }}>{filtradas.length} ofertas</div>

      {filtradas.length === 0 ? (
        <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, padding:'48px 24px', textAlign:'center', color:A.muted, fontFamily:A.font }}>No hay ofertas en esta categoría</div>
      ) : vistaOferta === 'cuadricula' ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14 }}>
          {filtradas.map(o => (
            <div key={o.id} onClick={() => setOfertaEditando(o)} style={{
              background:'#fff', borderRadius:14, overflow:'hidden',
              border:`1px solid ${!o.aprobada ? '#FFC93C55' : A.line}`,
              cursor:'pointer', opacity: !o.activa ? 0.7 : 1,
            }}>
              <div style={{ position:'relative', aspectRatio:'1', overflow:'hidden' }}>
                <img src={o.imagen_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80'} alt={o.titulo} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(11,16,32,0.7), transparent)' }} />
                <div style={{ position:'absolute', top:8, right:8 }}>
                  {!o.aprobada ? <span style={{ background:A.yellow, color:A.ink, fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:6 }}>Pendiente</span>
                    : !o.activa ? <span style={{ background:'#6B7280', color:'#fff', fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:6 }}>Inactiva</span>
                    : <span style={{ background:A.green, color:'#fff', fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:6 }}>Activa</span>}
                </div>
                <div style={{ position:'absolute', bottom:8, left:0, right:0, padding:'0 12px', textAlign:'center' }}>
                  <div style={{ color:'#fff', fontSize:22, fontWeight:700, textShadow:'0 2px 6px rgba(0,0,0,0.4)' }}>{o.badge}</div>
                  <div style={{ color:'rgba(255,255,255,0.8)', fontSize:11, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.titulo}</div>
                </div>
              </div>
              <div style={{ padding:12 }}>
                <div style={{ fontFamily:A.font, fontSize:11, color:A.muted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.negocios?.nombre}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {filtradas.map(o => {
            const vencida = estaVencida(o);
            const fmtFecha = iso => iso ? new Date(iso).toLocaleDateString('es-AR', { day:'numeric', month:'short' }) : null;
            return (
              <div key={o.id} style={{ background:'#fff', border:`1px solid ${!o.aprobada && o.activa !== false ? '#FFC93C55' : A.line}`, borderRadius:14, overflow:'hidden' }}>
                <div style={{ display:'flex', alignItems:'center', gap:14, padding:16 }}>
                  <div style={{ width:52, height:52, borderRadius:10, overflow:'hidden', background:A.bg, flexShrink:0 }}>
                    {o.imagen_url
                      ? <img src={o.imagen_url} alt={o.titulo} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      : <div style={{ width:'100%', height:'100%', display:'grid', placeItems:'center', fontSize:20 }}>🏷</div>
                    }
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:A.font, fontSize:11, color:A.muted, marginBottom:2 }}>
                      {o.negocios?.nombre || '—'} · {o.negocios?.tipo || ''}
                    </div>
                    <div style={{ fontFamily:A.font, fontSize:14, fontWeight:600, color:A.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {o.badge && <span style={{ fontWeight:700 }}>{o.badge} · </span>}{o.titulo}
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:4, flexWrap:'wrap' }}>
                      {o.tokens_costo != null && (
                        <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontFamily:A.font, fontSize:11, color:A.muted }}>
                          <CoinSVG size={12} />{o.tokens_costo === 0 ? 'SIN CARGO' : `${o.tokens_costo} · AR$${(o.tokens_costo * CREDITO_TOTAL).toLocaleString('es-AR')}`}
                        </span>
                      )}
                      {o.ahorro_estimado > 0 && (
                        <span style={{ fontFamily:A.font, fontSize:11, color:A.green, fontWeight:600 }}>
                          Ahorro decl. ${Number(o.ahorro_estimado).toLocaleString('es-AR')}
                        </span>
                      )}
                      {filtro === 'todas' && (
                        <>
                          {!o.aprobada && o.activa !== false && <span style={{ background:'#FFF7E5', color:'#C28A1B', padding:'2px 8px', borderRadius:999, fontSize:10, fontWeight:600, fontFamily:A.font }}>Pendiente</span>}
                          {o.aprobada && o.activa && !vencida && <span style={{ background:'#E8F5EC', color:A.green, padding:'2px 8px', borderRadius:999, fontSize:10, fontWeight:600, fontFamily:A.font }}>Activa</span>}
                          {((!o.aprobada && o.activa === false) || (o.aprobada && !o.activa) || vencida) && <span style={{ background:'#FCEAEA', color:'#C03030', padding:'2px 8px', borderRadius:999, fontSize:10, fontWeight:600, fontFamily:A.font }}>{vencida ? `Vencida el ${fmtFecha(o.fecha_vencimiento)}` : 'Inactiva'}</span>}
                        </>
                      )}
                      {o.fecha_vencimiento && !vencida && o.activa && <span style={{ fontFamily:A.font, fontSize:11, color:A.muted }}>vence {fmtFecha(o.fecha_vencimiento)}</span>}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                    <ABtn onClick={() => setOfertaEditando(o)} style={{ fontSize:12, padding:'6px 10px' }}>
                      <Pencil size={12} /> Editar
                    </ABtn>
                    <button onClick={() => setExpandida(expandida === o.id ? null : o.id)} style={{
                      padding:'6px 8px', borderRadius:8, background: expandida === o.id ? '#F3E8FF' : A.bg,
                      border:'none', cursor:'pointer', color: expandida === o.id ? '#7A3FD8' : A.muted,
                    }}>
                      <BarChart2 size={15} />
                    </button>
                    {!o.aprobada && o.activa !== false ? (
                      aprobando === o.id ? (
                        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                            <input type="number" min="0" value={tokensVal} onChange={e => setTokensVal(e.target.value)}
                              placeholder="Créditos (0=gratis)"
                              style={{ width:110, padding:'6px 10px', border:`1px solid ${A.line}`, borderRadius:8, fontFamily:A.font, fontSize:12, outline:'none' }}
                            />
                            {o.ahorro_estimado > 0 && (
                              <span style={{ fontFamily:A.font, fontSize:10, color:A.muted }}>
                                Sugerido: {Math.max(1, Math.round(calcularPrecioCupon(o.ahorro_estimado) / CREDITO_TOTAL))} créd.
                              </span>
                            )}
                          </div>
                          <ABtn onClick={() => aprobarOferta(o)} variant="success" style={{ fontSize:12, padding:'6px 10px' }}>✓</ABtn>
                          <ABtn onClick={() => { setAprobando(null); setTokensVal(''); }} style={{ fontSize:12, padding:'6px 10px' }}>✕</ABtn>
                        </div>
                      ) : (
                        <ABtn onClick={() => setAprobando(o.id)} variant="success" style={{ fontSize:12, padding:'6px 10px' }}>
                          <CheckCircle2 size={12} /> Aprobar
                        </ABtn>
                      )
                    ) : o.aprobada ? (
                      <ABtn onClick={() => desaprobarOferta(o.id)} style={{ fontSize:12, padding:'6px 10px' }}>Desactivar</ABtn>
                    ) : null}
                  </div>
                </div>
                {expandida === o.id && (
                  <div style={{ padding:'0 16px 16px', borderTop:`1px solid ${A.line}` }}>
                    <OfertaStatsPanel ofertaId={o.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB: PUBLICIDAD
// ═══════════════════════════════════════════════════════════
function TabPublicidad({ showToast }) {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoria, setCategoria] = useState('alojamiento');
  const [imagenUrl, setImagenUrl] = useState('');
  const [link, setLink]     = useState('');
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    setLoading(true);
    setItems(await listarPublicidadesAdmin());
    setLoading(false);
  }
  useEffect(() => { cargar(); }, []);

  const labelCat = v => PUBLI_CATEGORIAS.find(c => c.value === v)?.label || v;

  async function agregar() {
    if (!imagenUrl.trim()) return showToast('Pegá la URL de la imagen', 'error');
    setGuardando(true);
    const { error } = await crearPublicidad({ categoria, imagen_url: imagenUrl.trim(), link: link.trim() || null });
    setGuardando(false);
    if (error) return showToast('Error al guardar la publicidad', 'error');
    setImagenUrl(''); setLink('');
    showToast('Publicidad agregada');
    cargar();
  }

  async function toggle(p) {
    const { error } = await actualizarPublicidad(p.id, { activa: !p.activa });
    if (error) return showToast('Error al actualizar', 'error');
    setItems(prev => prev.map(x => x.id === p.id ? { ...x, activa: !x.activa } : x));
  }

  async function borrar(p) {
    if (!window.confirm('¿Eliminar esta publicidad?')) return;
    const { error } = await eliminarPublicidad(p.id);
    if (error) return showToast('Error al eliminar', 'error');
    setItems(prev => prev.filter(x => x.id !== p.id));
    showToast('Publicidad eliminada');
  }

  const inputStyle = { padding:'10px 12px', borderRadius:10, border:`1px solid ${A.line}`, fontFamily:A.font, fontSize:13, outline:'none', background:'#fff', width:'100%', boxSizing:'border-box' };

  return (
    <div>
      <h2 style={{ fontFamily:A.font, fontSize:20, fontWeight:800, color:A.ink, margin:'0 0 6px' }}>Publicidad</h2>
      <p style={{ fontFamily:A.font, fontSize:13, color:A.muted, margin:'0 0 20px' }}>
        Imágenes que ocupan la primera ficha del listado. Rotan al azar, sin repetir, dentro de cada categoría.
      </p>

      {/* Alta */}
      <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:16, padding:18, marginBottom:24, display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:12 }}>
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:A.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>Categoría</label>
            <select value={categoria} onChange={e => setCategoria(e.target.value)} style={{ ...inputStyle, cursor:'pointer' }}>
              {PUBLI_CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:A.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>URL de la imagen</label>
            <input value={imagenUrl} onChange={e => setImagenUrl(e.target.value)} placeholder="https://… o /bg-aloja.jpg" style={inputStyle} />
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 160px', gap:12, alignItems:'end' }}>
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:A.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>Link (opcional)</label>
            <input value={link} onChange={e => setLink(e.target.value)} placeholder="https://… adónde lleva al hacer click" style={inputStyle} />
          </div>
          <ABtn variant="primary" onClick={agregar} style={{ justifyContent:'center', padding:'11px 0', opacity: guardando ? 0.6 : 1 }}>
            {guardando ? 'Guardando…' : 'Agregar publicidad'}
          </ABtn>
        </div>
        {imagenUrl.trim() && (
          <div style={{ width:200, aspectRatio:'3/4', borderRadius:12, overflow:'hidden', border:`1px solid ${A.line}` }}>
            <img src={imagenUrl} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>
        )}
      </div>

      {/* Listado */}
      {loading ? <MiniLoader /> : items.length === 0 ? (
        <p style={{ fontFamily:A.font, fontSize:14, color:A.muted }}>Todavía no hay publicidades cargadas.</p>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:16 }}>
          {items.map(p => (
            <div key={p.id} style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, overflow:'hidden', display:'flex', flexDirection:'column', opacity: p.activa ? 1 : 0.55 }}>
              <div style={{ aspectRatio:'3/4', overflow:'hidden', background:A.bg }}>
                <img src={p.imagen_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
              <div style={{ padding:'10px 12px', display:'flex', flexDirection:'column', gap:8 }}>
                <span style={{ fontSize:11, fontWeight:700, color:A.primary, textTransform:'uppercase', letterSpacing:'0.04em' }}>{labelCat(p.categoria)}</span>
                {p.link && <span style={{ fontSize:11, color:A.muted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.link}</span>}
                <div style={{ display:'flex', gap:8 }}>
                  <ABtn onClick={() => toggle(p)} style={{ fontSize:12, padding:'6px 10px' }}>{p.activa ? 'Pausar' : 'Activar'}</ABtn>
                  <ABtn variant="danger" onClick={() => borrar(p)} style={{ fontSize:12, padding:'6px 10px' }}>Eliminar</ABtn>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB: VENTAS
// ═══════════════════════════════════════════════════════════
function TabVentas({ ventas }) {
  const [seleccionada, setSeleccionada] = useState(null);
  const totalTokens   = ventas.reduce((acc, v) => acc + (v.tokens_total || 0), 0);
  const totalIngresos = ventas.reduce((acc, v) => acc + (Number(v.monto_total) || 0), 0);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14 }}>
        {[
          { label:'Ventas totales', value: ventas.length, icon:'🛍️' },
          { label:'Créditos vendidos', value: `🪙 ${totalTokens}`, icon:'🪙' },
          { label:'Ingresos totales', value: `$${totalIngresos.toLocaleString('es-AR')}`, icon:'💰' },
        ].map((k, i) => (
          <div key={i} style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, padding:20 }}>
            <div style={{ fontFamily:A.font, fontSize:11, color:A.muted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>{k.label}</div>
            <div style={{ fontFamily:A.font, fontSize:32, fontWeight:700, color:A.ink, letterSpacing:'-0.02em' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {ventas.length === 0 ? (
        <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, padding:'64px 24px', textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🛍️</div>
          <div style={{ fontFamily:A.font, fontSize:15, fontWeight:700, color:A.ink, marginBottom:6 }}>Sin ventas aún</div>
          <div style={{ fontFamily:A.font, fontSize:13, color:A.muted }}>Las ventas aparecerán cuando los usuarios completen cuponeras</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {ventas.map(v => (
            <div key={v.id} style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, overflow:'hidden' }}>
              <button onClick={() => setSeleccionada(seleccionada === v.id ? null : v.id)} style={{
                width:'100%', display:'flex', alignItems:'center', gap:14, padding:18,
                background:'transparent', border:'none', cursor:'pointer', textAlign:'left',
              }}>
                <div style={{ width:44, height:44, borderRadius:10, background:'#F3E8FF', display:'grid', placeItems:'center', flexShrink:0, fontSize:20 }}>💰</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <span style={{ fontFamily:A.font, fontSize:16, fontWeight:700, color:A.ink }}>${Number(v.monto_total).toLocaleString('es-AR')}</span>
                    <span style={{
                      padding:'3px 8px', borderRadius:999, fontSize:11, fontWeight:600, fontFamily:A.font,
                      background: v.estado === 'completada' ? '#E8F5EC' : '#FFF7E5',
                      color: v.estado === 'completada' ? A.green : '#C28A1B',
                    }}>{v.estado}</span>
                  </div>
                  <div style={{ fontFamily:A.font, fontSize:12, color:A.muted }}>
                    <span style={{display:'flex',alignItems:'center',gap:4}}><img src="/cuponera-coin.svg" alt="crédito" style={{width:12,height:12}}/> {v.tokens_total} créditos · {v.venta_items?.length || 0} ofertas · {v.forma_pago || '—'}</span>
                  </div>
                </div>
                {seleccionada === v.id ? <ChevronUp size={18} color={A.muted} /> : <ChevronDown size={18} color={A.muted} />}
              </button>
              {seleccionada === v.id && (
                <div style={{ padding:'0 18px 18px', borderTop:`1px solid ${A.line}` }}>
                  <div style={{ fontFamily:A.font, fontSize:11, fontWeight:600, color:A.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10, paddingTop:14 }}>Ofertas incluidas</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {(v.venta_items || []).map(item => (
                      <div key={item.id} style={{ display:'flex', alignItems:'center', gap:12, background:A.bg, borderRadius:10, padding:12 }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontFamily:A.font, fontSize:13, fontWeight:600, color:A.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.promociones?.titulo || 'Oferta'}</div>
                          <div style={{ fontFamily:A.font, fontSize:11, color:A.muted }}>{item.negocios?.nombre || '—'}</div>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                          <span style={{ fontFamily:A.font, fontSize:12, fontWeight:700, color:A.ink, display:'flex', alignItems:'center', gap:4 }}><img src="/cuponera-coin.svg" alt="crédito" style={{width:14,height:14}}/> {item.tokens}</span>
                          {item.canjeado
                            ? <span style={{ background:'#E8F5EC', color:A.green, padding:'2px 8px', borderRadius:999, fontSize:10, fontWeight:600, fontFamily:A.font }}>Canjeado</span>
                            : <span style={{ background:A.bg, color:A.muted, padding:'2px 8px', borderRadius:999, fontSize:10, fontWeight:600, fontFamily:A.font }}>Pendiente</span>
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB: USUARIOS
// ═══════════════════════════════════════════════════════════
function TabUsuarios({ usuarios }) {
  return (
    <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, overflow:'hidden' }}>
      {usuarios.length === 0 ? (
        <div style={{ padding:'48px 24px', textAlign:'center', color:A.muted, fontFamily:A.font }}>No hay usuarios registrados todavía</div>
      ) : usuarios.map((u, i) => (
        <div key={u.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 18px', borderTop: i > 0 ? `1px solid ${A.line}` : 'none' }}>
          <div style={{ width:40, height:40, borderRadius:'50%', background:A.primarySoft, display:'grid', placeItems:'center', flexShrink:0 }}>
            <span style={{ fontFamily:A.font, fontWeight:700, fontSize:14, color:A.primary }}>{(u.nombre || 'U')[0].toUpperCase()}</span>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:A.font, fontSize:14, fontWeight:600, color:A.ink }}>{u.nombre || 'Sin nombre'}</div>
            <div style={{ fontFamily:A.font, fontSize:12, color:A.muted, marginTop:2 }}>
              {u.es_superadmin ? '⭐ Superadmin' : `Negocio: ${u.negocios?.nombre || 'Sin asignar'}`}
            </div>
          </div>
          <span style={{ fontFamily:'monospace', fontSize:11, color:A.muted }}>{u.id.slice(0, 8)}...</span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB: CONSULTAS
// ═══════════════════════════════════════════════════════════
function TabConsultas({ consultas, onLeer }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {consultas.length === 0 ? (
        <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, padding:'48px 24px', textAlign:'center', color:A.muted, fontFamily:A.font }}>No hay consultas todavía</div>
      ) : consultas.map(c => (
        <div key={c.id} style={{ background:'#fff', border:`1px solid ${!c.leida ? A.primary + '44' : A.line}`, borderRadius:14, padding:20 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:14 }}>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                {!c.leida && <div style={{ width:8, height:8, borderRadius:'50%', background:A.primary, flexShrink:0 }} />}
                <span style={{ fontFamily:A.font, fontSize:14, fontWeight:600, color:A.ink }}>{c.nombre_visitante || 'Visitante anónimo'}</span>
                {c.email && <span style={{ fontFamily:A.font, fontSize:12, color:A.muted }}>· {c.email}</span>}
              </div>
              <div style={{ fontFamily:A.font, fontSize:13, color:A.ink2, lineHeight:1.5, marginBottom:8 }}>{c.mensaje}</div>
              <div style={{ display:'flex', gap:12, fontFamily:A.font, fontSize:11, color:A.muted }}>
                {c.negocios?.nombre && <span>🏢 {c.negocios.nombre}</span>}
                <span>📅 {new Date(c.creado_en).toLocaleDateString('es-AR', { day:'2-digit', month:'short', year:'numeric' })}</span>
              </div>
            </div>
            {!c.leida && (
              <ABtn onClick={() => onLeer(c.id)} variant="success" style={{ fontSize:12, padding:'6px 12px', flexShrink:0 }}>
                <CheckCircle2 size={14} /> Marcar leída
              </ABtn>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB: AJUSTES → PLANES
// ═══════════════════════════════════════════════════════════
function PlanForm({ plan, onGuardado, showToast }) {
  const [form, setForm] = useState({
    nombre: plan.nombre,
    descripcion: plan.descripcion,
    precioMes: plan.precioMes ?? '',
    mesesContrato: plan.mesesContrato ?? '',
    mesesGratisBono: plan.mesesGratisBono ?? '',
    beneficios: plan.beneficios,
  });
  const [nuevoBeneficio, setNuevoBeneficio] = useState('');
  const [saving, setSaving] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  function agregarBeneficio() {
    if (!nuevoBeneficio.trim()) return;
    setForm(f => ({ ...f, beneficios: [...f.beneficios, nuevoBeneficio.trim()] }));
    setNuevoBeneficio('');
  }
  function quitarBeneficio(i) {
    setForm(f => ({ ...f, beneficios: f.beneficios.filter((_, idx) => idx !== i) }));
  }

  async function guardar() {
    setSaving(true);
    const { error } = await actualizarPlanCopy(plan.planId, {
      nombre: form.nombre,
      descripcion: form.descripcion,
      precio_mes: form.precioMes === '' ? null : Number(form.precioMes),
      meses_contrato: form.mesesContrato === '' ? null : Number(form.mesesContrato),
      meses_gratis_bono: form.mesesGratisBono === '' ? null : Number(form.mesesGratisBono),
      beneficios: form.beneficios,
    });
    setSaving(false);
    if (error) { showToast?.('Error al guardar el plan', 'error'); return; }
    showToast?.(`Plan ${form.nombre} actualizado`, 'success');
    onGuardado?.();
  }

  const inputStyle = { width:'100%', padding:'9px 12px', border:`1px solid ${A.line}`, borderRadius:9, fontFamily:A.font, fontSize:13, outline:'none', boxSizing:'border-box' };
  const labelStyle = { display:'block', fontSize:11, fontWeight:600, color:A.muted, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:5 };

  return (
    <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, padding:22, display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ fontFamily:A.font, fontSize:16, fontWeight:700, color:A.ink }}>Plan {plan.nombre} <span style={{ fontSize:12, fontWeight:400, color:A.muted }}>({plan.codigo})</span></div>

      <div>
        <label style={labelStyle}>Nombre</label>
        <input value={form.nombre} onChange={set('nombre')} style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle}>Descripción corta</label>
        <textarea value={form.descripcion} onChange={set('descripcion')} rows={3} style={{ ...inputStyle, resize:'vertical' }} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12 }}>
        <div>
          <label style={labelStyle}>Precio mensual ($)</label>
          <input type="number" value={form.precioMes} onChange={set('precioMes')} style={inputStyle} placeholder="Sin costo" />
        </div>
        <div>
          <label style={labelStyle}>Meses de contrato</label>
          <input type="number" value={form.mesesContrato} onChange={set('mesesContrato')} style={inputStyle} placeholder="—" />
        </div>
        <div>
          <label style={labelStyle}>Meses de bono gratis</label>
          <input type="number" value={form.mesesGratisBono} onChange={set('mesesGratisBono')} style={inputStyle} placeholder="—" />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Beneficios</label>
        <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:8 }}>
          {form.beneficios.map((b, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, background:A.bg, borderRadius:8, padding:'7px 10px' }}>
              <span style={{ flex:1, fontFamily:A.font, fontSize:13, color:A.ink2 }}>{b}</span>
              <button onClick={() => quitarBeneficio(i)} style={{ background:'none', border:'none', cursor:'pointer', color:A.muted, fontSize:16, lineHeight:1 }}>×</button>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <input value={nuevoBeneficio} onChange={e => setNuevoBeneficio(e.target.value)} onKeyDown={e => e.key === 'Enter' && agregarBeneficio()}
            style={{ ...inputStyle, flex:1 }} placeholder="Agregar beneficio…" />
          <ABtn onClick={agregarBeneficio}>Agregar</ABtn>
        </div>
      </div>

      <div>
        <ABtn onClick={guardar} variant="primary" style={{ opacity: saving ? 0.6 : 1 }}>{saving ? 'Guardando…' : 'Guardar cambios'}</ABtn>
      </div>
    </div>
  );
}

function TabAjustes({ showToast }) {
  const [planes, setPlanes]   = useState([]);
  const [loading, setLoading] = useState(true);

  async function cargar() {
    setLoading(true);
    setPlanes(await getPlanesConfig());
    setLoading(false);
  }
  useEffect(() => { cargar(); }, []);

  if (loading) return <MiniLoader />;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ fontFamily:A.font, fontSize:18, fontWeight:700, color:A.ink }}>Planes</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:16 }}>
        {planes.map(p => (
          <PlanForm key={p.planId} plan={p} onGuardado={cargar} showToast={showToast} />
        ))}
      </div>
    </div>
  );
}
