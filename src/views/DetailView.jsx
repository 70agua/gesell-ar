// ============================================================
//  src/views/DetailView.jsx — Tailwind + Aire design system
// ============================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import MapView from '../components/MapView';
import {
  X, Send, Gift, Check, Eye, EyeOff, Loader2, Lock,
  Heart, Share2, Zap, MessageCircle, Flag, ChevronRight, ChevronLeft,
  Wifi, Car, Waves, Coffee, ShieldCheck, KeyRound,
  Utensils, Phone, Clock, Globe, MapPin, Ticket,
  Star, Minus, Plus, Sunrise, Users,
} from 'lucide-react';
import { CoinSVG } from '../components/Token';
import { supabase }                                    from '../lib/supabase';
import { getPromosDeNegocio, getAlianzasPorNegocio, getPromosLocalidad } from '../lib/datos';
import { guardarConsulta, registrarTurista, loginTurista } from '../lib/auth';
import { useCuponera } from '../lib/cuponera';

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

// ─── Plan config ────────────────────────────────────────────
const PLAN_CFG = {
  BASE:  { maxFotos: 3,  showPrice: false, showContact: false, mapDetail: 'approx',  label: 'Base'  },
  PLUS:  { maxFotos: 8,  showPrice: true,  showContact: true,  mapDetail: 'barrio',  label: 'Plus'  },
  BLACK: { maxFotos: 15, showPrice: true,  showContact: true,  mapDetail: 'exacto',  label: 'Black' },
};

// ─── Tipos ──────────────────────────────────────────────────
const TIPOS_ALOJ   = new Set(['Hotel','Cabaña','Departamento','Casa','Hostel','Dormi']);
const TIPOS_GASTRO = new Set(['Restaurante','Bar','Café','Balneario','Gourmet','Pastelería','Parrilla','Heladería','Bodegón','Café & Dulces']);
const TIPO_COLORS  = { Restaurante:'#EF4444', Bar:'#F59E0B', 'Café & Dulces':'#8B5CF6', Café:'#8B5CF6', Balneario:'#0EA5E9', Gourmet:'#10B981', Pastelería:'#EC4899', Parrilla:'#F97316' };

function detectarTipo(item) {
  if (item.itemType) return item.itemType;
  const t = item.type || item.category || '';
  if (TIPOS_ALOJ.has(t))   return 'alojamiento';
  if (TIPOS_GASTRO.has(t)) return 'gastronomia';
  return 'experiencia';
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
                    <div className="text-sm font-bold" style={{ color: C.ink }}>¡Ganás 2 créditos gesell.ar!</div>
                    <div className="text-[11px]" style={{ color: C.muted }}>Valor: $4.840 en descuentos</div>
                  </div>
                </div>
                <p className="text-[13px] leading-relaxed mb-3.5" style={{ color: C.ink2 }}>Registrate en 30 segundos y usá tus créditos en ofertas, restaurantes y experiencias.</p>
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
                <p className="text-sm leading-relaxed" style={{ color: C.muted }}>Tus <strong style={{ color: C.primary }}>2 créditos gesell.ar</strong> ya están en tu cuenta.</p>
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
function ZonaMap({ item, promos, onAddCupon }) {
  const center = LOCALIDAD_COORDS[item.localidad] || DEFAULT_COORDS;

  // Solo gastro + experiencias, sin alojamientos
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
  'WiFi gratuito':        <Wifi size={15} />,
  'Estacionamiento':      <Car size={15} />,
  'Cerca del mar':        <Waves size={15} />,
  'A 80m del mar':        <Waves size={15} />,
  'Pileta':               <Waves size={15} />,
  'Piscina climatizada':  <Waves size={15} />,
  'Spa':                  <Sunrise size={15} />,
  'Spa y circuito termal':<Sunrise size={15} />,
  'Desayuno':             <Coffee size={15} />,
  'Desayuno buffet incluido': <Coffee size={15} />,
  'Check-in flexible':    <KeyRound size={15} />,
  'Check-in 24hs':        <KeyRound size={15} />,
  'Cancelación flexible': <ShieldCheck size={15} />,
};

function AmenityChip({ tag }) {
  const icon = TAG_ICONS[tag] || <Check size={15} />;
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ border: `1px solid ${C.line}` }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.primarySoft, color: C.primary }}>{icon}</div>
      <span className="text-[13px] font-medium" style={{ color: C.ink }}>{tag}</span>
    </div>
  );
}

