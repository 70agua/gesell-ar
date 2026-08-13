// ============================================================
//  src/views/DetailView.jsx — Tailwind + Aire design system
// ============================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import MapView from '../components/MapView';
import {
  X, Gift, Check, Eye, EyeOff, Lock,
  Heart, Share2, Flag, ChevronRight, ChevronLeft, Home,
  Wifi, Car, Waves, Coffee, ShieldCheck, KeyRound,
  Utensils, Clock, Globe, MapPin, Ticket,
  Star, Sunrise, Users, Bell,
  Dumbbell, Wind, Flame, PawPrint, Baby, Bike, Tv, ChefHat,
  TreePine, Droplets, Sparkles, BedDouble, AirVent,
  BookOpen,
} from 'lucide-react';
import { CoinSVG } from '../components/Token';
import { getPromosDeNegocio, getPromosLocalidad, getPromosSimilares } from '../lib/datos';
import OfertaCard from '../components/OfertaCard';
import { guardarConsulta, registrarTurista, loginTurista } from '../lib/auth';
import { useCarrito } from '../lib/carrito';
import { trackVistaFicha } from '../lib/tracking';
import InfoTooltip, { CreditTooltip } from '../components/InfoTooltip';
import { useMostrarCreditos } from '../lib/sesion';
import { socialProof } from '../lib/socialProof';
import HeartButton from '../components/HeartButton';
import { esSiguiendo, toggleSeguir } from '../lib/seguir';
import { precioActivacionARS, creditosActivacion } from '../lib/cobros';
import PanelOfertasSocio from '../components/socio/PanelOfertasSocio';
import PaseRegaloDrawer from '../components/PaseRegaloDrawer';
import EscanerCanje from '../components/EscanerCanje';
import SolicitarFecha from '../components/SolicitarFecha';

// Precio de activación de un cupón (pesos, IVA incl.) desde la tabla oficial.
const cuponARS = p => precioActivacionARS({ ahorro: p?.ahorroEstimado ?? p?.ahorro_estimado ?? 0, tokensCosto: p?.tokens_costo });

// ─── Design tokens (para inline styles puntuales) ───────────
const C = {
  primary:     '#475BE1',
  primarySoft: '#EEF0FD',
  primaryDark: '#3347C8',
  ink:         '#0B1020',
  ink2:        '#3D4255',
  muted:       '#6B7280',
  line:        '#E7E9EE',
  bg:          '#F7F7F8',
  green:       '#10A36B',
  yellow:      '#FFC93C',
};

