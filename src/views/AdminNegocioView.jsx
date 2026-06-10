// ============================================================
//  src/views/AdminNegocioView.jsx  —  Host Dashboard v2
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, MessageSquare, Bell, Tag, Building2, CreditCard, Puzzle,
  LogOut, ArrowLeft, TrendingUp, Eye, MousePointerClick, Users, ChevronRight,
  Plus, X, Save, ToggleLeft, ToggleRight, Send, Check, Archive,
  Clock, Star, Trash2, Upload, Image, AlertCircle, CheckCircle2, Zap, Crown,
  Store, Coins, ShoppingBag, Utensils, Map, Smartphone, Globe, Calendar,
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
  { id: 'dashboard',  label: 'Resumen',      Icon: LayoutDashboard },
  { id: 'inbox',      label: 'Consultas',    Icon: MessageSquare    },
  { id: 'notif',      label: 'Notificaciones', Icon: Bell           },
  { id: 'ofertas',    label: 'Mis Ofertas',  Icon: Tag              },
  { id: 'empresa',    label: 'Mi Empresa',   Icon: Building2        },
  { id: 'cuenta',     label: 'Mi Cuenta',    Icon: CreditCard       },
  { id: 'addons',     label: 'Add-ons',      Icon: Puzzle           },
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
function Card({ children, style = {} }) {
  return <div style={{ background: CARD, borderRadius: 16, border: `1px solid ${LINE}`, padding: 20, ...style }}>{children}</div>;
}

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

