// ============================================================
//  src/views/AdminNegocioView.jsx  —  Host Dashboard v2
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  LayoutDashboard, MessageSquare, Bell, Tag, CreditCard, Puzzle,
  LogOut, ArrowLeft, TrendingUp, Eye, EyeOff, MousePointerClick, Users, ChevronRight,
  Plus, X, Save, ToggleLeft, ToggleRight, Send, Check, Archive,
  Clock, Star, Trash2, Upload, Image, AlertCircle, CheckCircle2, Zap, Crown,
  Store, Coins, ShoppingBag, Utensils, Map, Smartphone, Globe, Calendar, Gift,
  MessageCircle, Edit2, RefreshCw, Package, BarChart2, Home, Search,
  Inbox, CalendarDays, Minus, Megaphone, Download, Mail, Link2, Wallet,
  Disc3, Info, Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { categoriaDeNegocio } from '../lib/datos';
import { getOrdenesPendientes, getSaldo, debeUsarTokens, getMovimientos, calcularPrecio, calcularPrecioCupon, registrarCompra } from '../lib/cobros';
import { getPuntos } from '../lib/gamificacion';
import {
  getCuponerasRegalo, crearCuponeraRegalo, renombrarCuponera, cambiarEstadoCuponera, toggleModoInteligente,
  eliminarCuponeraRegalo, agregarCupon, quitarCupon, buscarPromosDisponibles, costoCreditosDePromo, sugerirCupones,
} from '../lib/cuponerasRegalo';
import { LOCALIDADES } from '../lib/localidades';
import { FOTOS_GALERIA_MAX, getPlanesConfig } from '../lib/planes';
import { DEFAULT_TIERS, validarTramos } from '../lib/grupos';
import { impulsarOferta, costoPorAcceso, costoPorVenta, costoPorResultado } from '../lib/impulso';
import { sanitizeTituloOferta } from '../lib/ofertas';
import ComprarTokensModal from '../components/ComprarTokensModal';
import SimuladorImpulso, { CREDITOS_MIN, DIAS_REF, VALOR_CREDITO } from '../components/SimuladorImpulso';
import LoadingScreen from '../components/LoadingScreen';
import GaleriaFotos from '../components/GaleriaFotos';
import PerfilNegocioForm from '../components/PerfilNegocioForm';
import { perfilDesdeNegocio, perfilAPayload, validarPerfil } from '../lib/perfilNegocio';

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

// ─── Nav config ─────────────────────────────────────────────
const NAV_GRUPOS = [
  {
    id: 'grupo-ofertas',
    label: 'Ofertas',
    items: [
      { id: 'ofertas',     label: 'Creadas por mí', Icon: Tag         },
      { id: 'solicitudes', label: 'Ventas',          Icon: Inbox,      alojOnly: true },
      { id: 'compras',     label: 'Mis cuponeras',   Icon: Wallet      },
    ],
  },
  {
    id: 'grupo-empresa',
    label: 'Mi empresa',
    items: [
      { id: 'cuenta',  label: 'Cuenta',               Icon: CreditCard },
      { id: 'empresa', label: 'Perfil del negocio',   Icon: Store      },
      { id: 'galeria', label: 'Galería de imágenes',  Icon: Image      },
      { id: 'stats',   label: 'Estadísticas',         Icon: BarChart2  },
    ],
  },
];
const NAV_BOTTOM = [
  { id: 'notif', label: 'Notificaciones', Icon: Bell },
];
const TIPOS_ALOJ_ADMIN = new Set(['Hotel','Cabaña','Departamento','Casa','Hostel','Dormi']);

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
  { id: 1, tipo: 'propia', icon: ShoppingBag, color: GREEN, title: 'Cupón propio canjeado', cliente: 'Valentina R.', cupon: 'Escapada Romántica (-15%)', time: 'Hace 5 min', creditos: 0 },
  { id: 2, tipo: 'tercero', icon: Utensils, color: YELLOW, title: 'Huésped generó créditos', desc: 'Tu huésped de hab. 104 adquirió cuponera de Churros El Topo. ¡+1 Crédito!', time: 'Hace 22 min', creditos: 1 },
  { id: 3, tipo: 'tercero', icon: Utensils, color: YELLOW, title: 'Huésped generó créditos', desc: 'Tu huésped adquirió cuponera de La Pescadería Gesell. ¡+1 Crédito!', time: 'Hace 1 h', creditos: 1 },
  { id: 4, tipo: 'propia', icon: ShoppingBag, color: GREEN, title: 'Cupón propio canjeado', cliente: 'Martín G.', cupon: 'Pack 3 noches + excursión', time: 'Ayer 18:40', creditos: 0 },
  { id: 5, tipo: 'tercero', icon: Map, color: YELLOW, title: 'Huésped generó créditos', desc: 'Tu huésped adquirió cuponera de Paseos en Cuatriciclo. ¡+1 Crédito!', time: 'Ayer 11:20', creditos: 1 },
];

const MOCK_OFERTAS = [
  { id: 1, titulo: 'Escapada Romántica -15%', desc: 'Descuento especial para parejas, incluye detalle de bienvenida.', descuento: 15, tipo: 'Descuento Directo', activa: true },
  { id: 2, titulo: 'Pack 3 Noches + Excursión', desc: 'Pack armado con traslado y entrada a Reserva Dunas.', descuento: 20, tipo: 'Pack Armado', activa: true },
  { id: 3, titulo: 'Tarifa Anticipada -10%', desc: 'Reserva con 30 días de anticipación y ahorrá.', descuento: 10, tipo: 'Descuento Directo', activa: false },
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
function TabNovedades({ credits, setCredits, onGoToVentas }) {
  const [notifs, setNotifs] = useState(MOCK_NOTIFS);
  const [filter, setFilter] = useState('todas');

  function markRead(id) { setNotifs(prev => prev.filter(n => n.id !== id)); }

  const filtered = filter === 'todas' ? notifs
    : filter === 'ventas' ? notifs.filter(n => n.tipo === 'propia')
    : notifs.filter(n => n.tipo === 'tercero');

  const FILTROS = [
    { id: 'todas',    label: 'Todas'    },
    { id: 'ventas',   label: 'Mis ventas' },
    { id: 'terceros', label: 'Créditos ganados' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h2 style={{ fontFamily:FONT, fontSize:20, fontWeight:700, color:INK, margin:0 }}>Novedades</h2>
        <div style={{ display:'flex', alignItems:'center', gap:8, background:`${YELLOW}15`, border:`1px solid ${YELLOW}40`, borderRadius:12, padding:'8px 14px' }}>
          <CreditCoin size={20}/>
          <span style={{ fontFamily:FONT, fontWeight:700, fontSize:16, color:INK }}>{credits} créditos</span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8 }}>
        {FILTROS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding:'6px 16px', borderRadius:99, border:`1px solid ${filter===f.id ? P : LINE}`,
            background: filter===f.id ? PS : 'transparent', color: filter===f.id ? P : INK2,
            fontFamily:FONT, fontSize:12, fontWeight:600, cursor:'pointer',
          }}>{f.label}</button>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card style={{ textAlign:'center', padding:40, color:MUTED }}>
          <Megaphone size={32} style={{ margin:'0 auto 10px', display:'block', opacity:0.3 }}/>
          <div style={{ fontFamily:FONT, fontSize:14 }}>Sin novedades</div>
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

            {/* Cupón propio: nombre del cliente + CTA */}
            {n.tipo === 'propia' ? (
              <div style={{ marginTop:6 }}>
                <div style={{ fontFamily:FONT, fontSize:14, fontWeight:700, color:INK }}>
                  {n.cliente} te compró un cupón!
                </div>
                <div style={{ fontFamily:FONT, fontSize:12, color:MUTED, marginTop:2 }}>{n.cupon}</div>
                <button
                  onClick={() => onGoToVentas?.()}
                  style={{ marginTop:10, display:'inline-flex', alignItems:'center', gap:6, background:P, color:'#fff', border:'none', borderRadius:8, padding:'7px 14px', fontFamily:FONT, fontSize:12, fontWeight:700, cursor:'pointer' }}
                >
                  <MessageSquare size={13}/> Ponerse en contacto
                </button>
              </div>
            ) : (
              <>
                <div style={{ fontFamily:FONT, fontSize:12, color:INK2, marginTop:4 }}>{n.desc}</div>
                {n.creditos > 0 && (
                  <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:6 }}>
                    <CreditCoin size={16}/>
                    <span style={{ fontFamily:FONT, fontSize:12, fontWeight:700, color:YELLOW }}>+{n.creditos} Crédito acumulado</span>
                  </div>
                )}
              </>
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
const PLACEHOLDER_IMGS = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=220&fit=crop',
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=220&fit=crop',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=220&fit=crop',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=220&fit=crop',
];

