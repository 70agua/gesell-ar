// ============================================================
//  src/views/DetailView.jsx — Tailwind + Aire design system
// ============================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import MapView from '../components/MapView';
import {
  X, Send, Gift, Check, Eye, EyeOff, Loader2, Lock,
  Heart, Share2, Zap, MessageCircle, Flag, ChevronRight, ChevronLeft, Home,
  Wifi, Car, Waves, Coffee, ShieldCheck, KeyRound,
  Utensils, Phone, Clock, Globe, MapPin, Ticket,
  Star, Minus, Plus, Sunrise, Users, Bell,
  Dumbbell, Wind, Flame, PawPrint, Baby, Bike, Tv, ChefHat,
  TreePine, Droplets, Sparkles, BedDouble, AirVent,
} from 'lucide-react';
import { CoinSVG } from '../components/Token';
import { supabase }                                    from '../lib/supabase';
import { getPromosDeNegocio, getAlianzasPorNegocio, getPromosLocalidad } from '../lib/datos';
import { guardarConsulta, registrarTurista, loginTurista } from '../lib/auth';
import { useCuponera } from '../lib/cuponera';
import InfoTooltip, { CreditTooltip } from '../components/InfoTooltip';
import { useMostrarCreditos } from '../lib/sesion';
import { busqueda } from '../lib/busqueda';
import DateRangePicker from '../components/DateRangePicker';
import { socialProof } from '../lib/socialProof';
import HeartButton from '../components/HeartButton';
import { esSiguiendo, toggleSeguir } from '../lib/seguir';

const toDateStr = d => d instanceof Date ? d.toISOString().split('T')[0] : '';