function TabDashboard({ credits }) {
  const [periodo, setPeriodo]       = useState('30d');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const kpis = [
    { label: 'Visitas a tu perfil', value: 348, sub: '+12% vs mes anterior', Icon: Eye, color: P },
    { label: 'Clicks en tus ofertas propias', value: 127, sub: 'Turistas interesados', Icon: MousePointerClick, color: GREEN },
    { label: 'Clicks en ofertas de socios', value: 89, sub: 'Los que pueden generar créditos a tu favor', Icon: TrendingUp, color: YELLOW },
    { label: 'Consultas recibidas', value: 14, sub: '3 sin responder', Icon: MessageSquare, color: '#8b5cf6' },
  ];

  const planBase = 20000;
  const valorCredito = 2000;
  const ahorro = credits * valorCredito;
  const final = Math.max(0, planBase - ahorro);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Header con selector de período */}
      <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        <h2 style={{ fontFamily:FONT, fontSize:20, fontWeight:700, color:INK, margin:0, marginRight:'auto' }}>Resumen</h2>
        <select
          value={periodo}
          onChange={e => setPeriodo(e.target.value)}
          style={{ padding:'7px 12px', borderRadius:10, border:`1px solid ${LINE}`, fontFamily:FONT, fontSize:13, color:INK, background:CARD, cursor:'pointer', outline:'none' }}
        >
          {PERIODOS.map(p => <option key={p.val} value={p.val}>{p.label}</option>)}
        </select>
        {periodo === 'custom' && (<>
          <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
            style={{ padding:'7px 10px', borderRadius:10, border:`1px solid ${LINE}`, fontFamily:FONT, fontSize:13, color:INK, outline:'none' }}
          />
          <span style={{ fontFamily:FONT, fontSize:12, color:MUTED }}>hasta</span>
          <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
            style={{ padding:'7px 10px', borderRadius:10, border:`1px solid ${LINE}`, fontFamily:FONT, fontSize:13, color:INK, outline:'none' }}
          />
        </>)}
      </div>

      {/* KPI Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14 }}>
        {kpis.map(k => (
          <Card key={k.label} style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontFamily:FONT, fontSize:12, fontWeight:600, color:INK2 }}>{k.label}</span>
              <div style={{ width:34, height:34, borderRadius:10, background:k.color+'15', display:'grid', placeItems:'center' }}>
                <k.Icon size={17} color={k.color}/>
              </div>
            </div>
            <div style={{ fontFamily:FONT, fontSize:28, fontWeight:800, color:INK }}>{k.value}</div>
            <div style={{ fontFamily:FONT, fontSize:11, color:GREEN, fontWeight:600 }}>{k.sub}</div>
          </Card>
        ))}
      </div>

      {/* Savings formula */}
      <Card style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1e293b 100%)` }}>
        <div style={{ color:'rgba(255,255,255,0.6)', fontFamily:FONT, fontSize:12, fontWeight:600, marginBottom:12, textTransform:'uppercase', letterSpacing:'0.06em' }}>Fórmula de ahorro mensual</div>
        <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:12, marginBottom:16 }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, fontFamily:FONT, marginBottom:4 }}>Abono base</div>
            <div style={{ fontFamily:FONT, fontWeight:800, fontSize:20, color:'#fff' }}>${planBase.toLocaleString('es-AR')}</div>
          </div>
          <div style={{ color:'rgba(255,255,255,0.4)', fontSize:22, fontFamily:'monospace' }}>−</div>
          <div style={{ textAlign:'center' }}>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, fontFamily:FONT, marginBottom:4 }}>Créditos × valor</div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <CreditCoin size={20}/>
              <span style={{ fontFamily:FONT, fontWeight:800, fontSize:20, color:'#fff' }}>{credits} × ${valorCredito.toLocaleString('es-AR')}</span>
            </div>
          </div>
          <div style={{ color:'rgba(255,255,255,0.4)', fontSize:22, fontFamily:'monospace' }}>=</div>
          <div style={{ textAlign:'center' }}>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, fontFamily:FONT, marginBottom:4 }}>Próximo abono</div>
            <div style={{ fontFamily:FONT, fontWeight:800, fontSize:24, color: ahorro > 0 ? '#34d399' : '#fff' }}>
              ${final.toLocaleString('es-AR')}
            </div>
          </div>
        </div>
        {ahorro > 0 && (
          <div style={{ background:'rgba(52,211,153,0.15)', border:'1px solid rgba(52,211,153,0.3)', borderRadius:10, padding:'10px 14px', fontFamily:FONT, fontSize:13, color:'#34d399', fontWeight:600 }}>
            ✓ Ahorrás ${ahorro.toLocaleString('es-AR')} este mes recomendando comercios aliados a tus huéspedes.
          </div>
        )}
        <div style={{ marginTop:12, fontFamily:FONT, fontSize:11, color:'rgba(255,255,255,0.35)', fontStyle:'italic' }}>
          S<sub>final</sub> = S<sub>plan</sub> − (C<sub>ganados</sub> × V<sub>crédito</sub>)
        </div>
      </Card>

      {/* Traffic chart placeholder */}
      <Card>
        <div style={{ fontFamily:FONT, fontSize:14, fontWeight:700, color:INK, marginBottom:14 }}>Tráfico últimas 4 semanas</div>
        <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:80 }}>
          {[42,58,35,71,89,64,77,95,55,82,68,91,73,87,110,98,120,105,88,115,94,127,108,140,132,145,119,138].map((v,i) => (
            <div key={i} style={{ flex:1, background: i > 24 ? P : LINE, borderRadius:'3px 3px 0 0', height:`${(v/145)*100}%`, minWidth:4 }}/>
          ))}
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontFamily:FONT, fontSize:10, color:MUTED }}>
          <span>Sem 1</span><span>Sem 2</span><span>Sem 3</span><span>Sem 4 (actual)</span>
        </div>
      </Card>
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
function TabOfertas({ dbPromos, negocioId, showToast }) {
  const [ofertas, setOfertas] = useState(dbPromos.length > 0 ? dbPromos.map(p => ({
    id: p.id, titulo: p.titulo || p.nombre, desc: p.descripcion || '', descuento: p.descuento || 0, tipo: p.tipo || 'Descuento Directo', activa: p.activo !== false,
  })) : MOCK_OFERTAS);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ titulo:'', descuento:'', desc:'', tipo:'Descuento Directo' });

  function toggleActiva(id) {
    setOfertas(prev => prev.map(o => o.id === id ? { ...o, activa: !o.activa } : o));
    showToast('Estado actualizado', 'ok');
  }

  function addOferta() {
    if (!form.titulo) return;
    setOfertas(prev => [...prev, { id: Date.now(), titulo:form.titulo, desc:form.desc, descuento:Number(form.descuento)||0, tipo:form.tipo, activa:true }]);
    setModal(false);
    setForm({ titulo:'', descuento:'', desc:'', tipo:'Descuento Directo' });
    showToast('Oferta creada correctamente', 'ok');
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h2 style={{ fontFamily:FONT, fontSize:20, fontWeight:700, color:INK, margin:0 }}>Mis Ofertas</h2>
        <button onClick={() => setModal(true)} style={{ display:'flex', alignItems:'center', gap:8, background:P, color:'#fff', border:'none', borderRadius:12, padding:'10px 16px', fontFamily:FONT, fontSize:13, fontWeight:700, cursor:'pointer' }}>
          <Plus size={16}/> Nueva oferta
        </button>
      </div>

      {ofertas.map(o => (
        <Card key={o.id} style={{ display:'flex', gap:16, alignItems:'center' }}>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
              <span style={{ fontFamily:FONT, fontSize:14, fontWeight:700, color:INK }}>{o.titulo}</span>
              <Pill label={o.tipo} color={o.tipo === 'Pack Armado' ? GREEN : P}/>
              <span style={{ fontFamily:FONT, fontSize:12, fontWeight:700, color:YELLOW }}>−{o.descuento}%</span>
            </div>
            <div style={{ fontFamily:FONT, fontSize:12, color:INK2 }}>{o.desc}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontFamily:FONT, fontSize:11, color:o.activa ? GREEN : MUTED, fontWeight:600 }}>{o.activa ? 'Activa' : 'Inactiva'}</span>
            <Toggle on={o.activa} onChange={() => toggleActiva(o.id)}/>
          </div>
        </Card>
      ))}

      {/* Modal */}
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
function TabCuenta({ credits, addonTotal }) {
  const planBase = 20000;
  const valorCredito = 2000;
  const descuentoCreditos = credits * valorCredito;
  const total = Math.max(0, planBase - descuentoCreditos) + addonTotal;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <h2 style={{ fontFamily:FONT, fontSize:20, fontWeight:700, color:INK, margin:0 }}>Mi Cuenta</h2>

      {/* Plan */}
      <Card style={{ background:`linear-gradient(135deg, ${NAVY} 0%, #1e293b 100%)` }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:P, display:'grid', placeItems:'center' }}>
            <Zap size={24} color="#fff"/>
          </div>
          <div>
            <div style={{ fontFamily:FONT, fontSize:12, color:'rgba(255,255,255,0.5)', fontWeight:600 }}>Plan activo</div>
            <div style={{ fontFamily:FONT, fontSize:22, fontWeight:800, color:'#fff' }}>PLUS</div>
          </div>
          <div style={{ marginLeft:'auto', textAlign:'right' }}>
            <div style={{ fontFamily:FONT, fontSize:12, color:'rgba(255,255,255,0.5)' }}>Tarifa base</div>
            <div style={{ fontFamily:FONT, fontSize:18, fontWeight:700, color:'#fff' }}>${planBase.toLocaleString('es-AR')}/mes</div>
          </div>
        </div>
        <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:12, padding:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontFamily:FONT, fontSize:13, color:'rgba(255,255,255,0.7)' }}>Próximo abono estimado</span>
          <span style={{ fontFamily:FONT, fontSize:18, fontWeight:800, color:'#34d399' }}>${total.toLocaleString('es-AR')}</span>
        </div>
      </Card>

      {/* Wallet */}
      <Card>
        <div style={{ fontFamily:FONT, fontSize:14, fontWeight:700, color:INK, marginBottom:16 }}>Billetera de Créditos</div>
        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, background:`${YELLOW}10`, border:`1px solid ${YELLOW}30`, borderRadius:16, padding:'16px 24px' }}>
            <CreditCoin size={40}/>
            <div>
              <div style={{ fontFamily:FONT, fontSize:12, color:MUTED, fontWeight:600 }}>Saldo este mes</div>
              <div style={{ fontFamily:FONT, fontSize:36, fontWeight:900, color:INK }}>{credits}</div>
            </div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:FONT, fontSize:13, color:INK2, marginBottom:8 }}>Cada crédito = <strong>${valorCredito.toLocaleString('es-AR')}</strong> de descuento en tu próximo abono.</div>
            <div style={{ fontFamily:FONT, fontSize:13, fontWeight:700, color:GREEN }}>
              Ahorro acumulado: ${descuentoCreditos.toLocaleString('es-AR')}
            </div>
            {addonTotal > 0 && <div style={{ fontFamily:FONT, fontSize:12, color:MUTED, marginTop:6 }}>+ ${addonTotal.toLocaleString('es-AR')} en add-ons contratados</div>}
          </div>
        </div>
      </Card>

      {/* Facturas */}
      <Card>
        <div style={{ fontFamily:FONT, fontSize:14, fontWeight:700, color:INK, marginBottom:14 }}>Historial de facturas</div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:FONT, fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:`2px solid ${LINE}` }}>
              {['Fecha','Concepto','Monto','Estado'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'8px 12px', color:INK2, fontWeight:600, fontSize:11, textTransform:'uppercase', letterSpacing:'0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_FACTURAS.map((f,i) => (
              <tr key={i} style={{ borderBottom:`1px solid ${LINE}` }}>
                <td style={{ padding:'12px', color:INK2 }}>{f.fecha}</td>
                <td style={{ padding:'12px', color:INK }}>{f.concepto}</td>
                <td style={{ padding:'12px', color:INK, fontWeight:700 }}>${f.monto.toLocaleString('es-AR')}</td>
                <td style={{ padding:'12px' }}>
                  <Pill label={f.estado} color={f.estado==='Pagado' ? GREEN : YELLOW}/>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
              border:'none', borderRadius:10, background: active ? P : 'transparent',
              color: active ? '#fff' : 'rgba(255,255,255,0.65)',
              fontFamily:FONT, fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left',
            }}>
              <t.Icon size={16}/>
              <span style={{ flex:1 }}>{t.label}</span>
              {badge > 0 && <span style={{ background:YELLOW, color:NAVY, fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:999 }}>{badge}</span>}
            </button>
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
  const [tab, setTab]             = useState('dashboard');
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
        {tab === 'dashboard' && <TabDashboard credits={credits}/>}
        {tab === 'inbox'     && <TabInbox/>}
        {tab === 'notif'     && <TabNotificaciones credits={credits} setCredits={setCredits}/>}
        {tab === 'ofertas'   && <TabOfertas dbPromos={promos} negocioId={perfil?.negocio_id} showToast={showToast}/>}
        {tab === 'empresa'   && <TabEmpresa negocio={negocio} showToast={showToast}/>}
        {tab === 'cuenta'    && <TabCuenta credits={credits} addonTotal={addonTotal}/>}
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
