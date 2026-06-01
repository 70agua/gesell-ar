// ============================================================
//  src/views/AdminNegocioView.jsx  —  Aire design (AdminA)
// ============================================================
import React, { useState, useEffect } from 'react';
import { Pencil, Plus, X, Save, CheckCircle2, XCircle, Clock, AlertCircle, Star, LogOut, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getOrdenesPendientes, getSaldo, debeUsarTokens, descontarToken, getComprasTokens } from '../lib/cobros';
import ComprarTokensModal from '../components/ComprarTokensModal';
import OfertaEditorDrawer from '../components/OfertaEditorDrawer';

// ─── Aire tokens ─────────────────────────────────────────────
const A = {
  primary:     '#2545E6',
  primarySoft: '#EEF1FF',
  primaryDark: '#1731B8',
  ink:         '#0B1020',
  ink2:        '#3D4255',
  muted:       '#6B7280',
  line:        '#E7E9EE',
  bg:          '#F7F7F8',
  card:        '#FFFFFF',
  navy:        '#0B1733',
  yellow:      '#FFC93C',
  green:       '#10A36B',
  font:        "'Geist', system-ui, sans-serif",
};

const TABS = [
  { id: 'resumen',   label: 'Ofertas'      },
  { id: 'negocio',   label: 'Mi perfil'    },
  { id: 'consultas', label: 'Consultas'    },
  { id: 'cuenta',    label: 'Cuenta'       },
  { id: 'stats',     label: 'Estadísticas' },
];

function ABtn({ onClick, children, variant = 'ghost', style: ext = {}, disabled }) {
  const base = { border:'none', borderRadius:10, fontFamily:A.font, fontWeight:600, fontSize:13, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px' };
  const variants = {
    primary: { background:A.primary, color:'#fff' },
    ghost:   { background:'#fff', border:`1px solid ${A.line}`, color:A.ink2 },
    danger:  { background:'#FCEAEA', color:'#C03030' },
    success: { background:'#E8F5EC', color:A.green },
    dark:    { background:A.navy, color:'#fff' },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...ext, opacity: disabled ? 0.5 : 1 }}>{children}</button>;
}

const inputSt = { padding:'10px 14px', borderRadius:10, border:`1px solid ${A.line}`, fontSize:13, fontFamily:A.font, background:'#fff', color:A.ink, outline:'none', width:'100%', boxSizing:'border-box' };

