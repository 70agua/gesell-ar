// ============================================================
//  src/views/AdminNegocioView.jsx  —  Host Dashboard v2
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  LayoutDashboard, MessageSquare, Bell, Tag, Building2, CreditCard, Puzzle,
  LogOut, ArrowLeft, TrendingUp, Eye, MousePointerClick, Users, ChevronRight,
  Plus, X, Save, ToggleLeft, ToggleRight, Send, Check, Archive,
  Clock, Star, Trash2, Upload, Image, AlertCircle, CheckCircle2, Zap, Crown,
  Store, Coins, ShoppingBag, Utensils, Map, MapPin, Smartphone, Globe, Calendar, Gift,
  MessageCircle, ChevronDown, Edit2, RefreshCw, Package, BarChart2, Home, Search,
  Inbox, CalendarDays, Minus, Megaphone, Download, Mail, Link2, Wallet,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getOrdenesPendientes, getSaldo, debeUsarTokens } from '../lib/cobros';
import { contarSeguidores } from '../lib/seguir';
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

// Rubros editables (deben coincidir con los del registro en LoginView)
const TIPOS_RUBRO = [
  { id: 'alojamiento',    label: 'Alojamiento' },
  { id: 'salidas',        label: 'Salidas' },
  { id: 'aventura_relax', label: 'Aventura & Relax' },
];
const CATS_RUBRO = {
  alojamiento:    ['Hotel', 'Apart', 'Complejo', 'Hostería', 'Resort', 'Cabaña', 'Departamento', 'Domo', 'Dormi', 'Carpa', 'Glamping'],
  salidas:        ['Restaurantes', 'Bares', 'Cafés & Dulces', 'Heladerías', 'Panaderías', 'Discotecas', 'Cines y Teatros', 'Shows y Recitales', 'Centros Culturales', 'Otros'],
  aventura_relax: ['Deportes acuáticos', 'Cabalgatas', 'Kitesurf', 'Yoga / Bienestar', 'Masajes a domicilio', 'Tour fotográfico', 'Pesca deportiva', 'Senderismo', 'Espectáculos'],
};

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