const MOCK_OFERTAS_ASOCIADAS = [
  { id: 'as1', titulo: 'Cena para dos en La Parrilla del Puerto', tipo: 'Salidas', descuento: 20, socio: 'La Parrilla del Puerto', img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=220&fit=crop' },
  { id: 'as2', titulo: 'Alquiler de bicicletas — día completo', tipo: 'Actividades', descuento: 15, socio: 'BiciAventura', img: 'https://images.unsplash.com/photo-1558981033-0f0309284409?w=400&h=220&fit=crop' },
];

// ¿Es un id real de promociones (uuid) o un id local/mock (numérico)?
const esUuid = (id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// Fila cruda de `promociones` → item del editor (incluye formatos + config grupal).
function dbRowToItem(p) {
  const src = p.imagen_url || p.imagen || p.img || null;
  return {
    id:        p.id,
    titulo:    p.titulo || p.nombre || '',
    badge:     p.badge || '',
    desc:      p.descripcion || p.descripcion_larga || '',
    activa:    p.activa !== false,
    borrador:  p.borrador === true,
    descuentos: Array.isArray(p.descuentos) && p.descuentos.length ? p.descuentos : (p.badge ? [{ tarifa: 'todas', valor: p.badge }] : []),
    img:       src,
    imagenes:  src ? [{ src, file: null }] : [],
    formatos:  [...(p.offer_type === 'Flash' ? ['flash'] : []), ...(p.is_group ? ['grupal'] : [])],
    ahorro:    p.ahorro_estimado ?? '',
    precio:    p.precio_manual != null ? String(p.precio_manual) : (p.ahorro_estimado ? String(calcularPrecioCupon(Number(p.ahorro_estimado))) : ''),
    flashFechaFin: p.fecha_fin_flash ? new Date(p.fecha_fin_flash) : null,
    fechaDesde: p.fecha_inicio ? new Date(p.fecha_inicio) : null,
    fechaHasta: p.fecha_fin ? new Date(p.fecha_fin) : null,
    // Modelo A (grupal)
    grupoMinPax: p.group_min_pax ?? 2,
    grupoMaxPax: p.group_max_pax ?? 12,
    basePricePp: p.base_price_pp ?? '',
    tramos:      Array.isArray(p.group_tiers) && p.group_tiers.length ? p.group_tiers : DEFAULT_TIERS,
    // Impulso publicitario
    impulsoActivo:   p.impulso_activo || false,
    impulsoTotal:    Number(p.impulso_creditos_total || 0),
    impulsoRestante: Number(p.impulso_creditos_restante || 0),
    // Reserva previa (legacy null → se resuelve al editar según categoría del negocio)
    requiereReserva: p.requiere_reserva ?? null,
    _db: true,
  };
}

// ─── Ilustración: "falso website" con el primer bloque destacado ──
function FakeSitePreview() {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${LINE}`, boxShadow: '0 14px 34px -14px rgba(11,16,32,0.22)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderBottom: `1px solid ${LINE}`, background: '#f8fafc' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }}/>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }}/>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}/>
        <div style={{ flex: 1, height: 12, borderRadius: 6, background: LINE, marginLeft: 6 }}/>
      </div>
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {/* Primer bloque = tu oferta, destacado */}
        <div style={{ position: 'relative', borderRadius: 10, border: `2px solid ${P}`, background: PS, padding: '12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: P, flexShrink: 0 }}/>
          <div style={{ flex: 1 }}>
            <div style={{ height: 9, width: '70%', borderRadius: 5, background: P, opacity: 0.85, marginBottom: 6 }}/>
            <div style={{ height: 7, width: '45%', borderRadius: 5, background: P, opacity: 0.4 }}/>
          </div>
          <span style={{ position: 'absolute', top: -9, right: 10, background: P, color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 999, letterSpacing: '0.05em' }}>TU OFERTA</span>
        </div>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ borderRadius: 10, border: `1px solid ${LINE}`, background: '#fff', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, opacity: 1 - i * 0.18 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e2e8f0', flexShrink: 0 }}/>
            <div style={{ flex: 1 }}>
              <div style={{ height: 8, width: '60%', borderRadius: 5, background: '#e2e8f0', marginBottom: 5 }}/>
              <div style={{ height: 6, width: '40%', borderRadius: 5, background: '#eef2f7' }}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Costos de referencia (CPC/CPV/CPR), sólo en pesos — va debajo de la ilustración,
// a la izquierda. Caja sutil, sin negritas: es sólo contexto, no el foco de la pantalla.
function CostosImpulso({ dias, creditos }) {
  const filas = [
    { label: 'Costo por click',          valor: costoPorVenta(dias, creditos) },
    { label: 'Costo por visualización',  valor: costoPorAcceso(dias, creditos) },
    { label: 'Costo por resultado',      valor: costoPorResultado(dias, creditos) },
  ];
  return (
    <div>
      <div style={{ border: `1px solid ${LINE}`, borderRadius: 10, overflow: 'hidden' }}>
        {filas.map((fila, i) => (
          <div key={fila.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderTop: i > 0 ? `1px solid ${LINE}` : 'none' }}>
            <span style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: 400, color: MUTED }}>{fila.label}</span>
            <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 400, color: INK2 }}>
              ${Math.round(fila.valor * VALOR_CREDITO).toLocaleString('es-AR')}
            </span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, fontWeight: 400, color: MUTED, marginTop: 8 }}>Referencia antes de publicar.</div>
    </div>
  );
}

// ─── Invitación post-publicación: impulsá tu cupón (pantalla principal) ──
const FORMAS_PAGO_IMPULSO = [
  { id: 'mercadopago', label: 'Mercado Pago', Icon: Smartphone },
  { id: 'tarjeta',     label: 'Tarjeta',      Icon: CreditCard },
];

function ImpulsoInvitacion({ oferta, negocioId, saldo, onClose, onImpulsada, showToast }) {
  const [creditos, setCreditos] = useState(CREDITOS_MIN);
  const [dias, setDias]         = useState(DIAS_REF); // se comparte con la tabla de costos, a la izquierda
  const [paso, setPaso]         = useState('simulador'); // 'simulador' | 'checkout'
  const [fromWallet, setFromWallet] = useState(0); // créditos que se cubren con el saldo actual
  const [formaPago, setFormaPago]   = useState('mercadopago');
  const [enviando, setEnviando]     = useState(false);
  const [mostrarTip, setMostrarTip] = useState(false); // tooltip propio del ícono de info (no el title nativo)

  const maxWallet = Math.max(0, Math.min(saldo, creditos));
  const aPagar    = Math.max(0, creditos - fromWallet);
  const precio    = calcularPrecio(aPagar, 0);
  // Cuánto de lo elegido en el simulador (antes de llegar al checkout) no cubre el saldo actual.
  const faltanteSimulado = Math.max(0, creditos - saldo);
  const precioFaltante   = calcularPrecio(faltanteSimulado, 0);

  function irAlCheckout() {
    setFromWallet(Math.min(saldo, creditos));
    setPaso('checkout');
  }

  async function pagarImpulso() {
    if (enviando) return;
    setEnviando(true);
    try {
      if (aPagar > 0) {
        const { error } = await registrarCompra({ negocioId, cantidad: aPagar, descuentoPct: 0, formaPago });
        if (error) { showToast('No se pudo procesar el pago', 'err'); setEnviando(false); return; }
      }
      const { ok, error, restante } = await impulsarOferta(oferta.id, negocioId, creditos);
      setEnviando(false);
      if (!ok) { showToast(error || 'No se pudo impulsar', 'err'); return; }
      showToast('¡Listo! Tu oferta se mostrará primero.', 'ok');
      onImpulsada(oferta.id, { monto: creditos, restante, fromWallet });
    } catch {
      setEnviando(false);
      showToast('No se pudo procesar el pago', 'err');
    }
  }

  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,16,32,0.6)', zIndex: 99999, display: 'grid', placeItems: 'center', backdropFilter: 'blur(5px)', padding: 20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 24, width: 960, maxWidth: '96vw', maxHeight: '92vh', overflow: 'auto', fontFamily: FONT, boxShadow: '0 30px 80px rgba(0,0,0,0.3)', display: 'grid', gridTemplateColumns: '420px 1fr' }}>
        {/* Izquierda: ilustración + costos de referencia */}
        <div style={{ background: 'linear-gradient(160deg, #eef0fd 0%, #f8fafc 100%)', padding: '34px 30px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: INK, lineHeight: 1.1 }}>¡Tu cupón ya está publicado!</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: INK2, marginTop: 6, lineHeight: 1.4, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <span>¿Qué te parece si le das un impulso para mejorar su visibilidad en <b><i>Cuponear?</i></b></span>
              <span
                onMouseEnter={() => setMostrarTip(true)}
                onMouseLeave={() => setMostrarTip(false)}
                style={{ position: 'relative', flexShrink: 0, marginTop: 3, color: MUTED, cursor: 'pointer', display: 'inline-flex' }}>
                <Info size={15}/>
                {mostrarTip && (
                  <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 22, width: 220, background: INK, color: '#fff', fontSize: 11.5, fontWeight: 500, lineHeight: 1.45, padding: '9px 11px', borderRadius: 9, boxShadow: '0 10px 28px rgba(0,0,0,0.25)', zIndex: 10 }}>
                    Comprá crédito publicitario, se consumirá sólo cuando tengas resultados. Cada acceso y cada venta lo van descontando.
                  </div>
                )}
              </span>
            </div>
          </div>
          <FakeSitePreview/>
          <CostosImpulso dias={dias} creditos={creditos}/>
        </div>
        {/* Derecha: simulador o checkout */}
        <div style={{ padding: '30px 34px 26px', display: 'flex', flexDirection: 'column' }}>
          {paso === 'simulador' ? (
            <>
              <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 16 }}>Hacé que más gente lo vea</div>

              <SimuladorImpulso value={creditos} onChange={setCreditos} dias={dias} onChangeDias={setDias}/>

              <div style={{ fontSize: 12.5, color: INK2, textAlign: 'center', marginTop: 22 }}>
                Tenés <b style={{ color: INK }}>{saldo}</b> crédito{saldo !== 1 ? 's' : ''} disponible{saldo !== 1 ? 's' : ''}.{' '}
                {faltanteSimulado > 0
                  ? <>Vas a pagar <b style={{ color: '#ea580c' }}>${precioFaltante.total.toLocaleString('es-AR')}</b> por los {faltanteSimulado} créd. que faltan.</>
                  : 'Se cubre entero con tu saldo actual.'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 }}>
                <button onClick={onClose}
                  style={{ background: '#fff', color: INK2, border: `1.5px solid ${LINE}`, borderRadius: 12, padding: '12px 20px', fontFamily: FONT, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>
                  No, gracias
                </button>
                <button onClick={irAlCheckout}
                  style={{ background: '#ea580c', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 26px', fontFamily: FONT, fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                  <TrendingUp size={16}/> Aumentar visibilidad
                </button>
              </div>
            </>
          ) : (
            <>
              <button onClick={() => setPaso('simulador')} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: MUTED, fontFamily: FONT, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 10 }}>
                ← Volver
              </button>
              <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 16 }}>Confirmá tu impulso</div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: BG, border: `1px solid ${LINE}`, borderRadius: 12, padding: '12px 14px', marginBottom: 18 }}>
                <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: INK2 }}>Total del impulso</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT, fontSize: 16, fontWeight: 900, color: INK }}>
                  <img src="/cuponera-coin.svg" alt="" style={{ width: 18, height: 18 }}/> {creditos} créd.
                </span>
              </div>

              {maxWallet > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: INK2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>De tu billetera</span>
                    <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 800, color: P }}>{fromWallet} créd.</span>
                  </div>
                  <input type="range" min={0} max={maxWallet} step={1} value={fromWallet}
                    onChange={e => setFromWallet(Number(e.target.value))}
                    style={{ width: '100%', accentColor: P, cursor: 'pointer' }}/>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: MUTED }}>
                    <span>0</span>
                    <span>{maxWallet} disponibles</span>
                  </div>
                </div>
              )}

              <div style={{ background: aPagar > 0 ? PS : '#f0fdf4', border: `1px solid ${aPagar > 0 ? '#c7d2fe' : '#bbf7d0'}`, borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: FONT, fontSize: 13, fontWeight: 700, color: INK }}>
                  <span>A pagar</span>
                  <span>{aPagar} créd.</span>
                </div>
                {aPagar > 0 ? (
                  <div style={{ fontFamily: FONT, fontSize: 12, color: INK2, marginTop: 4 }}>≈ ${precio.total.toLocaleString('es-AR')} (IVA incluido)</div>
                ) : (
                  <div style={{ fontFamily: FONT, fontSize: 12, color: '#15803d', marginTop: 4 }}>Se cubre entero con tu saldo actual.</div>
                )}
              </div>

              {aPagar > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: INK2, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Forma de pago</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {FORMAS_PAGO_IMPULSO.map(f => {
                      const sel = formaPago === f.id;
                      return (
                        <button key={f.id} onClick={() => setFormaPago(f.id)}
                          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 0', borderRadius: 10, border: `1.5px solid ${sel ? P : LINE}`, background: sel ? PS : '#fff', color: sel ? P : INK2, fontFamily: FONT, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                          <f.Icon size={15}/> {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
                <button onClick={pagarImpulso} disabled={enviando}
                  style={{ width: '100%', background: enviando ? LINE : P, color: enviando ? MUTED : '#fff', border: 'none', borderRadius: 12, padding: '13px 0', fontFamily: FONT, fontSize: 14, fontWeight: 800, cursor: enviando ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                  <TrendingUp size={16}/> {enviando ? 'Procesando…' : 'Pagar impulso'}
                </button>
                <button onClick={onClose} style={{ width: '100%', background: 'transparent', color: MUTED, border: 'none', borderRadius: 12, padding: '8px 0', fontFamily: FONT, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  No, gracias
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// Ícono de autoguardado a la derecha de un campo: nada mientras se escribe/espera el
// debounce, disco gris mientras autoguarda, tilde verde apenas termina. Se usa en pares
// con `paddingRight` en el input para no tapar el texto.
function EstadoGuardadoIcono({ activo, status, style }) {
  if (!activo || status === 'idle') return null;
  return (
    <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'grid', placeItems: 'center', pointerEvents: 'none', ...style }}>
      {status === 'saving'
        ? <Loader2 size={15} color={MUTED} style={{ animation: 'girar 0.9s linear infinite' }}/>
        : <Check size={15} color={GREEN}/>}
    </div>
  );
}

export function TabOfertas({ dbPromos = [], negocioId, negocioTipo = null, showToast, plan = 'free', onUpgrade, saldoTokens = 0, setSaldoTokens, onboarding = false, onSkip, onVolver, soloEditor = false, ofertaInicial = null, modoAdmin = false, onCerrarEditor, onOfertaGuardada }) {
  // Los alojamientos por defecto piden reserva previa (fechas de estadía); el resto no.
  const esAlojamientoNegocio = categoriaDeNegocio(negocioTipo) === 'alojamiento';
  const [ofertas, setOfertas] = useState(() => {
    if (dbPromos.length > 0) return dbPromos.map(dbRowToItem);
    // En el onboarding arrancamos sin ninguna oferta (sólo el placeholder), sin datos de ejemplo.
    if (onboarding) return [];
    return MOCK_OFERTAS.map((o, i) => {
      const src = PLACEHOLDER_IMGS[i % PLACEHOLDER_IMGS.length];
      return { ...o, img: src, imagenes: [{ src, file: null }] };
    });
  });
  const ofertasAsociadas = MOCK_OFERTAS_ASOCIADAS;
  const [vistaGrid, setVistaGrid]         = useState(true);
  const [editingOferta, setEditingOferta] = useState('new');
  const [editorAbierto, setEditorAbierto] = useState(true); // panel derecho de carga/edición
  const EMPTY_FORM = {
    tipoDescuento: 'porcentaje',   // 'porcentaje' | 'multiplicador' | 'extra'
    titulo: '', desc: '',
    // Descuentos por tarifa: 1+ entradas { tarifa: 'todas'|'comunes'|'especiales', valor }.
    // El primero (descuentos[0].valor) es el badge que se ve sobre la foto.
    descuentos: [{ tarifa: 'todas', valor: '' }],
    formatos: [],           // formatos no-base activos (estándar es la base implícita)
    flashHoras: 24,          // FLASH: se publica por N horas (máx. 72)
    // Ruleta de descuentos: opciones que giran + su probabilidad (%).
    ruletaOpciones: [{ premio: '', prob: '' }],
    // Modelo A (grupal): el socio sólo define cómo varía el % por cantidad (tramos).
    // El mín/máx de personas se derivan de los tramos al guardar (primer/último rango).
    basePricePp: '', tramos: [{ min_pax: 2, max_pax: 4, discount_pct: 10 }],
    happyDesde: '15:00', happyHasta: '18:00',
    // Ahorro declarado en $ para el turista: sugiere el Precio del cupón (editable).
    ahorro: '', precio: '',
    // Período activo: modo 'hoy'/'manual' (default) o 'especifica' (habilita el datetime).
    desdeModo: 'hoy', hastaModo: 'manual',
    activa: true, imagenes: [], fechaDesde: null, fechaHasta: null,
    // ¿El servicio requiere reserva previa? Habilita el form de disponibilidad en el detalle.
    requiereReserva: esAlojamientoNegocio,
  };
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [isDirty, setIsDirty]   = useState(false);
  const [savingOferta, setSavingOferta] = useState(false);
  // Ícono de autoguardado por campo: 'idle' (nada) mientras se escribe o se espera el
  // debounce, 'saving' (disco gris) mientras autoguarda, 'saved' (tilde verde) al terminar.
  // `campoActivo` es qué campo lo muestra; el ref evita aplicar un resultado tardío a un
  // campo distinto si el socio ya se movió a escribir otra cosa antes de que resuelva.
  const [saveStatus, setSaveStatus]   = useState('idle');
  const [campoActivo, setCampoActivoState] = useState(null);
  const campoActivoRef = useRef(null);
  const setCampoActivo = (v) => { campoActivoRef.current = v; setCampoActivoState(v); };
  // Cuánto espera el autoguardado antes de disparar: 3s para campos de texto (dan tiempo a
  // seguir escribiendo), 0 para selects/on-off (no hay nada que "esperar", se guardan ya).
  const [saveDelayMs, setSaveDelayMs] = useState(3000);
  function setCampoTexto(key, value) {
    setEditForm(f => ({ ...f, [key]: value }));
    setIsDirty(true);
    setCampoActivo(key);
    setSaveStatus('idle');
    setSaveDelayMs(3000);
  }
  // Selects y toggles on/off: se guardan al instante, sin el debounce de 3s de los campos de texto.
  function setFInstante(updater) {
    setEditForm(updater);
    setIsDirty(true);
    setCampoActivo(null);
    setSaveStatus('idle');
    setSaveDelayMs(0);
  }
  const [unsavedModal, setUnsavedModal] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  // "Aumentar visibilidad" (header fijo al editar un cupón publicado) y post-publicación reutilizan la misma invitación.
  const [invitacionTarget, setInvitacionTarget] = useState(null);
  const pendingNav = useRef(null);
  const fileInputRef = useRef(null);
  // Autosave de borrador (se dispara al subir la foto y en cada cambio, con debounce).
  const draftTimerRef   = useRef(null);   // id del setTimeout del debounce
  const draftSavingRef  = useRef(false);  // hay un autosave en vuelo
  const manualSavingRef = useRef(false);  // hay un guardado manual en curso
  const lastFileRef     = useRef(null);   // último File subido (para no re-subir)
  const lastUrlRef      = useRef(null);   // URL pública del último File subido
  const borradorIdRef   = useRef(null);   // id del borrador en curso (evita insertar duplicados)

  // Cambios que no pasan por setCampoTexto (selects, checkboxes, tramos, etc.) no tienen ícono
  // propio: limpiamos campoActivo para que un guardado disparado por uno de estos campos no
  // "reencienda" la tilde verde de un campo de texto que el socio ya no está mirando.
  const setF = updater => { setEditForm(updater); setIsDirty(true); setCampoActivo(null); setSaveStatus('idle'); setSaveDelayMs(3000); };

  // Formatos que el socio puede elegir al crear un cupón (ver reference_formatos_oferta).
  // Geo-Ofertas y Tormenta de cupones NO están acá: las arma Cuponear (superadmin), el socio no tiene injerencia.
  // Cupón Viral y Circuitos Cuponear fueron anulados.
  const FORMATOS = [
    { id: 'flash',     label: 'FLASH Sale!',           Icon: Zap,       color: '#ef4444', grupo: 'combinable', desc: 'Cuenta regresiva visible; al vencer, se desactiva.' },
    { id: 'happyhour', label: 'Happy Hour',            Icon: Clock,     color: '#0ea5e9', grupo: 'combinable', desc: 'A qué hora pueden canjearlo.' },
    { id: 'ruleta',    label: 'Ruleta de descuentos',  Icon: Disc3,     color: '#ca8a04', grupo: 'combinable', desc: 'El descuento queda a la suerte del usuario.' },
    { id: 'grupal',    label: 'Oferta Grupal',         Icon: Users,     color: '#7c3aed', grupo: 'exclusivo',  desc: 'A más personas beneficiadas, mayor el descuento.' },
  ];
  const formatoDe = (id) => FORMATOS.find(f => f.id === id);
  const exclusivoActivo = editForm.formatos.map(formatoDe).find(f => f?.grupo === 'exclusivo');

  // Tipo de oferta (se elige con la foto ya subida). La oferta grupal sólo aplica a "porcentaje".
  const TIPOS_DESCUENTO = [
    // Los ejemplos de porcentaje son sólo números (el "%" es fijo en el campo).
    { id: 'porcentaje',    label: 'Por porcentaje',  ejemplos: ['25', '30', '40'] },
    { id: 'multiplicador', label: 'Multiplicador (2x1 en tragos, 3x2 en alojamiento)',   ejemplos: ['2x1', '3x2', '2x1 en tragos'] },
    { id: 'extra',         label: 'Beneficio extra', ejemplos: ['Postre gratis', 'Copa de bienvenida', 'Late check-out'] },
  ];
  const TARIFAS = [
    { id: 'todas',      label: 'Aplica a todas las tarifas' },
    { id: 'comunes',    label: 'Sólo tarifas comunes' },
    { id: 'especiales', label: 'Sólo tarifas de días especiales' },
  ];
  const tipoActual = TIPOS_DESCUENTO.find(t => t.id === editForm.tipoDescuento) || TIPOS_DESCUENTO[0];
  const ejemplosPlaceholder = `Ej: ${tipoActual.ejemplos.join(' · ')}`;
  const setTipoDescuento = (tipo) => setFInstante(f => ({
    ...f,
    tipoDescuento: tipo,
    // Al cambiar de tipo se limpian los valores (cambia el formato de carga).
    descuentos: f.descuentos.map(d => ({ ...d, valor: '' })),
    // Grupal sólo tiene sentido con porcentaje: si cambian de tipo, se desactiva.
    formatos: tipo !== 'porcentaje' ? f.formatos.filter(x => x !== 'grupal') : f.formatos,
  }));
  // El badge (etiqueta sobre la foto) y el piso grupal salen del primer descuento cargado.
  const badgeValor = editForm.descuentos?.[0]?.valor || '';
  const pisoPctGrupal = parseInt(String(badgeValor).replace(/[^\d]/g, ''), 10);
  // Campos obligatorios para publicar: foto, título y al menos un descuento cargado.
  const camposFaltantes = [
    !editForm.imagenes[0]?.src && 'foto',
    !editForm.titulo.trim() && 'título',
    !editForm.descuentos.some(d => (d.valor || '').trim()) && 'un descuento cargado',
  ].filter(Boolean);
  const camposCompletos = camposFaltantes.length === 0;
  // El resto del formulario se oculta hasta subir una foto SÓLO para una oferta nueva (fuerza
  // el flujo "foto primero"). Una oferta ya existente sin foto (datos viejos, de antes de que
  // la foto fuera obligatoria) tiene que poder verse y editarse igual — si no, quedaba atrapada:
  // no se veían sus campos y "Guardar cambios" seguía deshabilitado sin forma de arreglarlo.
  const mostrarRestoForm = !!editForm.imagenes[0]?.src || editingOferta !== 'new';

  // ── Descuentos por tarifa (repetibles) ──
  const actualizarDescuento = (i, key, value) => {
    const updater = f => ({ ...f, descuentos: f.descuentos.map((d, idx) => idx === i ? { ...d, [key]: value } : d) });
    // "tarifa" es un <select> (instantáneo); "valor" se escribe (debounce de texto).
    if (key === 'tarifa') setFInstante(updater); else setF(updater);
  };
  const agregarDescuento = () =>
    setF(f => {
      // El segundo descuento cae en la tarifa complementaria (comunes ↔ especiales).
      const nueva = f.descuentos[0]?.tarifa === 'comunes' ? 'especiales' : 'comunes';
      return { ...f, descuentos: [...f.descuentos, { tarifa: nueva, valor: '' }] };
    });
  const eliminarDescuento = (i) =>
    setF(f => ({ ...f, descuentos: f.descuentos.filter((_, idx) => idx !== i) }));
  // "Todas las tarifas" anula agregar; comunes/especiales lo habilitan si aún hay una fila sola.
  const puedeAgregarDescuento = editForm.descuentos.length === 1 && editForm.descuentos[0].tarifa !== 'todas';
  // Opciones de tarifa deshabilitadas por fila: "todas" no convive con 2 filas; no duplicar la otra.
  const tarifaOpcionDisabled = (i, tarifaId) => {
    const otras = editForm.descuentos.filter((_, idx) => idx !== i).map(d => d.tarifa);
    return (tarifaId === 'todas' && editForm.descuentos.length > 1) || otras.includes(tarifaId);
  };

  // ── Período activo (Desde / Hasta) ──
  const toLocalDT = d => d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
  const setDesdeModo = (m) => setFInstante(f => ({ ...f, desdeModo: m, fechaDesde: m === 'especifica' ? (f.fechaDesde || new Date()) : null }));
  const setHastaModo = (m) => setFInstante(f => ({ ...f, hastaModo: m, fechaHasta: m === 'especifica' ? (f.fechaHasta || new Date()) : null }));

  // Saneadores según el tipo de oferta.
  const soloNum = s => String(s ?? '').replace(/[^\d]/g, '');
  const sanitizarExtra = s => String(s ?? '').replace(/[^\p{L}\p{N} ]/gu, ''); // letras, números y espacios
  const partesMult = v => { const [a = '', b = ''] = String(v || '').split('x'); return [soloNum(a), soloNum(b)]; };

  const toggleFormato = (id) => {
    const f = formatoDe(id);
    setFInstante(prev => {
      const activos = prev.formatos;
      if (f.grupo === 'exclusivo') {
        // exclusivo: reemplaza todo lo demás; volver a tocarlo lo apaga
        return { ...prev, formatos: activos.includes(id) ? [] : [id] };
      }
      // combinable: bloqueado si hay un exclusivo activo
      if (activos.some(x => formatoDe(x)?.grupo === 'exclusivo')) return prev;
      return { ...prev, formatos: activos.includes(id) ? activos.filter(x => x !== id) : [...activos, id] };
    });
  };
  const formatoDisabled = (f) => f.grupo === 'combinable' && !!exclusivoActivo && !editForm.formatos.includes(f.id);

  // ── Tramos del cupón grupal (Modelo A) ──
  const actualizarTramo = (i, key, value) =>
    setF(f => ({ ...f, tramos: f.tramos.map((t, idx) => idx === i ? { ...t, [key]: value === '' ? '' : Number(value) } : t) }));
  const agregarTramo = () =>
    setF(f => {
      const ult = f.tramos[f.tramos.length - 1];
      const desde = ult ? Number(ult.max_pax) + 1 : 2;
      return { ...f, tramos: [...f.tramos, { min_pax: desde, max_pax: desde + 1, discount_pct: (Number(ult?.discount_pct) || 0) + 5 }] };
    });
  const eliminarTramo = (i) =>
    setF(f => ({ ...f, tramos: f.tramos.filter((_, idx) => idx !== i) }));

  // ── Opciones de la Ruleta de descuentos ──
  const actualizarOpcRuleta = (i, key, value) =>
    setF(f => ({ ...f, ruletaOpciones: f.ruletaOpciones.map((o, idx) => idx === i ? { ...o, [key]: value } : o) }));
  const agregarOpcRuleta = () =>
    setF(f => ({ ...f, ruletaOpciones: [...f.ruletaOpciones, { premio: '', prob: '' }] }));
  const eliminarOpcRuleta = (i) =>
    setF(f => ({ ...f, ruletaOpciones: f.ruletaOpciones.filter((_, idx) => idx !== i) }));
  const probTotalRuleta = editForm.ruletaOpciones.reduce((s, o) => s + (Number(o.prob) || 0), 0);

  function handleImageFiles(files) {
    files.filter(f => f.type.startsWith('image/')).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => setF(f => ({ ...f, imagenes: [...f.imagenes, { src: e.target.result, file }] }));
      reader.readAsDataURL(file);
    });
  }

  function doStartEdit(o) {
    setEditingOferta(o);
    const badgeStr = o.badge || (o.descuento ? `${o.descuento}%` : '');
    // Inferimos el tipo de descuento a partir del badge (no se persiste todavía).
    const tipoInferido = o.esGrupal || o.is_group ? 'porcentaje'
      : /x\s*\d|\d\s*x/i.test(badgeStr) ? 'multiplicador'
      : /%/.test(badgeStr) ? 'porcentaje'
      : badgeStr ? 'extra' : 'porcentaje';
    // FLASH: reconstruimos las horas restantes a partir de la fecha límite guardada.
    const horasRestantes = o.flashFechaFin
      ? Math.min(72, Math.max(1, Math.ceil((new Date(o.flashFechaFin).getTime() - Date.now()) / 3600000)))
      : 24;
    setEditForm({
      tipoDescuento: tipoInferido,
      titulo: o.titulo || '',
      // Sólo persiste el badge (primer descuento); las tarifas extra no se guardan aún.
      descuentos: Array.isArray(o.descuentos) && o.descuentos.length ? o.descuentos : [{ tarifa: 'todas', valor: badgeStr }],
      desc: o.desc || '',
      formatos: Array.isArray(o.formatos) ? o.formatos : (o.tipo === 'flash' ? ['flash'] : []),
      flashHoras: horasRestantes,
      ruletaOpciones: Array.isArray(o.ruletaOpciones) && o.ruletaOpciones.length ? o.ruletaOpciones : [{ premio: '', prob: '' }],
      basePricePp: o.basePricePp ?? '',
      tramos: Array.isArray(o.tramos) && o.tramos.length ? o.tramos : [{ min_pax: 2, max_pax: 4, discount_pct: 10 }],
      happyDesde: o.happyDesde || '15:00', happyHasta: o.happyHasta || '18:00',
      ahorro: o.ahorro ?? '',
      precio: o.precio ?? '',
      activa: o.activa !== false,
      imagenes: o.imagenes?.length > 0 ? o.imagenes : o.img ? [{ src: o.img, file: null }] : [],
      desdeModo: o.fechaDesde ? 'especifica' : 'hoy',
      hastaModo: o.fechaHasta ? 'especifica' : 'manual',
      fechaDesde: o.fechaDesde || null,
      fechaHasta: o.fechaHasta || null,
      requiereReserva: o.requiereReserva ?? esAlojamientoNegocio,
    });
    lastFileRef.current = null; lastUrlRef.current = null;
    // Si reabrimos un borrador, sus cambios siguen actualizando esa misma fila.
    borradorIdRef.current = (o.borrador && esUuid(o.id)) ? o.id : null;
    setIsDirty(false);
    setCampoActivo(null); setSaveStatus('idle'); setSaveDelayMs(3000);
  }

  function doStartNew() {
    setEditingOferta('new');
    setEditForm(EMPTY_FORM);
    lastFileRef.current = null; lastUrlRef.current = null;
    borradorIdRef.current = null;
    clearTimeout(draftTimerRef.current);
    setIsDirty(false);
    setCampoActivo(null); setSaveStatus('idle'); setSaveDelayMs(3000);
  }

  function tryNav(action) {
    if (isDirty) { pendingNav.current = action; setUnsavedModal(true); }
    else action();
  }

  function startEdit(o) { tryNav(() => { doStartEdit(o); setEditorAbierto(true); }); }
  function startNew()   { tryNav(() => { doStartNew(); setEditorAbierto(true); }); }

  // Sube la foto a storage una sola vez (cachea por File) y devuelve la URL pública.
  async function subirImagenOferta() {
    const primera = editForm.imagenes[0];
    if (!primera) return editingOferta !== 'new' ? (editingOferta?.img || null) : null;
    if (primera.file) {
      if (primera.file === lastFileRef.current && lastUrlRef.current) return lastUrlRef.current;
      try {
        const ext = (primera.file.name.split('.').pop() || 'jpg').toLowerCase();
        const { data: up } = await supabase.storage.from('negocios')
          .upload(`promos/${negocioId}/${Date.now()}.${ext}`, primera.file, { upsert: true });
        if (up) { const { data: ud } = supabase.storage.from('negocios').getPublicUrl(up.path); lastFileRef.current = primera.file; lastUrlRef.current = ud.publicUrl; return ud.publicUrl; }
      } catch { /* reintentable en el próximo guardado */ }
      return editingOferta !== 'new' ? (editingOferta?.img || null) : null;
    }
    return primera.src;
  }

  // Arma el payload de `promociones` a partir del form (sin validar; sirve para borrador y final).
  function construirBasePayload(imagenUrl) {
    const esGrupal = editForm.formatos.includes('grupal');
    const esFlash  = editForm.formatos.includes('flash');
    const tramosOrden = [...editForm.tramos]
      .map(t => ({ min_pax: Number(t.min_pax), max_pax: Number(t.max_pax), discount_pct: Number(t.discount_pct) }))
      .sort((a, b) => a.min_pax - b.min_pax);
    if (esGrupal && tramosOrden.length && Number.isFinite(pisoPctGrupal)) tramosOrden[0].discount_pct = pisoPctGrupal;
    const grupoPayload = esGrupal
      ? { is_group: true, group_min_pax: tramosOrden[0]?.min_pax, group_max_pax: tramosOrden[tramosOrden.length - 1]?.max_pax, base_price_pp: editForm.basePricePp ? Number(editForm.basePricePp) : null, group_tiers: tramosOrden }
      : { is_group: false, group_min_pax: null, group_max_pax: null, base_price_pp: null, group_tiers: null };
    return {
      titulo:          sanitizeTituloOferta(editForm.titulo).trim(), // NOT NULL en DB → string vacío si aún no escribió
      badge:           badgeValor || null,
      descuentos:      editForm.descuentos,               // desglose por tarifa (jsonb)
      descripcion:     editForm.desc || null,
      imagen_url:      imagenUrl,
      offer_type:      esFlash ? 'Flash' : 'Normal',
      ahorro_estimado: editForm.ahorro ? Number(editForm.ahorro) : null,
      precio_manual:   editForm.precio ? Number(editForm.precio) : null,
      fecha_fin_flash: esFlash && Number(editForm.flashHoras) > 0 ? new Date(Date.now() + Math.min(72, Number(editForm.flashHoras)) * 3600000).toISOString() : null,
      fecha_fin:       !esFlash && editForm.fechaHasta ? editForm.fechaHasta.toISOString() : null,
      fecha_inicio:    !esFlash && editForm.fechaDesde ? editForm.fechaDesde.toISOString() : null,
      negocio_id:      negocioId,
      requiere_reserva: !!editForm.requiereReserva,
      ...grupoPayload,
    };
  }

  // Guarda/actualiza el borrador (autosave). Requiere foto; no valida ni muestra toasts.
  // Devuelve true sólo si de verdad persistió algo (para el ícono de guardado por campo).
  async function guardarBorrador() {
    if (manualSavingRef.current || draftSavingRef.current || savingOferta) return false;
    if (!negocioId) return false;
    if (!editForm.imagenes[0]?.src) return false;                 // sin foto no se guarda borrador
    const esDraftActual = editingOferta === 'new' || editingOferta?.borrador;
    if (!esDraftActual) return false;                             // no autosalvar ofertas ya enviadas/aprobadas
    draftSavingRef.current = true;
    try {
      const imagenUrl = await subirImagenOferta();
      if (!imagenUrl) return false;                               // la foto no llegó a persistir
      const payload = { ...construirBasePayload(imagenUrl), borrador: true, activa: false, aprobada: false };
      // Usamos un ref (no el closure de editingOferta) para no insertar dos veces el mismo borrador.
      const draftId = borradorIdRef.current || (esUuid(editingOferta?.id) ? editingOferta.id : null);
      // Sin .single()/.maybeSingle() (piden un objeto único y Postgrest devuelve 406 igual con 0 filas).
      // Con el array: si el borrador ya no existe (borrado en otro lado) el update devuelve [] con 200 OK,
      // no es un error — se reinserta uno nuevo para que el autosave se auto-repare.
      let row = null;
      if (draftId) {
        const { data } = await supabase.from('promociones').update(payload).eq('id', draftId).select();
        row = data?.[0] || null;
        if (!row) borradorIdRef.current = null;
      }
      if (!row) {
        const { data } = await supabase.from('promociones').insert(payload).select();
        row = data?.[0] || null;
      }
      if (row) {
        borradorIdRef.current = row.id;
        const item = dbRowToItem(row);
        setOfertas(prev => prev.some(o => o.id === item.id) ? prev.map(o => o.id === item.id ? item : o) : [...prev, item]);
        setEditingOferta(item);   // a partir de acá, los cambios actualizan este borrador
        setIsDirty(false);
        return true;
      }
      return false;
    } catch { return false; /* se reintenta en el próximo cambio */ }
    finally { draftSavingRef.current = false; }
  }

  // Autoguardado de una oferta ya persistida (enviada o publicada): guarda los cambios in-place,
  // sin tocar `aprobada` (mismo comportamiento que "Guardar cambios" manual sobre una oferta existente).
  async function autosaveExistente() {
    if (manualSavingRef.current || draftSavingRef.current || savingOferta) return false;
    if (!negocioId || !esUuid(editingOferta?.id)) return false;
    // No autoguardar un estado a medio escribir sobre una oferta ya pública (ej. título vacío
    // mientras lo está reescribiendo): esperamos a que vuelva a cumplir lo mínimo publicable.
    if (!editForm.titulo.trim() || !editForm.descuentos.some(d => (d.valor || '').trim())) return false;
    draftSavingRef.current = true;
    try {
      const imagenUrl = await subirImagenOferta();
      if (!imagenUrl) return false;
      const payload = { ...construirBasePayload(imagenUrl), activa: editForm.activa };
      const { data } = await supabase.from('promociones').update(payload).eq('id', editingOferta.id).select();
      const row = data?.[0];
      if (row) {
        const item = dbRowToItem(row);
        setOfertas(prev => prev.map(o => o.id === item.id ? item : o));
        setEditingOferta(item);
        setIsDirty(false);
        return true;
      }
      return false;
    } catch { return false; /* se reintenta en el próximo cambio */ }
    finally { draftSavingRef.current = false; }
  }

  // Autoguardado unificado: borrador/nueva (requiere foto) u oferta ya persistida (in-place).
  // Devuelve si realmente guardó, para que el ícono por campo sepa si mostrar la tilde o no.
  async function autosave() {
    if (editingOferta === 'new' || editingOferta?.borrador) {
      if (!editForm.imagenes[0]?.src) return false;
      return guardarBorrador();
    }
    return autosaveExistente();
  }

  // Corre el autoguardado mostrando el ícono de estado en el campo que lo disparó: gris
  // mientras está en vuelo, tilde verde si terminó bien. Si para cuando resuelve el socio
  // ya se movió a escribir otro campo, no le pisamos el ícono a ese campo nuevo.
  async function autosaveConIcono() {
    const campoDeEsteGuardado = campoActivoRef.current;
    setSaveStatus('saving');
    const ok = await autosave();
    if (campoActivoRef.current === campoDeEsteGuardado) setSaveStatus(ok ? 'saved' : 'idle');
  }

  // Debounce: los campos de texto esperan 3s de inactividad (además del flush inmediato al
  // salir del campo, ver onBlur del panel más abajo); selects y on/off (saveDelayMs = 0, ver
  // setFInstante) se autoguardan ya, sin esperar nada.
  useEffect(() => {
    if (modoAdmin) return;   // el superadmin guarda con un botón explícito, sin autoguardado
    if (!isDirty) return;
    draftTimerRef.current = setTimeout(() => { autosaveConIcono(); }, saveDelayMs);
    return () => clearTimeout(draftTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editForm, editingOferta, isDirty, saveDelayMs]);

  // Modo "solo editor" (drawer del superadmin): al montar, abre directamente la oferta indicada.
  useEffect(() => {
    if (ofertaInicial) doStartEdit(dbRowToItem(ofertaInicial));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ofertaInicial?.id]);

  // Flush inmediato: al salir de cualquier campo del panel (blur), si hay cambios pendientes,
  // se guarda al instante en vez de esperar el debounce de 3s.
  function handlePanelBlur() {
    if (modoAdmin) return;   // sin autoguardado en el panel del superadmin
    if (!isDirty) return;
    clearTimeout(draftTimerRef.current);
    autosaveConIcono();
  }

  async function saveEdit(thenRun) {
    if (savingOferta) return false;
    if (!editForm.imagenes[0]?.src) { showToast('Subí una foto para la oferta', 'err'); return false; }
    if (!sanitizeTituloOferta(editForm.titulo).trim()) { showToast('El título es obligatorio y solo puede tener letras y números', 'err'); return false; }
    if (!editForm.descuentos.some(d => (d.valor || '').trim())) { showToast('Cargá al menos un descuento', 'err'); return false; }

    const esGrupal = editForm.formatos.includes('grupal');

    // El mín/máx de personas se derivan del primer y último tramo (ya no se piden aparte).
    const tramosOrden = [...editForm.tramos]
      .map(t => ({ min_pax: Number(t.min_pax), max_pax: Number(t.max_pax), discount_pct: Number(t.discount_pct) }))
      .sort((a, b) => a.min_pax - b.min_pax);
    // El % del primer rango (piso) lo fija la etiqueta, no es editable.
    if (esGrupal && tramosOrden.length && Number.isFinite(pisoPctGrupal)) {
      tramosOrden[0].discount_pct = pisoPctGrupal;
    }
    const grupoMin = tramosOrden[0]?.min_pax;
    const grupoMax = tramosOrden[tramosOrden.length - 1]?.max_pax;

    if (esGrupal) {
      if (!Number.isFinite(pisoPctGrupal)) { showToast('Poné el % en la etiqueta (arriba) para la oferta grupal', 'err'); return false; }
      const { ok, errores } = validarTramos({
        minPax: grupoMin, maxPax: grupoMax,
        basePricePp: editForm.basePricePp, tramos: tramosOrden,
      });
      if (!ok) { showToast(errores[0], 'err'); return false; }
    }

    // Sin negocio asociado (no debería pasar para un socio logueado): guardado local.
    if (!negocioId) {
      const data = { ...editForm };
      if (editingOferta === 'new') {
        const o = { id: Date.now(), ...data, img: data.imagenes[0]?.src || null };
        setOfertas(prev => [...prev, o]); setEditingOferta(o);
      } else {
        const updated = { ...data, img: data.imagenes[0]?.src || editingOferta.img || null };
        setOfertas(prev => prev.map(o => o.id === editingOferta.id ? { ...o, ...updated } : o));
        setEditingOferta(prev => ({ ...prev, ...updated }));
      }
      setIsDirty(false); showToast('Cambios guardados', 'ok');
      if (thenRun) thenRun();
      return true;
    }

    // Un guardado manual cancela el autosave pendiente y bloquea el borrador durante el envío.
    manualSavingRef.current = true;
    clearTimeout(draftTimerRef.current);
    setSavingOferta(true);

    const eraBorrador = editingOferta !== 'new' && editingOferta?.borrador;
    const editingIsDb = editingOferta !== 'new' && esUuid(editingOferta.id);
    let itemGuardado = null;

    try {
      const imagenUrl = await subirImagenOferta();
      const base = construirBasePayload(imagenUrl);
      let row;
      if (!editingIsDb) {
        // Alta directa (sin borrador previo): queda pendiente de aprobación.
        const { data, error } = await supabase.from('promociones')
          .insert({ ...base, borrador: false, activa: false, aprobada: false }).select().single();
        if (error) throw error;
        row = data;
      } else {
        // Edición o finalización de un borrador → deja de ser borrador; se envía para aprobación.
        const { data, error } = await supabase.from('promociones')
          .update({ ...base, borrador: false, activa: editForm.activa }).eq('id', editingOferta.id).select().single();
        if (error) throw error;
        row = data;
      }
      itemGuardado = dbRowToItem(row);
      setOfertas(prev => editingOferta === 'new'
        ? [...prev, itemGuardado]
        : prev.map(o => o.id === editingOferta.id ? itemGuardado : o));
      setEditingOferta(itemGuardado);
      // El superadmin actualiza su fila en memoria (sin recargar toda la lista → no pierde el scroll).
      onOfertaGuardada?.(row);
    } catch (err) {
      setSavingOferta(false);
      manualSavingRef.current = false;
      showToast(err?.message || 'Error al guardar la oferta', 'err');
      return false;
    }

    setSavingOferta(false);
    manualSavingRef.current = false;
    borradorIdRef.current = null;   // ya dejó de ser borrador
    setIsDirty(false);
    // Un borrador finalizado o una alta directa → "enviada para aprobación".
    const enviadaAprobacion = eraBorrador || !editingIsDb;
    showToast(enviadaAprobacion ? 'Oferta enviada para aprobación' : 'Cambios guardados', 'ok');
    if (thenRun) thenRun();
    if (enviadaAprobacion && itemGuardado) setInvitacionTarget(itemGuardado);
    return true;
  }

  // Ambos botones de eliminar (el del header y el de Acciones) abren la misma advertencia;
  // la baja real recién ocurre si el socio confirma en el modal.
  function deleteEditing() {
    if (!editingOferta || editingOferta === 'new') return;
    setDeleteConfirmModal(true);
  }

  async function confirmarEliminar() {
    setDeleteConfirmModal(false);
    if (!editingOferta || editingOferta === 'new') return;
    if (esUuid(editingOferta.id)) {
      const { error } = await supabase.from('promociones').delete().eq('id', editingOferta.id);
      if (error) { showToast('No se pudo eliminar la oferta', 'err'); return; }
    }
    setOfertas(prev => prev.filter(o => o.id !== editingOferta.id));
    doStartNew();
    showToast('Oferta eliminada', 'ok');
  }

  async function toggleActiva(id) {
    const target = ofertas.find(o => o.id === id);
    const next = !(target?.activa);
    if (esUuid(id)) {
      const { error } = await supabase.from('promociones').update({ activa: next }).eq('id', id);
      if (error) { showToast('No se pudo actualizar el estado', 'err'); return; }
    }
    setOfertas(prev => prev.map(o => o.id === id ? { ...o, activa: next } : o));
    if (editingOferta?.id === id) setEditForm(f => ({ ...f, activa: next }));
    showToast('Estado actualizado', 'ok');
  }

  // Descuentos por tarifa de una oferta (con fallback al badge para datos viejos/mock).
  const tarifaLabel = (id) => TARIFAS.find(t => t.id === id)?.label || 'Todas las tarifas';
  const descuentosDeOferta = (o) => {
    if (Array.isArray(o.descuentos) && o.descuentos.length) return o.descuentos.filter(d => d && d.valor);
    const b = o.badge || (o.descuento ? `${o.descuento}%` : '');
    return b ? [{ tarifa: 'todas', valor: b }] : [];
  };
  // Etiqueta corta (grilla): formato activo o, si no, la tarifa del primer descuento.
  const etiquetaFormato = (o) => {
    if (Array.isArray(o.formatos) && o.formatos.length) return formatoDe(o.formatos[0])?.label || '';
    return descuentosDeOferta(o)[0] ? tarifaLabel(descuentosDeOferta(o)[0].tarifa) : '';
  };

  function OfertaCardGrid({ o, idx }) {
    const img = o.img || PLACEHOLDER_IMGS[idx % PLACEHOLDER_IMGS.length];
    const isSel = editingOferta && editingOferta !== 'new' && editingOferta.id === o.id;
    return (
      <div onClick={() => startEdit(o)} style={{ background: CARD, border: `2px solid ${isSel ? P : LINE}`, borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: FONT, transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s', boxShadow: isSel ? `0 0 0 3px ${PS}` : 'none', cursor: 'pointer' }}
        onMouseEnter={e => { if (!isSel) { e.currentTarget.style.boxShadow = '0 12px 40px -12px rgba(11,16,32,0.18)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
        onMouseLeave={e => { if (!isSel) { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; } }}
      >
        <div style={{ position: 'relative', height: 150, overflow: 'hidden' }}>
          <img src={img} alt={o.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,16,32,0.7) 0%, rgba(11,16,32,0.1) 55%, transparent 100%)' }}/>
          <div style={{ position: 'absolute', bottom: 10, left: 12 }}>
            <div style={{ color: '#fff', fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{o.badge || (o.descuento ? `${o.descuento}%` : '')}</div>
          </div>
          <div style={{ position: 'absolute', top: 10, left: 10, background: o.borrador ? 'rgba(245,158,11,0.92)' : o.activa ? 'rgba(16,185,129,0.85)' : 'rgba(100,116,139,0.7)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 999, letterSpacing: o.borrador ? '0.06em' : 'normal' }}>
            {o.borrador ? 'BORRADOR' : o.activa ? 'Activa' : 'Inactiva'}
          </div>
          {o.impulsoActivo && (
            <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(124,58,237,0.9)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999 }}>
              <TrendingUp size={11}/> Impulsada
            </div>
          )}
        </div>
        <div style={{ padding: '11px 13px 13px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>{etiquetaFormato(o)}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: INK, lineHeight: 1.3, flex: 1 }}>{o.titulo}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            {o.borrador ? (
              <span style={{ fontSize: 11, fontWeight: 700, color: YELLOW, flex: 1 }}>Borrador · seguí editando</span>
            ) : (
              <>
                <div onClick={e => e.stopPropagation()}>
                  <Toggle on={o.activa} onChange={() => toggleActiva(o.id)}/>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: o.activa ? GREEN : MUTED, flex: 1 }}>{o.activa ? 'Activa' : 'Inactiva'}</span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  function OfertaRowList({ o, idx }) {
    const isSel = editingOferta && editingOferta !== 'new' && editingOferta.id === o.id;
    const img = o.img || PLACEHOLDER_IMGS[(idx || 0) % PLACEHOLDER_IMGS.length];
    const descs = descuentosDeOferta(o);
    const badge = descs[0]?.valor || '';
    return (
      <div onClick={() => startEdit(o)} style={{ background: CARD, border: `1px solid ${isSel ? P : LINE}`, borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 13, fontFamily: FONT, cursor: 'pointer', boxShadow: isSel ? `0 0 0 3px ${PS}` : 'none' }}>
        {/* Foto con el badge de descuento (bold, fondo negro) */}
        <div style={{ position: 'relative', width: 66, height: 66, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: BG }}>
          <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
          {badge && (
            <div style={{ position: 'absolute', bottom: 4, left: 4, background: '#0b1020', color: '#fff', fontSize: 12, fontWeight: 900, padding: '2px 6px', borderRadius: 6, lineHeight: 1.15, maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{badge}</div>
          )}
        </div>
        {/* Título + desglose por tarifa (uno abajo del otro si hay varios) */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {o.titulo || <span style={{ color: MUTED, fontWeight: 600 }}>Sin título</span>}
          </div>
          <div style={{ marginTop: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {descs.length ? descs.map((d, i) => (
              <div key={i} style={{ fontSize: 11.5, color: INK2 }}>
                <b style={{ color: INK }}>{d.valor}</b> <span style={{ color: MUTED }}>· {tarifaLabel(d.tarifa)}</span>
              </div>
            )) : <div style={{ fontSize: 11.5, color: MUTED }}>Sin descuento cargado</div>}
          </div>
        </div>
        {/* Estado */}
        {o.borrador ? (
          <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: YELLOW, padding: '3px 9px', borderRadius: 999, letterSpacing: '0.06em', flexShrink: 0 }}>BORRADOR</span>
        ) : (
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <Toggle on={o.activa} onChange={() => toggleActiva(o.id)}/>
            <span style={{ fontSize: 11, fontWeight: 600, color: o.activa ? GREEN : MUTED, minWidth: 44 }}>{o.activa ? 'Activa' : 'Inactiva'}</span>
          </div>
        )}
        <button onClick={e => { e.stopPropagation(); startEdit(o); }} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${isSel ? P : LINE}`, background: isSel ? PS : '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer', color: isSel ? P : INK2, flexShrink: 0 }}>
          <Edit2 size={13}/>
        </button>
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

  const inputSt = { width: '100%', padding: '9px 12px', borderRadius: 9, border: `1px solid ${LINE}`, fontFamily: FONT, fontSize: 13, color: INK, outline: 'none', boxSizing: 'border-box', background: '#fff' };
  const labelSt = { fontFamily: FONT, fontSize: 10, fontWeight: 700, color: INK2, textTransform: 'uppercase', letterSpacing: '0.06em' };
  // Caja neutra que se despliega bajo cada opción activa (estilo minimalista, sin colores fuera del sistema).
  const cfgBox = { marginTop: 4, marginBottom: 6, marginLeft: 30, padding: '12px 14px', background: BG, border: `1px solid ${LINE}`, borderRadius: 12 };
  const cfgLabel = { ...labelSt, display: 'block', marginBottom: 8 };

  const FieldLabel = ({ label, val, max }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
      <span style={labelSt}>{label}</span>
      {max && <span style={{ fontFamily: FONT, fontSize: 10, color: (val||'').length >= max ? '#ef4444' : MUTED }}>{(val||'').length}/{max}</span>}
    </div>
  );

  return (
    <>
    <div style={{ display: 'flex', alignItems: 'stretch', margin: soloEditor ? 0 : -28, height: soloEditor ? '100%' : '100vh', overflow: 'hidden' }}>

      {/* ─── Left: lista (scroll propio) — oculta en modo solo editor ─── */}
      {!soloEditor && (
      <div style={{ flex: 1, minWidth: 0, padding: 28, paddingRight: 20, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>

        {onboarding ? (
          <>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                {onVolver && (
                  <button type="button" onClick={onVolver}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: MUTED, fontFamily: FONT, fontSize: 13, fontWeight: 600, flexShrink: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.color = INK)}
                    onMouseLeave={e => (e.currentTarget.style.color = MUTED)}>
                    <ArrowLeft size={16} /> Volver
                  </button>
                )}
                <h2 style={{ fontFamily: FONT, fontSize: 22, fontWeight: 800, color: INK, margin: 0 }}>Cargá tu primera oferta</h2>
              </div>
              <p style={{ fontFamily: FONT, fontSize: 13, color: INK2, margin: 0, lineHeight: 1.5 }}>
                Tiene las mismas opciones que después vas a tener en tu panel. Completala a la derecha, o dejalo para más tarde.
              </p>
            </div>
            <button onClick={onSkip}
              style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 10, padding: '10px 16px', fontFamily: FONT, fontSize: 13, fontWeight: 700, color: INK2, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = P; e.currentTarget.style.color = P; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = LINE; e.currentTarget.style.color = INK2; }}
            >
              {ofertas.length > 0 ? 'Continuar →' : 'Omitir este paso por ahora →'}
            </button>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontFamily: FONT, fontSize: 20, fontWeight: 700, color: INK, margin: 0, flex: 1 }}>Ofertas creadas por mí</h2>
              <div style={{ display: 'flex', border: `1px solid ${LINE}`, borderRadius: 10, overflow: 'hidden' }}>
                {[{ grid: true, icon: <IcoGrid/> }, { grid: false, icon: <IcoList/> }].map(({ grid, icon }) => (
                  <button key={String(grid)} onClick={() => setVistaGrid(grid)} style={{ width: 34, height: 34, border: 'none', background: vistaGrid === grid ? PS : 'transparent', color: vistaGrid === grid ? P : MUTED, display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
        {vistaGrid ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 14 }}>
            <button onClick={startNew}
              style={{ background: editingOferta === 'new' ? PS : 'transparent', border: `2px dashed ${editingOferta === 'new' ? P : LINE}`, borderRadius: 20, minHeight: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', color: editingOferta === 'new' ? P : MUTED, fontFamily: FONT }}
              onMouseEnter={e => { if (editingOferta !== 'new') { e.currentTarget.style.borderColor = P; e.currentTarget.style.background = PS; e.currentTarget.style.color = P; } }}
              onMouseLeave={e => { if (editingOferta !== 'new') { e.currentTarget.style.borderColor = LINE; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = MUTED; } }}
            >
              <div style={{ width: 44, height: 44, borderRadius: '50%', border: '2px dashed currentColor', display: 'grid', placeItems: 'center' }}><Plus size={20}/></div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Crear cupón</span>
            </button>
            {ofertas.length > 0 && <RendimientoCard plan={plan} onUpgrade={onUpgrade} />}
            {[...ofertas].reverse().map((o, idx) => <OfertaCardGrid key={o.id} o={o} idx={idx}/>)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...ofertas].reverse().map((o, idx) => <OfertaRowList key={o.id} o={o} idx={idx}/>)}
            <button onClick={startNew} style={{ background: 'transparent', border: `2px dashed ${LINE}`, borderRadius: 12, padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', color: MUTED, fontFamily: FONT, fontSize: 13, fontWeight: 600 }}>
              <Plus size={16} color={MUTED}/> Crear cupón de oferta
            </button>
          </div>
        )}

      </div>
      )}

      {/* ─── Separator + panel de edición (se puede cerrar con la X) ─── */}
      {editorAbierto && !soloEditor && <div style={{ width: 1, background: LINE, flexShrink: 0 }}/>}

      {editorAbierto && (
      <div style={{ width: soloEditor ? '100%' : '36%', flexShrink: 0, height: '100%', background: CARD, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header panel */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: PS, flexShrink: 0 }}>
          <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: P }}>
            {editingOferta === 'new' ? 'Crear cupón' : 'Editar oferta'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Superadmin: guardado explícito arriba a la derecha (sin autoguardado) */}
            {modoAdmin && (
              <button onClick={() => saveEdit(() => (soloEditor && onCerrarEditor ? onCerrarEditor() : setEditorAbierto(false)))} disabled={savingOferta || !camposCompletos}
                title="Guardar y cerrar"
                style={{ background: (camposCompletos && !savingOferta) ? P : LINE, color: (camposCompletos && !savingOferta) ? '#fff' : MUTED, border: 'none', borderRadius: 8, padding: '7px 14px', fontFamily: FONT, fontSize: 13, fontWeight: 700, cursor: (savingOferta || !camposCompletos) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <Save size={14}/> {savingOferta ? 'Guardando…' : 'Guardar y cerrar'}
              </button>
            )}
            {editingOferta !== 'new' && (
              <button onClick={deleteEditing} title="Eliminar oferta" style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #fecaca', background: '#fff', cursor: 'pointer', color: '#ef4444', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Trash2 size={13}/>
              </button>
            )}
            <button onClick={() => tryNav(() => (soloEditor && onCerrarEditor ? onCerrarEditor() : setEditorAbierto(false)))} title="Cerrar panel" style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${LINE}`, background: '#fff', cursor: 'pointer', color: INK2, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <X size={15}/>
            </button>
          </div>
        </div>

        {/* Header fijo "Aumentar visibilidad": sólo al editar un cupón ya publicado (no en alta ni en borrador). Oculto para el superadmin. */}
        {!modoAdmin && editingOferta !== 'new' && !editingOferta.borrador && esUuid(editingOferta.id) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', background: '#fff7ed', borderBottom: '1px solid #fed7aa', flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: '#ffedd5', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <TrendingUp size={16} color="#ea580c"/>
            </div>
            <span style={{ flex: 1, fontFamily: FONT, fontSize: 12.5, fontWeight: 700, color: '#9a3412', lineHeight: 1.3 }}>
              {editingOferta.impulsoActivo
                ? <>Impulsada · {Math.round((editingOferta.impulsoRestante || 0) * 100) / 100} créd. restantes</>
                : 'Aumentá la visibilidad de este cupón'}
            </span>
            <button onClick={() => setInvitacionTarget(editingOferta)}
              style={{ flexShrink: 0, background: '#ea580c', color: '#fff', border: 'none', borderRadius: 9, padding: '7px 12px', fontFamily: FONT, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {editingOferta.impulsoActivo ? 'Sumar más' : 'Dar impulso'}
            </button>
          </div>
        )}

        {/* Contenido del panel */}
        <div className="oferta-editor-form" onBlur={handlePanelBlur} style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>

          {/* ── 1) Foto de la oferta (arriba de todo, proporción 4/3 como el frontend) ── */}
          <div>
            <FieldLabel label=""/>
            {editForm.imagenes[0]?.src ? (
              <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: `1px solid ${LINE}`, aspectRatio: '4 / 3', background: BG }}>
                <img src={editForm.imagenes[0].src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
                {/* Preview en vivo — mismo formato/posición que la minificha (OfertaCard):
                    sin título, el descuento queda abajo del todo; al escribir el título, sube. */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,16,32,0.75) 0%, rgba(11,16,32,0.15) 55%, transparent 100%)', pointerEvents: 'none' }}/>
                {/* Chips de las opciones activas (Happy Hour no se muestra: va sólo en el detalle) */}
                <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexWrap: 'wrap', gap: 5, maxWidth: '70%', pointerEvents: 'none' }}>
                  {editForm.formatos.filter(fid => fid !== 'happyhour').map(fid => {
                    const f = formatoDe(fid);
                    if (!f) return null;
                    return (
                      <div key={fid} style={{ display: 'flex', alignItems: 'center', gap: 4, background: f.color, borderRadius: 6, padding: '3px 8px 3px 6px', boxShadow: '0 2px 6px rgba(0,0,0,0.25)' }}>
                        <f.Icon size={11} color="#fff"/>
                        <span style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: 800, color: '#fff', letterSpacing: '0.02em' }}>{f.label}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 16px 15px', pointerEvents: 'none' }}>
                  {badgeValor && (
                    <div style={{ fontFamily: FONT, fontSize: badgeValor.length > 5 ? 30 : 42, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{badgeValor}</div>
                  )}
                  {editForm.titulo && (
                    <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.92)', lineHeight: 1.3, marginTop: 6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{editForm.titulo}</div>
                  )}
                </div>
                <button onClick={() => setF(f => ({ ...f, imagenes: [] }))} title="Eliminar foto"
                  style={{ position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: '50%', background: 'rgba(15,23,42,0.6)', border: 'none', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 0 }}>
                  <X size={15}/>
                </button>
              </div>
            ) : (
              <div onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleImageFiles(Array.from(e.dataTransfer.files)); }}
                style={{ border: `1.5px dashed ${LINE}`, borderRadius: 14, aspectRatio: '4 / 3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', color: MUTED, background: BG }}>
                <Upload size={22} style={{ opacity: 0.6 }}/>
                <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: INK2 }}>Imagen de la oferta</span>
                <span style={{ fontFamily: FONT, fontSize: 11.5, fontStyle: 'italic' }}>(Formato .jpg ó .png))</span>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
              onChange={e => { handleImageFiles(Array.from(e.target.files)); e.target.value = ''; }}/>
          </div>

          {/* El resto del formulario se habilita recién al subir la foto (sólo para una oferta nueva) */}
          {!mostrarRestoForm ? (
            <div style={{ fontFamily: FONT, fontSize: 12.5, color: MUTED, fontStyle: 'italic', textAlign: 'center', padding: '2px 0' }}>
              Subí una foto para cargar el resto de la oferta.
            </div>
          ) : (
          <>
          {/* ── 2) Tipo de oferta ── */}
          <div>
            <FieldLabel label="Tipo de oferta"/>
            <select value={editForm.tipoDescuento} onChange={e => setTipoDescuento(e.target.value)}
              style={{ ...inputSt, cursor: 'pointer' }}>
              {TIPOS_DESCUENTO.map(td => <option key={td.id} value={td.id}>{td.label}</option>)}
            </select>
          </div>

          {/* ── 3) Descuento por tarifa (repetible) ── */}
          <div>
            <FieldLabel label="Descuento por tarifa"/>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {editForm.descuentos.map((d, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <select value={d.tarifa} onChange={e => actualizarDescuento(i, 'tarifa', e.target.value)}
                      style={{ ...inputSt, cursor: 'pointer' }}>
                      {TARIFAS.map(t => <option key={t.id} value={t.id} disabled={tarifaOpcionDisabled(i, t.id)}>{t.label}</option>)}
                    </select>
                    {editForm.descuentos.length > 1 && (
                      <button onClick={() => eliminarDescuento(i)} title="Quitar descuento"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: 4, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <Trash2 size={15}/>
                      </button>
                    )}
                  </div>
                  {editForm.tipoDescuento === 'porcentaje' ? (
                    // Porcentaje: campo compacto, sólo números y el "%" fijo al lado.
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input value={soloNum(d.valor)} inputMode="numeric"
                        onChange={e => { const n = soloNum(e.target.value).slice(0, 3); actualizarDescuento(i, 'valor', n ? `${n}%` : ''); }}
                        placeholder={ejemplosPlaceholder} style={{ ...inputSt, width: 150, flex: 'none' }}/>
                      <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 800, color: INK2 }}>%</span>
                    </div>
                  ) : editForm.tipoDescuento === 'multiplicador' ? (
                    // Multiplicador: dos números con la "x" fija en el medio.
                    (() => {
                      const [a, b] = partesMult(d.valor);
                      const set = (na, nb) => actualizarDescuento(i, 'valor', (na || nb) ? `${na}x${nb}` : '');
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <input value={a} inputMode="numeric" onChange={e => set(soloNum(e.target.value).slice(0, 2), b)}
                            placeholder="2" style={{ ...inputSt, textAlign: 'center', width: 72, flex: 'none' }}/>
                          <span style={{ fontFamily: FONT, fontSize: 17, fontWeight: 800, color: INK2 }}>x</span>
                          <input value={b} inputMode="numeric" onChange={e => set(a, soloNum(e.target.value).slice(0, 2))}
                            placeholder="1" style={{ ...inputSt, textAlign: 'center', width: 72, flex: 'none' }}/>
                        </div>
                      );
                    })()
                  ) : (
                    // Beneficio extra: texto/números, sin signos ni caracteres especiales.
                    <input value={d.valor}
                      onChange={e => actualizarDescuento(i, 'valor', sanitizarExtra(e.target.value).slice(0, 24))}
                      placeholder={ejemplosPlaceholder} style={inputSt}/>
                  )}
                </div>
              ))}
            </div>
            {puedeAgregarDescuento && (
              <button onClick={agregarDescuento}
                style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: P, fontFamily: FONT, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                <Plus size={15}/> Agregar descuento a otra tarifa
              </button>
            )}
          </div>

          {/* ── 4) Título ── */}
          <div>
            <FieldLabel label="En qué será el descuento" val={editForm.titulo} max={80}/>
            <div style={{ position: 'relative' }}>
              <input value={editForm.titulo}
                onChange={e => {
                  const v = sanitizeTituloOferta(e.target.value);
                  if (v.length <= 80) setCampoTexto('titulo', v);
                }}
                placeholder="Ej. En cenas para dos personas" maxLength={80} style={{ ...inputSt, paddingRight: 34 }}/>
              <EstadoGuardadoIcono activo={campoActivo === 'titulo'} status={saveStatus}/>
            </div>
            <p style={{ marginTop: 4, fontSize: 11, color: '#94a3b8' }}>Solo letras y números, sin puntuación ni símbolos (%, -, etc.).</p>
          </div>

          {/* ── 5) Descripción ── */}
          <div>
            <FieldLabel label="Descripción completa" val={editForm.desc} max={300}/>
            <div style={{ position: 'relative' }}>
              <textarea value={editForm.desc}
                onChange={e => e.target.value.length <= 300 && setCampoTexto('desc', e.target.value)}
                placeholder="Condiciones, qué incluye, detalles extra..." maxLength={300} rows={3}
                style={{ ...inputSt, resize: 'vertical', lineHeight: 1.5, paddingRight: 34 }}/>
              <EstadoGuardadoIcono activo={campoActivo === 'desc'} status={saveStatus} style={{ top: 14, transform: 'none' }}/>
            </div>
          </div>

          {/* ── 6) Ahorro declarado → Precio del cupón (auto-sugerido, editable) ── */}
          <div>
            <FieldLabel label="Ahorro estimado para el turista ($)"/>
            <div style={{ position: 'relative' }}>
              <input value={editForm.ahorro} inputMode="numeric"
                onChange={e => {
                  const v = soloNum(e.target.value).slice(0, 9);
                  // Si el precio todavía coincide con el sugerido del ahorro anterior, lo re-sugerimos;
                  // si el socio lo editó a mano, se respeta.
                  setEditForm(f => {
                    const sugeridoPrevio = calcularPrecioCupon(Number(f.ahorro));
                    const eraAuto = !f.precio || Number(f.precio) === sugeridoPrevio;
                    return { ...f, ahorro: v, precio: eraAuto ? String(calcularPrecioCupon(Number(v)) || '') : f.precio };
                  });
                  setIsDirty(true); setCampoActivo('ahorro'); setSaveStatus('idle'); setSaveDelayMs(3000);
                }}
                placeholder="Ej. 5000" style={{ ...inputSt, paddingRight: 34 }}/>
              <EstadoGuardadoIcono activo={campoActivo === 'ahorro'} status={saveStatus}/>
            </div>
            <div style={{ marginTop: 12 }}>
              <FieldLabel label="Precio del cupón ($, IVA incl.)"/>
              <div style={{ position: 'relative' }}>
                <input value={editForm.precio} inputMode="numeric"
                  onChange={e => setCampoTexto('precio', soloNum(e.target.value).slice(0, 9))}
                  placeholder="Ej. 1500" style={{ ...inputSt, paddingRight: 34 }}/>
                <EstadoGuardadoIcono activo={campoActivo === 'precio'} status={saveStatus}/>
              </div>
              {Number(editForm.ahorro) > 0 && Number(editForm.precio) !== calcularPrecioCupon(Number(editForm.ahorro)) && (
                <button type="button"
                  onClick={() => setCampoTexto('precio', String(calcularPrecioCupon(Number(editForm.ahorro)) || ''))}
                  style={{ marginTop: 6, background: 'none', border: 'none', color: P, fontFamily: FONT, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                  Usar sugerido: ${calcularPrecioCupon(Number(editForm.ahorro)).toLocaleString('es-AR')}
                </button>
              )}
            </div>
            <p style={{ marginTop: 6, fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}>El precio se sugiere automáticamente a partir del ahorro declarado, pero podés editarlo.</p>
          </div>
          </>
          )}

          {/* ── 3) y 4) también se habilitan recién al subir la foto (sólo para una oferta nueva) ── */}
          {mostrarRestoForm && (
          <>
          {/* ── 3) Opciones para incluir a tu oferta (segundo en importancia) ── */}
          <div>
            <FieldLabel label="Opciones para incluir a tu oferta"/>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {FORMATOS.map((t, idx) => {
                const on = editForm.formatos.includes(t.id);
                const grupalPorTipo = t.id === 'grupal' && editForm.tipoDescuento !== 'porcentaje';
                const dis = formatoDisabled(t) || grupalPorTipo;
                const descTxt = grupalPorTipo ? 'Disponible sólo para descuentos por porcentaje.'
                  : (dis && exclusivoActivo) ? `No se combina con ${exclusivoActivo.label}.`
                  : t.desc;
                return (
                  <div key={t.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 2px', borderTop: idx > 0 ? `1px solid ${LINE}` : 'none', opacity: dis ? 0.45 : 1 }}>
                      <t.Icon size={18} color={on ? P : INK2} style={{ flexShrink: 0 }}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: INK }}>{t.label}</div>
                        <div style={{ fontFamily: FONT, fontSize: 11.5, color: MUTED, marginTop: 1, lineHeight: 1.4 }}>{descTxt}</div>
                      </div>
                      <div style={{ flexShrink: 0, pointerEvents: dis ? 'none' : 'auto' }}>
                        <Toggle on={on} onChange={() => toggleFormato(t.id)}/>
                      </div>
                    </div>

                    {/* Config neutra desplegable */}
                    {on && t.id === 'flash' && (
                      <div style={cfgBox}>
                        <label style={cfgLabel}>Publicar por</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <input type="number" min={1} max={72} value={editForm.flashHoras}
                            onChange={e => setF(f => ({ ...f, flashHoras: e.target.value === '' ? '' : Math.min(72, Math.max(1, Number(e.target.value))) }))}
                            style={{ ...inputSt, width: 90, flex: 'none' }}/>
                          <span style={{ fontFamily: FONT, fontSize: 13, color: INK2 }}>horas</span>
                        </div>
                        <div style={{ fontFamily: FONT, fontSize: 11.5, color: MUTED, marginTop: 8, lineHeight: 1.4 }}>Máximo 72 horas.</div>
                      </div>
                    )}
                    {on && t.id === 'happyhour' && (
                      <div style={cfgBox}>
                        <label style={cfgLabel}>Rango en que se podrá canjear</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <input type="time" value={editForm.happyDesde} onChange={e => setF(f => ({ ...f, happyDesde: e.target.value }))} style={{ ...inputSt, flex: 1 }}/>
                          <span style={{ fontFamily: FONT, fontSize: 13, color: MUTED }}>a</span>
                          <input type="time" value={editForm.happyHasta} onChange={e => setF(f => ({ ...f, happyHasta: e.target.value }))} style={{ ...inputSt, flex: 1 }}/>
                        </div>
                        <div style={{ fontFamily: FONT, fontSize: 11.5, color: MUTED, marginTop: 8, lineHeight: 1.4 }}>Se muestra sólo en el detalle del cupón.</div>
                      </div>
                    )}
                    {on && t.id === 'ruleta' && (
                      <div style={cfgBox}>
                        <div style={{ fontFamily: FONT, fontSize: 12, color: INK2, lineHeight: 1.5, marginBottom: 14 }}>
                          Se puede girar <b>una vez por semana, por usuario</b>. Elegí las opciones aparecen y con qué frecuencia salen.
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ ...cfgLabel, marginBottom: 0, flex: 1 }}>Opción</span>
                          <span style={{ ...cfgLabel, marginBottom: 0, width: 78, textAlign: 'center' }}>Probabilidad</span>
                          <span style={{ width: 18 }}/>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {editForm.ruletaOpciones.map((op, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <input value={op.premio} onChange={e => actualizarOpcRuleta(i, 'premio', e.target.value)}
                                placeholder="Ej. 30% off" maxLength={40} style={{ ...inputSt, flex: 1 }}/>
                              <div style={{ position: 'relative', width: 78 }}>
                                <input type="number" min={0} max={100} value={op.prob}
                                  onChange={e => actualizarOpcRuleta(i, 'prob', e.target.value)}
                                  placeholder="0" style={{ ...inputSt, paddingRight: 22, textAlign: 'center', fontWeight: 700, color: P }}/>
                                <span style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', color: MUTED, fontFamily: FONT, fontSize: 12, fontWeight: 700 }}>%</span>
                              </div>
                              <button onClick={() => eliminarOpcRuleta(i)} disabled={editForm.ruletaOpciones.length <= 1} title="Quitar opción" style={{ background: 'none', border: 'none', cursor: editForm.ruletaOpciones.length <= 1 ? 'not-allowed' : 'pointer', color: MUTED, opacity: editForm.ruletaOpciones.length <= 1 ? 0.3 : 1, padding: 2, display: 'grid', placeItems: 'center', width: 18 }}>
                                <Trash2 size={14}/>
                              </button>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                          <button onClick={agregarOpcRuleta} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: P, fontFamily: FONT, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                            <Plus size={15}/> Agregar opción
                          </button>
                          <span style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: 600, color: probTotalRuleta === 100 ? GREEN : MUTED }}>
                            Suma: {probTotalRuleta}%
                          </span>
                        </div>
                      </div>
                    )}
                    {on && t.id === 'grupal' && (
                      <div style={cfgBox}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {editForm.tramos.map((t2, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT, fontSize: 12.5, color: INK2 }}>
                              <span>De</span>
                              <input type="number" min={1} value={t2.min_pax} onChange={e => actualizarTramo(i, 'min_pax', e.target.value)} style={{ width: 42, padding: '7px 4px', borderRadius: 8, border: `1px solid ${LINE}`, fontFamily: FONT, fontSize: 12.5, textAlign: 'center', outline: 'none' }}/>
                              <span>a</span>
                              <input type="number" min={1} value={t2.max_pax} onChange={e => actualizarTramo(i, 'max_pax', e.target.value)} style={{ width: 42, padding: '7px 4px', borderRadius: 8, border: `1px solid ${LINE}`, fontFamily: FONT, fontSize: 12.5, textAlign: 'center', outline: 'none' }}/>
                              <span style={{ marginRight: 'auto' }}>pers.</span>
                              {i === 0 ? (
                                <input type="number" value={Number.isFinite(pisoPctGrupal) ? pisoPctGrupal : ''} disabled
                                  title="Piso: es el % de la etiqueta de arriba (no editable)"
                                  style={{ width: 50, padding: '7px 4px', borderRadius: 8, border: `1px solid ${LINE}`, background: BG, fontFamily: FONT, fontSize: 12.5, fontWeight: 700, color: MUTED, textAlign: 'center', outline: 'none', cursor: 'not-allowed' }}/>
                              ) : (
                                <input type="number" min={0} max={100} value={t2.discount_pct} onChange={e => actualizarTramo(i, 'discount_pct', e.target.value)} style={{ width: 50, padding: '7px 4px', borderRadius: 8, border: `1px solid ${LINE}`, background: '#fff', fontFamily: FONT, fontSize: 12.5, fontWeight: 700, color: P, textAlign: 'center', outline: 'none' }}/>
                              )}
                              <span style={{ fontWeight: 600, color: MUTED }}>% off</span>
                              <button onClick={() => eliminarTramo(i)} disabled={editForm.tramos.length <= 1} title="Quitar rango" style={{ background: 'none', border: 'none', cursor: editForm.tramos.length <= 1 ? 'not-allowed' : 'pointer', color: MUTED, opacity: editForm.tramos.length <= 1 ? 0.3 : 1, padding: 2, display: 'grid', placeItems: 'center' }}>
                                <Trash2 size={14}/>
                              </button>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontFamily: FONT, fontSize: 11, color: MUTED, marginTop: 8, lineHeight: 1.4 }}>
                          El primer rango usa el <b>{Number.isFinite(pisoPctGrupal) ? `${pisoPctGrupal}%` : '%'}</b> de la etiqueta como piso; los siguientes deben ser mayores.
                        </div>
                        <button onClick={agregarTramo} style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: P, fontFamily: FONT, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                          <Plus size={15}/> Agregar rango
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 4) Mantener oferta activa: Desde / Hasta (FLASH usa su propia fecha) ── */}
          <div style={{ opacity: editForm.formatos.includes('flash') ? 0.38 : 1, pointerEvents: editForm.formatos.includes('flash') ? 'none' : 'auto', transition: 'opacity 0.2s' }}>
            <FieldLabel label="Mantener oferta activa"/>
            {editForm.formatos.includes('flash') ? (
              <div style={{ fontFamily: FONT, fontSize: 12, color: MUTED, padding: '10px 12px', background: BG, borderRadius: 10, border: `1px solid ${LINE}` }}>
                Las ofertas FLASH usan su propia fecha límite.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ ...labelSt, width: 44, flexShrink: 0, paddingTop: 11 }}>Desde</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <select value={editForm.desdeModo} onChange={e => setDesdeModo(e.target.value)} style={{ ...inputSt, cursor: 'pointer' }}>
                      <option value="hoy">Hoy</option>
                      <option value="especifica">Fecha y hora específica</option>
                    </select>
                    {editForm.desdeModo === 'especifica' && (
                      <input type="datetime-local" value={toLocalDT(editForm.fechaDesde)}
                        onChange={e => setF(f => ({ ...f, fechaDesde: e.target.value ? new Date(e.target.value) : null }))}
                        style={{ ...inputSt, marginTop: 8, accentColor: P }}/>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ ...labelSt, width: 44, flexShrink: 0, paddingTop: 11 }}>Hasta</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <select value={editForm.hastaModo} onChange={e => setHastaModo(e.target.value)} style={{ ...inputSt, cursor: 'pointer' }}>
                      <option value="manual">Que la desactive manualmente</option>
                      <option value="especifica">Fecha y hora específica</option>
                    </select>
                    {editForm.hastaModo === 'especifica' && (
                      <input type="datetime-local" value={toLocalDT(editForm.fechaHasta)}
                        onChange={e => setF(f => ({ ...f, fechaHasta: e.target.value ? new Date(e.target.value) : null }))}
                        style={{ ...inputSt, marginTop: 8, accentColor: P }}/>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Reserva previa: habilita el form de disponibilidad en el detalle del cupón ── */}
          <div>
            <FieldLabel label="Disponibilidad"/>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 2px' }}>
              <CalendarDays size={18} color={editForm.requiereReserva ? P : INK2} style={{ flexShrink: 0 }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: INK }}>El servicio requiere reserva previa</div>
                <div style={{ fontFamily: FONT, fontSize: 11.5, color: MUTED, marginTop: 1, lineHeight: 1.4 }}>
                  Si lo activás, el turista pide disponibilidad (fecha/personas) desde el detalle y vos confirmás. Si no, el cupón se agrega directo a la cuponera.
                </div>
              </div>
              <div style={{ flexShrink: 0 }}>
                <Toggle on={!!editForm.requiereReserva} onChange={() => setFInstante(f => ({ ...f, requiereReserva: !f.requiereReserva }))}/>
              </div>
            </div>
          </div>
          </>
          )}

          {/* ── Acciones ── (ocultas para el superadmin: guarda/elimina desde el header) */}
          {!modoAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 8 }}>
            {/* Sólo para una oferta ya publicada (no "new"/borrador, donde el CTA sigue siendo
                "Publicar cupón"): si el autoguardado ya se llevó todos los cambios, el botón
                queda en verde, con la tilde, y deshabilitado — no hay nada que volver a guardar. */}
            {(() => { const yaGuardado = editingOferta !== 'new' && !editingOferta?.borrador && !isDirty && !savingOferta && camposCompletos; return (
            <button onClick={() => saveEdit()} disabled={savingOferta || !camposCompletos || yaGuardado}
              style={{ width: '100%', background: yaGuardado ? GREENS : (camposCompletos && !savingOferta) ? P : LINE, color: yaGuardado ? GREEN : (camposCompletos && !savingOferta) ? '#fff' : MUTED, border: yaGuardado ? `1.5px solid ${GREEN}` : 'none', borderRadius: 10, padding: '12px 0', fontFamily: FONT, fontSize: 13, fontWeight: 700, cursor: (savingOferta || !camposCompletos || yaGuardado) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'background 0.15s' }}>
              {yaGuardado
                ? <><CheckCircle2 size={14}/> Guardado</>
                : savingOferta ? 'Guardando…' : (editingOferta === 'new' || editingOferta?.borrador) ? 'Publicar cupón' : 'Guardar cambios'}
              {isDirty && !savingOferta && camposCompletos && !yaGuardado && <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.25)', borderRadius: 4, padding: '1px 5px', marginLeft: 2 }}>sin guardar</span>}
            </button>
            ); })()}
            {!camposCompletos && (
              <div style={{ fontSize: 11, color: MUTED, textAlign: 'center', marginTop: -2 }}>Faltan: {camposFaltantes.join(', ')}.</div>
            )}
            {editingOferta !== 'new' && (
              <button onClick={deleteEditing} style={{ width: '100%', background: 'transparent', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 10, padding: '9px 0', fontFamily: FONT, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Trash2 size={13}/> Eliminar oferta
              </button>
            )}
          </div>
          )}

        </div>
      </div>
      )}

    </div>

    {/* ── Modal: cambios sin guardar ── */}
    {unsavedModal && ReactDOM.createPortal(
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,16,32,0.55)', zIndex: 99999, display: 'grid', placeItems: 'center', backdropFilter: 'blur(4px)' }}
        onClick={() => setUnsavedModal(false)}>
        <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 24, width: 360, padding: '28px 28px 24px', fontFamily: FONT, boxShadow: '0 24px 64px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 0 }}>
          <img src="/cuponix-base.svg" alt="Cuponix" style={{ width: 72, height: 72, objectFit: 'contain', marginBottom: 12 }}/>
          <div style={{ fontSize: 16, fontWeight: 800, color: INK, marginBottom: 6 }}>Tenés cambios sin guardar</div>
          <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.55, marginBottom: 22 }}>
            {editingOferta !== 'new' && editForm.titulo
              ? <>La oferta <strong style={{ color: INK2 }}>"{editForm.titulo}"</strong> tiene cambios que no guardaste todavía.</>
              : <>Tu nueva oferta tiene cambios que no guardaste todavía.</>
            }
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            <button onClick={() => saveEdit(() => { setUnsavedModal(false); pendingNav.current?.(); pendingNav.current = null; })}
              style={{ width: '100%', background: P, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <Save size={15}/> Guardar y continuar
            </button>
            <button onClick={() => { setUnsavedModal(false); pendingNav.current?.(); pendingNav.current = null; }}
              style={{ width: '100%', background: 'transparent', color: MUTED, border: `1px solid ${LINE}`, borderRadius: 12, padding: '11px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Salir sin guardar
            </button>
            <button onClick={() => setUnsavedModal(false)}
              style={{ background: 'none', border: 'none', color: MUTED, fontSize: 12, cursor: 'pointer', padding: '4px 0', marginTop: 2 }}>
              Seguir editando
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}

    {/* ── Modal: confirmar eliminación (no se puede deshacer) ── */}
    {deleteConfirmModal && ReactDOM.createPortal(
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,16,32,0.55)', zIndex: 99999, display: 'grid', placeItems: 'center', backdropFilter: 'blur(4px)' }}
        onClick={() => setDeleteConfirmModal(false)}>
        <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 24, width: 360, padding: '28px 28px 24px', fontFamily: FONT, boxShadow: '0 24px 64px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 0 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef2f2', display: 'grid', placeItems: 'center', marginBottom: 14 }}>
            <Trash2 size={24} color="#ef4444"/>
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: INK, marginBottom: 6 }}>¿Eliminar esta oferta?</div>
          <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.55, marginBottom: 22 }}>
            {editForm.titulo
              ? <>Vas a borrar <strong style={{ color: INK2 }}>"{editForm.titulo}"</strong> para siempre. <strong style={{ color: '#ef4444' }}>Esta acción no se puede deshacer.</strong></>
              : <>Esta acción <strong style={{ color: '#ef4444' }}>no se puede deshacer</strong>: la oferta se borra para siempre.</>
            }
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            <button onClick={confirmarEliminar}
              style={{ width: '100%', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <Trash2 size={15}/> Eliminar definitivamente
            </button>
            <button onClick={() => setDeleteConfirmModal(false)}
              style={{ width: '100%', background: 'transparent', color: MUTED, border: `1px solid ${LINE}`, borderRadius: 12, padding: '11px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}

    {/* ── Impulsá tu oferta: post-publicación y "Aumentar visibilidad" del header fijo ── */}
    {invitacionTarget && (
      <ImpulsoInvitacion
        oferta={invitacionTarget}
        negocioId={negocioId}
        saldo={saldoTokens}
        showToast={showToast}
        onClose={() => setInvitacionTarget(null)}
        onImpulsada={(id, { monto, restante, fromWallet }) => {
          setOfertas(prev => prev.map(o => o.id === id
            ? { ...o, impulsoActivo: true, impulsoTotal: (o.impulsoTotal || 0) + monto, impulsoRestante: restante ?? (o.impulsoRestante || 0) + monto }
            : o));
          setEditingOferta(prev => (prev && prev.id === id
            ? { ...prev, impulsoActivo: true, impulsoTotal: (prev.impulsoTotal || 0) + monto, impulsoRestante: restante ?? (prev.impulsoRestante || 0) + monto }
            : prev));
          // Del saldo local sólo se descuenta lo que realmente salió de la billetera (el resto se compró, no se resta).
          setSaldoTokens?.(s => Math.max(0, (s || 0) - fromWallet));
          setInvitacionTarget(null);
        }}
      />
    )}
    </>
  );
}

function TabEmpresa({ negocio, showToast }) {
  const [perfil, setPerfil] = useState(() => perfilDesdeNegocio(negocio));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (saving) return;
    const errs = validarPerfil(perfil);
    if (Object.keys(errs).length) { setErrors(errs); showToast('Revisá los campos obligatorios', 'err'); return; }
    setSaving(true);
    try {
      let imagenUrl = perfil.logoPreview || null;
      if (perfil.logoFile && negocio?.id) {
        try {
          const ext = perfil.logoFile.name.split('.').pop().toLowerCase();
          const { data: up } = await supabase.storage.from('negocios').upload(`logos/${negocio.id}.${ext}`, perfil.logoFile, { upsert: true });
          if (up) { const { data: ud } = supabase.storage.from('negocios').getPublicUrl(up.path); imagenUrl = ud.publicUrl; }
        } catch { /* logo se puede subir más tarde */ }
      }
      const payload = { ...perfilAPayload(perfil), imagen_url: imagenUrl };
      if (negocio?.id) {
        const { error } = await supabase.from('negocios').update(payload).eq('id', negocio.id);
        if (error) throw error;
      }
      showToast('Perfil guardado correctamente', 'ok');
    } catch (err) {
      showToast(err?.message || 'Error al guardar', 'err');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 740 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h2 style={{ fontFamily: FONT, fontSize: 20, fontWeight: 700, color: INK, margin: 0, flex: 1 }}>Perfil del negocio</h2>
        {perfil.cats.map(c => <Pill key={c} label={c} />)}
      </div>

      <PerfilNegocioForm value={perfil} onChange={setPerfil} errors={errors} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 40 }}>
        <button onClick={save} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8, background: saving ? MUTED : P, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontFamily: FONT, fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(71,91,225,0.3)', transition: 'background .15s' }}>
          <Save size={16} /> {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}

function TabGaleria({ negocio, showToast }) {
  const [fotos, setFotos] = useState((negocio?.galeria || []).map((url, i) => ({ id: `g${i}`, file: null, src: url })));
  const maxFotos = FOTOS_GALERIA_MAX[negocio?.plan || 'free'];
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (saving || !negocio?.id) return;
    setSaving(true);
    try {
      const urlsGaleria = [];
      for (let i = 0; i < fotos.length; i++) {
        const f = fotos[i];
        if (!f.file) { urlsGaleria.push(f.src); continue; }
        try {
          const ext = f.file.name.split('.').pop().toLowerCase();
          const { data: up } = await supabase.storage.from('negocios').upload(`galeria/${negocio.id}/${Date.now()}-${i}.${ext}`, f.file, { upsert: true });
          if (up) { const { data: ud } = supabase.storage.from('negocios').getPublicUrl(up.path); urlsGaleria.push(ud.publicUrl); }
        } catch { /* esa foto se puede resubir más tarde */ }
      }
      const { error } = await supabase.from('negocios').update({ galeria: urlsGaleria }).eq('id', negocio.id);
      if (error) throw error;
      showToast('Galería guardada', 'ok');
    } catch (err) {
      showToast(err?.message || 'Error al guardar', 'err');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 740 }}>
      <h2 style={{ fontFamily: FONT, fontSize: 20, fontWeight: 700, color: INK, margin: 0 }}>Galería de imágenes</h2>
      <Card>
        <GaleriaFotos fotos={fotos} onChange={setFotos} maxFotos={maxFotos} />
      </Card>
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 40 }}>
        <button onClick={save} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8, background: saving ? MUTED : P, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontFamily: FONT, fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(71,91,225,0.3)', transition: 'background .15s' }}>
          <Save size={16} /> {saving ? 'Guardando...' : 'Guardar cambios'}
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
              <span style={{ fontSize:10, fontWeight:600, color:MUTED }}>(AR${(cred * 2420).toLocaleString('es-AR')})</span>
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

function ModalEliminarCuenta({ nombreNegocio, onClose, onEliminada }) {
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState('');
  const [eliminando, setEliminando] = useState(false);

  async function eliminar() {
    setEliminando(true); setError('');
    const { data: sesion } = await supabase.auth.getSession();
    const { data, error: fnError } = await supabase.functions.invoke('delete-account', {
      headers: { Authorization: `Bearer ${sesion?.session?.access_token}` },
    });
    setEliminando(false);
    if (fnError || data?.error) { setError(data?.error || 'No se pudo eliminar la cuenta'); return; }
    onEliminada?.();
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:18, padding:26, width:'100%', maxWidth:420, fontFamily:FONT }}>
        <h3 style={{ margin:'0 0 8px', fontSize:17, fontWeight:800, color:INK }}>Eliminar mi cuenta</h3>
        <p style={{ margin:'0 0 16px', fontSize:13, color:INK2, lineHeight:1.5 }}>
          Esta acción es irreversible: se borra tu negocio, tus ofertas y tu acceso. No se puede deshacer.
          Para confirmar, escribí <b>{nombreNegocio}</b> abajo.
        </p>
        <input value={confirmacion} onChange={e => setConfirmacion(e.target.value)} placeholder={nombreNegocio}
          style={{ width:'100%', padding:'10px 12px', border:`1px solid ${LINE}`, borderRadius:10, fontFamily:FONT, fontSize:13, outline:'none', boxSizing:'border-box', marginBottom:12 }} />
        {error && <div style={{ color:'#C03030', fontSize:12, marginBottom:12 }}>{error}</div>}
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 16px', borderRadius:10, border:`1px solid ${LINE}`, background:'#fff', color:INK2, fontFamily:FONT, fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancelar</button>
          <button onClick={eliminar} disabled={confirmacion !== nombreNegocio || eliminando}
            style={{ padding:'9px 16px', borderRadius:10, border:'none', background:'#C03030', color:'#fff', fontFamily:FONT, fontSize:13, fontWeight:700, cursor: (confirmacion !== nombreNegocio || eliminando) ? 'not-allowed' : 'pointer', opacity: (confirmacion !== nombreNegocio || eliminando) ? 0.5 : 1 }}>
            {eliminando ? 'Eliminando…' : 'Eliminar cuenta'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TabCuenta({ credits, addonTotal, setShowComprar, perfil, negocio, setNegocio, showToast, onCuentaEliminada }) {
  const [filtroMov, setFiltroMov] = useState('todo');
  const [showEliminar, setShowEliminar] = useState(false);
  const [cambiandoVisibilidad, setCambiandoVisibilidad] = useState(false);
  const movRef = useRef(null);

  const negocioActivo = negocio?.activo !== false;

  async function toggleVisibilidad() {
    if (!negocio?.id || cambiandoVisibilidad) return;
    const nuevoEstado = !negocioActivo;
    setCambiandoVisibilidad(true);
    const { error } = await supabase.from('negocios').update({ activo: nuevoEstado }).eq('id', negocio.id);
    setCambiandoVisibilidad(false);
    if (error) { showToast?.('No se pudo actualizar la visibilidad', 'err'); return; }
    setNegocio?.(prev => (prev ? { ...prev, activo: nuevoEstado } : prev));
    showToast?.(nuevoEstado ? 'Tu negocio volvió a estar visible' : 'Tu negocio quedó oculto de listados y búsquedas', 'ok');
  }

  // Plan real del negocio + precio real del plan Plus (fuente de verdad: tabla `planes`)
  const esPlusReal = negocio?.plan === 'plus';
  const [planPlus, setPlanPlus] = useState(null);
  useEffect(() => {
    let vivo = true;
    getPlanesConfig()
      .then(planes => { if (vivo) setPlanPlus((planes || []).find(p => p.id === 'plus') || null); })
      .catch(() => {});
    return () => { vivo = false; };
  }, []);
  const precioMes  = planPlus?.precioMes ?? 20000;
  const mesesPago  = (planPlus?.mesesContrato ?? 12) - (planPlus?.mesesGratisBono ?? 1);
  const precioAnio = precioMes * mesesPago;

  // Historial real de movimientos de la billetera del negocio
  const [movs, setMovs] = useState([]);
  useEffect(() => {
    let vivo = true;
    if (negocio?.id) {
      getMovimientos(negocio.id)
        .then(data => { if (vivo) setMovs(data || []); })
        .catch(() => { if (vivo) setMovs([]); });
    } else {
      setMovs([]);
    }
    return () => { vivo = false; };
  }, [negocio?.id]);

  const movsFiltrados = movs.filter(m => {
    if (filtroMov === 'cred')  return m.cred != null;
    if (filtroMov === 'pesos') return m.pesos != null;
    return true;
  });

  // Créditos netos ganados/gastados en el mes en curso (para el badge de saldo)
  const credEsteMes = movs.reduce((acc, m) => {
    if (m.cred == null) return acc;
    const d = new Date(m._ts); const hoy = new Date();
    return (d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear()) ? acc + m.cred : acc;
  }, 0);

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
              {credEsteMes !== 0 && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:GREENS, color:GREEN, fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:999, marginTop:8 }}>
                  {credEsteMes > 0 ? '+' : '−'}{Math.abs(credEsteMes)} este mes
                </span>
              )}
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

          {/* Plan activo — refleja el plan real del negocio */}
          <Card>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom: esPlusReal ? 14 : 0 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:PS, color:P, display:'grid', placeItems:'center', flexShrink:0 }}>
                <Zap size={22}/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:FONT, fontSize:11, color:MUTED, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>Plan activo</div>
                <div style={{ fontFamily:FONT, fontSize:28, fontWeight:800, color:INK }}>{esPlusReal ? 'PLUS' : 'FREEMIUM'}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                {esPlusReal ? (
                  <>
                    <div style={{ display:'flex', alignItems:'baseline', gap:4, justifyContent:'flex-end' }}>
                      <span style={{ fontFamily:FONT, fontSize:26, fontWeight:800, color:INK, letterSpacing:'-0.02em' }}>${precioMes.toLocaleString('es-AR')}</span>
                      <span style={{ fontFamily:FONT, fontSize:13, color:MUTED, fontWeight:600 }}>+ IVA /mes</span>
                    </div>
                    <div style={{ fontFamily:FONT, fontSize:12, color:INK2, fontWeight:600, marginTop:2 }}>${precioAnio.toLocaleString('es-AR')} + IVA /año (1 mes bonificado)</div>
                    <div style={{ fontFamily:FONT, fontSize:11, color:MUTED, marginTop:2 }}>(no incluye impuestos nacionales)</div>
                  </>
                ) : (
                  <div style={{ display:'flex', alignItems:'baseline', gap:4, justifyContent:'flex-end' }}>
                    <span style={{ fontFamily:FONT, fontSize:26, fontWeight:800, color:INK, letterSpacing:'-0.02em' }}>$0</span>
                    <span style={{ fontFamily:FONT, fontSize:13, color:MUTED, fontWeight:600 }}>/mes</span>
                  </div>
                )}
              </div>
            </div>
            {esPlusReal ? (() => { const deuda = 0; return (
              <div style={{ background:BG, borderRadius:11, padding:'11px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <span style={{ fontFamily:FONT, fontSize:13, fontWeight:800, color: deuda > 0 ? '#ef4444' : INK }}>
                    Debés: ${deuda.toLocaleString('es-AR')}
                  </span>
                  <span style={{ fontFamily:FONT, fontSize:12, color:INK2 }}>Al día</span>
                </div>
                <span style={{ fontFamily:FONT, fontSize:12, fontWeight:700, color:P, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:3, flexShrink:0 }}>
                  Gestionar <ChevronRight size={13}/>
                </span>
              </div>
            );})() : (
              <div style={{ background:BG, borderRadius:11, padding:'11px 14px', marginTop:14 }}>
                <span style={{ fontFamily:FONT, fontSize:12, color:INK2 }}>Publicás sin cargo. Pasate a <b style={{ color:P }}>Plus</b> (${precioMes.toLocaleString('es-AR')} + IVA/mes) para armar cuponeras de regalo y sumar beneficios.</span>
              </div>
            )}
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
          {movsFiltrados.length === 0 ? (
            <div style={{ fontFamily:FONT, fontSize:13, color:MUTED, textAlign:'center', padding:'28px 0' }}>
              Todavía no hay movimientos en tu cuenta.
            </div>
          ) : (
            movsFiltrados.map((m, i) => <MovRow key={i} m={m} last={i === movsFiltrados.length - 1}/>)
          )}
        </div>
      </Card>

      {/* ── Visibilidad del negocio ── */}
      {!perfil?.es_superadmin && negocio?.aprobado && (
        <Card style={{ border: `1px solid ${negocioActivo ? LINE : '#F3D9A8'}`, background: negocioActivo ? CARD : '#FFFBF0' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:14, flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:38, height:38, borderRadius:11, background: negocioActivo ? GREENS : '#FDF0DA', display:'grid', placeItems:'center', color: negocioActivo ? GREEN : '#b45309', flexShrink:0 }}>
                {negocioActivo ? <Eye size={17}/> : <EyeOff size={17}/>}
              </div>
              <div>
                <div style={{ fontFamily:FONT, fontSize:14, fontWeight:700, color:INK, marginBottom:4 }}>
                  {negocioActivo ? 'Tu negocio está visible' : 'Tu negocio está inactivo'}
                </div>
                <div style={{ fontFamily:FONT, fontSize:12, color:INK2 }}>
                  {negocioActivo
                    ? 'Aparece en listados, búsquedas y ofertas para los turistas.'
                    : 'No aparece en listados, búsquedas ni ofertas hasta que lo reactivés.'}
                </div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
              <span style={{ fontFamily:FONT, fontSize:12, fontWeight:700, color: negocioActivo ? GREEN : MUTED }}>
                {negocioActivo ? 'Activo' : 'Inactivo'}
              </span>
              <Toggle on={negocioActivo} onChange={toggleVisibilidad} />
            </div>
          </div>
        </Card>
      )}

      {/* ── Zona de peligro ── */}
      {!perfil?.es_superadmin && (
        <Card style={{ border:'1px solid #F3D0D0', background:'#FEF7F7' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:14, flexWrap:'wrap' }}>
            <div>
              <div style={{ fontFamily:FONT, fontSize:14, fontWeight:700, color:'#C03030', marginBottom:4 }}>Eliminar mi cuenta</div>
              <div style={{ fontFamily:FONT, fontSize:12, color:INK2 }}>Borra tu negocio, ofertas y acceso de forma permanente.</div>
            </div>
            <button onClick={() => setShowEliminar(true)} style={{ padding:'10px 18px', borderRadius:10, border:'none', background:'#C03030', color:'#fff', fontFamily:FONT, fontSize:13, fontWeight:700, cursor:'pointer', flexShrink:0 }}>
              Eliminar mi cuenta
            </button>
          </div>
        </Card>
      )}

      {showEliminar && (
        <ModalEliminarCuenta
          nombreNegocio={negocio?.nombre || negocio?.name || ''}
          onClose={() => setShowEliminar(false)}
          onEliminada={onCuentaEliminada}
        />
      )}
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
//  RENDIMIENTO WIDGET
// ════════════════════════════════════════════════════════════
// Bloque de saldos — créditos publicitarios + puntos, en el sidebar (estilo oscuro)
function SaldosWidget({ creditos = 0, puntos = 0 }) {
  const fila = (icon, valor, label) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {icon}
      <div style={{ lineHeight: 1.15 }}>
        <div style={{ fontFamily: FONT, fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{valor}</div>
        <div style={{ fontFamily: FONT, fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>{label}</div>
      </div>
    </div>
  );
  return (
    <div style={{ margin: '0 8px 8px', background: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {fila(<CreditCoin size={26} />, creditos, 'créditos publicitarios')}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />
      {fila(
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(245,158,11,0.18)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Star size={14} color={YELLOW} fill={YELLOW} />
        </div>,
        puntos,
        'puntos',
      )}
    </div>
  );
}

// Tarjeta de rendimiento — vive en el grid de "Creadas por mí" (estilo claro,
// tamaño de una minificha de oferta). Sólo se muestra si hay ≥1 oferta cargada.
function RendimientoCard({ plan = 'free', onUpgrade }) {
  const [nivel,     setNivel]     = useState(0);
  const [showModal, setShowModal] = useState(false);
  const isPremium = plan === 'plus';
  const pct = nivel * 50;

  const TEXTOS = [
    'Visibilidad Estándar. Tus ofertas se muestran en el listado general del Partido de Villa Gesell. Para llegar a más turistas en hora pico, potenciá tu alcance.',
    'Alcance Destacado. Tus cupones aparecen prioritariamente en las búsquedas de tu localidad y se envían en el resumen semanal a tus seguidores.',
    'Exposición Total. Prioridad absoluta en la Home, notificaciones push geolocalizadas a turistas cerca de tu local y destacado visual en el mapa.',
  ];

  const trySetNivel = (n) => {
    if (!isPremium && n > 0) { setShowModal(true); return; }
    setNivel(n);
  };

  return (
    <>
      <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 20, minHeight: 240, padding: '16px 16px 14px', display: 'flex', flexDirection: 'column', fontFamily: FONT }}>

        {/* Header rendimiento */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Zap size={13} color="#f59e0b" style={{ flexShrink: 0 }} />
          <span style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: 800, color: INK2, letterSpacing: '0.04em' }}>RENDIMIENTO DE TUS OFERTAS</span>
        </div>

        {/* Slider */}
        <div style={{ position: 'relative', height: 3, background: LINE, borderRadius: 2, margin: '16px 6px 20px' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 2, background: P, width: `${pct}%`, transition: 'width .25s ease', pointerEvents: 'none' }} />
          {[0, 1, 2].map(i => (
            <div key={i} onClick={() => trySetNivel(i)}
              style={{
                position: 'absolute', left: `${i * 50}%`, top: '50%', transform: 'translate(-50%, -50%)',
                width: nivel === i ? 14 : 9, height: nivel === i ? 14 : 9, borderRadius: '50%',
                background: i <= nivel ? P : '#cbd5e1', border: nivel === i ? '2px solid #fff' : 'none',
                cursor: !isPremium && i > 0 ? 'default' : 'pointer', transition: 'all .2s ease', zIndex: 2,
                boxShadow: nivel === i ? '0 0 0 3px rgba(71,91,225,0.25)' : 'none',
              }}
            />
          ))}
        </div>

        {/* Labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          {['Normal', 'Alto', 'Máximo'].map((label, i) => (
            <span key={i} style={{ fontSize: 9.5, fontWeight: nivel === i ? 800 : 500, color: nivel === i ? P : MUTED, fontFamily: FONT, transition: 'color .2s', userSelect: 'none' }}>
              {label}{!isPremium && i > 0 ? ' 🔒' : ''}
            </span>
          ))}
        </div>

        {/* Texto dinámico */}
        <p style={{ fontSize: 10.5, color: MUTED, fontFamily: FONT, lineHeight: 1.55, margin: '0 0 10px', flex: 1 }}>
          {TEXTOS[nivel]}
        </p>

        {/* CTA solo en Normal */}
        {nivel === 0 && (
          <button
            onClick={() => { if (!isPremium) { onUpgrade?.(); } else setNivel(1); }}
            style={{ width: '100%', background: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: 8, padding: '9px 0', fontFamily: FONT, fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}
          >
            ↑ Aumentar Rendimiento
          </button>
        )}
      </div>

      {/* Modal via Portal */}
      {showModal && ReactDOM.createPortal(
        <>
          <div
            onClick={() => setShowModal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(8,12,26,0.65)', zIndex: 99990, backdropFilter: 'blur(4px)' }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            zIndex: 99991, width: 320, background: '#fff', borderRadius: 20,
            padding: '30px 24px 24px', boxShadow: '0 24px 64px rgba(0,0,0,0.28)',
            fontFamily: FONT, textAlign: 'center',
          }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>⚡</div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: INK, margin: '0 0 10px', lineHeight: 1.3 }}>
              ¿Querés multiplicar tus ventas este fin de semana largo?
            </h3>
            <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.65, margin: '0 0 22px' }}>
              Subí a <strong style={{ color: INK }}>Plan Plus</strong> para desbloquear el Rendimiento Alto y Máximo.
            </p>
            <button
              onClick={() => { setShowModal(false); onUpgrade?.(); }}
              style={{ width: '100%', background: P, color: '#fff', border: 'none', borderRadius: 11, padding: '13px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 10, boxShadow: '0 4px 14px rgba(71,91,225,0.3)' }}
            >
              Ver planes disponibles
            </button>
            <button
              onClick={() => setShowModal(false)}
              style={{ background: 'transparent', border: 'none', color: MUTED, fontSize: 12, cursor: 'pointer', padding: '4px 0' }}
            >
              Ahora no
            </button>
          </div>
        </>,
        document.body
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════
//  SIDEBAR
// ════════════════════════════════════════════════════════════
function Sidebar({ tab, setTab, negocio, perfil, notifCount, saldoTokens, puntos = 0, setShowComprar, onVolver, onGoHome, onLogout, navCounts = {} }) {
  const esAloj = negocio?.tipo === 'alojamiento' || TIPOS_ALOJ_ADMIN.has(negocio?.tipo);
  const plan   = negocio?.plan || 'free';

  const PLAN_BADGE = {
    free:  { label: 'Gratis', bg: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.55)' },
    plus:  { label: 'Plus',   bg: `${P}55`,                 color: '#a5b4fc'                 },
  };

  const navItem = (t, sub = false) => {
    if (t.alojOnly && !esAloj) return null;
    const active    = tab === t.id;
    const badge     = t.id === 'notif' ? notifCount : 0;
    const planBadge = t.id === 'cuenta' ? (PLAN_BADGE[plan] || PLAN_BADGE.free) : null;
    return (
      <button
        key={t.id}
        onClick={() => setTab(t.id)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
          padding: sub ? '5px 10px 5px 24px' : '6px 10px',
          border: 'none', borderRadius: 8,
          background: active ? P : 'transparent',
          color: active ? '#fff' : sub ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.7)',
          fontFamily: FONT, fontSize: sub ? 12 : 12.5,
          fontWeight: active ? 700 : sub ? 400 : 500,
          cursor: 'pointer',
        }}
      >
        <t.Icon size={sub ? 12 : 14} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1 }}>
          {t.label}
          {navCounts[t.id] !== undefined && (
            <span style={{ opacity: 0.55, fontWeight: 400 }}> ({navCounts[t.id]})</span>
          )}
        </span>
        {badge > 0 && <span style={{ background: YELLOW, color: NAVY, fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 999 }}>{badge}</span>}
        {planBadge && <span style={{ background: planBadge.bg, color: planBadge.color, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 999, letterSpacing: '0.03em' }}>{planBadge.label}</span>}
      </button>
    );
  };

  return (
    <aside style={{ background: NAVY, color: '#fff', width: 260, minWidth: 260, display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'sticky', top: 0, alignSelf: 'flex-start' }}>

      {/* Logo */}
      <button onClick={onGoHome} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '14px 0 12px', background: 'transparent', border: 'none', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.08)', width: '100%' }}>
        <img src="/logo-cuponera-wh.svg" alt="Cuponera" style={{ width: 180, height: 'auto', display: 'block' }} />
      </button>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 8px 4px', display: 'flex', flexDirection: 'column', gap: 0, overflowY: 'auto' }}>
        {NAV_GRUPOS.map(grupo => (
          <div key={grupo.id} style={{ marginBottom: 2 }}>
            <div style={{ padding: '8px 10px 3px', fontSize: 9.5, fontWeight: 700, color: '#b1bbff', letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: FONT }}>
              {grupo.label}
            </div>
            {grupo.items.map(t => navItem(t, true))}
          </div>
        ))}

        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 2px' }} />

        {NAV_BOTTOM.map(t => navItem(t, false))}
      </nav>

      {/* Saldos: créditos publicitarios + puntos */}
      <SaldosWidget creditos={saldoTokens} puntos={puntos} />

      {/* Comprar créditos (solo plan free con alojamiento) */}
      {negocio && debeUsarTokens(negocio.tipo, negocio.plan) && (
        <div style={{ margin: '0 8px 8px' }}>
          <button onClick={() => setShowComprar(true)} style={{ width: '100%', background: P, color: '#fff', border: 'none', borderRadius: 7, padding: '7px 0', fontFamily: FONT, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            Comprar créditos
          </button>
        </div>
      )}

      {/* Footer sesión */}
      <div style={{ padding: '8px 10px 10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontFamily: FONT, fontSize: 9.5, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Sesión activa</div>
        <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, marginTop: 2, marginBottom: 5 }}>{perfil?.nombre || 'Socio'}</div>
        {onVolver && (
          <button onClick={onVolver} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.45)', fontFamily: FONT, fontSize: 11, cursor: 'pointer', marginBottom: 2, padding: '2px 0' }}>
            <ArrowLeft size={12} /> Volver al panel
          </button>
        )}
        <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', fontFamily: FONT, fontSize: 11, cursor: 'pointer', padding: '2px 0' }}>
          <LogOut size={12} /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

// ════════════════════════════════════════════════════════════
//  TabVentas — consultas + solicitud de cupones
// ════════════════════════════════════════════════════════════
function SolicitudCupones({ negocioId, showToast }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contraofertaId, setContraofertaId] = useState(null);
  const [contraCheckin, setContraCheckin] = useState('');
  const [contraCheckout, setContraCheckout] = useState('');

  useEffect(() => { cargar(); }, [negocioId]);

  async function cargar() {
    setLoading(true);
    const { data } = await supabase
      .from('cuponera_items')
      .select(`
        id, estado_solicitud, fecha_checkin, fecha_checkout, num_huespedes,
        vence_en, contraoferta_fecha_checkin, contraoferta_fecha_checkout,
        promociones(titulo, badge, imagen_url),
        cuponeras(usuario_id, perfiles(nombre))
      `)
      .in('estado_solicitud', ['pendiente_confirmacion', 'contraoferta'])
      .eq('promociones.negocio_id', negocioId)
      .order('vence_en', { ascending: true });
    setSolicitudes(data || []);
    setLoading(false);
  }

  async function accion(id, nuevoEstado, extra = {}) {
    const { error } = await supabase
      .from('cuponera_items')
      .update({ estado_solicitud: nuevoEstado, respondido_en: new Date().toISOString(), ...extra })
      .eq('id', id);
    if (error) { showToast('Error al actualizar la solicitud', 'error'); return; }
    showToast(nuevoEstado === 'confirmado' ? '¡Solicitud confirmada!' : nuevoEstado === 'rechazado' ? 'Solicitud rechazada. Los créditos serán devueltos.' : 'Contraoferta enviada al turista.', 'ok');
    cargar();
  }

  const inputStyle = { padding: '8px 10px', border: `1px solid ${LINE}`, borderRadius: 8, fontSize: 13, color: INK, background: '#fff', outline: 'none' };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: MUTED }}>Cargando solicitudes...</div>;

  return (
    <div>
      <p style={{ fontSize: 14, color: MUTED, margin: '0 0 20px' }}>Confirmá o rechazá las solicitudes en menos de 48hs. Si no respondés, los créditos se devuelven al turista automáticamente.</p>

      {solicitudes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: MUTED }}>
          <CalendarDays size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ fontSize: 15, fontWeight: 600 }}>No hay solicitudes pendientes</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {solicitudes.map(s => {
            const turista = s.cuponeras?.perfiles?.nombre || 'Turista';
            const titulo = s.promociones?.titulo || 'Cupón';
            const venceEn = s.vence_en ? new Date(s.vence_en) : null;
            const horasRestantes = venceEn ? Math.max(0, Math.round((venceEn - Date.now()) / 3600000)) : null;
            const esContraoferta = s.estado_solicitud === 'contraoferta';

            return (
              <div key={s.id} style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: `1px solid ${LINE}` }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: P, flexShrink: 0 }}>
                    {turista[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: INK, margin: 0 }}>{turista}</p>
                    <p style={{ fontSize: 12, color: MUTED, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{titulo}</p>
                  </div>
                  {horasRestantes !== null && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: horasRestantes < 6 ? '#EF4444' : MUTED, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <Clock size={12} /> {horasRestantes}hs restantes
                    </div>
                  )}
                </div>

                <div style={{ padding: '12px 18px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 3px' }}>Check-in</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: INK, margin: 0 }}>{s.fecha_checkin ? new Date(s.fecha_checkin + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : '—'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 3px' }}>Check-out</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: INK, margin: 0 }}>{s.fecha_checkout ? new Date(s.fecha_checkout + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : '—'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 3px' }}>Huéspedes</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: INK, margin: 0 }}>{s.num_huespedes}</p>
                  </div>
                  {esContraoferta && (
                    <div style={{ padding: '6px 10px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, fontSize: 12, color: '#D97706', fontWeight: 600 }}>
                      Contraoferta enviada — esperando respuesta del turista
                    </div>
                  )}
                </div>

                {!esContraoferta && (
                  <div style={{ padding: '0 18px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => accion(s.id, 'confirmado')} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: GREEN, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Check size={14} /> Aceptar
                    </button>
                    <button onClick={() => accion(s.id, 'rechazado')} style={{ padding: '8px 18px', borderRadius: 10, border: `1px solid #FCA5A5`, background: '#FEF2F2', color: '#EF4444', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <X size={14} /> Rechazar
                    </button>
                    <button onClick={() => setContraofertaId(contraofertaId === s.id ? null : s.id)} style={{ padding: '8px 18px', borderRadius: 10, border: `1px solid ${LINE}`, background: '#fff', color: INK2, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CalendarDays size={14} /> Proponer otra fecha
                    </button>
                  </div>
                )}

                {contraofertaId === s.id && (
                  <div style={{ padding: '0 18px 16px', display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', borderTop: `1px solid ${LINE}` }}>
                    <div style={{ paddingTop: 12 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: MUTED, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Nueva fecha check-in</label>
                      <input type="date" value={contraCheckin} onChange={e => setContraCheckin(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: MUTED, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Nueva fecha check-out</label>
                      <input type="date" value={contraCheckout} onChange={e => setContraCheckout(e.target.value)} min={contraCheckin} style={inputStyle} />
                    </div>
                    <button
                      onClick={() => {
                        if (!contraCheckin || !contraCheckout) return;
                        accion(s.id, 'contraoferta', { contraoferta_fecha_checkin: contraCheckin, contraoferta_fecha_checkout: contraCheckout });
                        setContraofertaId(null);
                      }}
                      style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: P, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Enviar contraoferta
                    </button>
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

function TabVentas({ negocioId, showToast }) {
  const [section, setSection] = useState('consultas');

  const SECCIONES = [
    { id: 'consultas', label: 'Consultas', Icon: MessageSquare },
    { id: 'cupones',   label: 'Solicitud de cupones', Icon: CalendarDays },
  ];

  return (
    <div style={{ padding: '32px 36px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, margin: '0 0 20px' }}>Ventas</h2>

      {/* Sub-nav */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {SECCIONES.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 18px', borderRadius: 99,
            border: `1px solid ${section === s.id ? P : LINE}`,
            background: section === s.id ? PS : 'transparent',
            color: section === s.id ? P : INK2,
            fontFamily: FONT, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            <s.Icon size={14} /> {s.label}
          </button>
        ))}
      </div>

      {section === 'consultas' && <TabInbox />}
      {section === 'cupones'   && <SolicitudCupones negocioId={negocioId} showToast={showToast} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  TAB COMPRAS
// ════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════
//  TAB CUPONERAS (regalo) — sólo socios Plus
// ════════════════════════════════════════════════════════════
const ESTADO_BADGE = {
  borrador:  { label: 'Borrador',  bg: `${MUTED}22`,  color: INK2 },
  activa:    { label: 'Activa',    bg: `${GREEN}1a`,  color: GREEN },
  pausada:   { label: 'Pausada',   bg: `${YELLOW}22`, color: '#b45309' },
  archivada: { label: 'Archivada', bg: `${MUTED}22`,  color: MUTED },
};

function TabCuponeras({ negocio, perfil, showToast, saldoTokens, setSaldoTokens, setShowComprar }) {
  const esPlus = negocio?.plan === 'plus';

  const [loading, setLoading]       = useState(esPlus);
  const [cuponeras, setCuponeras]   = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [alias, setAlias]           = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createNombre, setCreateNombre] = useState('');
  const [editingId, setEditingId]   = useState(null);
  const [editingNombre, setEditingNombre] = useState('');
  const [busTexto, setBusTexto]         = useState('');
  const [busLocalidad, setBusLocalidad] = useState('');
  const [busResultados, setBusResultados] = useState([]);
  const [busLoading, setBusLoading]     = useState(false);
  const [sugiriendo, setSugiriendo]     = useState(false);

  const selected = cuponeras.find(c => c.id === selectedId) || null;

  useEffect(() => {
    if (esPlus && negocio?.id) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [negocio?.id, esPlus]);

  useEffect(() => {
    if (esPlus && negocio?.id) buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [negocio?.id, esPlus]);

  async function cargar() {
    setLoading(true);
    const [cups, aliasRes] = await Promise.all([
      getCuponerasRegalo(negocio.id),
      supabase.from('socio_alias').select('codigo, unidades_declaradas').eq('negocio_id', negocio.id).maybeSingle(),
    ]);
    setCuponeras(cups);
    setAlias(aliasRes.data || null);
    setSelectedId(prev => (prev && cups.some(c => c.id === prev)) ? prev : (cups[0]?.id || null));
    setLoading(false);
  }

  async function refrescarSaldo() {
    const nuevo = await getSaldo(negocio.id);
    setSaldoTokens?.(nuevo);
  }

  async function handleCrear() {
    if (!createNombre.trim()) return;
    const { data, error } = await crearCuponeraRegalo(negocio.id, createNombre.trim());
    if (error) { showToast('Error al crear la cuponera', 'error'); return; }
    setCreateNombre(''); setShowCreate(false);
    await cargar();
    setSelectedId(data.id);
  }

  async function handleRenombrar(id) {
    if (!editingNombre.trim()) { setEditingId(null); return; }
    await renombrarCuponera(id, editingNombre.trim());
    setEditingId(null);
    await cargar();
  }

  async function handleEliminar(id) {
    if (!window.confirm('¿Eliminar esta cuponera? Se devuelven los créditos de los cupones que tenía.')) return;
    await eliminarCuponeraRegalo(negocio.id, id);
    await cargar();
    await refrescarSaldo();
    showToast('Cuponera eliminada', 'ok');
  }

  async function handleCambiarEstado(id, estado) {
    await cambiarEstadoCuponera(id, estado);
    await cargar();
    showToast(`Cuponera ${ESTADO_BADGE[estado]?.label.toLowerCase() || estado}`, 'ok');
  }

  async function handleToggleModo(id, actual) {
    await toggleModoInteligente(id, !actual);
    await cargar();
  }

  async function buscar() {
    setBusLoading(true);
    setSugiriendo(false);
    setBusResultados(await buscarPromosDisponibles({ texto: busTexto, localidad: busLocalidad || negocio?.localidad }));
    setBusLoading(false);
  }

  async function handleSugerir() {
    setBusLoading(true);
    setSugiriendo(true);
    const excluirIds = selected?.cuponeras_regalo_cupones.map(c => c.promocion_id) || [];
    setBusResultados(await sugerirCupones(busLocalidad || negocio?.localidad, { excluirIds }));
    setBusLoading(false);
  }

  async function handleAgregarCupon(promo) {
    if (!selected) { showToast('Creá o elegí una cuponera primero', 'error'); return; }
    const yaIncluido = selected.cuponeras_regalo_cupones.some(c => c.promocion_id === promo.id);
    if (yaIncluido) { showToast('Ese cupón ya está en la cuponera', 'error'); return; }
    const { error } = await agregarCupon(negocio.id, selected.id, promo, selected.cuponeras_regalo_cupones.length);
    if (error) { showToast(error, 'error'); return; }
    await cargar();
    await refrescarSaldo();
  }

  async function handleQuitarCupon(cuponeraCuponId) {
    await quitarCupon(negocio.id, cuponeraCuponId);
    await cargar();
    await refrescarSaldo();
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: MUTED }}>Cargando cuponeras...</div>;

  if (!esPlus) {
    return (
      <div style={{ padding: '32px 36px' }}>
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Gift size={36} color={P} style={{ margin: '0 auto 14px', display: 'block' }} />
          <div style={{ fontFamily: FONT, fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Las cuponeras regalo son para socios Plus</div>
          <div style={{ fontFamily: FONT, fontSize: 13, color: MUTED, marginBottom: 18, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
            Armá una plantilla de cupones de otros socios y regalásela a tus huéspedes con tu alias — la pagás una sola vez al armarla.
          </div>
          <button style={{ background: P, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontFamily: FONT, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Pasate a Plus
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, margin: 0 }}>Mis cuponeras</h2>
      </div>

      {/* Saldo de créditos + alias */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT, fontSize: 13, color: INK2 }}>
          <Coins size={16} color={YELLOW}/> <b style={{ color: INK }}>{saldoTokens}</b> créditos disponibles
          <button onClick={() => setShowComprar?.(true)} style={{ background: 'none', border: 'none', color: P, fontFamily: FONT, fontSize: 12, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Comprar más</button>
        </div>
        {alias && (
          <div style={{ fontFamily: FONT, fontSize: 13, color: INK2 }}>
            Alias: <b style={{ color: INK }}>{alias.codigo}</b> · {alias.unidades_declaradas} activaciones/semana
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* ─── Catálogo (izquierda) ─── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={14} color={MUTED} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}/>
              <input value={busTexto} onChange={e => setBusTexto(e.target.value)} onKeyDown={e => e.key === 'Enter' && buscar()}
                placeholder="Buscar por título..."
                style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 30px', borderRadius: 10, border: `1px solid ${LINE}`, fontFamily: FONT, fontSize: 13, outline: 'none', color: INK }}/>
            </div>
            <select value={busLocalidad} onChange={e => setBusLocalidad(e.target.value)}
              style={{ padding: '9px 10px', borderRadius: 10, border: `1px solid ${LINE}`, fontFamily: FONT, fontSize: 13, color: INK, cursor: 'pointer', outline: 'none' }}>
              <option value="">{negocio?.localidad || 'Toda localidad'}</option>
              {LOCALIDADES.filter(l => l !== negocio?.localidad).map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <button onClick={buscar} style={{ background: PS, color: P, border: 'none', borderRadius: 10, padding: '0 16px', fontFamily: FONT, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Buscar</button>
          </div>

          <button onClick={handleSugerir} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: sugiriendo ? P : PS, color: sugiriendo ? '#fff' : P, border: `1.5px dashed ${P}55`, borderRadius: 12, padding: '11px 0', fontFamily: FONT, fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>
            <Zap size={15}/> Sugerir cupones de mi zona automáticamente
          </button>

          {busLoading ? (
            <div style={{ textAlign: 'center', padding: 30, color: MUTED, fontFamily: FONT, fontSize: 13 }}>Buscando…</div>
          ) : busResultados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: MUTED, fontFamily: FONT, fontSize: 13 }}>Sin resultados</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {busResultados.map(p => {
                const costo = costoCreditosDePromo(p);
                const yaIncluido = selected?.cuponeras_regalo_cupones.some(c => c.promocion_id === p.id);
                return (
                  <div key={p.id} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <img src={p.imagen_url || '/cuponera-coin.svg'} alt="" style={{ width: '100%', height: 100, objectFit: 'cover' }}/>
                    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                      <div style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 700, color: INK, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.titulo}</div>
                      <div style={{ fontFamily: FONT, fontSize: 10.5, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.negocios?.nombre}</div>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: INK2, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Coins size={11} color={YELLOW}/> {costo} crédito{costo !== 1 ? 's' : ''}
                      </span>
                      <button disabled={yaIncluido || !selected} onClick={() => handleAgregarCupon(p)}
                        style={{ marginTop: 'auto', background: yaIncluido ? LINE : P, color: yaIncluido ? MUTED : '#fff', border: 'none', borderRadius: 8, padding: '7px 0', fontFamily: FONT, fontSize: 11.5, fontWeight: 700, cursor: (yaIncluido || !selected) ? 'default' : 'pointer' }}>
                        {yaIncluido ? 'Ya agregado' : 'Añadir a cuponera'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Panel de la cuponera (derecha, 36%) ─── */}
        <div style={{ width: '36%', flexShrink: 0, position: 'sticky', top: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: INK }}>Tus cuponeras</span>
            <button onClick={() => setShowCreate(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: P, fontFamily: FONT, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              <Plus size={13}/> Nueva
            </button>
          </div>

          {showCreate && (
            <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 12, marginBottom: 12, display: 'flex', gap: 6 }}>
              <input autoFocus value={createNombre} onChange={e => setCreateNombre(e.target.value)}
                placeholder="Nombre de la cuponera" onKeyDown={e => e.key === 'Enter' && handleCrear()}
                style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: `1px solid ${LINE}`, fontFamily: FONT, fontSize: 12.5, outline: 'none', color: INK }} />
              <button onClick={handleCrear} style={{ background: P, color: '#fff', border: 'none', borderRadius: 8, padding: '0 12px', fontFamily: FONT, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Crear</button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {cuponeras.map(c => {
              const eb = ESTADO_BADGE[c.estado] || ESTADO_BADGE.borrador;
              const active = selectedId === c.id;
              return (
                <button key={c.id} onClick={() => setSelectedId(c.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 999, border: `1.5px solid ${active ? P : LINE}`, background: active ? PS : '#fff', cursor: 'pointer', fontFamily: FONT, fontSize: 11.5, fontWeight: 700, color: active ? P : INK2 }}>
                  {c.nombre}
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: eb.color }} />
                </button>
              );
            })}
            {cuponeras.length === 0 && (
              <div style={{ fontFamily: FONT, fontSize: 12, color: MUTED }}>Sin cuponeras todavía</div>
            )}
          </div>

          {selected ? (
            <Card>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                {editingId === selected.id ? (
                  <input autoFocus value={editingNombre} onChange={e => setEditingNombre(e.target.value)}
                    onBlur={() => handleRenombrar(selected.id)}
                    onKeyDown={e => { if (e.key === 'Enter') handleRenombrar(selected.id); if (e.key === 'Escape') setEditingId(null); }}
                    style={{ flex: 1, border: `1px solid ${P}`, borderRadius: 6, padding: '2px 7px', fontFamily: FONT, fontSize: 14, fontWeight: 700, outline: 'none', color: INK }} />
                ) : (
                  <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 800, color: INK }}>{selected.nombre}</span>
                )}
                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                  <button onClick={() => { setEditingId(selected.id); setEditingNombre(selected.nombre); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: 3 }}><Edit2 size={12}/></button>
                  <button onClick={() => handleEliminar(selected.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 3 }}><Trash2 size={12}/></button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 9px', borderRadius: 999, background: ESTADO_BADGE[selected.estado]?.bg, color: ESTADO_BADGE[selected.estado]?.color, fontFamily: FONT }}>
                  {ESTADO_BADGE[selected.estado]?.label}
                </span>
                <span style={{ fontFamily: FONT, fontSize: 11.5, color: MUTED, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Coins size={11} color={YELLOW}/> {selected.costo_creditos} usados
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: FONT, fontSize: 11.5, color: INK2 }}>
                  <Zap size={11} color={selected.modo_inteligente ? GREEN : MUTED}/>
                  <Toggle on={selected.modo_inteligente} onChange={() => handleToggleModo(selected.id, selected.modo_inteligente)} />
                </span>
              </div>

              {!negocio?.puede_compartir_cuponeras && (
                <div style={{ background: `${YELLOW}15`, border: `1px solid ${YELLOW}40`, borderRadius: 10, padding: '8px 10px', marginBottom: 12, fontFamily: FONT, fontSize: 11, color: '#b45309' }}>
                  Comprobante pendiente de aprobación — podés armar la cuponera, pero no publicarla todavía.
                </div>
              )}

              {selected.cuponeras_regalo_cupones.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: MUTED }}>
                  <Tag size={26} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }}/>
                  <div style={{ fontFamily: FONT, fontSize: 12.5 }}>Todavía no agregaste cupones</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14, maxHeight: 320, overflowY: 'auto' }}>
                  {selected.cuponeras_regalo_cupones.map(cup => (
                    <div key={cup.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', border: `1px solid ${LINE}`, borderRadius: 10 }}>
                      <img src={cup.promociones?.imagen_url || '/cuponera-coin.svg'} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: 700, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cup.promociones?.titulo}</div>
                        <div style={{ fontFamily: FONT, fontSize: 10, color: MUTED }}>{cup.promociones?.negocios?.nombre}</div>
                      </div>
                      <span style={{ fontSize: 10.5, fontFamily: FONT, fontWeight: 700, color: INK2, display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                        <Coins size={10} color={YELLOW}/> {cup.costo_creditos}
                      </span>
                      <button onClick={() => handleQuitarCupon(cup.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 3, flexShrink: 0 }}><Trash2 size={12}/></button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {selected.estado === 'borrador' && (
                  <button onClick={() => handleCambiarEstado(selected.id, 'activa')} disabled={selected.cuponeras_regalo_cupones.length === 0 || !negocio?.puede_compartir_cuponeras}
                    title={!negocio?.puede_compartir_cuponeras ? 'Pendiente de aprobación del comprobante de pago' : ''}
                    style={{ background: GREEN, color: '#fff', border: 'none', borderRadius: 9, padding: '8px 14px', fontFamily: FONT, fontSize: 12, fontWeight: 700, cursor: (selected.cuponeras_regalo_cupones.length && negocio?.puede_compartir_cuponeras) ? 'pointer' : 'not-allowed', opacity: (selected.cuponeras_regalo_cupones.length && negocio?.puede_compartir_cuponeras) ? 1 : 0.5 }}>
                    Publicar
                  </button>
                )}
                {selected.estado === 'activa' && (
                  <button onClick={() => handleCambiarEstado(selected.id, 'pausada')} style={{ background: 'transparent', color: '#b45309', border: `1px solid ${YELLOW}55`, borderRadius: 9, padding: '8px 14px', fontFamily: FONT, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    Pausar
                  </button>
                )}
                {selected.estado === 'pausada' && (
                  <button onClick={() => handleCambiarEstado(selected.id, 'activa')} disabled={!negocio?.puede_compartir_cuponeras}
                    title={!negocio?.puede_compartir_cuponeras ? 'Pendiente de aprobación del comprobante de pago' : ''}
                    style={{ background: GREEN, color: '#fff', border: 'none', borderRadius: 9, padding: '8px 14px', fontFamily: FONT, fontSize: 12, fontWeight: 700, cursor: negocio?.puede_compartir_cuponeras ? 'pointer' : 'not-allowed', opacity: negocio?.puede_compartir_cuponeras ? 1 : 0.5 }}>
                    Reactivar
                  </button>
                )}
                {selected.estado !== 'archivada' && (
                  <button onClick={() => handleCambiarEstado(selected.id, 'archivada')} style={{ background: 'transparent', color: MUTED, border: `1px solid ${LINE}`, borderRadius: 9, padding: '8px 14px', fontFamily: FONT, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Archive size={12}/> Archivar
                  </button>
                )}
              </div>
            </Card>
          ) : (
            <Card style={{ textAlign: 'center', padding: '32px 16px', color: MUTED }}>
              <Wallet size={32} style={{ opacity: 0.25, marginBottom: 10 }}/>
              <div style={{ fontFamily: FONT, fontSize: 13 }}>Creá una cuponera para empezar</div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════
export default function AdminNegocioView({ perfil, onVolver, onGoHome }) {
  const [tab, setTab]             = useState('ofertas');
  const [negocio, setNegocio]     = useState(perfil?.negocios || null);
  const [promos, setPromos]       = useState([]);
  const [saldoTokens, setSaldoTokens] = useState(0);
  const [showComprar, setShowComprar] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState(null);
  const [credits, setCredits]     = useState(7);
  const [addonTotal, setAddonTotal] = useState(0);
  const [puntos, setPuntos] = useState(0);

  const notifCount = MOCK_NOTIFS.length;
  const ofertasActivasCount = promos.length > 0
    ? promos.filter(p => p.activo !== false).length
    : MOCK_OFERTAS.filter(o => o.activa).length;
  const navCounts = { ofertas: ofertasActivasCount };

  useEffect(() => { cargarTodo(); }, []);

  async function cargarTodo() {
    if (!perfil?.negocio_id) { setLoading(false); return; }
    setLoading(true);
    if (!negocio) {
      const { data } = await supabase.from('negocios').select('*').eq('id', perfil.negocio_id).single();
      if (data) setNegocio(data);
    }
    const [proRes, saldoRes, walletRes] = await Promise.all([
      supabase.from('promociones').select('*').eq('negocio_id', perfil.negocio_id).order('creado_en', { ascending: false }),
      getSaldo(perfil.negocio_id),
      perfil?.id ? getPuntos(perfil.id) : Promise.resolve({ balance: 0 }),
    ]);
    if (proRes.data) setPromos(proRes.data);
    setSaldoTokens(typeof saldoRes === 'number' ? saldoRes : 0);
    setPuntos(Number(walletRes?.balance) || 0);
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

  // Perfil incompleto (registro trunco): no hay negocio asociado → evitar pantalla en blanco
  if (!negocio) {
    return (
      <div style={{ minHeight:'100vh', background:BG, fontFamily:FONT, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ maxWidth:440, textAlign:'center', background:CARD, border:`1px solid ${LINE}`, borderRadius:20, padding:'40px 32px' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🏗️</div>
          <h2 style={{ fontFamily:FONT, fontSize:20, fontWeight:800, color:INK, margin:'0 0 8px' }}>Tu registro quedó incompleto</h2>
          <p style={{ fontFamily:FONT, fontSize:14, color:INK2, lineHeight:1.6, margin:'0 0 24px' }}>
            No encontramos los datos de tu negocio. Es posible que el registro no se haya terminado de guardar. Volvé al inicio y registrate de nuevo, o contactanos si el problema persiste.
          </p>
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={onGoHome} style={{ background:P, color:'#fff', border:'none', borderRadius:12, padding:'12px 22px', fontFamily:FONT, fontSize:14, fontWeight:700, cursor:'pointer' }}>Volver al inicio</button>
            <button onClick={handleLogout} style={{ background:'#fff', color:INK2, border:`1px solid ${LINE}`, borderRadius:12, padding:'12px 22px', fontFamily:FONT, fontSize:14, fontWeight:600, cursor:'pointer' }}>Cerrar sesión</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:BG, fontFamily:FONT }}>
      <Sidebar
        tab={tab} setTab={setTab} negocio={negocio} perfil={perfil}
        notifCount={notifCount} saldoTokens={saldoTokens} puntos={puntos} navCounts={navCounts}
        setShowComprar={setShowComprar} onVolver={onVolver}
        onGoHome={onGoHome} onLogout={handleLogout}
      />

      <main style={{ flex:1, padding:28, overflowY:'auto', maxWidth:'100%' }}>
        {tab === 'cuenta'      && <TabCuenta credits={credits} addonTotal={addonTotal} setShowComprar={setShowComprar} perfil={perfil} negocio={negocio} setNegocio={setNegocio} showToast={showToast} onCuentaEliminada={handleLogout}/>}
        {tab === 'notif'       && <TabNovedades credits={credits} setCredits={setCredits} onGoToVentas={() => setTab('solicitudes')}/>}
        {tab === 'ofertas'     && <TabOfertas dbPromos={promos} negocioId={perfil?.negocio_id} negocioTipo={negocio?.tipo} showToast={showToast} plan={negocio?.plan || 'free'} onUpgrade={() => setTab('cuenta')} saldoTokens={saldoTokens} setSaldoTokens={setSaldoTokens}/>}
        {tab === 'stats'       && <TabEstadisticas/>}
        {tab === 'solicitudes' && <TabVentas negocioId={perfil?.negocio_id} showToast={showToast}/>}
        {tab === 'empresa' && <TabEmpresa negocio={negocio} showToast={showToast}/>}
        {tab === 'galeria' && <TabGaleria negocio={negocio} showToast={showToast}/>}
        {tab === 'compras'     && <TabCuponeras negocio={negocio} perfil={perfil} showToast={showToast} saldoTokens={saldoTokens} setSaldoTokens={setSaldoTokens} setShowComprar={setShowComprar}/>}
        {tab === 'inbox'       && <TabInbox/>}
        {tab === 'addons'      && <TabAddons addonTotal={addonTotal} setAddonTotal={setAddonTotal} showToast={showToast}/>}
      </main>

      <Toast toast={toast}/>

      {showComprar && (
        <ComprarTokensModal negocioId={perfil?.negocio_id} onClose={() => setShowComprar(false)}
          onSuccess={(nuevos) => { setSaldoTokens(p => p + nuevos); setShowComprar(false); }}/>
      )}

      <style>{`
        * { box-sizing: border-box; }
        input:focus, textarea:focus, select:focus { border-color: ${P} !important; box-shadow: 0 0 0 3px ${PS}; }
        @keyframes girar { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
