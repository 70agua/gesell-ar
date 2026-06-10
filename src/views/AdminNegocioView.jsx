// ============================================================
//  src/views/AdminNegocioView.jsx  —  Host Dashboard v2
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, MessageSquare, Bell, Tag, Building2, CreditCard, Puzzle,
  LogOut, ArrowLeft, TrendingUp, Eye, MousePointerClick, Users, ChevronRight,
  Plus, X, Save, ToggleLeft, ToggleRight, Send, Check, Archive,
  Clock, Star, Trash2, Upload, Image, AlertCircle, CheckCircle2, Zap, Crown,
  Store, Coins, ShoppingBag, Utensils, Map, Smartphone, Globe, Calendar, Gift,
  MessageCircle, ChevronDown, Edit2, RefreshCw, Package, BarChart2, Home, Search,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getOrdenesPendientes, getSaldo, debeUsarTokens } from '../lib/cobros';
import ComprarTokensModal from '../components/ComprarTokensModal';
import OfertaEditorDrawer from '../components/OfertaEditorDrawer';
import LoadingScreen from '../components/LoadingScreen';

// ─── Design tokens ───────────────────────────────────────────
const P = '#475be1';   // primary blue
const PD = '#3347c8';  // primary dark
const PS = '#eef0fd';  // primary soft
const INK = '#0f172a';
const INK2 = '#475569';
const MUTED = '#94a3b8';
const LINE = '#e2e8f0';
const BG = '#f8fafc';
const CARD = '#ffffff';
const NAVY = '#0f172a';
const GREEN = '#10b981';
const GREENS = '#ecfdf5';
const YELLOW = '#f59e0b';
const FONT = "'Inter', system-ui, sans-serif";

// ─── CreditCoin ───────────────────────────────────────────────
function CreditCoin({ size = 22 }) {
  return <img src="/cuponera-coin.svg" alt="crédito" style={{ width: size, height: size, display:'inline-block', verticalAlign:'middle', flexShrink:0 }}/>;
}

// ─── Tabs config ─────────────────────────────────────────────
const TABS = [
  { id: 'cuenta',     label: 'Cuenta',         Icon: CreditCard      },
  { id: 'ofertas',    label: 'Ofertas',        Icon: Tag             },
  { id: 'inbox',      label: 'Consultas',      Icon: MessageSquare   },
  { id: 'notif',      label: 'Notificaciones', Icon: Bell            },
  { id: 'stats',      label: 'Estadísticas',   Icon: BarChart2       },
  { id: 'empresa',    label: 'Mi Empresa',     Icon: Building2       },
  { id: 'addons',     label: 'Add-ons',        Icon: Puzzle, separator: true },
];

// ─── Mock data ───────────────────────────────────────────────
const MOCK_CHATS = [
  { id: 1, nombre: 'Valentina R.', avatar: 'V', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face', msg: '¿Tienen habitaciones disponibles para el fin de semana del 20?', time: '10:32', labelId: 'pendiente', unread: 2, msgs: [
    { from: 'turista', text: '¿Tienen habitaciones disponibles para el fin de semana del 20?', time: '10:32' },
  ]},
  { id: 2, nombre: 'Lucas M.', avatar: 'L', avatarUrl: null, msg: 'Perfecto, reservamos para 4 personas.', time: 'Ayer', labelId: 'confirmado', unread: 0, msgs: [
    { from: 'turista', text: '¿Cuál es el precio por noche para una triple?', time: 'Ayer 09:10' },
    { from: 'socio',   text: 'Hola Lucas, la triple está a $45.000 por noche.', time: 'Ayer 09:45' },
    { from: 'turista', text: 'Perfecto, reservamos para 4 personas.', time: 'Ayer 10:12' },
  ]},
  { id: 3, nombre: 'Florencia G.', avatar: 'F', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face', msg: '¿El desayuno está incluido?', time: 'Lun', labelId: 'interesado', unread: 1, msgs: [
    { from: 'turista', text: '¿El desayuno está incluido?', time: 'Lun 14:00' },
  ]},
  { id: 4, nombre: 'Matías P.', avatar: 'M', avatarUrl: null, msg: '¿Aceptan mascotas pequeñas?', time: 'Dom', labelId: 'pendiente', unread: 1, msgs: [
    { from: 'turista', text: '¿Aceptan mascotas pequeñas?', time: 'Dom 17:45' },
  ]},
];

const MOCK_NOTIFS = [
  { id: 1, tipo: 'propia', icon: ShoppingBag, color: GREEN, title: 'Cupón propio canjeado', desc: 'Un turista descargó tu cupón "Escapada Romántica" (-15%).', time: 'Hace 5 min', creditos: 0 },
  { id: 2, tipo: 'tercero', icon: Utensils, color: YELLOW, title: 'Huésped generó créditos', desc: 'Tu huésped de hab. 104 adquirió cuponera de Churros El Topo. ¡+1 Crédito!', time: 'Hace 22 min', creditos: 1 },
  { id: 3, tipo: 'tercero', icon: Utensils, color: YELLOW, title: 'Huésped generó créditos', desc: 'Tu huésped adquirió cuponera de La Pescadería Gesell. ¡+1 Crédito!', time: 'Hace 1 h', creditos: 1 },
  { id: 4, tipo: 'propia', icon: ShoppingBag, color: GREEN, title: 'Cupón propio canjeado', desc: 'Un turista descargó tu pack "3 noches + excursión".', time: 'Ayer 18:40', creditos: 0 },
  { id: 5, tipo: 'tercero', icon: Map, color: YELLOW, title: 'Huésped generó créditos', desc: 'Tu huésped adquirió cuponera de Paseos en Cuatriciclo. ¡+1 Crédito!', time: 'Ayer 11:20', creditos: 1 },
];

const MOCK_OFERTAS = [
  { id: 1, titulo: 'Escapada Romántica -15%', desc: 'Descuento especial para parejas, incluye detalle de bienvenida.', descuento: 15, tipo: 'Descuento Directo', activa: true },
  { id: 2, titulo: 'Pack 3 Noches + Excursión', desc: 'Pack armado con traslado y entrada a Reserva Dunas.', descuento: 20, tipo: 'Pack Armado', activa: true },
  { id: 3, titulo: 'Tarifa Anticipada -10%', desc: 'Reserva con 30 días de anticipación y ahorrá.', descuento: 10, tipo: 'Descuento Directo', activa: false },
];

const MOCK_FOTOS = [
  { id: 1, src: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&q=80', alt: 'Fachada' },
  { id: 2, src: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300&q=80', alt: 'Habitación' },
  { id: 3, src: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=300&q=80', alt: 'Piscina' },
];

const MOCK_FACTURAS = [
  { fecha: 'Jun 2025', concepto: 'Abono PLUS mensual', monto: 20000, estado: 'Pagado' },
  { fecha: 'May 2025', concepto: 'Abono PLUS mensual', monto: 20000, estado: 'Pagado' },
  { fecha: 'Abr 2025', concepto: 'Abono PLUS mensual', monto: 20000, estado: 'Pagado' },
];

const ADDONS_CATALOG = [
  { id: 'rumrak',    titulo: 'Rumrak PMS/CRM', desc: 'Gestión hotelera integral: reservas, historial de huéspedes, ingresos/egresos exportable.', precio: 15000, Icon: BarChart2, color: P },
  { id: 'destaque',  titulo: 'Destaque Fin de Semana', desc: 'Resaltá tu hotel en los listados durante los días de recambio turístico.', precio: 5000, Icon: Star, color: YELLOW },
  { id: 'whatsapp',  titulo: 'WhatsApp Premium', desc: 'Enlace directo al celular desde la ficha pública, sin intermediarios.', precio: 3000, Icon: Smartphone, color: GREEN },
  { id: 'traductor', titulo: 'Traductor IA', desc: 'Traduce tu perfil y promociones al inglés y portugués automáticamente.', precio: 4000, Icon: Globe, color: '#8b5cf6' },
  { id: 'reservas',  titulo: 'Motor de Reservas Básico', desc: 'Calendario de reservas desde tu ficha de Cuponera.', precio: 8000, Icon: Calendar, color: '#0ea5e9' },
  { id: 'sms',       titulo: 'Alertas SMS Instantáneas', desc: 'Notificaciones de consultas directamente a tu celular.', precio: 2500, Icon: MessageCircle, color: '#ec4899' },
];

const DEFAULT_LABELS = [
  { id: 'pendiente',  label: 'Pendiente',  color: '#f59e0b' },
  { id: 'confirmado', label: 'Confirmado', color: GREEN },
  { id: 'interesado', label: 'Interesado', color: P },
];

// ─── Helpers UI ──────────────────────────────────────────────
const Card = React.forwardRef(function Card({ children, style = {} }, ref) {
  return <div ref={ref} style={{ background: CARD, borderRadius: 16, border: `1px solid ${LINE}`, padding: 20, ...style }}>{children}</div>;
});

function Pill({ label, color = P }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:700, background: color + '1a', color, fontFamily: FONT }}>
      {label}
    </span>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} style={{
      width: 44, height: 24, borderRadius: 99, border: 'none', cursor: 'pointer',
      background: on ? P : LINE, position:'relative', transition:'background 0.2s', flexShrink:0,
    }}>
      <span style={{
        position:'absolute', top: 3, left: on ? 22 : 3, width: 18, height: 18,
        borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)',
      }}/>
    </button>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{ position:'fixed', bottom:28, right:28, zIndex:9999, background: toast.type === 'ok' ? GREEN : '#ef4444', color:'#fff', padding:'12px 20px', borderRadius:12, fontFamily:FONT, fontSize:13, fontWeight:600, boxShadow:'0 4px 20px rgba(0,0,0,0.2)', display:'flex', alignItems:'center', gap:8 }}>
      {toast.type === 'ok' ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>} {toast.msg}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  TAB 1 — DASHBOARD ANALYTICS
// ════════════════════════════════════════════════════════════
const PERIODOS = [
  { val: 'diario',  label: 'Diario' },
  { val: '7d',      label: 'Últimos 7 días' },
  { val: 'mensual', label: 'Mensual' },
  { val: '30d',     label: 'Últimos 30 días' },
  { val: '3m',      label: 'Últimos 3 meses' },
  { val: '6m',      label: 'Últimos 6 meses' },
  { val: '12m',     label: 'Últimos 12 meses' },
  { val: 'custom',  label: 'Personalizado' },
];