const MOCK_CUPONERAS = [
  {
    id: 'cup1', nombre: 'Escapada Mar de las Pampas', tipo: 'personal',
    cupones: [
      { id: 'c1', titulo: 'Menú completo para 2', negocio: 'La Pescadería Gesell', badge: '-20%',
        imagen: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=80&q=80', vence: '2025-03-31',
        tokens: [{ id: 'TK-2841-A', estado: 'disponible' }] },
      { id: 'c2', titulo: 'Entrada + postre gratis', negocio: 'Churros El Topo', badge: 'Gratis',
        imagen: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=80&q=80', vence: '2025-01-15',
        tokens: [{ id: 'TK-2842-A', estado: 'utilizado' }] },
      { id: 'c3', titulo: 'Paseo en cuatriciclo 1h', negocio: 'Dunas Adventure', badge: '-15%',
        imagen: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&q=80', vence: '2025-04-30',
        tokens: [{ id: 'TK-2843-A', estado: 'disponible' }] },
    ],
  },
  {
    id: 'cup2', nombre: 'Bienvenida Verano 2025', tipo: 'huespedes', precio: 15000,
    cupones: [
      { id: 'c4', titulo: 'Desayuno buffet', negocio: 'Café del Mar', badge: 'Incluido',
        imagen: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=80&q=80', vence: '2025-04-30',
        tokens: [
          { id: 'TK-3001-A', estado: 'utilizado' },
          { id: 'TK-3001-B', estado: 'disponible' },
          { id: 'TK-3001-C', estado: 'disponible' },
        ] },
      { id: 'c5', titulo: 'Copa de bienvenida', negocio: 'La Pescadería Gesell', badge: 'Gratis',
        imagen: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=80&q=80', vence: '2025-04-30',
        tokens: [
          { id: 'TK-3002-A', estado: 'disponible' },
          { id: 'TK-3002-B', estado: 'vencido' },
          { id: 'TK-3002-C', estado: 'disponible' },
        ] },
    ],
  },
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

// ─── Mini date range picker (used in offer editor panel) ────────
const MESES_CAL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS_CAL  = ['L','M','X','J','V','S','D'];
function getMonthCells(y, m) {
  const first = new Date(y, m, 1).getDay();
  const off = first === 0 ? 6 : first - 1;
  const total = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < off; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(new Date(y, m, d));
  return cells;
}
function MiniDateRange({ value, onChange }) {
  const [open, setOpen]   = useState(false);
  const [hover, setHover] = useState(null);
  const [base, setBase]   = useState(() => {
    const d = value?.desde || new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  function handleDay(day) {
    const { desde, hasta } = value || {};
    if (!desde || (desde && hasta)) { onChange({ desde: day, hasta: null }); return; }
    if (day < desde)                 { onChange({ desde: day, hasta: null }); return; }
    onChange({ desde, hasta: day }); setOpen(false);
  }
  const isSt = d => value?.desde && d.getTime() === value.desde.getTime();
  const isEn = d => value?.hasta && d.getTime() === value.hasta.getTime();
  const isIn = d => {
    if (!value?.desde) return false;
    const end = value.hasta || hover; if (!end) return false;
    const [lo, hi] = value.desde <= end ? [value.desde, end] : [end, value.desde];
    return d > lo && d < hi;
  };
  const fmt = d => d ? d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : null;
  const label = value?.desde && value?.hasta
    ? `${fmt(value.desde)} → ${fmt(value.hasta)}`
    : value?.desde ? `Desde ${fmt(value.desde)}` : 'Sin fechas definidas';
  const cells = getMonthCells(base.y, base.m);
  const prevM = () => setBase(b => b.m === 0 ? { y: b.y - 1, m: 11 } : { ...b, m: b.m - 1 });
  const nextM = () => setBase(b => b.m === 11 ? { y: b.y + 1, m: 0 } : { ...b, m: b.m + 1 });
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(v => !v)}
        style={{ width: '100%', padding: '9px 12px', border: `1px solid ${open ? P : LINE}`, borderRadius: 9, background: CARD, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT, fontSize: 12, color: value?.desde ? INK : MUTED, textAlign: 'left', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}>
        <Calendar size={12} style={{ flexShrink: 0, color: value?.desde ? P : MUTED }}/>
        <span style={{ flex: 1, fontWeight: value?.desde ? 600 : 400 }}>{label}</span>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: '12px 10px 10px', zIndex: 9999, boxShadow: '0 16px 48px -16px rgba(11,16,32,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <button onClick={prevM} style={{ width: 26, height: 26, border: `1px solid ${LINE}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 15, display: 'grid', placeItems: 'center', color: INK }}>‹</button>
            <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: INK }}>{MESES_CAL[base.m]} {base.y}</span>
            <button onClick={nextM} style={{ width: 26, height: 26, border: `1px solid ${LINE}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 15, display: 'grid', placeItems: 'center', color: INK }}>›</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
            {DIAS_CAL.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: MUTED, padding: '2px 0' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1 }}>
            {cells.map((day, i) => {
              if (!day) return <div key={`n${i}`}/>;
              const st = isSt(day), en = isEn(day), rng = isIn(day);
              return (
                <button key={day.getTime()} onClick={() => handleDay(day)}
                  onMouseEnter={() => { if (value?.desde && !value?.hasta) setHover(day); }}
                  onMouseLeave={() => setHover(null)}
                  style={{ padding: '5px 2px', border: 'none', borderRadius: (st || en) ? '50%' : rng ? 0 : 3, background: (st || en) ? P : rng ? PS : 'transparent', color: (st || en) ? '#fff' : rng ? P : INK, fontSize: 11, fontWeight: (st || en) ? 700 : 400, cursor: 'pointer', fontFamily: FONT, transition: 'background 0.1s' }}>
                  {day.getDate()}
                </button>
              );
            })}
          </div>
          {(value?.desde || value?.hasta) && (
            <div style={{ borderTop: `1px solid ${LINE}`, marginTop: 8, paddingTop: 8, textAlign: 'right' }}>
              <button onClick={() => { onChange({ desde: null, hasta: null }); setOpen(false); }}
                style={{ background: 'none', border: 'none', color: P, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Borrar fechas</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabOfertas({ dbPromos, negocioId, showToast }) {
  const [ofertas, setOfertas] = useState(() => {
    if (dbPromos.length > 0) {
      return dbPromos.map(p => {
        const src = p.imagen || p.img || null;
        return { id: p.id, titulo: p.titulo || p.nombre, desc: p.descripcion || '', descuento: p.descuento || 0, tipo: p.tipo || 'Descuento Directo', activa: p.activo !== false, img: src, imagenes: src ? [{ src, file: null }] : [] };
      });
    }
    return MOCK_OFERTAS.map((o, i) => {
      const src = PLACEHOLDER_IMGS[i % PLACEHOLDER_IMGS.length];
      return { ...o, img: src, imagenes: [{ src, file: null }] };
    });
  });
  const ofertasAsociadas = MOCK_OFERTAS_ASOCIADAS;
  const [vistaGrid, setVistaGrid]         = useState(true);
  const [editingOferta, setEditingOferta] = useState('new');
  const EMPTY_FORM = {
    titulo: '', badge: '', desc: '',
    tipo: 'standard',
    flashFechaFin: null,
    ahorrosUsuarios: '10',
    exclusivaZona: 'localidad',
    activa: true, imagenes: [], fechaDesde: null, fechaHasta: null,
  };
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [isDirty, setIsDirty]   = useState(false);
  const [unsavedModal, setUnsavedModal] = useState(false);
  const pendingNav = useRef(null);
  const fileInputRef = useRef(null);

  const setF = updater => { setEditForm(updater); setIsDirty(true); };

  const TIPOS_OFERTA = [
    { id: 'standard',  label: 'Oferta estándar',       Icon: Tag,    accent: INK2,      bg: BG,       desc: 'Sin condiciones especiales' },
    { id: 'flash',     label: 'FLASH',                 Icon: Zap,    accent: '#ef4444', bg: '#fff5f5', desc: 'Tiempo limitado con countdown' },
    { id: 'ahorros',   label: 'Ahorros compartidos',   Icon: Users,  accent: '#7c3aed', bg: '#f5f3ff', desc: 'Se activa al sumar N usuarios' },
    { id: 'exclusiva', label: 'Exclusiva por zona',    Icon: MapPin, accent: '#059669', bg: '#f0fdf4', desc: 'Solo para ciertas localidades' },
  ];
  const ZONAS = [
    { id: 'localidad', label: 'Solo esta localidad' },
    { id: 'cercanas',  label: 'Zonas cercanas'      },
    { id: 'alejadas',  label: 'Zonas alejadas'      },
  ];

  function handleImageFiles(files) {
    files.filter(f => f.type.startsWith('image/')).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => setF(f => ({ ...f, imagenes: [...f.imagenes, { src: e.target.result, file }] }));
      reader.readAsDataURL(file);
    });
  }

  function tipoLegacyMap(t) {
    if (!t || t === 'Descuento Directo' || t === 'Normal') return 'standard';
    if (t === 'Pack Armado') return 'ahorros';
    if (['standard', 'flash', 'ahorros', 'exclusiva'].includes(t)) return t;
    return 'standard';
  }

  function doStartEdit(o) {
    setEditingOferta(o);
    setEditForm({
      titulo: o.titulo || '',
      badge: o.badge || (o.descuento ? `${o.descuento}%` : ''),
      desc: o.desc || '',
      tipo: tipoLegacyMap(o.tipo),
      flashFechaFin: o.flashFechaFin || null,
      ahorrosUsuarios: String(o.ahorrosUsuarios || '10'),
      exclusivaZona: o.exclusivaZona || 'localidad',
      activa: o.activa !== false,
      imagenes: o.imagenes?.length > 0 ? o.imagenes : o.img ? [{ src: o.img, file: null }] : [],
      fechaDesde: o.fechaDesde || null,
      fechaHasta: o.fechaHasta || null,
    });
    setIsDirty(false);
  }

  function doStartNew() {
    setEditingOferta('new');
    setEditForm(EMPTY_FORM);
    setIsDirty(false);
  }

  function tryNav(action) {
    if (isDirty) { pendingNav.current = action; setUnsavedModal(true); }
    else action();
  }

  function startEdit(o) { tryNav(() => doStartEdit(o)); }
  function startNew()   { tryNav(doStartNew); }

  function saveEdit(thenRun) {
    if (!editForm.titulo.trim()) { showToast('El título es obligatorio', 'err'); return false; }
    const data = { ...editForm };
    if (editingOferta === 'new') {
      const o = { id: Date.now(), ...data, img: data.imagenes[0]?.src || null };
      setOfertas(prev => [...prev, o]);
      setEditingOferta(o);
    } else {
      const updated = { ...data, img: data.imagenes[0]?.src || editingOferta.img || null };
      setOfertas(prev => prev.map(o => o.id === editingOferta.id ? { ...o, ...updated } : o));
      setEditingOferta(prev => ({ ...prev, ...updated }));
    }
    setIsDirty(false);
    showToast('Cambios guardados', 'ok');
    if (thenRun) thenRun();
    return true;
  }

  function deleteEditing() {
    if (!editingOferta || editingOferta === 'new') return;
    if (!window.confirm('¿Eliminar esta oferta?')) return;
    setOfertas(prev => prev.filter(o => o.id !== editingOferta.id));
    doStartNew();
    showToast('Oferta eliminada', 'ok');
  }

  function toggleActiva(id) {
    setOfertas(prev => prev.map(o => o.id === id ? { ...o, activa: !o.activa } : o));
    if (editingOferta?.id === id) setEditForm(f => ({ ...f, activa: !f.activa }));
    showToast('Estado actualizado', 'ok');
  }

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
            <div style={{ color: '#fff', fontSize: 28, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1 }}>{o.badge || (o.descuento ? `${o.descuento}%` : '')}</div>
          </div>
          <div style={{ position: 'absolute', top: 10, left: 10, background: o.activa ? 'rgba(16,185,129,0.85)' : 'rgba(100,116,139,0.7)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 999 }}>
            {o.activa ? 'Activa' : 'Inactiva'}
          </div>
        </div>
        <div style={{ padding: '11px 13px 13px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>{o.tipo}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: INK, lineHeight: 1.3, flex: 1 }}>{o.titulo}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div onClick={e => e.stopPropagation()}>
              <Toggle on={o.activa} onChange={() => toggleActiva(o.id)}/>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: o.activa ? GREEN : MUTED, flex: 1 }}>{o.activa ? 'Activa' : 'Inactiva'}</span>
          </div>
        </div>
      </div>
    );
  }

  function OfertaRowList({ o }) {
    const isSel = editingOferta && editingOferta !== 'new' && editingOferta.id === o.id;
    return (
      <div style={{ background: CARD, border: `1px solid ${isSel ? P : LINE}`, borderRadius: 12, padding: '13px 15px', display: 'flex', alignItems: 'center', gap: 14, fontFamily: FONT }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: isSel ? PS : '#f1f5f9', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: isSel ? P : MUTED }}>−{o.descuento}%</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: INK }}>{o.titulo}</div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>{o.tipo}{o.desc && ` · ${o.desc}`}</div>
        </div>
        <Toggle on={o.activa} onChange={() => toggleActiva(o.id)}/>
        <span style={{ fontSize: 11, fontWeight: 600, color: o.activa ? GREEN : MUTED, minWidth: 44 }}>{o.activa ? 'Activa' : 'Inactiva'}</span>
        <button onClick={() => startEdit(o)} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${isSel ? P : LINE}`, background: isSel ? PS : '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer', color: isSel ? P : INK2 }}>
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

  const SectionHeader = ({ title, subtitle }) => (
    <div style={{ marginTop:8, marginBottom:4 }}>
      <div style={{ fontFamily:FONT, fontSize:15, fontWeight:700, color:INK }}>{title}</div>
      {subtitle && <div style={{ fontFamily:FONT, fontSize:12, color:MUTED, marginTop:2 }}>{subtitle}</div>}
    </div>
  );

  const inputSt = { width: '100%', padding: '9px 12px', borderRadius: 9, border: `1px solid ${LINE}`, fontFamily: FONT, fontSize: 13, color: INK, outline: 'none', boxSizing: 'border-box', background: '#fff' };
  const labelSt = { fontFamily: FONT, fontSize: 10, fontWeight: 700, color: INK2, textTransform: 'uppercase', letterSpacing: '0.06em' };

  const FieldLabel = ({ label, val, max }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
      <span style={labelSt}>{label}</span>
      {max && <span style={{ fontFamily: FONT, fontSize: 10, color: (val||'').length >= max ? '#ef4444' : MUTED }}>{(val||'').length}/{max}</span>}
    </div>
  );

  return (
    <>
    <div style={{ display: 'flex', alignItems: 'stretch', margin: -28, minHeight: '100vh' }}>

      {/* ─── Left: lista ─── */}
      <div style={{ flex: 1, minWidth: 0, padding: 28, paddingRight: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ fontFamily: FONT, fontSize: 20, fontWeight: 700, color: INK, margin: 0, flex: 1 }}>Ofertas</h2>
          <div style={{ display: 'flex', border: `1px solid ${LINE}`, borderRadius: 10, overflow: 'hidden' }}>
            {[{ grid: true, icon: <IcoGrid/> }, { grid: false, icon: <IcoList/> }].map(({ grid, icon }) => (
              <button key={String(grid)} onClick={() => setVistaGrid(grid)} style={{ width: 34, height: 34, border: 'none', background: vistaGrid === grid ? PS : 'transparent', color: vistaGrid === grid ? P : MUTED, display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                {icon}
              </button>
            ))}
          </div>
        </div>

        <SectionHeader title="Creadas por mí" subtitle="Hacé clic en una oferta para editarla en el panel."/>
        {vistaGrid ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 14 }}>
            <button onClick={startNew}
              style={{ background: editingOferta === 'new' ? PS : 'transparent', border: `2px dashed ${editingOferta === 'new' ? P : LINE}`, borderRadius: 20, minHeight: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', color: editingOferta === 'new' ? P : MUTED, fontFamily: FONT }}
              onMouseEnter={e => { if (editingOferta !== 'new') { e.currentTarget.style.borderColor = P; e.currentTarget.style.background = PS; e.currentTarget.style.color = P; } }}
              onMouseLeave={e => { if (editingOferta !== 'new') { e.currentTarget.style.borderColor = LINE; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = MUTED; } }}
            >
              <div style={{ width: 44, height: 44, borderRadius: '50%', border: '2px dashed currentColor', display: 'grid', placeItems: 'center' }}><Plus size={20}/></div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Crear oferta</span>
            </button>
            {[...ofertas].reverse().map((o, idx) => <OfertaCardGrid key={o.id} o={o} idx={idx}/>)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...ofertas].reverse().map(o => <OfertaRowList key={o.id} o={o}/>)}
            <button onClick={startNew} style={{ background: 'transparent', border: `2px dashed ${LINE}`, borderRadius: 12, padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', color: MUTED, fontFamily: FONT, fontSize: 13, fontWeight: 600 }}>
              <Plus size={16} color={MUTED}/> Crear oferta
            </button>
          </div>
        )}

      </div>

      {/* ─── Separator ─── */}
      <div style={{ width: 1, background: LINE, flexShrink: 0 }}/>

      {/* ─── Right: panel edición — full height, sin recuadro ─── */}
      <div style={{ width: '36%', flexShrink: 0, position: 'sticky', top: -28, height: '100vh', background: CARD, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

        {/* Header panel */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: PS, flexShrink: 0 }}>
          <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: P }}>
            {editingOferta === 'new' ? 'Crear oferta' : 'Editar oferta'}
          </span>
          {editingOferta !== 'new' && (
            <button onClick={startNew} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: `1px solid ${LINE}`, borderRadius: 8, cursor: 'pointer', color: MUTED, padding: '4px 10px', fontFamily: FONT, fontSize: 11, fontWeight: 600 }}>
              <Plus size={11}/> Crear oferta
            </button>
          )}
        </div>

        {/* Contenido del panel */}
        <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>

          {/* ── Imágenes ── */}
          <div>
            {editForm.imagenes.length > 0 ? (
              <>
                {/* Foto principal */}
                <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 8, position: 'relative', aspectRatio: '16/9' }}>
                  <img src={editForm.imagenes[0].src} alt="principal" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)', padding: '12px 10px 8px' }}>
                    <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Foto principal</span>
                  </div>
                  <button onClick={() => setEditForm(f => ({ ...f, imagenes: f.imagenes.filter((_, j) => j !== 0) }))}
                    style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 0 }}>
                    <X size={12}/>
                  </button>
                </div>
                {/* Thumbnails */}
                {editForm.imagenes.length > 1 && (
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                    {editForm.imagenes.slice(1).map((img, i) => (
                      <div key={i+1} style={{ position: 'relative', width: 56, height: 56, borderRadius: 8, overflow: 'hidden', border: `1px solid ${LINE}`, flexShrink: 0 }}>
                        <img src={img.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                        <button onClick={() => setEditForm(f => ({ ...f, imagenes: f.imagenes.filter((_, j) => j !== i+1) }))}
                          style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 0 }}>
                          <X size={9}/>
                        </button>
                      </div>
                    ))}
                    <div onClick={() => fileInputRef.current?.click()} title="Agregar foto"
                      style={{ width: 56, height: 56, borderRadius: 8, border: `2px dashed ${LINE}`, display: 'grid', placeItems: 'center', cursor: 'pointer', color: MUTED, flexShrink: 0 }}>
                      <Plus size={18}/>
                    </div>
                  </div>
                )}
                {editForm.imagenes.length === 1 && (
                  <button onClick={() => fileInputRef.current?.click()} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'none', border: `1px dashed ${LINE}`, borderRadius: 8, padding: '8px 0', cursor: 'pointer', color: MUTED, fontFamily: FONT, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    <Upload size={13}/> Agregar más fotos
                  </button>
                )}
              </>
            ) : (
              <>
                <FieldLabel label="Imágenes"/>
                <div onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); handleImageFiles(Array.from(e.dataTransfer.files)); }}
                  style={{ border: `2px dashed ${LINE}`, borderRadius: 9, padding: '20px 0', textAlign: 'center', cursor: 'pointer', color: MUTED, fontFamily: FONT, fontSize: 12 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = P; e.currentTarget.style.background = PS; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = LINE; e.currentTarget.style.background = 'transparent'; }}>
                  <Upload size={18} style={{ margin: '0 auto 6px', display: 'block', opacity: 0.4 }}/>
                  Arrastrá o hacé clic para subir fotos
                </div>
              </>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
              onChange={e => { handleImageFiles(Array.from(e.target.files)); e.target.value = ''; }}/>
          </div>

          <div style={{ borderTop: `1px solid ${LINE}` }}/>

          {/* ── Badge / mini-descripción ── */}
          <div>
            <FieldLabel label="Mini-descripción del descuento" val={editForm.badge} max={10}/>
            <input
              value={editForm.badge}
              onChange={e => e.target.value.length <= 10 && setEditForm(f => ({ ...f, badge: e.target.value }))}
              placeholder="Ej: 20%"
              maxLength={10}
              style={inputSt}
            />
          </div>

          {/* ── Título ── */}
          <div>
            <FieldLabel label="Título" val={editForm.titulo} max={80}/>
            <input
              value={editForm.titulo}
              onChange={e => e.target.value.length <= 80 && setEditForm(f => ({ ...f, titulo: e.target.value }))}
              placeholder="Ej: Escapada romántica en Mar de las Pampas"
              maxLength={80}
              style={inputSt}
            />
          </div>

          {/* ── Descripción ── */}
          <div>
            <FieldLabel label="Descripción" val={editForm.desc} max={300}/>
            <textarea
              value={editForm.desc}
              onChange={e => e.target.value.length <= 300 && setEditForm(f => ({ ...f, desc: e.target.value }))}
              placeholder="Describí la oferta con detalle…"
              maxLength={300}
              rows={3}
              style={{ ...inputSt, resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>

          {/* ── Tipo de oferta ── */}
          <div>
            <FieldLabel label="Tipo de oferta"/>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {TIPOS_OFERTA.map(t => {
                const sel = editForm.tipo === t.id;
                return (
                  <div key={t.id}
                    onClick={() => setF(f => ({ ...f, tipo: t.id }))}
                    style={{ border: `1.5px solid ${sel ? t.accent : LINE}`, borderRadius: 10, padding: '10px 12px', cursor: 'pointer', background: sel ? t.bg : '#fff', transition: 'all 0.12s' }}>

                    {/* Label row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${sel ? t.accent : LINE}`, background: sel ? t.accent : '#fff', flexShrink: 0, display: 'grid', placeItems: 'center' }}>
                        {sel && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }}/>}
                      </div>

                      {t.id === 'flash' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#ef4444', borderRadius: 6, padding: '2px 9px 2px 6px' }}>
                          <Zap size={11} color="#fff" fill="#fff" style={{ flexShrink: 0 }}/>
                          <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 900, color: '#fff', fontStyle: 'italic', letterSpacing: '0.04em' }}>FLASH</span>
                        </div>
                      ) : t.id === 'ahorros' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ background: sel ? '#7c3aed' : '#ede9fe', borderRadius: 6, width: 22, height: 22, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                            <Users size={12} color={sel ? '#fff' : '#7c3aed'}/>
                          </div>
                          <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: sel ? '#7c3aed' : INK }}>Ahorros compartidos</span>
                        </div>
                      ) : t.id === 'exclusiva' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <MapPin size={13} color={sel ? '#059669' : MUTED} style={{ flexShrink: 0 }}/>
                          <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: sel ? '#059669' : INK }}>Exclusiva por zona</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Tag size={12} color={sel ? INK2 : MUTED} style={{ flexShrink: 0 }}/>
                          <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: sel ? INK : MUTED }}>Oferta estándar</span>
                        </div>
                      )}
                    </div>
                    <div style={{ fontFamily: FONT, fontSize: 11, color: MUTED, marginTop: 3, marginLeft: 22 }}>{t.desc}</div>

                    {/* Sub-selectores */}
                    {sel && t.id === 'flash' && (
                      <div style={{ marginTop: 10, marginLeft: 22 }}>
                        <div style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Fecha y hora límite</div>
                        <input
                          type="datetime-local"
                          value={editForm.flashFechaFin ? new Date(editForm.flashFechaFin.getTime() - editForm.flashFechaFin.getTimezoneOffset()*60000).toISOString().slice(0,16) : ''}
                          onChange={e => setF(f => ({ ...f, flashFechaFin: e.target.value ? new Date(e.target.value) : null }))}
                          onClick={e => e.stopPropagation()}
                          style={{ ...inputSt, fontSize: 12, accentColor: '#ef4444' }}
                        />
                      </div>
                    )}

                    {sel && t.id === 'ahorros' && (
                      <div style={{ marginTop: 10, marginLeft: 22 }}>
                        <div style={{ fontFamily: FONT, fontSize: 11, color: '#7c3aed', fontWeight: 600, marginBottom: 6 }}>Usuarios necesarios para activarla:</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button onClick={e => { e.stopPropagation(); setF(f => ({ ...f, ahorrosUsuarios: String(Math.max(2, Number(f.ahorrosUsuarios)-1)) })); }}
                            style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #ddd6fe', background: '#ede9fe', cursor: 'pointer', fontFamily: FONT, fontWeight: 700, color: '#7c3aed', fontSize: 16, display: 'grid', placeItems: 'center' }}>−</button>
                          <input
                            type="number" min="2" max="999"
                            value={editForm.ahorrosUsuarios}
                            onChange={e => setF(f => ({ ...f, ahorrosUsuarios: e.target.value }))}
                            onClick={e => e.stopPropagation()}
                            style={{ width: 56, padding: '5px 8px', borderRadius: 7, border: '1px solid #ddd6fe', fontFamily: FONT, fontSize: 15, fontWeight: 800, color: '#7c3aed', outline: 'none', textAlign: 'center', background: '#fff' }}
                          />
                          <button onClick={e => { e.stopPropagation(); setF(f => ({ ...f, ahorrosUsuarios: String(Number(f.ahorrosUsuarios)+1) })); }}
                            style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #ddd6fe', background: '#ede9fe', cursor: 'pointer', fontFamily: FONT, fontWeight: 700, color: '#7c3aed', fontSize: 16, display: 'grid', placeItems: 'center' }}>+</button>
                          <span style={{ fontFamily: FONT, fontSize: 11, color: MUTED }}>personas</span>
                        </div>
                      </div>
                    )}

                    {sel && t.id === 'exclusiva' && (
                      <div style={{ marginTop: 10, marginLeft: 22, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {ZONAS.map(z => (
                          <label key={z.id} onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <input type="radio" name="zona" checked={editForm.exclusivaZona === z.id}
                              onChange={() => setF(f => ({ ...f, exclusivaZona: z.id }))}
                              style={{ accentColor: '#059669', width: 14, height: 14 }}/>
                            <span style={{ fontFamily: FONT, fontSize: 12, color: editForm.exclusivaZona === z.id ? '#059669' : INK, fontWeight: editForm.exclusivaZona === z.id ? 700 : 400 }}>{z.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Período activo (desactivado para FLASH) ── */}
          <div style={{ opacity: editForm.tipo === 'flash' ? 0.38 : 1, pointerEvents: editForm.tipo === 'flash' ? 'none' : 'auto', transition: 'opacity 0.2s' }}>
            <FieldLabel label="Período activo"/>
            {editForm.tipo === 'flash' ? (
              <div style={{ fontFamily: FONT, fontSize: 11, color: MUTED, padding: '8px 10px', background: '#fff5f5', borderRadius: 8, border: '1px solid #fecaca' }}>
                Las ofertas FLASH usan su propia fecha límite.
              </div>
            ) : (
              <>
                <MiniDateRange
                  value={{ desde: editForm.fechaDesde, hasta: editForm.fechaHasta }}
                  onChange={({ desde, hasta }) => setF(f => ({ ...f, fechaDesde: desde, fechaHasta: hasta }))}
                />
                {editForm.fechaDesde && editForm.fechaHasta && (
                  <div style={{ fontFamily: FONT, fontSize: 10, color: MUTED, marginTop: 4 }}>
                    Activa {Math.round((editForm.fechaHasta - editForm.fechaDesde) / 86400000) + 1} días
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Estado ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: BG, borderRadius: 9 }}>
            <Toggle on={editForm.activa} onChange={v => setF(f => ({ ...f, activa: v }))}/>
            <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: editForm.activa ? GREEN : MUTED }}>{editForm.activa ? 'Activa' : 'Inactiva'}</span>
          </div>

          {/* ── Acciones ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 8 }}>
            <button onClick={() => saveEdit()} style={{ width: '100%', background: isDirty ? P : `${P}88`, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 0', fontFamily: FONT, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'background 0.15s' }}>
              <Save size={14}/> {editingOferta === 'new' ? 'Crear oferta' : 'Guardar cambios'}
              {isDirty && <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.25)', borderRadius: 4, padding: '1px 5px', marginLeft: 2 }}>sin guardar</span>}
            </button>
            {editingOferta !== 'new' && (
              <button onClick={deleteEditing} style={{ width: '100%', background: 'transparent', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 10, padding: '9px 0', fontFamily: FONT, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Trash2 size={13}/> Eliminar oferta
              </button>
            )}
          </div>

        </div>
      </div>

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
            <button onClick={() => { const ok = saveEdit(); if (ok) { setUnsavedModal(false); pendingNav.current?.(); pendingNav.current = null; } }}
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
    </>
  );
}

// ════════════════════════════════════════════════════════════
//  TAB — MI EMPRESA  (constantes + helpers)
// ════════════════════════════════════════════════════════════
const LOCALIDADES_ADM = ['Villa Gesell', 'Mar de las Pampas', 'Las Gaviotas', 'Mar Azul'];

const PROVINCIAS_AR = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut',
  'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy',
  'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén',
  'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz',
  'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán',
];

const SERVICIOS_ALOJ = [
  'WiFi', 'Estacionamiento', 'Pileta', 'Desayuno incluido',
  'Aire acondicionado', 'Calefacción', 'Cocina equipada', 'Parrilla',
  'Lavarropas', 'Secador de cabello', 'TV Smart', 'Ropa de cama',
  'Toallas incluidas', 'Caja fuerte', 'Recepción 24 hs', 'Terraza / Balcón',
  'Vista al mar', 'Bicicletas', 'Jardín / Patio', 'Servicio de limpieza',
];

// Estilos base de campo heredados del panel
const INP = {
  width: '100%', boxSizing: 'border-box', padding: '10px 14px',
  borderRadius: 10, border: `1px solid ${LINE}`, fontFamily: FONT,
  fontSize: 13, color: INK, outline: 'none', background: '#fff',
  transition: 'border-color .15s',
};
const LBL = {
  fontFamily: FONT, fontSize: 11, fontWeight: 700, color: INK2,
  display: 'block', marginBottom: 6,
  textTransform: 'uppercase', letterSpacing: '0.05em',
};

function SecTitulo({ label, Icon: Ico }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${LINE}` }}>
      {Ico && <div style={{ width: 26, height: 26, borderRadius: 7, background: PS, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Ico size={14} color={P} /></div>}
      <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: INK }}>{label}</span>
    </div>
  );
}

function ToggleRow({ label, on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', border: `1px solid ${on ? P : LINE}`, borderRadius: 10, background: on ? PS : '#fff', cursor: 'pointer', userSelect: 'none', transition: 'all .15s' }}>
      <span style={{ fontFamily: FONT, fontSize: 13, color: on ? P : INK2, fontWeight: 500 }}>{label}</span>
      <Toggle on={on} onChange={() => {}} />
    </div>
  );
}

function ServiciosMulti({ selected, onChange }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('');
  const toggle = (s) => onChange(selected.includes(s) ? selected.filter(x => x !== s) : [...selected, s]);
  const addCustom = () => { const t = custom.trim(); if (t && !selected.includes(t)) onChange([...selected, t]); setCustom(''); };
  const extras = selected.filter(s => !SERVICIOS_ALOJ.includes(s));
  return (
    <div>
      <label style={LBL}>Servicios incluidos</label>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ ...INP, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderRadius: open ? '10px 10px 0 0' : 10, borderColor: open ? P : LINE, color: selected.length ? INK : MUTED }}>
        <span style={{ fontFamily: FONT, fontSize: 13 }}>
          {selected.length === 0 ? 'Seleccionar servicios...' : `${selected.length} servicio${selected.length !== 1 ? 's' : ''} seleccionado${selected.length !== 1 ? 's' : ''}`}
        </span>
        <ChevronDown size={14} color={MUTED} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{ border: `1px solid ${P}`, borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '12px 12px 10px', background: '#fff' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {SERVICIOS_ALOJ.map(s => {
              const sel = selected.includes(s);
              return (
                <div key={s} onClick={() => toggle(s)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: sel ? PS : 'transparent', cursor: 'pointer', userSelect: 'none', transition: 'background .1s' }}>
                  <div style={{ width: 15, height: 15, borderRadius: 4, border: `1.5px solid ${sel ? P : LINE}`, background: sel ? P : '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, transition: 'all .1s' }}>
                    {sel && <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span style={{ fontSize: 12.5, color: sel ? P : INK2, fontFamily: FONT, fontWeight: sel ? 600 : 400 }}>{s}</span>
                </div>
              );
            })}
          </div>
          <div style={{ borderTop: `1px solid ${LINE}`, marginTop: 10, paddingTop: 10, display: 'flex', gap: 8 }}>
            <input value={custom} onChange={e => setCustom(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
              placeholder="Agregar otro servicio..." style={{ flex: 1, border: `1px solid ${LINE}`, borderRadius: 8, padding: '7px 12px', fontSize: 12, fontFamily: FONT, color: INK, outline: 'none' }} />
            <button type="button" onClick={addCustom} style={{ padding: '7px 14px', background: P, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>+</button>
          </div>
          {extras.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
              {extras.map(s => (
                <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', background: PS, borderRadius: 999, fontSize: 12, color: P, fontFamily: FONT }}>
                  {s} <button type="button" onClick={() => toggle(s)} style={{ background: 'none', border: 'none', color: P, cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabEmpresa({ negocio, showToast }) {
  const tipoInit = (() => {
    const t = negocio?.tipo || '';
    return TIPOS_ALOJ_ADMIN.has(t) ? 'alojamiento' : t;
  })();
  const [tipoSel, setTipoSel] = useState(tipoInit);
  const [catsSel, setCatsSel] = useState(
    negocio?.categoria ? negocio.categoria.split(' / ').map(s => s.trim()).filter(Boolean) : []
  );
  const toggleCatSel = (c) => setCatsSel(prev =>
    prev.includes(c) ? prev.filter(x => x !== c) : (prev.length >= 2 ? prev : [...prev, c])
  );
  const tipo = tipoSel;
  const esAloj    = tipoSel === 'alojamiento';
  const esSalidas = tipoSel === 'salidas';
  const esAvent   = tipoSel === 'aventura_relax';

  const parsedServicios = negocio?.servicios
    ? negocio.servicios.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  // ── Estado del formulario ──────────────────────────────────
  const [nombre,       setNombre]       = useState(negocio?.nombre      || '');
  // Contacto
  const [email,        setEmail]        = useState(negocio?.email       || '');
  const [telFijoCod,   setTelFijoCod]   = useState(negocio?.tel_fijo_cod  || '+54');
  const [telFijoNum,   setTelFijoNum]   = useState(negocio?.tel_fijo_num  || '');
  const [telMovilCod,  setTelMovilCod]  = useState(negocio?.tel_movil_cod || '+54');
  const [telMovilNum,  setTelMovilNum]  = useState(negocio?.tel_movil_num || '');
  const [sitioWeb,     setSitioWeb]     = useState(negocio?.sitio_web  || '');
  const [instagram,    setInstagram]    = useState(negocio?.instagram  || '');
  const [facebook,     setFacebook]     = useState(negocio?.facebook   || '');
  const [tiktok,       setTiktok]       = useState(negocio?.tiktok     || '');
  // Ubicación
  const [pais,         setPais]         = useState(negocio?.pais        || 'Argentina');
  const [provincia,    setProvincia]    = useState(negocio?.provincia   || '');
  const [localidad,    setLocalidad]    = useState(negocio?.localidad   || '');
  const [codPostal,    setCodPostal]    = useState(negocio?.cod_postal  || '');
  const [calle,        setCalle]        = useState(negocio?.calle        || '');
  const [numero,       setNumero]       = useState(negocio?.numero       || '');
  const [piso,         setPiso]         = useState(negocio?.piso         || '');
  const [depto,        setDepto]        = useState(negocio?.depto        || '');
  const [entreCalles,  setEntreCalles]  = useState(negocio?.entre_calles || '');
  const [descripcion,  setDescripcion]  = useState(negocio?.descripcion || '');

  // Alojamiento
  const [tamMinM2,          setTamMinM2]          = useState(negocio?.tam_min_m2?.toString()    || '');
  const [tamMaxM2,          setTamMaxM2]           = useState(negocio?.tam_max_m2?.toString()    || '');
  const [minHues,           setMinHues]            = useState(negocio?.min_huespedes?.toString() || '');
  const [maxHues,           setMaxHues]            = useState(negocio?.max_huespedes?.toString() || '');
  const [serviciosSelected, setServiciosSelected]  = useState(parsedServicios);
  const [aceptaMascotas,    setAceptaMascotas]     = useState(negocio?.acepta_mascotas || false);
  const [aceptaNinos,       setAceptaNinos]        = useState(negocio?.acepta_ninos    ?? true);

  // Salidas
  const [capacidad,  setCapacidad]  = useState(negocio?.capacidad?.toString() || '');
  const [tipoCocina, setTipoCocina] = useState(negocio?.tipo_cocina           || '');

  // Aventura & Relax
  const [duracion,  setDuracion]  = useState(negocio?.duracion             || '');
  const [maxPax,    setMaxPax]    = useState(negocio?.max_pax?.toString()   || '');
  const [sedeFija,  setSedeFija]  = useState(negocio?.sede_fija             || '');

  // Logo + galería
  const [logoPreview, setLogoPreview] = useState(negocio?.imagen_url || null);
  const [logoFile,    setLogoFile]    = useState(null);
  const logoRef = useRef();
  const [fotos,      setFotos]      = useState(MOCK_FOTOS);
  const [isDragOver, setIsDragOver] = useState(false);
  const fotoRef = useRef();
  const [saving, setSaving] = useState(false);

  const addFiles = (files) => {
    [...(files || [])].filter(f => f.type.startsWith('image/')).forEach(f =>
      setFotos(prev => [...prev, { id: Date.now() + Math.random(), src: URL.createObjectURL(f), alt: f.name }])
    );
  };
  const handleGalleryDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const DESC_MIN = 40;
  const DESC_MAX = 450;

  const handleLogoChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setLogoFile(f);
    const reader = new FileReader();
    reader.onload = ev => setLogoPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        nombre, tipo: tipoSel, categoria: catsSel.join(' / '),
        email: email.trim() || null,
        tel_fijo_cod: telFijoNum.trim() ? telFijoCod : null, tel_fijo_num: telFijoNum.trim() || null,
        tel_movil_cod: telMovilNum.trim() ? telMovilCod : null, tel_movil_num: telMovilNum.trim() || null,
        sitio_web: sitioWeb, instagram, facebook: facebook.trim() || null, tiktok: tiktok.trim() || null,
        pais, provincia, localidad, cod_postal: codPostal,
        calle: calle.trim() || null, numero: numero.trim() || null, piso: piso.trim() || null,
        depto: depto.trim() || null, entre_calles: entreCalles.trim() || null,
        descripcion,
      };
      if (esAloj) {
        Object.assign(payload, {
          tam_min_m2: tamMinM2 ? parseFloat(tamMinM2) : null,
          tam_max_m2: tamMaxM2 ? parseFloat(tamMaxM2) : null,
          min_huespedes: minHues ? parseInt(minHues) : null,
          max_huespedes: maxHues ? parseInt(maxHues) : null,
          servicios: serviciosSelected.join(', '),
          acepta_mascotas: aceptaMascotas,
          acepta_ninos:    aceptaNinos,
        });
      } else if (esSalidas) {
        payload.capacidad   = capacidad ? parseInt(capacidad) : null;
        payload.tipo_cocina = tipoCocina;
      } else if (esAvent) {
        payload.duracion  = duracion;
        payload.max_pax   = maxPax ? parseInt(maxPax) : null;
        payload.sede_fija = sedeFija;
      }

      if (logoFile && negocio?.id) {
        try {
          const ext = logoFile.name.split('.').pop().toLowerCase();
          const { data: up } = await supabase.storage
            .from('negocios').upload(`logos/${negocio.id}.${ext}`, logoFile, { upsert: true });
          if (up) {
            const { data: ud } = supabase.storage.from('negocios').getPublicUrl(up.path);
            payload.imagen_url = ud.publicUrl;
          }
        } catch { /* logo se puede subir más tarde */ }
      }

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

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 740 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h2 style={{ fontFamily: FONT, fontSize: 20, fontWeight: 700, color: INK, margin: 0, flex: 1 }}>Mi Empresa</h2>
        {catsSel.map(c => <Pill key={c} label={c} />)}
      </div>

      {/* ── Identidad ── */}
      <Card>
        <SecTitulo label="Identidad" Icon={Building2} />
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

          {/* Logo circular */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div onClick={() => logoRef.current?.click()} style={{ width: 96, height: 96, borderRadius: '50%', border: `2px dashed ${logoPreview ? P : LINE}`, cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: logoPreview ? 'transparent' : BG, transition: 'border-color .15s', position: 'relative' }}>
              {logoPreview
                ? <img src={logoPreview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="18" r="10" fill={LINE} />
                    <path d="M4 46c0-11.046 8.954-20 20-20s20 8.954 20 20" fill={LINE} />
                  </svg>
                )
              }
            </div>
            <button type="button" onClick={() => logoRef.current?.click()} style={{ fontSize: 11, fontWeight: 700, color: P, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT }}>
              {logoPreview ? 'Cambiar logo' : 'Subir logo'}
            </button>
            <span style={{ fontSize: 10, color: MUTED, fontFamily: FONT, textAlign: 'center', maxWidth: 80 }}>PNG, JPG · hasta 5 MB</span>
            <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
          </div>

          {/* Nombre + tipo */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={LBL}>Nombre del negocio</label>
              <input value={nombre} onChange={e => setNombre(e.target.value)} style={INP} placeholder="Ej: Hotel La Costa" />
            </div>
            <div>
              <label style={LBL}>Tipo de negocio</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {TIPOS_RUBRO.map(t => {
                  const sel = tipoSel === t.id;
                  return (
                    <button key={t.id} type="button"
                      onClick={() => { setTipoSel(t.id); setCatsSel([]); }}
                      style={{ padding: '9px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 700,
                        border: `1.5px solid ${sel ? P : LINE}`, background: sel ? PS : '#fff', color: sel ? P : INK2, transition: 'all .15s' }}>
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {tipoSel && (
              <div>
                <label style={LBL}>Categorías — hasta 2</label>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {CATS_RUBRO[tipoSel].map(c => {
                    const sel = catsSel.includes(c);
                    const maxed = !sel && catsSel.length >= 2;
                    return (
                      <button key={c} type="button" disabled={maxed} onClick={() => toggleCatSel(c)}
                        style={{ padding: '6px 12px', borderRadius: 999, fontFamily: FONT, fontSize: 12, fontWeight: 600,
                          cursor: maxed ? 'not-allowed' : 'pointer', opacity: maxed ? 0.45 : 1,
                          border: `1.5px solid ${sel ? P : LINE}`, background: sel ? P : '#fff', color: sel ? '#fff' : INK2, transition: 'all .15s' }}>
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ── Contacto ── */}
      <Card>
        <SecTitulo label="Contacto" Icon={Smartphone} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={LBL}>Email <span style={{ color: '#ef4444' }}>*</span></label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={INP} placeholder="contacto@minegocio.com" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={LBL}>Teléfono fijo</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={telFijoCod} onChange={e => setTelFijoCod(e.target.value)} style={{ ...INP, width: 86, flexShrink: 0, cursor: 'pointer' }}>
                  {['+54', '+598', '+56', '+55', '+595', '+591', '+1'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input value={telFijoNum} onChange={e => setTelFijoNum(e.target.value.replace(/\D/g, ''))} style={{ ...INP, flex: 1 }} placeholder="2255 432100" />
              </div>
            </div>
            <div>
              <label style={LBL}>Línea móvil</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={telMovilCod} onChange={e => setTelMovilCod(e.target.value)} style={{ ...INP, width: 86, flexShrink: 0, cursor: 'pointer' }}>
                  {['+54', '+598', '+56', '+55', '+595', '+591', '+1'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input value={telMovilNum} onChange={e => setTelMovilNum(e.target.value.replace(/\D/g, ''))} style={{ ...INP, flex: 1 }} placeholder="2255 11223344" />
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 }}>
            <div>
              <label style={LBL}>Sitio web</label>
              <input value={sitioWeb} onChange={e => setSitioWeb(e.target.value)} style={INP} placeholder="https://..." />
            </div>
            <div>
              <label style={LBL}>Instagram</label>
              <input value={instagram} onChange={e => setInstagram(e.target.value)} style={INP} placeholder="@mi.negocio" />
            </div>
            <div>
              <label style={LBL}>Facebook</label>
              <input value={facebook} onChange={e => setFacebook(e.target.value)} style={INP} placeholder="/mi.negocio" />
            </div>
            <div>
              <label style={LBL}>TikTok</label>
              <input value={tiktok} onChange={e => setTiktok(e.target.value)} style={INP} placeholder="@mi.negocio" />
            </div>
          </div>
        </div>
      </Card>

      {/* ── Ubicación ── */}
      <Card>
        <SecTitulo label="Ubicación" Icon={Map} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={LBL}>País</label>
              <select value={pais} onChange={e => setPais(e.target.value)} style={{ ...INP, cursor: 'pointer' }}>
                {['Argentina', 'Uruguay', 'Brasil', 'Chile', 'Paraguay', 'Bolivia', 'España', 'Otro'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={LBL}>Provincia</label>
              <select value={provincia} onChange={e => setProvincia(e.target.value)} style={{ ...INP, cursor: 'pointer' }}>
                <option value="">Seleccioná</option>
                {PROVINCIAS_AR.map(pr => <option key={pr} value={pr}>{pr}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={LBL}>Localidad</label>
              <select value={localidad} onChange={e => setLocalidad(e.target.value)} style={{ ...INP, cursor: 'pointer' }}>
                <option value="">Seleccioná</option>
                {LOCALIDADES_ADM.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={LBL}>Código postal</label>
              <input value={codPostal} onChange={e => setCodPostal(e.target.value)} style={INP} placeholder="7165" maxLength={8} />
            </div>
          </div>
          <div>
            <label style={LBL}>Domicilio</label>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 10 }}>
              <input value={calle} onChange={e => setCalle(e.target.value)} style={INP} placeholder="Calle / Avenida" />
              <input value={numero} onChange={e => setNumero(e.target.value)} style={INP} placeholder="Número" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 14 }}>
              <input value={piso} onChange={e => setPiso(e.target.value)} style={INP} placeholder="Piso" />
              <input value={depto} onChange={e => setDepto(e.target.value)} style={INP} placeholder="Depto" />
              <input value={entreCalles} onChange={e => setEntreCalles(e.target.value)} style={INP} placeholder="Entre calles" />
            </div>
          </div>
        </div>
      </Card>

      {/* ── Características (condicional por tipo) ── */}
      {(esAloj || esSalidas || esAvent) && (
        <Card>
          <SecTitulo label="Características" Icon={Store} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {esAloj && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={LBL}>Unidad más chica (m²)</label>
                    <input type="number" value={tamMinM2} onChange={e => setTamMinM2(e.target.value)} style={INP} placeholder="Ej: 22" />
                  </div>
                  <div>
                    <label style={LBL}>Unidad más grande (m²)</label>
                    <input type="number" value={tamMaxM2} onChange={e => setTamMaxM2(e.target.value)} style={INP} placeholder="Ej: 65" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={LBL}>Mín. huéspedes por unidad</label>
                    <input type="number" value={minHues} onChange={e => setMinHues(e.target.value)} style={INP} placeholder="Ej: 2" />
                  </div>
                  <div>
                    <label style={LBL}>Máx. huéspedes (unidad amplia)</label>
                    <input type="number" value={maxHues} onChange={e => setMaxHues(e.target.value)} style={INP} placeholder="Ej: 6" />
                  </div>
                </div>
                <ServiciosMulti selected={serviciosSelected} onChange={setServiciosSelected} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <ToggleRow label="Acepta mascotas" on={aceptaMascotas} onChange={setAceptaMascotas} />
                  <ToggleRow label="Acepta niños"    on={aceptaNinos}    onChange={setAceptaNinos}    />
                </div>
              </>
            )}

            {esSalidas && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={LBL}>Capacidad (cubiertos / personas)</label>
                  <input type="number" value={capacidad} onChange={e => setCapacidad(e.target.value)} style={INP} placeholder="Ej: 80" />
                </div>
                <div>
                  <label style={LBL}>Tipo de cocina / propuesta</label>
                  <input value={tipoCocina} onChange={e => setTipoCocina(e.target.value)} style={INP} placeholder="Parrilla, cocina de mar..." />
                </div>
              </div>
            )}

            {esAvent && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={LBL}>Duración aproximada</label>
                    <input value={duracion} onChange={e => setDuracion(e.target.value)} style={INP} placeholder="Ej: 2 horas, jornada completa" />
                  </div>
                  <div>
                    <label style={LBL}>Participantes máximos</label>
                    <input type="number" value={maxPax} onChange={e => setMaxPax(e.target.value)} style={INP} placeholder="Ej: 12" />
                  </div>
                </div>
                <div>
                  <label style={LBL}>¿La experiencia tiene sede fija?</label>
                  <select value={sedeFija} onChange={e => setSedeFija(e.target.value)} style={{ ...INP, cursor: 'pointer' }}>
                    <option value="">Seleccioná</option>
                    <option value="fija">Sí, tiene dirección fija</option>
                    <option value="domicilio">No, voy al domicilio del cliente</option>
                    <option value="variable">Tiene punto de encuentro variable</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* ── Descripción ── */}
      <Card>
        <SecTitulo label="Descripción pública" Icon={MessageSquare} />
        <div>
          <label style={LBL}>
            {esAloj
              ? 'Contale a tus huéspedes brevemente sobre tu alojamiento'
              : 'Contale a tus visitantes brevemente sobre tu negocio'}
          </label>
          <textarea value={descripcion} onChange={e => setDescripcion(e.target.value.slice(0, DESC_MAX))} rows={5}
            placeholder="Somos un hotel familiar a media cuadra del mar, con pileta, desayuno incluido y estacionamiento privado..."
            style={{ ...INP, resize: 'vertical', minHeight: 110 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
            <span style={{ fontSize: 11, fontFamily: FONT, color: descripcion.length > 0 && descripcion.length < DESC_MIN ? '#ef4444' : 'transparent' }}>
              Mínimo {DESC_MIN} caracteres
            </span>
            <span style={{ fontSize: 11, fontFamily: FONT, color: descripcion.length > DESC_MAX * 0.9 ? '#ef4444' : MUTED }}>
              {descripcion.length} / {DESC_MAX}
            </span>
          </div>
        </div>
      </Card>

      {/* ── Galería ── */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: INK }}>Galería de imágenes</span>
          <button onClick={() => fotoRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: `1px dashed ${P}`, background: PS, color: P, fontFamily: FONT, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <Upload size={14} /> Agregar fotos
          </button>
          <input ref={fotoRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => addFiles(e.target.files)} />
        </div>

        {/* Aviso de imágenes */}
        <div style={{ display: 'flex', gap: 8, padding: '8px 12px', background: '#fffbeb', border: `1px solid #fcd34d`, borderRadius: 10, marginBottom: 14, alignItems: 'flex-start' }}>
          <AlertCircle size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 11.5, color: '#92400e', fontFamily: FONT, lineHeight: 1.5 }}>
            Las fotos deben mostrar exclusivamente el lugar o servicio — sin textos, logos ni gráficas superpuestas. La primera foto es la imagen principal de tu perfil.
          </span>
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleGalleryDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          style={{ borderRadius: 14, outline: isDragOver ? `2px dashed ${P}` : '2px dashed transparent', outlineOffset: 3, transition: 'outline .15s' }}
        >
          {fotos.length === 0 ? (
            <div
              onClick={() => fotoRef.current?.click()}
              style={{ height: 140, border: `2px dashed ${isDragOver ? P : LINE}`, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: isDragOver ? P : MUTED, cursor: 'pointer', transition: 'all .15s' }}
            >
              <Image size={28} color={isDragOver ? P : LINE} />
              <span style={{ fontSize: 13, fontFamily: FONT }}>Subí fotos o arrastrá archivos desde tu computadora</span>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridAutoRows: 90, gap: 8 }}>
              {fotos.map((f, idx) => (
                <div
                  key={f.id}
                  style={{
                    position: 'relative',
                    borderRadius: idx === 0 ? 12 : 8,
                    overflow: 'hidden',
                    gridColumn: idx === 0 ? 'span 2' : undefined,
                    gridRow:    idx === 0 ? 'span 2' : undefined,
                  }}
                >
                  <img src={f.src} alt={f.alt} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  {idx === 0 ? (
                    <div style={{ position: 'absolute', bottom: 7, left: 7, background: P, color: '#fff', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 5, fontFamily: FONT, letterSpacing: '0.06em' }}>
                      PRINCIPAL
                    </div>
                  ) : (
                    <div style={{ position: 'absolute', top: 5, left: 5, width: 18, height: 18, borderRadius: 5, background: 'rgba(0,0,0,0.45)', display: 'grid', placeItems: 'center' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', fontFamily: FONT }}>{idx + 1}</span>
                    </div>
                  )}
                  <button
                    onClick={() => setFotos(prev => prev.filter(x => x.id !== f.id))}
                    style={{ position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                  >
                    <Trash2 size={10} color="#fff" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Guardar */}
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
              <span style={{ fontSize:10, fontWeight:600, color:MUTED }}>(${(cred * 2000).toLocaleString('es-AR')} + IVA)</span>
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

function TabCuenta({ credits, addonTotal, setShowComprar, perfil, negocio, onCuentaEliminada }) {
  const [filtroMov, setFiltroMov] = useState('todo');
  const [showEliminar, setShowEliminar] = useState(false);
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
function RendimientoWidget({ plan = 'free', seguidores = 0, onUpgrade }) {
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
      <div style={{ margin: '0 8px 8px', background: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: '10px 12px' }}>

        {/* Seguidores — integrado arriba */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, paddingBottom: 9, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <svg width="44" height="36" viewBox="0 0 44 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
            {/* Persona izquierda */}
            <circle cx="11" cy="10" r="6" fill="rgba(177,187,255,0.4)"/>
            <path d="M2 36c0-5 4.03-9 9-9s9 4 9 9" fill="rgba(177,187,255,0.4)"/>
            {/* Persona derecha */}
            <circle cx="33" cy="10" r="6" fill="rgba(177,187,255,0.4)"/>
            <path d="M24 36c0-5 4.03-9 9-9s9 4 9 9" fill="rgba(177,187,255,0.4)"/>
            {/* Persona central (más grande y brillante) */}
            <circle cx="22" cy="9" r="7" fill="#b1bbff"/>
            <path d="M12 36c0-5.5 4.48-10 10-10s10 4.5 10 10" fill="#b1bbff"/>
          </svg>
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontFamily: FONT, fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{seguidores}</div>
            <div style={{ fontFamily: FONT, fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>siguen tus ofertas</div>
          </div>
        </div>

        {/* Header rendimiento */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Zap size={12} color="#f59e0b" style={{ flexShrink: 0 }} />
          <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.04em' }}>RENDIMIENTO DE TUS OFERTAS</span>
        </div>

        {/* Slider — dots dentro del track para positioning correcto */}
        <div style={{ position: 'relative', height: 3, background: 'rgba(255,255,255,0.12)', borderRadius: 2, margin: '14px 0 18px' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 2, background: P, width: `${pct}%`, transition: 'width .25s ease', pointerEvents: 'none' }} />
          {[0, 1, 2].map(i => (
            <div
              key={i}
              onClick={() => trySetNivel(i)}
              style={{
                position: 'absolute',
                left: `${i * 50}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: nivel === i ? 14 : 8,
                height: nivel === i ? 14 : 8,
                borderRadius: '50%',
                background: i <= nivel ? '#fff' : 'rgba(255,255,255,0.18)',
                border: nivel === i ? `2px solid ${P}` : 'none',
                cursor: !isPremium && i > 0 ? 'default' : 'pointer',
                transition: 'all .2s ease',
                zIndex: 2,
                boxShadow: nivel === i ? '0 0 0 3px rgba(71,91,225,0.35)' : 'none',
              }}
            />
          ))}
        </div>

        {/* Labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          {['Normal', 'Alto', 'Máximo'].map((label, i) => (
            <span key={i} style={{ fontSize: 9, fontWeight: nivel === i ? 700 : 500, color: nivel === i ? '#fff' : 'rgba(255,255,255,0.32)', fontFamily: FONT, transition: 'color .2s', userSelect: 'none' }}>
              {label}{!isPremium && i > 0 ? ' 🔒' : ''}
            </span>
          ))}
        </div>

        {/* Texto dinámico */}
        <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.5)', fontFamily: FONT, lineHeight: 1.55, margin: nivel === 0 ? '0 0 8px' : '0' }}>
          {TEXTOS[nivel]}
        </p>

        {/* CTA solo en Normal */}
        {nivel === 0 && (
          <button
            onClick={() => { if (!isPremium) { onUpgrade?.(); } else setNivel(1); }}
            style={{ width: '100%', background: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: 7, padding: '7px 0', fontFamily: FONT, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
          >
            ↑ Aumentar Rendimiento
          </button>
        )}
      </div>

      {/* Modal via Portal — escapa cualquier stacking context del sidebar */}
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
function Sidebar({ tab, setTab, negocio, perfil, notifCount, saldoTokens, seguidores = 0, setShowComprar, onVolver, onGoHome, onLogout, onUpgrade, navCounts = {} }) {
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

      {/* Rendimiento + seguidores */}
      <RendimientoWidget plan={negocio?.plan || 'free'} seguidores={seguidores} onUpgrade={onUpgrade} />

      {/* Tokens (solo plan free con alojamiento) */}
      {negocio && debeUsarTokens(negocio.tipo, negocio.plan) && (
        <div style={{ margin: '0 8px 8px', background: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: '8px 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <span style={{ fontFamily: FONT, fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Tokens</span>
            <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700 }}>🪙 {saldoTokens}</span>
          </div>
          <button onClick={() => setShowComprar(true)} style={{ width: '100%', background: P, color: '#fff', border: 'none', borderRadius: 7, padding: '6px 0', fontFamily: FONT, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            Comprar tokens
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
//  MINI QR PLACEHOLDER
// ════════════════════════════════════════════════════════════
function MiniQR({ size = 52, disabled = false }) {
  const cell = size / 7;
  const bits = [
    1,1,1,0,1,1,1,
    1,0,1,0,1,0,1,
    1,1,1,0,1,1,1,
    0,0,0,1,0,1,0,
    1,1,0,1,1,0,1,
    1,0,1,0,0,1,0,
    1,1,1,0,1,1,1,
  ];
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ opacity: disabled ? 0.18 : 1, display: 'block' }}>
        <rect width={size} height={size} fill="#f8f9fa" rx={4}/>
        {bits.map((b, i) => b ? (
          <rect key={i}
            x={(i % 7) * cell + 1} y={Math.floor(i / 7) * cell + 1}
            width={cell - 2} height={cell - 2}
            fill="#0f172a" rx={0.8}
          />
        ) : null)}
      </svg>
      {disabled && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2.5} strokeLinecap="round">
            <line x1="4" y1="4" x2="20" y2="20"/>
            <line x1="20" y1="4" x2="4" y2="20"/>
          </svg>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  TOKEN ROW (QR + código + estado)
// ════════════════════════════════════════════════════════════
function TokenRow({ token, esHuesped }) {
  const disabled = token.estado !== 'disponible';
  const STATUS = {
    disponible: { label: 'Disponible', color: GREEN,     bg: GREEN + '18' },
    utilizado:  { label: 'Utilizado',  color: '#ef4444', bg: '#fef2f2'    },
    vencido:    { label: 'Vencido',    color: '#ef4444', bg: '#fef2f2'    },
  };
  const st = STATUS[token.estado] || STATUS.disponible;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: disabled ? '#fafafa' : '#fff', borderRadius: 10, border: `1px solid ${disabled ? '#fecaca' : LINE}` }}>
      <MiniQR size={48} disabled={disabled}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textDecoration: disabled ? 'line-through' : 'none', color: disabled ? '#9ca3af' : INK }}>
          {token.id}
        </div>
        {esHuesped && <div style={{ fontSize: 10, color: MUTED, fontFamily: FONT, marginTop: 2 }}>Token de huésped</div>}
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: st.bg, color: st.color, fontFamily: FONT, whiteSpace: 'nowrap' }}>
        {st.label}
      </span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  TAB CUPONERAS
// ════════════════════════════════════════════════════════════
function TabCuponeras({ negocio, perfil, showToast }) {
  const esAloj = negocio?.tipo === 'alojamiento' || TIPOS_ALOJ_ADMIN.has(negocio?.tipo ?? '');

  const [cuponeras, setCuponeras]   = useState(MOCK_CUPONERAS);
  const [selectedId, setSelectedId] = useState(MOCK_CUPONERAS[0]?.id || null);
  const [expanded, setExpanded]     = useState(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [createNombre, setCreateNombre] = useState('');
  const [createTipo, setCreateTipo]    = useState('personal');
  const [editingId, setEditingId]   = useState(null);
  const [editingNombre, setEditingNombre] = useState('');
  const [showWaModal, setShowWaModal] = useState(false);
  const [waPhone, setWaPhone]       = useState('');

  const selected = cuponeras.find(c => c.id === selectedId) || null;

  const TIPO_BADGE = {
    personal:  { label: 'Personal',         bg: PS,             color: P         },
    huespedes: { label: 'Para huéspedes',   bg: `${YELLOW}22`, color: '#b45309' },
  };

  function toggleExpand(id) {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function deleteCuponera(id) {
    if (!window.confirm('¿Eliminar esta cuponera?')) return;
    const next = cuponeras.filter(c => c.id !== id);
    setCuponeras(next);
    if (selectedId === id) setSelectedId(next[0]?.id || null);
  }

  function saveRename(id) {
    if (!editingNombre.trim()) { setEditingId(null); return; }
    setCuponeras(prev => prev.map(c => c.id === id ? { ...c, nombre: editingNombre.trim() } : c));
    setEditingId(null);
  }

  function createCuponera() {
    if (!createNombre.trim()) return;
    const nc = { id: `cup-${Date.now()}`, nombre: createNombre.trim(), tipo: createTipo, cupones: [] };
    setCuponeras(prev => [...prev, nc]);
    setSelectedId(nc.id);
    setCreateNombre('');
    setCreateTipo('personal');
    setShowCreate(false);
  }

  function copyLink() {
    const url = `${window.location.origin}/cuponera/${selected?.id}`;
    navigator.clipboard.writeText(url).then(() => showToast('Enlace copiado al portapapeles', 'ok')).catch(() => showToast('No se pudo copiar', 'error'));
  }

  function sendWhatsApp() {
    if (!waPhone.trim()) return;
    const url = `${window.location.origin}/cuponera/${selected?.id}`;
    const text = encodeURIComponent(`¡Hola! Te comparto la cuponera: ${url}`);
    window.open(`https://wa.me/${waPhone.replace(/\D/g, '')}?text=${text}`, '_blank');
    setShowWaModal(false);
    setWaPhone('');
  }

  const btnShare = (onClick, icon, label, accent = false) => (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '7px 14px', borderRadius: 9, fontFamily: FONT, fontSize: 12, fontWeight: 600, cursor: 'pointer',
      border: `1px solid ${accent ? '#25D36655' : LINE}`,
      background: accent ? '#25D36610' : '#fff',
      color: accent ? '#25D366' : INK2,
    }}>
      {icon} {label}
    </button>
  );

  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, margin: 0 }}>Mis cuponeras</h2>
        <button
          onClick={() => setShowCreate(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: P, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontFamily: FONT, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          <Plus size={15}/> Nueva cuponera
        </button>
      </div>

      {/* Crear cuponera */}
      {showCreate && (
        <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: INK, marginBottom: 12 }}>Nueva cuponera</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              autoFocus value={createNombre} onChange={e => setCreateNombre(e.target.value)}
              placeholder="Nombre de la cuponera" onKeyDown={e => e.key === 'Enter' && createCuponera()}
              style={{ padding: '10px 14px', borderRadius: 10, border: `1px solid ${LINE}`, fontFamily: FONT, fontSize: 14, outline: 'none', color: INK }}
            />
            {esAloj && (
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ id: 'personal', label: 'Personal' }, { id: 'huespedes', label: 'Para huéspedes' }].map(t => (
                  <button key={t.id} onClick={() => setCreateTipo(t.id)} style={{
                    flex: 1, padding: '8px 0', borderRadius: 10, border: `1px solid ${createTipo === t.id ? P : LINE}`,
                    background: createTipo === t.id ? PS : 'transparent', color: createTipo === t.id ? P : INK2,
                    fontFamily: FONT, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}>{t.label}</button>
                ))}
              </div>
            )}
            {createTipo === 'huespedes' && (
              <p style={{ fontFamily: FONT, fontSize: 12, color: MUTED, margin: 0, background: `${YELLOW}12`, border: `1px solid ${YELLOW}40`, borderRadius: 8, padding: '8px 12px', lineHeight: 1.5 }}>
                Cada cupón incluido tendrá 3 QR/tokens reutilizables para tus huéspedes. Pagás la cuponera una sola vez.
              </p>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={createCuponera} style={{ flex: 1, background: P, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 0', fontFamily: FONT, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Crear</button>
              <button onClick={() => setShowCreate(false)} style={{ flex: 1, background: 'transparent', color: MUTED, border: `1px solid ${LINE}`, borderRadius: 10, padding: '10px 0', fontFamily: FONT, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* ─── Lista de cuponeras ─── */}
        <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {cuponeras.map(c => {
            const tb = TIPO_BADGE[c.tipo] || TIPO_BADGE.personal;
            const active = selectedId === c.id;
            return (
              <div key={c.id} onClick={() => setSelectedId(c.id)}
                style={{ padding: '11px 13px', borderRadius: 12, border: `1px solid ${active ? P : LINE}`, background: active ? PS : '#fff', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                  {editingId === c.id ? (
                    <input
                      autoFocus value={editingNombre} onChange={e => setEditingNombre(e.target.value)}
                      onBlur={() => saveRename(c.id)}
                      onKeyDown={e => { if (e.key === 'Enter') saveRename(c.id); if (e.key === 'Escape') setEditingId(null); }}
                      onClick={e => e.stopPropagation()}
                      style={{ flex: 1, border: `1px solid ${P}`, borderRadius: 6, padding: '2px 7px', fontFamily: FONT, fontSize: 13, fontWeight: 700, outline: 'none', color: INK }}
                    />
                  ) : (
                    <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: active ? P : INK, flex: 1, lineHeight: 1.3 }}>{c.nombre}</span>
                  )}
                  <div style={{ display: 'flex', gap: 2, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setEditingId(c.id); setEditingNombre(c.nombre); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: 3 }}><Edit2 size={11}/></button>
                    <button onClick={() => deleteCuponera(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 3 }}><Trash2 size={11}/></button>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ fontFamily: FONT, fontSize: 10, color: MUTED }}>{c.cupones.length} cupón{c.cupones.length !== 1 ? 'es' : ''}</span>
                  <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: tb.bg, color: tb.color, fontFamily: FONT }}>{tb.label}</span>
                </div>
              </div>
            );
          })}
          {cuponeras.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: MUTED }}>
              <Wallet size={28} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }}/>
              <div style={{ fontFamily: FONT, fontSize: 12 }}>Sin cuponeras</div>
            </div>
          )}
        </div>

        {/* ─── Detalle de cuponera ─── */}
        {selected ? (
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Header */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: FONT, fontSize: 18, fontWeight: 800, color: INK }}>{selected.nombre}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 5 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 9px', borderRadius: 999, background: TIPO_BADGE[selected.tipo]?.bg, color: TIPO_BADGE[selected.tipo]?.color, fontFamily: FONT }}>
                  {TIPO_BADGE[selected.tipo]?.label}
                </span>
                {selected.tipo === 'huespedes' && (
                  <span style={{ fontSize: 11, color: MUTED, fontFamily: FONT }}>· 3 canjes por cupón · enviable por WhatsApp o mail</span>
                )}
              </div>
            </div>

            {/* Share bar */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, padding: '12px 14px', background: CARD, borderRadius: 14, border: `1px solid ${LINE}` }}>
              {btnShare(() => showToast('Generando PDF… (próximamente)', 'ok'), <Download size={13}/>, 'Descargar PDF')}
              {btnShare(() => showToast('Abriendo cliente de correo… (próximamente)', 'ok'), <Mail size={13}/>, 'Enviar por mail')}
              {btnShare(copyLink, <Link2 size={13}/>, 'Copiar enlace')}
              {btnShare(() => setShowWaModal(true), <MessageCircle size={13}/>, 'WhatsApp', true)}
            </div>

            {/* Lista de cupones */}
            {selected.cupones.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: MUTED }}>
                <Tag size={36} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3 }}/>
                <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600 }}>Esta cuponera está vacía</div>
                <div style={{ fontFamily: FONT, fontSize: 12, marginTop: 4 }}>Agregá cupones desde el explorador de ofertas</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selected.cupones.map(cup => {
                  const isOpen = expanded.has(cup.id);
                  const nDisp = cup.tokens.filter(t => t.estado === 'disponible').length;
                  const total = cup.tokens.length;
                  return (
                    <div key={cup.id} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, overflow: 'hidden' }}>
                      <div onClick={() => toggleExpand(cup.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 16px', cursor: 'pointer' }}
                      >
                        <img src={cup.imagen} alt={cup.titulo} style={{ width: 50, height: 50, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}/>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cup.titulo}</div>
                          <div style={{ fontFamily: FONT, fontSize: 11, color: MUTED, marginTop: 2 }}>{cup.negocio}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                          <Pill label={cup.badge} color={P}/>
                          <span style={{ fontSize: 11, fontFamily: FONT, fontWeight: 700, color: nDisp > 0 ? GREEN : '#ef4444' }}>
                            {nDisp}/{total} disp.
                          </span>
                          <ChevronDown size={14} color={MUTED} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s' }}/>
                        </div>
                      </div>

                      {isOpen && (
                        <div style={{ borderTop: `1px solid ${LINE}`, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {cup.tokens.map(tk => (
                            <TokenRow key={tk.id} token={tk} esHuesped={selected.tipo === 'huespedes'}/>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: MUTED }}>
            <Wallet size={40} style={{ opacity: 0.25, marginBottom: 12 }}/>
            <div style={{ fontFamily: FONT, fontSize: 14 }}>Seleccioná una cuponera para ver su contenido</div>
          </div>
        )}
      </div>

      {/* Modal WhatsApp */}
      {showWaModal && ReactDOM.createPortal(
        <>
          <div onClick={() => setShowWaModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(8,12,26,0.6)', zIndex: 99990 }}/>
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 99991, width: 320, background: '#fff', borderRadius: 20, padding: '28px 24px', fontFamily: FONT, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: INK, marginBottom: 8 }}>Enviar por WhatsApp</div>
            <div style={{ fontSize: 13, color: MUTED, marginBottom: 16 }}>Ingresá el número de destino con código de país.</div>
            <input
              autoFocus value={waPhone} onChange={e => setWaPhone(e.target.value)}
              placeholder="Ej: 5491140001234"
              onKeyDown={e => e.key === 'Enter' && sendWhatsApp()}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${LINE}`, fontFamily: FONT, fontSize: 14, outline: 'none', color: INK, boxSizing: 'border-box', marginBottom: 14 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={sendWhatsApp} style={{ flex: 1, background: '#25D366', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 0', fontFamily: FONT, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <MessageCircle size={14}/> Enviar
              </button>
              <button onClick={() => setShowWaModal(false)} style={{ flex: 1, background: 'transparent', border: `1px solid ${LINE}`, borderRadius: 10, padding: '11px 0', fontFamily: FONT, fontSize: 13, fontWeight: 600, color: MUTED, cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
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
  const [seguidores, setSeguidores] = useState(0);

  const notifCount = MOCK_NOTIFS.length;
  const ofertasActivasCount = promos.length > 0
    ? promos.filter(p => p.activo !== false).length
    : MOCK_OFERTAS.filter(o => o.activa).length;
  const navCounts = { ofertas: ofertasActivasCount, compras: MOCK_CUPONERAS.length };

  useEffect(() => { cargarTodo(); }, []);

  async function cargarTodo() {
    if (!perfil?.negocio_id) { setLoading(false); return; }
    setLoading(true);
    if (!negocio) {
      const { data } = await supabase.from('negocios').select('*').eq('id', perfil.negocio_id).single();
      if (data) setNegocio(data);
    }
    const [proRes, saldoRes, segRes] = await Promise.all([
      supabase.from('promociones').select('*').eq('negocio_id', perfil.negocio_id).order('creado_en', { ascending: false }),
      getSaldo(perfil.negocio_id),
      contarSeguidores(perfil.negocio_id),
    ]);
    if (proRes.data) setPromos(proRes.data);
    setSaldoTokens(typeof saldoRes === 'number' ? saldoRes : 0);
    setSeguidores(typeof segRes === 'number' ? segRes : 0);
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
        notifCount={notifCount} saldoTokens={saldoTokens} seguidores={seguidores} navCounts={navCounts}
        setShowComprar={setShowComprar} onVolver={onVolver}
        onGoHome={onGoHome} onLogout={handleLogout}
        onUpgrade={() => setTab('cuenta')}
      />

      <main style={{ flex:1, padding:28, overflowY:'auto', maxWidth:'100%' }}>
        {tab === 'cuenta'      && <TabCuenta credits={credits} addonTotal={addonTotal} setShowComprar={setShowComprar} perfil={perfil} negocio={negocio} onCuentaEliminada={handleLogout}/>}
        {tab === 'notif'       && <TabNovedades credits={credits} setCredits={setCredits} onGoToVentas={() => setTab('solicitudes')}/>}
        {tab === 'ofertas'     && <TabOfertas dbPromos={promos} negocioId={perfil?.negocio_id} showToast={showToast}/>}
        {tab === 'stats'       && <TabEstadisticas/>}
        {tab === 'solicitudes' && <TabVentas negocioId={perfil?.negocio_id} showToast={showToast}/>}
        {(tab === 'empresa' || tab === 'galeria') && <TabEmpresa negocio={negocio} showToast={showToast}/>}
        {tab === 'compras'     && <TabCuponeras negocio={negocio} perfil={perfil} showToast={showToast}/>}
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
      `}</style>
    </div>
  );
}