// ─── Design tokens (para inline styles puntuales) ───────────
const C = {
  primary:     '#2545E6',
  primarySoft: '#EEF1FF',
  primaryDark: '#1731B8',
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

// ─── Cálculo de créditos: 20%/15%/10% del ahorro, mínimo 1 ─
const PRECIO_CREDITO = 2000; // pesos sin IVA (para el cálculo de cantidad de créditos)
const PRECIO_CREDITO_IVA = 2420; // pesos con IVA incluido (para mostrar precios de cupón)
function calcTokensCosto(ahorroEstimado) {
  if (!ahorroEstimado || ahorroEstimado <= 0) return 1;
  const pct = ahorroEstimado <= 10000 ? 0.20 : ahorroEstimado < 60000 ? 0.15 : 0.10;
  return Math.max(1, Math.ceil((ahorroEstimado * pct) / PRECIO_CREDITO));
}
// Formatea el ahorro para mostrar en UI. ahorroMax presente → rango.
function formatAhorro(estimado, max) {
  if (!estimado || estimado <= 0) return null;
  const fmt = n => '$' + Math.round(n).toLocaleString('es-AR');
  if (max && max > estimado) return `entre ${fmt(estimado)} y ${fmt(max)} aprox.`;
  return `~${fmt(estimado)} aprox.`;
}

// ─── Plan config ────────────────────────────────────────────
const PLAN_CFG = {
  BASE:  { maxFotos: 3,  showPrice: false, showContact: false, mapDetail: 'approx',  label: 'Gratis' },
  PLUS:  { maxFotos: 8,  showPrice: true,  showContact: true,  mapDetail: 'barrio',  label: 'Plus'   },
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

// ═══════════════════════════════════════════════════════════
//  ConsultaDrawer
// ═══════════════════════════════════════════════════════════
function ConsultaDrawer({ item, onClose }) {
  const [step, setStep]     = useState('form');
  const [nombre, setNombre] = useState('');
  const [email, setEmail]   = useState('');
  const [tel, setTel]       = useState('');
  const [msg, setMsg]       = useState('');
  const [pass, setPass]     = useState('');
  const [showP, setShowP]   = useState(false);
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState('');

  async function handleConsulta(e) {
    e.preventDefault(); setError('');
    if (!nombre.trim() || !email.trim() || !msg.trim()) { setError('Completá nombre, email y mensaje.'); return; }
    setLoad(true);
    try {
      await guardarConsulta({ negocioId: item.id, nombre, email, telefono: tel, mensaje: msg });
      setStep('success');
    } catch { setError('No se pudo enviar. Intentá de nuevo.'); }
    finally { setLoad(false); }
  }

  async function handleRegistro(e) {
    e.preventDefault(); setError('');
    if (!pass || pass.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    setLoad(true);
    try {
      await registrarTurista({ nombre, email, password: pass });
      setStep('done');
    } catch (err) {
      if (err.message?.includes('already registered')) {
        try { await loginTurista(email, pass); setStep('done'); }
        catch { setError('Email ya registrado. Revisá tu contraseña.'); }
      } else { setError(err.message || 'Error al registrarse.'); }
    } finally { setLoad(false); }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-[rgba(11,16,32,0.45)] backdrop-blur-sm" />
      <div className="absolute right-0 top-[70px] bottom-0 w-full max-w-[460px] bg-white flex flex-col shadow-2xl rounded-tl-2xl">
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.line}` }}>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest mb-0.5" style={{ color: C.muted }}>{item.type}</div>
            <div className="text-[17px] font-bold" style={{ color: C.ink }}>{item.name}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer" style={{ border: `1px solid ${C.line}`, background: C.bg }}>
            <X size={15} color={C.ink2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 'form' && (
            <form onSubmit={handleConsulta} className="flex flex-col gap-3.5">
              <div>
                <p className="text-xl font-bold tracking-tight mb-1" style={{ color: C.ink }}>Consultar disponibilidad</p>
                <p className="text-[13px]" style={{ color: C.muted }}>Te responden directamente. Sin intermediarios.</p>
              </div>
              <DField label="Nombre *"><DInput value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre completo" /></DField>
              <DField label="Email *"><DInput type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" /></DField>
              <DField label="Teléfono / WhatsApp"><DInput type="tel" value={tel} onChange={e => setTel(e.target.value)} placeholder="+54 9 11 ..." /></DField>
              <DField label="Mensaje *">
                <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="¿Qué fechas te interesan? ¿Cuántas personas?" rows={4}
                  className="w-full px-3.5 py-3 rounded-[10px] text-sm outline-none resize-y"
                  style={{ border: `1px solid ${C.line}`, background: C.bg, color: C.ink }} />
              </DField>
              {error && <DError>{error}</DError>}
              <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white cursor-pointer" style={{ background: C.primary, opacity: loading ? 0.7 : 1 }}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} />}
                {loading ? 'Enviando...' : 'Enviar consulta'}
              </button>
            </form>
          )}

          {step === 'success' && (
            <div className="flex flex-col gap-5">
              <div className="text-center py-3">
                <div className="w-[60px] h-[60px] rounded-full flex items-center justify-center mx-auto mb-3.5" style={{ background: '#E8FFF4' }}>
                  <Check size={28} color={C.green} strokeWidth={2.5} />
                </div>
                <p className="text-xl font-bold mb-1.5" style={{ color: C.ink }}>¡Consulta enviada!</p>
                <p className="text-[13px] leading-relaxed" style={{ color: C.muted }}>
                  <strong>{item.name}</strong> recibió tu mensaje y te contactará pronto a <strong>{email}</strong>.
                </p>
              </div>
              <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg,#EEF1FF 0%,#E8FFF4 100%)', border: `1px solid ${C.line}` }}>
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="w-10 h-10 rounded-[10px] grid place-items-center" style={{ background: C.primary }}>
                    <Gift size={18} color="#fff" />
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: C.ink }}>¡Ganás 2 créditos Cuponear!</div>
                    <div className="text-[11px]" style={{ color: C.muted }}>Valor: $4.840 en descuentos</div>
                  </div>
                </div>
                <p className="text-[13px] leading-relaxed mb-3.5" style={{ color: C.ink2 }}>Registrate en 30 segundos y usá tus créditos en ofertas, salidas y aventura & relax.</p>
                <button onClick={() => setStep('register')} className="w-full py-3 rounded-[10px] font-bold text-[13px] text-white cursor-pointer" style={{ background: C.primary }}>
                  Crear mi cuenta y recibir créditos
                </button>
                <button onClick={onClose} className="w-full bg-transparent border-0 text-xs font-medium mt-2 py-1.5 cursor-pointer" style={{ color: C.muted }}>Ahora no</button>
              </div>
            </div>
          )}

          {step === 'register' && (
            <form onSubmit={handleRegistro} className="flex flex-col gap-3.5">
              <div>
                <p className="text-xl font-bold tracking-tight mb-1" style={{ color: C.ink }}>Crear cuenta</p>
                <p className="text-[13px]" style={{ color: C.muted }}>Con el email <strong>{email}</strong>. Solo falta tu contraseña.</p>
              </div>
              <DField label="Contraseña *">
                <div className="relative">
                  <DInput type={showP ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)} placeholder="Mínimo 6 caracteres" />
                  <button type="button" onClick={() => setShowP(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-0 cursor-pointer" style={{ color: C.muted }}>
                    {showP ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </DField>
              {error && <DError>{error}</DError>}
              <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white cursor-pointer" style={{ background: C.primary, opacity: loading ? 0.7 : 1 }}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Gift size={14} />}
                {loading ? 'Creando cuenta...' : 'Crear cuenta y recibir 2 créditos'}
              </button>
            </form>
          )}

          {step === 'done' && (
            <div className="text-center py-5 flex flex-col items-center gap-3.5">
              <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center" style={{ background: C.primarySoft }}>
                <span className="text-4xl">🎉</span>
              </div>
              <div>
                <p className="text-2xl font-extrabold tracking-tight mb-1.5" style={{ color: C.ink }}>¡Bienvenido/a, {nombre.split(' ')[0]}!</p>
                <p className="text-sm leading-relaxed" style={{ color: C.muted }}>Tus <strong style={{ color: C.primary }}>2 créditos Cuponear</strong> ya están en tu cuenta.</p>
              </div>
              <button onClick={onClose} className="px-7 py-3 rounded-[10px] font-bold text-[13px] text-white cursor-pointer" style={{ background: C.primary }}>
                Ver ofertas y usar créditos
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
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

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ZonaMap ahora usa el componente MapView reutilizable
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

// ═══════════════════════════════════════════════════════════
//  BarrioMap
// ═══════════════════════════════════════════════════════════
function hashPos(id) {
  const n = typeof id === 'string' ? id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : Number(id) || 7;
  return { x: ((n * 37 + 11) % 60) + 18, y: ((n * 53 + 17) % 55) + 18 };
}

function BarrioMap({ item, plan }) {
  const pos    = hashPos(item.id);
  const detail = PLAN_CFG[plan]?.mapDetail || 'barrio';
  const hLines = [22, 38, 54, 70];
  const vLines = [20, 40, 60, 80];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden" style={{ height: 280, border: `1px solid ${C.line}`, background: '#F0EDE4' }}>
      <div className="absolute right-0 top-0 w-[14%] h-full" style={{ background: 'linear-gradient(90deg,#D4E8F5 0%,#B8D9EE 100%)' }} />
      <div className="absolute" style={{ bottom: '-6%', left: '8%', width: '32%', height: '38%', borderRadius: '50%', background: 'rgba(110,160,80,0.22)' }} />
      <svg className="absolute inset-0 w-full h-full">
        {hLines.map(y => <line key={`h${y}`} x1="0" y1={`${y}%`} x2="86%" y2={`${y}%`} stroke="#D9D4C7" strokeWidth="1" />)}
        {vLines.map(x => <line key={`v${x}`} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%" stroke="#D9D4C7" strokeWidth="1" />)}
        <line x1="0" y1="50%" x2="86%" y2="50%" stroke="#C8C2B4" strokeWidth="2.5" />
        <line x1="40%" y1="0" x2="40%" y2="100%" stroke="#C8C2B4" strokeWidth="2.5" />
      </svg>

      {detail !== 'approx' && (
        <div className="absolute inset-0 pointer-events-none">
          <span className="absolute text-[9px] font-semibold uppercase tracking-wider" style={{ top: '47%', left: '2%', color: '#888070' }}>Av. Principal</span>
          <span className="absolute text-[9px] font-semibold uppercase tracking-wider" style={{ top: '2%', left: '37%', color: '#888070', writingMode: 'vertical-rl' }}>Av. del Mar</span>
        </div>
      )}

      {detail === 'approx' && (
        <div className="absolute pointer-events-none" style={{ left: `${pos.x - 14}%`, top: `${pos.y - 14}%`, width: '28%', height: '28%', borderRadius: '50%', background: `radial-gradient(circle,${C.primary}33 0%,transparent 70%)` }} />
      )}

      {/* Pin */}
      <div className="absolute z-[2]" style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%,-100%)' }}>
        <div className="relative flex flex-col items-center">
          <div className="w-8 h-8 rounded-[50%_50%_50%_0] -rotate-45" style={{ background: C.primary, border: '2px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }} />
          <div className="absolute text-white rotate-45" style={{ top: 6, left: 6 }}>
            <MapPin size={13} strokeWidth={2.5} />
          </div>
          <div className="w-2 h-1 rounded-full mt-0.5" style={{ background: 'rgba(0,0,0,0.2)' }} />
        </div>
      </div>

      {/* Tooltip */}
      <div className="absolute z-[3] pointer-events-none" style={{ left: `${pos.x}%`, top: `${pos.y - 8}%`, transform: 'translate(-50%,-100%)' }}>
        <div className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white whitespace-nowrap shadow-lg" style={{ background: C.ink }}>
          {item.name}
        </div>
      </div>

      {/* Badges */}
      <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.92)', color: C.ink2 }}>
        {detail === 'approx' ? 'Zona aproximada' : detail === 'barrio' ? 'Barrio indicativo' : 'Ubicación cercana'}
      </div>
      <div className="absolute bottom-2.5 right-4 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold" style={{ background: 'rgba(255,255,255,0.85)', color: C.primary }}>
        <MapPin size={11} /> {item.localidad || 'Villa Gesell'}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  Gallery — layout fijo: 1 grande izq + 2×2 der (siempre)
// ═══════════════════════════════════════════════════════════
function Gallery({ item, plan }) {
  const cfg      = PLAN_CFG[plan] || PLAN_CFG.PLUS;
  const rawFotos = (item.fotos?.length ? item.fotos : [item.image]).filter(Boolean).slice(0, cfg.maxFotos);
  const [light, setLight] = useState(null);

  // Garantizar exactamente 5 slots: rellena con la principal si faltan
  const main = rawFotos[0] || item.image;
  const slots = [1, 2, 3, 4].map(i => rawFotos[i] || main);
  const extra = rawFotos.length > 5 ? rawFotos.length - 5 : 0;
  // Array completo para el lightbox
  const fotos = rawFotos.length ? rawFotos : [main];

  return (
    <>
      {/* Mosaico fijo: col izq (2fr) span 2 rows + 2 cols der (1fr cada una) */}
      <div
        className="mt-5 relative grid gap-2"
        style={{
          height: 440,
          gridTemplateColumns: '2fr 1fr 1fr',
          gridTemplateRows: '1fr 1fr',
        }}
      >
        {/* Foto principal — ocupa las 2 filas a la izquierda */}
        <div
          className="rounded-2xl overflow-hidden cursor-pointer"
          style={{ gridRow: '1 / span 2' }}
          onClick={() => setLight(0)}
        >
          <img src={main} alt={item.name} className="w-full h-full object-cover" />
        </div>

        {/* 4 thumbs en 2×2 a la derecha */}
        {slots.map((src, i) => {
          const isLast = i === 3 && extra > 0;
          return (
            <div
              key={i}
              className="rounded-xl overflow-hidden relative cursor-pointer"
              onClick={() => setLight(Math.min(i + 1, fotos.length - 1))}
            >
              <img
                src={src}
                alt=""
                className="w-full h-full object-cover"
                style={{ filter: isLast ? 'brightness(0.42)' : 'none' }}
              />
              {isLast && (
                <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm pointer-events-none">
                  +{extra} fotos
                </div>
              )}
            </div>
          );
        })}

        {plan === 'BASE' && (
          <div className="absolute top-3.5 left-3.5 z-[2] flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white backdrop-blur-sm" style={{ background: 'rgba(11,16,32,0.75)' }}>
            <Lock size={10} /> Más fotos disponibles en plan Plus
          </div>
        )}
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

// ─── Amenity chip ─────────────────────────────────────────
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

// ─── Offer card (promos propias en left column) — horizontal ─
function OfferCard({ promo, onAdd, onOpenOferta }) {
  const mostrarCreditos = useMostrarCreditos();
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-row cursor-pointer"
      style={{ border: `1px solid ${C.line}`, minHeight: 110 }}
      onClick={() => onOpenOferta && onOpenOferta(promo)}
    >
      {/* Image — left side fixed width */}
      <div className="relative shrink-0" style={{ width: 160 }}>
        <img src={promo.image || promo.imagen_url} alt={promo.title || promo.titulo}
          className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right,rgba(11,16,32,0.12) 0%,rgba(11,16,32,0.55) 100%)' }} />
        {/* Badge centrado */}
        {promo.badge && (
          <div className="absolute inset-0 flex items-center justify-center text-white font-extrabold leading-none tracking-tight drop-shadow" style={{ fontSize: (promo.badge?.length || 0) > 5 ? 22 : 32 }}>
            {promo.badge}
          </div>
        )}
        {/* Flash label */}
        {promo.offerType === 'Flash' && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: '#EF4444', color: '#fff' }}>
            <Zap size={9} /> Flash
          </div>
        )}
      </div>

      {/* Body — right side */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '12px 14px', gap: 8 }}>
        <div>
          {/* Localidad + proveedor */}
          {promo.negocioLocalidad ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, marginBottom: 3 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgb(107,114,128)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>
              <span style={{ color: 'rgb(107,114,128)', fontWeight: 600 }}>{promo.negocioLocalidad}</span>
              {promo.proveedorNombre && <span style={{ color: C.muted }}> · {promo.proveedorNombre}</span>}
            </div>
          ) : promo.proveedorNombre ? (
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 3 }}>{promo.proveedorNombre}</div>
          ) : null}
          <div style={{ fontSize: 15, fontWeight: 700, color: C.green, lineHeight: 1.3 }}>{promo.title || promo.titulo}</div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onAdd && onAdd(promo); }}
          style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, alignSelf: 'flex-start' }}
          onMouseEnter={e => e.currentTarget.style.background = C.primaryDark}
          onMouseLeave={e => e.currentTarget.style.background = C.primary}
        >
          <Send size={11} /> Solicitar este cupón
        </button>
        {/* Activalo con — debajo del CTA */}
        {(() => { const tc = promo.tokens_costo || calcTokensCosto(promo.ahorroEstimado); return (
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 2 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.muted, lineHeight: '18px' }}>Activalo con</span>
            {mostrarCreditos ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <CoinSVG size={11} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.ink }}>{tc} crédito{tc !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ fontSize: 10, color: C.muted }}>(${(tc * PRECIO_CREDITO_IVA).toLocaleString('es-AR')})</span>
                  <CreditTooltip />
                </div>
              </div>
            ) : (
              <span style={{ fontSize: 12, fontWeight: 800, color: C.ink }}>${(tc * PRECIO_CREDITO_IVA).toLocaleString('es-AR')}</span>
            )}
          </div>
        ); })()}
      </div>
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
];

// ─── Propia offer card (ofertas del propio alojamiento) ──────
// Click solo en área de color y título. Ancho área = 240px.
function PropiaOfferCard({ promo, fotos = [], seed = 0, onAdd, onOpenOferta }) {
  const mostrarCreditos = useMostrarCreditos();
  const [titleHov, setTitleHov] = useState(false);
  const isFlash = promo.offerType === 'Flash';
  const palette = BLOB_PALETTES[seed % BLOB_PALETTES.length];
  const bgFoto = null; // reemplazado por blobs animados
  const goDetail = () => onOpenOferta && onOpenOferta(promo);

  const desc = promo.description || promo.desc ||
    (promo.subtitle ? promo.subtitle.split('·').slice(1).join('·').trim() || promo.subtitle : '') ||
    'Guardalo en tu cuponera y canjealo durante tu estadía.';

  const tc = promo.tokens_costo || calcTokensCosto(promo.ahorroEstimado);
  const precioCreditos = `$${(tc * PRECIO_CREDITO_IVA).toLocaleString('es-AR')}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'row', borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.line}`, minHeight: 190 }}>

      {/* ── Foto de fondo — clickeable ────────────── */}
      <div
        onClick={goDetail}
        style={{
          width: 220, flexShrink: 0, position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '14px 18px 16px',
          cursor: 'pointer', textAlign: 'center',
          background: '#0B1020',
        }}
      >
        {/* Foto real de la promo o del alojamiento */}
        {(promo.image || fotos[0]) && (
          <img
            src={promo.image || fotos[seed % fotos.length] || fotos[0]}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.82 }}
          />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(11,16,32,0.25) 0%, rgba(11,16,32,0.72) 100%)' }} />
        {isFlash && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(180,20,20,0.28)' }} />
        )}
        {/* Contenido — z elevado */}
        {isFlash ? (
          /* Layout Flash: pill → badge → desc → timer, centrado verticalmente */
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '75%', height: '100%', paddingTop: 14, paddingBottom: 14 }}>
            {/* Pill OFERTA FLASH — top, fondo blanco */}
            {/* Pill OFERTA FLASH — top */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fff', borderRadius: 999, padding: '5px 13px 5px 11px' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.ink, letterSpacing: '0.03em' }}>OFERTA</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#cc2e30', fontStyle: 'italic', letterSpacing: '0.04em' }}>FLASH</span>
              <Zap size={12} color={C.yellow} fill={C.yellow} />
            </div>
            {/* Badge + desc + timer — centrado */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' }}>
              <span style={{ fontSize: (promo.badge?.length || 0) > 5 ? 31 : 44, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                {promo.badge}
              </span>
              {promo.badgeDesc && (
                <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.88)', lineHeight: 1.35, textAlign: 'center' }}>
                  {promo.badgeDesc}
                </span>
              )}
              {promo.fechaFinFlash && <FlashTimer fechaFin={promo.fechaFinFlash} />}
            </div>
          </div>
        ) : (
          <>
            {/* Layout normal: label arriba, spacers, badge, spacers */}
            <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', justifyContent: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase' }}>
                CUPÓN DE DESCUENTO
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative', zIndex: 1 }}>
              <span style={{ fontSize: (promo.badge?.length || 0) > 5 ? 31 : 44, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                {promo.badge}
              </span>
              {promo.badgeDesc && (
                <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.88)', lineHeight: 1.35 }}>
                  {promo.badgeDesc}
                </span>
              )}
            </div>
            <div style={{ flex: 1 }} />
          </>
        )}
      </div>

      {/* ── Cuerpo — NO clickeable salvo título ─────────────── */}
      <div style={{ flex: 1, padding: '18px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10 }}>
        <div>
          {/* Título — clickeable con hover notorio */}
          <div
            onClick={goDetail}
            onMouseEnter={() => setTitleHov(true)}
            onMouseLeave={() => setTitleHov(false)}
            style={{ fontSize: 16, fontWeight: 700, color: C.ink, lineHeight: 1.3, marginBottom: 6, cursor: 'pointer', transition: 'color 0.15s' }}
          >
            {promo.title || promo.titulo}
          </div>
          {/* Descripción */}
          <div style={{ fontSize: 13, color: C.ink2, lineHeight: 1.6 }}>
            {desc}
          </div>
          {/* Validez — justo después de la descripción, mismo tamaño */}
          {promo.tarifaValidez && (
            promo.tarifaValidez === 'todas' ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 13, fontWeight: 700, color: C.green }}>
                <Check size={13} strokeWidth={2.5} color={C.green} /> Válido p/todas las tarifas
              </div>
            ) : (
              <div style={{ marginTop: 6, fontSize: 13, fontWeight: 400, color: C.ink2 }}>
                {promo.tarifaValidez === 'comun' ? 'Válido en tarifa común' : 'Válido en tarifa especial'}
              </div>
            )
          )}
        </div>

        {/* Fila inferior: botón grande + compartir */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={e => { e.stopPropagation(); onAdd && onAdd(promo); }}
            style={{ flex: '0 0 80%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, fontSize: 15, fontWeight: 700, color: '#fff', background: C.primary, border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = C.primaryDark}
            onMouseLeave={e => e.currentTarget.style.background = C.primary}
          >
            <Send size={14} /> Solicitar este cupón
          </button>
          <button
            onClick={e => e.stopPropagation()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 13, padding: 0, marginLeft: 'auto' }}
            onMouseEnter={e => e.currentTarget.style.color = C.ink}
            onMouseLeave={e => e.currentTarget.style.color = C.muted}
          >
            <Share2 size={15} /> Compartir
          </button>
        </div>

        {/* Activalo con — debajo del CTA */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.muted, lineHeight: '18px' }}>Activalo con</span>
          {mostrarCreditos ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <CoinSVG size={12} />
                <span style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>{tc} crédito{tc !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ fontSize: 11, color: C.muted }}>({precioCreditos})</span>
                <CreditTooltip />
              </div>
            </div>
          ) : (
            <span style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>{precioCreditos}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Big offer card (ofertas exclusivas section) ─────────
function BigOfferCard({ promo, onAdd, onOpenOferta }) {
  const mostrarCreditos = useMostrarCreditos();
  const provNombre = promo.proveedorNombre || promo.negocios?.nombre || promo.subtitle?.split('·')[0]?.trim() || '';
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col bg-white cursor-pointer"
      style={{ border: `1px solid ${C.line}` }}
      onClick={() => onOpenOferta && onOpenOferta(promo)}
    >
      {/* Foto 4:3 con badge + título en bottom-left */}
      <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', flexShrink: 0 }}>
        <img src={promo.image || promo.imagen_url} alt={promo.title || promo.titulo}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,16,32,0.78) 0%, rgba(11,16,32,0.12) 55%, transparent 100%)' }} />
        {/* Badge + título — abajo izquierda */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 13px 12px' }}>
          {promo.badge && (
            <div style={{ fontSize: (promo.badge?.length || 0) > 5 ? 27 : 36, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{promo.badge}</div>
          )}
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.88)', lineHeight: 1.35, marginTop: 3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{promo.title || promo.titulo}</div>
        </div>
      </div>

      <div style={{ padding: '11px 13px 13px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Proveedor: logo + nombre + localidad */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: '#F7F7F8', border: `1px solid ${C.line}`, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {promo.proveedorImage
              ? <img src={promo.proveedorImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>{(provNombre || '?')[0]}</span>
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, lineHeight: 1.2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{provNombre}</div>
            {promo.negocioLocalidad && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: C.primary, marginTop: 1 }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>
                {promo.negocioLocalidad}
              </div>
            )}
          </div>
        </div>

        {/* Cupón gratis */}
        {(() => { const btc = promo.tokens_costo || calcTokensCosto(promo.ahorroEstimado); return btc === 0 ? (
            <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4.5 4.5L20 6"/></svg>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.green }}>Cupón DE REGALO para vos</span>
            </div>
          ) : null;
        })()}

        <button
          onClick={e => { e.stopPropagation(); onAdd && onAdd(promo); }}
          style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '10px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 0.15s', flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.background = C.primaryDark}
          onMouseLeave={e => e.currentTarget.style.background = C.primary}
        >
          <Send size={13} /> Solicitar este cupón
        </button>

        {/* Activalo con — debajo del CTA */}
        {(() => { const btc = promo.tokens_costo || calcTokensCosto(promo.ahorroEstimado); return btc > 0 ? (
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 2 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: '18px' }}>Activalo con</span>
            {mostrarCreditos ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <CoinSVG size={11} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.ink }}>{btc} crédito{btc !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ fontSize: 10, color: C.muted }}>(${(btc * PRECIO_CREDITO_IVA).toLocaleString('es-AR')})</span>
                  <CreditTooltip />
                </div>
              </div>
            ) : (
              <span style={{ fontSize: 12, fontWeight: 800, color: C.ink }}>${(btc * PRECIO_CREDITO_IVA).toLocaleString('es-AR')}</span>
            )}
          </div>
        ) : null; })()}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  DatePickerField — calendario inline tipo popover
// ═══════════════════════════════════════════════════════════
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAY_NAMES   = ['Lu','Ma','Mi','Ju','Vi','Sá','Do'];

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

// ═══════════════════════════════════════════════════════════
//  GuestsSelectorField — réplica del selector de la home
// ═══════════════════════════════════════════════════════════
function GuestsSelectorField({ adultos, setAdultos, ninos, setNinos, bebes, setBebes, mascotas, setMascotas }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const summary = () => {
    const parts = [`${adultos} adulto${adultos !== 1 ? 's' : ''}`];
    if (ninos > 0) parts.push(`${ninos} niño${ninos !== 1 ? 's' : ''}`);
    if (bebes > 0) parts.push(`${bebes} bebé${bebes !== 1 ? 's' : ''}`);
    if (mascotas) parts.push('+ mascota');
    return parts.join(' · ');
  };

  const Spin = ({ val, onDec, onInc, minVal = 0, maxVal = 16 }) => (
    <div className="flex items-center gap-3">
      <button type="button" onClick={onDec} disabled={val <= minVal}
        className="w-8 h-8 rounded-full flex items-center justify-center border cursor-pointer font-bold text-lg leading-none transition-colors"
        style={{ borderColor: val <= minVal ? C.line : C.ink2, color: val <= minVal ? C.muted : C.ink, background: '#fff' }}>
        −
      </button>
      <span className="w-5 text-center text-[15px] font-semibold" style={{ color: C.ink }}>{val}</span>
      <button type="button" onClick={onInc} disabled={val >= maxVal}
        className="w-8 h-8 rounded-full flex items-center justify-center border cursor-pointer font-bold text-lg leading-none"
        style={{ borderColor: val >= maxVal ? C.line : C.ink2, color: val >= maxVal ? C.muted : C.ink, background: '#fff' }}>
        +
      </button>
    </div>
  );

  const rows = [
    { label: 'Adultos',    sub: null,                  val: adultos, dec: () => setAdultos(v => Math.max(1, v-1)), inc: () => setAdultos(v => Math.min(16, v+1)), min: 1 },
    { label: 'Niños',      sub: '2 – 12 años',         val: ninos,   dec: () => setNinos(v => Math.max(0, v-1)),   inc: () => setNinos(v => Math.min(8, v+1)) },
    { label: 'Bebés',      sub: 'Menores de 2 años',   val: bebes,   dec: () => setBebes(v => Math.max(0, v-1)),   inc: () => setBebes(v => Math.min(4, v+1)) },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full px-3 py-2.5 rounded-xl text-left cursor-pointer transition-colors"
        style={{ border: `1px solid ${open ? C.primary : C.line}`, background: '#fff' }}
      >
        <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: C.muted }}>HUÉSPEDES</div>
        <div className="flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: C.ink }}>
          <Users size={13} color={C.muted} />
          {summary()}
        </div>
      </button>

      {open && (
        <div
          className="absolute bg-white rounded-2xl overflow-hidden"
          style={{ top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 1000, border: `1px solid ${C.line}`, boxShadow: '0 20px 48px -16px rgba(11,16,32,0.22)' }}
        >
          {rows.map((r, i) => (
            <div key={r.label} className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: `1px solid ${C.line}` }}>
              <div>
                <div className="text-[14px] font-semibold" style={{ color: C.ink }}>{r.label}</div>
                {r.sub && <div className="text-[11px]" style={{ color: C.muted }}>{r.sub}</div>}
              </div>
              <Spin val={r.val} onDec={r.dec} onInc={r.inc} minVal={r.min || 0} />
            </div>
          ))}
          {/* Mascotas */}
          <div
            onClick={() => setMascotas && setMascotas(v => !v)}
            className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 17, lineHeight: 1 }}>🐾</span>
              <span className="text-[14px] font-semibold" style={{ color: C.ink }}>Con mascotas</span>
            </div>
            <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${mascotas ? C.primary : C.line}`, background: mascotas ? C.primary : '#fff', display: 'grid', placeItems: 'center', transition: 'all 0.15s' }}>
              {mascotas && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
          </div>
          <div className="px-4 py-3 flex justify-end">
            <button type="button" onClick={() => setOpen(false)}
              className="px-5 py-2 rounded-[10px] text-[13px] font-bold text-white cursor-pointer border-0"
              style={{ background: C.primary }}>
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  BookingCard (sticky right panel)
// ═══════════════════════════════════════════════════════════
const RULES = [
  { icon: '🕑', text: 'Check-in: de 14:00 a 22:00 hs' },
  { icon: '🕙', text: 'Check-out: hasta las 10:00 hs' },
  { icon: '🚭', text: 'Prohibido fumar en interiores y espacios comunes' },
  { icon: '🐾', text: 'No se admiten mascotas sin consulta previa' },
  { icon: '🎉', text: 'No se permiten fiestas ni eventos' },
  { icon: '🔇', text: 'Silencio a partir de las 22:00 hs' },
];

function BookingCard({ item, plan, cfg, promos, alianzas, onOpenDrawer }) {
  const totalCupones = promos.length + alianzas.length;

  // Tariff tabs — labels configurables por el socio
  const hasTarifaComun     = item.precioMin > 0;
  const hasTarifaEspecial  = item.precioMinEspecial > 0;
  const hasTarifaPack      = item.packPrecio > 0 && item.packNoches;
  const tarifaTabs = [
    hasTarifaComun    && { id: 'comun',    label: item.tarifaComunLabel    || 'Tarifa común' },
    hasTarifaEspecial && { id: 'especial', label: item.tarifaEspecialLabel || 'Tarifa especial' },
    hasTarifaPack     && { id: 'pack',     label: item.tarifaPackLabel     || (item.packAclaracion ? item.packAclaracion : `Pack ${item.packNoches} noches`) },
  ].filter(Boolean);
  const [tarifaTab, setTarifaTab] = useState('comun');

  // Dates
  const [checkin,  setCheckin]  = useState(null);
  const [checkout, setCheckout] = useState(null);
  const checkoutMin = checkin ? new Date(checkin.getTime() + 86_400_000) : new Date();

  // Guests
  const [adultos,  setAdultos]  = useState(2);
  const [ninos,    setNinos]    = useState(0);
  const [bebes,    setBebes]    = useState(0);
  const [mascotas, setMascotas] = useState(false);


  return (
    <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: '#fff', border: `1px solid ${C.line}`, boxShadow: '0 20px 60px -30px rgba(11,16,32,0.18)' }}>


      {/* ── 1. TARIFAS — siempre primero ─────────────────────── */}
      {cfg.showPrice && hasTarifaComun && (
        <div style={{ margin: '-20px -20px 0' }}>
          {/* Tabs con wrap — se acomodan en múltiples filas si son muchas */}
          <div style={{ borderBottom: `1px solid ${C.line}`, borderRadius: '14px 14px 0 0', overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {tarifaTabs.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => setTarifaTab(t.id)}
                  style={{
                    flex: tarifaTabs.length <= 3 ? 1 : '0 0 auto',
                    padding: '12px 16px',
                    fontSize: 13, whiteSpace: 'nowrap', textAlign: 'center',
                    fontWeight: tarifaTab === t.id ? 700 : 400,
                    cursor: 'pointer', background: 'transparent',
                    color: tarifaTab === t.id ? C.ink : C.muted,
                    border: 'none',
                    borderRight: `1px solid ${C.line}`,
                    borderBottom: tarifaTab === t.id ? `2.5px solid ${C.ink}` : '2.5px solid transparent',
                    marginBottom: '-1px',
                  }}
                >{t.label}</button>
              ))}
            </div>
          </div>
          {/* Precio del tab activo */}
          <div style={{ padding: '14px 20px' }}>
            {tarifaTab === 'comun' && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 12, color: C.muted }}>Desde</span>
                <span style={{ fontSize: 26, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em' }}>${item.precioMin.toLocaleString('es-AR')}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.ink2 }}>{item.unidadPrecio === 'huesped' ? 'por huésped' : 'por noche'}</span>
              </div>
            )}
            {tarifaTab === 'especial' && hasTarifaEspecial && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 12, color: C.muted }}>Desde</span>
                <span style={{ fontSize: 26, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em' }}>${item.precioMinEspecial.toLocaleString('es-AR')}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.ink2 }}>{item.unidadPrecio === 'huesped' ? 'por huésped' : 'por noche'}</span>
              </div>
            )}
            {tarifaTab === 'pack' && hasTarifaPack && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 12, color: C.muted }}>Desde</span>
                <span style={{ fontSize: 26, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em' }}>${item.packPrecio.toLocaleString('es-AR')}</span>
                <span style={{ fontSize: 13, color: C.muted }}>el pack</span>
              </div>
            )}
            <p style={{ fontSize: 11, color: C.muted, margin: '10px 0 0', lineHeight: 1.45 }}>
              <b>Importante:</b> Esta plataforma no alquila alojamientos. Los precios son referenciales y orientativos.
            </p>
          </div>
        </div>
      )}

      {cfg.showPrice && !cfg.showContact && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl" style={{ background: C.bg, border: `1px dashed ${C.line}` }}>
          <Lock size={14} color={C.muted} />
          <span className="text-sm font-medium" style={{ color: C.muted }}>Precio visible en plan Plus</span>
        </div>
      )}

      {/* ── 2. CONSULTA — debajo de tarifas ──────────────────── */}
      {cfg.showContact ? (
        <div className="flex flex-col gap-2">

          {/* Separador + encabezado */}
          <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 16, marginTop: hasTarifaComun ? 4 : 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, lineHeight: 1.2 }}>Consultá por fechas específicas:</div>
          </div>

          {/* Dates */}
          {cfg.showPrice && (
            <div className="grid grid-cols-2 gap-2">
              <DatePickerField
                label="INGRESO"
                value={checkin}
                onChange={d => { setCheckin(d); if (checkout && checkout <= d) setCheckout(null); }}
                minDate={new Date()}
              />
              <DatePickerField
                label="SALIDA"
                value={checkout}
                onChange={setCheckout}
                minDate={checkoutMin}
              />
            </div>
          )}

          {/* Guests */}
          {cfg.showPrice && (
            <div style={{ marginBottom: 10 }}>
              <GuestsSelectorField
                adultos={adultos}   setAdultos={setAdultos}
                ninos={ninos}       setNinos={setNinos}
                bebes={bebes}       setBebes={setBebes}
                mascotas={mascotas} setMascotas={setMascotas}
              />
            </div>
          )}

          {/* Botón principal */}
          <button
            onClick={onOpenDrawer}
            className="w-full py-3.5 rounded-2xl font-bold text-[15px] text-white cursor-pointer border-0 transition-colors"
            style={{ background: C.ink, boxShadow: '0 8px 24px rgba(11,16,32,0.28)' }}
            onMouseEnter={e => e.currentTarget.style.background = '#1a2035'}
            onMouseLeave={e => e.currentTarget.style.background = C.ink}
          >
            Pedir un presupuesto
          </button>

          {/* Reglas del alojamiento */}
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.line}`, marginTop: 30 }}>
            <div className="px-4 py-3" style={{ background: C.bg, borderBottom: `1px solid ${C.line}` }}>
              <span className="text-[13px] font-semibold" style={{ color: C.ink }}>Reglas del alojamiento</span>
            </div>
            <div className="px-4 py-3 flex flex-col gap-2.5">
              {RULES.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-[12px]" style={{ color: C.ink2 }}>
                  <span className="text-[14px] leading-none mt-0.5">{r.icon}</span>
                  {r.text}
                </div>
              ))}
            </div>
          </div>

          <button
            className="w-full py-3 rounded-2xl font-semibold text-[14px] cursor-pointer flex items-center justify-center gap-2 transition-colors"
            style={{ border: `1px solid ${C.line}`, background: '#fff', color: C.ink2 }}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.primary}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.line}
          >
            <MessageCircle size={15} /> Hacer otras consultas
          </button>
        </div>
      ) : (
        <div className="rounded-2xl p-4 text-center" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
          <Lock size={18} color={C.muted} className="mx-auto mb-2" />
          <div className="text-[13px] font-bold mb-1" style={{ color: C.ink }}>Solo socios Plus</div>
          <div className="text-[12px] leading-relaxed mb-3" style={{ color: C.muted }}>
            Los usuarios solo pueden contactar alojamientos con plan Plus.
          </div>
          <button className="w-full py-2.5 rounded-[10px] text-[13px] font-bold text-white cursor-pointer border-0" style={{ background: C.primary }}>
            Conocé los planes
          </button>
        </div>
      )}

      {/* Cupones */}
      {totalCupones > 0 && (
        <div className="px-3.5 py-3 rounded-xl" style={{ background: C.primarySoft }}>
          <div className="flex items-center gap-1.5 text-[12px] font-bold mb-1" style={{ color: C.primary }}>
            <Zap size={12} /> {totalCupones} cupón{totalCupones !== 1 ? 'es' : ''} disponible{totalCupones !== 1 ? 's' : ''}
          </div>
          <div className="text-[12px] leading-snug" style={{ color: C.ink2 }}>
            Reservando en este alojamiento accedés a cupones exclusivos para canjear en salidas y aventura & relax locales.
          </div>
        </div>
      )}

      {/* Denunciar */}
      <div className="text-center pt-1">
        <button className="bg-transparent border-0 cursor-pointer text-[12px] flex items-center gap-1 mx-auto" style={{ color: C.muted }}>
          <Flag size={11} /> Denunciar un problema
        </button>
      </div>
    </div>
  );
}

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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 148px', gap: 8, height: 400, marginTop: 20 }}>
        {/* Foto principal */}
        <div className="rounded-2xl overflow-hidden cursor-pointer" onClick={() => setLight(0)}>
          <img src={main} alt={item.name} className="w-full h-full object-cover" />
        </div>

        {/* Columna 3 thumbs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {thumbs.map((src, i) => {
            const isLast = i === 2 && extra > 0;
            return (
              <div
                key={i}
                className="rounded-xl overflow-hidden relative cursor-pointer"
                style={{ flex: 1 }}
                onClick={() => setLight(Math.min(i + 1, fotos.length - 1))}
              >
                <img
                  src={src} alt=""
                  className="w-full h-full object-cover"
                  style={{ filter: isLast ? 'brightness(0.42)' : 'none' }}
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
//  CuponeraItem — mini-ficha para columna derecha
// ═══════════════════════════════════════════════════════════
function CuponeraItem({ promo, onOpenOferta }) {
  const mostrarCreditos = useMostrarCreditos();
  const tokens = promo.tokens_costo || calcTokensCosto(promo.ahorroEstimado);
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
            <span style={{ fontSize: 10, color: C.muted }}>(${(tokens * 2420).toLocaleString('es-AR')})</span>
          </div>
        ) : (
          <div style={{ marginTop: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: C.ink }}>${(tokens * 2420).toLocaleString('es-AR')}</span>
          </div>
        )}
      </div>
      <HeartButton id={promo.id} size={28} light />
      <ChevronRight size={14} color={C.muted} style={{ flexShrink: 0 }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  SolicitudModal — modal de confirmación de reserva
// ═══════════════════════════════════════════════════════════
function SolicitudModal({ promo, negocio, session, onClose, onConfirmado }) {
  const _b = busqueda.get();
  const [fechas,    setFechas]    = useState(() => ({ desde: _b.desde, hasta: _b.hasta }));
  const [huespedes, setHuespedes] = useState(2);
  const [enviando,  setEnviando]  = useState(false);
  const [exito,     setExito]     = useState(false);
  const [error,     setError]     = useState('');

  const tc = promo.tokens_costo || calcTokensCosto(promo.ahorroEstimado);

  async function confirmar() {
    const checkin  = toDateStr(fechas.desde);
    const checkout = toDateStr(fechas.hasta);
    if (!checkin || !checkout) { setError('Elegí las fechas de entrada y salida.'); return; }
    if (new Date(checkout) <= new Date(checkin)) { setError('La salida debe ser posterior a la entrada.'); return; }
    setError(''); setEnviando(true);
    try {
      let { data: cuponera } = await supabase
        .from('cuponeras')
        .select('id')
        .eq('usuario_id', session.user.id)
        .maybeSingle();
      if (!cuponera) {
        const { data: nueva } = await supabase
          .from('cuponeras')
          .insert({ usuario_id: session.user.id })
          .select('id')
          .single();
        cuponera = nueva;
      }

      const { error: insertErr } = await supabase.from('cuponera_items').insert({
        cuponera_id:      cuponera?.id,
        promocion_id:     promo.id,
        negocio_id:       negocio?.id || promo.negocioId || null,
        estado_solicitud: 'pendiente_confirmacion',
        fecha_checkin:    toDateStr(fechas.desde),
        fecha_checkout:   toDateStr(fechas.hasta),
        num_huespedes:    huespedes,
        vence_en:         new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      });

      if (insertErr) throw insertErr;
      setExito(true);
      onConfirmado?.();
    } catch (e) {
      setError('Hubo un problema al enviar la solicitud. Intentá de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  const inputStyle = { width: '100%', padding: '10px 12px', border: `1px solid ${C.line}`, borderRadius: 10, fontSize: 14, fontWeight: 500, color: C.ink, background: '#fff', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(11,16,32,0.55)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480, boxShadow: '0 32px 80px -16px rgba(11,16,32,0.32)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>Solicitud de reserva</p>
            <p style={{ fontSize: 17, fontWeight: 800, color: C.ink, margin: '3px 0 0' }}>{promo.title}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }}><X size={20} /></button>
        </div>

        {exito ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#EDFAF4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Check size={28} color="#10A36B" strokeWidth={2.5} />
            </div>
            <p style={{ fontSize: 18, fontWeight: 800, color: C.ink, margin: '0 0 8px' }}>¡Solicitud enviada!</p>
            <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.5, margin: '0 0 24px' }}>
              Te avisamos en cuanto el alojamiento confirme (máx. 48hs). Podés ver el estado en tu cuponera.
            </p>
            <button onClick={onClose} style={{ padding: '10px 28px', borderRadius: 12, background: C.primary, color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Cerrar
            </button>
          </div>
        ) : (
          <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Resumen oferta */}
            <div style={{ background: C.bg, borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 11, color: C.muted, margin: 0, fontWeight: 600 }}>Ahorrás</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: '#10A36B', margin: '2px 0 0' }}>{formatAhorro(promo.ahorroEstimado, promo.ahorroMax)}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 11, color: C.muted, margin: 0, fontWeight: 600 }}>Créditos</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <p style={{ fontSize: 16, fontWeight: 800, color: C.ink, margin: 0 }}>{tc} crédito{tc !== 1 ? 's' : ''}</p>
                  <CreditTooltip />
                </div>
                <p style={{ fontSize: 11, color: C.muted, margin: '2px 0 0' }}>(${(tc * 2420).toLocaleString('es-AR')})</p>
              </div>
            </div>

            {/* Fechas */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fechas de estadía</label>
              <DateRangePicker value={fechas} onChange={setFechas} variant="field" />
            </div>

            {/* Huéspedes */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Huéspedes</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: `1px solid ${C.line}`, borderRadius: 10, padding: '8px 14px', width: 'fit-content' }}>
                <button onClick={() => setHuespedes(h => Math.max(1, h - 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.ink, display: 'flex', alignItems: 'center', padding: 0 }}><Minus size={16} /></button>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.ink, minWidth: 20, textAlign: 'center' }}>{huespedes}</span>
                <button onClick={() => setHuespedes(h => Math.min(20, h + 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.ink, display: 'flex', alignItems: 'center', padding: 0 }}><Plus size={16} /></button>
              </div>
            </div>

            {/* Disclaimer — una sola vez, tono de continuidad */}
            <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, margin: 0, padding: '10px 12px', background: C.bg, borderRadius: 10 }}>
              Pagás con créditos de tu cuenta Cuponear. Los créditos no son reembolsables en dinero, pero si el alojamiento no puede confirmar tus fechas, tu saldo queda disponible para usar en cualquier otro alojamiento o beneficio.
            </p>

            {error && <p style={{ fontSize: 13, color: '#EF4444', margin: 0, fontWeight: 600 }}>{error}</p>}

            <button
              onClick={confirmar}
              disabled={enviando}
              style={{ padding: '13px 0', borderRadius: 12, background: C.primary, color: '#fff', border: 'none', fontSize: 15, fontWeight: 800, cursor: enviando ? 'default' : 'pointer', opacity: enviando ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {enviando ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} />}
              {enviando ? 'Enviando...' : 'Confirmar y pagar con créditos'}
            </button>

            <p style={{ fontSize: 11, color: C.muted, textAlign: 'center', margin: 0 }}>
              Esta es una solicitud. El alojamiento confirma disponibilidad en menos de 48hs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  OfertasPropiasCard — ofertas del alojamiento con paginador
// ═══════════════════════════════════════════════════════════
function OfertasPropiasCard({ promos, item, session, onOpenOferta, onSolicitar }) {
  const mostrarCreditos = useMostrarCreditos();
  const _b = busqueda.get();
  const [idx, setIdx]           = useState(0);
  const [fechas, setFechas]     = useState(() => ({ desde: _b.desde, hasta: _b.hasta }));
  const [adultos,  setAdultos]  = useState(2);
  const [ninos,    setNinos]    = useState(0);
  const [bebes,    setBebes]    = useState(0);
  const [mascotas, setMascotas] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito]       = useState(false);
  const [formError, setFormError] = useState('');
  const touchStartX = useRef(null);
  if (!promos.length) return null;

  // Hasta 5 ofertas ACTIVAS visibles (puede tener ilimitadas publicadas)
  const activos = promos.slice(0, 5);
  const safeIdx = Math.min(idx, activos.length - 1);
  const p       = activos[safeIdx];
  const total   = activos.length;
  const isFlash = p.offerType === 'Flash';
  const creditos = calcTokensCosto(p.ahorroEstimado);

  const prev = () => setIdx(i => (i - 1 + total) % total);
  const next = () => setIdx(i => (i + 1) % total);
  const onTouchStart = e => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = e => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
    touchStartX.current = null;
  };

  const handleSolicitar = async () => {
    setFormError('');
    if (!session) { onSolicitar?.(p); return; }
    if (!fechas.desde) { setFormError('Elegí la fecha de entrada'); return; }
    if (!fechas.hasta) { setFormError('Elegí la fecha de salida');  return; }
    setEnviando(true);
    try {
      let { data: cup } = await supabase.from('cuponeras').select('id').eq('usuario_id', session.user.id).maybeSingle();
      if (!cup) {
        const { data: nc } = await supabase.from('cuponeras').insert({ usuario_id: session.user.id }).select('id').single();
        cup = nc;
      }
      const venceEn = new Date(Date.now() + 48 * 3600000).toISOString();
      const { error } = await supabase.from('cuponera_items').insert({
        cuponera_id: cup.id, promocion_id: p.id, negocio_id: item?.id || p.negocioId || null,
        estado_solicitud: 'pendiente_confirmacion',
        fecha_checkin: toDateStr(fechas.desde), fecha_checkout: toDateStr(fechas.hasta),
        num_huespedes: adultos + ninos + bebes, vence_en: venceEn,
      });
      if (error) throw error;
      setExito(true);
    } catch {
      setFormError('Error al enviar. Intentá de nuevo.');
    }
    setEnviando(false);
  };

  const inputS = {
    width: '100%', padding: '7px 10px', border: `1px solid ${C.line}`,
    borderRadius: 8, fontSize: 13, color: C.ink, background: '#fff',
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 20, boxShadow: '0 20px 60px -30px rgba(11,16,32,0.15)', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 18px 0' }}>
        <img src="/ico-disc.svg" style={{ width: 32, height: 42, objectFit: 'contain' }} alt="" />
        <span style={{ fontSize: 18, fontWeight: 800, color: C.ink, flex: 1 }}>Promociones</span>
      </div>

      {/* Botonera de promos — los badges del socio (hasta 5 activas) */}
      {total > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '12px 18px 0' }}>
          {activos.map((promo, i) => {
            const on = i === safeIdx;
            return (
              <button
                key={promo.id ?? i}
                onClick={() => setIdx(i)}
                title={promo.title || promo.titulo}
                style={{
                  border: `1.5px solid ${on ? C.primary : C.line}`,
                  background: on ? C.primary : '#fff',
                  color: on ? '#fff' : C.ink2,
                  borderRadius: 999, padding: '6px 13px', fontSize: 12, fontWeight: 800,
                  cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
                  letterSpacing: '-0.01em',
                }}
              >
                {promo.badge || promo.title || promo.titulo}
              </button>
            );
          })}
        </div>
      )}

      {/* Imagen */}
      <div
        onClick={() => onOpenOferta?.(p)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ position: 'relative', height: 150, cursor: 'pointer', overflow: 'hidden', marginTop: 12, background: '#1a2a35' }}
      >
        {(p.image || p.imagen_url) && (
          <img src={p.image || p.imagen_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)' }} />
        <div style={{ position: 'absolute', top: 10, right: 12 }} onClick={e => e.stopPropagation()}>
          <HeartButton id={p.id} size={30} />
        </div>
        {isFlash && (
          <div style={{ position: 'absolute', top: 10, left: 14, display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff', borderRadius: 999, padding: '3px 8px 3px 6px' }}>
            <Zap size={10} color="#f5c842" fill="#f5c842" />
            <span style={{ fontSize: 10, fontWeight: 700, color: C.ink }}>OFERTA</span>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#e02020', fontStyle: 'italic' }}>FLASH</span>
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 12, left: 14, right: 46 }}>
          {p.badge && <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 3, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>{p.badge}</div>}
          <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.95)', lineHeight: 1.3, textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>{p.title || p.titulo}</div>
        </div>
      </div>


      {/* Contenido */}
      <div style={{ padding: '14px 16px' }}>
        {exito ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#EDFAF4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <Check size={22} color={C.green} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: '0 0 4px' }}>¡Solicitud enviada!</p>
            <p style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.4 }}>El alojamiento tiene 48hs para confirmar.</p>
          </div>
        ) : (
          <>
            {/* Form de fechas */}
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fechas de estadía</label>
              <DateRangePicker value={fechas} onChange={f => { setFechas(f); setFormError(''); }} variant="field" />
            </div>
            <div style={{ marginBottom: 10 }}>
              <GuestsSelectorField
                adultos={adultos}   setAdultos={setAdultos}
                ninos={ninos}       setNinos={setNinos}
                bebes={bebes}       setBebes={setBebes}
                mascotas={mascotas} setMascotas={setMascotas}
              />
            </div>

            {/* Disclaimer */}
            <div style={{ padding: '10px 12px', background: '#F7F7F8', borderRadius: 8, marginBottom: 12 }}>
              <p style={{ fontSize: 13, color: C.ink2, margin: 0, lineHeight: 1.55 }}>
                Esta oferta requiere una confirmación de la fecha por parte de la empresa que lo publicó. Lo que pagues ahora se te reintegra al instante si no es aceptada.
              </p>
            </div>

            {formError && <p style={{ fontSize: 11, color: '#EF4444', margin: '0 0 8px', textAlign: 'center' }}>{formError}</p>}

            <button
              onClick={handleSolicitar}
              disabled={enviando}
              style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: enviando ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: enviando ? C.muted : C.primary, transition: 'background 0.2s' }}
            >
              {enviando ? 'Enviando...' : <><Send size={13} /> Solicitar este cupón</>}
            </button>

            {/* Activalo con — debajo del CTA, una sola fila centrada */}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', flexWrap: 'wrap', gap: 5, marginTop: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Activalo con</span>
              {mostrarCreditos ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                    <CoinSVG size={12} />
                    <span style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>{creditos} crédito{creditos !== 1 ? 's' : ''}</span>
                  </div>
                  <span style={{ fontSize: 11, color: C.muted }}>${(creditos * PRECIO_CREDITO_IVA).toLocaleString('es-AR')}</span>
                  <CreditTooltip />
                </>
              ) : (
                <span style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>${(creditos * PRECIO_CREDITO_IVA).toLocaleString('es-AR')}</span>
              )}
            </div>
          </>
        )}

        {total > 1 && !exito && (
          <div style={{ marginTop: 8, textAlign: 'right' }}>
            <span style={{ fontSize: 11, color: C.muted }}>{idx + 1} / {total}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  MiCuponeraPanel — columna derecha: ítems ya en la cuponera
// ═══════════════════════════════════════════════════════════
function MiCuponeraPanel() {
  const { cupones, removeCupon } = useCuponera();
  if (cupones.length === 0) return null;
  return (
    <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 20, padding: '16px 20px', boxShadow: '0 4px 24px -8px rgba(11,16,32,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <img src="/ico-disc.svg" style={{ width: 22, height: 22 }} alt="" />
        <span style={{ fontSize: 16, fontWeight: 800, color: C.ink, flex: 1 }}>Tu cuponera</span>
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
//  CuponeraCard — columna derecha sticky (alianzas)
// ═══════════════════════════════════════════════════════════
function CuponeraCard({ alianzas, onOpenOferta, cuponeraSectionRef }) {
  const mostrarCreditos = useMostrarCreditos();
  const items = alianzas.map(al => {

    if (al.promociones) {
      const p = al.promociones;
      return { ...p, title: p.titulo, image: p.imagen_url, badge: p.badge, proveedorNombre: p.negocios?.nombre };
    }
    if (al.promo) return { ...al.promo };
    return null;
  }).filter(Boolean).slice(0, 3);

  const total = alianzas.length;
  // Total de créditos a mitad de precio para todos los items visibles
  const totalTokensMitad = items.reduce((acc, p) => {
    const t = p.tokens_costo || calcTokensCosto(p.ahorroEstimado);
    return acc + Math.max(1, Math.floor(t / 2));
  }, 0);
  const totalTokensNormal = items.reduce((acc, p) => {
    return acc + (p.tokens_costo || calcTokensCosto(p.ahorroEstimado));
  }, 0);

  return (
    <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 20, padding: 20, boxShadow: '0 20px 60px -30px rgba(11,16,32,0.15)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <img src="/ico-disc.svg" style={{ width: 22, height: 22 }} alt="" />
        <span style={{ fontSize: 16, fontWeight: 800, color: C.ink }}>¡Sumá estos beneficios!</span>
      </div>
      <p style={{ fontSize: 12, color: C.muted, margin: '0 0 14px', lineHeight: 1.4 }}>
        Alojándote acá accedés a estos beneficios:
      </p>

      {total === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: C.muted, fontSize: 13 }}>
          Próximamente...
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((p, i) => (
              <CuponeraItem key={p.id || i} promo={p} onOpenOferta={onOpenOferta} />
            ))}
          </div>

          {/* AHORRÁS + ACTIVALO CON con tachado diagonal */}
          {items.length > 0 && (() => {
            const totalMin = items.reduce((acc, p) => acc + (p.ahorro_estimado || p.ahorroEstimado || 0), 0);
            const totalMax = items.reduce((acc, p) => acc + (p.ahorro_max || p.ahorroMax || p.ahorro_estimado || p.ahorroEstimado || 0), 0);
            const ahorroLabel = totalMin > 0 ? formatAhorro(totalMin, totalMax > totalMin ? totalMax : null) : null;
            return (
              <div style={{ marginTop: 14, marginBottom: 8, padding: '8px 12px', background: C.bg, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {ahorroLabel && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>AHORRÁS</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>{ahorroLabel}<InfoTooltip /></span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>ACTIVALO CON</span>
                  {mostrarCreditos ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                        {/* Número tachado diagonal: número negro, línea roja */}
                        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                          <CoinSVG size={12} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{totalTokensNormal}</span>
                          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 100 100" preserveAspectRatio="none">
                            <line x1="5" y1="95" x2="95" y2="5" stroke="#cc2020" strokeWidth="9" strokeLinecap="round" />
                          </svg>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <CoinSVG size={12} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{totalTokensMitad} crédito{totalTokensMitad !== 1 ? 's' : ''}</span>
                          <CreditTooltip />
                        </div>
                      </div>
                      <span style={{ fontSize: 10, color: C.muted }}>(${(totalTokensMitad * PRECIO_CREDITO_IVA).toLocaleString('es-AR')})</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {/* Precio normal tachado en pesos */}
                      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>${(totalTokensNormal * PRECIO_CREDITO_IVA).toLocaleString('es-AR')}</span>
                        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 100 100" preserveAspectRatio="none">
                          <line x1="5" y1="95" x2="95" y2="5" stroke="#cc2020" strokeWidth="9" strokeLinecap="round" />
                        </svg>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>${(totalTokensMitad * PRECIO_CREDITO_IVA).toLocaleString('es-AR')}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
          <button
            onClick={() => cuponeraSectionRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              width: '100%', padding: '10px',
              background: C.primary, border: 'none',
              borderRadius: 10, cursor: 'pointer', color: '#fff',
              fontSize: 13, fontWeight: 700,
            }}
          >
            <Ticket size={14} />
            Agregar {total} cupón{total !== 1 ? 'es' : ''} al 50%
          </button>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  MiniPromoCard — minificha para fila horizontal
// ═══════════════════════════════════════════════════════════
function MiniPromoCard({ promo: p, onAdd, onOpenOferta }) {
  const { addCupon } = useCuponera();
  const mostrarCreditos = useMostrarCreditos();
  return (
    <div
      style={{ width: 264, background: '#fff', border: `1px solid ${C.line}`, borderRadius: 18, overflow: 'hidden', flexShrink: 0, display: 'flex', flexDirection: 'column', cursor: 'pointer', boxShadow: '0 2px 12px -4px rgba(11,16,32,0.08)' }}
      onClick={() => onOpenOferta?.(p)}
    >
      {/* Imagen */}
      <div style={{ position: 'relative', height: 148, background: '#1a2a35', flexShrink: 0 }}>
        {(p.image || p.imagen_url) && (
          <img src={p.image || p.imagen_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.68) 0%, transparent 58%)' }} />
        <div style={{ position: 'absolute', top: 10, right: 10 }} onClick={e => e.stopPropagation()}>
          <HeartButton id={p.id} size={30} />
        </div>
        {p.badge && (
          <div style={{ position: 'absolute', bottom: 10, left: 13, fontSize: 34, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>{p.badge}</div>
        )}
      </div>
      {/* Body */}
      <div style={{ padding: '10px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: C.ink, margin: 0, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.title || p.titulo}</p>
        <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>{p.proveedorNombre}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 5, paddingTop: 5, borderTop: `1px solid ${C.line}` }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Activalo con</span>
          {mostrarCreditos ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <CoinSVG size={12} />
                <span style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>{calcTokensCosto(p.ahorroEstimado || p.ahorro_estimado || 0)} crédito{calcTokensCosto(p.ahorroEstimado || p.ahorro_estimado || 0) !== 1 ? 's' : ''}</span>
                <CreditTooltip />
              </div>
              <span style={{ fontSize: 10, color: C.muted }}>(${(calcTokensCosto(p.ahorroEstimado || p.ahorro_estimado || 0) * 2420).toLocaleString('es-AR')})</span>
            </div>
          ) : (
            <span style={{ fontSize: 12, fontWeight: 800, color: C.ink }}>${(calcTokensCosto(p.ahorroEstimado || p.ahorro_estimado || 0) * 2420).toLocaleString('es-AR')}</span>
          )}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 10 }}>
          <button
            onClick={e => { e.stopPropagation(); onOpenOferta ? onOpenOferta(p) : (onAdd ? onAdd(p) : addCupon(p)); }}
            style={{ width: '100%', padding: '8px 0', borderRadius: 9, border: `1px solid ${C.line}`, background: '#fff', color: C.ink, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'border-color .13s, color .13s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.color = C.ink; }}
          >
            Ver oferta
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  AlojamientoDetail (main two-col + sections below)
// ═══════════════════════════════════════════════════════════
function AlojamientoDetail({ item, promos, alianzas, promosLocalidad = [], loading, onOpenDrawer, onOpenOferta, onOpenLocalidad, session, onLoginRequired }) {
  const plan = item.plan || 'PLUS';
  const cfg  = PLAN_CFG[plan];
  const { addCupon } = useCuponera();
  const cuponeraSectionRef = useRef(null);
  const [solicitudPromo, setSolicitudPromo] = useState(null);

  const tags = item.tags?.length
    ? item.tags
    : ['A 80m del mar', 'Piscina climatizada', 'Spa y circuito termal', 'Desayuno buffet incluido', 'Check-in 24hs', 'Cancelación flexible'];

  function normPromo(p) {
    return { ...p, title: p.title || p.titulo || '', image: p.image || p.imagen_url || '' };
  }
  function normAlianza(al) {
    if (al.promociones) {
      const p = al.promociones;
      return {
        ...p,
        title: p.titulo || '',
        image: p.imagen_url || '',
        badge: p.badge || '',
        proveedorNombre: p.negocios?.nombre || '',
        negocioLocalidad: p.negocios?.localidad || '',
        ahorroEstimado: p.ahorro_estimado || 0,
        ahorroMax: p.ahorro_max || null,
        tokens_costo: p.tokens_costo,
      };
    }
    if (al.promo) return { ...al.promo };
    return null;
  }
  const alianzasNorm = alianzas.map(normAlianza).filter(Boolean);

  return (
    <>
      <div className="max-w-[1328px] mx-auto px-10">

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
        <div className="grid gap-12 items-start py-6" style={{ gridTemplateColumns: '1.65fr 1fr' }}>

          {/* LEFT */}
          <div>
            <AlojamientoGallery item={item} plan={plan} />

            <div style={{ marginTop: 36 }}>
              <h2 className="text-lg font-bold mb-2.5" style={{ color: C.ink }}>Sobre el lugar</h2>
              <p className="text-[15px] leading-relaxed" style={{ color: C.ink2, lineHeight: 1.65 }}>
                {item.description || item.desc || 'Disfrutá del mar y la naturaleza en este increíble lugar de la Costa Atlántica. Un espacio diseñado para el descanso, con todos los servicios que necesitás para una estadía perfecta.'}
              </p>

              <h2 className="text-lg font-bold mt-8 mb-3" style={{ color: C.ink }}>¿Qué destaca este alojamiento?</h2>
              <div className="grid grid-cols-2 gap-2.5">
                {tags.slice(0, plan === 'BASE' ? 2 : 6).map(tag => (
                  <AmenityChip key={tag} tag={tag} />
                ))}
                {plan === 'BASE' && (
                  <div className="col-span-2 flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-medium" style={{ background: '#FFFBEB', border: '1px dashed #FDE68A', color: '#92400E' }}>
                    <Lock size={13} /> Más amenities visibles en plan Plus
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* RIGHT — sticky desde arriba */}
          <div style={{ position: 'sticky', top: 84, display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
            <OfertasPropiasCard
              promos={promos.map(p => ({ ...p, title: p.title || p.titulo, image: p.image || p.imagen_url }))}
              item={item}
              session={session}
              onOpenOferta={onOpenOferta}
              onSolicitar={p => setSolicitudPromo(p)}
            />
            <MiCuponeraPanel />
          </div>
        </div>
      </div>

      {/* ── Más cupones ───────────────────────────────────────── */}
      {!loading && (alianzasNorm.length > 0 || promosLocalidad.length > 0) && (() => {
        // Combinar alianzas + promos de localidad (no-alojamiento), sin duplicados
        const seen = new Set();
        const miniPromos = [...alianzasNorm, ...promosLocalidad].filter(p => {
          const key = String(p.id);
          if (seen.has(key)) return false;
          seen.add(key);
          return p.categoria !== 'alojamiento';
        });
        if (!miniPromos.length) return null;
        return (
          <section ref={cuponeraSectionRef} style={{ background: C.bg, borderTop: `1px solid ${C.line}`, paddingTop: 48, paddingBottom: 48 }}>
            <div className="max-w-[1328px] mx-auto">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, paddingLeft: 40, paddingRight: 40 }}>
                <img src="/ico-disc.svg" alt="" style={{ width: 30, height: 30 }} />
                <h2 style={{ fontSize: 22, fontWeight: 800, color: C.ink, margin: 0 }}>
                  ¡Más cupones agregás, más beneficios para vos!
                </h2>
              </div>
              {/* Fila horizontal scrolleable con fade derecho */}
              <div style={{ position: 'relative' }}>
                <div style={{ overflowX: 'auto', paddingLeft: 40, paddingBottom: 8 }} className="no-scrollbar">
                  <div style={{ display: 'flex', gap: 14, width: 'max-content', paddingRight: 40 }}>
                    {miniPromos.map((p, i) => (
                      <MiniPromoCard key={p.id || i} promo={p} onAdd={() => addCupon(p)} onOpenOferta={onOpenOferta} />
                    ))}
                  </div>
                </div>
                {/* Fade derecho */}
                <div style={{ position: 'absolute', top: 0, right: 0, bottom: 8, width: 120, background: `linear-gradient(to right, transparent, ${C.bg})`, pointerEvents: 'none', zIndex: 2 }} />
              </div>
            </div>
          </section>
        );
      })()}

      {/* ── Más descuentos en la zona — mapa interactivo ─────── */}
      {promosLocalidad.length > 0 && (
        <section style={{ background: '#fff', borderTop: `1px solid ${C.line}`, paddingTop: 56, paddingBottom: 56 }}>
          <div className="max-w-[1328px] mx-auto px-10">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src="/ico-location.svg" alt="" style={{ width: 30, height: 30, filter: 'invert(36%) sepia(97%) saturate(600%) hue-rotate(205deg) brightness(90%)' }} />
                <h2 style={{ fontSize: 22, fontWeight: 700, color: C.ink, margin: 0 }}>Otros descuentos en la zona</h2>
              </div>
              {onOpenLocalidad && item.localidad && (
                <button
                  onClick={() => onOpenLocalidad(item.localidad)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.primary, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}
                >
                  Ver todas <ChevronRight size={14} />
                </button>
              )}
            </div>
            <ZonaMap
              item={item}
              promos={promosLocalidad}
              onAddCupon={addCupon}
              onOpenOferta={onOpenOferta}
            />
          </div>
        </section>
      )}

      {/* Modal de solicitud de reserva */}
      {solicitudPromo && (
        <SolicitudModal
          promo={solicitudPromo}
          negocio={item}
          session={session}
          onClose={() => setSolicitudPromo(null)}
          onConfirmado={() => {}}
        />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════
//  GastroExperienciaDetail
// ═══════════════════════════════════════════════════════════
function GastroExperienciaDetail({ item, tipo }) {
  const category = item.category || item.type || '';
  const pinColor  = TIPO_COLORS[category] || C.muted;
  const isGastro  = tipo === 'salidas';
  const priceLabel = { '$': 'Económico (hasta $3.000)', '$$': 'Moderado ($3.000 – $7.000)', '$$$': 'Gourmet ($7.000+)' }[item.priceRange] || item.priceRange;

  return (
    <>
      <div className="max-w-[1328px] mx-auto px-14 py-10">
        <div className="grid gap-12 items-start" style={{ gridTemplateColumns: '1.5fr 1fr' }}>

          {/* LEFT */}
          <div>
            <h2 className="text-lg font-bold mb-2.5" style={{ color: C.ink }}>
              {isGastro ? 'Sobre el lugar' : 'Descripción de la experiencia'}
            </h2>
            <p className="text-[15px] leading-relaxed" style={{ color: C.ink2 }}>
              {item.description || item.desc || (isGastro ? 'Un lugar especial en la Costa Atlántica para disfrutar en compañía.' : 'Una experiencia única diseñada para que descubras lo mejor de Villa Gesell y la zona.')}
            </p>

            {item.tags?.length > 0 && (
              <>
                <h3 className="text-lg font-bold mt-7 mb-3" style={{ color: C.ink }}>Destacados</h3>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map(tag => (
                    <span key={tag} className="px-3 py-1.5 rounded-full text-[12px] font-semibold" style={{ background: C.primarySoft, color: C.primary }}>{tag}</span>
                  ))}
                </div>
              </>
            )}

            <h3 className="text-lg font-bold mt-8 mb-3 flex items-center gap-2" style={{ color: C.ink }}>
              <MapPin size={17} /> Zona
            </h3>
            <BarrioMap item={item} plan="PLUS" />

            <div className="mt-3 flex items-center gap-2.5 px-4 py-3 rounded-xl" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
              <Lock size={14} color={C.muted} />
              <div>
                <div className="text-[13px] font-semibold" style={{ color: C.ink }}>Dirección exacta</div>
                <div className="text-[12px]" style={{ color: C.muted }}>Registrate gratis para ver la dirección exacta y el horario de atención.</div>
              </div>
            </div>
          </div>

          {/* RIGHT — Info card */}
          <div className="sticky" style={{ top: 84 }}>
            <div className="rounded-2xl p-5" style={{ background: '#fff', border: `1px solid ${C.line}`, boxShadow: '0 20px 60px -30px rgba(11,16,32,0.14)' }}>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold mb-4" style={{ background: `${pinColor}18`, color: pinColor }}>
                {isGastro ? <Utensils size={13} /> : <Star size={13} />} {category}
              </div>

              <div style={{ borderTop: `1px solid ${C.line}` }}>
                {[
                  { icon: <MapPin size={15} />, label: 'Zona', val: [item.zona, item.localidad].filter(Boolean).join(' · ') || 'Villa Gesell' },
                  item.priceRange && { icon: <span className="font-bold text-sm">{item.priceRange}</span>, label: 'Rango de precio', val: priceLabel },
                  item.rating && { icon: <Star size={15} fill={C.yellow} color={C.yellow} />, label: 'Calificación', val: `${item.rating} / 5` },
                  isGastro && { icon: <Clock size={15} />, label: 'Horario', val: 'Consultá en el lugar' },
                ].filter(Boolean).map((r, i) => (
                  <div key={i} className="flex items-start gap-3 py-3" style={{ borderBottom: `1px solid ${C.line}` }}>
                    <div style={{ color: C.primary, marginTop: 1 }}>{r.icon}</div>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.muted }}>{r.label}</div>
                      <div className="text-sm font-medium mt-0.5" style={{ color: C.ink }}>{r.val}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg,#EEF1FF 0%,#F7F7F8 100%)', border: `1px solid ${C.primarySoft}` }}>
                <div className="text-[13px] font-bold mb-1.5" style={{ color: C.ink }}>
                  {isGastro ? '¿Querés reservar una mesa?' : '¿Querés sumarte a esta experiencia?'}
                </div>
                <div className="text-[12px] leading-relaxed mb-3" style={{ color: C.muted }}>
                  {isGastro
                    ? 'En general este tipo de lugares no requieren reserva. Si tiene sistema de reservas, aparece en su sitio web o redes.'
                    : 'Contactate directamente con el proveedor. Los alojamientos Cuponear pueden incluir estas experiencias en sus packs.'}
                </div>
                {item.menuUrl && (
                  <a href={item.menuUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[10px] text-[13px] font-bold text-white no-underline"
                    style={{ background: C.primary }}>
                    <Globe size={14} /> Ver sitio web
                  </a>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                {[{ icon: <Phone size={13} />, label: 'WhatsApp' }, { icon: <Globe size={13} />, label: 'Instagram' }].map(b => (
                  <button key={b.label} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] text-[12px] font-semibold cursor-pointer"
                    style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink2 }}>
                    {b.icon} {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mapa section */}
      <section className="py-16 bg-white" style={{ borderTop: `1px solid ${C.line}` }}>
        <div className="max-w-[1328px] mx-auto px-10">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: C.primary }}>
            <MapPin size={11} /> Ubicación
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight mb-2" style={{ color: C.ink }}>Dónde queda</h2>
          <p className="text-[15px] mb-6" style={{ color: C.muted }}>
            En {item.localidad || 'Villa Gesell'}, Buenos Aires.
          </p>
          <BarrioMap item={item} plan="PLUS" />
        </div>
      </section>
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

export default function DetailView({ item, onBack, onOpenOferta, onOpenPack, onOpenLocalidad, onOpenSeccion, onOpenClase, session, onLoginRequired }) {
  if (!item) return null;

  const { addCupon } = useCuponera();
  const tipo  = detectarTipo(item);
  const plan  = item.plan || 'PLUS';
  const pinColor = TIPO_COLORS[item.type || item.category] || C.primary;

  const [promos,          setPromos]          = useState([]);
  const [alianzas,        setAlianzas]        = useState([]);
  const [promosLocalidad, setPromosLocalidad] = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [drawerOpen,      setDrawerOpen]      = useState(false);

  const backLabel = { alojamiento: 'Alojamientos', salidas: 'Salidas', aventura_relax: 'Aventura & Relax' }[tipo] || 'Inicio';

  useEffect(() => {
    async function cargar() {
      setLoading(true);
      if (!item.id) { setLoading(false); return; }

      const [propiasResult, alianzasResult, localidadResult] = await Promise.all([
        getPromosDeNegocio(item.id),
        getAlianzasPorNegocio(item.id),
        getPromosLocalidad(item.localidad || '', item.id),
      ]);

      setPromos(propiasResult.filter(p => p.tokens_costo !== 0));
      setAlianzas(alianzasResult);
      setPromosLocalidad(localidadResult);
      setLoading(false);
    }
    cargar();
  }, [item.id]);

  return (
    <div className="min-h-screen bg-white" style={{ paddingTop: 100, fontFamily: "'Inter', system-ui, sans-serif", color: C.ink }}>

      {/* ── Wrapper único alineado con el nav ─────────────── */}
      <div className="max-w-[1328px] mx-auto px-10">

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

        {/* Title + Gallery — solo para gastronomía y experiencia */}
        {tipo !== 'alojamiento' && (
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
            <Gallery item={item} plan={plan} />
          </div>
        )}

      </div>{/* end max-w wrapper */}

      {/* Body */}
      {tipo === 'alojamiento' ? (
        <AlojamientoDetail
          item={item}
          promos={promos}
          alianzas={alianzas}
          promosLocalidad={promosLocalidad}
          loading={loading}
          onOpenDrawer={() => setDrawerOpen(true)}
          onOpenOferta={onOpenOferta}
          onOpenLocalidad={onOpenLocalidad}
          session={session}
          onLoginRequired={onLoginRequired}
        />
      ) : (
        <GastroExperienciaDetail item={item} tipo={tipo} session={session} onLoginRequired={onLoginRequired} />
      )}

      {/* Drawer */}
      {drawerOpen && <ConsultaDrawer item={item} onClose={() => setDrawerOpen(false)} />}
    </div>
  );
}