function TabEstadisticas() {
  const [periodo, setPeriodo]       = useState('30d');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const kpis = [
    { label: 'Visitas a tu perfil',          value: 348, sub: '+12% vs período anterior', Icon: Eye,              color: P        },
    { label: 'Clicks en tus ofertas',         value: 127, sub: '+8% vs período anterior',  Icon: MousePointerClick, color: GREEN    },
    { label: 'Clicks en ofertas de socios',   value: 89,  sub: 'Generan créditos a tu favor', Icon: TrendingUp,   color: YELLOW   },
    { label: 'Consultas recibidas',           value: 14,  sub: '3 sin responder',           Icon: MessageSquare,   color: '#8b5cf6'},
    { label: 'Favoritos acumulados',          value: 52,  sub: 'Tu ficha guardada',          Icon: Star,            color: '#f43f5e'},
    { label: 'Tasa de conversión',            value: '3.7%', sub: 'Visitas → consulta',     Icon: BarChart2,       color: '#0ea5e9'},
  ];

  // Datos mock para gráficos
  const trafico  = [42,58,35,71,89,64,77,95,55,82,68,91,73,87,110,98,120,105,88,115,94,127,108,140,132,145,119,138];
  const maxT = Math.max(...trafico);
  const consultas = [2,5,3,7,4,6,8,5,9,7,11,8,10,14];
  const maxC = Math.max(...consultas);

  const topOfertas = [
    { nombre: 'Noche gratis en temporada baja', clicks: 47, conv: '18%' },
    { nombre: '2×1 en cena incluida',           clicks: 31, conv: '12%' },
    { nombre: 'Late check-out sin cargo',        clicks: 28, conv: '9%'  },
    { nombre: 'Upgrade de habitación',           clicks: 21, conv: '7%'  },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Header con selector de período */}
      <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        <h2 style={{ fontFamily:FONT, fontSize:20, fontWeight:700, color:INK, margin:0, marginRight:'auto' }}>Estadísticas</h2>
        <select value={periodo} onChange={e => setPeriodo(e.target.value)}
          style={{ padding:'7px 12px', borderRadius:10, border:`1px solid ${LINE}`, fontFamily:FONT, fontSize:13, color:INK, background:CARD, cursor:'pointer', outline:'none' }}
        >
          {PERIODOS.map(p => <option key={p.val} value={p.val}>{p.label}</option>)}
        </select>
        {periodo === 'custom' && (<>
          <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
            style={{ padding:'7px 10px', borderRadius:10, border:`1px solid ${LINE}`, fontFamily:FONT, fontSize:13, color:INK, outline:'none' }}/>
          <span style={{ fontFamily:FONT, fontSize:12, color:MUTED }}>hasta</span>
          <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
            style={{ padding:'7px 10px', borderRadius:10, border:`1px solid ${LINE}`, fontFamily:FONT, fontSize:13, color:INK, outline:'none' }}/>
        </>)}
      </div>

      {/* KPIs — 3 columnas × 2 filas */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
        {kpis.map(k => (
          <Card key={k.label} style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontFamily:FONT, fontSize:12, fontWeight:600, color:INK2 }}>{k.label}</span>
              <div style={{ width:34, height:34, borderRadius:10, background:k.color+'15', display:'grid', placeItems:'center' }}>
                <k.Icon size={17} color={k.color}/>
              </div>
            </div>
            <div style={{ fontFamily:FONT, fontSize:28, fontWeight:800, color:INK }}>{k.value}</div>
            <div style={{ fontFamily:FONT, fontSize:11, color:k.color, fontWeight:600 }}>{k.sub}</div>
          </Card>
        ))}
      </div>

      {/* Gráficos en 2 columnas */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:14 }}>

        {/* Tráfico — barras */}
        <Card>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ fontFamily:FONT, fontSize:14, fontWeight:700, color:INK }}>Visitas al perfil</div>
            <span style={{ fontFamily:FONT, fontSize:11, color:MUTED }}>Últimas 4 semanas</span>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:90 }}>
            {trafico.map((v,i) => (
              <div key={i} style={{ flex:1, background: i >= 24 ? P : `${P}30`, borderRadius:'3px 3px 0 0', height:`${(v/maxT)*100}%`, minWidth:4, transition:'height 0.3s' }}/>
            ))}
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontFamily:FONT, fontSize:10, color:MUTED }}>
            <span>Sem 1</span><span>Sem 2</span><span>Sem 3</span><span style={{ color:P, fontWeight:700 }}>Sem 4 (actual)</span>
          </div>
        </Card>

        {/* Consultas — barras verticales */}
        <Card>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ fontFamily:FONT, fontSize:14, fontWeight:700, color:INK }}>Consultas</div>
            <span style={{ fontFamily:FONT, fontSize:11, color:MUTED }}>14 días</span>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:5, height:90 }}>
            {consultas.map((v,i) => (
              <div key={i} style={{ flex:1, background: i >= 10 ? '#8b5cf6' : '#8b5cf620', borderRadius:'3px 3px 0 0', height:`${(v/maxC)*100}%`, minWidth:6 }}/>
            ))}
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontFamily:FONT, fontSize:10, color:MUTED }}>
            <span>Día 1</span><span>Día 14</span>
          </div>
        </Card>
      </div>

      {/* Top ofertas */}
      <Card>
        <div style={{ fontFamily:FONT, fontSize:14, fontWeight:700, color:INK, marginBottom:14 }}>Rendimiento de ofertas</div>
        <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
          {topOfertas.map((o, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 0', borderBottom: i < topOfertas.length-1 ? `1px solid ${BG}` : 'none' }}>
              <div style={{ width:26, height:26, borderRadius:8, background: i===0 ? `${YELLOW}25` : BG, display:'grid', placeItems:'center', flexShrink:0 }}>
                <span style={{ fontFamily:FONT, fontSize:12, fontWeight:800, color: i===0 ? YELLOW : MUTED }}>#{i+1}</span>
              </div>
              <div style={{ flex:1, fontFamily:FONT, fontSize:13, fontWeight:600, color:INK }}>{o.nombre}</div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily:FONT, fontSize:13, fontWeight:700, color:INK }}>{o.clicks} clicks</div>
                <div style={{ fontFamily:FONT, fontSize:11, color:GREEN, fontWeight:600 }}>conv. {o.conv}</div>
              </div>
              {/* Barra de progreso */}
              <div style={{ width:80, height:6, background:LINE, borderRadius:999, overflow:'hidden', flexShrink:0 }}>
                <div style={{ height:'100%', background:P, borderRadius:999, width:`${(o.clicks/topOfertas[0].clicks)*100}%` }}/>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Fuente de tráfico */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <Card>
          <div style={{ fontFamily:FONT, fontSize:14, fontWeight:700, color:INK, marginBottom:14 }}>Fuente de tráfico</div>
          {[
            { label:'Búsqueda directa', pct:42, color:P },
            { label:'Recomendación de otro alojamiento', pct:28, color:GREEN },
            { label:'Redes sociales', pct:18, color:YELLOW },
            { label:'Otros', pct:12, color:MUTED },
          ].map(s => (
            <div key={s.label} style={{ marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontFamily:FONT, fontSize:12, color:INK2 }}>{s.label}</span>
                <span style={{ fontFamily:FONT, fontSize:12, fontWeight:700, color:INK }}>{s.pct}%</span>
              </div>
              <div style={{ height:6, background:LINE, borderRadius:999, overflow:'hidden' }}>
                <div style={{ height:'100%', background:s.color, borderRadius:999, width:`${s.pct}%` }}/>
              </div>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ fontFamily:FONT, fontSize:14, fontWeight:700, color:INK, marginBottom:14 }}>Créditos ganados</div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:90, marginBottom:8 }}>
            {[1,2,1,3,2,4,3,5,4,6,5,7].map((v,i) => (
              <div key={i} style={{ flex:1, background: i >= 9 ? '#f9c829' : '#f9c82930', borderRadius:'3px 3px 0 0', height:`${(v/7)*100}%` }}/>
            ))}
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontFamily:FONT, fontSize:10, color:MUTED }}>
            <span>Hace 12 sem</span><span style={{ color:'#f9c829', fontWeight:700 }}>Últimas 3 sem</span>
          </div>
          <div style={{ marginTop:14, paddingTop:12, borderTop:`1px solid ${BG}`, display:'flex', alignItems:'center', gap:8 }}>
            <CreditCoin size={22}/>
            <div>
              <div style={{ fontFamily:FONT, fontSize:20, fontWeight:800, color:INK }}>+8 créditos</div>
              <div style={{ fontFamily:FONT, fontSize:11, color:GREEN, fontWeight:600 }}>este mes</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  TAB 2 — INBOX
// ════════════════════════════════════════════════════════════
// ── Avatar helper ────────────────────────────────────────────
function ChatAvatar({ chat, size = 40 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', overflow:'hidden', flexShrink:0, background:P, display:'grid', placeItems:'center' }}>
      {chat.avatarUrl
        ? <img src={chat.avatarUrl} alt={chat.nombre} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
        : <span style={{ color:'#fff', fontFamily:FONT, fontWeight:700, fontSize: Math.round(size*0.38) }}>{chat.avatar}</span>
      }
    </div>
  );
}

// ── Label pill ───────────────────────────────────────────────
function LabelPill({ label, color }) {
  if (!label) return null;
  return (
    <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:600, background:color+'20', color, fontFamily:FONT, border:`1px solid ${color}40` }}>
      {label}
    </span>
  );
}

