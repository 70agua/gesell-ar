// ============================================================
//  src/views/SuperAdminView.jsx  —  Aire design (AdminA)
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { Pencil, Eye, EyeOff, CheckCircle2, XCircle, ChevronDown, ChevronUp, Calendar, List, LayoutGrid, BarChart2, Settings, Lock, Trash2, RefreshCw, Plus, Check, Search, Upload, Link2 } from 'lucide-react';
import { TabOfertas as SocioOfertasEditor } from './AdminNegocioView';
import { CoinSVG } from '../components/Token';
const MiniLoader = () => <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:240 }}><video autoPlay loop muted playsInline style={{ width:90, height:'auto' }}><source src="/loading-casa.webm" type="video/webm"/></video></div>;
import { CREDITO_TOTAL, calcularPrecioCupon } from '../lib/cobros';
import { getVentasPendientes, confirmarVentaTransferencia, anularVentaPendiente } from '../lib/compras';
import { getCanjesReportados, anularCanje, descartarReporteCanje } from '../lib/canjes';
import { getPlanesPro, actualizarPlanCopy } from '../lib/planes';
import { supabase } from '../lib/supabase';
import { PORTADA_CATEGORIAS, listarPortadasAdmin, crearPortada, actualizarPortada, eliminarPortada } from '../lib/portadas';
import { getDemandaDestinos } from '../lib/demanda';
import { categoriaDeNegocio, normalizePromo } from '../lib/datos';
import OfertaCard from '../components/OfertaCard';
import PortadaCupopack from '../components/PortadaCupopack';
import { FAMILIAS_PACK, familiaLabel } from '../lib/familiasPack';
import { listarCupopacks, crearCupopack, actualizarCupopack, eliminarCupopack, agregarCuponASet, quitarCuponDeSet } from '../lib/cupopacks';
import { BENEFICIO_ICONOS, getBeneficioIcon } from '../lib/beneficioIconos';
import { BENEFICIO_TIPOS, tipoBeneficio } from '../lib/beneficiosCupopack';
import { CAPACIDADES, listarRoles, crearRol, actualizarRol, eliminarRol, listarUsuariosAdmin, crearUsuario, actualizarUsuario, eliminarUsuario } from '../lib/adminUsuarios';

// ─── Helpers ──────────────────────────────────────────────────
function formatearCategoria(categoria) {
  const map = {
    'alojamiento': 'Alojamiento',
    'salidas': 'Salidas',
    'aventura_relax': 'Aventura & Relax',
  };
  return map[categoria] || categoria;
}

// Rubros canónicos para el select de "Tipo" (los 3 vigentes del modelo actual).
const TIPOS_RUBRO = [
  { value: 'alojamiento',    label: 'Alojamiento' },
  { value: 'salidas',        label: 'Salidas' },
  { value: 'aventura_relax', label: 'Aventura & Relax' },
];

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
  { id: 'socios',    label: 'Socios comerciales' },
  { id: 'pendientes', label: 'Pendientes' },
  { id: 'turistas',  label: 'Turistas'  },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'estadisticas', label: 'Estadísticas y ventas' },
  { id: 'consultas', label: 'Consultas' },
  { id: 'ajustes',   label: 'General', sep: true, sub: [
    { id: 'contenidos', label: 'Contenidos dinámicos' },
    { id: 'imagenes', label: 'Imágenes de socios' },
  ] },
];