// ─── Prueba social en vivo bajo el título ────────────────────
function LiveSocialProof({ negocioId, tipo }) {
  const key = `${tipo}-${negocioId}`;
  const { viendoBase: viendo, cuponesCanjeados } = socialProof(key);
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, marginTop: 10, flexWrap: 'wrap', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: C.ink2 }}>
        <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
          <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: C.green, opacity: 0.45, animation: 'liveping 1.6s cubic-bezier(0,0,0.2,1) infinite' }} />
          <span style={{ position: 'relative', width: 8, height: 8, borderRadius: '50%', background: C.green }} />
        </span>
        <strong style={{ color: C.ink }}>{viendo} personas</strong> viendo ahora
      </span>
      <span style={{ color: C.line }}>·</span>
      <span style={{ fontSize: 13, color: C.muted }}>
        <strong style={{ color: C.ink2 }}>{cuponesCanjeados}</strong> cupones canjeados
      </span>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes liveping { 75%,100% { transform: scale(2.4); opacity: 0; } }` }} />
    </div>
  );
}

// ─── Botón "Seguir ofertas" del socio ────────────────────────
function SeguirOfertasBtn({ negocioId, session, onLoginRequired }) {
  const [sig, setSig]   = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    if (session?.user?.id && negocioId) {
      esSiguiendo(session.user.id, negocioId).then(v => { if (alive) setSig(v); });
    } else { setSig(false); }
    return () => { alive = false; };
  }, [session, negocioId]);

  const toggle = async () => {
    if (!session) { onLoginRequired?.('registrarse'); return; }
    if (busy) return;
    setBusy(true);
    const next = !sig;
    setSig(next);
    const { error } = await toggleSeguir(session.user.id, negocioId, next);
    if (error) setSig(!next);
    setBusy(false);
  };

  return (
    <button onClick={toggle}
      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold cursor-pointer"
      style={{ background: sig ? C.primary : '#fff', border: `1px solid ${sig ? C.primary : C.line}`, color: sig ? '#fff' : C.ink, transition: 'all .15s' }}
      title={sig ? 'Te avisamos cuando publique una oferta nueva' : 'Recibí un aviso cuando publique una oferta nueva'}>
      <Bell size={15} fill={sig ? '#fff' : 'none'} /> {sig ? 'Siguiendo ofertas' : 'Seguir ofertas'}
    </button>
  );
}

const PRECIO_CREDITO_IVA = 2420; // pesos con IVA incluido (usado sólo en el pack a mitad de precio)
// ─── Plan config ────────────────────────────────────────────
// Lo que ve el turista según si el socio contrató o no. Las claves quedaron
// con los nombres viejos porque son los valores que llegan en `item.plan`;
// BASE = sin plan, PLUS = cualquier tramo PRO.
//
// Fase 2b: el PRECIO se muestra SIEMPRE. Ocultárselo al turista para castigar
// al socio rompe el producto del lado del que compra y le baja el valor al
// Pase. El plan compra visibilidad, no funcionalidad básica.
//
// `showContact` desapareció: no hay botón de contacto ni teléfono/mail del
// socio en ningún caso, tenga plan o no. El contacto no es un dato, es un
// flujo — las solicitudes de fecha de la Fase 5b.
const PLAN_CFG = {
  BASE:  { maxFotos: 3,  showPrice: true, mapDetail: 'approx',  label: 'Sin plan' },
  PLUS:  { maxFotos: 8,  showPrice: true, mapDetail: 'barrio',  label: 'PRO'      },
};

// ─── Tipos ──────────────────────────────────────────────────
const TIPOS_ALOJ   = new Set(['Hotel','Cabaña','Departamento','Casa','Hostel','Dormi']);
const TIPOS_GASTRO = new Set(['Restaurante','Bar','Café','Balneario','Gourmet','Pastelería','Parrilla','Heladería','Bodegón','Cafeterías']);
const TIPO_COLORS  = { Restaurante:'#EF4444', Bar:'#F59E0B', Cafeterías:'#8B5CF6', Café:'#8B5CF6', Balneario:'#0EA5E9', Gourmet:'#10B981', Pastelería:'#EC4899', Parrilla:'#F97316' };

function detectarTipo(item) {
  if (item.itemType) return item.itemType;
  const t = item.type || item.category || '';
  if (TIPOS_ALOJ.has(t))   return 'alojamiento';
  if (TIPOS_GASTRO.has(t)) return 'salidas';
  return 'aventura_relax';
}

// ─── Helpers de formulario ───────────────────────────────────
function DField({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: C.muted }}>{label}</label>
      {children}
    </div>
  );
}
function DInput({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      className="w-full px-3.5 py-[11px] rounded-[10px] text-sm outline-none"
      style={{ border: `1px solid ${C.line}`, background: C.bg, color: C.ink }} />
  );
}
function DError({ children }) {
  return <div className="rounded-[10px] px-3.5 py-2.5 text-[13px] font-medium" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>{children}</div>;
}


// ─── Coordenadas aproximadas por localidad ───────────────────
const LOCALIDAD_COORDS = {
  'Villa Gesell':      [-37.2636, -56.9769],
  'Mar de las Pampas': [-37.3283, -57.0147],
  'Las Gaviotas':      [-37.3050, -57.0020],
  'Mar Azul':          [-37.3530, -57.0333],
  'Chacras del Mar':   [-37.3750, -57.0500],
  'Colonia Marina':    [-37.2200, -56.9500],
  'El Salvaje':        [-37.1900, -56.9300],
};
const DEFAULT_COORDS = [-37.2636, -56.9769];

function ZonaMap({ item, promos, onAddCupon, onOpenOferta }) {
  const center = LOCALIDAD_COORDS[item.localidad] || DEFAULT_COORDS;

  // Solo salidas + aventura & relax, sin alojamientos
  const promosZona = promos
    .filter(p => p.categoria !== 'alojamiento')
    .slice(0, 5)
    .map((p, i) => {
      const base = LOCALIDAD_COORDS[p.negocioLocalidad] || center;
      const angle = (i / 5) * 2 * Math.PI + 0.4;
      const r = 0.006 + (i % 3) * 0.003;
      return { ...p, lat: base[0] + Math.sin(angle) * r, lng: base[1] + Math.cos(angle) * r };
    });

  return (
    <MapView
      promos={promosZona}
      center={center}
      hotelName={item.name}
      onAddCupon={onAddCupon}
      onOpenOferta={onOpenOferta}
    />
  );
}

function hashPos(id) {
  const n = typeof id === 'string' ? id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : Number(id) || 7;
  return { x: ((n * 37 + 11) % 60) + 18, y: ((n * 53 + 17) % 55) + 18 };
}// ─── Amenity chip ─────────────────────────────────────────
const TAG_ICONS = {
  // Conectividad
  'WiFi gratuito':             <Wifi size={15} />,
  'WiFi':                      <Wifi size={15} />,
  // Estacionamiento
  'Estacionamiento':           <Car size={15} />,
  'Cochera cubierta':          <Car size={15} />,
  // Mar / agua
  'Cerca del mar':             <Waves size={15} />,
  'A 80m del mar':             <Waves size={15} />,
  'Vista al mar':              <Waves size={15} />,
  'Frente al mar':             <Waves size={15} />,
  // Piscina
  'Pileta':                    <Droplets size={15} />,
  'Piscina':                   <Droplets size={15} />,
  'Piscina climatizada':       <Droplets size={15} />,
  'Piscina con temperatura':   <Droplets size={15} />,
  // Spa / relax
  'Spa':                       <Sparkles size={15} />,
  'Spa y circuito termal':     <Sparkles size={15} />,
  'Jacuzzi':                   <Sparkles size={15} />,
  'Sauna':                     <Flame size={15} />,
  // Comidas
  'Desayuno':                  <Coffee size={15} />,
  'Desayuno buffet incluido':  <ChefHat size={15} />,
  'Desayuno incluido':         <Coffee size={15} />,
  'Cocina equipada':           <Utensils size={15} />,
  'Parrilla':                  <Flame size={15} />,
  // Check-in
  'Check-in flexible':         <KeyRound size={15} />,
  'Check-in 24hs':             <KeyRound size={15} />,
  'Early check-in':            <KeyRound size={15} />,
  // Cancelación / políticas
  'Cancelación flexible':      <ShieldCheck size={15} />,
  // Entorno / naturaleza
  'Jardín':                    <TreePine size={15} />,
  'Parque':                    <TreePine size={15} />,
  'Quincho':                   <ChefHat size={15} />,
  // Aire acondicionado / clima
  'Aire acondicionado':        <AirVent size={15} />,
  'A/C':                       <AirVent size={15} />,
  'Calefacción':               <Wind size={15} />,
  // Fitness
  'Gimnasio':                  <Dumbbell size={15} />,
  // Entretenimiento
  'TV por cable':              <Tv size={15} />,
  'Smart TV':                  <Tv size={15} />,
  // Familias / mascotas
  'Apto mascotas':             <PawPrint size={15} />,
  'Acepta mascotas':           <PawPrint size={15} />,
  'Apto para niños':           <Baby size={15} />,
  'Cuna disponible':           <Baby size={15} />,
  // Actividades
  'Alquiler de bicicletas':    <Bike size={15} />,
  'Bicicletas':                <Bike size={15} />,
  // Camas / habitaciones
  'Camas extra':               <BedDouble size={15} />,
  'Habitaciones familiares':   <BedDouble size={15} />,
};

function AmenityChip({ tag }) {
  const icon = TAG_ICONS[tag] || <Check size={15} />;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '5px 0' }}>
      <span style={{ color: C.primary, display: 'flex', flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 14, color: C.ink2, lineHeight: 1.3 }}>{tag}</span>
    </div>
  );
}
// ─── Timer regresivo para ofertas Flash ──────────────────────
function FlashTimer({ fechaFin }) {
  const getRemaining = () => {
    const diff = new Date(fechaFin) - Date.now();
    if (diff <= 0) return { h: 0, m: 0, s: 0 };
    const t = Math.floor(diff / 1000);
    return { h: Math.floor(t / 3600), m: Math.floor((t % 3600) / 60), s: t % 60 };
  };
  const [remaining, setRemaining] = useState(getRemaining);
  useEffect(() => {
    const id = setInterval(() => setRemaining(getRemaining()), 1000);
    return () => clearInterval(id);
  }, [fechaFin]);
  const pad = n => String(n).padStart(2, '0');
  const { h, m, s } = remaining;
  // Si expiró no renderizar
  if (h === 0 && m === 0 && s === 0) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {[h, m, s].map((v, i) => (
        <React.Fragment key={i}>
          <div style={{
            background: '#fff', color: C.ink, borderRadius: 6,
            fontSize: 14, fontWeight: 800, lineHeight: 1,
            width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          }}>
            {i === 0 ? v : pad(v)}
          </div>
          {i < 2 && (
            <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 900, fontSize: 13, lineHeight: 1 }}>:</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// Timer compacto inline para la pill de oferta flash
function MiniFlashTimer({ fechaFin }) {
  const getR = () => {
    const diff = new Date(fechaFin) - Date.now();
    if (diff <= 0) return { h: 0, m: 0, s: 0 };
    const t = Math.floor(diff / 1000);
    return { h: Math.floor(t / 3600), m: Math.floor((t % 3600) / 60), s: t % 60 };
  };
  const [r, setR] = useState(getR);
  useEffect(() => { const id = setInterval(() => setR(getR()), 1000); return () => clearInterval(id); }, [fechaFin]);
  if (r.h === 0 && r.m === 0 && r.s === 0) return null;
  const pad = n => String(n).padStart(2, '0');
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2, background: '#e02020', borderRadius: 999, padding: '3px 8px' }}>
      {[r.h, r.m, r.s].map((v, i) => (
        <React.Fragment key={i}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{i === 0 ? v : pad(v)}</span>
          {i < 2 && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>:</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Paletas animadas para PropiaOfferCard ───────────────────
// Inyectar keyframes una sola vez
if (typeof document !== 'undefined' && !document.getElementById('__blob_kf__')) {
  const s = document.createElement('style');
  s.id = '__blob_kf__';
  s.textContent = `
    /* Time warp — elipses en múltiples ángulos */
    @keyframes warp0  {0%{transform:translate(-50%,-50%) rotate(0deg)   scaleX(.04) scaleY(.12);opacity:.95}80%{opacity:.3}100%{transform:translate(-50%,-50%) rotate(0deg)   scaleX(3.2) scaleY(3.2);opacity:0}}
    @keyframes warp40 {0%{transform:translate(-50%,-50%) rotate(40deg)  scaleX(.04) scaleY(.10);opacity:.90}80%{opacity:.3}100%{transform:translate(-50%,-50%) rotate(40deg)  scaleX(3.5) scaleY(3.5);opacity:0}}
    @keyframes warp80 {0%{transform:translate(-50%,-50%) rotate(80deg)  scaleX(.05) scaleY(.13);opacity:.92}80%{opacity:.3}100%{transform:translate(-50%,-50%) rotate(80deg)  scaleX(3.0) scaleY(3.0);opacity:0}}
    @keyframes warp120{0%{transform:translate(-50%,-50%) rotate(120deg) scaleX(.04) scaleY(.11);opacity:.88}80%{opacity:.3}100%{transform:translate(-50%,-50%) rotate(120deg) scaleX(3.4) scaleY(3.4);opacity:0}}
    @keyframes warp160{0%{transform:translate(-50%,-50%) rotate(160deg) scaleX(.06) scaleY(.10);opacity:.93}80%{opacity:.3}100%{transform:translate(-50%,-50%) rotate(160deg) scaleX(2.9) scaleY(2.9);opacity:0}}
  ` + Array.from({length:10},(_,i)=>`
    @keyframes blobA${i}{0%{transform:translate(0,0) scale(1)}25%{transform:translate(${50+i*6}px,${-45-i*4}px) scale(1.3)}50%{transform:translate(${-30-i*3}px,${60+i*5}px) scale(0.78)}75%{transform:translate(${55+i*4}px,${30+i*3}px) scale(1.2)}100%{transform:translate(0,0) scale(1)}}
    @keyframes blobB${i}{0%{transform:translate(0,0) scale(1)}25%{transform:translate(${-55-i*4}px,${35+i*5}px) scale(0.75)}50%{transform:translate(${40+i*5}px,${-50-i*4}px) scale(1.32)}75%{transform:translate(${-35-i*3}px,${-30-i*4}px) scale(0.88)}100%{transform:translate(0,0) scale(1)}}
    @keyframes blobC${i}{0%{transform:translate(0,0) scale(1)}25%{transform:translate(${30+i*4}px,${55+i*4}px) scale(1.25)}50%{transform:translate(${-50-i*4}px,${-35-i*3}px) scale(0.8)}75%{transform:translate(${-20-i*3}px,${50+i*4}px) scale(1.15)}100%{transform:translate(0,0) scale(1)}}
  `).join('');
  document.head.appendChild(s);
}

const BLOB_PALETTES = [
  { bg: '#1A4A6B', c: ['#2E86C1','#48C9B0','#1ABC9C'] },
  { bg: '#5B2C6F', c: ['#E67E22','#E91E8C','#8E44AD'] },
  { bg: '#1A5C2A', c: ['#27AE60','#52BE80','#1E8449'] },
  { bg: '#6B4010', c: ['#F39C12','#E67E22','#D4AC0D'] },
  { bg: '#1A3A5C', c: ['#16A085','#2E86C1','#27AE60'] },
  { bg: '#2C1A7A', c: ['#5B2C6F','#7D3C98','#4A90D9'] },
  { bg: '#0E4D6B', c: ['#17A589','#1A8FC0','#48C9B0'] },
  { bg: '#6B1A3A', c: ['#C0392B','#E91E8C','#8E44AD'] },
  { bg: '#3A2A6B', c: ['#7B68EE','#9B59B6','#4A90D9'] },
  { bg: '#2A4A1A', c: ['#C0392B','#27AE60','#D4AC0D'] },
];// ═══════════════════════════════════════════════════════════
//  DatePickerField — calendario inline tipo popover
// ═══════════════════════════════════════════════════════════
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAY_NAMES   = ['Lu','Ma','Mi','Ju','Vi','Sá','Do'];

// Sin uso desde la Fase 2b (se fue con el CTA de presupuesto). Se conserva
// a propósito: la Fase 5b lo necesita para que el turista elija la fecha de
// su solicitud.
// eslint-disable-next-line no-unused-vars
function DatePickerField({ label, value, onChange, minDate }) {
  const today   = new Date(); today.setHours(0,0,0,0);
  const minD    = minDate ? new Date(minDate) : today; minD.setHours(0,0,0,0);

  const [open, setOpen]       = useState(false);
  const [viewYear, setViewYear] = useState((value || minD).getFullYear());
  const [viewMonth, setViewMonth] = useState((value || minD).getMonth());
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const fmt = d => d ? d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

  const prevMonth = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1);
  const nextMonth = () => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1);

  // Celdas del mes
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startOffset = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // lunes=0
  const cells = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full px-3 py-2.5 rounded-xl text-left cursor-pointer transition-colors"
        style={{ border: `1px solid ${open ? C.primary : C.line}`, background: '#fff' }}
      >
        <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: C.muted }}>{label}</div>
        <div className="text-[13px] font-semibold" style={{ color: value ? C.ink : C.muted }}>
          {fmt(value) || 'Seleccioná fecha'}
        </div>
      </button>

      {open && (
        <div
          className="absolute z-50 bg-white rounded-2xl p-3"
          style={{ top: 'calc(100% + 6px)', left: 0, width: 272, border: `1px solid ${C.line}`, boxShadow: '0 20px 48px -16px rgba(11,16,32,0.22)' }}
        >
          {/* Navegación mes */}
          <div className="flex items-center justify-between mb-2 px-1">
            <button type="button" onClick={prevMonth} className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer border-0" style={{ background: C.bg }}>
              <ChevronLeft size={14} color={C.ink2} />
            </button>
            <span className="text-[13px] font-bold" style={{ color: C.ink }}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth} className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer border-0" style={{ background: C.bg }}>
              <ChevronRight size={14} color={C.ink2} />
            </button>
          </div>

          {/* Cabecera días */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center text-[11px] font-bold py-0.5" style={{ color: C.muted }}>{d}</div>
            ))}
          </div>

          {/* Grilla de días */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const date    = new Date(viewYear, viewMonth, day);
              const isPast  = date < minD;
              const isSel   = value && value.toDateString() === date.toDateString();
              const isToday = date.toDateString() === today.toDateString();
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => { if (!isPast) { onChange(date); setOpen(false); } }}
                  className="h-8 w-full rounded-lg text-[13px] border-0 flex items-center justify-center transition-colors"
                  style={{
                    background:  isSel ? C.primary : isToday ? C.primarySoft : 'transparent',
                    color:       isPast ? '#D1D5DB' : isSel ? '#fff' : isToday ? C.primary : C.ink,
                    fontWeight:  isSel || isToday ? 700 : 500,
                    cursor:      isPast ? 'default' : 'pointer',
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const RULES = [
  { icon: '🕑', text: 'Check-in: de 14:00 a 22:00 hs' },
  { icon: '🕙', text: 'Check-out: hasta las 10:00 hs' },
  { icon: '🚭', text: 'Prohibido fumar en interiores y espacios comunes' },
  { icon: '🐾', text: 'No se admiten mascotas sin consulta previa' },
  { icon: '🎉', text: 'No se permiten fiestas ni eventos' },
  { icon: '🔇', text: 'Silencio a partir de las 22:00 hs' },
];
// ═══════════════════════════════════════════════════════════
//  AlojamientoGallery — foto grande + columna 3 thumbs
// ═══════════════════════════════════════════════════════════
function AlojamientoGallery({ item, plan }) {
  const cfg      = PLAN_CFG[plan] || PLAN_CFG.PLUS;
  const rawFotos = (item.fotos?.length ? item.fotos : [item.image]).filter(Boolean).slice(0, cfg.maxFotos);
  const [light, setLight] = useState(null);

  const main   = rawFotos[0] || item.image;
  const thumbs = [1, 2, 3].map(i => rawFotos[i] || main);
  const extra  = rawFotos.length > 4 ? rawFotos.length - 4 : 0;
  const fotos  = rawFotos.length ? rawFotos : [main];

  useEffect(() => {
    if (light === null) return;
    const handler = e => {
      if (e.key === 'ArrowRight') setLight(i => (i + 1) % fotos.length);
      else if (e.key === 'ArrowLeft') setLight(i => (i - 1 + fotos.length) % fotos.length);
      else if (e.key === 'Escape') setLight(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [light, fotos.length]);

  return (
    <>
      {/* Sin marginTop propio (2026-08-13): esos 20px eran de la galería y no
          de la fila, así que la columna derecha —que arranca directo con el
          panel de ofertas— empezaba 20px más arriba y las dos cabeceras no
          coincidían. Ahora el aire lo pone el `pt` del grid, que es de las dos
          columnas: alineadas por construcción y no por dos números iguales
          escritos en dos lugares. */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 148px', gap: 8, height: 400, overflow: 'hidden' }}>
        {/* Foto principal */}
        <div className="rounded-2xl overflow-hidden cursor-pointer" style={{ minHeight: 0, minWidth: 0 }} onClick={() => setLight(0)}>
          <img src={main} alt={item.name} className="object-cover" style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>

        {/* Columna 3 thumbs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0, overflow: 'hidden' }}>
          {thumbs.map((src, i) => {
            const isLast = i === 2 && extra > 0;
            return (
              <div
                key={i}
                className="rounded-xl overflow-hidden relative cursor-pointer"
                style={{ flex: 1, minHeight: 0 }}
                onClick={() => setLight(Math.min(i + 1, fotos.length - 1))}
              >
                <img
                  src={src} alt=""
                  className="object-cover"
                  style={{ width: '100%', height: '100%', display: 'block', filter: isLast ? 'brightness(0.42)' : 'none' }}
                />
                {isLast && (
                  <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm pointer-events-none">
                    +{extra} fotos
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox */}
      {light !== null && (
        <div className="fixed inset-0 z-[2000] bg-black/90 flex items-center justify-center" onClick={() => setLight(null)}>
          <img src={fotos[light]} alt="" className="max-w-[90vw] max-h-[88vh] object-contain rounded-xl" />
          <button onClick={() => setLight(null)} className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer border-0" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
            <X size={18} />
          </button>
          {fotos.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); setLight((light - 1 + fotos.length) % fotos.length); }}
                className="absolute left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer border-0 text-white text-2xl" style={{ background: 'rgba(255,255,255,0.15)' }}>‹</button>
              <button onClick={e => { e.stopPropagation(); setLight((light + 1) % fotos.length); }}
                className="absolute right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer border-0 text-white text-2xl" style={{ background: 'rgba(255,255,255,0.15)' }}>›</button>
            </>
          )}
          <div className="absolute bottom-5 text-[13px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{light + 1} / {fotos.length}</div>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════
//  CarritoItem — mini-ficha para columna derecha
// ═══════════════════════════════════════════════════════════
function CarritoItem({ promo, onOpenOferta }) {
  const mostrarCreditos = useMostrarCreditos();
  const tokens = creditosActivacion({ ahorro: promo.ahorroEstimado, tokensCosto: promo.tokens_costo });
  const tokensMitad = Math.max(1, Math.floor(tokens / 2));
  return (
    <div
      onClick={() => onOpenOferta?.(promo)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
        border: `1px solid ${C.line}`, background: '#fff',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = C.primary}
      onMouseLeave={e => e.currentTarget.style.borderColor = C.line}
    >
      {/* Foto limpia sin overlay */}
      <div style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: C.line, position: 'relative' }}>
        {(promo.image || promo.imagen_url) && (
          <img src={promo.image || promo.imagen_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Badge inline + título más grande */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, flexWrap: 'wrap' }}>
          {promo.badge && (
            <span style={{ flexShrink: 0, background: C.primary, color: '#fff', fontSize: 12, fontWeight: 800, borderRadius: 4, padding: '2px 7px', letterSpacing: '0.02em', lineHeight: 1.4 }}>
              {promo.badge}
            </span>
          )}
          <span style={{ fontSize: 13, fontWeight: 700, color: C.ink, lineHeight: 1.4 }}>
            {promo.title || promo.titulo}
          </span>
        </div>
        {/* Localidad · Socio — igual que microficha del mapa */}
        {(promo.proveedorNombre || promo.negocios?.nombre || promo.negocioLocalidad || promo.negocios?.localidad) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: C.muted }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, color: C.primary }}>
              <path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/>
            </svg>
            {[promo.negocioLocalidad || promo.negocios?.localidad, promo.proveedorNombre || promo.negocios?.nombre].filter(Boolean).join(' · ')}
          </div>
        )}
        {/* Precio */}
        {mostrarCreditos ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <CoinSVG size={11} />
              <span style={{ fontSize: 11, fontWeight: 700, color: C.ink }}>{tokens} crédito{tokens !== 1 ? 's' : ''}</span>
              <CreditTooltip />
            </div>
            <span style={{ fontSize: 10, color: C.muted }}>(${(cuponARS(promo)).toLocaleString('es-AR')})</span>
          </div>
        ) : (
          <div style={{ marginTop: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: C.ink }}>${(cuponARS(promo)).toLocaleString('es-AR')}</span>
          </div>
        )}
      </div>
      <HeartButton id={promo.id} size={28} light />
      <ChevronRight size={14} color={C.muted} style={{ flexShrink: 0 }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  MiCarritoPanel — columna derecha: ítems ya en el carrito
// ═══════════════════════════════════════════════════════════
function MiCarritoPanel() {
  const { cupones, removeCupon } = useCarrito();
  if (cupones.length === 0) return null;
  return (
    <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 20, padding: '16px 20px', boxShadow: '0 4px 24px -8px rgba(11,16,32,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <img src="/ico-disc.svg" style={{ width: 22, height: 22 }} alt="" />
        <span style={{ fontSize: 16, fontWeight: 800, color: C.ink, flex: 1 }}>Tu carrito</span>
        <span style={{ background: C.primary, color: '#fff', borderRadius: 999, fontSize: 11, fontWeight: 700, padding: '2px 8px' }}>{cupones.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cupones.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: C.bg, borderRadius: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: (c.accent || C.primary) + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: c.accent || C.primary }}>{c.d}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.ink, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.t}</p>
              <p style={{ fontSize: 11, color: C.muted, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.p}</p>
            </div>
            <button onClick={() => removeCupon(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 2, lineHeight: 1, flexShrink: 0 }}>
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════
//  ZonaDescuentosBloque — el mapa, dentro de la columna central
//
//  Estaba abajo de todo, a todo el ancho y con una columna de microfichas al
//  costado (2026-08-13). Ahí el mapa era una sección aparte: quedaba después
//  del pie de la ficha y el turista tenía que salir del contenido del socio
//  para verlo. Ahora es un bloque más de la columna central, debajo de la
//  descripción, y las microfichas se fueron — en esta caja no entran, y lo que
//  decían lo dice la ficha que sale del pin al tocarlo.
// ═══════════════════════════════════════════════════════════
function ZonaDescuentosBloque({ item, promosLocalidad = [], onOpenOferta, onOpenLocalidad }) {
  if (!promosLocalidad.length) return null;
  return (
    <div style={{ marginTop: 36 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        {/* Sin el ícono de 30px que tenía como sección suelta: los otros
            títulos de esta columna ("Sobre el lugar", "Servicios y
            comodidades") van a texto pelado, y uno con ícono se leía como de
            otra pantalla. */}
        <h2 className="text-lg font-bold m-0" style={{ color: C.ink }}>Ubicación y descuentos en la zona</h2>
        {onOpenLocalidad && item.localidad && (
          <button
            onClick={() => onOpenLocalidad(item.localidad)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.primary, display: 'flex', alignItems: 'center', gap: 4, padding: 0, flexShrink: 0 }}
          >
            Ver todas <ChevronRight size={14} />
          </button>
        )}
      </div>
      <ZonaMap
        item={item}
        promos={promosLocalidad}
        onOpenOferta={onOpenOferta}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  SimilaresSection — "También puede interesarte"
//
//  Reemplaza a "¡Más cupones agregás, más beneficios para vos!", que era un
//  título de campaña sobre una fila que mezclaba alianzas con cualquier oferta
//  de la localidad. Acá el criterio es el parecido con el socio que se está
//  mirando y lo resuelve getPromosSimilares() — misma subcategoría y misma
//  zona primero, y de ahí para abajo.
//
//  La ficha es OfertaCard, la misma de la home y de los listados: si el
//  turista se va de esta ficha, se va a una que ya sabe leer.
// ═══════════════════════════════════════════════════════════
function SimilaresSection({ promos = [], onOpenOferta }) {
  if (!promos.length) return null;
  return (
    <section style={{ background: C.bg, borderTop: `1px solid ${C.line}`, paddingTop: 48, paddingBottom: 48 }}>
      <div style={{ paddingLeft: 'max(var(--site-pad), calc((100vw - var(--site-max)) / 2 + var(--site-pad)))', paddingRight: 56, marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.ink, margin: 0 }}>
          También puede interesarte
        </h2>
      </div>

      <div style={{ position: 'relative' }}>
        <div
          style={{ overflowX: 'auto', paddingLeft: 'max(var(--site-pad), calc((100vw - var(--site-max)) / 2 + var(--site-pad)))', paddingBottom: 8 }}
          className="no-scrollbar"
        >
          {/* stretch, igual que la tira de la home: todas las fichas toman el
              alto de la más alta y la fila no queda escalonada. */}
          <div style={{ display: 'flex', gap: 24, width: 'max-content', paddingRight: 56, alignItems: 'stretch' }}>
            {promos.map(p => (
              <div key={p.id} style={{ width: 340, flexShrink: 0, display: 'flex' }}>
                <OfertaCard promo={p} onOpen={onOpenOferta} />
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 8, width: 120, background: `linear-gradient(to right, transparent, ${C.bg})`, pointerEvents: 'none', zIndex: 2 }} />
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
//  AlojamientoDetail (main two-col + sections below)
// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
//  PanelOfertas — el acordeón + los modales que puede abrir
//
//  Existe para que las dos fichas (alojamiento y gastro/experiencia) no
//  repitan el cableado de la cámara y del pedido de fecha. El panel en sí no
//  sabe nada de modales: recibe callbacks y listo.
// ═══════════════════════════════════════════════════════════
function PanelOfertas({ promos, session, ofertaId, cuponesEnZona, cargando, onOpenOferta, onComprarPase, onSuscribirHoteleria }) {
  const { addCupon } = useCarrito();
  const [escaneando, setEscaneando] = useState(false);
  const [pidiendoFecha, setPidiendoFecha] = useState(null);
  const [regalando, setRegalando] = useState(false);
  const [aviso, setAviso] = useState('');

  return (
    <>
      <PanelOfertasSocio
        promos={promos}
        session={session}
        ofertaId={ofertaId}
        cuponesEnZona={cuponesEnZona}
        cargando={cargando}
        onOpenOferta={onOpenOferta}
        onComprarPase={onComprarPase}
        onSumarCupon={p => addCupon(p)}
        onCanjear={() => setEscaneando(true)}
        onCoordinarFecha={p => setPidiendoFecha(p)}
        onVerPase={() => onComprarPase?.(7)}
        onRegalarPase={() => setRegalando(true)}
      />
      {aviso && (
        <div style={{ fontSize: 12.5, color: C.ink2, textAlign: 'center', lineHeight: 1.5 }}>{aviso}</div>
      )}
      {escaneando && (
        <EscanerCanje
          onCerrar={() => setEscaneando(false)}
          onNegocio={negocioId => { setEscaneando(false); window.location.search = `?canjear=${negocioId}`; }}
        />
      )}
      {pidiendoFecha && (
        <SolicitarFecha
          oferta={pidiendoFecha}
          onCerrar={() => setPidiendoFecha(null)}
          onEnviada={() => { setPidiendoFecha(null); setAviso('Pedido enviado. El comercio tiene 72 horas para responder.'); }}
        />
      )}
      {/* Montado siempre y no detrás de `regalando`: el drawer entra
          deslizándose, y si naciera con el click no habría estado inicial
          desde el cual animar — aparecería puesto. Cerrado no molesta:
          está fuera de pantalla, sin pointer-events y aria-hidden. */}
      <PaseRegaloDrawer
        abierto={regalando}
        onCerrar={() => setRegalando(false)}
        onElegir={id => {
          setRegalando(false);
          if (id === 'empresa') onSuscribirHoteleria?.();
          else onComprarPase?.();
        }}
      />
    </>
  );
}

function AlojamientoDetail({ item, promos, promosLocalidad = [], similares = [], loading, onOpenOferta, onOpenLocalidad, session, onLoginRequired, onComprarPase, onSuscribirHoteleria }) {
  const plan = item.plan || 'PLUS';
  const cfg  = PLAN_CFG[plan];

  const tags = item.tags?.length
    ? item.tags
    : ['A 80m del mar', 'Piscina climatizada', 'Spa y circuito termal', 'Desayuno buffet incluido', 'Check-in 24hs', 'Cancelación flexible'];

  return (
    <>
      <div className="max-w-[var(--site-max)] mx-auto px-[var(--site-pad)]">

        {/* ── Título + acciones ────────────────────────────── */}
        <div style={{ paddingTop: 20 }}>
          <div className="flex justify-between items-start gap-6">
            <div>
              <div className="flex items-baseline gap-4 flex-wrap mb-1">
                <h1 className="text-[42px] font-extrabold leading-[1.05] tracking-tight m-0" style={{ color: C.ink }}>{item.name}</h1>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 15, flexShrink: 0 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                    <path fill="#ffffff" stroke="#415ce8" strokeWidth="1" d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/>
                    <path d="M9 12l2 2 4-4" stroke="#415ce8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ fontSize: 13, fontWeight: 400, color: '#415ce8', fontStyle: 'italic' }}>Socio verificado</span>
                </span>
              </div>
              <LiveSocialProof negocioId={item.id} tipo="alojamiento" />
            </div>
            <div className="flex gap-2 shrink-0">
              <SeguirOfertasBtn negocioId={item.id} session={session} onLoginRequired={onLoginRequired} />
              <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium cursor-pointer"
                style={{ background: '#fff', border: `1px solid ${C.line}`, color: C.ink }}>
                <Heart size={15} /> Guardar
              </button>
              <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium cursor-pointer"
                style={{ background: '#fff', border: `1px solid ${C.line}`, color: C.ink }}>
                <Share2 size={15} /> Compartir
              </button>
            </div>
          </div>
        </div>

        {/* ── Grid dos columnas ────────────────────────────── */}
        <div className="grid gap-12 items-start pt-11 pb-6" style={{ gridTemplateColumns: '1.65fr 1fr' }}>

          {/* LEFT */}
          <div>
            <AlojamientoGallery item={item} plan={plan} />

            <div style={{ marginTop: 36 }}>
              <h2 className="text-lg font-bold mb-2.5" style={{ color: C.ink }}>Sobre el lugar</h2>
              <p className="text-[15px] leading-relaxed" style={{ color: C.ink2, lineHeight: 1.65 }}>
                {item.description || item.desc || 'Disfrutá del mar y la naturaleza en este increíble lugar de la Costa Atlántica. Un espacio diseñado para el descanso, con todos los servicios que necesitás para una estadía perfecta.'}
              </p>

              <h2 className="text-lg font-bold mt-8 mb-3" style={{ color: C.ink }}>¿Qué destaca este alojamiento?</h2>
              {/* Los amenities los ve todo el mundo: son lo que le sirve al
                  turista para elegir. El plan compra visibilidad, no esto. */}
              <div className="grid grid-cols-2 gap-2.5">
                {tags.slice(0, 6).map(tag => (
                  <AmenityChip key={tag} tag={tag} />
                ))}
              </div>

              <ZonaDescuentosBloque
                item={item}
                promosLocalidad={promosLocalidad}
                onOpenOferta={onOpenOferta}
                onOpenLocalidad={onOpenLocalidad}
              />
            </div>
          </div>

          {/* RIGHT — sticky desde arriba */}
          <div style={{ position: 'sticky', top: 84, display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
            <PanelOfertas
              promos={promos.map(p => ({ ...p, title: p.title || p.titulo, image: p.image || p.imagen_url }))}
              session={session}
              ofertaId={item.ofertaId}
              cuponesEnZona={promosLocalidad.length}
              cargando={loading}
              onOpenOferta={onOpenOferta}
              onComprarPase={onComprarPase}
              onSuscribirHoteleria={onSuscribirHoteleria}
            />
            <MiCarritoPanel />
          </div>
        </div>
      </div>

      {/* ── También puede interesarte — última sección antes del footer ── */}
      {!loading && <SimilaresSection promos={similares} onOpenOferta={onOpenOferta} />}

    </>
  );
}

// ─── Helpers de links de contacto (ficha de socio) ───────────
const withProto = u => (u && !/^https?:\/\//i.test(u) ? `https://${u}` : u);
const igUrl = h => {
  if (!h) return '';
  const clean = h.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/\/$/, '');
  return clean ? `https://instagram.com/${clean}` : '';
};
const IgIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);
// ═══════════════════════════════════════════════════════════
//  GastroExperienciaDetail — ficha de socio (info + promos)
// ═══════════════════════════════════════════════════════════
function GastroExperienciaDetail({ item, tipo, promos = [], promosLocalidad = [], similares = [], loading, session, onOpenOferta, onOpenLocalidad, onLoginRequired, onComprarPase, onSuscribirHoteleria }) {
  const plan = item.plan || 'PLUS';
  const category  = item.category || item.type || '';
  const pinColor  = TIPO_COLORS[category] || C.muted;
  const isGastro  = tipo === 'salidas';
  const priceLabel = { '$': 'Económico (hasta $3.000)', '$$': 'Moderado ($3.000 – $7.000)', '$$$': 'Gourmet ($7.000+)' }[item.priceRange] || item.priceRange;

  const promosVisibles = promos.map(p => ({ ...p, title: p.title || p.titulo, image: p.image || p.imagen_url }));

  // Cocina como chips
  const cocinas = (item.tipoCocina || '').split(',').map(s => s.trim()).filter(Boolean);
  const destacados = [...(item.tags || []), ...cocinas];
  // Características del lugar cargadas por el socio (checklist del editor de perfil).
  const servicios = item.servicios || [];

  // Enlaces públicos del socio — NO datos de contacto.
  // Fase 2b: no se muestra el teléfono ni el mail del socio en ningún caso,
  // tenga plan o no. WhatsApp y Email salieron de acá; el contacto pasa a ser
  // el flujo de solicitudes de fecha (Fase 5b). Menú, sitio web e Instagram
  // se conservan: son canales públicos que el socio ya publica por su cuenta.
  const contactos = [
    item.menuUrl   && { icon: <BookOpen size={14} />,   label: 'Ver menú / carta', href: withProto(item.menuUrl) },
    item.sitioWeb  && { icon: <Globe size={14} />,      label: 'Sitio web',        href: withProto(item.sitioWeb) },
    item.instagram && { icon: <IgIcon size={14} />,     label: 'Instagram',        href: igUrl(item.instagram) },
  ].filter(Boolean).filter(c => c.href);

  // Ficha de datos — sólo lo que existe
  const datos = [
    { icon: isGastro ? <Utensils size={15} /> : <Star size={15} />, label: 'Tipo', val: category || (isGastro ? 'Gastronomía' : 'Experiencia') },
    cocinas.length > 0 && { icon: <ChefHat size={15} />, label: 'Cocina', val: cocinas.join(' · ') },
    item.tieneLocalFisico && item.address && { icon: <MapPin size={15} />, label: 'Domicilio', val: [item.address, item.piso && `Piso ${item.piso}`, item.depto && `Depto ${item.depto}`].filter(Boolean).join(' · ') },
    { icon: <MapPin size={15} />, label: 'Zona', val: [item.zona, item.localidad].filter(Boolean).join(' · ') || 'Villa Gesell' },
    item.priceRange && { icon: <span className="font-bold text-sm">{item.priceRange}</span>, label: 'Rango de precio', val: priceLabel },
    item.capacidad && { icon: <Users size={15} />, label: 'Capacidad', val: `${item.capacidad} personas` },
    isGastro && item.reservaObligatoria && { icon: <Clock size={15} />, label: 'Fecha', val: 'Se coordina con el comercio' },
  ].filter(Boolean);

  return (
    <>
      <div className="max-w-[var(--site-max)] mx-auto px-[var(--site-pad)]">

        {/* ── Título + acciones (igual que alojamiento) ────── */}
        <div style={{ paddingTop: 20 }}>
          <div className="flex justify-between items-start gap-6">
            <div>
              <div className="flex items-baseline gap-4 flex-wrap mb-1">
                <h1 className="text-[42px] font-extrabold leading-[1.05] tracking-tight m-0" style={{ color: C.ink }}>{item.name}</h1>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 15, flexShrink: 0 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                    <path fill="#ffffff" stroke="#415ce8" strokeWidth="1" d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/>
                    <path d="M9 12l2 2 4-4" stroke="#415ce8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ fontSize: 13, fontWeight: 400, color: '#415ce8', fontStyle: 'italic' }}>Socio verificado</span>
                </span>
              </div>
              <LiveSocialProof negocioId={item.id} tipo={tipo} />
            </div>
            <div className="flex gap-2 shrink-0">
              <SeguirOfertasBtn negocioId={item.id} session={session} onLoginRequired={onLoginRequired} />
              <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium cursor-pointer"
                style={{ background: '#fff', border: `1px solid ${C.line}`, color: C.ink }}>
                <Heart size={15} /> Guardar
              </button>
              <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium cursor-pointer"
                style={{ background: '#fff', border: `1px solid ${C.line}`, color: C.ink }}>
                <Share2 size={15} /> Compartir
              </button>
            </div>
          </div>
        </div>

        {/* ── Grid dos columnas (igual que alojamiento) ────── */}
        <div className="grid gap-12 items-start pt-11 pb-6" style={{ gridTemplateColumns: '1.65fr 1fr' }}>

          {/* LEFT — galería + info del lugar */}
          <div>
            <AlojamientoGallery item={item} plan={plan} />

            <div style={{ marginTop: 36 }}>
            <h2 className="text-lg font-bold mb-2.5" style={{ color: C.ink }}>
              {isGastro ? 'Sobre el lugar' : 'Descripción de la experiencia'}
            </h2>
            <p className="text-[15px] leading-relaxed" style={{ color: C.ink2, lineHeight: 1.65 }}>
              {item.description || item.desc || (isGastro ? 'Un lugar especial en la Costa Atlántica para disfrutar en compañía.' : 'Una experiencia única diseñada para que descubras lo mejor de Villa Gesell y la zona.')}
            </p>

            {servicios.length > 0 && (
              <>
                <h3 className="text-lg font-bold mt-7 mb-3" style={{ color: C.ink }}>Servicios y comodidades</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {servicios.map(s => (
                    <AmenityChip key={s} tag={s} />
                  ))}
                </div>
              </>
            )}

            {destacados.length > 0 && (
              <>
                <h3 className="text-lg font-bold mt-7 mb-3" style={{ color: C.ink }}>Destacados</h3>
                <div className="flex flex-wrap gap-2">
                  {destacados.map(tag => (
                    <span key={tag} className="px-3 py-1.5 rounded-full text-[12px] font-semibold" style={{ background: C.primarySoft, color: C.primary }}>{tag}</span>
                  ))}
                </div>
              </>
            )}

            {/* Información y contacto del comercio */}
            <h3 className="text-lg font-bold mt-8 mb-3" style={{ color: C.ink }}>Información del comercio</h3>
            <div className="rounded-2xl p-5" style={{ background: '#fff', border: `1px solid ${C.line}` }}>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold mb-3" style={{ background: `${pinColor}18`, color: pinColor }}>
                {isGastro ? <Utensils size={13} /> : <Star size={13} />} {category || (isGastro ? 'Gastronomía' : 'Experiencia')}
              </div>

              <div style={{ borderTop: `1px solid ${C.line}` }}>
                {datos.map((r, i) => (
                  <div key={i} className="flex items-start gap-3 py-3" style={{ borderBottom: `1px solid ${C.line}` }}>
                    <div style={{ color: C.primary, marginTop: 1 }}>{r.icon}</div>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.muted }}>{r.label}</div>
                      <div className="text-sm font-medium mt-0.5" style={{ color: C.ink }}>{r.val}</div>
                    </div>
                  </div>
                ))}
              </div>

              {contactos.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {contactos.map(c => (
                    <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-semibold no-underline"
                      style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink2 }}>
                      {c.icon} {c.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <ZonaDescuentosBloque
              item={item}
              promosLocalidad={promosLocalidad}
              onOpenOferta={onOpenOferta}
              onOpenLocalidad={onOpenLocalidad}
            />
            </div>{/* end marginTop wrapper */}
          </div>

          {/* RIGHT — sidebar sticky: promociones (siempre) + horario (si está cargado) */}
          <div style={{ position: 'sticky', top: 84, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* `loading` va en la condición y no sólo en el prop: mientras la
                consulta viaja, `promosVisibles` está vacío igual que cuando el
                socio no tiene ninguna oferta, y este lado del ternario decía
                "no cuenta con cupones disponibles" antes de saberlo. */}
            {(loading || promosVisibles.length > 0) ? (
              <PanelOfertas
                promos={promosVisibles}
                session={session}
                ofertaId={item.ofertaId}
                cuponesEnZona={promosLocalidad.length}
                cargando={loading}
                onOpenOferta={onOpenOferta}
                onComprarPase={onComprarPase}
                onSuscribirHoteleria={onSuscribirHoteleria}
              />
            ) : (
              <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 20, boxShadow: '0 20px 60px -30px rgba(11,16,32,0.15)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 18px 4px' }}>
                  <img src="/ico-disc.svg" style={{ width: 32, height: 42, objectFit: 'contain' }} alt="" />
                  <span style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>Promociones</span>
                </div>
                <div style={{ padding: '20px 18px 22px', textAlign: 'center' }}>
                  <p className="text-[13px]" style={{ color: C.muted, lineHeight: 1.5, margin: 0 }}>
                    Este establecimiento no cuenta con cupones disponibles.
                  </p>
                </div>
              </div>
            )}

            {item.horario && (
              <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 20, padding: 18 }}>
                <div className="flex items-center gap-2 mb-2" style={{ color: C.ink }}>
                  <Clock size={16} />
                  <span className="text-[13px] font-bold">Horario</span>
                </div>
                <p className="text-[13.5px]" style={{ color: C.ink2, lineHeight: 1.55, margin: 0, whiteSpace: 'pre-line' }}>
                  {item.horario}
                </p>
              </div>
            )}

            <MiCarritoPanel />
          </div>
        </div>
      </div>

      {/* ── También puede interesarte — última sección antes del footer ── */}
      {!loading && <SimilaresSection promos={similares} onOpenOferta={onOpenOferta} />}
    </>
  );
}