// ─── Sidebar ─────────────────────────────────────────────────
function Sidebar({ tab, setTab, negocio, perfil, saldoTokens, showComprar, setShowComprar, stats, onVolver, onGoHome, onLogout }) {
  return (
    <aside style={{ background:A.navy, color:'#fff', width:240, minWidth:240, display:'flex', flexDirection:'column', minHeight:'100vh', position:'sticky', top:0, alignSelf:'flex-start' }}>
      {/* Logo */}
      <button onClick={onGoHome} style={{ display:'flex', alignItems:'center', gap:10, padding:'22px 16px 18px', background:'transparent', border:'none', cursor:'pointer', color:'#fff', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ width:32, height:32, borderRadius:8, background:A.primary, display:'grid', placeItems:'center', fontFamily:A.font, fontWeight:900, fontSize:16, flexShrink:0 }}>G</div>
        <div style={{ textAlign:'left', minWidth:0 }}>
          <div style={{ fontFamily:A.font, fontSize:14, fontWeight:700 }}>gesell.ar</div>
          <div style={{ fontFamily:A.font, fontSize:11, color:'rgba(255,255,255,0.55)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:140 }}>{negocio?.nombre || 'Mi negocio'}</div>
        </div>
      </button>

      {/* Nav */}
      <nav style={{ flex:1, padding:'14px 12px', display:'flex', flexDirection:'column', gap:2 }}>
        {TABS.map(t => {
          const active = tab === t.id;
          const badge = t.id === 'consultas' ? stats.consultas : 0;
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

      {/* Token widget — FREE alojamientos only */}
      {negocio && debeUsarTokens(negocio.tipo, negocio.plan) && (
        <div style={{ margin:'0 12px 12px', background:'rgba(255,255,255,0.08)', borderRadius:12, padding:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
            <span style={{ fontFamily:A.font, fontSize:12, color:'rgba(255,255,255,0.6)', fontWeight:600 }}>Tokens</span>
            <span style={{ fontFamily:A.font, fontSize:14, fontWeight:700 }}>🪙 {saldoTokens}</span>
          </div>
          <div style={{ fontFamily:A.font, fontSize:11, color:'rgba(255,255,255,0.45)', marginBottom:8 }}>
            {saldoTokens === 0 ? 'Sin tokens para publicar.' : `Podés publicar ${saldoTokens} oferta${saldoTokens !== 1 ? 's' : ''}.`}
          </div>
          <button onClick={() => setShowComprar(true)} style={{ width:'100%', background:A.primary, color:'#fff', border:'none', borderRadius:8, padding:'7px 0', fontFamily:A.font, fontSize:12, fontWeight:700, cursor:'pointer' }}>
            Comprar tokens
          </button>
        </div>
      )}

      {/* Footer */}
      <div style={{ padding:'14px 12px', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontFamily:A.font, fontSize:10, color:'rgba(255,255,255,0.5)', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>Sesión activa</div>
        <div style={{ fontFamily:A.font, fontSize:13, fontWeight:600, marginTop:4, marginBottom:8 }}>{perfil?.nombre || 'Usuario'}</div>
        {onVolver && (
          <button onClick={onVolver} style={{ display:'flex', alignItems:'center', gap:8, background:'transparent', border:'none', color:'rgba(255,255,255,0.6)', fontFamily:A.font, fontSize:12, cursor:'pointer', marginBottom:4, padding:'4px 0' }}>
            <ArrowLeft size={14} /> Volver al panel
          </button>
        )}
        <button onClick={onLogout} style={{ display:'flex', alignItems:'center', gap:8, background:'transparent', border:'none', color:'rgba(255,255,255,0.45)', fontFamily:A.font, fontSize:12, cursor:'pointer', padding:'4px 0' }}>
          <LogOut size={14} /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function AdminNegocioView({ perfil, onVolver, onGoHome }) {
  const [tab, setTab]               = useState('resumen');
  const [negocio, setNegocio]       = useState(perfil?.negocios || null);
  const [promos, setPromos]         = useState([]);
  const [alianzas, setAlianzas]     = useState([]);
  const [ordenes, setOrdenes]       = useState([]);
  const [saldoTokens, setSaldoTokens] = useState(0);
  const [showComprar, setShowComprar] = useState(false);
  const [consultas, setConsultas]   = useState([]);
  const [visitas, setVisitas]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState(null);

  useEffect(() => { cargarTodo(); }, []);

  async function cargarTodo() {
    if (!perfil?.negocio_id) { setLoading(false); return; }
    setLoading(true);
    if (!negocio) {
      const { data } = await supabase.from('negocios').select('*').eq('id', perfil.negocio_id).single();
      if (data) setNegocio(data);
    }
    const [proRes, conRes, visRes, aliRes, ordRes, saldoRes] = await Promise.all([
      supabase.from('promociones').select('*').eq('negocio_id', perfil.negocio_id).order('creado_en', { ascending: false }),
      supabase.from('consultas').select('*').eq('negocio_id', perfil.negocio_id).order('creado_en', { ascending: false }),
      supabase.from('visitas').select('*').eq('negocio_id', perfil.negocio_id).order('fecha', { ascending: false }),
      supabase.from('alianzas').select('*, promociones(*, negocios(nombre, localidad, foto_perfil, imagen_url))').eq('negocio_id', perfil.negocio_id).eq('aprobada', true),
      getOrdenesPendientes(perfil.negocio_id),
      getSaldo(perfil.negocio_id),
    ]);
    if (proRes.data) setPromos(proRes.data);
    if (conRes.data) setConsultas(conRes.data);
    if (visRes.data) setVisitas(visRes.data);
    if (aliRes.data) setAlianzas(aliRes.data);
    setOrdenes(Array.isArray(ordRes) ? ordRes : []);
    setSaldoTokens(typeof saldoRes === 'number' ? saldoRes : 0);
    setLoading(false);
  }

  function showToast(msg, type = 'ok') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  const handleLogout = async () => { await supabase.auth.signOut(); window.location.reload(); };

  const sinNegocio = !perfil?.negocio_id;
  const pendienteAprobacion = negocio && !negocio.aprobado;

  const stats = {
    consultas:    consultas.filter(c => !c.leida).length,
    promos:       promos.filter(p => p.activa).length,
    totalVisitas: visitas.reduce((acc, v) => acc + (v.cantidad || 0), 0),
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:A.bg, fontFamily:A.font, color:A.ink }}>
      <Sidebar
        tab={tab} setTab={setTab} negocio={negocio} perfil={perfil}
        saldoTokens={saldoTokens} showComprar={showComprar} setShowComprar={setShowComprar}
        stats={stats} onVolver={onVolver} onGoHome={onGoHome} onLogout={handleLogout}
      />

      {/* Modal comprar tokens */}
      {showComprar && negocio && (
        <ComprarTokensModal
          negocioId={negocio.id}
          saldoActual={saldoTokens}
          onClose={() => setShowComprar(false)}
          onCompraExitosa={(cantidad) => {
            setSaldoTokens(s => s + cantidad);
            setShowComprar(false);
            showToast(`¡${cantidad} token${cantidad > 1 ? 's' : ''} acreditado${cantidad > 1 ? 's' : ''}!`);
          }}
        />
      )}

      <main style={{ flex:1, padding:'22px 28px' }}>
        {/* Toast */}
        {toast && (
          <div style={{
            position:'fixed', top:24, right:24, zIndex:50,
            display:'flex', alignItems:'center', gap:8, padding:'12px 20px', borderRadius:14,
            background: toast.type === 'error' ? '#C03030' : A.green,
            color:'#fff', fontFamily:A.font, fontWeight:600, fontSize:13, boxShadow:'0 8px 32px rgba(0,0,0,0.18)',
          }}>
            {toast.type === 'error' ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
            {toast.msg}
          </div>
        )}

        {/* Alerts */}
        {sinNegocio && (
          <div style={{ background:'#FFF7E5', border:`1px solid #FFC93C55`, borderRadius:14, padding:20, display:'flex', gap:14, marginBottom:20 }}>
            <AlertCircle size={20} color="#C28A1B" style={{ flexShrink:0, marginTop:2 }} />
            <div>
              <div style={{ fontFamily:A.font, fontWeight:700, color:'#C28A1B', marginBottom:4 }}>Tu cuenta no tiene un negocio asignado todavía</div>
              <div style={{ fontFamily:A.font, fontSize:13, color:'#C28A1B', opacity:0.8 }}>Contactá al administrador del portal para que vincule tu cuenta a tu negocio.</div>
            </div>
          </div>
        )}
        {pendienteAprobacion && (
          <div style={{ background:A.primarySoft, border:`1px solid ${A.primary}33`, borderRadius:14, padding:20, display:'flex', gap:14, marginBottom:20 }}>
            <Clock size={20} color={A.primary} style={{ flexShrink:0, marginTop:2 }} />
            <div>
              <div style={{ fontFamily:A.font, fontWeight:700, color:A.primary, marginBottom:4 }}>Tu negocio está pendiente de aprobación</div>
              <div style={{ fontFamily:A.font, fontSize:13, color:A.primary, opacity:0.8 }}>El equipo de gesell.ar va a revisarlo pronto. Te avisamos cuando esté publicado.</div>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom:22 }}>
          <h1 style={{ fontFamily:A.font, fontSize:28, fontWeight:700, margin:0, letterSpacing:'-0.025em' }}>
            {TABS.find(t => t.id === tab)?.label}
          </h1>
        </div>

        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:240, color:A.muted, fontFamily:A.font }}>Cargando...</div>
        ) : (
          <>
            {tab === 'resumen'   && <TabResumen stats={stats} negocio={negocio} consultas={consultas} promos={promos} setPromos={setPromos} showToast={showToast} alianzas={alianzas} ordenes={ordenes} />}
            {tab === 'negocio'   && <TabNegocio negocio={negocio} setNegocio={setNegocio} showToast={showToast} />}
            {tab === 'consultas' && <TabConsultas consultas={consultas} setConsultas={setConsultas} showToast={showToast} />}
            {tab === 'cuenta'    && <TabCuenta negocio={negocio} ordenes={ordenes} setOrdenes={setOrdenes} showToast={showToast} saldoTokens={saldoTokens} setSaldoTokens={setSaldoTokens} />}
            {tab === 'stats'     && <TabStats visitas={visitas} stats={stats} />}
          </>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB: OFERTAS (Resumen)
// ═══════════════════════════════════════════════════════════
function TabResumen({ stats, negocio, consultas, promos, setPromos, showToast, alianzas = [], ordenes = [] }) {
  const [ofertaEditando, setOfertaEditando] = useState(null);
  const [editandoPerfil, setEditandoPerfil] = useState(false);

  async function togglePromo(id, activa) {
    const update = activa ? { activa: false, motivo_inactiva: 'socio' } : { activa: true, motivo_inactiva: null };
    const { error } = await supabase.from('promociones').update(update).eq('id', id);
    if (error) return showToast('Error al actualizar', 'error');
    setPromos(prev => prev.map(p => p.id === id ? { ...p, ...update } : p));
    showToast(activa ? 'Oferta desactivada' : 'Oferta activada');
  }

  async function eliminarPromo(id) {
    const { error } = await supabase.from('promociones').delete().eq('id', id);
    if (error) return showToast('Error al eliminar', 'error');
    setPromos(prev => prev.filter(p => p.id !== id));
    showToast('Oferta eliminada');
  }

  const plan = negocio?.plan || 'free';

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

      {/* Banner negocio */}
      {negocio && (
        <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, padding:18, display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:52, height:52, borderRadius:12, overflow:'hidden', background:A.bg, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:700, color:A.muted }}>
            {negocio.foto_perfil ? <img src={negocio.foto_perfil} alt={negocio.nombre} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : negocio.imagen_url ? <img src={negocio.imagen_url} alt={negocio.nombre} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : negocio.nombre?.[0]}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:A.font, fontSize:15, fontWeight:700, color:A.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{negocio.nombre}</div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:3, flexWrap:'wrap' }}>
              <span style={{ fontFamily:A.font, fontSize:12, color:A.muted }}>{negocio.tipo} · {negocio.localidad}</span>
              <span style={{
                fontFamily:A.font, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:999,
                background: plan === 'black' ? A.navy : plan === 'plus' ? A.primarySoft : A.bg,
                color: plan === 'black' ? '#fff' : plan === 'plus' ? A.primary : A.muted,
              }}>Plan {plan.toUpperCase()}</span>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
            {negocio.aprobado && negocio.activo
              ? <span style={{ background:'#E8F5EC', color:A.green, fontFamily:A.font, fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:999 }}>✓ Publicado</span>
              : negocio.aprobado
              ? <span style={{ background:A.bg, color:A.muted, fontFamily:A.font, fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:999 }}>Inactivo</span>
              : <span style={{ background:'#FFF7E5', color:'#C28A1B', fontFamily:A.font, fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:999 }}>Pendiente</span>
            }
            <ABtn onClick={() => setEditandoPerfil(true)} style={{ fontSize:12, padding:'6px 10px' }}>
              <Pencil size={12} /> Editar perfil
            </ABtn>
          </div>
        </div>
      )}

      {/* Órdenes pendientes */}
      {ordenes.length > 0 && (
        <div style={{ background:'#FFF7E5', border:`1px solid #FFC93C55`, borderRadius:14, padding:18, display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:14 }}>
          <div>
            <div style={{ fontFamily:A.font, fontWeight:700, color:'#C28A1B', marginBottom:4 }}>
              {ordenes.length === 1 ? 'Tenés 1 crédito pendiente de pago' : `Tenés ${ordenes.length} créditos pendientes de pago`}
            </div>
            <div style={{ fontFamily:A.font, fontSize:13, color:'#C28A1B' }}>
              Total: ${(ordenes.reduce((acc, o) => acc + Number(o.monto) + Number(o.monto_iva), 0)).toLocaleString('es-AR')} IVA incluido
            </div>
          </div>
          <ABtn variant="primary" style={{ fontSize:13, flexShrink:0 }}>Pagar ahora</ABtn>
        </div>
      )}

      {/* Upgrade banners */}
      {plan === 'free' && (
        <div style={{ background:A.primary, borderRadius:14, padding:18, display:'flex', alignItems:'center', justifyContent:'space-between', gap:14 }}>
          <div>
            <div style={{ fontFamily:A.font, fontSize:15, fontWeight:700, color:'#fff', marginBottom:4 }}>¿Querés más visibilidad?</div>
            <div style={{ fontFamily:A.font, fontSize:13, color:'rgba(255,255,255,0.75)' }}>Con el plan PLUS publicás ofertas ilimitadas y solo pagás cuando te canjean.</div>
          </div>
          <button style={{ background:'#fff', color:A.primary, border:'none', borderRadius:10, padding:'9px 16px', fontFamily:A.font, fontWeight:700, fontSize:13, cursor:'pointer', flexShrink:0 }}>Ver planes →</button>
        </div>
      )}
      {plan === 'plus' && (
        <div style={{ background:A.navy, borderRadius:14, padding:18, display:'flex', alignItems:'center', justifyContent:'space-between', gap:14 }}>
          <div>
            <div style={{ fontFamily:A.font, fontSize:15, fontWeight:700, color:'#fff', marginBottom:4 }}>Pasá al plan BLACK</div>
            <div style={{ fontFamily:A.font, fontSize:13, color:'rgba(255,255,255,0.6)' }}>Incluí tu alojamiento en los destacados y ofrecé descuentos SIN CARGO.</div>
          </div>
          <button style={{ background:A.yellow, color:A.ink, border:'none', borderRadius:10, padding:'9px 16px', fontFamily:A.font, fontWeight:700, fontSize:13, cursor:'pointer', flexShrink:0 }}>Ver BLACK →</button>
        </div>
      )}

      {/* Perfil editor drawer */}
      {editandoPerfil && (
        <PerfilEditorDrawer
          negocio={negocio}
          onClose={() => setEditandoPerfil(false)}
          onSave={(updated) => { setEditandoPerfil(false); showToast('Perfil actualizado'); }}
        />
      )}

      {/* Oferta editor drawer */}
      {ofertaEditando !== null && (
        <OfertaEditorDrawer
          oferta={ofertaEditando?.id ? ofertaEditando : null}
          negocioId={negocio?.id}
          onClose={() => setOfertaEditando(null)}
          onSave={(result, esNueva) => {
            if (esNueva) setPromos(prev => [result, ...prev]);
            else setPromos(prev => prev.map(p => p.id === result.id ? result : p));
            setOfertaEditando(null);
            showToast(esNueva ? 'Oferta enviada para aprobación' : 'Cambios guardados');
          }}
        />
      )}

      {/* Título sección */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h2 style={{ fontFamily:A.font, fontSize:18, fontWeight:700, color:A.ink, margin:0 }}>Mis ofertas</h2>
        {consultas.filter(c => !c.leida).length > 0 && (
          <span style={{ background:'#FFF7E5', color:'#C28A1B', fontFamily:A.font, fontSize:12, fontWeight:700, padding:'4px 12px', borderRadius:999 }}>
            {consultas.filter(c => !c.leida).length} consultas sin leer
          </span>
        )}
      </div>

      {/* Grilla de ofertas */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14 }}>
        {/* Nueva oferta placeholder */}
        <button onClick={() => setOfertaEditando({})} style={{
          border:`2px dashed ${A.line}`, borderRadius:14, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', gap:12, background:'transparent',
          minHeight:320, cursor:'pointer', transition:'border-color .15s',
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = A.primary}
          onMouseLeave={e => e.currentTarget.style.borderColor = A.line}
        >
          <div style={{ width:52, height:52, borderRadius:'50%', background:A.bg, display:'grid', placeItems:'center' }}>
            <Plus size={24} color={A.muted} />
          </div>
          <span style={{ fontFamily:A.font, fontSize:13, fontWeight:600, color:A.muted }}>Nueva oferta</span>
        </button>

        {/* Fichas de ofertas */}
        {promos.map(p => (
          <div key={p.id} style={{
            background:'#fff', borderRadius:14, overflow:'hidden',
            border:`1px solid ${!p.aprobada ? '#FFC93C55' : A.line}`,
            display:'flex', flexDirection:'column',
            opacity: !p.aprobada ? 0.65 : !p.activa ? 0.5 : 1,
          }}>
            <div style={{ position:'relative', aspectRatio:'1', overflow:'hidden' }}>
              <img
                src={p.imagen_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80'}
                alt={p.titulo} style={{ width:'100%', height:'100%', objectFit:'cover', filter: !p.aprobada ? 'grayscale(1)' : 'none' }}
              />
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(11,16,32,0.8), rgba(11,16,32,0.2) 50%, transparent)' }} />
              {p.offer_type === 'Flash' && (
                <div style={{ position:'absolute', top:10, left:10, background:'#C03030', color:'#fff', fontSize:10, fontWeight:700, fontStyle:'italic', padding:'3px 8px', borderRadius:6 }}>⚡ FLASH</div>
              )}
              <div style={{ position:'absolute', top:10, right:10 }}>
                {!p.aprobada
                  ? <span style={{ background:A.yellow, color:A.ink, fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:6 }}>Pendiente</span>
                  : !p.activa
                  ? <span style={{ background:'#6B7280', color:'#fff', fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:6 }}>Inactiva</span>
                  : <span style={{ background:A.green, color:'#fff', fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:6 }}>Activa</span>
                }
              </div>
              <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'14px 14px 12px', textAlign:'center' }}>
                <div style={{ color:'#fff', fontSize:36, fontWeight:700, lineHeight:1, marginBottom:4, textShadow:'0 2px 8px rgba(0,0,0,0.4)' }}>{p.badge}</div>
                <div style={{ color:'rgba(255,255,255,0.8)', fontSize:11, lineHeight:1.3, fontWeight:500 }}>{p.titulo}</div>
              </div>
            </div>
            <div style={{ padding:'10px 12px', display:'flex', gap:8, borderTop:`1px solid ${A.line}` }}>
              <button onClick={() => setOfertaEditando(p)} style={{
                display:'flex', alignItems:'center', gap:5, background:A.bg, border:'none', borderRadius:8, padding:'7px 10px', fontFamily:A.font, fontSize:12, fontWeight:600, color:A.ink2, cursor:'pointer', flexShrink:0,
              }}>
                <Pencil size={11} /> Editar
              </button>
              <select onChange={e => {
                if (e.target.value === 'desactivar') togglePromo(p.id, true);
                if (e.target.value === 'activar')    togglePromo(p.id, false);
                if (e.target.value === 'eliminar')   eliminarPromo(p.id);
                e.target.value = '';
              }} defaultValue="" style={{ flex:1, fontSize:12, fontWeight:600, background:A.bg, border:`1px solid ${A.line}`, borderRadius:8, padding:'7px 8px', fontFamily:A.font, cursor:'pointer', color:A.ink2, outline:'none' }}>
                <option value="" disabled>Acciones...</option>
                {p.activa ? <option value="desactivar">⏸ Desactivar</option> : <option value="activar">▶ Activar</option>}
                <option value="eliminar" style={{ color:'#C03030' }}>✕ Eliminar</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {/* Alianzas */}
      {alianzas.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Star size={16} color={A.yellow} fill={A.yellow} />
            <h2 style={{ fontFamily:A.font, fontSize:16, fontWeight:700, color:A.ink, margin:0 }}>Beneficios exclusivos asignados</h2>
          </div>
          <div style={{ fontFamily:A.font, fontSize:13, color:A.muted, marginTop:-4 }}>Otros socios te asignaron beneficios especiales para tus huéspedes.</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14 }}>
            {alianzas.map(al => {
              const p = al.promociones;
              if (!p) return null;
              return (
                <div key={al.id} style={{ background:'#fff', border:`1px solid ${A.yellow}44`, borderRadius:14, overflow:'hidden', display:'flex', flexDirection:'column' }}>
                  <div style={{ position:'relative', aspectRatio:'1', overflow:'hidden' }}>
                    <img src={p.imagen_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80'} alt={p.titulo} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(11,16,32,0.8), transparent)' }} />
                    <div style={{ position:'absolute', top:10, left:10, background:A.yellow, color:A.ink, fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:6 }}>Alianza</div>
                    <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:12, textAlign:'center' }}>
                      <div style={{ color:'#fff', fontSize:28, fontWeight:700 }}>{p.badge}</div>
                      <div style={{ color:'rgba(255,255,255,0.8)', fontSize:10 }}>{p.titulo}</div>
                    </div>
                  </div>
                  <div style={{ padding:12 }}>
                    <div style={{ fontFamily:A.font, fontSize:12, fontWeight:700, color:A.ink }}>{p.negocios?.nombre}</div>
                    <div style={{ fontFamily:A.font, fontSize:11, color:A.muted }}>{p.negocios?.localidad}</div>
                    {al.descripcion && (
                      <div style={{ marginTop:8, background:'#FFF7E5', border:`1px solid ${A.yellow}44`, borderRadius:8, padding:'6px 10px' }}>
                        <div style={{ fontFamily:A.font, fontSize:11, fontWeight:600, color:'#C28A1B' }}>{al.descripcion}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Consultas recientes */}
      {consultas.length > 0 && (
        <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, overflow:'hidden' }}>
          <div style={{ padding:'16px 18px', borderBottom:`1px solid ${A.line}` }}>
            <h3 style={{ fontFamily:A.font, fontSize:15, fontWeight:700, color:A.ink, margin:0 }}>Consultas recientes</h3>
          </div>
          {consultas.slice(0, 3).map((c, i) => (
            <div key={c.id} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'14px 18px', borderTop: i > 0 ? `1px solid ${A.line}` : 'none', background: !c.leida ? A.primarySoft : 'transparent' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background: !c.leida ? A.primary : A.line, flexShrink:0, marginTop:6 }} />
              <div>
                <div style={{ fontFamily:A.font, fontSize:13, fontWeight:600, color:A.ink, marginBottom:2 }}>{c.nombre_visitante || 'Visitante'}</div>
                <div style={{ fontFamily:A.font, fontSize:12, color:A.muted }}>{c.mensaje}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB: MI NEGOCIO
// ═══════════════════════════════════════════════════════════
function TabNegocio({ negocio, setNegocio, showToast }) {
  const [form, setForm] = useState({
    nombre:      negocio?.nombre      || '',
    descripcion: negocio?.descripcion || '',
    precio:      negocio?.precio      || '',
    ubicacion:   negocio?.ubicacion   || '',
    imagen_url:  negocio?.imagen_url  || '',
  });
  const [saving, setSaving] = useState(false);
  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  async function guardar() {
    if (!negocio?.id) return showToast('Sin negocio asignado', 'error');
    setSaving(true);
    const { data, error } = await supabase.from('negocios').update({
      nombre:      form.nombre,
      descripcion: form.descripcion,
      precio:      form.precio ? Number(form.precio) : null,
      ubicacion:   form.ubicacion,
      imagen_url:  form.imagen_url,
    }).eq('id', negocio.id).select().single();
    if (error) showToast('Error al guardar', 'error');
    else { setNegocio(data); showToast('Cambios guardados correctamente'); }
    setSaving(false);
  }

  return (
    <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, padding:28, maxWidth:720 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
        {[
          { label:'Nombre del negocio', key:'nombre', placeholder:'Ej: Hotel Las Olas' },
          { label:'Ubicación / Zona', key:'ubicacion', placeholder:'Ej: Centro, Barrio Norte...' },
          { label:'Precio por noche (en pesos)', key:'precio', placeholder:'Ej: 85000', type:'number' },
          { label:'URL de imagen principal', key:'imagen_url', placeholder:'https://...' },
        ].map(f => (
          <div key={f.key}>
            <label style={{ display:'block', fontFamily:A.font, fontSize:11, fontWeight:700, color:A.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>{f.label}</label>
            <input type={f.type || 'text'} value={form[f.key]} onChange={set(f.key)} placeholder={f.placeholder} style={inputSt} />
          </div>
        ))}
        <div style={{ gridColumn:'1 / -1' }}>
          <label style={{ display:'block', fontFamily:A.font, fontSize:11, fontWeight:700, color:A.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Descripción</label>
          <textarea value={form.descripcion} onChange={set('descripcion')} placeholder="Contá todo sobre tu negocio..." rows={5}
            style={{ ...inputSt, resize:'none' }} />
        </div>
        {form.imagen_url && (
          <div style={{ gridColumn:'1 / -1' }}>
            <label style={{ display:'block', fontFamily:A.font, fontSize:11, fontWeight:700, color:A.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Vista previa</label>
            <div style={{ width:'100%', height:200, borderRadius:12, overflow:'hidden', background:A.bg }}>
              <img src={form.imagen_url} alt="Preview" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            </div>
          </div>
        )}
      </div>
      <div style={{ marginTop:24, display:'flex', justifyContent:'flex-end' }}>
        <ABtn onClick={guardar} variant="primary" disabled={saving} style={{ padding:'12px 24px', fontSize:14 }}>
          <Save size={16} /> {saving ? 'Guardando...' : 'Guardar cambios'}
        </ABtn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB: CONSULTAS
// ═══════════════════════════════════════════════════════════
function TabConsultas({ consultas, setConsultas, showToast }) {
  async function marcarLeida(id) {
    const { error } = await supabase.from('consultas').update({ leida: true }).eq('id', id);
    if (error) return showToast('Error', 'error');
    setConsultas(prev => prev.map(c => c.id === id ? { ...c, leida: true } : c));
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {consultas.length === 0 ? (
        <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, padding:'48px 24px', textAlign:'center', color:A.muted, fontFamily:A.font }}>No recibiste consultas todavía</div>
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
              <div style={{ fontFamily:A.font, fontSize:11, color:A.muted }}>
                📅 {new Date(c.creado_en).toLocaleDateString('es-AR', { day:'2-digit', month:'long', year:'numeric' })}
              </div>
            </div>
            {!c.leida && (
              <ABtn onClick={() => marcarLeida(c.id)} variant="success" style={{ fontSize:12, padding:'6px 12px', flexShrink:0 }}>
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
//  TAB: CUENTA
// ═══════════════════════════════════════════════════════════
function TabCuenta({ negocio, ordenes, setOrdenes, showToast, saldoTokens, setSaldoTokens }) {
  const [historial, setHistorial]     = useState([]);
  const [compras, setCompras]         = useState([]);
  const [showComprar, setShowComprar] = useState(false);
  const [saldo, setSaldo]             = useState(saldoTokens || 0);

  const plan   = negocio?.plan || 'free';
  const esAloj = ['Hotel','Cabaña','Departamento','Domo','Dormi','Carpa'].includes(negocio?.tipo);

  const PLAN_INFO = {
    free:  { label:'FREE',  bg:A.bg, col:A.muted, desc:'Sin costo de membresía' },
    plus:  { label:'PLUS',  bg:A.primarySoft, col:A.primary, desc:'$220.000 / año' },
    black: { label:'BLACK', bg:A.navy, col:'#fff', desc:'$350.000 / año' },
  };

  useEffect(() => {
    async function cargar() {
      if (!negocio?.id) return;
      const [{ data: hist }, comprasData, saldoData] = await Promise.all([
        supabase.from('ordenes_cobro').select('*, promociones(titulo, badge, imagen_url)').eq('negocio_id', negocio.id).eq('estado', 'pagada').order('pagado_en', { ascending: false }),
        getComprasTokens(negocio.id),
        getSaldo(negocio.id),
      ]);
      setHistorial(hist || []);
      setCompras(comprasData);
      setSaldo(saldoData);
    }
    cargar();
  }, [negocio?.id]);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18, maxWidth:680 }}>
      {/* Plan */}
      <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, padding:24 }}>
        <h3 style={{ fontFamily:A.font, fontSize:16, fontWeight:700, color:A.ink, margin:'0 0 16px' }}>Tu plan actual</h3>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ background:PLAN_INFO[plan].bg, color:PLAN_INFO[plan].col, fontFamily:A.font, fontSize:13, fontWeight:700, padding:'7px 14px', borderRadius:10 }}>Plan {PLAN_INFO[plan].label}</span>
            <span style={{ fontFamily:A.font, fontSize:13, color:A.muted }}>{PLAN_INFO[plan].desc}</span>
          </div>
          {plan === 'free' && (
            <div style={{ background:A.primary, borderRadius:12, padding:14, maxWidth:200 }}>
              <div style={{ fontFamily:A.font, fontSize:13, fontWeight:700, color:'#fff', marginBottom:4 }}>Pasá a PLUS</div>
              <div style={{ fontFamily:A.font, fontSize:11, color:'rgba(255,255,255,0.7)', lineHeight:1.4, marginBottom:8 }}>Ofertas ilimitadas sin tokens. Solo pagás cuando te canjean.</div>
              <button style={{ background:'#fff', color:A.primary, border:'none', borderRadius:8, padding:'5px 12px', fontFamily:A.font, fontSize:11, fontWeight:700, cursor:'pointer' }}>Ver planes →</button>
            </div>
          )}
          {plan === 'plus' && (
            <div style={{ background:A.navy, borderRadius:12, padding:14, maxWidth:200 }}>
              <div style={{ fontFamily:A.font, fontSize:13, fontWeight:700, color:'#fff', marginBottom:4 }}>Pasá a BLACK</div>
              <div style={{ fontFamily:A.font, fontSize:11, color:'rgba(255,255,255,0.6)', lineHeight:1.4, marginBottom:8 }}>Destacados, difusión y 1 crédito cada 3 canjes.</div>
              <button style={{ background:A.yellow, color:A.ink, border:'none', borderRadius:8, padding:'5px 12px', fontFamily:A.font, fontSize:11, fontWeight:700, cursor:'pointer' }}>Ver BLACK →</button>
            </div>
          )}
        </div>
      </div>

      {/* Tokens — FREE alojamientos only */}
      {esAloj && plan === 'free' && (
        <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, padding:24 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <h3 style={{ fontFamily:A.font, fontSize:16, fontWeight:700, color:A.ink, margin:0 }}>Saldo de tokens</h3>
            <ABtn onClick={() => setShowComprar(true)} variant="primary">+ Comprar tokens</ABtn>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ fontFamily:A.font, fontSize:36, fontWeight:700, color:A.ink }}>🪙 {saldo}</div>
            <div style={{ fontFamily:A.font, fontSize:13, color:A.muted }}>
              {saldo === 0 ? 'No tenés tokens. Comprá para publicar ofertas.' : `Podés publicar ${saldo} oferta${saldo !== 1 ? 's' : ''} más.`}
            </div>
          </div>
          {compras.length > 0 && (
            <div style={{ marginTop:16, borderTop:`1px solid ${A.line}`, paddingTop:14 }}>
              <div style={{ fontFamily:A.font, fontSize:11, fontWeight:700, color:A.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Últimas compras</div>
              {compras.slice(0, 3).map(c => (
                <div key={c.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ fontFamily:A.font, fontSize:13, color:A.ink2 }}>🪙 {c.cantidad} tokens · {c.forma_pago}</span>
                  <span style={{ background: c.estado === 'pagada' ? '#E8F5EC' : '#FFF7E5', color: c.estado === 'pagada' ? A.green : '#C28A1B', fontFamily:A.font, fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:999 }}>{c.estado}</span>
                </div>
              ))}
            </div>
          )}
          {showComprar && (
            <ComprarTokensModal
              negocioId={negocio.id}
              saldoActual={saldo}
              onClose={() => setShowComprar(false)}
              onCompraExitosa={(cantidad) => {
                const nuevo = saldo + cantidad;
                setSaldo(nuevo);
                setSaldoTokens && setSaldoTokens(nuevo);
                setShowComprar(false);
                showToast(`¡${cantidad} token${cantidad > 1 ? 's' : ''} acreditado${cantidad > 1 ? 's' : ''}!`);
              }}
            />
          )}
        </div>
      )}

      {/* Órdenes pendientes */}
      {ordenes.length > 0 && (
        <div style={{ background:'#FFF7E5', border:`1px solid #FFC93C55`, borderRadius:14, padding:20 }}>
          <h3 style={{ fontFamily:A.font, fontSize:15, fontWeight:700, color:'#C28A1B', margin:'0 0 12px' }}>Cobros pendientes</h3>
          {ordenes.map(o => (
            <div key={o.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderTop:`1px solid #FFC93C33` }}>
              <div style={{ fontFamily:A.font, fontSize:13, color:'#C28A1B' }}>
                {o.tipo === 'publicacion' ? 'Publicación de oferta' : o.tipo === 'renovacion' ? 'Renovación (30 días)' : 'Canje de oferta'}
              </div>
              <div style={{ fontFamily:A.font, fontSize:13, fontWeight:700, color:'#C28A1B' }}>
                ${(Number(o.monto) + Number(o.monto_iva)).toLocaleString('es-AR')}
              </div>
            </div>
          ))}
          <div style={{ marginTop:14 }}>
            <ABtn variant="primary" style={{ fontSize:13 }}>Pagar ${ordenes.reduce((acc, o) => acc + Number(o.monto) + Number(o.monto_iva), 0).toLocaleString('es-AR')}</ABtn>
          </div>
        </div>
      )}

      {/* Historial */}
      {historial.length > 0 && (
        <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, overflow:'hidden' }}>
          <div style={{ padding:'16px 18px', borderBottom:`1px solid ${A.line}` }}>
            <h3 style={{ fontFamily:A.font, fontSize:15, fontWeight:700, color:A.ink, margin:0 }}>Historial de cobros</h3>
          </div>
          {historial.map((h, i) => (
            <div key={h.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 18px', borderTop: i > 0 ? `1px solid ${A.line}` : 'none' }}>
              <div style={{ fontFamily:A.font, fontSize:13, color:A.ink2 }}>{h.tipo} · {h.promociones?.titulo || '—'}</div>
              <div style={{ fontFamily:A.font, fontSize:13, fontWeight:700, color:A.green }}>
                ${(Number(h.monto) + Number(h.monto_iva)).toLocaleString('es-AR')} <span style={{ fontSize:10, fontWeight:400, color:A.muted }}>IVA incl.</span>
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
// ═══════════════════════════════════════════════════════════
function TabStats({ visitas, stats }) {
  const totalPorDia = visitas.slice(0, 14);
  const maximo = Math.max(...totalPorDia.map(v => v.cantidad || 0), 1);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14 }}>
        {[
          { label:'Visitas totales',   value: stats.totalVisitas, col:A.primary },
          { label:'Promos activas',    value: stats.promos,       col:A.green },
          { label:'Consultas sin leer', value: stats.consultas,  col:'#C28A1B' },
        ].map(s => (
          <div key={s.label} style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, padding:'24px 20px', textAlign:'center' }}>
            <div style={{ fontFamily:A.font, fontSize:40, fontWeight:700, color:s.col, marginBottom:4 }}>{s.value}</div>
            <div style={{ fontFamily:A.font, fontSize:13, color:A.muted }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:14, padding:24 }}>
        <h3 style={{ fontFamily:A.font, fontSize:15, fontWeight:700, color:A.ink, margin:'0 0 20px' }}>Visitas últimos 14 días</h3>
        {totalPorDia.length === 0 ? (
          <div style={{ textAlign:'center', color:A.muted, fontFamily:A.font, padding:'32px 0' }}>No hay datos de visitas todavía</div>
        ) : (
          <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:160 }}>
            {totalPorDia.map(v => {
              const pct = Math.round(((v.cantidad || 0) / maximo) * 100);
              return (
                <div key={v.fecha} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <div style={{ width:'100%', background:A.primary, borderRadius:'4px 4px 0 0', minHeight:4, height: `${Math.max(pct, 4)}%` }} />
                  <span style={{ fontFamily:A.font, fontSize:9, color:A.muted }}>{new Date(v.fecha).getDate()}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  DRAWER: EDICIÓN DE PERFIL DEL SOCIO
// ═══════════════════════════════════════════════════════════
function PerfilEditorDrawer({ negocio, onClose, onSave }) {
  const TIPOS = ['Hotel','Cabaña','Departamento','Domo','Dormi','Carpa','Restaurante','Bar','Café','Balneario','Pastelería','Gourmet','Experiencia'];
  const LOCALIDADES = ['Villa Gesell','Mar de las Pampas','Las Gaviotas','Mar Azul'];
  const ZONAS_PRESET = ['Centro','Zona norte','Zona sur','Línea de playa','A 100m de playa','Casco histórico','Barrio de los médanos','Bosque','Zona de hoteles','Zona residencial','Costa','Acceso principal','Otra...'];
  const TIPOS_ALOJ = ['Hotel','Cabaña','Departamento','Domo','Dormi','Carpa'];
  const esAlojamiento = TIPOS_ALOJ.includes(negocio?.tipo);

  const [form, setForm] = useState({
    nombre:      negocio?.nombre      || '',
    tipo:        negocio?.tipo        || 'Hotel',
    localidad:   negocio?.localidad   || 'Villa Gesell',
    zona:        negocio?.zona        || '',
    zonaCustom:  '',
    foto_perfil: negocio?.foto_perfil || '',
    imagen_url:  negocio?.imagen_url  || '',
    descripcion: negocio?.descripcion || '',
    precio_min:          negocio?.precio_min          || '',
    precio_min_especial: negocio?.precio_min_especial || '',
    unidad_precio:       negocio?.unidad_precio       || 'noche',
    pack_precio:         negocio?.pack_precio         || '',
    pack_noches:         negocio?.pack_noches         || '',
    pack_aclaracion:     negocio?.pack_aclaracion     || '',
    pack_aclaracion_custom: '',
  });
  const [saving, setSaving]             = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [uploadingImg, setUploadingImg]   = useState(false);
  const [passForm, setPassForm]           = useState({ nueva: '', confirma: '' });
  const [savingPass, setSavingPass]       = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const zonaEsCustom = form.zona === 'Otra...' || (form.zona && !ZONAS_PRESET.slice(0, -1).includes(form.zona));

  async function subirFoto(file, campo) {
    if (campo === 'foto_perfil') setUploadingFoto(true); else setUploadingImg(true);
    const ext  = file.name.split('.').pop();
    const path = `${negocio.id}/${campo}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('avatares').upload(path, file, { upsert: true });
    if (!error) {
      const { data: urlData } = supabase.storage.from('avatares').getPublicUrl(path);
      setForm(f => ({ ...f, [campo]: urlData.publicUrl }));
    }
    if (campo === 'foto_perfil') setUploadingFoto(false); else setUploadingImg(false);
  }

  async function guardar() {
    setSaving(true);
    const zonaFinal = form.zona === 'Otra...' ? form.zonaCustom : form.zona;
    const { data, error } = await supabase.from('negocios').update({
      nombre:      form.nombre,
      tipo:        form.tipo,
      localidad:   form.localidad,
      zona:        zonaFinal,
      foto_perfil: form.foto_perfil,
      imagen_url:  form.imagen_url,
      descripcion: form.descripcion,
      ...(esAlojamiento ? {
        precio_min:          form.precio_min          ? Number(form.precio_min)          : null,
        precio_min_especial: form.precio_min_especial ? Number(form.precio_min_especial) : null,
        unidad_precio:       form.unidad_precio       || 'noche',
        pack_precio:         form.pack_precio         ? Number(form.pack_precio)         : null,
        pack_noches:         form.pack_noches         ? Number(form.pack_noches)         : null,
        pack_aclaracion:     form.pack_aclaracion === 'Personalizado...'
                               ? form.pack_aclaracion_custom
                               : (form.pack_aclaracion || null),
      } : {}),
    }).eq('id', negocio.id).select().single();
    setSaving(false);
    if (!error) onSave(data);
  }

  async function cambiarPassword() {
    if (passForm.nueva.length < 6 || passForm.nueva !== passForm.confirma) return;
    setSavingPass(true);
    await supabase.auth.updateUser({ password: passForm.nueva });
    setSavingPass(false);
    setPassForm({ nueva: '', confirma: '' });
  }

  const labelSt = { display:'block', fontFamily:A.font, fontSize:11, fontWeight:700, color:A.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 };

  return (
    <>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)', zIndex:40 }} onClick={onClose} />
      <div style={{ position:'fixed', right:0, top:0, height:'100%', width:'100%', maxWidth:440, background:'#fff', zIndex:50, display:'flex', flexDirection:'column', boxShadow:'-8px 0 40px rgba(0,0,0,0.15)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:`1px solid ${A.line}`, flexShrink:0 }}>
          <div>
            <h2 style={{ fontFamily:A.font, fontSize:18, fontWeight:700, color:A.ink, margin:0 }}>Mi perfil</h2>
            <div style={{ fontFamily:A.font, fontSize:12, color:A.muted, marginTop:3 }}>Los cambios se reflejan en el catálogo</div>
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', cursor:'pointer', color:A.muted, padding:4 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'24px', display:'flex', flexDirection:'column', gap:18 }}>
          {/* Foto perfil */}
          <div>
            <label style={labelSt}>Foto de perfil</label>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:72, height:72, borderRadius:'50%', overflow:'hidden', background:A.bg, border:`2px dashed ${A.line}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {form.foto_perfil ? <img src={form.foto_perfil} alt="perfil" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <Plus size={22} color={A.muted} />}
              </div>
              <div style={{ flex:1 }}>
                <label style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:A.bg, border:`1px solid ${A.line}`, borderRadius:10, padding:'8px 12px', fontFamily:A.font, fontSize:12, fontWeight:600, color:A.ink2, cursor:'pointer', marginBottom:8 }}>
                  <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => e.target.files?.[0] && subirFoto(e.target.files[0], 'foto_perfil')} />
                  {uploadingFoto ? 'Subiendo...' : '📁 Subir foto'}
                </label>
                <input value={form.foto_perfil} onChange={set('foto_perfil')} placeholder="O pegá una URL..." style={{ ...inputSt, fontSize:12, padding:'7px 10px' }} />
              </div>
            </div>
          </div>

          {/* Imagen principal */}
          <div>
            <label style={labelSt}>Imagen principal</label>
            {form.imagen_url && (
              <div style={{ width:'100%', aspectRatio:'16/9', borderRadius:10, overflow:'hidden', border:`1px solid ${A.line}`, marginBottom:8 }}>
                <img src={form.imagen_url} alt="principal" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
            )}
            <label style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:A.bg, border:`1px solid ${A.line}`, borderRadius:10, padding:'8px 12px', fontFamily:A.font, fontSize:12, fontWeight:600, color:A.ink2, cursor:'pointer', marginBottom:8 }}>
              <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => e.target.files?.[0] && subirFoto(e.target.files[0], 'imagen_url')} />
              {uploadingImg ? 'Subiendo...' : '📁 Subir imagen'}
            </label>
            <input value={form.imagen_url} onChange={set('imagen_url')} placeholder="O pegá una URL..." style={inputSt} />
          </div>

          {/* Nombre */}
          <div>
            <label style={labelSt}>Nombre del negocio</label>
            <input value={form.nombre} onChange={set('nombre')} style={inputSt} />
          </div>

          {/* Tipo y localidad */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={labelSt}>Tipo</label>
              <select value={form.tipo} onChange={set('tipo')} style={{ ...inputSt, cursor:'pointer' }}>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelSt}>Localidad</label>
              <select value={form.localidad} onChange={set('localidad')} style={{ ...inputSt, cursor:'pointer' }}>
                {LOCALIDADES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Zona */}
          <div>
            <label style={labelSt}>Zona</label>
            <select value={zonaEsCustom ? 'Otra...' : (form.zona || '')} onChange={e => {
              if (e.target.value === 'Otra...') setForm(f => ({ ...f, zona: 'Otra...' }));
              else setForm(f => ({ ...f, zona: e.target.value, zonaCustom: '' }));
            }} style={{ ...inputSt, cursor:'pointer' }}>
              <option value="">Sin zona específica</option>
              {ZONAS_PRESET.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
            {zonaEsCustom && (
              <input value={form.zonaCustom || (zonaEsCustom && form.zona !== 'Otra...' ? form.zona : '')}
                onChange={e => setForm(f => ({ ...f, zonaCustom: e.target.value }))}
                placeholder="Escribí la zona..." style={{ ...inputSt, marginTop:8 }} />
            )}
          </div>

          {/* Descripción */}
          <div>
            <label style={labelSt}>Descripción</label>
            <textarea value={form.descripcion} onChange={set('descripcion')} rows={3}
              placeholder="Describí tu negocio en pocas palabras..." style={{ ...inputSt, resize:'none' }} />
          </div>

          {/* Tarifas — solo alojamientos */}
          {esAlojamiento && (() => {
            const unidad = form.unidad_precio || 'noche';
            const unidadLabel = unidad === 'huesped' ? 'por huésped' : 'por noche';
            const fmtNum = v => v ? Number(v).toLocaleString('es-AR') : null;
            const aclaracionOpciones = [
              '', 'Entre lunes y jueves', 'De domingo a jueves', 'Solo temporada baja',
              'Noches consecutivas', 'Válido de lunes a viernes', 'Con desayuno incluido',
              'Para familias', 'Solo para parejas', 'Personalizado...',
            ];
            const packAclaracionFinal = form.pack_aclaracion === 'Personalizado...'
              ? form.pack_aclaracion_custom
              : form.pack_aclaracion;

            return (
              <div style={{ display:'flex', flexDirection:'column', gap:16, borderTop:`1px solid ${A.line}`, paddingTop:18 }}>
                <h4 style={{ fontFamily:A.font, fontSize:14, fontWeight:700, color:A.ink, margin:0 }}>Tarifas <span style={{ fontSize:12, fontWeight:400, color:A.muted }}>(opcional)</span></h4>

                {/* Unidad */}
                <div>
                  <label style={labelSt}>Unidad de precio</label>
                  <div style={{ display:'flex', gap:8 }}>
                    {[['noche','Por noche, la unidad'],['huesped','Por huésped']].map(([val, lbl]) => (
                      <button key={val} type="button"
                        onClick={() => setForm(f => ({ ...f, unidad_precio: val }))}
                        style={{ flex:1, padding:'9px 0', borderRadius:10, border:`1.5px solid ${unidad === val ? A.primary : A.line}`, background: unidad === val ? A.primarySoft : '#fff', fontFamily:A.font, fontSize:12, fontWeight:600, color: unidad === val ? A.primary : A.ink2, cursor:'pointer' }}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tarifa común */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <label style={labelSt}>Tarifa común</label>
                    <input type="number" value={form.precio_min} onChange={set('precio_min')} placeholder="Ej: 85000" style={inputSt} />
                  </div>
                  <div>
                    <label style={labelSt}>Tarifa especial</label>
                    <input type="number" value={form.precio_min_especial} onChange={set('precio_min_especial')} placeholder="Feriados, etc." style={inputSt} />
                  </div>
                </div>

                {/* Pack */}
                <div style={{ background:A.bg, borderRadius:12, padding:'14px', display:'flex', flexDirection:'column', gap:10 }}>
                  <p style={{ fontFamily:A.font, fontSize:12, fontWeight:700, color:A.ink, margin:0 }}>Pack (opcional)</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <div>
                      <label style={labelSt}>Noches del pack</label>
                      <select value={form.pack_noches} onChange={set('pack_noches')} style={{ ...inputSt, cursor:'pointer' }}>
                        <option value="">— sin pack —</option>
                        {[2,3,4,5,7,10,14].map(n => <option key={n} value={n}>{n} noches</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelSt}>Precio del pack</label>
                      <input type="number" value={form.pack_precio} onChange={set('pack_precio')} placeholder="Ej: 220000" style={inputSt} disabled={!form.pack_noches} />
                    </div>
                  </div>
                  {form.pack_noches && (
                    <div>
                      <label style={labelSt}>Aclaración</label>
                      <select value={form.pack_aclaracion} onChange={set('pack_aclaracion')} style={{ ...inputSt, cursor:'pointer' }}>
                        {aclaracionOpciones.map(o => <option key={o} value={o}>{o || '— sin aclaración —'}</option>)}
                      </select>
                      {form.pack_aclaracion === 'Personalizado...' && (
                        <input value={form.pack_aclaracion_custom} onChange={set('pack_aclaracion_custom')} placeholder="Escribí la aclaración..." style={{ ...inputSt, marginTop:8 }} />
                      )}
                    </div>
                  )}
                </div>

                {/* Preview */}
                {(form.precio_min || form.precio_min_especial || form.pack_precio) && (
                  <div>
                    <label style={{ ...labelSt, color: A.primary }}>Vista previa</label>
                    <div style={{ background:A.bg, borderRadius:14, padding:'16px 18px', border:`1px solid ${A.line}` }}>
                      <p style={{ fontFamily:A.font, fontSize:10, fontWeight:700, color:A.muted, letterSpacing:'0.09em', textTransform:'uppercase', margin:'0 0 14px' }}>
                        Precios promedio
                      </p>
                      {form.precio_min && (
                        <div>
                          <span style={{ fontFamily:A.font, fontSize:10, fontWeight:600, color:A.muted, textTransform:'uppercase', letterSpacing:'0.05em' }}>Tarifa común</span>
                          <div style={{ display:'flex', alignItems:'baseline', gap:5, marginTop:2 }}>
                            <span style={{ fontFamily:A.font, fontSize:12, color:A.muted }}>Desde</span>
                            <span style={{ fontFamily:A.font, fontSize:20, fontWeight:800, color:A.ink, letterSpacing:'-0.02em' }}>${fmtNum(form.precio_min)}</span>
                            <span style={{ fontFamily:A.font, fontSize:13, fontWeight:700, color:A.ink2 }}>{unidad === 'huesped' ? 'por huésped' : 'por noche'}</span>
                          </div>
                        </div>
                      )}
                      {form.precio_min_especial && (
                        <>
                          <div style={{ height:1, background:A.line, margin:'10px 0' }} />
                          <div>
                            <span style={{ fontFamily:A.font, fontSize:10, fontWeight:600, color:A.muted, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                              Tarifa especial <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>(feriados, etc.)</span>
                            </span>
                            <div style={{ display:'flex', alignItems:'baseline', gap:5, marginTop:2 }}>
                              <span style={{ fontFamily:A.font, fontSize:12, color:A.muted }}>Desde</span>
                              <span style={{ fontFamily:A.font, fontSize:20, fontWeight:800, color:A.ink, letterSpacing:'-0.02em' }}>${fmtNum(form.precio_min_especial)}</span>
                              <span style={{ fontFamily:A.font, fontSize:13, fontWeight:700, color:A.ink2 }}>{unidad === 'huesped' ? 'por huésped' : 'por noche'}</span>
                            </div>
                          </div>
                        </>
                      )}
                      {form.pack_precio && form.pack_noches && (
                        <>
                          <div style={{ height:1, background:A.line, margin:'10px 0' }} />
                          <div>
                            <span style={{ fontFamily:A.font, fontSize:10, fontWeight:600, color:A.muted, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                              Pack {form.pack_noches} noches
                              {packAclaracionFinal && <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}> · {packAclaracionFinal}</span>}
                            </span>
                            <div style={{ display:'flex', alignItems:'baseline', gap:5, marginTop:2 }}>
                              <span style={{ fontFamily:A.font, fontSize:12, color:A.muted }}>Desde</span>
                              <span style={{ fontFamily:A.font, fontSize:20, fontWeight:800, color:A.ink, letterSpacing:'-0.02em' }}>${fmtNum(form.pack_precio)}</span>
                              <span style={{ fontFamily:A.font, fontSize:12, color:A.muted }}>el pack</span>
                            </div>
                          </div>
                        </>
                      )}
                      <p style={{ fontFamily:A.font, fontSize:11, color:A.muted, margin:'12px 0 0', lineHeight:1.45 }}>
                        Precios referenciales mínimos. Consultá disponibilidad y tarifas exactas con el alojamiento.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Cambiar contraseña */}
          <div style={{ borderTop:`1px solid ${A.line}`, paddingTop:18 }}>
            <h4 style={{ fontFamily:A.font, fontSize:14, fontWeight:700, color:A.ink, margin:'0 0 12px' }}>Cambiar contraseña</h4>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div>
                <label style={labelSt}>Nueva contraseña</label>
                <input type="password" value={passForm.nueva} onChange={e => setPassForm(f => ({ ...f, nueva: e.target.value }))} placeholder="Mínimo 6 caracteres" style={inputSt} />
              </div>
              <div>
                <label style={labelSt}>Confirmar contraseña</label>
                <input type="password" value={passForm.confirma} onChange={e => setPassForm(f => ({ ...f, confirma: e.target.value }))} placeholder="Repetí la nueva contraseña" style={inputSt} />
              </div>
              <ABtn onClick={cambiarPassword} variant="dark" disabled={savingPass || !passForm.nueva || passForm.nueva !== passForm.confirma}>
                {savingPass ? 'Guardando...' : 'Cambiar contraseña'}
              </ABtn>
            </div>
          </div>
        </div>

        <div style={{ padding:'16px 24px', borderTop:`1px solid ${A.line}`, display:'flex', gap:10, flexShrink:0 }}>
          <button onClick={onClose} style={{ flex:1, padding:'12px 0', background:A.bg, border:'none', borderRadius:10, fontFamily:A.font, fontSize:13, fontWeight:600, color:A.ink2, cursor:'pointer' }}>Cancelar</button>
          <ABtn onClick={guardar} variant="primary" disabled={saving} style={{ flex:1, justifyContent:'center', padding:'12px 0', fontSize:13 }}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </ABtn>
        </div>
      </div>
    </>
  );
}