// ─── Reusable UI atoms ───────────────────────────────────────
// El negocio ya no se aprueba: el socio se da de alta y queda publicado. Lo
// único que decide la visibilidad es `activo`, que maneja el propio socio.
function StatusBadge({ activo }) {
  if (activo) return <span style={{ background:'#E8F5EC', color:A.green, padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:600, fontFamily:A.font }}>Activo</span>;
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

// Tab-bar de píldoras para navegación interna de una pantalla.
function PillTabs({ tabs, value, onChange }) {
  return (
    <div style={{ display:'inline-flex', gap:4, background:A.bg, border:`1px solid ${A.line}`, borderRadius:12, padding:4 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          padding:'8px 16px', borderRadius:9, border:'none', cursor:'pointer',
          fontFamily:A.font, fontSize:13, fontWeight:600,
          background: value === t.id ? '#fff' : 'transparent',
          color: value === t.id ? A.primary : A.muted,
          boxShadow: value === t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          transition:'background .15s, color .15s',
        }}>{t.label}</button>
      ))}
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────
function Sidebar({ tab, setTab, subTab, setSubTab, stats, perfil, onLogout, onGoHome, onOpenConfig }) {
  return (
    <aside style={{ background:A.navy, color:'#fff', padding:'22px 16px', display:'flex', flexDirection:'column', width:240, minWidth:240, minHeight:'100vh', position:'sticky', top:0, alignSelf:'flex-start' }}>
      {/* Logo */}
      <div style={{ padding:'0 0 16px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
        <button onClick={onGoHome} title="Ir a la home" style={{ background:'none', border:'none', padding:0, cursor:'pointer', display:'block' }}>
          <img src="/logo-cuponear-wh.svg" alt="Cuponear" style={{ width:180, height:'auto', display:'block' }} />
        </button>
        <div style={{ fontSize:10.5, color:'rgba(255,255,255,0.5)', fontWeight:600, letterSpacing:'0.04em' }}>Panel de control</div>
      </div>

      {/* Nav */}
      <nav style={{ display:'flex', flexDirection:'column', gap:2, marginTop:10 }}>
        {TABS.map(t => {
          const active = tab === t.id;
          const badge = t.id === 'pendientes' ? stats.pendientes : t.id === 'marketplace' ? stats.ofertas : t.id === 'consultas' ? stats.consultas : 0;
          // El badge de consultas es un círculo de notificación rojo (mensajes sin leer de Cuponix).
          const esNotif = t.id === 'consultas';
          return (
            <div key={t.id} style={t.sep ? { marginTop:10, paddingTop:10, borderTop:'1px solid rgba(255,255,255,0.12)' } : undefined}>
              <button onClick={() => { setTab(t.id); if (t.sub) setSubTab(t.sub[0].id); }} style={{
                display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                border:'none', borderRadius:10, width:'100%',
                background: active ? A.primary : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.7)',
                fontFamily:A.font, fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left',
              }}>
                <span style={{ flex:1 }}>{t.label}</span>
                {badge > 0 && (
                  esNotif
                    ? <span style={{ minWidth:18, height:18, padding:'0 5px', boxSizing:'border-box', background:'#EF4444', color:'#fff', fontSize:10, fontWeight:700, borderRadius:999, display:'inline-flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 0 2px rgba(239,68,68,0.25)' }}>{badge}</span>
                    : <span style={{ background:A.yellow, color:A.ink, fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:999 }}>{badge}</span>
                )}
              </button>
              {/* Submenú de Ajustes */}
              {active && t.sub && (
                <div style={{ display:'flex', flexDirection:'column', gap:1, paddingLeft:16, marginTop:4 }}>
                  {t.sub.map(s => (
                    <button key={s.id} onClick={() => setSubTab(s.id)} style={{
                      display:'flex', alignItems:'center', padding:'8px 10px',
                      border:'none', borderRadius:8, background:'transparent',
                      color: subTab === s.id ? '#fff' : 'rgba(255,255,255,0.5)',
                      fontFamily:A.font, fontSize:12, fontWeight: subTab === s.id ? 600 : 400, cursor:'pointer', textAlign:'left',
                    }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ marginTop:'auto', padding:'14px 8px 4px', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontFamily:A.font, fontSize:10, color:'rgba(255,255,255,0.5)', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>Sesión activa</div>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:A.font, fontSize:13, fontWeight:600 }}>{perfil?.nombre || 'Superadmin'}</div>
          </div>
          <button onClick={() => onOpenConfig?.()} title="Ajustes · usuarios y permisos" style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.7)', cursor:'pointer', padding:'4px', display:'flex', alignItems:'center', transition:'color 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
            <Settings size={18} />
          </button>
        </div>
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
  const [subTab, setSubTab]       = useState('contenidos'); // Para Ajustes
  const [negocios, setNegocios]   = useState([]);
  const [usuarios, setUsuarios]   = useState([]);
  const [turistas, setTuristas]   = useState([]);
  const [consultas, setConsultas] = useState([]);
  const [ofertas, setOfertas]     = useState([]);
  const [ventas, setVentas]       = useState([]);
  const [compras, setCompras]     = useState([]);   // token_compras — créditos publicitarios
  const [ventasPend, setVentasPend] = useState([]); // ventas por transferencia sin confirmar
  const [canjesRep, setCanjesRep]   = useState([]); // canjes reportados por el socio
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState(null);
  const [negocioEditando, setNegocioEditando] = useState(null);
  const [filtroNegocioId, setFiltroNegocioId] = useState(null);
  const [showConfig, setShowConfig] = useState(false); // Panel del engranaje (usuarios y permisos)

  useEffect(() => { cargarTodo(); }, []);

  async function cargarTodo() {
    setLoading(true);
    const [negRes, usrRes, conRes, ofRes, ventRes, comRes] = await Promise.all([
      supabase.from('negocios').select('*').order('creado_en', { ascending: false }),
      supabase.from('perfiles').select('*, negocios(nombre)').order('creado_en', { ascending: false }),
      supabase.from('consultas').select('*, negocios(nombre)').order('creado_en', { ascending: false }),
      supabase.from('promociones').select('*, negocios(nombre, tipo, localidad, zona, foto_perfil, imagen_url)').order('creado_en', { ascending: false }),
      supabase.from('ventas').select('*, venta_items(*, negocios(nombre), promociones(titulo))').order('creado_en', { ascending: false }),
      supabase.from('token_compras').select('*, negocios(nombre, tipo, localidad)').order('creado_en', { ascending: false }),
    ]);
    if (negRes.data) setNegocios(negRes.data);
    if (usrRes.data) {
      // Separar turistas (sin negocio) de administrativos/socios
      const sólosAdmins = usrRes.data.filter(u => u.es_superadmin);
      const solosTuristas = usrRes.data.filter(u => !u.negocio_id && !u.es_superadmin);
      setUsuarios(sólosAdmins);
      setTuristas(solosTuristas);
    }
    if (conRes.data) setConsultas(conRes.data);
    if (ofRes.data) {
      // Los borradores (autosave del socio) no entran al panel del superadmin.
      const publicables = ofRes.data.filter(o => !o.borrador);
      setOfertas(publicables);
      const vencidas = publicables.filter(o => o.activa && o.fecha_vencimiento && new Date(o.fecha_vencimiento) < new Date());
      if (vencidas.length > 0) {
        await supabase.from('promociones').update({ activa: false, motivo_inactiva: 'vencida' }).in('id', vencidas.map(v => v.id));
        setOfertas(prev => prev.map(o => vencidas.find(v => v.id === o.id) ? { ...o, activa: false, motivo_inactiva: 'vencida' } : o));
      }
    }
    if (ventRes.data) setVentas(ventRes.data);
    if (comRes.data) setCompras(comRes.data);
    setVentasPend(await getVentasPendientes());
    setCanjesRep(await getCanjesReportados());
    setLoading(false);
  }


  function showToast(msg, type = 'ok') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function toggleActivo(id, activo) {
    const { error } = await supabase.from('negocios').update({ activo: !activo }).eq('id', id);
    if (error) return showToast('Error al actualizar', 'error');
    setNegocios(prev => prev.map(n => n.id === id ? { ...n, activo: !activo } : n));
    showToast(activo ? 'Negocio desactivado' : 'Negocio activado');
  }

  async function toggleActivoUsuario(id, estado) {
    const { error } = await supabase.from('perfiles').update({ bloqueado: !estado }).eq('id', id);
    if (error) return showToast('Error al actualizar', 'error');
    setTuristas(prev => prev.map(u => u.id === id ? { ...u, bloqueado: !estado } : u));
    showToast(estado ? 'Turista desbloqueado' : 'Turista bloqueado');
  }

  async function marcarLeida(id) {
    await supabase.from('consultas').update({ leida: true }).eq('id', id);
    setConsultas(prev => prev.map(c => c.id === id ? { ...c, leida: true } : c));
  }

  const handleLogout = async () => { await supabase.auth.signOut(); window.location.reload(); };

  const ofertasPendientes = ofertas.filter(o => !o.aprobada).length;
  const stats = {
    activos:    negocios.filter(n => n.activo).length,
    inactivos:  negocios.filter(n => !n.activo).length,
    creditosVendidos: compras.reduce((acc, c) => acc + (Number(c.cantidad) || 0), 0),
    pendientes: compras.filter(c => PAGO_A_CONCILIAR.has(c.forma_pago)).length + ventasPend.length + canjesRep.length,
    consultas:  consultas.filter(c => !c.leida).length,
    ofertas:    ofertasPendientes,
    ventas:     ventas.length,
    ingresos:   ventas.reduce((acc, v) => acc + (Number(v.monto_total) || 0), 0),
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:A.bg, fontFamily:A.font, color:A.ink }}>
      <Sidebar tab={tab} setTab={setTab} subTab={subTab} setSubTab={setSubTab} stats={stats} perfil={perfil} onLogout={handleLogout} onGoHome={onGoHome} onOpenConfig={() => setShowConfig(true)} />

      {/* Panel de ajustes (usuarios y permisos) — se abre con el engranaje */}
      {showConfig && <ConfigPanel showToast={showToast} onClose={() => setShowConfig(false)} />}

      <main style={{ flex:1, padding:'22px 28px', overflow:'hidden' }}>
        {/* Drawer: Editar socio comercial */}
        {negocioEditando && (
          <SocioEditDrawer negocio={negocioEditando} onClose={() => setNegocioEditando(null)} onSave={(actualizado) => { setNegocios(prev => prev.map(n => n.id === actualizado.id ? actualizado : n)); setNegocioEditando(null); showToast('Socio actualizado'); }} onVerCupones={() => { setTab('marketplace'); setFiltroNegocioId(negocioEditando.id); setNegocioEditando(null); }} />
        )}

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
              {TABS.find(t => t.id === tab)?.sub && (
                <span style={{ fontSize:18, fontWeight:400, color:A.muted, marginLeft:10 }}>
                  · {TABS.find(t => t.id === tab).sub.find(s => s.id === subTab)?.label}
                </span>
              )}
            </h1>
            <div style={{ fontFamily:A.font, fontSize:13, color:A.muted, marginTop:4 }}>
              Panel de administración · Cuponear
            </div>
          </div>
          <ABtn onClick={cargarTodo}><RefreshCw size={14} /> Actualizar</ABtn>
        </div>

        {loading ? (
          <MiniLoader />
        ) : (
          <>
            {tab === 'resumen'   && <TabResumen stats={stats} negocios={negocios} consultas={consultas} ofertas={ofertas} ventas={ventas} onEditarSocio={onEditarSocio} setTab={setTab} setOfertas={setOfertas} showToast={showToast} onActualizar={cargarTodo} />}
            {tab === 'socios'    && <TabNegocios negocios={negocios} onToggle={toggleActivo} onEditarComoSocio={onEditarSocio} onActualizar={cargarTodo} />}
            {tab === 'pendientes' && <TabPendientes compras={compras} ventas={ventasPend} canjes={canjesRep} onActualizar={cargarTodo} showToast={showToast} />}
            {tab === 'turistas'  && <TabTuristas usuarios={turistas} onToggle={toggleActivoUsuario} onActualizar={cargarTodo} />}
            {tab === 'marketplace' && <TabMarketplace ofertas={ofertas} setOfertas={setOfertas} showToast={showToast} negocioEditando={negocioEditando} setNegocioEditando={setNegocioEditando} filtroNegocioId={filtroNegocioId} setFiltroNegocioId={setFiltroNegocioId} negocios={negocios} onActualizar={cargarTodo} />}
            {tab === 'consultas' && <TabConsultas consultas={consultas} onLeer={marcarLeida} />}
            {tab === 'estadisticas' && (
              <div style={{ display:'flex', flexDirection:'column', gap:32 }}>
                <div>
                  <h2 style={{ fontFamily:A.font, fontSize:18, fontWeight:800, color:A.ink, margin:'0 0 4px' }}>Ventas</h2>
                  <p style={{ fontFamily:A.font, fontSize:13, color:A.muted, margin:'0 0 16px' }}>Cupopacks vendidos y su detalle.</p>
                  <TabVentas ventas={ventas} />
                </div>
                <TabEstadisticas />
              </div>
            )}
            {tab === 'ajustes' && subTab === 'contenidos' && <TabAjusteContenidos showToast={showToast} />}
            {tab === 'ajustes' && subTab === 'imagenes' && <TabAjusteImagenes showToast={showToast} />}
          </>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB: RESUMEN
// ═══════════════════════════════════════════════════════════
function TabResumen({ stats, negocios, ofertas, ventas, onEditarSocio, setTab, setOfertas, showToast, onActualizar }) {
  const [ofertaEditando, setOfertaEditando] = useState(null);

  const kpis = [
    { t:'Socios activos',  v: stats.activos,    d:'+4 este mes',        bg:'#E8F5EC', col:A.green  },
    { t:'Pendientes',        v: stats.pendientes,       d:'esperan decisión', bg:'#FFF7E5', col:'#C28A1B' },
    { t:'Ofertas pend.',   v: stats.ofertas,    d:'revisión requerida',  bg:A.primarySoft, col:A.primary },
    { t:'Ventas totales',  v: stats.ventas,     d:`$${stats.ingresos.toLocaleString('es-AR')} acumulados`, bg:'#F3E8FF', col:'#7A3FD8' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {ofertaEditando !== null && (
        <CuponEditDrawer oferta={ofertaEditando} negocios={negocios} ofertas={ofertas}
          showToast={showToast} onClose={() => setOfertaEditando(null)}
          onOfertaGuardada={row => setOfertas(prev => prev.map(o => o.id === row.id ? { ...o, ...row, negocios: o.negocios } : o))} />
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
              <StatusBadge activo={n.activo} />
            </button>
          ))}
          {negocios.length === 0 && <div style={{ padding:'32px 18px', textAlign:'center', color:A.muted, fontSize:13 }}>Sin socios aún</div>}
        </div>

        {/* Últimas ofertas */}
        <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, overflow:'hidden' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 18px', borderBottom:`1px solid ${A.line}` }}>
            <div style={{ fontFamily:A.font, fontSize:15, fontWeight:600 }}>Últimas ofertas</div>
            <button onClick={() => setTab('marketplace')} style={{ background:'transparent', border:'none', fontFamily:A.font, fontSize:12, color:A.primary, fontWeight:600, cursor:'pointer' }}>Ver todas →</button>
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
                <div style={{ fontFamily:A.font, fontSize:11, color:A.muted, display:'flex', alignItems:'center', gap:4 }}><img src="/credito-coin.svg" alt="crédito" style={{width:12,height:12}}/> {v.tokens_total} créditos · {v.venta_items?.length || 0} ofertas</div>
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
//  TAB: PENDIENTES — bandeja única
//
//  Antes había un tab por cada cosa que esperaba una decisión: créditos por
//  transferencia, ventas por transferencia y ahora canjes reportados. Tres
//  lugares distintos para el mismo gesto (mirar algo y decidir) hacen que
//  alguno se quede sin mirar. Es una sola bandeja con filtro por tipo.
// ═══════════════════════════════════════════════════════════
const FORMA_PAGO_LABEL = {
  transferencia: 'Transferencia',
  efectivo:      'Efectivo',
  mercadopago:   'MercadoPago',
  tarjeta:       'Tarjeta',
};

// Las compras de créditos que hay que ir a chequear contra el banco o la caja.
const PAGO_A_CONCILIAR = new Set(['transferencia', 'efectivo']);

const fmtFechaCompra = iso => iso
  ? new Date(iso).toLocaleDateString('es-AR', { day:'numeric', month:'short' })
  : null;

const fmtPesos = n => '$' + Math.round(Number(n) || 0).toLocaleString('es-AR');

// Una fila de la bandeja, con la misma gramática para los tres tipos:
// qué pasó · de quién · cuánto · qué se puede hacer.
function FilaPendiente({ icono, titulo, detalle, monto, acciones, tono = 'neutro', ultima }) {
  const fondo = { neutro: A.primarySoft, alerta: '#FFF7E5' }[tono] || A.primarySoft;
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:14, padding:'14px 16px', flexWrap:'wrap',
      borderBottom: ultima ? 'none' : `1px solid ${A.line}`,
    }}>
      <div style={{ width:38, height:38, borderRadius:11, background:fondo, display:'grid', placeItems:'center', flexShrink:0, fontSize:17 }}>
        {icono}
      </div>
      <div style={{ flex:1, minWidth:190 }}>
        <div style={{ fontFamily:A.font, fontSize:14, fontWeight:700, color:A.ink }}>{titulo}</div>
        <div style={{ fontFamily:A.font, fontSize:12, color:A.muted, marginTop:2, lineHeight:1.45 }}>{detalle}</div>
      </div>
      {monto != null && (
        <div style={{ fontFamily:A.font, fontSize:14, fontWeight:700, color:A.ink, minWidth:96, textAlign:'right' }}>
          {fmtPesos(monto)}
        </div>
      )}
      <div style={{ display:'flex', gap:8, flexShrink:0 }}>{acciones}</div>
    </div>
  );
}

function TabPendientes({ compras, ventas, canjes, onActualizar, showToast }) {
  const [filtro, setFiltro]   = useState('todos');
  const [enCurso, setEnCurso] = useState(null);

  const creditos = compras.filter(c => PAGO_A_CONCILIAR.has(c.forma_pago));

  const TIPOS = [
    { id: 'todos',    label: `Todo (${creditos.length + ventas.length + canjes.length})` },
    { id: 'canjes',   label: `Canjes reportados (${canjes.length})` },
    { id: 'ventas',   label: `Ventas por confirmar (${ventas.length})` },
    { id: 'creditos', label: `Créditos por conciliar (${creditos.length})` },
  ];
  const ver = id => filtro === 'todos' || filtro === id;

  async function correr(clave, fn, exito) {
    setEnCurso(clave);
    const res = await fn();
    setEnCurso(null);
    if (!res.ok) return showToast(`No se pudo: ${res.error}`, 'error');
    showToast(exito);
    onActualizar();
  }

  const vacia = (ver('canjes') ? canjes.length : 0) + (ver('ventas') ? ventas.length : 0)
              + (ver('creditos') ? creditos.length : 0) === 0;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ background:A.primarySoft, border:`1px solid ${A.line}`, borderRadius:14, padding:'14px 16px' }}>
        <div style={{ fontFamily:A.font, fontSize:13, color:A.ink2, lineHeight:1.5 }}>
          Todo lo que espera una decisión, en un solo lugar. Los <b>canjes reportados</b> y las
          <b> ventas por transferencia</b> tienen a alguien esperando del otro lado; los
          <b> créditos</b> son conciliación contra el banco.
        </div>
      </div>

      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {TIPOS.map(f => (
          <button key={f.id} onClick={() => setFiltro(f.id)} style={{
            border: `1px solid ${filtro === f.id ? A.primary : A.line}`,
            background: filtro === f.id ? A.primarySoft : '#fff',
            color: filtro === f.id ? A.primary : A.ink2,
            borderRadius:999, padding:'7px 14px', fontFamily:A.font, fontSize:12.5, fontWeight:600, cursor:'pointer',
          }}>{f.label}</button>
        ))}
      </div>

      <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:16, overflow:'hidden' }}>
        {vacia && (
          <div style={{ padding:'44px 18px', textAlign:'center', fontFamily:A.font, fontSize:13, color:A.muted }}>
            No hay nada esperando.
          </div>
        )}

        {/* ── Canjes reportados: es lo que tiene a un turista sin su cupón ── */}
        {ver('canjes') && canjes.map((c, i) => (
          <FilaPendiente key={c.id} icono="⚠️" tono="alerta"
            ultima={i === canjes.length - 1 && !ver('ventas') && !ver('creditos')}
            titulo={`Canje reportado · ${c.comprobante}`}
            detalle={`${c.negocios?.nombre || 'socio'} — ${c.promociones?.titulo || 'oferta'} · ${c.reporte_motivo || 'sin motivo'} · ${fmtFechaCompra(c.reportado_el) || ''}`}
            monto={c.ahorro_monto}
            acciones={<>
              <ABtn variant="danger" style={{ fontSize:12, padding:'7px 12px' }}
                onClick={() => correr(c.id, () => anularCanje(c.id, c.reporte_motivo), 'Canje anulado — el cupón volvió al turista')}>
                {enCurso === c.id ? 'Anulando…' : 'Anular canje'}
              </ABtn>
              <ABtn style={{ fontSize:12, padding:'7px 12px' }}
                onClick={() => correr(c.id, () => descartarReporteCanje(c.id), 'Reporte descartado — el canje queda como está')}>
                Estaba bien
              </ABtn>
            </>} />
        ))}

        {/* ── Ventas por transferencia ── */}
        {ver('ventas') && ventas.map((v, i) => (
          <FilaPendiente key={v.id} icono="🧾" tono="alerta"
            ultima={i === ventas.length - 1 && !ver('creditos')}
            titulo={`Venta por transferencia · ${(v.venta_items || []).length} cupón(es)`}
            detalle={`${(v.venta_items || []).map(it => it.promociones?.titulo).filter(Boolean).join(' · ') || 'sin detalle'}${v.puntos_usados > 0 ? ` · ${v.puntos_usados} puntos aplicados` : ''} · ${fmtFechaCompra(v.creado_en) || ''}`}
            monto={v.monto_total}
            acciones={<>
              <ABtn variant="success" style={{ fontSize:12, padding:'7px 12px' }}
                onClick={() => correr(v.id, () => confirmarVentaTransferencia(v.id), 'Cupones emitidos y cashback acreditado')}>
                {enCurso === v.id ? 'Emitiendo…' : 'Confirmar pago'}
              </ABtn>
              <ABtn variant="danger" style={{ fontSize:12, padding:'7px 12px' }}
                onClick={() => correr(v.id, () => anularVentaPendiente(v.id), 'Venta anulada')}>Anular</ABtn>
            </>} />
        ))}

        {/* ── Créditos por conciliar: no bloquean a nadie, se verifican ── */}
        {ver('creditos') && creditos.map((c, i) => (
          <FilaPendiente key={c.id} icono={<CoinSVG size={19} />}
            ultima={i === creditos.length - 1}
            titulo={`${c.negocios?.nombre || 'Socio'} · ${c.cantidad} crédito${c.cantidad !== 1 ? 's' : ''}`}
            detalle={`${FORMA_PAGO_LABEL[c.forma_pago] || c.forma_pago}${c.descuento_pct > 0 ? ` · ${c.descuento_pct}% off` : ''} · ${fmtFechaCompra(c.creado_en) || ''} — ya acreditados, falta verificar que entró la plata`}
            monto={c.total_con_iva}
            acciones={<span style={{ fontFamily:A.font, fontSize:11, fontWeight:600, color:'#8A6412', background:'#FFF7E5', padding:'4px 10px', borderRadius:999 }}>
              Verificar cobro
            </span>} />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB: SOCIOS
// ═══════════════════════════════════════════════════════════
function TabNegocios({ negocios, onToggle, onEditarComoSocio, onActualizar }) {
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroLocalidad, setFiltroLocalidad] = useState('todas');
  const [ordenamiento, setOrdenamiento]       = useState('creado');
  const [busqueda, setBusqueda]               = useState('');
  const [seleccionados, setSeleccionados]     = useState([]);
  const [accion, setAccion]                   = useState('');

  const tiposAloj   = ['Hotel','Cabaña','Departamento','Domo','Dormi','Carpa'];
  const tiposGastro = ['Restaurante','Bar','Café','Balneario','Pastelería','Gourmet'];
  const tiposExp    = ['Experiencia'];

  // Localidades únicas disponibles
  const localidades = [...new Set(negocios.map(n => n.localidad).filter(Boolean))].sort();

  let filtrados = negocios.filter(n => {
    const matchCategoria =
      filtroCategoria === 'todas'        ? true :
      filtroCategoria === 'alojamiento'  ? tiposAloj.includes(n.tipo) :
      filtroCategoria === 'salidas'  ? tiposGastro.includes(n.tipo) :
      filtroCategoria === 'aventura_relax'  ? tiposExp.includes(n.tipo) : true;
    const matchLocalidad = filtroLocalidad === 'todas' || (n.localidad === filtroLocalidad);
    const matchBusqueda = busqueda === '' || n.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return matchCategoria && matchLocalidad && matchBusqueda;
  });

  // Aplicar ordenamiento
  if (ordenamiento === 'nombre') {
    filtrados = filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  } else if (ordenamiento === 'modificado') {
    filtrados = filtrados.sort((a, b) => new Date(b.actualizado_en || 0) - new Date(a.actualizado_en || 0));
  } else if (ordenamiento === 'creado') {
    filtrados = filtrados.sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en));
  }

  const todosSeleccionados = filtrados.length > 0 && filtrados.every(n => seleccionados.includes(n.id));
  const toggleSeleccion = id => setSeleccionados(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  const toggleTodos = () => { if (todosSeleccionados) setSeleccionados([]); else setSeleccionados(filtrados.map(n => n.id)); };

  const ejecutarAccion = async () => {
    if (!accion || seleccionados.length === 0) return;

    // Confirmación única para eliminación masiva
    if (accion === 'eliminar') {
      if (!window.confirm(`¿Eliminar ${seleccionados.length} socio(s) comercial(es)?`)) return;
      await supabase.from('negocios').delete().in('id', seleccionados);
    } else if (accion === 'bloquear') {
      for (const id of seleccionados) {
        await onToggle(id, false);
      }
    }
    setSeleccionados([]); setAccion('');
    // Refrescar la lista después de la acción
    onActualizar?.();
  };

  const inputStyle = { padding:'10px 14px', borderRadius:10, border:`1px solid ${A.line}`, fontSize:13, fontFamily:A.font, background:'#fff', color:A.ink, outline:'none' };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Barra filtros */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar nombre ó email..." style={{ ...inputStyle, flex:1, minWidth:200 }} />
        <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} style={inputStyle}>
          <option value="todas">Todas las categorías</option>
          <option value="alojamiento">Alojamientos</option>
          <option value="salidas">Salidas</option>
          <option value="aventura_relax">Aventura & Relax</option>
        </select>
        <select value={filtroLocalidad} onChange={e => setFiltroLocalidad(e.target.value)} style={inputStyle}>
          <option value="todas">Todas las localidades</option>
          {localidades.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
        <select value={ordenamiento} onChange={e => setOrdenamiento(e.target.value)} style={inputStyle}>
          <option value="creado">Último creado</option>
          <option value="modificado">Último modificado</option>
          <option value="nombre">Nombre A-Z</option>
        </select>
        {seleccionados.length > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:'auto' }}>
            <span style={{ fontFamily:A.font, fontSize:13, color:A.muted }}>{seleccionados.length} seleccionados</span>
            <select value={accion} onChange={e => setAccion(e.target.value)} style={inputStyle}>
              <option value="">Elegir acción...</option>
              <option value="bloquear">🔒 Bloquear</option>
              <option value="eliminar">🗑️ Eliminar</option>
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
                    <StatusBadge activo={n.activo} />
                  </div>
                  <div style={{ fontFamily:A.font, fontSize:12, color:A.muted }}>{formatearCategoria(n.tipo)}{n.localidad ? ` · ${n.localidad}` : ''}{n.zona ? ` · ${n.zona}` : ''}</div>
                </div>
                <div style={{ display:'flex', gap:8, flexShrink:0, alignItems:'center' }}>
                  {/* Ver/Editar */}
                  <button onClick={() => onEditarComoSocio && onEditarComoSocio(n.id)} title="Ver/Editar socio" style={{ background:'none', border:'none', cursor:'pointer', padding:'4px', display:'flex', alignItems:'center', color:A.primary, opacity:0.7, transition:'opacity 0.15s' }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}>
                    <Pencil size={18} />
                  </button>
                  {/* Bloquear/Desbloquear */}
                  <button onClick={() => onToggle(n.id, n.activo)} title={n.activo ? 'Bloquear socio' : 'Desbloquear socio'} style={{ background:'none', border:'none', cursor:'pointer', padding:'4px', display:'flex', alignItems:'center', color: n.activo ? A.muted : '#C03030', opacity:0.7, transition:'opacity 0.15s' }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}>
                    <Lock size={18} />
                  </button>
                  {/* Eliminar */}
                  <button onClick={async () => {
                    if (!window.confirm(`¿Eliminar a "${n.nombre}"?`)) return;
                    await supabase.from('negocios').delete().eq('id', n.id);
                    onActualizar?.();
                  }} title="Eliminar socio" style={{ background:'none', border:'none', cursor:'pointer', padding:'4px', display:'flex', alignItems:'center', color:'#EF4444', opacity:0.7, transition:'opacity 0.15s' }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}>
                    <Trash2 size={18} />
                  </button>
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
//  TAB: TURISTAS
// ═══════════════════════════════════════════════════════════
function TabTuristas({ usuarios, onToggle, onActualizar }) {
  const [busqueda, setBusqueda]         = useState('');
  const [filtroLocalidad, setFiltroLocalidad] = useState('todas');
  const [filtroProvincia, setFiltroProvincia] = useState('todas');
  const [ordenamiento, setOrdenamiento] = useState('creado');
  const [seleccionados, setSeleccionados] = useState([]);
  const [accion, setAccion]             = useState('');

  // Localidades y provincias únicas disponibles
  const localidades = [...new Set(usuarios.map(u => u.localidad).filter(Boolean))].sort();
  const provincias = [...new Set(usuarios.map(u => u.provincia).filter(Boolean))].sort();

  let filtrados = usuarios.filter(u => {
    const matchLocalidad = filtroLocalidad === 'todas' || (u.localidad === filtroLocalidad);
    const filtroProv = filtroProvincia === 'todas' || (u.provincia === filtroProvincia);
    const matchBusqueda = busqueda === '' || (u.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) || (u.email || '').toLowerCase().includes(busqueda.toLowerCase());
    return matchLocalidad && filtroProv && matchBusqueda;
  });

  // Aplicar ordenamiento
  if (ordenamiento === 'nombre') {
    filtrados = filtrados.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'));
  } else if (ordenamiento === 'localidad') {
    filtrados = filtrados.sort((a, b) => (a.localidad || '').localeCompare(b.localidad || '', 'es'));
  } else if (ordenamiento === 'provincia') {
    filtrados = filtrados.sort((a, b) => (a.provincia || '').localeCompare(b.provincia || '', 'es'));
  } else if (ordenamiento === 'modificado') {
    filtrados = filtrados.sort((a, b) => new Date(b.actualizado_en || 0) - new Date(a.actualizado_en || 0));
  } else if (ordenamiento === 'creado') {
    filtrados = filtrados.sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en));
  }

  const todosSeleccionados = filtrados.length > 0 && filtrados.every(u => seleccionados.includes(u.id));
  const toggleSeleccion = id => setSeleccionados(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  const toggleTodos = () => { if (todosSeleccionados) setSeleccionados([]); else setSeleccionados(filtrados.map(u => u.id)); };

  const ejecutarAccion = async () => {
    if (!accion || seleccionados.length === 0) return;

    // Confirmación única para eliminación masiva
    if (accion === 'eliminar') {
      if (!window.confirm(`¿Eliminar ${seleccionados.length} turista(s)?`)) return;
      await supabase.from('perfiles').delete().in('id', seleccionados);
    } else if (accion === 'bloquear') {
      for (const id of seleccionados) {
        const u = usuarios.find(x => x.id === id);
        if (!u) continue;
        await onToggle(id, u?.bloqueado);
      }
    }
    setSeleccionados([]); setAccion('');
    // Refrescar la lista después de la acción
    onActualizar?.();
  };

  const inputStyle = { padding:'10px 14px', borderRadius:10, border:`1px solid ${A.line}`, fontSize:13, fontFamily:A.font, background:'#fff', color:A.ink, outline:'none' };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Barra filtros */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)} style={{ ...inputStyle, flex:1, minWidth:200 }} placeholder="Buscar nombre ó email…" />
        <select value={filtroProvincia} onChange={e => setFiltroProvincia(e.target.value)} style={inputStyle}>
          <option value="todas">Todas las provincias</option>
          {provincias.map(prov => (
            <option key={prov} value={prov}>{prov}</option>
          ))}
        </select>
        <select value={filtroLocalidad} onChange={e => setFiltroLocalidad(e.target.value)} style={inputStyle}>
          <option value="todas">Todas las localidades</option>
          {localidades.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
        <select value={ordenamiento} onChange={e => setOrdenamiento(e.target.value)} style={inputStyle}>
          <option value="creado">Último creado</option>
          <option value="modificado">Último modificado</option>
          <option value="nombre">Nombre A-Z</option>
          <option value="localidad">Localidad A-Z</option>
          <option value="provincia">Provincia A-Z</option>
        </select>
        {seleccionados.length > 0 && (
          <div style={{ display:'flex', gap:8, alignItems:'center', marginLeft:'auto' }}>
            <span style={{ fontFamily:A.font, fontSize:13, color:A.muted }}>{seleccionados.length} seleccionados</span>
            <select value={accion} onChange={e => setAccion(e.target.value)} style={{ ...inputStyle, minWidth:120 }}>
              <option value="">Elegir acción...</option>
              <option value="bloquear">🔒 Bloquear</option>
              <option value="eliminar">🗑️ Eliminar</option>
            </select>
            <ABtn onClick={ejecutarAccion} variant="primary" style={{ opacity: accion ? 1 : 0.4 }}>Aplicar</ABtn>
          </div>
        )}
      </div>

      <div style={{ borderTop:`1px solid ${A.line}`, paddingTop:14 }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, fontFamily:A.font }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${A.line}` }}>
              <th style={{ padding:'10px 12px', textAlign:'left', fontWeight:600, color:A.muted, textTransform:'uppercase', letterSpacing:'0.05em', fontSize:11 }}>
                <input type="checkbox" checked={todosSeleccionados} onChange={toggleTodos} style={{ cursor:'pointer' }} />
              </th>
              <th style={{ padding:'10px 12px', textAlign:'left', fontWeight:600, color:A.muted, textTransform:'uppercase', letterSpacing:'0.05em', fontSize:11 }}>Nombre</th>
              <th style={{ padding:'10px 12px', textAlign:'left', fontWeight:600, color:A.muted, textTransform:'uppercase', letterSpacing:'0.05em', fontSize:11 }}>Email</th>
              <th style={{ padding:'10px 12px', textAlign:'left', fontWeight:600, color:A.muted, textTransform:'uppercase', letterSpacing:'0.05em', fontSize:11 }}>Localidad</th>
              <th style={{ padding:'10px 12px', textAlign:'left', fontWeight:600, color:A.muted, textTransform:'uppercase', letterSpacing:'0.05em', fontSize:11 }}>Provincia</th>
              <th style={{ padding:'10px 12px', textAlign:'left', fontWeight:600, color:A.muted, textTransform:'uppercase', letterSpacing:'0.05em', fontSize:11 }}>Registrado</th>
              <th style={{ padding:'10px 12px', textAlign:'left', fontWeight:600, color:A.muted, textTransform:'uppercase', letterSpacing:'0.05em', fontSize:11 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map(u => (
              <tr key={u.id} style={{ borderBottom:`1px solid ${A.line}`, background: seleccionados.includes(u.id) ? A.primarySoft : 'transparent' }}>
                <td style={{ padding:'10px 12px' }}>
                  <input type="checkbox" checked={seleccionados.includes(u.id)} onChange={() => toggleSeleccion(u.id)} style={{ cursor:'pointer' }} />
                </td>
                <td style={{ padding:'10px 12px', color:A.ink }}>{u.nombre || '(sin nombre)'}</td>
                <td style={{ padding:'10px 12px', color:A.ink2, fontSize:12 }}>{u.email}</td>
                <td style={{ padding:'10px 12px', color:A.muted, fontSize:12 }}>{u.localidad || '—'}</td>
                <td style={{ padding:'10px 12px', color:A.muted, fontSize:12 }}>{u.provincia || '—'}</td>
                <td style={{ padding:'10px 12px', color:A.muted, fontSize:12 }}>{new Date(u.creado_en).toLocaleDateString('es-AR')}</td>
                <td style={{ padding:'10px 12px' }}>
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    {/* Ver/Editar (stub: simplemente muestra toast) */}
                    <button onClick={() => alert('Edición de turistas (próximamente)')} title="Ver/Editar turista" style={{ background:'none', border:'none', cursor:'pointer', padding:'4px', display:'flex', alignItems:'center', color:A.primary, opacity:0.7, transition:'opacity 0.15s' }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}>
                      <Pencil size={16} />
                    </button>
                    {/* Bloquear/Desbloquear */}
                    <button onClick={() => onToggle(u.id, u?.bloqueado)} title={u.bloqueado ? 'Desbloquear turista' : 'Bloquear turista'} style={{ background:'none', border:'none', cursor:'pointer', padding:'4px', display:'flex', alignItems:'center', color: u.bloqueado ? '#C03030' : A.muted, opacity:0.7, transition:'opacity 0.15s' }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}>
                      <Lock size={16} />
                    </button>
                    {/* Eliminar */}
                    <button onClick={async () => {
                      if (!window.confirm(`¿Eliminar a "${u.nombre || 'este turista'}"?`)) return;
                      await supabase.from('perfiles').delete().eq('id', u.id);
                      onActualizar?.();
                    }} title="Eliminar turista" style={{ background:'none', border:'none', cursor:'pointer', padding:'4px', display:'flex', alignItems:'center', color:'#EF4444', opacity:0.7, transition:'opacity 0.15s' }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtrados.length === 0 && <div style={{ textAlign:'center', color:A.muted, padding:30 }}>Sin resultados</div>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB: CUPONES (antes "OFERTAS")
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
            { label:'Añadir al carrito', value:stats.cuponera, bg:'#E8F5EC', col:A.green },
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

// ─── Drawer de edición de UN cupón (reusa el editor del socio en modo solo-editor) ─
function CuponEditDrawer({ oferta, negocios, ofertas, showToast, onClose, onOfertaGuardada }) {
  const neg = negocios.find(n => n.id === oferta.negocio_id);
  const promosDelNegocio = ofertas.filter(o => o.negocio_id === oferta.negocio_id);
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(11,16,32,0.42)', backdropFilter:'blur(2px)', zIndex:60 }} />
      {/* 70% del ancho del drawer anterior (620px → ~434px) */}
      <div style={{ position:'fixed', top:0, right:0, height:'100vh', width:'100%', maxWidth:434, background:'#fff', zIndex:61, boxShadow:'-10px 0 44px rgba(0,0,0,0.20)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <SocioOfertasEditor
          soloEditor
          modoAdmin
          ofertaInicial={oferta}
          dbPromos={promosDelNegocio}
          negocioId={oferta.negocio_id}
          negocioTipo={neg?.tipo}
          showToast={(msg, type) => showToast(msg, type === 'err' ? 'error' : 'ok')}
          plan={neg?.plan || 'free'}
          onUpgrade={() => {}}
          onCerrarEditor={onClose}
          onOfertaGuardada={onOfertaGuardada}
        />
      </div>
    </>
  );
}

// ─── Contenido visual de una fila de cupón (foto + socio + título + métricas) ─
// Compartido entre el listado de Cupones y el armador de "Nuevo Cupopack".
function CuponRowBody({ o, precioDe, onSocio }) {
  const vencida = o.fecha_vencimiento && new Date(o.fecha_vencimiento) < new Date();
  const fmtFecha = iso => iso ? new Date(iso).toLocaleDateString('es-AR', { day:'numeric', month:'short' }) : null;
  return (
    <>
      <div style={{ width:52, height:52, borderRadius:10, overflow:'hidden', background:A.bg, flexShrink:0 }}>
        {o.imagen_url
          ? <img src={o.imagen_url} alt={o.titulo} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : <div style={{ width:'100%', height:'100%', display:'grid', placeItems:'center', fontSize:20 }}>🏷</div>
        }
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:A.font, fontSize:11, color:A.muted, marginBottom:2 }}>
          {onSocio
            ? <button onClick={onSocio} style={{ background:'none', border:'none', color:A.primary, cursor:'pointer', fontWeight:600, textDecoration:'underline', padding:0, fontFamily:A.font }}>{o.negocios?.nombre || '—'}</button>
            : <span style={{ color:A.ink2, fontWeight:600 }}>{o.negocios?.nombre || '—'}</span>
          } · {formatearCategoria(o.negocios?.tipo) || ''}
        </div>
        <div style={{ fontFamily:A.font, fontSize:14, fontWeight:600, color:A.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {o.badge && <span style={{ fontWeight:700 }}>{o.badge} · </span>}{o.titulo}
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:4, flexWrap:'wrap' }}>
          {o.ahorro_estimado > 0 && (
            <span style={{ fontFamily:A.font, fontSize:11, color:A.green, fontWeight:600 }}>
              Ahorro decl. ${Number(o.ahorro_estimado).toLocaleString('es-AR')}
            </span>
          )}
          {precioDe(o) > 0 && (
            <span style={{ fontFamily:A.font, fontSize:11, color:A.ink2, fontWeight:600 }}>
              Activación ${precioDe(o).toLocaleString('es-AR')}
            </span>
          )}
          {!o.aprobada && o.activa !== false && <span style={{ background:'#FFF7E5', color:'#C28A1B', padding:'2px 8px', borderRadius:999, fontSize:10, fontWeight:600, fontFamily:A.font }}>Pendiente</span>}
          {o.aprobada && o.activa && !vencida && <span style={{ background:'#E8F5EC', color:A.green, padding:'2px 8px', borderRadius:999, fontSize:10, fontWeight:600, fontFamily:A.font }}>Activa</span>}
          {((!o.aprobada && o.activa === false) || (o.aprobada && !o.activa) || vencida) && <span style={{ background:'#FCEAEA', color:'#C03030', padding:'2px 8px', borderRadius:999, fontSize:10, fontWeight:600, fontFamily:A.font }}>{vencida ? `Vencida el ${fmtFecha(o.fecha_vencimiento)}` : 'Inactiva'}</span>}
          {o.fecha_vencimiento && !vencida && o.activa && <span style={{ fontFamily:A.font, fontSize:11, color:A.muted }}>vence {fmtFecha(o.fecha_vencimiento)}</span>}
        </div>
      </div>
    </>
  );
}

function TabOfertas({ ofertas, setOfertas, showToast, negocioEditando, setNegocioEditando, filtroNegocioId, setFiltroNegocioId, negocios, onActualizar }) {
  const [filtro, setFiltro]             = useState('todas');   // estado: todas|activas|pendientes|inactivas
  const [vistaOferta, setVistaOferta]   = useState('lista');
  const [expandida, setExpandida]       = useState(null);
  const [ofertaEditando, setOfertaEditando] = useState(null);
  const [busqueda, setBusqueda]         = useState('');
  const [filtroLocalidad, setFiltroLocalidad] = useState('todas');
  const [filtroSocio, setFiltroSocio]   = useState('todos');
  const [filtroTipo, setFiltroTipo]     = useState('todos');
  const [ordenamiento, setOrdenamiento] = useState('creado');
  const [seleccionados, setSeleccionados] = useState([]);
  const [accionLote, setAccionLote]     = useState('');

  const estaVencida = o => o.fecha_vencimiento && new Date(o.fecha_vencimiento) < new Date();
  const precioDe   = o => calcularPrecioCupon(Number(o.ahorro_estimado) || 0);
  const estadoDe   = o => (!o.aprobada && o.activa !== false) ? 'pendiente'
    : (o.aprobada && o.activa && !estaVencida(o)) ? 'activa' : 'inactiva';
  const rubroDe    = o => categoriaDeNegocio(o.negocios?.tipo, o.negocio_id);

  const base = filtroNegocioId ? ofertas.filter(o => o.negocio_id === filtroNegocioId) : ofertas;
  const activas        = base.filter(o => estadoDe(o) === 'activa');
  const pendientesApro = base.filter(o => estadoDe(o) === 'pendiente');
  const inactivas      = base.filter(o => estadoDe(o) === 'inactiva');

  // Opciones de los selects (derivadas de los cupones visibles)
  const localidades = [...new Set(base.map(o => o.negocios?.localidad).filter(Boolean))].sort();
  const socios = [...new Map(base.filter(o => o.negocio_id).map(o => [o.negocio_id, o.negocios?.nombre || '—'])).entries()]
    .sort((a, b) => (a[1] || '').localeCompare(b[1] || '', 'es'));

  let filtradas = base.filter(o => {
    const est = estadoDe(o);
    const matchEstado    = filtro === 'todas' || (filtro === 'activas' && est === 'activa') || (filtro === 'pendientes' && est === 'pendiente') || (filtro === 'inactivas' && est === 'inactiva');
    const matchLocalidad = filtroLocalidad === 'todas' || o.negocios?.localidad === filtroLocalidad;
    const matchSocio     = filtroSocio === 'todos' || o.negocio_id === filtroSocio;
    const matchTipo      = filtroTipo === 'todos' || rubroDe(o) === filtroTipo;
    const q = busqueda.trim().toLowerCase();
    const matchBusqueda  = !q || (o.titulo || '').toLowerCase().includes(q) || (o.negocios?.nombre || '').toLowerCase().includes(q);
    return matchEstado && matchLocalidad && matchSocio && matchTipo && matchBusqueda;
  });

  const rankEstado = { activa: 0, pendiente: 1, inactiva: 2 };
  filtradas = filtradas.slice().sort((a, b) => {
    switch (ordenamiento) {
      case 'nombre':     return (a.titulo || '').localeCompare(b.titulo || '', 'es');
      case 'modificado': return new Date(b.publicada_en || b.creado_en || 0) - new Date(a.publicada_en || a.creado_en || 0);
      case 'ahorro':     return (Number(b.ahorro_estimado) || 0) - (Number(a.ahorro_estimado) || 0);
      case 'precio':     return precioDe(b) - precioDe(a);
      case 'estado':     return rankEstado[estadoDe(a)] - rankEstado[estadoDe(b)];
      default:           return new Date(b.creado_en || 0) - new Date(a.creado_en || 0); // 'creado'
    }
  });

  const todosSeleccionados = filtradas.length > 0 && filtradas.every(o => seleccionados.includes(o.id));
  const toggleSeleccion = id => setSeleccionados(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  const toggleTodos = () => setSeleccionados(todosSeleccionados ? [] : filtradas.map(o => o.id));

  async function aprobarOferta(oferta) {
    // El precio se define dentro del editor de la oferta (ahorro declarado), no aquí
    const { error } = await supabase.from('promociones').update({ aprobada: true, activa: true }).eq('id', oferta.id);
    if (error) return showToast('Error al aprobar', 'error');
    setOfertas(prev => prev.map(o => o.id === oferta.id ? { ...o, aprobada: true, activa: true } : o));
    showToast('Cupón aprobado');
  }

  async function desaprobarOferta(id) {
    await supabase.from('promociones').update({ aprobada: false, activa: false, motivo_inactiva: 'superadmin' }).eq('id', id);
    setOfertas(prev => prev.map(o => o.id === id ? { ...o, aprobada: false, activa: false, motivo_inactiva: 'superadmin' } : o));
    showToast('Oferta desactivada');
  }

  async function ejecutarAccionLote() {
    if (!accionLote || seleccionados.length === 0) return;
    if (accionLote === 'aprobar') {
      await supabase.from('promociones').update({ aprobada: true, activa: true }).in('id', seleccionados);
      setOfertas(prev => prev.map(o => seleccionados.includes(o.id) ? { ...o, aprobada: true, activa: true } : o));
      showToast(`${seleccionados.length} cupón(es) aprobado(s)`);
    } else if (accionLote === 'desactivar') {
      await supabase.from('promociones').update({ aprobada: false, activa: false, motivo_inactiva: 'superadmin' }).in('id', seleccionados);
      setOfertas(prev => prev.map(o => seleccionados.includes(o.id) ? { ...o, aprobada: false, activa: false, motivo_inactiva: 'superadmin' } : o));
      showToast(`${seleccionados.length} cupón(es) desactivado(s)`);
    } else if (accionLote === 'eliminar') {
      if (!window.confirm(`¿Eliminar ${seleccionados.length} cupón(es)? Esta acción no se puede deshacer.`)) return;
      await supabase.from('promociones').delete().in('id', seleccionados);
      setOfertas(prev => prev.filter(o => !seleccionados.includes(o.id)));
      showToast(`${seleccionados.length} cupón(es) eliminado(s)`);
    }
    setSeleccionados([]); setAccionLote('');
  }

  const selStyle = { padding:'9px 12px', borderRadius:10, border:`1px solid ${A.line}`, fontSize:13, fontFamily:A.font, background:'#fff', color:A.ink, outline:'none', cursor:'pointer' };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {ofertaEditando !== null && (
        <CuponEditDrawer oferta={ofertaEditando} negocios={negocios} ofertas={ofertas}
          showToast={showToast} onClose={() => setOfertaEditando(null)}
          onOfertaGuardada={row => setOfertas(prev => prev.map(o => o.id === row.id ? { ...o, ...row, negocios: o.negocios } : o))} />
      )}

      {/* Filtro activo por negocio */}
      {filtroNegocioId && (
        <div style={{ background:'#E8F5EC', border:`1px solid ${A.green}`, borderRadius:14, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <span style={{ fontFamily:A.font, fontSize:13, color:A.green, fontWeight:600 }}>
            Mostrando cupones de "{negocios.find(n => n.id === filtroNegocioId)?.nombre || '—'}"
          </span>
          <button onClick={() => setFiltroNegocioId(null)} style={{ background:'none', border:'none', color:A.green, cursor:'pointer', fontWeight:600, fontFamily:A.font }}>
            Limpiar filtro ×
          </button>
        </div>
      )}

      {/* Cabecera: búsqueda + filtros + orden (estilo Turistas/Socios) */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar cupón ó socio..." style={{ ...selStyle, cursor:'text', flex:1, minWidth:180 }} />
        <select value={filtro} onChange={e => setFiltro(e.target.value)} style={selStyle}>
          <option value="todas">Todos los estados</option>
          <option value="activas">Activas ({activas.length})</option>
          <option value="pendientes">Pendientes ({pendientesApro.length})</option>
          <option value="inactivas">Inactivas ({inactivas.length})</option>
        </select>
        <select value={filtroLocalidad} onChange={e => setFiltroLocalidad(e.target.value)} style={selStyle}>
          <option value="todas">Todas las localidades</option>
          {localidades.map(loc => <option key={loc} value={loc}>{loc}</option>)}
        </select>
        <select value={filtroSocio} onChange={e => setFiltroSocio(e.target.value)} style={selStyle}>
          <option value="todos">Todos los socios</option>
          {socios.map(([id, nombre]) => <option key={id} value={id}>{nombre}</option>)}
        </select>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={selStyle}>
          <option value="todos">Todos los tipos</option>
          {TIPOS_RUBRO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={ordenamiento} onChange={e => setOrdenamiento(e.target.value)} style={selStyle}>
          <option value="creado">Fecha de creación</option>
          <option value="modificado">Fecha de modificación</option>
          <option value="nombre">Nombre A-Z</option>
          <option value="ahorro">Ahorro declarado</option>
          <option value="precio">Precio</option>
          <option value="estado">Estado</option>
        </select>
        <div style={{ display:'flex', gap:6, background:A.bg, borderRadius:10, padding:4 }}>
          <button onClick={() => setVistaOferta('lista')} style={{ padding:'6px 10px', borderRadius:8, background: vistaOferta === 'lista' ? '#fff' : 'transparent', border:'none', cursor:'pointer', color: vistaOferta === 'lista' ? A.primary : A.muted }}>
            <List size={16} />
          </button>
          <button onClick={() => setVistaOferta('cuadricula')} style={{ padding:'6px 10px', borderRadius:8, background: vistaOferta === 'cuadricula' ? '#fff' : 'transparent', border:'none', cursor:'pointer', color: vistaOferta === 'cuadricula' ? A.primary : A.muted }}>
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* Fila de resultados + acciones en lote */}
      <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        <div style={{ fontFamily:A.font, fontSize:13, color:A.muted }}>{filtradas.length} cupones</div>
        {seleccionados.length > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:'auto' }}>
            <span style={{ fontFamily:A.font, fontSize:13, color:A.muted }}>{seleccionados.length} seleccionados</span>
            <select value={accionLote} onChange={e => setAccionLote(e.target.value)} style={selStyle}>
              <option value="">Acción en lote...</option>
              <option value="aprobar">✅ Aprobar</option>
              <option value="desactivar">⏸️ Desactivar</option>
              <option value="eliminar">🗑️ Eliminar</option>
            </select>
            <ABtn onClick={ejecutarAccionLote} variant="primary" style={{ opacity: accionLote ? 1 : 0.4 }}>Aplicar</ABtn>
          </div>
        )}
      </div>

      {filtradas.length === 0 ? (
        <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, padding:'48px 24px', textAlign:'center', color:A.muted, fontFamily:A.font }}>No hay cupones con estos filtros</div>
      ) : vistaOferta === 'cuadricula' ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(230px, 1fr))', gap:16, alignItems:'start' }}>
          {filtradas.map(o => {
            const est = estadoDe(o);
            const badgeEstado = est === 'pendiente' ? { t:'Pendiente', bg:'#FFF7E5', c:'#C28A1B' }
              : est === 'activa' ? { t:'Activa', bg:'#E8F5EC', c:A.green }
              : { t:'Inactiva', bg:'#FCEAEA', c:'#C03030' };
            return (
              <div key={o.id} style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {/* Minificha idéntica al frontend */}
                <div style={{ position:'relative' }}>
                  <div style={{ position:'absolute', top:8, left:8, zIndex:2 }}>
                    <input type="checkbox" checked={seleccionados.includes(o.id)} onChange={() => toggleSeleccion(o.id)}
                      onClick={e => e.stopPropagation()} style={{ accentColor:A.primary, width:18, height:18, cursor:'pointer' }} />
                  </div>
                  <div style={{ position:'absolute', top:8, right:8, zIndex:2 }}>
                    <span style={{ background:badgeEstado.bg, color:badgeEstado.c, fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:6, fontFamily:A.font }}>{badgeEstado.t}</span>
                  </div>
                  <OfertaCard promo={normalizePromo(o)} variant="grid" fixedHeight={340} hideActions onOpen={() => setOfertaEditando(o)} />
                </div>
                {/* Acciones individuales debajo de la ficha */}
                <div style={{ display:'flex', gap:6 }}>
                  <ABtn onClick={() => setOfertaEditando(o)} style={{ flex:1, justifyContent:'center', fontSize:12, padding:'7px 8px' }}>
                    <Pencil size={12} /> Editar
                  </ABtn>
                  {!o.aprobada ? (
                    <ABtn onClick={() => aprobarOferta(o)} variant="success" style={{ flex:1, justifyContent:'center', fontSize:12, padding:'7px 8px' }}>
                      <CheckCircle2 size={12} /> Aprobar
                    </ABtn>
                  ) : (
                    <ABtn onClick={() => desaprobarOferta(o.id)} style={{ flex:1, justifyContent:'center', fontSize:12, padding:'7px 8px' }}>Desactivar</ABtn>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {/* Seleccionar todo */}
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 16px' }}>
            <input type="checkbox" checked={todosSeleccionados} onChange={toggleTodos} style={{ accentColor:A.primary, width:16, height:16, cursor:'pointer' }} />
            <span style={{ fontFamily:A.font, fontSize:11, color:A.muted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Seleccionar todo</span>
          </div>
          {filtradas.map(o => {
            const seleccionado = seleccionados.includes(o.id);
            return (
              <div key={o.id} style={{ background:'#fff', border:`1px solid ${seleccionado ? A.primary : (!o.aprobada && o.activa !== false ? '#FFC93C55' : A.line)}`, borderRadius:14, overflow:'hidden' }}>
                <div style={{ display:'flex', alignItems:'center', gap:14, padding:16 }}>
                  <input type="checkbox" checked={seleccionado} onChange={() => toggleSeleccion(o.id)} style={{ accentColor:A.primary, width:16, height:16, cursor:'pointer', flexShrink:0 }} />
                  <CuponRowBody o={o} precioDe={precioDe} onSocio={() => setNegocioEditando(negocios.find(n => n.id === o.negocio_id) || { id: o.negocio_id, ...o.negocios })} />
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
                    {!o.aprobada && o.activa !== false && (
                      <ABtn onClick={() => aprobarOferta(o)} variant="success" style={{ fontSize:12, padding:'6px 10px' }}>
                        <CheckCircle2 size={12} /> Aprobar
                      </ABtn>
                    )}
                    {o.aprobada && (
                      <ABtn onClick={() => desaprobarOferta(o.id)} style={{ fontSize:12, padding:'6px 10px' }}>Desactivar</ABtn>
                    )}
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
//  TAB: CUPOPACKS (selecciones curadas de cupones)
// ═══════════════════════════════════════════════════════════
function TabMarketplace({ ofertas, setOfertas, showToast, negocioEditando, setNegocioEditando, filtroNegocioId, setFiltroNegocioId, negocios, onActualizar }) {
  const [mkTab, setMkTab]       = useState('cupones');  // 'cupones' | 'cuponeras' | 'nueva'
  const [sets, setSets]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [pickerAbierto, setPickerAbierto] = useState(null);

  // Precio de un cupón (valor de activación): manual si existe, si no la fórmula sobre el ahorro.
  const precioDe = o => o?.precio_manual != null ? Number(o.precio_manual) : calcularPrecioCupon(Number(o?.ahorro_estimado) || 0);
  const promoById = Object.fromEntries(ofertas.map(o => [o.id, o]));
  const localidades = [...new Set(ofertas.map(o => o.negocios?.localidad).filter(Boolean))].sort();

  async function cargar() {
    setLoading(true);
    const { data } = await listarCupopacks();
    setSets(data || []);
    setLoading(false);
  }
  useEffect(() => { cargar(); }, []);

  // Crea el Cupopack y lo devuelve (o null si falló). El toast lo maneja quien llama.
  async function crear(campos) {
    const { data, error } = await crearCupopack(campos);
    if (error) { showToast('Error al crear el Cupopack', 'error'); return null; }
    const nuevo = { ...data, promocionIds: [] };
    setSets(prev => [nuevo, ...prev]);
    return nuevo;
  }

  async function cambiar(id, campos) {
    setSets(prev => prev.map(s => s.id === id ? { ...s, ...campos } : s));
    const { error } = await actualizarCupopack(id, campos);
    if (error) { showToast('Error al guardar', 'error'); cargar(); }
  }

  async function borrar(id) {
    if (!window.confirm('¿Eliminar este Cupopack? Los cupones no se borran, sólo la selección.')) return;
    setSets(prev => prev.filter(s => s.id !== id));
    const { error } = await eliminarCupopack(id);
    if (error) { showToast('Error al eliminar', 'error'); cargar(); }
    else showToast('Cupopack eliminado');
  }

  async function toggleCupon(set, promoId) {
    const incluido = set.promocionIds.includes(promoId);
    setSets(prev => prev.map(s => s.id === set.id
      ? { ...s, promocionIds: incluido ? s.promocionIds.filter(x => x !== promoId) : [...s.promocionIds, promoId] }
      : s));
    const { error } = incluido ? await quitarCuponDeSet(set.id, promoId) : await agregarCuponASet(set.id, promoId);
    if (error) { showToast('Error al actualizar el set', 'error'); cargar(); }
  }

  const tabBtn = (id, label) => (
    <button key={id} onClick={() => setMkTab(id)} style={{
      background:'none', border:'none', cursor:'pointer', fontFamily:A.font, fontSize:14,
      fontWeight: mkTab === id ? 700 : 500, color: mkTab === id ? A.primary : A.muted,
      padding:'10px 4px', marginRight:24, position:'relative',
    }}>
      {label}
      {mkTab === id && <span style={{ position:'absolute', left:0, right:0, bottom:-1, height:2.5, borderRadius:3, background:A.primary }} />}
    </button>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      {/* Tabs de la sección Marketplace */}
      <div style={{ display:'flex', borderBottom:`1px solid ${A.line}` }}>
        {tabBtn('cupones', 'Cupones')}
        {tabBtn('cuponeras', `Cuponeras${sets.length ? ` (${sets.length})` : ''}`)}
        {tabBtn('nueva', 'Nuevo Cupopack')}
      </div>

      {mkTab === 'cupones' && (
        <TabOfertas ofertas={ofertas} setOfertas={setOfertas} showToast={showToast}
          negocioEditando={negocioEditando} setNegocioEditando={setNegocioEditando}
          filtroNegocioId={filtroNegocioId} setFiltroNegocioId={setFiltroNegocioId}
          negocios={negocios} onActualizar={onActualizar} />
      )}

      {mkTab === 'cuponeras' && (loading ? <MiniLoader /> : (
        <CupopacksLista sets={sets} ofertas={ofertas} promoById={promoById} precioDe={precioDe}
          localidades={localidades} pickerAbierto={pickerAbierto} setPickerAbierto={setPickerAbierto}
          cambiar={cambiar} borrar={borrar} toggleCupon={toggleCupon} onNueva={() => setMkTab('nueva')} />
      ))}

      {mkTab === 'nueva' && (loading ? <MiniLoader /> : (
        <CupopackNuevo ofertas={ofertas} sets={sets} localidades={localidades} promoById={promoById}
          precioDe={precioDe} onCrear={crear} onToggleCupon={toggleCupon} showToast={showToast}
          onFinalizar={() => setMkTab('cuponeras')} />
      ))}
    </div>
  );
}

// ─── Selector de ícono para el beneficio adicional ──────────
function IconoBeneficioPicker({ value, onChange }) {
  return (
    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
      {BENEFICIO_ICONOS.map(({ id, label, Icon }) => {
        const sel = value === id;
        return (
          <button key={id} type="button" onClick={() => onChange(id)} title={label}
            style={{ width:38, height:38, borderRadius:10, display:'grid', placeItems:'center', cursor:'pointer',
              border: sel ? `2px solid ${A.primary}` : `1px solid ${A.line}`,
              background: sel ? A.primarySoft : '#fff', color: sel ? A.primary : A.ink2 }}>
            <Icon size={18} />
          </button>
        );
      })}
    </div>
  );
}

// Chip visual del beneficio adicional (círculo amarillo + texto) para el preview.
function BeneficioChip({ texto, icono }) {
  const Icon = getBeneficioIcon(icono);
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:8, marginBottom:10 }}>
      <div style={{ width:28, height:28, borderRadius:'50%', background:A.yellow, display:'grid', placeItems:'center', flexShrink:0 }}>
        <Icon size={15} color="#0B1020" strokeWidth={2.4} />
      </div>
      <span style={{ fontFamily:A.font, fontSize:12.5, fontWeight:700, color:'#B8860B' }}>{texto}</span>
    </div>
  );
}

// ─── Tab "Cupopacks": listado de los que ya existen ──────────
function CupopacksLista({ sets, ofertas, promoById, precioDe, localidades, pickerAbierto, setPickerAbierto, cambiar, borrar, toggleCupon, onNueva }) {
  const selStyle = { padding:'8px 11px', borderRadius:10, border:`1px solid ${A.line}`, fontSize:13, fontFamily:A.font, background:'#fff', color:A.ink, outline:'none', cursor:'pointer' };
  const inputStyle = { ...selStyle, cursor:'text' };

  if (sets.length === 0) {
    return (
      <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, padding:'48px 24px', textAlign:'center', fontFamily:A.font }}>
        <p style={{ color:A.muted, margin:'0 0 16px' }}>Todavía no hay Cupopacks.</p>
        <ABtn variant="primary" onClick={onNueva}><Plus size={15} style={{ marginRight:6, verticalAlign:'-2px' }} />Crear la primera</ABtn>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {sets.map(set => {
        const cupones = set.promocionIds.map(id => promoById[id]).filter(Boolean);
        const ahorroTotal = cupones.reduce((acc, o) => acc + (Number(o.ahorro_estimado) || 0), 0);
        const precioTotal = cupones.reduce((acc, o) => acc + precioDe(o), 0);
        const editando = pickerAbierto === set.id;
        const activa = set.estado === 'activa';
        // El mosaico se arma con la forma normalizada de datos.js ({ imagen,
        // categoria }); acá los cupones vienen crudos de la tabla.
        const esMosaico = (set.portada_modo || 'imagen') === 'mosaico';
        const cuponesConFoto = cupones
          .filter(o => o.imagen_url)
          .map(o => ({ id: o.id, imagen: o.imagen_url, categoria: categoriaDeNegocio(o.negocios?.tipo, o.negocio_id) }));
        const previewPortada = { portadaModo: 'mosaico', images: [set.imagen_url], cupones: cuponesConFoto };
        return (
          <div key={set.id} style={{ background:'#fff', border:`1px solid ${editando ? A.primary : A.line}`, borderRadius:16, overflow:'hidden' }}>

            {!editando ? (
              /* ═══ PREVIEW ═══ */
              <div style={{ display:'flex' }}>
                {/* Foto principal — ocupa todo el alto, a la izquierda */}
                <div style={{ position:'relative', width:180, flexShrink:0, alignSelf:'stretch', minHeight:150, background:A.bg, borderRight:`1px solid ${A.line}` }}>
                  {esMosaico && cuponesConFoto.length > 0
                    ? <PortadaCupopack cupopack={previewPortada} alt={set.nombre} />
                    : set.imagen_url
                    ? <img src={set.imagen_url} alt={set.nombre} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                    : <div style={{ width:'100%', height:'100%', display:'grid', placeItems:'center', fontSize:30, color:A.muted }}>🖼️</div>
                  }
                </div>

                <div style={{ flex:1, minWidth:0, padding:18 }}>
                {/* Fila superior: badge + estado + editar */}
                <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:10 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    {set.beneficio_adicional && <BeneficioChip texto={set.beneficio_adicional} icono={set.beneficio_icono} />}
                    {set.badge && (
                      <span style={{ display:'block', width:'fit-content', background:A.yellow, color:'#0B1020', fontSize:11, fontWeight:800, padding:'3px 10px', borderRadius:999, letterSpacing:'0.02em', marginBottom:8 }}>{set.badge}</span>
                    )}
                    <div style={{ fontFamily:A.font, fontSize:19, fontWeight:800, color:A.ink, letterSpacing:'-0.02em', lineHeight:1.2 }}>{set.nombre}</div>
                    {set.descripcion && <div style={{ fontFamily:A.font, fontSize:13.5, color:A.muted, marginTop:3, lineHeight:1.45 }}>{set.descripcion}</div>}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                    <span style={{ background: activa ? '#E8F5EC' : '#FCEAEA', color: activa ? A.green : '#C03030', fontSize:10.5, fontWeight:700, padding:'3px 9px', borderRadius:999, fontFamily:A.font }}>{activa ? 'Activa' : 'Inactiva'}</span>
                    <ABtn onClick={() => setPickerAbierto(set.id)} style={{ fontSize:12, padding:'7px 12px' }}><Pencil size={13} /> Editar</ABtn>
                  </div>
                </div>

                {/* Miniaturas de los cupones */}
                <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4, marginBottom:14 }}>
                  {cupones.length === 0 ? (
                    <span style={{ fontFamily:A.font, fontSize:12.5, color:A.muted, fontStyle:'italic', padding:'18px 0' }}>Todavía sin cupones — tocá “Editar” para agregarlos.</span>
                  ) : cupones.map(o => (
                    <div key={o.id} title={`${o.badge ? o.badge + ' · ' : ''}${o.titulo}${o.negocios?.nombre ? ' — ' + o.negocios.nombre : ''}`}
                      style={{ width:60, height:60, borderRadius:12, overflow:'hidden', background:A.bg, flexShrink:0, border:`1px solid ${A.line}` }}>
                      {o.imagen_url
                        ? <img src={o.imagen_url} alt={o.titulo} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        : <div style={{ width:'100%', height:'100%', display:'grid', placeItems:'center', fontSize:22 }}>🏷</div>
                      }
                    </div>
                  ))}
                </div>

                {/* Totales */}
                <div style={{ display:'flex', gap:20, flexWrap:'wrap', alignItems:'center', borderTop:`1px solid ${A.line}`, paddingTop:12 }}>
                  <span style={{ fontFamily:A.font, fontSize:12, color:A.muted }}>{cupones.length} cupones</span>
                  <span style={{ fontFamily:A.font, fontSize:12, color:A.green, fontWeight:600 }}>Ahorro declarado ${ahorroTotal.toLocaleString('es-AR')}</span>
                  <span style={{ fontFamily:A.font, fontSize:12, color:A.ink2, fontWeight:600 }}>Valor de activación ${precioTotal.toLocaleString('es-AR')}</span>
                  {set.localidad && <span style={{ fontFamily:A.font, fontSize:12, color:A.muted }}>· {set.localidad}</span>}
                  {/* La categoría, a la vista sin entrar a editar: sin ella la
                      Cupopack no aparece en ningún filtro. */}
                  <span style={{ fontFamily:A.font, fontSize:12, fontWeight:600, color: set.familia ? A.primary : '#C03030' }}>
                    {set.familia ? `· ${familiaLabel(set.familia)}` : '· Sin categoría'}
                  </span>
                </div>
                </div>
              </div>
            ) : (
              /* ═══ EDICIÓN ═══ */
              <>
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px 6px', flexWrap:'wrap' }}>
                  <input value={set.nombre} onChange={e => cambiar(set.id, { nombre: e.target.value })}
                    onBlur={e => cambiar(set.id, { nombre: e.target.value.trim() || 'Sin nombre' })}
                    style={{ ...inputStyle, fontWeight:700, fontSize:15, flex:1, minWidth:180 }} />
                  <select value={set.estado} onChange={e => cambiar(set.id, { estado: e.target.value })} style={selStyle}>
                    <option value="activa">Activa</option>
                    <option value="inactiva">Inactiva</option>
                  </select>
                  <select value={set.localidad || ''} onChange={e => cambiar(set.id, { localidad: e.target.value || null })} style={selStyle}>
                    <option value="">Sin localidad</option>
                    {localidades.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  {/* Categoría: define bajo qué ícono aparece en el menú y con
                      qué filtra el listado de "Packs todo incluido". El rótulo
                      va en cada opción porque al lado hay otros dos selects
                      iguales y suelto no se entendía qué elegía. */}
                  <select value={set.familia || ''} onChange={e => cambiar(set.id, { familia: e.target.value || null })}
                    title="Categoría con la que se filtra en el listado de packs" style={selStyle}>
                    <option value="">Sin categoría</option>
                    {FAMILIAS_PACK.map(f => <option key={f.id} value={f.id}>Categoría: {f.label}</option>)}
                  </select>
                  <button onClick={() => borrar(set.id)} title="Eliminar Cupopack" style={{ background:'none', border:`1px solid ${A.line}`, borderRadius:8, padding:'7px 9px', cursor:'pointer', color:'#C03030', display:'flex', alignItems:'center' }}>
                    <Trash2 size={14} />
                  </button>
                  <ABtn variant="primary" onClick={() => setPickerAbierto(null)} style={{ fontSize:12, padding:'8px 14px' }}>Listo</ABtn>
                </div>

                {/* Descripción + badge */}
                <div style={{ padding:'0 16px 10px', display:'flex', gap:10, flexWrap:'wrap' }}>
                  <input value={set.descripcion || ''} onChange={e => cambiar(set.id, { descripcion: e.target.value })}
                    onBlur={e => cambiar(set.id, { descripcion: e.target.value.trim() || null })}
                    placeholder="Descripción del Cupopack (opcional)"
                    style={{ ...inputStyle, flex:1, minWidth:200, boxSizing:'border-box', fontSize:13, color:A.ink2 }} />
                  <input value={set.badge || ''} onChange={e => cambiar(set.id, { badge: e.target.value })}
                    onBlur={e => cambiar(set.id, { badge: e.target.value.trim() || null })}
                    placeholder="Badge (ej: Más vendida)"
                    title="Etiqueta amarilla que aparece arriba del título en la home"
                    style={{ ...inputStyle, width:200, boxSizing:'border-box', fontSize:13, color:A.ink2 }} />
                </div>

                {/* Portada: foto cargada a mano o mosaico con las ofertas del set */}
                <div style={{ padding:'0 16px 12px', display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                  <div style={{ position:'relative', width:52, height:52, borderRadius:10, overflow:'hidden', background:A.bg, border:`1px solid ${A.line}`, flexShrink:0, display:'grid', placeItems:'center' }}>
                    {esMosaico
                      ? <PortadaCupopack cupopack={previewPortada} alt="portada" />
                      : set.imagen_url
                      ? <img src={set.imagen_url} alt="portada" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      : <span style={{ fontSize:18 }}>🖼️</span>}
                  </div>
                  <select value={set.portada_modo || 'imagen'} onChange={e => cambiar(set.id, { portada_modo: e.target.value })}
                    title="Con qué imagen se muestra el Cupopack en la home"
                    style={{ ...selStyle, width:230 }}>
                    <option value="imagen">Portada: foto cargada</option>
                    <option value="mosaico">Portada: grilla de las ofertas</option>
                  </select>
                  <input value={set.imagen_url || ''} onChange={e => cambiar(set.id, { imagen_url: e.target.value })}
                    onBlur={e => cambiar(set.id, { imagen_url: e.target.value.trim() || null })}
                    placeholder="URL de la foto principal (https://...)"
                    disabled={esMosaico}
                    style={{ ...inputStyle, flex:1, minWidth:200, boxSizing:'border-box', fontSize:13, color:A.ink2, opacity: esMosaico ? 0.45 : 1 }} />
                </div>
                {esMosaico && cuponesConFoto.length === 0 && (
                  <div style={{ padding:'0 16px 12px', fontFamily:A.font, fontSize:12, color:'#C03030' }}>
                    Ninguna oferta del Cupopack tiene foto: hasta que carguen una, se muestra la portada de arriba.
                  </div>
                )}

                {/* Destacada en el menú "viajá con packs" (toggle + ícono) */}
                <div style={{ padding:'0 16px 14px' }}>
                  <label style={{ display:'flex', alignItems:'center', gap:9, cursor:'pointer', width:'fit-content' }}>
                    <input type="checkbox" checked={!!set.destacada_en_menu}
                      onChange={e => cambiar(set.id, { destacada_en_menu: e.target.checked })}
                      style={{ width:16, height:16, cursor:'pointer', accentColor:A.primary }} />
                    <span style={{ fontFamily:A.font, fontSize:13.5, fontWeight:600, color:A.ink }}>Destacada en el menú “viajá con packs”</span>
                  </label>
                  {set.destacada_en_menu && (
                    <div style={{ marginTop:10, paddingLeft:25 }}>
                      <div style={{ fontFamily:A.font, fontSize:11, fontWeight:700, color:A.muted, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Ícono en el menú</div>
                      <IconoBeneficioPicker value={set.menu_icono} onChange={id => cambiar(set.id, { menu_icono: id })} />
                    </div>
                  )}
                </div>

                {/* Beneficio adicional (texto amarillo + ícono + efecto en el precio) */}
                <div style={{ padding:'0 16px 14px' }}>
                  <div style={{ fontFamily:A.font, fontSize:11, fontWeight:700, color:A.muted, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Beneficio adicional</div>
                  <input value={set.beneficio_adicional || ''} onChange={e => cambiar(set.id, { beneficio_adicional: e.target.value })}
                    onBlur={e => cambiar(set.id, { beneficio_adicional: e.target.value.trim() || null })}
                    placeholder="Ej: Triplicás los puntos que obtenés"
                    style={{ ...inputStyle, width:'100%', boxSizing:'border-box', fontSize:13, color:A.ink2, marginBottom:10 }} />
                  {/* Tipo de beneficio + valor (define qué recalcula el checkout) */}
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', marginBottom:10 }}>
                    <select value={set.beneficio_tipo || ''} onChange={e => cambiar(set.id, { beneficio_tipo: e.target.value || null })}
                      style={{ ...inputStyle, fontSize:13, flex:1, minWidth:200, cursor:'pointer' }}>
                      {BENEFICIO_TIPOS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                    {tipoBeneficio(set.beneficio_tipo).needsValor && (
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <input type="number" min="0" value={set.beneficio_valor ?? ''} onChange={e => cambiar(set.id, { beneficio_valor: e.target.value === '' ? null : Number(e.target.value) })}
                          placeholder="valor" style={{ ...inputStyle, width:90, fontSize:13 }} />
                        <span style={{ fontFamily:A.font, fontSize:13, color:A.muted }}>{tipoBeneficio(set.beneficio_tipo).unidad}</span>
                      </div>
                    )}
                  </div>
                  {tipoBeneficio(set.beneficio_tipo).ayuda && (
                    <div style={{ fontFamily:A.font, fontSize:11, color:A.muted, marginBottom:10 }}>{tipoBeneficio(set.beneficio_tipo).ayuda}</div>
                  )}
                  <IconoBeneficioPicker value={set.beneficio_icono} onChange={id => cambiar(set.id, { beneficio_icono: id })} />
                </div>

                {/* Gestión de cupones */}
                <div style={{ borderTop:`1px solid ${A.line}`, padding:'14px 16px 16px' }}>
                  <div style={{ fontFamily:A.font, fontSize:11, fontWeight:700, color:A.muted, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:12 }}>Cupones incluidos</div>
                  <ArmadorCupones set={set} ofertas={ofertas} localidades={localidades} promoById={promoById} precioDe={precioDe} onToggleCupon={toggleCupon} />
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Armador de cupones (filtros + resultados + barra de totales) ──
// Compartido por "Nuevo Cupopack" y el modo edición de uno existente.
function ArmadorCupones({ set, ofertas, localidades, promoById, precioDe, onToggleCupon }) {
  const [busqueda, setBusqueda]             = useState('');
  const [filtroLocalidad, setFiltroLocalidad] = useState('todas');
  const [filtroTipo, setFiltroTipo]         = useState('todos');
  const [soloFlash, setSoloFlash]           = useState(false);
  const [orden, setOrden]                   = useState('creado');
  // Si el Cupopack ya tiene cupones, arranca mostrando los agregados.
  const [verAgregados, setVerAgregados]     = useState((set?.promocionIds?.length || 0) > 0);
  const [mostrar, setMostrar]               = useState(10);

  const toggleVer = () => { setVerAgregados(v => !v); setMostrar(10); };

  const agregadosIds = set?.promocionIds || [];
  const rubroDe      = o => categoriaDeNegocio(o.negocios?.tipo, o.negocio_id);

  // ── Resultados filtrados ──
  let resultados = ofertas.filter(o => {
    const matchLoc  = filtroLocalidad === 'todas' || o.negocios?.localidad === filtroLocalidad;
    const matchTipo = filtroTipo === 'todos' || rubroDe(o) === filtroTipo;
    const matchFlash = !soloFlash || o.offer_type === 'Flash';
    const q = busqueda.trim().toLowerCase();
    const matchQ = !q || (o.titulo || '').toLowerCase().includes(q) || (o.negocios?.nombre || '').toLowerCase().includes(q);
    return matchLoc && matchTipo && matchFlash && matchQ;
  });
  if (verAgregados) resultados = resultados.filter(o => agregadosIds.includes(o.id));
  resultados = resultados.slice().sort((a, b) => {
    switch (orden) {
      case 'nombre': return (a.titulo || '').localeCompare(b.titulo || '', 'es');
      case 'ahorro': return (Number(b.ahorro_estimado) || 0) - (Number(a.ahorro_estimado) || 0);
      case 'precio': return precioDe(b) - precioDe(a);
      default:       return new Date(b.creado_en || 0) - new Date(a.creado_en || 0);
    }
  });

  // ── Totales acumulados de ESTE Cupopack ──
  const cuponesAgregados = agregadosIds.map(id => promoById[id]).filter(Boolean);
  const totalAhorro      = cuponesAgregados.reduce((a, o) => a + (Number(o.ahorro_estimado) || 0), 0);
  const totalActivacion  = cuponesAgregados.reduce((a, o) => a + precioDe(o), 0);

  const selStyle = { padding:'9px 12px', borderRadius:10, border:`1px solid ${A.line}`, fontSize:13, fontFamily:A.font, background:'#fff', color:A.ink, outline:'none', cursor:'pointer' };
  const inputStyle = { ...selStyle, cursor:'text' };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* ── Filtros horizontales ── */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={15} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:A.muted }} />
          <input type="text" value={busqueda} onChange={e => { setBusqueda(e.target.value); setMostrar(10); }}
            placeholder="Buscar cupón ó socio..." style={{ ...inputStyle, width:'100%', boxSizing:'border-box', paddingLeft:32 }} />
        </div>
        <select value={filtroLocalidad} onChange={e => { setFiltroLocalidad(e.target.value); setMostrar(10); }} style={selStyle}>
          <option value="todas">Todas las localidades</option>
          {localidades.map(loc => <option key={loc} value={loc}>{loc}</option>)}
        </select>
        <select value={filtroTipo} onChange={e => { setFiltroTipo(e.target.value); setMostrar(10); }} style={selStyle}>
          <option value="todos">Todos los tipos</option>
          {TIPOS_RUBRO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <label style={{ display:'flex', alignItems:'center', gap:7, fontFamily:A.font, fontSize:13, color:A.ink2, cursor:'pointer', padding:'0 4px' }}>
          <input type="checkbox" checked={soloFlash} onChange={e => { setSoloFlash(e.target.checked); setMostrar(10); }} style={{ accentColor:A.primary, width:15, height:15, cursor:'pointer' }} />
          Solo Flash
        </label>
        <select value={orden} onChange={e => { setOrden(e.target.value); setMostrar(10); }} style={selStyle}>
          <option value="creado">Más recientes</option>
          <option value="nombre">Nombre A-Z</option>
          <option value="ahorro">Ahorro declarado</option>
          <option value="precio">Valor de activación</option>
        </select>
      </div>

      {/* Contador + toggle ver agregados */}
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <span style={{ fontFamily:A.font, fontSize:13, color:A.muted }}>{resultados.length} resultado{resultados.length !== 1 ? 's' : ''}{verAgregados ? ' agregados' : ''}</span>
        <button onClick={toggleVer} style={{ marginLeft:'auto', background:'none', border:`1px solid ${verAgregados ? A.line : A.primary}`, color: verAgregados ? A.ink2 : A.primary, borderRadius:999, padding:'6px 14px', fontFamily:A.font, fontSize:12.5, fontWeight:600, cursor:'pointer' }}>
          {verAgregados ? 'Agregar cupones' : `Ver agregados (${cuponesAgregados.length})`}
        </button>
      </div>

      {/* ── Resultados ── */}
      <div style={{ display:'flex', flexDirection:'column', gap:8, paddingBottom:8 }}>
        {resultados.length === 0 ? (
          <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, padding:'40px 24px', textAlign:'center', color:A.muted, fontFamily:A.font }}>
            {verAgregados ? 'Todavía no agregaste cupones a esta cupopack.' : 'No hay cupones con estos filtros.'}
          </div>
        ) : resultados.slice(0, mostrar).map(o => {
          const incluido = agregadosIds.includes(o.id);
          return (
            <div key={o.id} style={{ background:'#fff', border:`1px solid ${incluido ? A.primary : A.line}`, borderRadius:14, overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'center', gap:14, padding:16 }}>
                <CuponRowBody o={o} precioDe={precioDe} />
                <button onClick={() => onToggleCupon(set, o.id)} style={{
                  flexShrink:0, display:'flex', alignItems:'center', gap:6, padding:'9px 15px', borderRadius:10, cursor:'pointer', fontFamily:A.font, fontSize:13, fontWeight:700,
                  border: incluido ? `1px solid ${A.primary}` : 'none',
                  background: incluido ? A.primarySoft : A.primary,
                  color: incluido ? A.primary : '#fff',
                }}>
                  {incluido ? <><Check size={15} /> Agregado</> : <><Plus size={15} /> Añadir</>}
                </button>
              </div>
            </div>
          );
        })}
        {resultados.length > mostrar && (
          <button onClick={() => setMostrar(m => m + 10)} style={{ alignSelf:'center', marginTop:4, background:'#fff', border:`1px solid ${A.line}`, borderRadius:10, padding:'10px 22px', fontFamily:A.font, fontSize:13, fontWeight:700, color:A.ink, cursor:'pointer' }}>
            Cargar más ({resultados.length - mostrar} restantes)
          </button>
        )}
      </div>

      {/* ── Barra fija de totales ── */}
      <div style={{ position:'sticky', bottom:0, zIndex:5, marginTop:4, background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, boxShadow:'0 -6px 24px -12px rgba(11,16,32,0.18)', padding:'12px 18px', display:'flex', alignItems:'center', gap:24, flexWrap:'wrap' }}>
        <div>
          <div style={{ fontFamily:A.font, fontSize:11, color:A.muted, textTransform:'uppercase', letterSpacing:'0.05em' }}>Cupones</div>
          <div style={{ fontFamily:A.font, fontSize:18, fontWeight:800, color:A.ink }}>{cuponesAgregados.length}</div>
        </div>
        <div>
          <div style={{ fontFamily:A.font, fontSize:11, color:A.muted, textTransform:'uppercase', letterSpacing:'0.05em' }}>Ahorro declarado</div>
          <div style={{ fontFamily:A.font, fontSize:18, fontWeight:800, color:A.green }}>${totalAhorro.toLocaleString('es-AR')}</div>
        </div>
        <div>
          <div style={{ fontFamily:A.font, fontSize:11, color:A.muted, textTransform:'uppercase', letterSpacing:'0.05em' }}>Valor de activación</div>
          <div style={{ fontFamily:A.font, fontSize:18, fontWeight:800, color:A.ink2 }}>${totalActivacion.toLocaleString('es-AR')}</div>
        </div>
        <button onClick={toggleVer} style={{ marginLeft:'auto', background:A.bg, border:`1px solid ${A.line}`, borderRadius:10, padding:'9px 16px', fontFamily:A.font, fontSize:13, fontWeight:700, color:A.ink, cursor:'pointer' }}>
          {verAgregados ? 'Agregar cupones' : `Ver agregados (${cuponesAgregados.length})`}
        </button>
      </div>
    </div>
  );
}

function CupopackNuevo({ ofertas, sets, localidades, promoById, precioDe, onCrear, onToggleCupon, showToast, onFinalizar }) {
  const [nombre, setNombre]           = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [badge, setBadge]             = useState('');
  const [imagenUrl, setImagenUrl]     = useState('');
  const [benTexto, setBenTexto]       = useState('');
  const [benIcono, setBenIcono]       = useState('star');
  const [benTipo, setBenTipo]         = useState('');
  const [benValor, setBenValor]       = useState('');
  const [localidadSet, setLocalidadSet] = useState('');
  const [familia, setFamilia]         = useState('');
  const [setActivoId, setSetActivoId] = useState(null);
  const [guardando, setGuardando]     = useState(false);

  const setActivo = sets.find(s => s.id === setActivoId) || null;

  async function guardar() {
    if (!nombre.trim()) return showToast('Poné un nombre para el Cupopack', 'error');
    setGuardando(true);
    const nuevo = await onCrear({
      nombre: nombre.trim(), descripcion: descripcion.trim() || null, badge: badge.trim() || null,
      imagen_url: imagenUrl.trim() || null,
      beneficio_adicional: benTexto.trim() || null, beneficio_icono: benTexto.trim() ? benIcono : null,
      beneficio_tipo: benTexto.trim() ? (benTipo || null) : null,
      beneficio_valor: benTexto.trim() && benTipo && benValor !== '' ? Number(benValor) : null,
      localidad: localidadSet || null,
      familia: familia || null,
    });
    setGuardando(false);
    if (nuevo) { setSetActivoId(nuevo.id); showToast('Cupopack creado — ahora agregá cupones'); }
  }

  function nuevaOtra() {
    setSetActivoId(null); setNombre(''); setDescripcion(''); setBadge(''); setImagenUrl(''); setBenTexto(''); setBenIcono('star'); setBenTipo(''); setBenValor(''); setLocalidadSet(''); setFamilia('');
  }

  const selStyle = { padding:'9px 12px', borderRadius:10, border:`1px solid ${A.line}`, fontSize:13, fontFamily:A.font, background:'#fff', color:A.ink, outline:'none', cursor:'pointer' };
  const inputStyle = { ...selStyle, cursor:'text' };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* ── Alta / cabecera del Cupopack en armado ── */}
      {!setActivo ? (
        <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, padding:16, display:'flex', flexDirection:'column', gap:12 }}>
          <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre del Cupopack"
            style={{ ...inputStyle, width:'100%', boxSizing:'border-box', fontWeight:700, fontSize:15 }} />
          <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción (opcional)"
            rows={2} style={{ ...inputStyle, width:'100%', boxSizing:'border-box', resize:'vertical', lineHeight:1.5 }} />
          {/* Foto principal (portada) */}
          <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
            <div style={{ width:96, height:96, borderRadius:12, overflow:'hidden', background:A.bg, border:`1px solid ${A.line}`, flexShrink:0, display:'grid', placeItems:'center' }}>
              {imagenUrl.trim()
                ? <img src={imagenUrl} alt="portada" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <span style={{ fontSize:24 }}>🖼️</span>}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <input value={imagenUrl} onChange={e => setImagenUrl(e.target.value)} placeholder="URL de la foto principal (https://...)"
                style={{ ...inputStyle, width:'100%', boxSizing:'border-box' }} />
              <div style={{ fontFamily:A.font, fontSize:11, color:A.muted, marginTop:6 }}>Es la portada que se ve a la izquierda de la cupopack.</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
            <input value={badge} onChange={e => setBadge(e.target.value)} placeholder="Badge (ej: Más vendida)"
              style={{ ...inputStyle, flex:1, minWidth:160 }} />
            <select value={localidadSet} onChange={e => setLocalidadSet(e.target.value)} style={selStyle}>
              <option value="">Sin localidad</option>
              {localidades.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            {/* Categoría: es con lo que filtra el listado de "Packs todo
                incluido" y bajo qué ícono aparece en el menú. Se elige acá
                para no tener que entrar a editar después de crearla. */}
            <select value={familia} onChange={e => setFamilia(e.target.value)}
              title="Categoría con la que se filtra en el listado de packs" style={selStyle}>
              <option value="">Sin categoría</option>
              {FAMILIAS_PACK.map(f => <option key={f.id} value={f.id}>Categoría: {f.label}</option>)}
            </select>
          </div>
          {/* Beneficio adicional */}
          <div>
            <div style={{ fontFamily:A.font, fontSize:11, fontWeight:700, color:A.muted, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Beneficio adicional (opcional)</div>
            <input value={benTexto} onChange={e => setBenTexto(e.target.value)} placeholder="Ej: Triplicás los puntos que obtenés"
              style={{ ...inputStyle, width:'100%', boxSizing:'border-box', marginBottom:10 }} />
            {benTexto.trim() && (
              <>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', marginBottom:8 }}>
                  <select value={benTipo} onChange={e => setBenTipo(e.target.value)} style={{ ...selStyle, flex:1, minWidth:200 }}>
                    {BENEFICIO_TIPOS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                  {tipoBeneficio(benTipo).needsValor && (
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <input type="number" min="0" value={benValor} onChange={e => setBenValor(e.target.value)}
                        placeholder="valor" style={{ ...inputStyle, width:90 }} />
                      <span style={{ fontFamily:A.font, fontSize:13, color:A.muted }}>{tipoBeneficio(benTipo).unidad}</span>
                    </div>
                  )}
                </div>
                {tipoBeneficio(benTipo).ayuda && (
                  <div style={{ fontFamily:A.font, fontSize:11, color:A.muted, marginBottom:10 }}>{tipoBeneficio(benTipo).ayuda}</div>
                )}
              </>
            )}
            <IconoBeneficioPicker value={benIcono} onChange={setBenIcono} />
          </div>
          <ABtn variant="primary" onClick={guardar} style={{ alignSelf:'flex-start', opacity: guardando ? 0.6 : 1 }}>Guardar</ABtn>
        </div>
      ) : (
        <div style={{ background:A.primarySoft, border:`1px solid ${A.primary}`, borderRadius:14, padding:'12px 16px', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <div style={{ minWidth:0 }}>
            <div style={{ fontFamily:A.font, fontSize:11, color:A.primary, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>Armando</div>
            <div style={{ fontFamily:A.font, fontSize:15, fontWeight:700, color:A.ink }}>{setActivo.nombre}</div>
          </div>
          <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
            <ABtn variant="ghost" onClick={nuevaOtra}>Crear otra</ABtn>
            <ABtn variant="primary" onClick={onFinalizar}>Finalizar</ABtn>
          </div>
        </div>
      )}

      {/* ── Armador (mismo que en edición) ── */}
      {setActivo ? (
        <ArmadorCupones set={setActivo} ofertas={ofertas} localidades={localidades} promoById={promoById} precioDe={precioDe} onToggleCupon={onToggleCupon} />
      ) : (
        <div style={{ background:A.bg, border:`1px dashed ${A.line}`, borderRadius:14, padding:'28px 24px', textAlign:'center', color:A.muted, fontFamily:A.font, fontSize:13 }}>
          Guardá el Cupopack para empezar a agregar cupones.
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB: PORTADAS
// ═══════════════════════════════════════════════════════════
function TabPortadas({ showToast }) {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoria, setCategoria] = useState('alojamiento');
  const [imagenUrl, setImagenUrl] = useState('');
  const [link, setLink]     = useState('');
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [drag, setDrag]     = useState(false);
  const fileRef = useRef(null);

  async function cargar() {
    setLoading(true);
    setItems(await listarPortadasAdmin());
    setLoading(false);
  }
  useEffect(() => { cargar(); }, []);

  // Evitar que el navegador abra la imagen si se suelta fuera del cuadro.
  useEffect(() => {
    const prevent = e => e.preventDefault();
    window.addEventListener('dragover', prevent);
    window.addEventListener('drop', prevent);
    return () => { window.removeEventListener('dragover', prevent); window.removeEventListener('drop', prevent); };
  }, []);

  // Sube un archivo al bucket y deja su URL pública en el campo imagen.
  async function subirImagen(file) {
    if (!file || !file.type.startsWith('image/')) return showToast('Ese archivo no es una imagen', 'error');
    setSubiendo(true);
    try {
      // Nombre de carpeta neutro a propósito: una ruta con "publicidad"/"ads" la bloquean los adblockers.
      const url = await subirArchivo(`portadas/${categoria}-${Date.now()}.${extDeArchivo(file)}`, file);
      setImagenUrl(url);
    } catch (e) {
      showToast('Error al subir la imagen: ' + (e.message || e), 'error');
    } finally {
      setSubiendo(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer?.files?.[0];
    if (f && f.type.startsWith('image/')) { subirImagen(f); return; }
    // Arrastrada desde otra página → viene como URL
    let url = e.dataTransfer?.getData?.('text/uri-list') || e.dataTransfer?.getData?.('text/plain') || '';
    if (!url) {
      const html = e.dataTransfer?.getData?.('text/html') || '';
      const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (m) url = m[1];
    }
    url = (url || '').split(/[\r\n]+/).map(s => s.trim()).find(s => /^https?:\/\//i.test(s)) || '';
    if (url) setImagenUrl(url);
  }

  const labelCat = v => PORTADA_CATEGORIAS.find(c => c.value === v)?.label || v;

  async function agregar() {
    if (!imagenUrl.trim()) return showToast('Pegá la URL de la imagen', 'error');
    setGuardando(true);
    const { error } = await crearPortada({ categoria, imagen_url: imagenUrl.trim(), link: link.trim() || null });
    setGuardando(false);
    if (error) return showToast('Error al guardar la portada', 'error');
    setImagenUrl(''); setLink('');
    showToast('Portada agregada');
    cargar();
  }

  async function toggle(p) {
    const { error } = await actualizarPortada(p.id, { activa: !p.activa });
    if (error) return showToast('Error al actualizar', 'error');
    setItems(prev => prev.map(x => x.id === p.id ? { ...x, activa: !x.activa } : x));
  }

  async function borrar(p) {
    if (!window.confirm('¿Eliminar esta portada?')) return;
    const { error } = await eliminarPortada(p.id);
    if (error) return showToast('Error al eliminar', 'error');
    setItems(prev => prev.filter(x => x.id !== p.id));
    showToast('Portada eliminada');
  }

  const inputStyle = { padding:'10px 12px', borderRadius:10, border:`1px solid ${A.line}`, fontFamily:A.font, fontSize:13, outline:'none', background:'#fff', width:'100%', boxSizing:'border-box' };

  return (
    <div>
      <h2 style={{ fontFamily:A.font, fontSize:20, fontWeight:800, color:A.ink, margin:'0 0 6px' }}>Portadas</h2>
      <p style={{ fontFamily:A.font, fontSize:13, color:A.muted, margin:'0 0 20px' }}>
        Imágenes que ocupan la primera ficha del listado. Rotan al azar, sin repetir, dentro de cada categoría.
      </p>

      {/* Alta */}
      <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:16, padding:18, marginBottom:24, display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:12 }}>
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:A.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>Categoría</label>
            <select value={categoria} onChange={e => setCategoria(e.target.value)} style={{ ...inputStyle, cursor:'pointer' }}>
              {PORTADA_CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:A.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>Imagen — arrastrá, subí o pegá una URL</label>
            <div style={{ display:'flex', gap:8, alignItems:'stretch' }}>
              <div
                onClick={() => !subiendo && fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); if (!drag) setDrag(true); }}
                onDragLeave={e => { e.preventDefault(); setDrag(false); }}
                onDrop={handleDrop}
                title="Arrastrá una imagen o hacé click para subir un archivo"
                style={{
                  flex:'0 0 auto', width:96, borderRadius:10, cursor: subiendo ? 'default' : 'pointer',
                  border: drag ? `2px dashed ${A.primary}` : `1px dashed ${A.line}`,
                  background: drag ? 'rgba(37,69,230,0.08)' : A.bg,
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4,
                  color: A.muted, fontFamily:A.font, fontSize:10, fontWeight:700, textAlign:'center', padding:6,
                }}
              >
                {subiendo
                  ? <span style={{ color:A.primary }}>Subiendo…</span>
                  : <><Upload size={16} /><span>Subir / arrastrar</span></>}
              </div>
              <input value={imagenUrl} onChange={e => setImagenUrl(e.target.value)} placeholder="https://… o /bg-aloja.jpg" style={inputStyle} />
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
              onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) subirImagen(f); }} />
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 160px', gap:12, alignItems:'end' }}>
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:A.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>Link (opcional)</label>
            <input value={link} onChange={e => setLink(e.target.value)} placeholder="https://… adónde lleva al hacer click" style={inputStyle} />
          </div>
          <ABtn variant="primary" onClick={agregar} style={{ justifyContent:'center', padding:'11px 0', opacity: guardando ? 0.6 : 1 }}>
            {guardando ? 'Guardando…' : 'Agregar portada'}
          </ABtn>
        </div>
        {imagenUrl.trim() && (
          // Preview a proporción real (sin recortar): la altura sale de la imagen,
          // así se ve tal cual es sin asumir un alto fijo de minificha.
          <div style={{ maxWidth:200, borderRadius:12, overflow:'hidden', border:`1px solid ${A.line}`, alignSelf:'flex-start' }}>
            <img src={imagenUrl} alt="preview" style={{ display:'block', width:'100%', height:'auto' }} />
          </div>
        )}
      </div>

      {/* Listado */}
      {loading ? <MiniLoader /> : items.length === 0 ? (
        <p style={{ fontFamily:A.font, fontSize:14, color:A.muted }}>Todavía no hay portadas cargadas.</p>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:16 }}>
          {items.map(p => (
            <div key={p.id} style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, overflow:'hidden', display:'flex', flexDirection:'column', opacity: p.activa ? 1 : 0.55 }}>
              <div style={{ background:A.bg }}>
                <img src={p.imagen_url} alt="" style={{ display:'block', width:'100%', height:'auto' }} />
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
//  TAB: ESTADÍSTICAS
//  Contenedor por secciones — agregar nuevas métricas como más
//  <StatSection> debajo de la de demanda de destinos.
// ═══════════════════════════════════════════════════════════
function StatSection({ title, subtitle, children }) {
  return (
    <section style={{ marginBottom:28 }}>
      <h3 style={{ fontFamily:A.font, fontSize:16, fontWeight:800, color:A.ink, margin:'0 0 2px' }}>{title}</h3>
      {subtitle && <p style={{ fontFamily:A.font, fontSize:12.5, color:A.muted, margin:'0 0 14px' }}>{subtitle}</p>}
      {children}
    </section>
  );
}

function StatKpi({ label, value, color = A.primary, bg = A.primarySoft }) {
  return (
    <div style={{ background:bg, borderRadius:14, padding:'14px 16px', minWidth:130, flex:'1 1 130px' }}>
      <div style={{ fontFamily:A.font, fontSize:24, fontWeight:800, color }}>{value}</div>
      <div style={{ fontFamily:A.font, fontSize:12, fontWeight:600, color:A.ink2, marginTop:2 }}>{label}</div>
    </div>
  );
}

function TabEstadisticas() {
  const [demanda, setDemanda] = useState(null); // null = cargando

  useEffect(() => {
    (async () => { setDemanda(await getDemandaDestinos()); })();
  }, []);

  if (demanda === null) return <MiniLoader />;

  // ── Agregación de demanda por destino ──
  const porDestino = {};
  demanda.forEach(d => {
    const key = `${d.destino}||${d.provincia || ''}`;
    const g = porDestino[key] || (porDestino[key] = {
      destino: d.destino, provincia: d.provincia, tipo: d.tipo,
      clicks: 0, sesiones: new Set(), conEmail: 0, ultima: d.created_at,
    });
    g.clicks++;
    if (d.session_id) g.sesiones.add(d.session_id);
    if (d.email) g.conEmail++;
    if (d.created_at > g.ultima) g.ultima = d.created_at;
  });
  const filas = Object.values(porDestino)
    .map(g => ({ ...g, sesiones: g.sesiones.size }))
    .sort((a, b) => b.clicks - a.clicks);

  const totalBusquedas = demanda.length;
  const emails = demanda.filter(d => d.email);
  const fmtFecha = x => x ? new Date(x).toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'2-digit' }) : '—';

  const th = { textAlign:'left', fontFamily:A.font, fontSize:11, fontWeight:700, color:A.muted, textTransform:'uppercase', letterSpacing:'0.04em', padding:'0 12px 8px' };
  const td = { fontFamily:A.font, fontSize:13.5, color:A.ink, padding:'10px 12px', borderTop:`1px solid ${A.line}` };

  return (
    <div>
      <StatSection
        title="Demanda de destinos (expansión)"
        subtitle='Búsquedas en “Buscar en el resto del país”. Cada fila es un destino que la gente pidió y al que todavía no llegamos.'
      >
        {/* KPIs */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginBottom:18 }}>
          <StatKpi label="Búsquedas totales" value={totalBusquedas} />
          <StatKpi label="Destinos distintos" value={filas.length} color={A.green} bg="#E8F5EC" />
          <StatKpi label="Emails capturados" value={emails.length} color="#7A3FD8" bg="#F3E8FF" />
        </div>

        {filas.length === 0 ? (
          <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, padding:'40px 24px', textAlign:'center', fontFamily:A.font, fontSize:14, color:A.muted }}>
            Todavía no hay búsquedas de destinos fuera de cobertura.
          </div>
        ) : (
          <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, overflow:'hidden' }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:560 }}>
                <thead>
                  <tr>
                    <th style={{ ...th, paddingTop:14 }}>Destino</th>
                    <th style={{ ...th, paddingTop:14 }}>Provincia</th>
                    <th style={{ ...th, paddingTop:14, textAlign:'right' }}>Búsquedas</th>
                    <th style={{ ...th, paddingTop:14, textAlign:'right' }}>Sesiones</th>
                    <th style={{ ...th, paddingTop:14, textAlign:'right' }}>Con email</th>
                    <th style={{ ...th, paddingTop:14, textAlign:'right' }}>Última</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f, i) => (
                    <tr key={i}>
                      <td style={{ ...td, fontWeight:600 }}>{f.destino}</td>
                      <td style={{ ...td, color:A.muted }}>{f.provincia || '—'}</td>
                      <td style={{ ...td, textAlign:'right', fontWeight:700 }}>{f.clicks}</td>
                      <td style={{ ...td, textAlign:'right' }}>{f.sesiones}</td>
                      <td style={{ ...td, textAlign:'right', color: f.conEmail > 0 ? A.green : A.muted, fontWeight: f.conEmail > 0 ? 700 : 400 }}>{f.conEmail}</td>
                      <td style={{ ...td, textAlign:'right', color:A.muted, whiteSpace:'nowrap' }}>{fmtFecha(f.ultima)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </StatSection>

      {emails.length > 0 && (
        <StatSection title="Emails para avisar" subtitle="Personas que dejaron su email esperando que lleguemos a su destino.">
          <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, overflow:'hidden' }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:440 }}>
                <thead>
                  <tr>
                    <th style={{ ...th, paddingTop:14 }}>Email</th>
                    <th style={{ ...th, paddingTop:14 }}>Destino</th>
                    <th style={{ ...th, paddingTop:14, textAlign:'right' }}>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {emails.map((d, i) => (
                    <tr key={i}>
                      <td style={{ ...td, fontWeight:600 }}>{d.email}</td>
                      <td style={{ ...td }}>{d.destino}{d.provincia ? `, ${d.provincia}` : ''}</td>
                      <td style={{ ...td, textAlign:'right', color:A.muted, whiteSpace:'nowrap' }}>{fmtFecha(d.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </StatSection>
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
          <div style={{ fontFamily:A.font, fontSize:13, color:A.muted }}>Las ventas aparecerán cuando los usuarios completen compras</div>
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
                    <span style={{display:'flex',alignItems:'center',gap:4}}><img src="/credito-coin.svg" alt="crédito" style={{width:12,height:12}}/> {v.tokens_total} créditos · {v.venta_items?.length || 0} ofertas · {v.forma_pago || '—'}</span>
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
                          <span style={{ fontFamily:A.font, fontSize:12, fontWeight:700, color:A.ink, display:'flex', alignItems:'center', gap:4 }}><img src="/credito-coin.svg" alt="crédito" style={{width:14,height:14}}/> {item.tokens}</span>
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
      <p style={{ fontFamily:A.font, fontSize:13, color:A.muted, margin:'0 0 4px' }}>
        Mensajes de quienes pidieron hablar con un humano desde Cuponix.
      </p>
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
                {c.negocios?.nombre ? <span>🏢 {c.negocios.nombre}</span> : <span>💬 Cuponix</span>}
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
// Helper: limpiar "(gratis)" del nombre del plan
function limpiarNombrePlan(nombre) {
  return nombre.replace(/\s*\(gratis\)\s*/gi, '').trim();
}

// Sub-componente para editar beneficio con drag-and-drop y mini-formatos
function BeneficioItem({ valor, index, onEdit, onDelete, onReorder }) {
  const [dragging, setDragging] = useState(false);
  const [editando, setEditando] = useState(false);
  const inputStyle = { width:'100%', padding:'9px 12px', border:`1px solid ${A.line}`, borderRadius:9, fontFamily:A.font, fontSize:13, outline:'none', boxSizing:'border-box' };

  return (
    <>
      <div
        draggable
        onDragStart={() => setDragging(true)}
        onDragEnd={() => setDragging(false)}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); onReorder?.(index); }}
        style={{
          display:'flex', alignItems:'center', gap:8, background: dragging ? '#f0f0f0' : A.bg, borderRadius:8, padding:'7px 10px',
          cursor:'move', opacity: dragging ? 0.7 : 1, transition:'all 0.15s',
          border: dragging ? `2px dashed ${A.primary}` : 'none',
        }}>
        <span style={{ fontFamily:A.font, fontSize:12, color:A.muted, userSelect:'none' }}>⋮⋮</span>
        {editando ? (
          <>
            <input autoFocus value={valor} onChange={e => onEdit(index, e.target.value)} onBlur={() => setEditando(false)} onKeyDown={e => e.key === 'Escape' && setEditando(false)}
              style={{ ...inputStyle, flex:1, margin:0, padding:'6px 8px', fontSize:12 }} />
            <span style={{ fontFamily:A.font, fontSize:11, color:A.muted }}>Esc</span>
          </>
        ) : (
          <span onClick={() => setEditando(true)} style={{ flex:1, fontFamily:A.font, fontSize:13, color:A.ink2, cursor:'text' }} dangerouslySetInnerHTML={{ __html: valor || '(vacío)' }} />
        )}
        <button onClick={() => onDelete(index)} style={{ background:'none', border:'none', cursor:'pointer', color:A.muted, fontSize:16, lineHeight:1, padding:0 }}>×</button>
      </div>
    </>
  );
}

function PlanForm({ plan, onChange, showToast }) {
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [nuevoBeneficio, setNuevoBeneficio] = useState('');

  const inputStyle = { width:'100%', padding:'9px 12px', border:`1px solid ${A.line}`, borderRadius:9, fontFamily:A.font, fontSize:13, outline:'none', boxSizing:'border-box' };
  const labelStyle = { display:'block', fontSize:11, fontWeight:600, color:A.muted, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:5 };

  function agregarBeneficio() {
    if (!nuevoBeneficio.trim()) return;
    onChange({ beneficios: [...plan.beneficios, nuevoBeneficio.trim()] });
    setNuevoBeneficio('');
  }

  function quitarBeneficio(i) {
    onChange({ beneficios: plan.beneficios.filter((_, idx) => idx !== i) });
  }

  function editarBeneficio(i, nuevoValor) {
    const nuevos = [...plan.beneficios];
    nuevos[i] = nuevoValor;
    onChange({ beneficios: nuevos });
  }

  function reordenarBeneficio(fromIdx, toIdx) {
    if (fromIdx === toIdx) return;
    const nuevos = [...plan.beneficios];
    const [item] = nuevos.splice(fromIdx, 1);
    nuevos.splice(toIdx, 0, item);
    onChange({ beneficios: nuevos });
  }

  const nombreLimpio = limpiarNombrePlan(plan.nombre);

  return (
    <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, padding:22, display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ fontFamily:A.font, fontSize:16, fontWeight:700, color:A.ink }}>{nombreLimpio} <span style={{ fontSize:12, fontWeight:400, color:A.muted }}>({plan.id})</span></div>

      <div>
        <label style={labelStyle}>Nombre (sin editar)</label>
        <div style={{ ...inputStyle, background:A.bg, padding:'9px 12px', fontFamily:A.font, fontSize:13, color:A.ink2 }}>{nombreLimpio}</div>
      </div>

      <div>
        <label style={labelStyle}>Descripción corta (HTML: &lt;b&gt;bold&lt;/b&gt;, &lt;i&gt;itálica&lt;/i&gt;, &lt;span style="color:#RGB"&gt;color&lt;/span&gt;)</label>
        <textarea
          value={plan.descripcion}
          onChange={e => onChange({ descripcion: e.target.value })}
          rows={3}
          style={{ ...inputStyle, resize:'vertical', fontFamily:'"Courier New", monospace', fontSize:12 }}
          placeholder="Ej: Incluye <b>15 créditos</b> por <i>mes</i>" />
        <div style={{ marginTop:6, padding:8, background:A.bg, borderRadius:6, fontSize:13, fontFamily:A.font, color:A.ink2 }} dangerouslySetInnerHTML={{ __html: plan.descripcion }} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12 }}>
        <div>
          <label style={labelStyle}>Precio mensual ($ sin IVA)</label>
          <input type="number" value={plan.precioMes ?? ''} onChange={e => onChange({ precioMes: e.target.value ? Number(e.target.value) : '' })}
            style={inputStyle} placeholder="—" />
        </div>
        <div>
          <label style={labelStyle}>Meses de compromiso</label>
          <input type="number" value={plan.meses ?? ''} onChange={e => onChange({ meses: e.target.value ? Number(e.target.value) : '' })}
            style={inputStyle} placeholder="—" />
        </div>
        <div>
          <label style={labelStyle}>Créditos publicitarios / mes</label>
          <input type="number" value={plan.creditosMes ?? ''} onChange={e => onChange({ creditosMes: e.target.value ? Number(e.target.value) : '' })}
            style={inputStyle} placeholder="—" />
        </div>
        <div>
          <label style={labelStyle}>Créditos de bienvenida</label>
          <input type="number" value={plan.creditosBono ?? ''} onChange={e => onChange({ creditosBono: e.target.value ? Number(e.target.value) : '' })}
            style={inputStyle} placeholder="—" />
        </div>
      </div>

      {/* Un solo tramo puede ser el destacado: marcar uno desmarca los demás. */}
      <label style={{ display:'flex', alignItems:'center', gap:8, fontFamily:A.font, fontSize:13, color:A.ink2, cursor:'pointer' }}>
        <input type="checkbox" checked={!!plan.destacado} onChange={e => onChange({ destacado: e.target.checked })} />
        Mostrar como “El más elegido”
      </label>

      <div>
        <label style={labelStyle}>Beneficios (drag para reordenar, click para editar)</label>
        <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:8 }}>
          {plan.beneficios.map((b, i) => (
            <BeneficioItem
              key={i}
              valor={b}
              index={i}
              onEdit={editarBeneficio}
              onDelete={quitarBeneficio}
              onReorder={(toIdx) => reordenarBeneficio(i, toIdx)}
            />
          ))}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <input
            value={nuevoBeneficio}
            onChange={e => setNuevoBeneficio(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && agregarBeneficio()}
            style={{ ...inputStyle, flex:1 }}
            placeholder="Beneficio (HTML: <b>bold</b>, <i>itálica</i>, <span style={{color:'#fff'}}>#RGB</span> color)" />
          <ABtn onClick={agregarBeneficio}>Agregar</ABtn>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TabAjusteImagenes — gestor de imágenes de PERFIL de socios
//  (portada `imagen_url` + `galeria`; NO las imágenes de cupones)
// ═══════════════════════════════════════════════════════════
const IMG_BUCKET = 'negocios';
const extDeArchivo = f => (f.name?.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
const conBust = (url, bust) => !url ? '' : (bust ? url + (url.includes('?') ? '&' : '?') + 't=' + bust : url);
// Relación de aspecto simplificada (p.ej. "3:2"); si los números quedan grandes, decimal.
function aspecto(w, h) {
  if (!w || !h) return '';
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const d = gcd(w, h), rw = w / d, rh = h / d;
  return (rw <= 40 && rh <= 40) ? `${rw}:${rh}` : (w / h).toFixed(2) + ':1';
}

function pathDesdeUrl(url) {
  const m = url && url.match(/\/storage\/v1\/object\/public\/negocios\/(.+)$/);
  return m ? decodeURIComponent(m[1].split('?')[0]) : null;
}
async function borrarDeStorage(url) {
  const p = pathDesdeUrl(url);
  if (p) { try { await supabase.storage.from(IMG_BUCKET).remove([p]); } catch (_) {} }
}
async function subirArchivo(path, file) {
  const { data, error } = await supabase.storage.from(IMG_BUCKET).upload(path, file, { upsert: true });
  if (error) throw error;
  const { data: pub } = supabase.storage.from(IMG_BUCKET).getPublicUrl(data.path);
  return pub.publicUrl;
}
// Descarga una imagen desde una URL para poder subirla al bucket (puede fallar por CORS).
async function archivoDesdeUrl(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('HTTP ' + resp.status);
  const blob = await resp.blob();
  if (!blob.type.startsWith('image/')) throw new Error('El enlace no apunta a una imagen');
  const ext = (blob.type.split('/')[1] || 'jpg').split('+')[0];
  return new File([blob], `url.${ext}`, { type: blob.type });
}

const IMG_TOOL_BTN = { width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 };
const IMG_LBL = { fontFamily: A.font, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: A.muted, marginBottom: 5 };

// Un cuadradito editable: arrastrar / URL / subir / eliminar
function ImgThumb({ src, portada = false, busy = false, canDelete = true, onFile, onUrl, onDelete, onZoom }) {
  const [drag, setDrag] = useState(false);
  const [urlOpen, setUrlOpen] = useState(false);
  const [url, setUrl] = useState('');
  const inputRef = useRef(null);

  const handleDrop = e => {
    e.preventDefault(); setDrag(false);
    const dt = e.dataTransfer;
    // 1) Arrastrada desde el sistema de archivos → viene como File
    const f = dt?.files?.[0];
    if (f && f.type.startsWith('image/')) { onFile(f); return; }
    // 2) Arrastrada desde otra página del navegador → viene como URL (no como archivo)
    let url = dt?.getData?.('text/uri-list') || dt?.getData?.('text/plain') || '';
    if (!url) {
      const html = dt?.getData?.('text/html') || '';
      const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (m) url = m[1];
    }
    // text/uri-list puede traer varias líneas (algunas son comentarios con #)
    url = (url || '').split(/[\r\n]+/).map(s => s.trim()).find(s => /^https?:\/\//i.test(s)) || '';
    if (url) onUrl(url);
  };
  const submitUrl = () => { const v = url.trim(); if (v) { onUrl(v); setUrl(''); setUrlOpen(false); } };

  return (
    <div
      onDragOver={e => { e.preventDefault(); if (!drag) setDrag(true); }}
      onDragLeave={e => { e.preventDefault(); setDrag(false); }}
      onDrop={handleDrop}
      style={{
        position: 'relative', width: 128, height: 128, borderRadius: 12, overflow: 'hidden',
        background: A.bg,
        border: drag ? `2px dashed ${A.primary}` : portada ? `2px solid ${A.primary}` : `1px solid ${A.line}`,
      }}
    >
      {src
        ? <img src={src} alt="" onClick={() => onZoom?.(src)} title="Click para ver en grande" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'zoom-in' }} />
        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C0C4CE', fontSize: 11, textAlign: 'center', padding: 8, fontFamily: A.font }}>{portada ? 'Sin portada' : 'Arrastrá o subí'}</div>}

      {drag && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(37,69,230,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: A.primary, fontWeight: 700, fontSize: 12, fontFamily: A.font, pointerEvents: 'none' }}>Soltá para subir</div>
      )}
      {busy && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: A.primary, fontWeight: 700, fontSize: 11, fontFamily: A.font }}>Guardando…</div>
      )}

      {/* Toolbar: URL → Subir → Eliminar */}
      {!drag && !busy && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', gap: 6, justifyContent: 'center', padding: 7, background: 'linear-gradient(to top, rgba(11,16,32,0.78), transparent)' }}>
          <button title="Traer desde una URL" onClick={() => setUrlOpen(o => !o)} style={IMG_TOOL_BTN}><Link2 size={15} /></button>
          <button title="Subir un archivo" onClick={() => inputRef.current?.click()} style={IMG_TOOL_BTN}><Upload size={15} /></button>
          {canDelete && src && <button title="Eliminar" onClick={onDelete} style={IMG_TOOL_BTN}><Trash2 size={15} color="#EF4444" /></button>}
        </div>
      )}

      {urlOpen && (
        <div style={{ position: 'absolute', left: 6, right: 6, bottom: 44, background: '#fff', borderRadius: 8, boxShadow: '0 8px 24px rgba(11,16,32,0.22)', padding: 6, display: 'flex', gap: 5, zIndex: 3 }}>
          <input autoFocus value={url} onChange={e => setUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submitUrl(); if (e.key === 'Escape') setUrlOpen(false); }}
            placeholder="Pegá URL de imagen"
            style={{ flex: 1, minWidth: 0, border: `1px solid ${A.line}`, borderRadius: 6, padding: '5px 7px', fontSize: 11, fontFamily: A.font, outline: 'none' }} />
          <button onClick={submitUrl} style={{ border: 'none', background: A.primary, color: '#fff', borderRadius: 6, padding: '5px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: A.font }}>Traer</button>
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onFile(f); }} />
    </div>
  );
}

function TabAjusteImagenes({ showToast }) {
  const [negocios, setNegocios] = useState(null); // null = cargando
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState({}); // { [id]: bool }
  const [lightbox, setLightbox] = useState(null); // src en grande
  const [dims, setDims] = useState(null); // { w, h } naturales
  const zoom = src => { setDims(null); setLightbox(src); };

  useEffect(() => {
    if (!lightbox) return;
    const onKey = e => { if (e.key === 'Escape') setLightbox(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  async function cargar() {
    setNegocios(null);
    const { data, error } = await supabase
      .from('negocios')
      .select('id, nombre, tipo, localidad, imagen_url, galeria, activo')
      .order('nombre', { ascending: true });
    if (error) { showToast('Error al cargar socios: ' + error.message, 'error'); setNegocios([]); return; }
    setNegocios((data || []).map(n => ({ ...n, galeria: Array.isArray(n.galeria) ? n.galeria.filter(Boolean) : [], _bust: 0 })));
  }
  useEffect(() => { cargar(); }, []);

  // Evitar que el navegador abra la imagen si se suelta fuera de un cuadrito.
  useEffect(() => {
    const prevent = e => e.preventDefault();
    window.addEventListener('dragover', prevent);
    window.addEventListener('drop', prevent);
    return () => { window.removeEventListener('dragover', prevent); window.removeEventListener('drop', prevent); };
  }, []);

  const patch = (id, cambios) => setNegocios(prev => prev.map(n => n.id === id ? { ...n, ...cambios } : n));

  async function guardar(id, cambios) {
    const { error } = await supabase.from('negocios').update(cambios).eq('id', id);
    if (error) throw error;
  }
  async function correr(id, fn) {
    setBusy(b => ({ ...b, [id]: true }));
    try { await fn(); }
    catch (e) { showToast('Error: ' + (e.message || e), 'error'); }
    finally { setBusy(b => ({ ...b, [id]: false })); }
  }
  // Resuelve una URL a un valor final: intenta descargarla al bucket; si falla (CORS), guarda el enlace directo.
  async function urlAFinal(rawUrl, prefijo) {
    try {
      const file = await archivoDesdeUrl(rawUrl);
      return await subirArchivo(`${prefijo}.${extDeArchivo(file)}`, file);
    } catch (_) {
      showToast('No pude descargar la imagen (CORS); guardé el enlace directo', 'info');
      return rawUrl;
    }
  }

  // ── Portada ──
  const repPortadaFile = (n, file) => correr(n.id, async () => {
    const url = await subirArchivo(`logos/${n.id}.${extDeArchivo(file)}`, file);
    await guardar(n.id, { imagen_url: url });
    if (n.imagen_url && n.imagen_url !== url) borrarDeStorage(n.imagen_url);
    patch(n.id, { imagen_url: url, _bust: Date.now() });
    showToast('Portada actualizada');
  });
  const repPortadaUrl = (n, rawUrl) => correr(n.id, async () => {
    const url = await urlAFinal(rawUrl, `logos/${n.id}`);
    await guardar(n.id, { imagen_url: url });
    patch(n.id, { imagen_url: url, _bust: Date.now() });
    showToast('Portada actualizada');
  });
  const delPortada = (n) => {
    if (!window.confirm(`¿Eliminar la portada de "${n.nombre || ''}"?`)) return;
    correr(n.id, async () => {
      await guardar(n.id, { imagen_url: null });
      borrarDeStorage(n.imagen_url);
      patch(n.id, { imagen_url: null });
      showToast('Portada eliminada');
    });
  };

  // ── Galería ──
  const repGalFile = (n, i, file) => correr(n.id, async () => {
    const url = await subirArchivo(`galeria/${n.id}/${Date.now()}-${i}.${extDeArchivo(file)}`, file);
    const galeria = [...n.galeria]; const old = galeria[i]; galeria[i] = url;
    await guardar(n.id, { galeria });
    borrarDeStorage(old);
    patch(n.id, { galeria });
    showToast('Imagen reemplazada');
  });
  const repGalUrl = (n, i, rawUrl) => correr(n.id, async () => {
    const url = await urlAFinal(rawUrl, `galeria/${n.id}/${Date.now()}-${i}`);
    const galeria = [...n.galeria]; galeria[i] = url;
    await guardar(n.id, { galeria });
    patch(n.id, { galeria });
    showToast('Imagen reemplazada');
  });
  const delGal = (n, i) => {
    if (!window.confirm('¿Eliminar esta imagen de la galería?')) return;
    correr(n.id, async () => {
      const old = n.galeria[i];
      const galeria = n.galeria.filter((_, j) => j !== i);
      await guardar(n.id, { galeria });
      borrarDeStorage(old);
      patch(n.id, { galeria });
      showToast('Imagen eliminada');
    });
  };
  const addGalFile = (n, file) => correr(n.id, async () => {
    const url = await subirArchivo(`galeria/${n.id}/${Date.now()}-${n.galeria.length}.${extDeArchivo(file)}`, file);
    const galeria = [...n.galeria, url];
    await guardar(n.id, { galeria });
    patch(n.id, { galeria });
    showToast('Imagen agregada');
  });
  const addGalUrl = (n, rawUrl) => correr(n.id, async () => {
    const url = await urlAFinal(rawUrl, `galeria/${n.id}/${Date.now()}-${n.galeria.length}`);
    const galeria = [...n.galeria, url];
    await guardar(n.id, { galeria });
    patch(n.id, { galeria });
    showToast('Imagen agregada');
  });

  if (negocios === null) return <MiniLoader />;

  const term = q.trim().toLowerCase();
  const visibles = term
    ? negocios.filter(n => (n.nombre || '').toLowerCase().includes(term) || (n.localidad || '').toLowerCase().includes(term))
    : negocios;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
        <h2 style={{ fontFamily: A.font, fontSize: 20, fontWeight: 800, color: A.ink, margin: 0 }}>Imágenes de socios</h2>
        <span style={{ fontFamily: A.font, fontSize: 12, color: A.muted }}>{visibles.length} socio{visibles.length !== 1 ? 's' : ''}</span>
        <span style={{ flex: 1 }} />
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: A.muted }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nombre o localidad…"
            style={{ padding: '8px 12px 8px 30px', border: `1px solid ${A.line}`, borderRadius: 10, fontSize: 13, fontFamily: A.font, outline: 'none', minWidth: 240 }} />
        </div>
        <button onClick={cargar} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: `1px solid ${A.line}`, borderRadius: 10, padding: '8px 14px', fontFamily: A.font, fontSize: 13, fontWeight: 600, color: A.ink2, cursor: 'pointer' }}><RefreshCw size={14} /> Recargar</button>
      </div>
      <p style={{ fontFamily: A.font, fontSize: 12.5, color: A.muted, margin: '0 0 18px', lineHeight: 1.5 }}>
        Imágenes del <b>perfil</b> de cada socio (portada + galería), no las de sus cupones. En cada cuadrito podés <b>arrastrar</b> una imagen, traerla desde una <b>URL</b>, <b>subir</b> un archivo o <b>eliminarla</b>.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {visibles.map(n => (
          <div key={n.id} style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 18, background: '#fff', border: `1px solid ${A.line}`, borderRadius: 14, padding: '16px 18px' }}>
            <div>
              <div style={{ fontFamily: A.font, fontSize: 15, fontWeight: 800, color: A.ink, lineHeight: 1.25 }}>{n.nombre || '(sin nombre)'}</div>
              <div style={{ fontFamily: A.font, fontSize: 12.5, color: A.muted, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span>{n.tipo || '—'}</span>
                <span>{n.localidad || '—'}</span>
              </div>
              <span style={{ display: 'inline-block', marginTop: 8, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: n.activo === false ? '#FEF2F2' : A.primarySoft, color: n.activo === false ? '#EF4444' : A.primary }}>
                {n.activo === false ? 'inactivo' : 'activo'} · {n.galeria.length} en galería
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}>
              <div>
                <div style={IMG_LBL}>Portada / logo</div>
                <ImgThumb src={conBust(n.imagen_url, n._bust)} portada busy={!!busy[n.id]} onZoom={zoom}
                  onFile={f => repPortadaFile(n, f)} onUrl={u => repPortadaUrl(n, u)} onDelete={() => delPortada(n)} />
              </div>
              {n.galeria.map((src, i) => (
                <div key={i}>
                  <div style={IMG_LBL}>Galería {i + 1}</div>
                  <ImgThumb src={src} busy={!!busy[n.id]} onZoom={zoom}
                    onFile={f => repGalFile(n, i, f)} onUrl={u => repGalUrl(n, i, u)} onDelete={() => delGal(n, i)} />
                </div>
              ))}
              <div>
                <div style={IMG_LBL}>Agregar</div>
                <ImgThumb src="" canDelete={false} busy={!!busy[n.id]}
                  onFile={f => addGalFile(n, f)} onUrl={u => addGalUrl(n, u)} />
              </div>
            </div>
          </div>
        ))}
        {!visibles.length && <div style={{ fontFamily: A.font, color: A.muted, padding: 40, textAlign: 'center' }}>No hay socios que coincidan.</div>}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(11,16,32,0.88)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
          <img src={lightbox} alt="" onClick={e => e.stopPropagation()}
            onLoad={e => setDims({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
            style={{ maxWidth: '92vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: 12, boxShadow: '0 24px 90px rgba(0,0,0,0.55)', background: '#fff' }} />
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 16, fontFamily: A.font, color: '#fff', fontSize: 13 }}>
            {dims
              ? <span><b>{dims.w} × {dims.h}</b> px · relación <b>{aspecto(dims.w, dims.h)}</b> · {dims.w === dims.h ? 'cuadrada' : dims.w > dims.h ? 'horizontal' : 'vertical'}</span>
              : <span style={{ opacity: 0.7 }}>Cargando dimensiones…</span>}
            <a href={lightbox} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', opacity: 0.8, fontSize: 12 }}>abrir original ↗</a>
            <button onClick={() => setLightbox(null)} style={{ border: '1px solid rgba(255,255,255,0.4)', background: 'transparent', color: '#fff', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: A.font }}>Cerrar ✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Parámetros globales del Pase ─────────────────────────────
// El tope de pases regalo es GLOBAL y no un atributo del plan: se calibra con
// datos reales de temporada sin tocar código ni deployar. Antes el plan pago
// daba regalos ilimitados y eso socavaba el precio de las tandas del
// distribuidor — cualquiera tomaba el plan y repartía gratis.
function AjustesPase({ showToast }) {
  const [tope, setTope]       = useState('');
  const [original, setOriginal] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let vivo = true;
    supabase.from('configuracion').select('valor').eq('clave', 'pases_regalo_tope_mensual').maybeSingle()
      .then(({ data }) => {
        if (!vivo) return;
        const v = data?.valor ?? '150';
        setTope(v); setOriginal(v); setCargando(false);
      });
    return () => { vivo = false; };
  }, []);

  async function guardar() {
    const n = Number(tope);
    if (!(n >= 1)) return showToast('El tope tiene que ser al menos 1', 'error');
    setGuardando(true);
    const { error } = await supabase.from('configuracion')
      .upsert({ clave: 'pases_regalo_tope_mensual', valor: String(n) }, { onConflict: 'clave' });
    setGuardando(false);
    if (error) return showToast('No se pudo guardar', 'error');
    setOriginal(String(n));
    showToast(`Tope actualizado: ${n} pases regalo por socio por mes`);
  }

  if (cargando) return <MiniLoader />;

  return (
    <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:16, padding:22, maxWidth:560 }}>
      <div style={{ fontFamily:A.font, fontSize:15, fontWeight:700, color:A.ink, marginBottom:4 }}>
        Tope mensual de pases regalo
      </div>
      <div style={{ fontFamily:A.font, fontSize:12.5, color:A.ink2, lineHeight:1.55, marginBottom:16 }}>
        Cuántos pases puede regalar cada socio por mes. Es el mismo para todos: no depende del
        plan. Un alojamiento real ronda los 60-100/mes, así que el tope no debería tocarlo —
        existe para que el plan no reemplace a las tandas del distribuidor.
      </div>
      <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
        <input value={tope} inputMode="numeric"
          onChange={e => setTope(e.target.value.replace(/\D/g, '').slice(0, 5))}
          style={{ width:110, padding:'11px 14px', borderRadius:10, border:`1px solid ${A.line}`, fontFamily:A.font, fontSize:15, fontWeight:700, outline:'none' }} />
        <span style={{ fontFamily:A.font, fontSize:13, color:A.muted }}>pases por socio por mes</span>
        <ABtn variant="primary" onClick={guardar}
          style={{ opacity: guardando || tope === original ? 0.5 : 1 }}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </ABtn>
      </div>
    </div>
  );
}

function TabAjusteContenidos({ showToast }) {
  const [sub, setSub] = useState('planes');
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <PillTabs
        tabs={[{ id:'planes', label:'Planes' }, { id:'pase', label:'Pase' }, { id:'portadas', label:'Portadas' }]}
        value={sub}
        onChange={setSub}
      />
      {sub === 'planes'   && <ContenidosPlanes showToast={showToast} />}
      {sub === 'pase'     && <AjustesPase showToast={showToast} />}
      {sub === 'portadas' && <TabPortadas showToast={showToast} />}
    </div>
  );
}

function ContenidosPlanes({ showToast }) {
  const [planesOrig, setPlanesOrig]   = useState([]);
  const [planes, setPlanes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function cargar() {
    setLoading(true);
    const p = await getPlanesPro();
    setPlanesOrig(p);
    setPlanes(JSON.parse(JSON.stringify(p))); // Deep clone para edición local
    setLoading(false);
  }

  useEffect(() => { cargar(); }, []);

  async function guardarTodos() {
    setSaving(true);
    try {
      for (const plan of planes) {
        const changed = JSON.stringify(planesOrig.find(po => po.planId === plan.planId)) !== JSON.stringify(plan);
        if (!changed) continue;
        const { error } = await actualizarPlanCopy(plan.planId, {
          nombre: plan.nombre,
          descripcion: plan.descripcion,
          precio_mes: plan.precioMes === '' ? null : Number(plan.precioMes),
          meses_contrato: plan.meses === '' ? null : Number(plan.meses),
          creditos_incluidos: plan.creditosMes === '' ? null : Number(plan.creditosMes),
          creditos_bono: plan.creditosBono === '' ? null : Number(plan.creditosBono),
          destacado: !!plan.destacado,
          beneficios: plan.beneficios,
        });
        if (error) throw error;
      }
      // "El más elegido" es uno solo: si se marcó uno, se desmarcan los otros.
      const nuevoDestacado = planes.find(p => p.destacado);
      if (nuevoDestacado) {
        await Promise.all(planes
          .filter(p => p.planId !== nuevoDestacado.planId && p.destacado)
          .map(p => actualizarPlanCopy(p.planId, { destacado: false })));
      }
      showToast?.('Planes actualizados', 'success');
      cargar();
    } catch (err) {
      showToast?.('Error al guardar planes', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <MiniLoader />;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontFamily:A.font, fontSize:18, fontWeight:700, color:A.ink }}>Planes</div>
        <ABtn onClick={guardarTodos} variant="primary" style={{ opacity: saving ? 0.6 : 1 }}>{saving ? 'Guardando…' : 'Guardar todos'}</ABtn>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16 }}>
        {planes.map(p => (
          <PlanForm
            key={p.planId}
            plan={p}
            onChange={(updates) => {
              setPlanes(ps => ps.map(pl => pl.planId === p.planId ? { ...pl, ...updates } : pl));
            }}
            showToast={showToast}
          />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB AJUSTES: PERFILES / PERMISOS
// ═══════════════════════════════════════════════════════════
function TabAjustePerfiles({ showToast }) {
  const [roles, setRoles]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [nuevo, setNuevo]     = useState('');
  const [creando, setCreando] = useState(false);

  async function cargar() { setLoading(true); setRoles(await listarRoles()); setLoading(false); }
  useEffect(() => { cargar(); }, []);

  async function crear() {
    if (!nuevo.trim()) return showToast('Poné un nombre para el perfil', 'error');
    setCreando(true);
    const { data, error } = await crearRol(nuevo.trim());
    setCreando(false);
    if (error) return showToast(error.code === '23505' ? 'Ya existe un perfil con ese nombre' : 'Error al crear el perfil', 'error');
    setRoles(prev => [...prev, data]); setNuevo('');
    showToast('Perfil creado');
  }

  async function toggleCap(rol, capId) {
    const permisos = { ...(rol.permisos || {}), [capId]: !rol.permisos?.[capId] };
    setRoles(prev => prev.map(r => r.id === rol.id ? { ...r, permisos } : r));
    const { error } = await actualizarRol(rol.id, { permisos });
    if (error) { showToast('Error al guardar', 'error'); cargar(); }
  }

  async function renombrar(rol, nombre) {
    const val = nombre.trim() || rol.nombre;
    setRoles(prev => prev.map(r => r.id === rol.id ? { ...r, nombre: val } : r));
    await actualizarRol(rol.id, { nombre: val });
  }

  async function borrar(rol) {
    if (!window.confirm(`¿Eliminar el perfil "${rol.nombre}"?`)) return;
    setRoles(prev => prev.filter(r => r.id !== rol.id));
    const { error } = await eliminarRol(rol.id);
    if (error) { showToast('Error al eliminar', 'error'); cargar(); }
    else showToast('Perfil eliminado');
  }

  const inputStyle = { padding:'8px 11px', borderRadius:10, border:`1px solid ${A.line}`, fontSize:13, fontFamily:A.font, background:'#fff', color:A.ink, outline:'none' };
  if (loading) return <MiniLoader />;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <p style={{ fontFamily:A.font, fontSize:13, color:A.muted, margin:0 }}>
        Los perfiles definen qué puede hacer cada usuario. El perfil <b>Superadmin</b> es del sistema: no se edita ni se borra.
        <br/><span style={{ fontSize:12 }}>Nota: la aplicación de estos permisos por sección todavía no está cableada (se guardan y se muestran).</span>
      </p>

      {/* Alta de perfil */}
      <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, padding:16, display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
        <input value={nuevo} onChange={e => setNuevo(e.target.value)} placeholder="Nombre del nuevo perfil" style={{ ...inputStyle, flex:1, minWidth:200 }} />
        <ABtn variant="primary" onClick={crear} style={{ opacity: creando ? 0.6 : 1 }}>Crear perfil</ABtn>
      </div>

      {roles.map(rol => (
        <div key={rol.id} style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, padding:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            {rol.es_sistema ? (
              <span style={{ fontFamily:A.font, fontSize:15, fontWeight:700, color:A.ink }}>{rol.nombre}</span>
            ) : (
              <input defaultValue={rol.nombre} onBlur={e => renombrar(rol, e.target.value)}
                style={{ ...inputStyle, fontWeight:700, fontSize:15, flex:1, minWidth:180 }} />
            )}
            {rol.es_sistema && <span style={{ background:'#EDE9FE', color:'#7C3AED', padding:'3px 8px', borderRadius:6, fontWeight:600, fontSize:10, fontFamily:A.font }}>Sistema</span>}
            {!rol.es_sistema && (
              <button onClick={() => borrar(rol)} title="Eliminar perfil" style={{ marginLeft:'auto', background:'none', border:`1px solid ${A.line}`, borderRadius:8, padding:'6px 8px', cursor:'pointer', color:'#C03030', display:'flex', alignItems:'center' }}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:8 }}>
            {CAPACIDADES.map(cap => {
              const on = rol.es_sistema ? true : !!rol.permisos?.[cap.id];
              return (
                <label key={cap.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:10, background:A.bg, cursor: rol.es_sistema ? 'not-allowed' : 'pointer', opacity: rol.es_sistema ? 0.7 : 1 }}>
                  <input type="checkbox" checked={on} disabled={rol.es_sistema} onChange={() => toggleCap(rol, cap.id)} style={{ accentColor:A.primary, width:16, height:16, cursor: rol.es_sistema ? 'not-allowed' : 'pointer' }} />
                  <span style={{ fontFamily:A.font, fontSize:13, color:A.ink }}>{cap.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB AJUSTES: USUARIOS
// ═══════════════════════════════════════════════════════════
function TabAjusteUsuarios({ showToast }) {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState({ email:'', password:'', nombre:'', apellido:'', rol:'' });
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    setLoading(true);
    const [us, rs] = await Promise.all([listarUsuariosAdmin(), listarRoles()]);
    setUsuarios(us); setRoles(rs);
    setLoading(false);
  }
  useEffect(() => { cargar(); }, []);

  async function crear() {
    if (!form.email.trim() || !form.password) return showToast('Email y contraseña son obligatorios', 'error');
    if (form.password.length < 6) return showToast('La contraseña debe tener al menos 6 caracteres', 'error');
    if (!form.rol) return showToast('Asigná un perfil', 'error');
    setGuardando(true);
    const { error } = await crearUsuario({ email: form.email.trim(), password: form.password, nombre: form.nombre.trim(), apellido: form.apellido.trim(), rol: form.rol });
    setGuardando(false);
    if (error) return showToast(error, 'error');
    setForm({ email:'', password:'', nombre:'', apellido:'', rol:'' });
    showToast('Usuario creado');
    cargar();
  }

  async function cambiarRol(u, rol) {
    setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, rol } : x));
    const { error } = await actualizarUsuario(u.id, { nombre: u.nombre, apellido: u.apellido, rol });
    if (error) { showToast('Error al guardar', 'error'); cargar(); }
  }

  async function borrar(u) {
    if (!window.confirm(`¿Eliminar al usuario ${u.email}?`)) return;
    const { error } = await eliminarUsuario(u.id);
    if (error) return showToast(error, 'error');
    setUsuarios(prev => prev.filter(x => x.id !== u.id));
    showToast('Usuario eliminado');
  }

  const inputStyle = { padding:'9px 11px', borderRadius:10, border:`1px solid ${A.line}`, fontSize:13, fontFamily:A.font, background:'#fff', color:A.ink, outline:'none', boxSizing:'border-box' };
  if (loading) return <MiniLoader />;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <p style={{ fontFamily:A.font, fontSize:13, color:A.muted, margin:0 }}>
        Usuarios que acceden al panel. Cada uno tiene un perfil asignado (definido en Permisos).
      </p>

      {/* Alta de usuario */}
      <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, padding:16, display:'flex', flexDirection:'column', gap:10 }}>
        <div style={{ fontFamily:A.font, fontSize:13, fontWeight:700, color:A.ink }}>Añadir usuario</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:10 }}>
          <input value={form.email} onChange={e => setForm({ ...form, email:e.target.value })} placeholder="Email (usuario)" style={inputStyle} />
          <input type="password" value={form.password} onChange={e => setForm({ ...form, password:e.target.value })} placeholder="Contraseña" style={inputStyle} />
          <input value={form.nombre} onChange={e => setForm({ ...form, nombre:e.target.value })} placeholder="Nombre" style={inputStyle} />
          <input value={form.apellido} onChange={e => setForm({ ...form, apellido:e.target.value })} placeholder="Apellido" style={inputStyle} />
          <select value={form.rol} onChange={e => setForm({ ...form, rol:e.target.value })} style={{ ...inputStyle, cursor:'pointer' }}>
            <option value="">Perfil asignado…</option>
            {roles.map(r => <option key={r.id} value={r.nombre}>{r.nombre}</option>)}
          </select>
          <ABtn variant="primary" onClick={crear} style={{ justifyContent:'center', opacity: guardando ? 0.6 : 1 }}>
            {guardando ? 'Creando…' : 'Añadir usuario'}
          </ABtn>
        </div>
      </div>

      {/* Lista */}
      <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, overflow:'hidden' }}>
        {usuarios.map((u, i) => (
          <div key={u.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', borderTop: i > 0 ? `1px solid ${A.line}` : 'none' }}>
            <div style={{ width:40, height:40, borderRadius:'50%', background: u.es_superadmin ? '#7C3AED' : A.primary, display:'grid', placeItems:'center', flexShrink:0, color:'#fff', fontFamily:A.font, fontWeight:700, fontSize:14 }}>
              {u.es_superadmin ? '⭐' : (u.nombre?.[0] || u.email?.[0] || 'U').toUpperCase()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:A.font, fontSize:14, fontWeight:600, color:A.ink }}>{[u.nombre, u.apellido].filter(Boolean).join(' ') || 'Sin nombre'}</div>
              <div style={{ fontFamily:A.font, fontSize:12, color:A.muted, marginTop:2 }}>{u.email}</div>
            </div>
            {u.es_superadmin ? (
              <span style={{ background:'#EDE9FE', color:'#7C3AED', padding:'4px 10px', borderRadius:6, fontWeight:600, fontSize:11, fontFamily:A.font }}>Superadmin</span>
            ) : (
              <>
                <select value={u.rol || ''} onChange={e => cambiarRol(u, e.target.value)} style={{ ...inputStyle, cursor:'pointer' }}>
                  <option value="">Sin perfil</option>
                  {roles.filter(r => !r.es_sistema).map(r => <option key={r.id} value={r.nombre}>{r.nombre}</option>)}
                </select>
                <button onClick={() => borrar(u)} title="Eliminar usuario" style={{ background:'none', border:`1px solid ${A.line}`, borderRadius:8, padding:'7px 9px', cursor:'pointer', color:'#C03030', display:'flex', alignItems:'center' }}>
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  PANEL DE AJUSTES (engranaje): usuarios y permisos
// ═══════════════════════════════════════════════════════════
function ConfigPanel({ showToast, onClose }) {
  const [sub, setSub] = useState('usuarios');

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div style={{
        position:'fixed', top:'50%', left:'50%', transform:'translate(-50%, -50%)',
        width:'min(920px, 94vw)', maxHeight:'88vh', zIndex:50,
        background:'#fff', borderRadius:18, overflow:'hidden',
        display:'flex', flexDirection:'column', boxShadow:'0 24px 90px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{ padding:'18px 22px', borderBottom:`1px solid ${A.line}`, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:180 }}>
            <div style={{ fontFamily:A.font, fontWeight:700, fontSize:18, color:A.ink }}>Ajustes</div>
            <div style={{ fontFamily:A.font, fontSize:12.5, color:A.muted, marginTop:2 }}>Usuarios del panel y perfiles de permisos</div>
          </div>
          <PillTabs
            tabs={[{ id:'usuarios', label:'Usuarios' }, { id:'permisos', label:'Permisos' }]}
            value={sub}
            onChange={setSub}
          />
          <button onClick={onClose} title="Cerrar" style={{ background:'none', border:'none', color:A.muted, cursor:'pointer', fontSize:26, lineHeight:1, padding:'0 4px' }}>×</button>
        </div>
        {/* Body */}
        <div style={{ flex:1, overflow:'auto', padding:'20px 22px', background:A.bg }}>
          {sub === 'usuarios' && <TabAjusteUsuarios showToast={showToast} />}
          {sub === 'permisos' && <TabAjustePerfiles showToast={showToast} />}
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
//  DRAWER: EDITAR SOCIO COMERCIAL
// ═══════════════════════════════════════════════════════════
function SocioEditDrawer({ negocio, onClose, onSave, onVerCupones }) {
  const [form, setForm] = useState({
    nombre: negocio?.nombre || '',
    email: negocio?.email || '',
    telefono: negocio?.telefono || '',
    localidad: negocio?.localidad || '',
    provincia: negocio?.provincia || '',
    tipo: negocio?.tipo || '',
    descripcion: negocio?.descripcion || '',
  });
  const [guardando, setGuardando] = useState(false);
  const [vista, setVista]         = useState('datos');   // 'datos' | 'log'
  const [logs, setLogs]           = useState(null);      // null = aún no cargado
  const [cargandoLogs, setCargandoLogs] = useState(false);

  // Fotos que cargó el socio (read-only para el superadmin).
  const galeria = Array.isArray(negocio?.galeria) ? negocio.galeria.filter(Boolean) : [];
  const fotoPerfil = negocio?.foto_perfil || negocio?.imagen_url || null;

  // El "Tipo" es un select con los 3 rubros; si el valor guardado es legacy (ej. 'Hotel'),
  // lo agregamos como opción extra para no perderlo al abrir.
  const tipoEnLista = TIPOS_RUBRO.some(t => t.value === form.tipo);

  async function cargarLogs() {
    setVista('log');
    if (logs !== null || cargandoLogs) return;
    setCargandoLogs(true);
    let q = supabase.from('acciones_usuario').select('*').order('creado_en', { ascending: false }).limit(200);
    if (negocio?.owner_id) q = q.eq('user_id', negocio.owner_id);
    const { data } = await q;
    setLogs(negocio?.owner_id ? (data || []) : []);
    setCargandoLogs(false);
  }

  async function guardar() {
    if (!negocio?.id) return alert('No se pudo identificar el negocio');
    setGuardando(true);
    const { error } = await supabase.from('negocios').update(form).eq('id', negocio.id);
    setGuardando(false);
    if (error) return alert('Error al guardar');
    onSave({ ...negocio, ...form });
  }

  const inputStyle = { padding:'10px 12px', borderRadius:10, border:`1px solid ${A.line}`, fontFamily:A.font, fontSize:13, outline:'none', background:'#fff', width:'100%', boxSizing:'border-box' };
  const labelStyle = { display:'block', fontFamily:A.font, fontSize:11, fontWeight:700, color:A.muted, marginBottom:6, textTransform:'uppercase' };
  const fmtFechaHora = iso => iso ? new Date(iso).toLocaleString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '';

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div style={{ padding:'16px 18px', borderBottom:`1px solid ${A.line}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontFamily:A.font, fontWeight:700, fontSize:16, color:A.ink }}>Editar socio comercial</div>
            <div style={{ fontFamily:A.font, fontSize:12, color:A.muted, marginTop:2 }}>{negocio?.nombre}</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:A.muted, cursor:'pointer', fontSize:24 }}>×</button>
        </div>

        {/* Pestañas: Datos / Log */}
        <div style={{ display:'flex', gap:6, padding:'10px 18px 0' }}>
          {[{ id:'datos', label:'Datos' }, { id:'log', label:'Log de acciones' }].map(t => (
            <button key={t.id} onClick={() => t.id === 'log' ? cargarLogs() : setVista('datos')} style={{
              padding:'8px 14px', borderRadius:'10px 10px 0 0', border:'none', cursor:'pointer', fontFamily:A.font, fontSize:13, fontWeight:600,
              background: vista === t.id ? A.primarySoft : 'transparent', color: vista === t.id ? A.primary : A.muted,
            }}>{t.label}</button>
          ))}
        </div>

        {/* Contenido */}
        <div style={{ flex:1, overflow:'auto', padding:'18px', borderTop:`1px solid ${A.line}` }}>
          {vista === 'datos' ? (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {/* Fotos cargadas por el socio */}
              <div>
                <label style={labelStyle}>Foto de perfil / logo</label>
                {fotoPerfil ? (
                  <img src={fotoPerfil} alt="perfil" style={{ width:96, height:96, borderRadius:14, objectFit:'cover', border:`1px solid ${A.line}` }} />
                ) : (
                  <div style={{ fontFamily:A.font, fontSize:12, color:A.muted, fontStyle:'italic' }}>El socio no cargó foto de perfil.</div>
                )}
              </div>
              <div>
                <label style={labelStyle}>Galería ({galeria.length})</label>
                {galeria.length ? (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8 }}>
                    {galeria.map((src, i) => (
                      <img key={i} src={src} alt={`foto ${i+1}`} style={{ width:'100%', aspectRatio:'1', borderRadius:10, objectFit:'cover', border:`1px solid ${A.line}` }} />
                    ))}
                  </div>
                ) : (
                  <div style={{ fontFamily:A.font, fontSize:12, color:A.muted, fontStyle:'italic' }}>El socio no cargó fotos en la galería.</div>
                )}
              </div>

              <div><label style={labelStyle}>Nombre del negocio</label>
                <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} style={inputStyle} /></div>
              <div><label style={labelStyle}>Email</label>
                <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={inputStyle} /></div>
              <div><label style={labelStyle}>Teléfono</label>
                <input value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} style={inputStyle} /></div>
              <div><label style={labelStyle}>Localidad</label>
                <input value={form.localidad} onChange={e => setForm({...form, localidad: e.target.value})} style={inputStyle} /></div>
              <div><label style={labelStyle}>Provincia</label>
                <input value={form.provincia} onChange={e => setForm({...form, provincia: e.target.value})} style={inputStyle} /></div>
              <div>
                <label style={labelStyle}>Tipo</label>
                <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} style={{ ...inputStyle, cursor:'pointer' }}>
                  {TIPOS_RUBRO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  {!tipoEnLista && form.tipo && <option value={form.tipo}>{form.tipo} (actual)</option>}
                </select>
              </div>
              <div><label style={labelStyle}>Descripción</label>
                <textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} rows={3} style={{...inputStyle, resize:'none'}} /></div>
            </div>
          ) : (
            <div>
              <div style={{ fontFamily:A.font, fontSize:12, color:A.muted, marginBottom:12 }}>
                Acciones registradas del cliente a nivel sistema, más recientes primero.
              </div>
              {cargandoLogs ? (
                <MiniLoader />
              ) : !negocio?.owner_id ? (
                <div style={{ fontFamily:A.font, fontSize:13, color:A.muted, textAlign:'center', padding:'32px 0' }}>Este negocio no tiene un usuario dueño asociado.</div>
              ) : (logs && logs.length) ? (
                <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                  {logs.map(l => (
                    <div key={l.id} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'11px 12px', borderRadius:10, background:A.bg }}>
                      <div style={{ flex:1, minWidth:0, fontFamily:A.font, fontSize:13, color:A.ink }}>{l.accion}</div>
                      <div style={{ fontFamily:A.font, fontSize:11, color:A.muted, whiteSpace:'nowrap', flexShrink:0 }}>{fmtFechaHora(l.creado_en)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontFamily:A.font, fontSize:13, color:A.muted, textAlign:'center', padding:'32px 0' }}>Sin acciones registradas todavía.</div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 18px', borderTop:`1px solid ${A.line}`, display:'flex', gap:10 }}>
          <ABtn onClick={onVerCupones} style={{ flex:1, justifyContent:'center', background:'#E8F5EC', color:A.green, fontWeight:600 }}>
            Ver cupones
          </ABtn>
          <ABtn onClick={onClose} style={{ flex:1, justifyContent:'center' }}>Cancelar</ABtn>
          <ABtn onClick={guardar} variant="primary" style={{ flex:1, justifyContent:'center', opacity: guardando ? 0.6 : 1 }}>
            {guardando ? 'Guardando...' : 'Guardar'}
          </ABtn>
        </div>
      </div>
    </>
  );
}