// ═══════════════════════════════════════════════════════════
//  MAIN — DetailView
// ═══════════════════════════════════════════════════════════
const CLASE_PLURAL = {
  'Hotel': 'Hoteles', 'Cabaña': 'Cabañas', 'Departamento': 'Departamentos',
  'Casa': 'Casas', 'Hostel': 'Hostels', 'Dormi': 'Dormis', 'Apart': 'Aparts',
  'Camping': 'Campings', 'Glamping': 'Glamping',
};

export default function DetailView({ item, onBack, onOpenOferta, onOpenLocalidad, onOpenSeccion, onOpenClase, session, onLoginRequired, onComprarPase, onSuscribirHoteleria }) {
  // El tracking va antes del return temprano: los hooks no pueden quedar
  // detrás de una condición. La visita se cuenta una vez por pestaña.
  useEffect(() => { if (item?.id) trackVistaFicha(item.id); }, [item?.id]);

  if (!item) return null;

  const tipo  = detectarTipo(item);
  const plan  = item.plan || 'PLUS';
  const pinColor = TIPO_COLORS[item.type || item.category] || C.primary;

  const [promos,          setPromos]          = useState([]);
  const [promosLocalidad, setPromosLocalidad] = useState([]);
  const [similares,       setSimilares]       = useState([]);
  const [loading,         setLoading]         = useState(true);

  const backLabel = { alojamiento: 'Alojamientos', salidas: 'Salidas', aventura_relax: 'Aventura & Relax' }[tipo] || 'Inicio';

  useEffect(() => {
    async function cargar() {
      setLoading(true);
      if (!item.id) { setLoading(false); return; }

      const [propiasResult, localidadResult, similaresResult] = await Promise.all([
        getPromosDeNegocio(item.id),
        getPromosLocalidad(item.localidad || '', item.id),
        getPromosSimilares(item),
      ]);

      setPromos(propiasResult.filter(p => p.tokens_costo !== 0));
      setPromosLocalidad(localidadResult);
      setSimilares(similaresResult);
      setLoading(false);
    }
    cargar();
  }, [item.id]);

  return (
    <div className="min-h-screen bg-white" style={{ paddingTop: 100, fontFamily: "'Inter', system-ui, sans-serif", color: C.ink }}>

      {/* ── Wrapper único alineado con el nav ─────────────── */}
      <div className="max-w-[var(--site-max)] mx-auto px-[var(--site-pad)]">

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-3 text-[13px] pt-4 pb-0 flex-wrap" style={{ color: C.muted }}>

          {/* Home */}
          <button
            onClick={() => onBack()}
            className="bg-transparent border-0 cursor-pointer p-0 flex items-center"
            style={{ color: C.primary }}
          >
            <Home size={16} strokeWidth={2.2} color={C.primary} />
          </button>

          <ChevronRight size={12} className="shrink-0" />

          {/* 1 — Sección */}
          <button
            onClick={() => onOpenSeccion ? onOpenSeccion(tipo) : onBack()}
            className="bg-transparent border-0 cursor-pointer p-0 text-[13px] font-semibold"
            style={{ color: C.primary }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          >
            {backLabel}
          </button>

          {/* 2 — Localidad */}
          {tipo !== 'aventura_relax' && item.localidad && (
            <>
              <ChevronRight size={12} className="shrink-0" />
              <button
                onClick={() => onOpenLocalidad?.(item.localidad)}
                className="bg-transparent border-0 cursor-pointer p-0 text-[13px]"
                style={{ color: C.muted }}
                onMouseEnter={e => { e.currentTarget.style.color = C.ink; e.currentTarget.style.textDecoration = 'underline'; }}
                onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.textDecoration = 'none'; }}
              >
                {item.localidad}
              </button>
            </>
          )}

          {/* 3 — Clase de alojamiento (plural + clickeable) */}
          {(item.type || item.category) && (() => {
            const clase = item.type || item.category;
            const claseLabel = CLASE_PLURAL[clase] || (clase + 's');
            return (
              <>
                <ChevronRight size={12} className="shrink-0" />
                <button
                  onClick={() => onOpenClase?.({ localidad: item.localidad, clase })}
                  className="bg-transparent border-0 cursor-pointer p-0 text-[13px]"
                  style={{ color: C.muted }}
                  onMouseEnter={e => { e.currentTarget.style.color = C.ink; e.currentTarget.style.textDecoration = 'underline'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.textDecoration = 'none'; }}
                >{claseLabel}</button>
              </>
            );
          })()}

          {/* 4 — Zona (página actual) */}
          {item.zona && (
            <>
              <ChevronRight size={12} className="shrink-0" />
              <span className="font-bold flex items-center gap-1" style={{ color: C.ink }}>
                <MapPin size={12} style={{ color: C.muted, flexShrink: 0 }} />{item.zona}
              </span>
            </>
          )}
        </nav>

      </div>{/* end max-w wrapper */}

      {/* Body */}
      {tipo === 'alojamiento' ? (
        <AlojamientoDetail
          item={item}
          promos={promos}
          promosLocalidad={promosLocalidad}
          similares={similares}
          loading={loading}
          onOpenOferta={onOpenOferta}
          onOpenLocalidad={onOpenLocalidad}
          session={session}
          onLoginRequired={onLoginRequired}
          onComprarPase={onComprarPase}
          onSuscribirHoteleria={onSuscribirHoteleria}
        />
      ) : (
        <GastroExperienciaDetail item={item} tipo={tipo} promos={promos} promosLocalidad={promosLocalidad} similares={similares} loading={loading} session={session} onOpenOferta={onOpenOferta} onOpenLocalidad={onOpenLocalidad} onLoginRequired={onLoginRequired} onComprarPase={onComprarPase} onSuscribirHoteleria={onSuscribirHoteleria} />
      )}

      {/* Drawer */}
    </div>
  );
}