function TabInbox() {
  const [chats, setChats]           = useState(MOCK_CHATS);
  const [active, setActive]         = useState(1);
  const [input, setInput]           = useState('');
  const [labels, setLabels]         = useState(DEFAULT_LABELS);
  const [search, setSearch]         = useState('');
  const [filterLabel, setFilterLabel] = useState(null);
  const [selected, setSelected]     = useState(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [showLabelMgr, setShowLabelMgr] = useState(false);
  const [newLabelText, setNewLabelText] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#8b5cf6');
  const [editingId, setEditingId]   = useState(null);
  const messagesEndRef = useRef(null);

  const chat = chats.find(c => c.id === active);

  const getLabel = id => labels.find(l => l.id === id);

  const visibleChats = chats.filter(c => {
    const matchSearch = !search || c.nombre.toLowerCase().includes(search.toLowerCase()) || c.msg.toLowerCase().includes(search.toLowerCase());
    const matchLabel  = !filterLabel || c.labelId === filterLabel;
    return matchSearch && matchLabel;
  });

  function sendMsg() {
    if (!input.trim()) return;
    setChats(prev => prev.map(c => c.id === active
      ? { ...c, msg: input, msgs: [...c.msgs, { from:'socio', text:input, time:'Ahora' }] }
      : c
    ));
    setInput('');
  }

  function setLabel(labelId) {
    setChats(prev => prev.map(c => c.id === active ? { ...c, labelId } : c));
  }

  function toggleSelect(id) {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  function deleteSelected() {
    setChats(prev => prev.filter(c => !selected.has(c.id)));
    if (selected.has(active)) setActive(chats.find(c => !selected.has(c.id))?.id || null);
    setSelected(new Set());
    setSelectMode(false);
  }

  function addLabel() {
    if (!newLabelText.trim()) return;
    const id = newLabelText.toLowerCase().replace(/\s+/g,'-') + '_' + Date.now();
    setLabels(prev => [...prev, { id, label: newLabelText.trim(), color: newLabelColor }]);
    setNewLabelText('');
  }

  function deleteLabel(id) {
    setLabels(prev => prev.filter(l => l.id !== id));
    setChats(prev => prev.map(c => c.labelId === id ? { ...c, labelId: null } : c));
  }

  function saveEditLabel(id, newText) {
    setLabels(prev => prev.map(l => l.id === id ? { ...l, label: newText } : l));
    setEditingId(null);
  }

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [chat?.msgs]);

  const LABEL_COLORS = ['#f59e0b','#10b981','#475be1','#ef4444','#8b5cf6','#0ea5e9','#ec4899','#64748b'];

  return (
    <div style={{ display:'flex', gap:0, height:'calc(100vh - 120px)', minHeight:500, borderRadius:16, border:`1px solid ${LINE}`, overflow:'hidden', background:CARD, position:'relative' }}>

      {/* ── Panel izquierdo ── */}
      <div style={{ width:300, minWidth:300, borderRight:`1px solid ${LINE}`, display:'flex', flexDirection:'column' }}>

        {/* Header tipo email */}
        <div style={{ padding:'10px 12px', borderBottom:`1px solid ${LINE}`, display:'flex', flexDirection:'column', gap:8 }}>
          {/* Fila 1: búsqueda */}
          <div style={{ display:'flex', alignItems:'center', gap:6, background:BG, borderRadius:9, padding:'6px 10px', border:`1px solid ${LINE}` }}>
            <Search size={13} color={MUTED}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar consultas..."
              style={{ flex:1, border:'none', background:'transparent', fontFamily:FONT, fontSize:12, color:INK, outline:'none' }}
            />
            {search && <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', padding:0, color:MUTED }}><X size={11}/></button>}
          </div>
          {/* Fila 2: acciones */}
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            {/* Filtro por etiqueta */}
            <select value={filterLabel || ''} onChange={e => setFilterLabel(e.target.value || null)}
              style={{ flex:1, padding:'5px 8px', borderRadius:8, border:`1px solid ${LINE}`, fontFamily:FONT, fontSize:12, color: filterLabel ? P : INK2, background:CARD, cursor:'pointer', outline:'none' }}
            >
              <option value=''>Todas las etiquetas</option>
              {labels.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
            {/* Selección múltiple */}
            <button onClick={() => { setSelectMode(s => !s); setSelected(new Set()); }}
              title={selectMode ? 'Cancelar selección' : 'Seleccionar'}
              style={{ width:30, height:30, borderRadius:8, border:`1px solid ${selectMode ? P : LINE}`, background: selectMode ? PS : 'transparent', cursor:'pointer', display:'grid', placeItems:'center', color: selectMode ? P : INK2 }}
            >
              <CheckCircle2 size={14}/>
            </button>
            {/* Eliminar seleccionados */}
            <button onClick={deleteSelected} disabled={selected.size === 0}
              title="Eliminar seleccionados"
              style={{ width:30, height:30, borderRadius:8, border:`1px solid ${selected.size > 0 ? '#ef4444' : LINE}`, background:'transparent', cursor: selected.size > 0 ? 'pointer' : 'default', display:'grid', placeItems:'center', color: selected.size > 0 ? '#ef4444' : MUTED, opacity: selected.size > 0 ? 1 : 0.4 }}
            >
              <Trash2 size={14}/>
            </button>
            {/* Gestionar etiquetas */}
            <button onClick={() => setShowLabelMgr(s => !s)}
              title="Gestionar etiquetas"
              style={{ width:30, height:30, borderRadius:8, border:`1px solid ${showLabelMgr ? P : LINE}`, background: showLabelMgr ? PS : 'transparent', cursor:'pointer', display:'grid', placeItems:'center', color: showLabelMgr ? P : INK2 }}
            >
              <Tag size={14}/>
            </button>
          </div>
        </div>

        {/* Lista de consultas */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {visibleChats.length === 0 && (
            <div style={{ padding:32, textAlign:'center', color:MUTED, fontFamily:FONT, fontSize:13 }}>Sin resultados</div>
          )}
          {visibleChats.map(c => {
            const lbl = getLabel(c.labelId);
            return (
              <button key={c.id} onClick={() => { setActive(c.id); if (selectMode) toggleSelect(c.id); }} style={{
                width:'100%', display:'flex', gap:10, padding:'12px 14px', border:'none', textAlign:'left',
                background: active === c.id ? PS : 'transparent', cursor:'pointer',
                borderBottom:`1px solid ${LINE}`, alignItems:'flex-start',
              }}>
                {/* Checkbox modo selección */}
                {selectMode && (
                  <div onClick={e => { e.stopPropagation(); toggleSelect(c.id); }}
                    style={{ width:16, height:16, borderRadius:4, border:`2px solid ${selected.has(c.id) ? P : LINE}`, background: selected.has(c.id) ? P : '#fff', display:'grid', placeItems:'center', flexShrink:0, marginTop:12, cursor:'pointer' }}
                  >
                    {selected.has(c.id) && <Check size={10} color="#fff"/>}
                  </div>
                )}
                <ChatAvatar chat={c} size={38}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontFamily:FONT, fontSize:13, fontWeight:700, color:INK }}>{c.nombre}</span>
                    <span style={{ fontFamily:FONT, fontSize:10, color:MUTED, flexShrink:0 }}>{c.time}</span>
                  </div>
                  <div style={{ fontFamily:FONT, fontSize:12, color:INK2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:2 }}>{c.msg}</div>
                  {lbl && <div style={{ marginTop:4 }}><LabelPill label={lbl.label} color={lbl.color}/></div>}
                </div>
                {c.unread > 0 && <span style={{ background:P, color:'#fff', fontSize:10, fontWeight:700, width:17, height:17, borderRadius:'50%', display:'grid', placeItems:'center', flexShrink:0 }}>{c.unread}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Panel derecho: chat ── */}
      {chat && (
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'12px 18px', borderBottom:`1px solid ${LINE}`, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <ChatAvatar chat={chat} size={36}/>
              <div>
                <div style={{ fontFamily:FONT, fontSize:14, fontWeight:700, color:INK }}>{chat.nombre}</div>
                {getLabel(chat.labelId) && <LabelPill label={getLabel(chat.labelId).label} color={getLabel(chat.labelId).color}/>}
              </div>
            </div>
            {/* Selector de etiqueta */}
            <select value={chat.labelId || ''} onChange={e => setLabel(e.target.value || null)}
              style={{ padding:'6px 10px', borderRadius:9, border:`1px solid ${LINE}`, fontFamily:FONT, fontSize:12, color:INK, background:CARD, cursor:'pointer', outline:'none' }}
            >
              <option value=''>Sin etiqueta</option>
              {labels.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
          </div>

          {/* Mensajes */}
          <div style={{ flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:12 }}>
            {chat.msgs.map((m,i) => (
              <div key={i} style={{ display:'flex', justifyContent: m.from === 'socio' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth:'70%', padding:'10px 14px',
                  borderRadius: m.from === 'socio' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: m.from === 'socio' ? P : BG,
                  color: m.from === 'socio' ? '#fff' : INK,
                  fontFamily:FONT, fontSize:13,
                }}>
                  <div>{m.text}</div>
                  <div style={{ fontSize:10, marginTop:4, color: m.from === 'socio' ? 'rgba(255,255,255,0.6)' : MUTED, textAlign:'right' }}>{m.time}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef}/>
          </div>

          {/* Input */}
          <div style={{ padding:'12px 18px', borderTop:`1px solid ${LINE}`, display:'flex', gap:10 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMsg()}
              placeholder="Escribí tu respuesta..."
              style={{ flex:1, padding:'10px 14px', borderRadius:12, border:`1px solid ${LINE}`, fontFamily:FONT, fontSize:13, outline:'none', color:INK }}
            />
            <button onClick={sendMsg} style={{ width:42, height:42, borderRadius:12, background:P, border:'none', cursor:'pointer', display:'grid', placeItems:'center' }}>
              <Send size={17} color="#fff"/>
            </button>
          </div>
        </div>
      )}

      {/* ── Drawer gestión de etiquetas ── */}
      {showLabelMgr && (
        <div style={{ position:'absolute', top:0, left:300, bottom:0, width:280, background:CARD, borderRight:`1px solid ${LINE}`, display:'flex', flexDirection:'column', zIndex:20, boxShadow:'4px 0 16px rgba(0,0,0,0.07)' }}>
          <div style={{ padding:'14px 16px', borderBottom:`1px solid ${LINE}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontFamily:FONT, fontSize:13, fontWeight:700, color:INK }}>Gestionar etiquetas</span>
            <button onClick={() => setShowLabelMgr(false)} style={{ background:'none', border:'none', cursor:'pointer', color:MUTED }}><X size={16}/></button>
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:8 }}>
            {labels.map(l => (
              <div key={l.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:10, border:`1px solid ${LINE}`, background:BG }}>
                <div style={{ width:12, height:12, borderRadius:'50%', background:l.color, flexShrink:0 }}/>
                {editingId === l.id
                  ? <input defaultValue={l.label} autoFocus onBlur={e => saveEditLabel(l.id, e.target.value)} onKeyDown={e => e.key === 'Enter' && saveEditLabel(l.id, e.target.value)}
                      style={{ flex:1, border:`1px solid ${P}`, borderRadius:6, padding:'3px 7px', fontFamily:FONT, fontSize:12, outline:'none' }}/>
                  : <span style={{ flex:1, fontFamily:FONT, fontSize:12, fontWeight:600, color:INK }}>{l.label}</span>
                }
                <button onClick={() => setEditingId(l.id)} style={{ background:'none', border:'none', cursor:'pointer', color:MUTED, padding:2 }}><Edit2 size={12}/></button>
                <button onClick={() => deleteLabel(l.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', padding:2 }}><Trash2 size={12}/></button>
              </div>
            ))}
          </div>
          {/* Agregar nueva etiqueta */}
          <div style={{ padding:'12px 14px', borderTop:`1px solid ${LINE}` }}>
            <div style={{ fontFamily:FONT, fontSize:11, fontWeight:600, color:MUTED, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em' }}>Nueva etiqueta</div>
            <input value={newLabelText} onChange={e => setNewLabelText(e.target.value)} placeholder="Nombre de la etiqueta"
              onKeyDown={e => e.key === 'Enter' && addLabel()}
              style={{ width:'100%', padding:'8px 10px', borderRadius:9, border:`1px solid ${LINE}`, fontFamily:FONT, fontSize:13, outline:'none', color:INK, marginBottom:8, boxSizing:'border-box' }}
            />
            <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
              {LABEL_COLORS.map(c => (
                <div key={c} onClick={() => setNewLabelColor(c)}
                  style={{ width:20, height:20, borderRadius:'50%', background:c, cursor:'pointer', border: newLabelColor === c ? `2px solid ${INK}` : '2px solid transparent' }}/>
              ))}
            </div>
            <button onClick={addLabel} style={{ width:'100%', padding:'8px', borderRadius:9, background:P, border:'none', color:'#fff', fontFamily:FONT, fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              <Plus size={14}/> Agregar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  TAB 3 — NOTIFICACIONES
// ════════════════════════════════════════════════════════════
function TabNotificaciones({ credits, setCredits }) {
  const [notifs, setNotifs] = useState(MOCK_NOTIFS);
  const [filter, setFilter] = useState('todas');

  function markRead(id) { setNotifs(prev => prev.filter(n => n.id !== id)); }

  const filtered = filter === 'todas' ? notifs
    : filter === 'propias' ? notifs.filter(n => n.tipo === 'propia')
    : notifs.filter(n => n.tipo === 'tercero');

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h2 style={{ fontFamily:FONT, fontSize:20, fontWeight:700, color:INK, margin:0 }}>Centro de Notificaciones</h2>
        <div style={{ display:'flex', alignItems:'center', gap:8, background:`${YELLOW}15`, border:`1px solid ${YELLOW}40`, borderRadius:12, padding:'8px 14px' }}>
          <CreditCoin size={20}/>
          <span style={{ fontFamily:FONT, fontWeight:700, fontSize:16, color:INK }}>{credits} créditos</span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8 }}>
        {['todas','propias','terceros'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding:'6px 16px', borderRadius:99, border:`1px solid ${filter===f ? P : LINE}`,
            background: filter===f ? PS : 'transparent', color: filter===f ? P : INK2,
            fontFamily:FONT, fontSize:12, fontWeight:600, cursor:'pointer', textTransform:'capitalize',
          }}>{f}</button>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card style={{ textAlign:'center', padding:40, color:MUTED }}>
          <Bell size={32} style={{ margin:'0 auto 10px', display:'block', opacity:0.3 }}/>
          <div style={{ fontFamily:FONT, fontSize:14 }}>Sin notificaciones</div>
        </Card>
      )}

      {filtered.map(n => (
        <Card key={n.id} style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
          <div style={{ width:44, height:44, borderRadius:12, background:n.color+'15', display:'grid', placeItems:'center', flexShrink:0 }}>
            <n.icon size={20} color={n.color}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ fontFamily:FONT, fontSize:13, fontWeight:700, color:INK }}>{n.title}</div>
              <span style={{ fontFamily:FONT, fontSize:11, color:MUTED, whiteSpace:'nowrap', marginLeft:12 }}>{n.time}</span>
            </div>
            <div style={{ fontFamily:FONT, fontSize:12, color:INK2, marginTop:4 }}>{n.desc}</div>
            {n.creditos > 0 && (
              <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:6 }}>
                <CreditCoin size={16}/>
                <span style={{ fontFamily:FONT, fontSize:12, fontWeight:700, color:YELLOW }}>+{n.creditos} Crédito acumulado</span>
              </div>
            )}
          </div>
          <button onClick={() => markRead(n.id)} style={{ background:'transparent', border:'none', cursor:'pointer', color:MUTED, padding:4 }}>
            <X size={16}/>
          </button>
        </Card>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  TAB 4 — MIS OFERTAS
// ════════════════════════════════════════════════════════════
const MOCK_OFERTAS_ASOCIADAS = [
  { id: 'as1', titulo: 'Cena para dos en La Parrilla del Puerto', tipo: 'Gastronomía', descuento: 20, socio: 'La Parrilla del Puerto', img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=220&fit=crop' },
  { id: 'as2', titulo: 'Alquiler de bicicletas — día completo', tipo: 'Actividades', descuento: 15, socio: 'BiciAventura', img: 'https://images.unsplash.com/photo-1558981033-0f0309284409?w=400&h=220&fit=crop' },
];

function TabOfertas({ dbPromos, negocioId, showToast }) {
  const [ofertas, setOfertas] = useState(dbPromos.length > 0 ? dbPromos.map(p => ({
    id: p.id, titulo: p.titulo || p.nombre, desc: p.descripcion || '', descuento: p.descuento || 0, tipo: p.tipo || 'Descuento Directo', activa: p.activo !== false,
    img: null,
  })) : MOCK_OFERTAS.map(o => ({ ...o, img: null })));
  const ofertasAsociadas = MOCK_OFERTAS_ASOCIADAS;
  const [vistaGrid, setVistaGrid] = useState(true);
  const [modal, setModal] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null); // id a eliminar
  const [form, setForm] = useState({ titulo:'', descuento:'', desc:'', tipo:'Descuento Directo' });

  function toggleActiva(id) {
    setOfertas(prev => prev.map(o => o.id === id ? { ...o, activa: !o.activa } : o));
    showToast('Estado actualizado', 'ok');
  }

  function eliminar(id) {
    setOfertas(prev => prev.filter(o => o.id !== id));
    setConfirmDel(null);
    showToast('Oferta eliminada', 'ok');
  }

  function addOferta() {
    if (!form.titulo) return;
    setOfertas(prev => [...prev, { id: Date.now(), titulo:form.titulo, desc:form.desc, descuento:Number(form.descuento)||0, tipo:form.tipo, activa:true, img:null }]);
    setModal(false);
    setForm({ titulo:'', descuento:'', desc:'', tipo:'Descuento Directo' });
    showToast('Oferta creada correctamente', 'ok');
  }

  // ── Card vista ficha (estilo home) ──
  const PLACEHOLDER_IMGS = [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=220&fit=crop',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=220&fit=crop',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=220&fit=crop',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=220&fit=crop',
  ];

  function OfertaCardGrid({ o, idx }) {
    const img = o.img || PLACEHOLDER_IMGS[idx % PLACEHOLDER_IMGS.length];
    const ahorro = o.descuento ? Math.round(o.descuento * 800) : 0;
    return (
      <div style={{ background:CARD, border:`1px solid ${LINE}`, borderRadius:20, overflow:'hidden', display:'flex', flexDirection:'column', fontFamily:FONT, transition:'box-shadow 0.2s,transform 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow='0 16px 48px -16px rgba(11,16,32,0.18)'; e.currentTarget.style.transform='translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='none'; }}
      >
        {/* Imagen */}
        <div style={{ position:'relative', height:160, overflow:'hidden' }}>
          <img src={img} alt={o.titulo} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(11,16,32,0.65) 0%, rgba(11,16,32,0.1) 50%, transparent 100%)' }}/>
          {/* Badge descuento */}
          <div style={{ position:'absolute', bottom:12, left:14, color:'#fff', fontSize:38, fontWeight:800, letterSpacing:'-0.025em', lineHeight:1 }}>
            −{o.descuento}%
          </div>
          {/* Badge activa/inactiva */}
          <div style={{ position:'absolute', top:10, left:10, background: o.activa ? 'rgba(16,185,129,0.85)' : 'rgba(100,116,139,0.7)', backdropFilter:'blur(4px)', color:'#fff', fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:999 }}>
            {o.activa ? 'Activa' : 'Inactiva'}
          </div>
        </div>
        {/* Body */}
        <div style={{ padding:'12px 14px 14px', flex:1, display:'flex', flexDirection:'column' }}>
          <div style={{ fontSize:11, color:MUTED, fontWeight:600, marginBottom:3 }}>{o.tipo}</div>
          <div style={{ fontSize:14, fontWeight:700, color:GREEN, lineHeight:1.3, flex:1 }}>{o.titulo}</div>
          {/* Toggle activa + botón Editar */}
          <div style={{ display:'flex', alignItems:'center', gap:7, margin:'10px 0 10px' }}>
            <Toggle on={o.activa} onChange={() => toggleActiva(o.id)}/>
            <span style={{ fontSize:11, fontWeight:600, color: o.activa ? GREEN : MUTED, flex:1 }}>{o.activa ? 'Activa' : 'Inactiva'}</span>
            <button title="Editar" onClick={e => e.stopPropagation()} style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:8, border:`1px solid ${LINE}`, background:CARD, color:INK2, fontFamily:FONT, fontSize:11, fontWeight:600, cursor:'pointer' }}>
              <Edit2 size={11}/> Editar
            </button>
          </div>
          {/* Cajita solo ahorro estimado */}
          {ahorro > 0 && (
            <div style={{ border:`1px solid ${LINE}`, borderRadius:10, overflow:'hidden' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px' }}>
                <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:MUTED }}>Ahorro estimado</span>
                <span style={{ fontSize:13, fontWeight:700, color:GREEN }}>~${ahorro.toLocaleString('es-AR')} aprox.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Fila vista lista ──
  function OfertaRowList({ o }) {
    return (
      <div style={{ background:CARD, border:`1px solid ${LINE}`, borderRadius:12, padding:'14px 16px', display:'flex', alignItems:'center', gap:14, fontFamily:FONT }}>
        {/* Color swatch con descuento */}
        <div style={{ width:48, height:48, borderRadius:12, background:PS, display:'grid', placeItems:'center', flexShrink:0 }}>
          <span style={{ fontSize:13, fontWeight:800, color:P }}>−{o.descuento}%</span>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:700, color:INK }}>{o.titulo}</div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:3 }}>
            <span style={{ fontSize:11, color:MUTED }}>{o.tipo}</span>
            {o.desc && <span style={{ fontSize:11, color:INK2 }}>· {o.desc}</span>}
          </div>
        </div>
        {/* Toggle activa */}
        <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
          <Toggle on={o.activa} onChange={() => toggleActiva(o.id)}/>
          <span style={{ fontSize:11, fontWeight:600, color: o.activa ? GREEN : MUTED, minWidth:44 }}>{o.activa ? 'Activa' : 'Inactiva'}</span>
        </div>
        {/* Acciones */}
        <div style={{ display:'flex', gap:6, flexShrink:0 }}>
          <button title="Editar" style={{ width:30, height:30, borderRadius:8, border:`1px solid ${LINE}`, background:'#fff', display:'grid', placeItems:'center', cursor:'pointer', color:INK2 }}>
            <Edit2 size={13}/>
          </button>
          <button title="Eliminar" onClick={() => setConfirmDel(o.id)} style={{ width:30, height:30, borderRadius:8, border:`1px solid #fecaca`, background:'#fff7f7', display:'grid', placeItems:'center', cursor:'pointer', color:'#ef4444' }}>
            <Trash2 size={13}/>
          </button>
        </div>
      </div>
    );
  }

  const IcoGrid = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
  const IcoList = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;

  // Barra de compartir el portal de beneficios asociados
  function ShareAsociadasBar() {
    const [email, setEmail] = React.useState('');
    const [sent, setSent] = React.useState(false);
    const portalUrl = `https://cuponera.ar/beneficios/${negocioId || 'mi-hotel'}`;

    function handleSendEmail(e) {
      e.preventDefault();
      if (!email) return;
      setSent(true);
      setTimeout(() => { setSent(false); setEmail(''); }, 2500);
    }

    function copyLink() {
      navigator.clipboard?.writeText(portalUrl);
      showToast('Link copiado', 'ok');
    }

    function sendWhatsapp() {
      const msg = encodeURIComponent(`¡Hola! Te comparto los beneficios exclusivos de nuestros socios: ${portalUrl}`);
      window.open(`https://wa.me/?text=${msg}`, '_blank');
    }

    return (
      <div style={{ background:PS, border:`1px solid #c7d0f8`, borderRadius:14, padding:'14px 16px', display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          <span style={{ fontFamily:FONT, fontSize:12, fontWeight:700, color:P }}>Enviá el portal de beneficios a tus huéspedes</span>
        </div>

        {/* Fila: campo email + botón enviar */}
        <form onSubmit={handleSendEmail} style={{ display:'flex', gap:8 }}>
          <input
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ flex:1, padding:'9px 13px', borderRadius:10, border:`1px solid #c7d0f8`, background:'#fff', fontFamily:FONT, fontSize:13, color:INK, outline:'none', minWidth:0 }}
          />
          <button type="submit" style={{ padding:'9px 16px', borderRadius:10, border:'none', background: sent ? GREEN : P, color:'#fff', fontFamily:FONT, fontSize:13, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', transition:'background 0.2s', display:'flex', alignItems:'center', gap:6 }}>
            {sent
              ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Enviado</>
              : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Enviar</>
            }
          </button>
        </form>

        {/* Botones secundarios */}
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={copyLink} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px 0', borderRadius:10, border:`1px solid #c7d0f8`, background:'#fff', fontFamily:FONT, fontSize:12, fontWeight:600, color:INK2, cursor:'pointer' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copiar link
          </button>
          <button onClick={sendWhatsapp} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px 0', borderRadius:10, border:`1px solid #c7d0f8`, background:'#fff', fontFamily:FONT, fontSize:12, fontWeight:600, color:'#16a34a', cursor:'pointer' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#16a34a"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
            WhatsApp
          </button>
        </div>
      </div>
    );
  }

  const SectionHeader = ({ title, subtitle }) => (
    <div style={{ marginTop:8, marginBottom:4 }}>
      <div style={{ fontFamily:FONT, fontSize:15, fontWeight:700, color:INK }}>{title}</div>
      {subtitle && <div style={{ fontFamily:FONT, fontSize:12, color:MUTED, marginTop:2 }}>{subtitle}</div>}
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <h2 style={{ fontFamily:FONT, fontSize:20, fontWeight:700, color:INK, margin:0, flex:1 }}>Ofertas</h2>
        {/* Selector de vista */}
        <div style={{ display:'flex', border:`1px solid ${LINE}`, borderRadius:10, overflow:'hidden' }}>
          {[{ grid:true, icon:<IcoGrid/> }, { grid:false, icon:<IcoList/> }].map(({ grid, icon }) => (
            <button key={String(grid)} onClick={() => setVistaGrid(grid)} style={{ width:34, height:34, border:'none', background: vistaGrid===grid ? PS : 'transparent', color: vistaGrid===grid ? P : MUTED, display:'grid', placeItems:'center', cursor:'pointer' }}>
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* ── Sección: Creadas por mí ── */}
      <SectionHeader
        title="Creadas por mí"
        subtitle="Estas ofertas las administrás vos: podés activarlas, pausarlas o editarlas."
      />
      {vistaGrid ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))', gap:16 }}>
          <button onClick={() => setModal(true)} style={{ background:'transparent', border:`2px dashed ${LINE}`, borderRadius:20, minHeight:300, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, cursor:'pointer', color:MUTED, fontFamily:FONT, transition:'border-color 0.15s,background 0.15s,color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=P; e.currentTarget.style.background=PS; e.currentTarget.style.color=P; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=LINE; e.currentTarget.style.background='transparent'; e.currentTarget.style.color=MUTED; }}
          >
            <div style={{ width:44, height:44, borderRadius:'50%', border:`2px dashed currentColor`, display:'grid', placeItems:'center' }}>
              <Plus size={20}/>
            </div>
            <span style={{ fontSize:13, fontWeight:600 }}>Crear oferta</span>
          </button>
          {[...ofertas].reverse().map((o, idx) => <OfertaCardGrid key={o.id} o={o} idx={idx}/>)}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[...ofertas].reverse().map(o => <OfertaRowList key={o.id} o={o}/>)}
          <button onClick={() => setModal(true)} style={{ background:'transparent', border:`2px dashed ${LINE}`, borderRadius:12, padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'center', gap:8, cursor:'pointer', color:MUTED, fontFamily:FONT, fontSize:13, fontWeight:600 }}>
            <Plus size={16} color={MUTED}/> Crear oferta
          </button>
        </div>
      )}

      {/* ── Divisor ── */}
      <div style={{ borderTop:`1px solid ${LINE}`, margin:'8px 0' }}/>

      {/* ── Sección: Ofertas de socios asociados ── */}
      <div style={{ marginTop:8, marginBottom:0 }}>
        {/* Título + badge */}
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:4 }}>
          <div style={{ fontFamily:FONT, fontSize:15, fontWeight:700, color:INK }}>Ofertas asociadas a tu empresa</div>
          <div style={{ display:'flex', alignItems:'center', gap:5, background:'linear-gradient(90deg,#fef3c7,#fde68a)', border:'1px solid #fcd34d', borderRadius:999, padding:'3px 10px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span style={{ fontFamily:FONT, fontSize:11, fontWeight:800, color:'#92400e' }}>¡Compartí y sumá créditos!</span>
          </div>
        </div>
        <div style={{ fontFamily:FONT, fontSize:12, color:MUTED, marginBottom:14 }}>Estas ofertas fueron creadas por otros socios que se asociaron a vos. Se muestran en tu perfil pero no las podés editar ni activar.</div>

        {/* Barra de compartir */}
        <ShareAsociadasBar />
      </div>
      {ofertasAsociadas.length === 0 ? (
        <div style={{ fontFamily:FONT, fontSize:13, color:MUTED, padding:'18px 0' }}>No tenés ofertas de socios asociados todavía.</div>
      ) : vistaGrid ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))', gap:16 }}>
          {ofertasAsociadas.map((o, idx) => {
            const ahorro = o.descuento ? Math.round(o.descuento * 800) : 0;
            return (
              <div key={o.id} style={{ background:CARD, border:`1px solid ${LINE}`, borderRadius:20, overflow:'hidden', display:'flex', flexDirection:'column', fontFamily:FONT, opacity:0.85 }}>
                <div style={{ position:'relative', height:160, overflow:'hidden' }}>
                  <img src={o.img} alt={o.titulo} style={{ width:'100%', height:'100%', objectFit:'cover', filter:'grayscale(20%)' }}/>
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(11,16,32,0.65) 0%, rgba(11,16,32,0.1) 50%, transparent 100%)' }}/>
                  <div style={{ position:'absolute', bottom:12, left:14, color:'#fff', fontSize:38, fontWeight:800, letterSpacing:'-0.025em', lineHeight:1 }}>−{o.descuento}%</div>
                  <div style={{ position:'absolute', top:10, left:10, background:'rgba(100,116,139,0.75)', backdropFilter:'blur(4px)', color:'#fff', fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:999 }}>Asociada</div>
                </div>
                <div style={{ padding:'12px 14px 14px', flex:1, display:'flex', flexDirection:'column', gap:4 }}>
                  <div style={{ fontSize:11, color:MUTED, fontWeight:600 }}>{o.tipo} · {o.socio}</div>
                  <div style={{ fontSize:14, fontWeight:700, color:INK2, lineHeight:1.3 }}>{o.titulo}</div>
                  {ahorro > 0 && (
                    <div style={{ border:`1px solid ${LINE}`, borderRadius:10, marginTop:10 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px' }}>
                        <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:MUTED }}>Ahorro estimado</span>
                        <span style={{ fontSize:13, fontWeight:700, color:GREEN }}>~${ahorro.toLocaleString('es-AR')} aprox.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {ofertasAsociadas.map(o => (
            <div key={o.id} style={{ background:CARD, border:`1px solid ${LINE}`, borderRadius:12, padding:'14px 16px', display:'flex', alignItems:'center', gap:14, fontFamily:FONT, opacity:0.85 }}>
              <div style={{ width:48, height:48, borderRadius:12, background:'#f1f5f9', display:'grid', placeItems:'center', flexShrink:0 }}>
                <span style={{ fontSize:13, fontWeight:800, color:MUTED }}>−{o.descuento}%</span>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:INK2 }}>{o.titulo}</div>
                <div style={{ fontSize:11, color:MUTED, marginTop:3 }}>{o.tipo} · {o.socio}</div>
              </div>
              <div style={{ fontSize:10, fontWeight:600, color:MUTED, background:'#f1f5f9', padding:'4px 10px', borderRadius:999, flexShrink:0 }}>Asociada</div>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'grid', placeItems:'center' }} onClick={() => setModal(false)}>
          <div style={{ background:CARD, borderRadius:20, padding:28, width:480, maxWidth:'90vw' }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ fontFamily:FONT, fontSize:17, fontWeight:700, color:INK, margin:0 }}>Crear oferta</h3>
              <button onClick={() => setModal(false)} style={{ background:'transparent', border:'none', cursor:'pointer', color:MUTED }}><X size={18}/></button>
            </div>
            {[
              { key:'titulo', label:'Título', type:'text' },
              { key:'descuento', label:'Descuento (%)', type:'number' },
              { key:'desc', label:'Descripción', type:'text' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:14 }}>
                <label style={{ fontFamily:FONT, fontSize:12, fontWeight:600, color:INK2, display:'block', marginBottom:6 }}>{f.label}</label>
                <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]:e.target.value }))}
                  style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:`1px solid ${LINE}`, fontFamily:FONT, fontSize:13, color:INK, outline:'none', boxSizing:'border-box' }}/>
              </div>
            ))}
            <div style={{ marginBottom:20 }}>
              <label style={{ fontFamily:FONT, fontSize:12, fontWeight:600, color:INK2, display:'block', marginBottom:6 }}>Tipo</label>
              <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo:e.target.value }))}
                style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:`1px solid ${LINE}`, fontFamily:FONT, fontSize:13, color:INK, outline:'none' }}>
                <option>Descuento Directo</option>
                <option>Pack Armado</option>
              </select>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setModal(false)} style={{ padding:'10px 18px', borderRadius:12, border:`1px solid ${LINE}`, background:'transparent', fontFamily:FONT, fontSize:13, fontWeight:600, cursor:'pointer', color:INK2 }}>Cancelar</button>
              <button onClick={addOferta} style={{ padding:'10px 18px', borderRadius:12, border:'none', background:P, color:'#fff', fontFamily:FONT, fontSize:13, fontWeight:700, cursor:'pointer' }}>Crear oferta</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar eliminación */}
      {confirmDel && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'grid', placeItems:'center' }} onClick={() => setConfirmDel(null)}>
          <div style={{ background:CARD, borderRadius:20, padding:28, width:360, maxWidth:'90vw', textAlign:'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ width:48, height:48, borderRadius:'50%', background:'#fff7f7', border:'1px solid #fecaca', display:'grid', placeItems:'center', margin:'0 auto 16px' }}>
              <Trash2 size={22} color="#ef4444"/>
            </div>
            <div style={{ fontFamily:FONT, fontSize:16, fontWeight:700, color:INK, marginBottom:8 }}>¿Eliminar esta oferta?</div>
            <div style={{ fontFamily:FONT, fontSize:13, color:INK2, marginBottom:24 }}>Esta acción no se puede deshacer.</div>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button onClick={() => setConfirmDel(null)} style={{ padding:'10px 20px', borderRadius:12, border:`1px solid ${LINE}`, background:'transparent', fontFamily:FONT, fontSize:13, fontWeight:600, cursor:'pointer', color:INK2 }}>Cancelar</button>
              <button onClick={() => eliminar(confirmDel)} style={{ padding:'10px 20px', borderRadius:12, border:'none', background:'#ef4444', color:'#fff', fontFamily:FONT, fontSize:13, fontWeight:700, cursor:'pointer' }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  TAB 5 — MI EMPRESA
// ════════════════════════════════════════════════════════════
function TabEmpresa({ negocio, showToast }) {
  const [form, setForm] = useState({
    nombre: negocio?.nombre || 'Hotel Gesell Mar',
    direccion: negocio?.direccion || 'Av. 3 nº 784',
    telefono: negocio?.telefono || '+54 9 2255 000000',
    zona: negocio?.zona || 'Centro',
    tipo: negocio?.tipo || 'Hotel',
    descripcion: negocio?.descripcion || 'Hotel a media cuadra del mar, con pileta, desayuno incluido y cochera privada.',
  });
  const [fotos, setFotos] = useState(MOCK_FOTOS);
  const fileRef = useRef();

  function save() { showToast('Perfil guardado correctamente', 'ok'); }

  function addFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFotos(prev => [...prev, { id: Date.now(), src: url, alt: file.name }]);
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <h2 style={{ fontFamily:FONT, fontSize:20, fontWeight:700, color:INK, margin:0 }}>Mi Empresa</h2>

      <Card>
        <div style={{ fontFamily:FONT, fontSize:14, fontWeight:700, color:INK, marginBottom:16 }}>Datos de la propiedad</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {[
            { key:'nombre', label:'Nombre comercial' },
            { key:'tipo',   label:'Tipo de establecimiento' },
            { key:'direccion', label:'Dirección' },
            { key:'telefono',  label:'Teléfono' },
            { key:'zona',      label:'Zona de la costa' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontFamily:FONT, fontSize:11, fontWeight:600, color:INK2, display:'block', marginBottom:6 }}>{f.label}</label>
              <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]:e.target.value }))}
                style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:`1px solid ${LINE}`, fontFamily:FONT, fontSize:13, color:INK, outline:'none', boxSizing:'border-box' }}/>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ fontFamily:FONT, fontSize:14, fontWeight:700, color:INK, marginBottom:12 }}>Descripción pública</div>
        <textarea value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion:e.target.value }))} rows={4}
          style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:`1px solid ${LINE}`, fontFamily:FONT, fontSize:13, color:INK, outline:'none', resize:'vertical', boxSizing:'border-box' }}/>
      </Card>

      <Card>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <div style={{ fontFamily:FONT, fontSize:14, fontWeight:700, color:INK }}>Galería de imágenes</div>
          <button onClick={() => fileRef.current?.click()} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:10, border:`1px dashed ${P}`, background:PS, color:P, fontFamily:FONT, fontSize:12, fontWeight:600, cursor:'pointer' }}>
            <Upload size={14}/> Subir foto
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={addFoto}/>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:10 }}>
          {fotos.map(f => (
            <div key={f.id} style={{ position:'relative', borderRadius:12, overflow:'hidden', aspectRatio:'4/3' }}>
              <img src={f.src} alt={f.alt} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              <button onClick={() => setFotos(prev => prev.filter(x => x.id !== f.id))}
                style={{ position:'absolute', top:6, right:6, width:26, height:26, borderRadius:'50%', background:'rgba(0,0,0,0.6)', border:'none', cursor:'pointer', display:'grid', placeItems:'center' }}>
                <Trash2 size={12} color="#fff"/>
              </button>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        <button onClick={save} style={{ display:'flex', alignItems:'center', gap:8, background:P, color:'#fff', border:'none', borderRadius:12, padding:'12px 24px', fontFamily:FONT, fontSize:14, fontWeight:700, cursor:'pointer' }}>
          <Save size={16}/> Guardar cambios
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  TAB 6 — MI CUENTA
// ════════════════════════════════════════════════════════════
// ─── Moneda dorada inline (el SVG público viene con clases sin definir) ───────
function CoinSVG({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ display:'inline-block', verticalAlign:'middle', flexShrink:0 }} aria-hidden="true">
      <defs>
        <linearGradient id="coin_rim" x1="6" y1="5" x2="34" y2="35" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FBDB72"/><stop offset="0.55" stopColor="#F4A91C"/><stop offset="1" stopColor="#D87708"/>
        </linearGradient>
        <linearGradient id="coin_face" x1="9" y1="8" x2="31" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFEEB0"/><stop offset="0.5" stopColor="#F9C829"/><stop offset="1" stopColor="#F0A211"/>
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill="url(#coin_rim)"/>
      <circle cx="20" cy="20" r="14.5" fill="url(#coin_face)"/>
      <path d="M20 9 C20.6 16.5 23.5 19.4 31 20 C23.5 20.6 20.6 23.5 20 31 C19.4 23.5 16.5 20.6 9 20 C16.5 19.4 19.4 16.5 20 9 Z" fill="#E08A0B" opacity="0.5"/>
      <ellipse cx="14.5" cy="13.5" rx="5.5" ry="3.6" fill="#FFFFFF" opacity="0.4"/>
    </svg>
  );
}

const MOCK_MOVS = [
  { kind:'cred-in',  socio:'Churros El Topo',   oferta:'Docena de churros con chocolate',  date:'Hoy · 12:40',  cred:+1 },
  { kind:'cred-in',  socio:'La Pescadería',      oferta:'Menú del día para dos',            date:'Hoy · 09:15',  cred:+1 },
  { kind:'cred-out', title:'Canjeaste Pack −$2.000 de abono',                               date:'Ayer · 18:02', cred:-8 },
  { kind:'pesos',    title:'Cobro plan PLUS · Junio',                                       date:'1 jun',        pesos:-18333 },
  { kind:'cred-out', title:'Enviaste créditos a Valentina R.',                              date:'29 may',       cred:-5 },
  { kind:'cred-in',  socio:'Paseos en Cuatri',   oferta:'Paseo de 2 horas por la costa',   date:'28 may',       cred:+1 },
  { kind:'pesos',    title:'Compra de 20 créditos',                                         date:'27 may',       pesos:-12100, cred:+20 },
];

const PACKS_ABONO = [
  { badge:'-2k',  off:2000,  cred:8,  popular:false },
  { badge:'-5k',  off:5000,  cred:16, popular:true  },
  { badge:'-10k', off:10000, cred:32, popular:false },
];

// dark1 = oscuro medio, dark2 = más oscuro
const PACK_DARKS = ['#2d3a5c', '#1a2440'];

const PACK_IMGS = { '-2k': '/img/2k.jpg', '-5k': '/img/5k.jpg' };

function PackFicha({ badge, off, cred, popular, darkIdx = 0 }) {
  const fmt = n => '$' + n.toLocaleString('es-AR');
  const imgSrc = PACK_IMGS[badge];
  return (
    <div style={{ background:'#fff', border:`1px solid ${LINE}`, borderRadius:18, overflow:'hidden', display:'flex', flexDirection:'column', fontFamily:FONT }}>
      {/* Imagen con proporción nativa */}
      <div style={{ position:'relative', overflow:'hidden' }}>
        <img src={imgSrc} alt={badge} style={{ width:'100%', display:'block' }}/>
        {popular && (
          <div style={{ position:'absolute', top:11, right:11, background:YELLOW, color:'#5a3d00', fontSize:15, fontWeight:800, padding:'4px 9px', borderRadius:7 }}>−20%</div>
        )}
      </div>
      {/* Cuerpo */}
      <div style={{ padding:'14px 16px 16px', display:'flex', flexDirection:'column', flex:1 }}>
        <div style={{ fontSize:11, color:MUTED, fontWeight:600, marginBottom:4 }}>Cuponera · Descuento de abono</div>
        <div style={{ fontFamily:FONT, fontSize:16, fontWeight:600, color:GREEN, lineHeight:1.3, marginBottom:10 }}>Bajá tu abono mensual</div>
        <button style={{ background:P, color:'#fff', border:'none', borderRadius:12, padding:'10px 0', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontFamily:FONT }}>
          <Tag size={14}/> Agregar a cuponera
        </button>
        {/* Cajita de precios */}
        <div style={{ border:`1px solid ${LINE}`, borderRadius:10, overflow:'hidden', marginTop:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px' }}>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:MUTED }}>Ahorro</span>
            <span style={{ fontSize:13, fontWeight:800, color:GREEN }}>{fmt(off)}</span>
          </div>
          <div style={{ height:1, background:LINE }}/>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px' }}>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:MUTED, whiteSpace:'nowrap' }}>Lo activás con</span>
            <span style={{ display:'inline-flex', alignItems:'center', gap:5, whiteSpace:'nowrap' }}>
              <CreditCoin size={15}/><span style={{ fontSize:13, fontWeight:800, color:INK }}>{cred} créditos</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MovRow({ m, last }) {
  const cfg = m.kind === 'cred-in'
    ? { bg:GREENS,      fg:GREEN }
    : m.kind === 'cred-out'
    ? { bg:'#fff4f4',   fg:'#ef4444' }
    : { bg:PS,          fg:P };
  const IcoMov = m.kind === 'cred-in'
    ? () => <img src="/income-ico.svg" width="22" height="22" style={{ display:'block' }}/>
    : m.kind === 'cred-out'
    ? () => <img src="/spend-ico.svg" width="22" height="22" style={{ display:'block' }}/>
    )
    : () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:13, padding:'13px 4px', borderBottom: last ? 'none' : `1px solid ${BG}` }}>
      <div style={{ width:38, height:38, borderRadius:11, background:cfg.bg, display:'grid', placeItems:'center', color:cfg.fg, flexShrink:0 }}><IcoMov/></div>
      <div style={{ flex:1, minWidth:0 }}>
        {m.kind === 'cred-in' && m.socio ? (
          <>
            <div style={{ fontSize:13, fontWeight:600, color:INK, lineHeight:1.4 }}>
              Sumaste créditos por haber recomendado <span style={{ color:P }}>{m.socio}</span>
            </div>
            {m.oferta && (
              <div style={{ fontSize:11, color:MUTED, marginTop:2 }}>
                Tu huésped ya está disfrutando <span style={{ fontWeight:600, color:INK2 }}>{m.oferta}</span>
              </div>
            )}
            <div style={{ fontSize:11, color:MUTED, marginTop:2 }}>{m.date}</div>
          </>
        ) : (
          <>
            <div style={{ fontSize:13, fontWeight:600, color:INK, lineHeight:1.3 }}>{m.title}</div>
            <div style={{ fontSize:11, color:MUTED, marginTop:2 }}>{m.date}</div>
          </>
        )}
      </div>
      <div style={{ textAlign:'right', flexShrink:0 }}>
        {m.cred != null && (
          <div style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:14, fontWeight:800, color: m.cred > 0 ? GREEN : INK2 }}>
            {m.cred > 0 ? '+' : '−'}<CoinSVG size={14}/>{Math.abs(m.cred)}
          </div>
        )}
        {m.pesos != null && (
          <div style={{ fontSize:13, fontWeight:700, color:INK, marginTop: m.cred != null ? 2 : 0 }}>
            −${Math.abs(m.pesos).toLocaleString('es-AR')}
          </div>
        )}
      </div>
    </div>
  );
}