// ─── Offer card (promos propias en left column) — horizontal ─
function OfferCard({ promo, onAdd, onOpenOferta }) {
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
        {/* Cajita ahorro + créditos */}
        <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, overflow: 'hidden', fontSize: 11 }}>
          {(promo.ahorroEstimado > 0) && <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 9px' }}>
              <span style={{ fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.muted }}>Ahorro estimado</span>
              <span style={{ fontWeight: 700, color: '#10A36B' }}>~${promo.ahorroEstimado.toLocaleString('es-AR')} aprox.</span>
            </div>
            <div style={{ height: 1, background: C.line }} />
          </>}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 9px' }}>
            <span style={{ fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.muted }}>Lo activás con</span>
            {promo.tokens_costo != null ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: C.ink }}>
                <CoinSVG size={12} /> {promo.tokens_costo} crédito{promo.tokens_costo !== 1 ? 's' : ''}
              </span>
            ) : (
              <span style={{ color: C.primary, fontWeight: 600 }}>Consultá</span>
            )}
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onAdd && onAdd(promo); }}
          style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, alignSelf: 'flex-start' }}
          onMouseEnter={e => e.currentTarget.style.background = C.primaryDark}
          onMouseLeave={e => e.currentTarget.style.background = C.primary}
        >
          <Ticket size={11} /> Agregar a cuponera
        </button>
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
  const [titleHov, setTitleHov] = useState(false);
  const isFlash = promo.offerType === 'Flash';
  const palette = BLOB_PALETTES[seed % BLOB_PALETTES.length];
  const bgFoto = null; // reemplazado por blobs animados
  const goDetail = () => onOpenOferta && onOpenOferta(promo);

  const desc = promo.description || promo.desc ||
    (promo.subtitle ? promo.subtitle.split('·').slice(1).join('·').trim() || promo.subtitle : '') ||
    'Guardalo en tu cuponera y canjealo durante tu estadía.';

  const precioCreditos = promo.tokens_costo != null
    ? `$${(promo.tokens_costo * 2000).toLocaleString('es-AR')} + IVA`
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'row', borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.line}`, minHeight: 190 }}>

      {/* ── Área de foto blureada — clickeable ────────────── */}
      <div
        onClick={goDetail}
        style={{
          width: 240, flexShrink: 0, position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '14px 18px 16px',
          cursor: 'pointer', textAlign: 'center',
          background: '#B01A1A',
        }}
      >
        {isFlash ? <>
          {/* Blobs animados en rojos + naranja */}
          <div style={{ position: 'absolute', width: 150, height: 150, borderRadius: '50%', background: '#cc2e30', filter: 'blur(40px)', opacity: 0.9, top: -25, left: -25, animation: `blobA${seed % 10} ${5.5 + (seed % 4) * 0.5}s ease-in-out infinite` }} />
          <div style={{ position: 'absolute', width: 130, height: 130, borderRadius: '50%', background: '#d73337', filter: 'blur(35px)', opacity: 0.85, bottom: -15, right: -15, animation: `blobB${seed % 10} ${6.5 + (seed % 3) * 0.4}s ease-in-out infinite` }} />
          <div style={{ position: 'absolute', width: 110, height: 110, borderRadius: '50%', background: '#E8622A', filter: 'blur(30px)', opacity: 0.7, top: '40%', right: 0, animation: `blobC${seed % 10} ${7.5 + (seed % 5) * 0.3}s ease-in-out infinite` }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.08)' }} />
        </> : <>
          {/* Blobs de paleta normal */}
          <div style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', background: palette.c[0], filter: 'blur(38px)', opacity: 0.8, top: -20, left: -20, animation: `blobA${seed % 10} ${6 + (seed % 4) * 0.5}s ease-in-out infinite` }} />
          <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: palette.c[1], filter: 'blur(32px)', opacity: 0.75, bottom: -10, right: -10, animation: `blobB${seed % 10} ${7 + (seed % 3) * 0.4}s ease-in-out infinite` }} />
          <div style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', background: palette.c[2], filter: 'blur(28px)', opacity: 0.7, top: '35%', right: 10, animation: `blobC${seed % 10} ${8 + (seed % 5) * 0.3}s ease-in-out infinite` }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.12)' }} />
        </>}
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
              <span style={{ fontSize: (promo.badge?.length || 0) > 5 ? 31 : 44, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
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
              <span style={{ fontSize: (promo.badge?.length || 0) > 5 ? 31 : 44, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
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
            style={{ fontSize: 18, fontWeight: 700, color: C.green, lineHeight: 1.3, marginBottom: 8, cursor: 'pointer', transition: 'color 0.15s' }}
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

        {/* Cajita AHORRO ESTIMADO + LO ACTIVÁS CON */}
        {promo.tokens_costo != null && (
          <div style={{ border: `1px solid ${C.line}`, borderRadius: 10, overflow: 'hidden' }}>
            {promo.ahorroEstimado > 0 && <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px' }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.muted }}>Ahorro estimado</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.green }}>~${promo.ahorroEstimado.toLocaleString('es-AR')} aprox.</span>
              </div>
              <div style={{ height: 1, background: C.line }} />
            </>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 14px' }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.muted, paddingTop: 2 }}>Lo activás con</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                  <CoinSVG size={14} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{promo.tokens_costo} crédito{promo.tokens_costo !== 1 ? 's' : ''}</span>
                </div>
                {precioCreditos && <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>({precioCreditos})</div>}
              </div>
            </div>
          </div>
        )}

        {/* Fila inferior: botón grande + compartir */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={e => { e.stopPropagation(); onAdd && onAdd(promo); }}
            style={{ flex: '0 0 80%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, fontSize: 15, fontWeight: 700, color: '#fff', background: C.primary, border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = C.primaryDark}
            onMouseLeave={e => e.currentTarget.style.background = C.primary}
          >
            <Ticket size={14} /> Agregar a cuponera
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
      </div>
    </div>
  );
}

// ─── Big offer card (ofertas exclusivas section) ─────────
function BigOfferCard({ promo, onAdd, onOpenOferta }) {
  const provNombre = promo.proveedorNombre || promo.negocios?.nombre || promo.subtitle?.split('·')[0]?.trim() || '';
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col bg-white cursor-pointer"
      style={{ border: `1px solid ${C.line}` }}
      onClick={() => onOpenOferta && onOpenOferta(promo)}
    >
      {/* Foto con badge centrado, sin moneda */}
      <div className="relative h-[140px] shrink-0">
        <img src={promo.image || promo.imagen_url} alt={promo.title || promo.titulo}
          className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'rgba(11,16,32,0.45)' }} />
        {promo.badge && (
          <div className="absolute inset-0 flex items-center justify-center text-white font-extrabold leading-none tracking-tight" style={{ fontSize: 42 }}>
            {promo.badge}
          </div>
        )}
      </div>

      <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Localidad + nombre socio */}
        {promo.negocioLocalidad ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 400, marginBottom: 4 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(107,114,128)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>
            <span style={{ color: 'rgb(107,114,128)', fontWeight: 600 }}>{promo.negocioLocalidad}</span>
            {provNombre && <span style={{ color: C.muted }}> · {provNombre}</span>}
          </div>
        ) : provNombre ? (
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>{provNombre}</div>
        ) : null}

        {/* Título en verde */}
        <div style={{ fontSize: 15, fontWeight: 700, color: C.green, lineHeight: 1.3, flex: 1, marginBottom: 12 }}>{promo.title || promo.titulo}</div>

        {/* Cajita ahorro + créditos */}
        {promo.tokens_costo != null && (
          promo.tokens_costo === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F0FDF4', borderRadius: 10, padding: '8px 12px', border: '1px solid #BBF7D0', marginBottom: 10, flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4.5 4.5L20 6"/></svg>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.green }}>Cupón GRATIS</span>
            </div>
          ) : (
            <div style={{ border: `1px solid ${C.line}`, borderRadius: 10, overflow: 'hidden', marginBottom: 10, flexShrink: 0 }}>
              {promo.ahorroEstimado > 0 && <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.muted }}>Ahorro estimado</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.green }}>~${promo.ahorroEstimado.toLocaleString('es-AR')} aprox.</span>
                </div>
                <div style={{ height: 1, background: C.line }} />
              </>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 12px' }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.muted, paddingTop: 2 }}>Lo activás con</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                    <CoinSVG size={14} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{promo.tokens_costo} crédito{promo.tokens_costo !== 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>(${(promo.tokens_costo * 2000).toLocaleString('es-AR')} + IVA)</div>
                </div>
              </div>
            </div>
          )
        )}

        <button
          onClick={e => { e.stopPropagation(); onAdd && onAdd(promo); }}
          style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '10px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 0.15s', flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.background = C.primaryDark}
          onMouseLeave={e => e.currentTarget.style.background = C.primary}
        >
          <Ticket size={13} /> Agregar a cuponera
        </button>
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
          className="absolute z-50 bg-white rounded-2xl overflow-hidden"
          style={{ top: 'calc(100% + 6px)', left: 0, right: 0, border: `1px solid ${C.line}`, boxShadow: '0 20px 48px -16px rgba(11,16,32,0.22)' }}
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


      {/* Dates */}
      {cfg.showPrice && (
        <div className="grid grid-cols-2 gap-2">
          <DatePickerField
            label="CHECK-IN"
            value={checkin}
            onChange={d => { setCheckin(d); if (checkout && checkout <= d) setCheckout(null); }}
            minDate={new Date()}
          />
          <DatePickerField
            label="CHECK-OUT"
            value={checkout}
            onChange={setCheckout}
            minDate={checkoutMin}
          />
        </div>
      )}

      {/* Guests */}
      {cfg.showPrice && (
        <GuestsSelectorField
          adultos={adultos}   setAdultos={setAdultos}
          ninos={ninos}       setNinos={setNinos}
          bebes={bebes}       setBebes={setBebes}
          mascotas={mascotas} setMascotas={setMascotas}
        />
      )}

      {/* CTAs + Reglas */}
      {cfg.showContact ? (
        <div className="flex flex-col gap-2">
          <button
            onClick={onOpenDrawer}
            className="w-full py-3.5 rounded-2xl font-bold text-[15px] text-white cursor-pointer border-0 transition-colors"
            style={{ background: C.ink, boxShadow: '0 8px 24px rgba(11,16,32,0.28)' }}
            onMouseEnter={e => e.currentTarget.style.background = '#1a2035'}
            onMouseLeave={e => e.currentTarget.style.background = C.ink}
          >
            Enviar consulta rápida
          </button>

          {/* Información compartida por el alojamiento: tarifas */}
          {cfg.showPrice ? (
            item.precioMin > 0 ? (
              <div style={{ background: C.bg, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.line}` }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: '0.09em', textTransform: 'uppercase', margin: '0 0 14px' }}>
                  Información compartida por el alojamiento:
                </p>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tarifa común</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
                    <span style={{ fontSize: 12, color: C.muted }}>Desde</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em' }}>${item.precioMin.toLocaleString('es-AR')}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.ink2 }}>{item.unidadPrecio === 'huesped' ? 'por huésped' : 'por noche'}</span>
                  </div>
                </div>
                {item.precioMinEspecial > 0 && (<>
                  <div style={{ height: 1, background: C.line, margin: '10px 0' }} />
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tarifa especial <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(feriados, etc.)</span></span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 12, color: C.muted }}>Desde</span>
                      <span style={{ fontSize: 22, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em' }}>${item.precioMinEspecial.toLocaleString('es-AR')}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.ink2 }}>{item.unidadPrecio === 'huesped' ? 'por huésped' : 'por noche'}</span>
                    </div>
                  </div>
                </>)}
                {item.packPrecio > 0 && item.packNoches && (<>
                  <div style={{ height: 1, background: C.line, margin: '10px 0' }} />
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pack {item.packNoches} noches{item.packAclaracion && <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}> · {item.packAclaracion}</span>}</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 12, color: C.muted }}>Desde</span>
                      <span style={{ fontSize: 22, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em' }}>${item.packPrecio.toLocaleString('es-AR')}</span>
                      <span style={{ fontSize: 12, color: C.muted }}>el pack</span>
                    </div>
                  </div>
                </>)}
                <p style={{ fontSize: 11, color: C.muted, margin: '12px 0 0', lineHeight: 1.45 }}>
                  <b>IMPORTANTE:</b> Esta plataforma no alquila alojamientos. Los precios referenciales son meramente orientativos. Consultá disponibilidad y tarifas exactas con el alojamiento en el formulario.
                </p>
              </div>
            ) : (
              <span className="text-base font-semibold" style={{ color: C.muted }}></span>
            )
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl" style={{ background: C.bg, border: `1px dashed ${C.line}` }}>
              <Lock size={14} color={C.muted} />
              <span className="text-sm font-medium" style={{ color: C.muted }}>Precio visible en plan Plus</span>
            </div>
          )}

          {/* Reglas del alojamiento */}
          <div className="rounded-xl overflow-hidden mt-2" style={{ border: `1px solid ${C.line}` }}>
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
          <div className="text-[13px] font-bold mb-1" style={{ color: C.ink }}>Solo socios Plus y Black</div>
          <div className="text-[12px] leading-relaxed mb-3" style={{ color: C.muted }}>
            Los usuarios solo pueden contactar alojamientos con plan Plus o superior.
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
            Reservando en este alojamiento accedés a cupones exclusivos para canjear en restaurantes y experiencias locales.
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
//  AlojamientoDetail (main two-col + sections below)
// ═══════════════════════════════════════════════════════════
function AlojamientoDetail({ item, promos, alianzas, promosLocalidad = [], loading, onOpenDrawer, onOpenOferta, onOpenLocalidad }) {
  const plan = item.plan || 'PLUS';
  const cfg  = PLAN_CFG[plan];
  const { addCupon } = useCuponera();

  const tags = item.tags?.length
    ? item.tags
    : ['A 80m del mar', 'Piscina climatizada', 'Spa y circuito termal', 'Desayuno buffet incluido', 'Check-in 24hs', 'Cancelación flexible'];

  // Normaliza promo desde formato DB (titulo/imagen_url) o mock (title/image)
  function normPromo(p) {
    return { ...p, title: p.title || p.titulo || '', image: p.image || p.imagen_url || '' };
  }
  // Normaliza alianza desde formato Supabase o mock
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
        tokens_costo: p.tokens_costo,
      };
    }
    if (al.promo) return { ...al.promo };
    return null;
  }
  const alianzasNorm = alianzas.map(normAlianza).filter(Boolean);

  return (
    <>
      {/* ── Main two-column ────────────────────────────────── */}
      <div className="max-w-[1328px] mx-auto px-10 py-10">
        <div className="grid gap-12 items-start" style={{ gridTemplateColumns: '1.65fr 1fr' }}>

          {/* LEFT */}
          <div>
            {/* Sobre el lugar */}
            <h2 className="text-lg font-bold mb-2.5" style={{ color: C.ink }}>Sobre el lugar</h2>
            <p className="text-[15px] leading-relaxed" style={{ color: C.ink2, lineHeight: 1.65 }}>
              {item.description || item.desc || 'Disfrutá del mar y la naturaleza en este increíble lugar de la Costa Atlántica. Un espacio diseñado para el descanso, con todos los servicios que necesitás para una estadía perfecta.'}
            </p>

            {/* Amenities */}
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

            {/* ── Ofertas y beneficios exclusivos ──────────── */}
            {!loading && (promos.length > 0 || alianzasNorm.length > 0) && (
              <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <img src="/ico-regalo.svg" alt="" style={{ width: 30, height: 30, filter: 'invert(36%) sepia(97%) saturate(600%) hue-rotate(205deg) brightness(90%)' }} />
                <span style={{ fontSize: 24, fontWeight: 700, color: C.ink }}>Ofertas y beneficios exclusivos</span>
              </div>
            )}
            {!loading && promos.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {promos.map((p, idx) => {
                    const np = normPromo(p);
                    const fotos = (item.fotos?.length ? item.fotos : [item.image]).filter(Boolean);
                    return (
                      <PropiaOfferCard
                        key={p.id}
                        promo={np}
                        fotos={fotos}
                        seed={idx}
                        onAdd={() => addCupon(np)}
                        onOpenOferta={onOpenOferta}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {!loading && alianzasNorm.length > 0 && (
              <div style={{ marginTop: promos.length > 0 ? 24 : 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {alianzasNorm.map((p, i) => (
                    <OfferCard
                      key={p.id || i}
                      promo={p}
                      onAdd={() => addCupon(p)}
                      onOpenOferta={onOpenOferta}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — sticky card */}
          <div className="sticky" style={{ top: 84 }}>
            <BookingCard
              item={item}
              plan={plan}
              cfg={cfg}
              promos={promos}
              alianzas={alianzas}
              onOpenDrawer={onOpenDrawer}
            />
          </div>
        </div>
      </div>


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

    </>
  );
}

// ═══════════════════════════════════════════════════════════
//  GastroExperienciaDetail
// ═══════════════════════════════════════════════════════════
function GastroExperienciaDetail({ item, tipo }) {
  const category = item.category || item.type || '';
  const pinColor  = TIPO_COLORS[category] || C.muted;
  const isGastro  = tipo === 'gastronomia';
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
                    : 'Contactate directamente con el proveedor. Los alojamientos gesell.ar pueden incluir estas experiencias en sus packs.'}
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
export default function DetailView({ item, onBack, onOpenOferta, onOpenPack, onOpenLocalidad, onOpenSeccion }) {
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

  const backLabel = { alojamiento: 'Alojamientos', gastronomia: 'Gastronomía', experiencia: 'Aventura & Relax' }[tipo] || 'Inicio';

  useEffect(() => {
    async function cargar() {
      setLoading(true);

      // Promos de la localidad (siempre desde mock, funciona para real y mock)
      setPromosLocalidad(getPromosLocalidad(item.localidad || '', item.id));

      if (!item.esReal) {
        // Datos mock para los ejemplos
        setPromos(getPromosDeNegocio(item.id));
        setAlianzas(getAlianzasPorNegocio(item.id));
        setLoading(false);
        return;
      }

      if (!item.id) { setLoading(false); return; }

      // Datos reales desde Supabase
      const [{ data: propias }, { data: alianzasData }] = await Promise.all([
        supabase.from('promociones').select('*, negocios(nombre,localidad,foto_perfil,imagen_url)')
          .eq('negocio_id', item.id).eq('aprobada', true).eq('activa', true),
        supabase.from('alianzas').select('*, promociones(*, negocios(nombre,localidad,foto_perfil,imagen_url))')
          .eq('negocio_id', item.id).eq('aprobada', true),
      ]);
      setPromos(propias || []);
      setAlianzas(alianzasData || []);
      setLoading(false);
    }
    cargar();
  }, [item.id]);

  return (
    <div className="min-h-screen bg-white" style={{ paddingTop: 70, fontFamily: "'Geist', system-ui, sans-serif", color: C.ink }}>

      {/* ── Wrapper único alineado con el nav ─────────────── */}
      <div className="max-w-[1328px] mx-auto px-10">

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-[13px] pt-4 pb-0 flex-wrap" style={{ color: C.muted }}>

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

          {/* 2 — Localidad (solo para alojamiento y gastronomía, nunca para experiencias) */}
          {tipo !== 'experiencia' && item.localidad && (
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

          {/* 3 — Nombre del socio (página actual, no clickeable) */}
          <ChevronRight size={12} className="shrink-0" />
          <span className="font-medium truncate max-w-[220px]" style={{ color: C.ink }}>{item.name}</span>
        </nav>

        {/* Title + actions */}
        <div className="pt-3">
        <div className="flex justify-between items-start gap-6">
          <div>
            {/* Tipo badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider mb-2"
              style={{ background: `${pinColor}18`, color: pinColor }}>
              {item.type || item.category}
            </div>
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-[42px] font-extrabold leading-[1.05] tracking-tight m-0" style={{ color: C.ink }}>{item.name}</h1>
              {plan === 'BLACK' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white shrink-0" style={{ background: C.ink }}>
                  ★ Socio Black
                </span>
              )}
            </div>
            <div className="mt-2 flex items-center flex-wrap gap-4 text-[13px]" style={{ color: C.muted }}>
              {item.rating && (
                <span className="flex items-center gap-1.5 font-semibold" style={{ color: C.ink }}>
                  <Star size={14} fill={C.yellow} color={C.yellow} />
                  {item.rating}
                  <span className="font-normal" style={{ color: C.muted }}>({item.reviewCount || '214'} reseñas)</span>
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <MapPin size={13} />
                {[item.localidad, item.zona].filter(Boolean).join(' · ') || 'Villa Gesell'}
              </span>
              <span className="flex items-center gap-1.5 font-semibold" style={{ color: C.green }}>
                <Check size={13} strokeWidth={2.5} /> Socio verificado
              </span>
            </div>
          </div>

          {/* Guardar + Compartir */}
          <div className="flex gap-2 shrink-0">
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

        {/* Gallery */}
        <Gallery item={item} plan={plan} />
        </div>{/* end Title+Gallery wrapper */}

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
        />
      ) : (
        <GastroExperienciaDetail item={item} tipo={tipo} />
      )}

      {/* Drawer */}
      {drawerOpen && <ConsultaDrawer item={item} onClose={() => setDrawerOpen(false)} />}
    </div>
  );
}