function TabCuenta({ credits, addonTotal, setShowComprar }) {
  const [filtroMov, setFiltroMov] = useState('todo');
  const movRef = useRef(null);

  const movsFiltrados = MOCK_MOVS.filter(m => {
    if (filtroMov === 'cred')  return m.cred != null;
    if (filtroMov === 'pesos') return m.pesos != null;
    return true;
  });

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <h2 style={{ fontFamily:FONT, fontSize:20, fontWeight:700, color:INK, margin:0 }}>Cuenta</h2>

      {/* ── Layout principal: 35% izq / 65% der ── */}
      <div style={{ display:'grid', gridTemplateColumns:'35fr 65fr', gap:16, alignItems:'stretch' }}>

        {/* ── Columna izquierda — card unificada ── */}
        <Card style={{ display:'flex', flexDirection:'column', gap:0, padding:0, overflow:'hidden' }}>

          {/* Saldo */}
          <div style={{ padding:'20px 20px 18px', display:'flex', gap:14, alignItems:'flex-start' }}>
            <div style={{ width:56, flexShrink:0, display:'flex', alignItems:'center', paddingTop:22 }}>
              <CreditCoin size={52}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:FONT, fontSize:11, fontWeight:700, color:MUTED, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Créditos disponibles</div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontFamily:FONT, fontSize:38, fontWeight:800, color:INK, lineHeight:1 }}>{credits}</span>
                <span style={{ fontFamily:FONT, fontSize:15, fontWeight:600, color:INK2 }}>créditos</span>
              </div>
              <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:GREENS, color:GREEN, fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:999, marginTop:8 }}>
                +3 este mes
              </span>
            </div>
          </div>

          {/* Compartir ofertas — banner integrado al bloque de saldo */}
          <div style={{ margin:'0 14px 16px', borderRadius:16, background:'#eef0fd', border:'1px solid #d8defb', padding:'16px 18px', display:'flex', flexDirection:'column' }}>
            {/* Decoración: mini fichas superpuestas — arriba, ancho completo */}
            <div style={{ position:'relative', height:68, marginBottom:14 }}>
              <div style={{ position:'absolute', left:'50%', top:4, marginLeft:-26, width:52, height:62, borderRadius:10, background:'#fff', border:'1px solid #d8defb', boxShadow:'0 2px 8px rgba(71,91,225,0.10)', transform:'rotate(6deg)', overflow:'hidden' }}>
                <div style={{ height:28, background:`linear-gradient(135deg,${P} 0%,#6b7ff7 100%)` }}/>
                <div style={{ padding:'6px 8px' }}>
                  <div style={{ height:6, borderRadius:3, background:'#e2e8f0', marginBottom:4 }}/>
                  <div style={{ height:6, borderRadius:3, background:'#e2e8f0', width:'70%' }}/>
                </div>
              </div>
              <div style={{ position:'absolute', left:'50%', top:0, marginLeft:-54, width:52, height:62, borderRadius:10, background:'#fff', border:'1px solid #d8defb', boxShadow:'0 2px 8px rgba(71,91,225,0.13)', transform:'rotate(-4deg)', overflow:'hidden' }}>
                <div style={{ height:28, background:`linear-gradient(135deg,#34d399 0%,#10b981 100%)` }}/>
                <div style={{ padding:'6px 8px' }}>
                  <div style={{ height:6, borderRadius:3, background:'#e2e8f0', marginBottom:4 }}/>
                  <div style={{ height:6, borderRadius:3, background:'#e2e8f0', width:'60%' }}/>
                </div>
              </div>
            </div>
            {/* Texto — centrado */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>
              <div style={{ fontFamily:FONT, fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:P, marginBottom:4, whiteSpace:'nowrap' }}>
                Cupones para tus huéspedes
              </div>
              <div style={{ fontFamily:FONT, fontSize:18, fontWeight:600, color:INK, lineHeight:1.25, marginBottom:5 }}>
                ¡Compartí ofertas y sumá créditos!
              </div>
              <div style={{ fontFamily:FONT, fontSize:12, color:INK2, lineHeight:1.4, marginBottom:12 }}>
                Tus huéspedes canjean ofertas en restaurantes y experiencias. Vos obtenés <b>créditos para usar en tu cuponera ó reducir el valor de tu plan.</b>
              </div>
              <button style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:10, border:'none', background:P, color:'#fff', fontFamily:FONT, fontSize:13, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
                
                Compartir ofertas asociadas
              </button>
            </div>
          </div>

          <div style={{ height:1, background:LINE }}/>

          {/* Enviar créditos */}
          <div style={{ padding:'18px 20px', display:'flex', gap:14, alignItems:'flex-start' }}>
            <div style={{ width:56, height:56, flexShrink:0, display:'grid', placeItems:'center' }}>
              <img src="/send.svg" alt="" style={{ width:35, height:35 }}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:FONT, fontSize:14, fontWeight:800, color:INK }}>Enviar créditos</div>
              <div style={{ fontFamily:FONT, fontSize:12, color:INK2, marginTop:3, lineHeight:1.4, marginBottom:12 }}>Pasale saldo a un huésped o amigo al instante.</div>
              {/* Campo de cantidad */}
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, background:BG, border:`1px solid ${LINE}`, borderRadius:10, padding:'8px 12px' }}>
                <CreditCoin size={16}/>
                <input type="number" min="1" placeholder="Cantidad a enviar"
                  style={{ flex:1, border:'none', background:'transparent', fontFamily:FONT, fontSize:13, color:INK, outline:'none', width:0 }}
                />
                <span style={{ fontFamily:FONT, fontSize:11, color:MUTED, whiteSpace:'nowrap' }}>créditos</span>
              </div>
              {/* Botones en fila */}
              <div style={{ display:'flex', gap:6 }}>
                {[
                  { label:'Whatsapp', icon:<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
                  { label:'Link',     icon:<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
                  { label:'QR',       icon:<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><path d="M14 14h3v3M21 14v.01M14 21h.01M21 21v-4M17 21h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
                ].map(({ label, icon }) => (
                  <button key={label} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'9px 6px', borderRadius:9, border:`1px solid ${LINE}`, background:'#fff', color:INK2, fontFamily:FONT, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                    {icon}{label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ height:1, background:LINE }}/>

          {/* Canjear beneficios */}
          <div style={{ padding:'18px 20px', display:'flex', gap:14, alignItems:'flex-start' }}>
            <div style={{ width:56, height:56, flexShrink:0, display:'grid', placeItems:'center' }}>
              <img src="/ico-disc.svg" alt="" style={{ width:45, height:45 }}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:FONT, fontSize:14, fontWeight:800, color:INK }}>Canjear beneficios para vos</div>
              <div style={{ fontFamily:FONT, fontSize:12, color:INK2, marginTop:3, lineHeight:1.4, marginBottom:12 }}>Usá tus créditos en ofertas de Cuponera y armá tu propia cuponera.</div>
              <button style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 14px', borderRadius:9, border:`1px solid ${LINE}`, background:'#fff', color:INK2, fontFamily:FONT, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                Explorar el marketplace
              </button>
            </div>
          </div>
        </Card>

        {/* ── Columna derecha ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:14, height:'100%' }}>

          {/* Plan activo */}
          <Card>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:PS, color:P, display:'grid', placeItems:'center', flexShrink:0 }}>
                <Zap size={22}/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:FONT, fontSize:11, color:MUTED, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>Plan activo</div>
                <div style={{ fontFamily:FONT, fontSize:28, fontWeight:800, color:INK }}>PLUS</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ display:'flex', alignItems:'baseline', gap:4, justifyContent:'flex-end' }}>
                  <span style={{ fontFamily:FONT, fontSize:26, fontWeight:800, color:INK, letterSpacing:'-0.02em' }}>$18.333</span>
                  <span style={{ fontFamily:FONT, fontSize:13, color:MUTED, fontWeight:600 }}>/mes</span>
                </div>
                <div style={{ fontFamily:FONT, fontSize:12, color:INK2, fontWeight:600, marginTop:2 }}>$220.000 /año</div>
                <div style={{ fontFamily:FONT, fontSize:11, color:MUTED, marginTop:2 }}>(no incluye impuestos nacionales)</div>
              </div>
            </div>
            {(() => { const deuda = 0; return (
              <div style={{ background:BG, borderRadius:11, padding:'11px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <span style={{ fontFamily:FONT, fontSize:13, fontWeight:800, color: deuda > 0 ? '#ef4444' : INK }}>
                    Debés: ${deuda.toLocaleString('es-AR')}
                  </span>
                  <span style={{ fontFamily:FONT, fontSize:12, color:INK2 }}>Próximo cobro · 1 de julio</span>
                </div>
                <span style={{ fontFamily:FONT, fontSize:12, fontWeight:700, color:P, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:3, flexShrink:0 }}>
                  Gestionar <ChevronRight size={13}/>
                </span>
              </div>
            );})()}
          </Card>

          {/* Botón ver movimientos */}
          <div style={{ display:'flex', justifyContent:'center' }}>
            <button onClick={() => movRef.current?.scrollIntoView({ behavior:'smooth', block:'start' })}
              style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:10, border:`1px solid ${LINE}`, background:'#fff', color:INK2, fontFamily:FONT, fontSize:13, fontWeight:600, cursor:'pointer' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12l7 7 7-7"/>
              </svg>
              Ver movimientos de cuenta
            </button>
          </div>

          {/* Bajá tu abono — 2 packs en 2 columnas */}
          <Card style={{ flex:1 }}>
            <div>
              <div style={{ fontFamily:FONT, fontSize:18, fontWeight:600, color:INK }}>Usá tus créditos para reducir el abono de tu plan!</div>
              <div style={{ fontFamily:FONT, fontSize:12, color:INK2, marginTop:3 }}>Agregálos a tu cuponera y pagá con créditos.</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:20 }}>
              {PACKS_ABONO.filter(p => p.badge !== '-10k').map((p, i) => <PackFicha key={p.badge} {...p} darkIdx={i}/>)}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Movimientos (ancho completo) ── */}
      <Card ref={movRef}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:10 }}>
          <div style={{ fontFamily:FONT, fontSize:16, fontWeight:800, color:INK }}>Movimientos</div>
          {/* Filtro por moneda */}
          <div style={{ display:'flex', gap:6 }}>
            {[['todo','Todo'],['cred','Créditos'],['pesos','Pesos']].map(([id, label]) => (
              <button key={id} onClick={() => setFiltroMov(id)} style={{
                display:'inline-flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:999,
                fontSize:12, fontWeight:700, cursor:'pointer', border:`1px solid ${filtroMov===id ? INK : LINE}`,
                background: filtroMov===id ? INK : 'transparent', color: filtroMov===id ? '#fff' : INK2,
                fontFamily:FONT,
              }}>
                {id === 'cred' && <CoinSVG size={13}/>}{label}
              </button>
            ))}
          </div>
        </div>
        <div>
          {movsFiltrados.map((m, i) => <MovRow key={i} m={m} last={i === movsFiltrados.length - 1}/>)}
        </div>
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  TAB 7 — ADD-ONS
// ════════════════════════════════════════════════════════════
function TabAddons({ addonTotal, setAddonTotal, showToast }) {
  const [contratados, setContratados] = useState(new Set());

  function contratar(addon) {
    if (contratados.has(addon.id)) return;
    setContratados(prev => new Set([...prev, addon.id]));
    setAddonTotal(prev => prev + addon.precio);
    showToast(`${addon.titulo} contratado correctamente`, 'ok');
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div>
        <h2 style={{ fontFamily:FONT, fontSize:20, fontWeight:700, color:INK, margin:'0 0 4px' }}>Módulos Extras</h2>
        <p style={{ fontFamily:FONT, fontSize:13, color:INK2, margin:0 }}>Amplía las capacidades de tu ficha contratando servicios adicionales.</p>
      </div>
      {addonTotal > 0 && (
        <div style={{ background:PS, border:`1px solid ${P}30`, borderRadius:12, padding:'12px 16px', fontFamily:FONT, fontSize:13, color:P, fontWeight:600 }}>
          Add-ons activos: +${addonTotal.toLocaleString('es-AR')}/mes al plan
        </div>
      )}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
        {ADDONS_CATALOG.map(a => {
          const activo = contratados.has(a.id);
          return (
            <Card key={a.id} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:a.color+'15', display:'grid', placeItems:'center', flexShrink:0 }}>
                  <a.Icon size={22} color={a.color}/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:FONT, fontSize:14, fontWeight:700, color:INK }}>{a.titulo}</div>
                  <div style={{ fontFamily:FONT, fontSize:12, color:INK2, marginTop:4, lineHeight:1.5 }}>{a.desc}</div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'auto' }}>
                <span style={{ fontFamily:FONT, fontSize:15, fontWeight:800, color:INK }}>${a.precio.toLocaleString('es-AR')}<span style={{ fontSize:11, fontWeight:400, color:MUTED }}>/mes</span></span>
                <button onClick={() => contratar(a)} style={{
                  padding:'8px 16px', borderRadius:10, border: activo ? `1px solid ${GREEN}` : 'none',
                  background: activo ? GREENS : P, color: activo ? GREEN : '#fff',
                  fontFamily:FONT, fontSize:12, fontWeight:700, cursor: activo ? 'default' : 'pointer',
                  display:'flex', alignItems:'center', gap:6,
                }}>
                  {activo ? <><Check size={13}/> Contratado</> : <>Contratar</>}
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  SIDEBAR
// ════════════════════════════════════════════════════════════
function Sidebar({ tab, setTab, negocio, perfil, notifCount, saldoTokens, setShowComprar, onVolver, onGoHome, onLogout }) {
  return (
    <aside style={{ background:NAVY, color:'#fff', width:230, minWidth:230, display:'flex', flexDirection:'column', minHeight:'100vh', position:'sticky', top:0, alignSelf:'flex-start' }}>
      <button onClick={onGoHome} style={{ display:'flex', justifyContent:'center', alignItems:'center', padding:'20px 0 16px', background:'transparent', border:'none', cursor:'pointer', color:'#fff', borderBottom:'1px solid rgba(255,255,255,0.08)', width:'100%', boxSizing:'border-box' }}>
        <img src="/logo-cuponera-wh.svg" alt="Cuponera" style={{ width:196, height:'auto', display:'block' }}/>
      </button>

      <nav style={{ flex:1, padding:'12px 10px', display:'flex', flexDirection:'column', gap:2 }}>
        {TABS.map(t => {
          const active = tab === t.id;
          const badge = t.id === 'notif' ? notifCount : 0;
          return (
            <React.Fragment key={t.id}>
              {t.separator && <div style={{ height:1, background:'rgba(255,255,255,0.1)', margin:'6px 4px' }}/>}
              <button onClick={() => setTab(t.id)} style={{
                display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                border:'none', borderRadius:10, background: active ? P : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                fontFamily:FONT, fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left',
              }}>
                <t.Icon size={16}/>
                <span style={{ flex:1 }}>{t.label}</span>
                {badge > 0 && <span style={{ background:YELLOW, color:NAVY, fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:999 }}>{badge}</span>}
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      {negocio && debeUsarTokens(negocio.tipo, negocio.plan) && (
        <div style={{ margin:'0 10px 10px', background:'rgba(255,255,255,0.07)', borderRadius:12, padding:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
            <span style={{ fontFamily:FONT, fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:600 }}>Tokens</span>
            <span style={{ fontFamily:FONT, fontSize:13, fontWeight:700 }}>🪙 {saldoTokens}</span>
          </div>
          <button onClick={() => setShowComprar(true)} style={{ width:'100%', background:P, color:'#fff', border:'none', borderRadius:8, padding:'7px 0', fontFamily:FONT, fontSize:11, fontWeight:700, cursor:'pointer' }}>
            Comprar tokens
          </button>
        </div>
      )}

      <div style={{ padding:'12px 10px', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontFamily:FONT, fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>Sesión activa</div>
        <div style={{ fontFamily:FONT, fontSize:13, fontWeight:600, marginTop:4, marginBottom:8 }}>{perfil?.nombre || 'Socio'}</div>
        {onVolver && (
          <button onClick={onVolver} style={{ display:'flex', alignItems:'center', gap:6, background:'transparent', border:'none', color:'rgba(255,255,255,0.55)', fontFamily:FONT, fontSize:12, cursor:'pointer', marginBottom:4, padding:'3px 0' }}>
            <ArrowLeft size={13}/> Volver al panel
          </button>
        )}
        <button onClick={onLogout} style={{ display:'flex', alignItems:'center', gap:6, background:'transparent', border:'none', color:'rgba(255,255,255,0.35)', fontFamily:FONT, fontSize:12, cursor:'pointer', padding:'3px 0' }}>
          <LogOut size={13}/> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

// ════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════
export default function AdminNegocioView({ perfil, onVolver, onGoHome }) {
  const [tab, setTab]             = useState('cuenta');
  const [negocio, setNegocio]     = useState(perfil?.negocios || null);
  const [promos, setPromos]       = useState([]);
  const [saldoTokens, setSaldoTokens] = useState(0);
  const [showComprar, setShowComprar] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState(null);
  const [credits, setCredits]     = useState(7);
  const [addonTotal, setAddonTotal] = useState(0);

  const notifCount = MOCK_NOTIFS.length;

  useEffect(() => { cargarTodo(); }, []);

  async function cargarTodo() {
    if (!perfil?.negocio_id) { setLoading(false); return; }
    setLoading(true);
    if (!negocio) {
      const { data } = await supabase.from('negocios').select('*').eq('id', perfil.negocio_id).single();
      if (data) setNegocio(data);
    }
    const [proRes, saldoRes] = await Promise.all([
      supabase.from('promociones').select('*').eq('negocio_id', perfil.negocio_id).order('creado_en', { ascending: false }),
      getSaldo(perfil.negocio_id),
    ]);
    if (proRes.data) setPromos(proRes.data);
    setSaldoTokens(typeof saldoRes === 'number' ? saldoRes : 0);
    setLoading(false);
  }

  function showToast(msg, type = 'ok') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleLogout() {
    const { logout } = await import('../lib/auth');
    await logout();
    onGoHome?.();
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:BG, fontFamily:FONT }}>
      <Sidebar
        tab={tab} setTab={setTab} negocio={negocio} perfil={perfil}
        notifCount={notifCount} saldoTokens={saldoTokens}
        setShowComprar={setShowComprar} onVolver={onVolver}
        onGoHome={onGoHome} onLogout={handleLogout}
      />

      <main style={{ flex:1, padding:28, overflowY:'auto', maxWidth:'100%' }}>
        {tab === 'cuenta'    && <TabCuenta credits={credits} addonTotal={addonTotal} setShowComprar={setShowComprar}/>}
        {tab === 'inbox'     && <TabInbox/>}
        {tab === 'notif'     && <TabNotificaciones credits={credits} setCredits={setCredits}/>}
        {tab === 'ofertas'   && <TabOfertas dbPromos={promos} negocioId={perfil?.negocio_id} showToast={showToast}/>}
        {tab === 'stats'     && <TabEstadisticas/>}
        {tab === 'empresa'   && <TabEmpresa negocio={negocio} showToast={showToast}/>}
        {tab === 'addons'    && <TabAddons addonTotal={addonTotal} setAddonTotal={setAddonTotal} showToast={showToast}/>}
      </main>

      <Toast toast={toast}/>

      {showComprar && (
        <ComprarTokensModal negocioId={perfil?.negocio_id} onClose={() => setShowComprar(false)}
          onSuccess={(nuevos) => { setSaldoTokens(p => p + nuevos); setShowComprar(false); }}/>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        input:focus, textarea:focus, select:focus { border-color: ${P} !important; box-shadow: 0 0 0 3px ${PS}; }
      `}</style>
    </div>
  );
}
