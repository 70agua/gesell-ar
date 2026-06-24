// ============================================================
//  src/views/LoginView.jsx
// ============================================================
import React, { useState, useRef } from 'react';
import { Eye, EyeOff, AlertCircle, Check, Mail, Lock, User, Zap, Crown, Store, Hotel, UtensilsCrossed, Sparkles, ChevronRight } from 'lucide-react';
import { login, registrarTurista, loginConGoogle } from '../lib/auth';
import { supabase } from '../lib/supabase';

// ─── Helpers ─────────────────────────────────────────────────
function getSiteName() {
  if (typeof window === 'undefined') return 'gesell.ar';
  const h = window.location.hostname.replace('www.', '');
  return h === 'localhost' ? 'gesell.ar' : h;
}

// ─── Taxonomía de cuentas comerciales ───────────────────────
const LOCALIDADES = ['Villa Gesell', 'Mar de las Pampas', 'Las Gaviotas', 'Mar Azul'];

const SERVICIOS_ALOJ = [
  'WiFi', 'Estacionamiento', 'Pileta', 'Desayuno incluido',
  'Aire acondicionado', 'Calefacción', 'Cocina equipada', 'Parrilla',
  'Lavarropas', 'Secador de cabello', 'TV Smart', 'Ropa de cama',
  'Toallas incluidas', 'Caja fuerte', 'Recepción 24 hs', 'Terraza / Balcón',
  'Vista al mar', 'Bicicletas', 'Jardín / Patio', 'Servicio de limpieza',
];

// Tipos de cuenta comercial — alineados con los 3 pilares del sitio
const TIPOS_COMERCIO = [
  { id: 'alojamiento',    label: 'Alojamiento',      sub: 'Hotel, cabaña, dpto\ndomo, glamping, carpa...', Icon: Hotel },
  { id: 'salidas',        label: 'Salidas',           sub: 'Gastronomía, bar, café\nheladería, disco, teatro...', Icon: UtensilsCrossed },
  { id: 'aventura_relax', label: 'Aventura & Relax',  sub: 'Tours, deportes, yoga\nspa, masajes, cultura...', Icon: Sparkles },
];

// Categorías / industrias por tipo
const CATS = {
  alojamiento:    ['Hotel', 'Apart', 'Complejo', 'Hostería', 'Resort', 'Cabaña', 'Departamento', 'Domo', 'Dormi', 'Carpa', 'Glamping'],
  salidas:        ['Restaurantes', 'Bares', 'Cafés & Dulces', 'Heladerías', 'Panaderías', 'Discotecas', 'Cines y Teatros', 'Shows y Recitales', 'Centros Culturales', 'Otros'],
  aventura_relax: ['Deportes acuáticos', 'Cabalgatas', 'Kitesurf', 'Yoga / Bienestar', 'Masajes a domicilio', 'Tour fotográfico', 'Pesca deportiva', 'Senderismo', 'Espectáculos'],
};

const A = {
  primary:     '#2545E6',
  primaryDark: '#1731B8',
  primarySoft: '#EEF1FF',
  ink:         '#0B1020',
  ink2:        '#3D4255',
  muted:       '#6B7280',
  line:        '#E7E9EE',
  bg:          '#F7F7F8',
  green:       '#10A36B',
  red:         '#EF4444',
  font:        "'Inter', system-ui, sans-serif",
};

// ─── SVGs sin emojis ─────────────────────────────────────────
const IcoGoogle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// Turista: persona con mochila viajando
const IcoTurista = ({ size = 56, selected }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="22" cy="13" r="7" stroke={selected ? A.primary : A.ink2} strokeWidth="2" fill={selected ? A.primarySoft : '#F7F8FA'}/>
    <path d="M8 36c0-7.732 6.268-14 14-14h1c7.732 0 14 6.268 14 14v2H8v-2z" stroke={selected ? A.primary : A.ink2} strokeWidth="2" fill={selected ? A.primarySoft : '#F7F8FA'}/>
    <rect x="32" y="28" width="15" height="12" rx="2.5" stroke={selected ? A.primary : A.ink2} strokeWidth="2" fill={selected ? A.primarySoft : '#F7F8FA'}/>
    <path d="M35 28v-2a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3v2" stroke={selected ? A.primary : A.ink2} strokeWidth="2"/>
    <line x1="39.5" y1="28" x2="39.5" y2="40" stroke={selected ? A.primary : A.ink2} strokeWidth="1.5"/>
    <line x1="32" y1="33" x2="47" y2="33" stroke={selected ? A.primary : A.ink2} strokeWidth="1.5"/>
    <path d="M10 38h25" stroke={selected ? A.primary : A.ink2} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Publicar ofertas: tienda / local comercial
const IcoPublicar = ({ size = 56, selected }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="26" width="40" height="22" rx="2" stroke={selected ? A.primary : A.ink2} strokeWidth="2" fill={selected ? A.primarySoft : '#F7F8FA'}/>
    <path d="M5 26l23-16 23 16" stroke={selected ? A.primary : A.ink2} strokeWidth="2" strokeLinejoin="round"/>
    <rect x="22" y="36" width="12" height="12" rx="1.5" stroke={selected ? A.primary : A.ink2} strokeWidth="2" fill={selected ? A.primarySoft : '#F7F8FA'}/>
    <rect x="10" y="32" width="10" height="7" rx="1.5" stroke={selected ? A.primary : A.ink2} strokeWidth="1.5" fill={selected ? A.primarySoft : '#F7F8FA'}/>
    <rect x="36" y="32" width="10" height="7" rx="1.5" stroke={selected ? A.primary : A.ink2} strokeWidth="1.5" fill={selected ? A.primarySoft : '#F7F8FA'}/>
    <path d="M28 10v4M25 12h6" stroke={selected ? A.primary : A.ink2} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// Alojamiento: cama
const IcoAlojamiento = ({ size = 48, selected }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="20" width="40" height="18" rx="3" stroke={selected ? A.primary : A.ink2} strokeWidth="2" fill={selected ? A.primarySoft : '#F7F8FA'}/>
    <path d="M4 28h40" stroke={selected ? A.primary : A.ink2} strokeWidth="2"/>
    <rect x="10" y="22" width="10" height="6" rx="2" stroke={selected ? A.primary : A.ink2} strokeWidth="1.5" fill={selected ? A.primarySoft : '#F7F8FA'}/>
    <rect x="28" y="22" width="10" height="6" rx="2" stroke={selected ? A.primary : A.ink2} strokeWidth="1.5" fill={selected ? A.primarySoft : '#F7F8FA'}/>
    <path d="M8 20V14a2 2 0 0 1 2-2h28a2 2 0 0 1 2 2v6" stroke={selected ? A.primary : A.ink2} strokeWidth="2"/>
    <path d="M8 38v4M40 38v4" stroke={selected ? A.primary : A.ink2} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Comercio o servicio: tenedor y llave
const IcoComercio = ({ size = 48, selected }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="8" width="36" height="32" rx="3" stroke={selected ? A.primary : A.ink2} strokeWidth="2" fill={selected ? A.primarySoft : '#F7F8FA'}/>
    <path d="M6 18h36" stroke={selected ? A.primary : A.ink2} strokeWidth="2"/>
    <path d="M16 8v10" stroke={selected ? A.primary : A.ink2} strokeWidth="2" strokeLinecap="round"/>
    <path d="M32 8v10" stroke={selected ? A.primary : A.ink2} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="24" cy="31" r="5" stroke={selected ? A.primary : A.ink2} strokeWidth="1.5" fill={selected ? A.primarySoft : '#F7F8FA'}/>
    <path d="M24 28v3l2 1.5" stroke={selected ? A.primary : A.ink2} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─── Input con ícono ──────────────────────────────────────────
function Campo({ label, type = 'text', value, onChange, placeholder, icon, rightEl, required }) {
  const [foc, setFoc] = useState(false);
  return (
    <div>
      {label && (
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: A.ink2, marginBottom: 6, fontFamily: A.font }}>
          {label}{required && <span style={{ color: A.red, marginLeft: 2 }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: foc ? A.primary : A.muted, display: 'flex', transition: 'color .15s' }}>
            {icon}
          </span>
        )}
        <input
          type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
          onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
          style={{
            width: '100%', boxSizing: 'border-box',
            paddingTop: 13, paddingBottom: 13,
            paddingLeft: icon ? 42 : 16, paddingRight: rightEl ? 48 : 16,
            border: `1.5px solid ${foc ? A.primary : A.line}`,
            borderRadius: 13, fontSize: 14, fontWeight: 500,
            fontFamily: A.font, color: A.ink, background: '#fff',
            outline: 'none', transition: 'border-color .15s',
          }}
        />
        {rightEl && (
          <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
            {rightEl}
          </span>
        )}
      </div>
    </div>
  );
}

function BtnGoogle({ onClick, loading, label = 'Ingresar con Google' }) {
  const [hov, setHov] = useState(false);
  return (
    <button type="button" onClick={onClick} disabled={loading}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '13px 0', border: `1.5px solid ${hov ? A.ink2 : A.line}`, borderRadius: 13, fontSize: 14, fontWeight: 600, color: A.ink, background: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: A.font, transition: 'border-color .15s' }}
    >
      <IcoGoogle /> {label}
    </button>
  );
}

function Divisor() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
      <div style={{ flex: 1, height: 1, background: A.line }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: A.muted, fontFamily: A.font }}>O</span>
      <div style={{ flex: 1, height: 1, background: A.line }} />
    </div>
  );
}

function Terminos({ checked, onChange }) {
  return (
    <div onClick={() => onChange(!checked)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', userSelect: 'none', padding: '4px 0' }}>
      <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${checked ? A.primary : A.line}`, background: checked ? A.primary : '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1, transition: 'all .15s' }}>
        {checked && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      <span style={{ fontSize: 13, color: A.ink2, lineHeight: 1.5, fontFamily: A.font }}>
        Acepto los <button type="button" onClick={e => e.stopPropagation()} style={{ background: 'none', border: 'none', color: A.primary, fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: 13, fontFamily: A.font }}>términos y condiciones</button> y la política de privacidad de Cuponear
      </span>
    </div>
  );
}

function BtnSubmit({ loading, label, loadingLabel }) {
  return (
    <button type="submit" disabled={loading}
      style={{ width: '100%', padding: '14px 0', background: loading ? A.muted : A.primary, color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: A.font, boxShadow: '0 4px 16px rgba(37,69,230,0.28)', transition: 'background .15s', marginTop: 2 }}
      onMouseEnter={e => !loading && (e.currentTarget.style.background = A.primaryDark)}
      onMouseLeave={e => !loading && (e.currentTarget.style.background = A.primary)}
    >
      {loading ? loadingLabel : label}
    </button>
  );
}

// ─── Tarjeta de selección (tipo de usuario / tipo de negocio) ─
function TipoCard({ selected, onClick, icon, title, sub }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        padding: '20px 14px 16px',
        border: `2px solid ${selected ? A.primary : A.line}`,
        borderRadius: 16, cursor: 'pointer', background: selected ? A.primarySoft : '#fff',
        transition: 'all .2s', fontFamily: A.font,
      }}
    >
      {icon}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: selected ? A.primary : A.ink }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: A.muted, marginTop: 3, lineHeight: 1.4 }}>{sub}</div>}
      </div>
    </button>
  );
}

// ─── Toggle switch ────────────────────────────────────────────
function Toggle({ label, checked, onChange }) {
  return (
    <div onClick={() => onChange(!checked)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: `1.5px solid ${checked ? A.primary : A.line}`, borderRadius: 13, background: checked ? A.primarySoft : '#fff', cursor: 'pointer', userSelect: 'none', transition: 'all .15s' }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: checked ? A.primary : A.ink2, fontFamily: A.font }}>{label}</span>
      <div style={{ width: 42, height: 24, borderRadius: 12, background: checked ? A.primary : A.line, position: 'relative', transition: 'background .15s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.18)', transition: 'left .15s' }} />
      </div>
    </div>
  );
}

// ─── Servicios collapsible multi-checkbox ─────────────────────
function ServiciosField({ selected, onChange }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('');

  const toggle = (s) => onChange(selected.includes(s) ? selected.filter(x => x !== s) : [...selected, s]);
  const addCustom = () => {
    const t = custom.trim();
    if (t && !selected.includes(t)) onChange([...selected, t]);
    setCustom('');
  };
  const customOnes = selected.filter(s => !SERVICIOS_ALOJ.includes(s));

  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: A.ink2, marginBottom: 6, fontFamily: A.font }}>Servicios incluidos</label>
      {/* Trigger */}
      <button type="button" onClick={() => setOpen(o => !o)} style={{ width: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', border: `1.5px solid ${open ? A.primary : A.line}`, borderRadius: open ? '13px 13px 0 0' : 13, fontSize: 14, fontWeight: 500, fontFamily: A.font, color: selected.length ? A.ink : A.muted, background: '#fff', cursor: 'pointer', transition: 'border-color .15s' }}>
        <span>{selected.length === 0 ? 'Seleccionar servicios...' : `${selected.length} servicio${selected.length !== 1 ? 's' : ''} seleccionado${selected.length !== 1 ? 's' : ''}`}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', color: A.muted, flexShrink: 0 }}><path d="m6 9 6 6 6-6"/></svg>
      </button>
      {/* Panel */}
      {open && (
        <div style={{ border: `1.5px solid ${A.primary}`, borderTop: 'none', borderRadius: '0 0 13px 13px', padding: '14px 14px 12px', background: '#fff' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {SERVICIOS_ALOJ.map(s => {
              const sel = selected.includes(s);
              return (
                <div key={s} onClick={() => toggle(s)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 9, background: sel ? A.primarySoft : 'transparent', cursor: 'pointer', userSelect: 'none', transition: 'background .12s' }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${sel ? A.primary : A.line}`, background: sel ? A.primary : '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, transition: 'all .12s' }}>
                    {sel && <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span style={{ fontSize: 12.5, color: sel ? A.primary : A.ink2, fontFamily: A.font, fontWeight: sel ? 600 : 400 }}>{s}</span>
                </div>
              );
            })}
          </div>
          {/* Custom */}
          <div style={{ borderTop: `1px solid ${A.line}`, marginTop: 10, paddingTop: 10, display: 'flex', gap: 8 }}>
            <input value={custom} onChange={e => setCustom(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }} placeholder="Agregar otro servicio..." style={{ flex: 1, border: `1px solid ${A.line}`, borderRadius: 9, padding: '8px 12px', fontSize: 13, fontFamily: A.font, color: A.ink, outline: 'none' }} />
            <button type="button" onClick={addCustom} style={{ padding: '8px 16px', background: A.primary, color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: A.font }}>+</button>
          </div>
          {customOnes.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
              {customOnes.map(s => (
                <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px 4px 10px', background: A.primarySoft, border: `1px solid ${A.primary}33`, borderRadius: 100, fontSize: 12, color: A.primary, fontFamily: A.font }}>
                  {s}
                  <button type="button" onClick={() => toggle(s)} style={{ background: 'none', border: 'none', color: A.primary, cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: 14 }}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Upload de logo / imagen de perfil ────────────────────────
function ImageUpload({ file, onChange }) {
  const ref = useRef(null);
  const [preview, setPreview] = useState(null);

  const handleChange = (f) => {
    onChange(f);
    if (f) {
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: A.ink2, marginBottom: 6, fontFamily: A.font }}>
        Logo o imagen del negocio <span style={{ fontWeight: 400, color: A.muted }}>(opcional)</span>
      </label>
      <div onClick={() => ref.current?.click()} style={{ border: `2px dashed ${preview ? A.primary : A.line}`, borderRadius: 14, padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', background: preview ? A.primarySoft : '#fafafa', transition: 'all .15s' }}>
        {preview
          ? <img src={preview} alt="preview" style={{ height: 80, width: 80, objectFit: 'cover', borderRadius: 12, border: `2px solid ${A.primary}33` }} />
          : <>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={A.muted} strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
              <span style={{ fontSize: 13, color: A.muted, fontFamily: A.font }}>Subir logo o foto del local</span>
              <span style={{ fontSize: 11, color: A.muted, fontFamily: A.font }}>PNG, JPG — hasta 5 MB</span>
            </>
        }
        {preview && (
          <button type="button" onClick={e => { e.stopPropagation(); handleChange(null); }} style={{ fontSize: 12, color: A.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: A.font }}>
            Cambiar imagen
          </button>
        )}
      </div>
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" onChange={e => handleChange(e.target.files[0] || null)} style={{ display: 'none' }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  SELECTOR DE PLANES ALOJAMIENTO
// ═══════════════════════════════════════════════════════════════
const PLANES_ALOJ = [
  {
    id: 'free',
    nombre: 'FREEMIUM',
    precio: null,
    badge: null,
    items: [
      'Presencia SIN CARGO en listado de alojamientos',
      'Panel de administración básico',
      'Ficha con hasta 4 fotos, mapa y detalles',
    ],
    // paymentNote como segmentos: { text, bold, green }
    paymentSegments: [
      { text: '$20.000 + IVA, cada oferta publicada' }
    ],
  },
  {
    id: 'plus',
    nombre: 'PLUS',
    precio: '$20.000/mes',
    badge: 'Más elegido',
    items: [
      'Mayor relevancia en el listado',
      'Panel avanzado (hasta 20 fotos)',
      'Sello "Socio verificado"',
      'Formulario de contacto directo',
      'Estadísticas, reseñas verificadas',
    ],
    paymentSegments: [
      { text: 'SIN CARGO', bold: true, green: true },
    ],
  },
  {
    id: 'black',
    nombre: 'BLACK',
    precio: '$29.000/mes',
    badge: 'Premium',
    items: [
      'Todo lo que incluye PLUS, más:',
      'Presencia estelar en "Destacados"',
      'Mail Marketing, redes y Google Ads',
      'Onboarding personalizado',
      'Informes de rendimiento mensuales',
    ],
    paymentSegments: [
      { text: 'SIN CARGO', bold: true, green: true },
    ],
  },
];

function PlanSelectorAloj({ planAloj, setPlanAloj }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, margin: '4px 0' }}>
      {PLANES_ALOJ.map(plan => {
        const sel = planAloj === plan.id;
        return (
          <button
            key={plan.id}
            type="button"
            onClick={() => setPlanAloj(plan.id)}
            style={{
              display: 'flex', flexDirection: 'column', textAlign: 'left',
              border: `2px solid ${sel ? A.primary : A.line}`,
              borderRadius: 16, padding: '16px 14px', cursor: 'pointer',
              background: sel ? A.primarySoft : '#fff',
              transition: 'all .18s', fontFamily: A.font, position: 'relative',
            }}
          >
            {plan.badge && (
              <span style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: plan.id === 'black' ? '#0B1020' : A.primary, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                {plan.badge}
              </span>
            )}
            {/* Nombre + precio */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: sel ? A.primary : A.ink, letterSpacing: '-0.01em' }}>{plan.nombre}</div>
              <div style={{ fontSize: 12, color: plan.precio ? A.ink2 : A.muted, marginTop: 2 }}>
                {plan.precio || 'Sin cargo de membresía'}
              </div>
            </div>
            {/* Items */}
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px', display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
              {plan.items.map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11, color: A.ink2, lineHeight: 1.35 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={sel ? A.primary : '#10A36B'} strokeWidth="3" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="m5 12 4.5 4.5L20 6"/></svg>
                  {item}
                </li>
              ))}
            </ul>
            {/* Publicación de ofertas */}
            <div style={{ borderTop: `1px solid ${sel ? A.primary + '33' : A.line}`, paddingTop: 10, marginTop: 'auto' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: A.muted, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }}>
                Publicación de ofertas
              </div>
              <p style={{ fontSize: 11, color: A.ink, lineHeight: 1.6, margin: 0 }}>
                {plan.paymentSegments.map((seg, i) => (
                  <span key={i} style={{
                    fontWeight: seg.bold ? 700 : 400,
                    color: seg.green ? '#10A36B' : A.ink,
                  }}>
                    {seg.text}
                  </span>
                ))}
              </p>
            </div>
            {/* Selector indicator */}
            <div style={{ marginTop: 12, padding: '7px 0', borderRadius: 8, background: sel ? A.primary : A.bg, border: `1px solid ${sel ? A.primary : A.line}`, textAlign: 'center', fontSize: 12, fontWeight: 700, color: sel ? '#fff' : A.muted, transition: 'all .18s' }}>
              {sel ? '✓ Seleccionado' : 'Elegir este plan'}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ONBOARDING COMERCIAL — wizard de 3 pasos estilo panel admin
// ═══════════════════════════════════════════════════════════════
const OBP    = '#475be1';
const OBPS   = '#eef0fd';
const OBINK  = '#0f172a';
const OBINK2 = '#475569';
const OBMUTED= '#94a3b8';
const OBLINE = '#e2e8f0';
const OBBG   = '#f8fafc';
const OBCARD = '#ffffff';
const OBNAVY = '#0f172a';
const OBFONT = "'Inter', system-ui, sans-serif";
const OBGRN  = '#10b981';

const OB_PROVINCIAS = [
  'Buenos Aires','CABA','Catamarca','Chaco','Chubut','Córdoba','Corrientes',
  'Entre Ríos','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones',
  'Neuquén','Río Negro','Salta','San Juan','San Luis','Santa Cruz','Santa Fe',
  'Santiago del Estero','Tierra del Fuego','Tucumán',
];

const OB_PLANES = [
  { id:'free',  label:'Gratuito', price:'Gratis',
    features:['1 oferta activa','Perfil básico','Sin posicionamiento destacado'] },
  { id:'plus',  label:'Plus',     price:'$18.333/mes', badge:'⚡ Recomendado',
    features:['Ofertas ilimitadas','Estadísticas completas','Posicionamiento Plus','Cupones personalizados'] },
  { id:'black', label:'Black',    price:'$29.000/mes', badge:'👑 Premium',
    features:['Todo de Plus','Cuponera destacada','Prioridad en búsquedas','Account manager'] },
];

function OnboardingComercial({ regUserId, comTipo, comCategorias, rNombre, rApellido, rEmail, onComplete }) {
  const [obStep,    setObStep]    = useState(1);
  const [doneSteps, setDoneSteps] = useState(new Set());
  // Empresa
  const [nombre,      setNombre]      = useState('');
  const [provincia,   setProvincia]   = useState('');
  const [localidad,   setLocalidad]   = useState('');
  const [telefono,    setTelefono]    = useState('');
  const [instagram,   setInstagram]   = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile,    setLogoFile]    = useState(null);
  const logoRef = useRef();
  // Cuenta
  const [plan, setPlan] = useState('free');
  // Oferta
  const [ofTitulo, setOfTitulo] = useState('');
  const [ofPct,    setOfPct]    = useState('');
  const [ofDesc,   setOfDesc]   = useState('');
  // Misc
  const [negocioId, setNegocioId] = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [errors,    setErrors]    = useState({});

  const DESC_MIN = 40, DESC_MAX = 450;

  const inp  = { width:'100%', boxSizing:'border-box', padding:'10px 14px', borderRadius:10, border:`1px solid ${OBLINE}`, fontFamily:OBFONT, fontSize:13, color:OBINK, outline:'none', background:'#fff', transition:'border-color .15s' };
  const inpE = (f) => ({ ...inp, borderColor: errors[f] ? '#ef4444' : OBLINE });
  const lbl  = { fontFamily:OBFONT, fontSize:11, fontWeight:700, color:OBINK2, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' };
  const ErrMsg = ({ f }) => errors[f] ? <span style={{ fontSize:11, color:'#ef4444', marginTop:3, display:'block', fontFamily:OBFONT }}>{errors[f]}</span> : null;

  const OBCard = ({ children, style }) => (
    <div style={{ background:OBCARD, borderRadius:16, border:`1px solid ${OBLINE}`, padding:20, ...style }}>{children}</div>
  );
  const OBCardTitle = ({ label }) => (
    <div style={{ fontSize:13, fontWeight:700, color:OBINK, marginBottom:14, paddingBottom:10, borderBottom:`1px solid ${OBLINE}` }}>{label}</div>
  );
  const BtnNext = ({ onClick, disabled, label }) => (
    <button onClick={onClick} disabled={disabled || saving}
      style={{ display:'flex', alignItems:'center', gap:8, background:(disabled||saving)?OBMUTED:OBP, color:'#fff', border:'none', borderRadius:12, padding:'13px 28px', fontFamily:OBFONT, fontSize:14, fontWeight:700, cursor:(disabled||saving)?'not-allowed':'pointer', boxShadow:'0 4px 14px rgba(71,91,225,0.25)', transition:'background .15s' }}>
      {saving ? 'Guardando...' : label}
    </button>
  );

  const handleLogoChange = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    setLogoFile(f);
    const reader = new FileReader();
    reader.onload = ev => setLogoPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const validate1 = () => {
    const e = {};
    if (!nombre.trim())           e.nombre      = 'Campo requerido';
    if (!provincia)               e.provincia   = 'Campo requerido';
    if (!localidad)               e.localidad   = 'Campo requerido';
    if (!descripcion.trim())      e.descripcion = 'Campo requerido';
    else if (descripcion.length < DESC_MIN) e.descripcion = `Mínimo ${DESC_MIN} caracteres (${descripcion.length} escritos)`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const step1Save = async () => {
    if (!validate1() || saving) return;
    setSaving(true);
    try {
      let imagenUrl = null;
      if (logoFile && regUserId) {
        try {
          const ext = logoFile.name.split('.').pop().toLowerCase();
          const { data: up } = await supabase.storage.from('negocios').upload(`logos/${regUserId}.${ext}`, logoFile, { upsert: true });
          if (up) { const { data: ud } = supabase.storage.from('negocios').getPublicUrl(up.path); imagenUrl = ud.publicUrl; }
        } catch {}
      }
      const { data: neg, error: negErr } = await supabase.from('negocios').insert({
        nombre: nombre.trim(), tipo: comTipo, categoria: comCategorias.join(' / '),
        localidad, provincia, telefono: telefono.trim() || null,
        instagram: instagram.trim() || null, descripcion: descripcion.trim(),
        imagen_url: imagenUrl, plan:'free', aprobado:false, activo:false,
      }).select().single();
      if (negErr) throw negErr;
      await supabase.from('perfiles').insert({
        id: regUserId, nombre:`${rNombre} ${rApellido}`.trim(), email: rEmail,
        negocio_id: neg.id, rol:'socio', es_superadmin:false,
      });
      setNegocioId(neg.id);
      setDoneSteps(s => new Set([...s, 1]));
      setObStep(2);
      window.scrollTo(0, 0);
    } catch (err) { setErrors({ _: err?.message || 'Error al guardar, intentá de nuevo.' }); }
    finally { setSaving(false); }
  };

  const step2Save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      if (negocioId) await supabase.from('negocios').update({ plan }).eq('id', negocioId);
      setDoneSteps(s => new Set([...s, 2]));
      setObStep(3);
      window.scrollTo(0, 0);
    } catch {}
    finally { setSaving(false); }
  };

  const step3Save = async () => {
    if (saving || !ofTitulo.trim() || !ofPct) return;
    setSaving(true);
    try {
      if (negocioId) await supabase.from('ofertas').insert({
        negocio_id: negocioId, titulo: ofTitulo.trim(),
        descripcion: ofDesc.trim() || null, descuento_pct: parseInt(ofPct),
        tipo: comTipo, activo: false,
      });
      onComplete();
    } catch { onComplete(); }
    finally { setSaving(false); }
  };

  const NAV_STEPS = [
    { n:1, label:'Mi Empresa',     sub:'Perfil del negocio' },
    { n:2, label:'Cuenta',         sub:'Plan y facturación' },
    { n:3, label:'Primera oferta', sub:'Captá clientes desde el día 1' },
  ];

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', background:OBBG, fontFamily:OBFONT }}>

      {/* ── Sidebar ── */}
      <div style={{ width:240, background:OBNAVY, display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ padding:'24px 20px 18px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize:14, fontWeight:800, color:'#fff', letterSpacing:'-0.01em' }}>gesell.ar</div>
          <div style={{ fontSize:11, color:OBMUTED, marginTop:3 }}>Registro de socio comercial</div>
        </div>
        <nav style={{ padding:'16px 10px', display:'flex', flexDirection:'column', gap:2, flex:1 }}>
          {NAV_STEPS.map(s => {
            const active = obStep === s.n;
            const done   = doneSteps.has(s.n);
            const locked = !done && !active;
            return (
              <div key={s.n} onClick={() => done && setObStep(s.n)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, background: active ? 'rgba(71,91,225,0.2)' : 'transparent', opacity: locked ? 0.38 : 1, cursor: done ? 'pointer' : 'default', transition:'all .15s' }}>
                <div style={{ width:26, height:26, borderRadius:'50%', background: done ? OBGRN : active ? OBP : 'rgba(255,255,255,0.1)', display:'grid', placeItems:'center', flexShrink:0 }}>
                  {done
                    ? <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    : <span style={{ fontSize:11, fontWeight:700, color: active ? '#fff' : OBMUTED }}>{s.n}</span>
                  }
                </div>
                <div>
                  <div style={{ fontSize:12.5, fontWeight: active?700:500, color: active?'#fff': done?OBGRN:OBMUTED }}>{s.label}</div>
                  <div style={{ fontSize:10.5, color:'rgba(255,255,255,0.28)', marginTop:1 }}>{s.sub}</div>
                </div>
              </div>
            );
          })}
        </nav>
        <div style={{ padding:'14px 20px', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize:11, color:OBMUTED, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{rEmail}</div>
          {comTipo && <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', marginTop:2 }}>{comTipo} · {comCategorias[0] || ''}</div>}
        </div>
      </div>

      {/* ── Contenido ── */}
      <div style={{ flex:1, overflow:'auto', padding:'36px 48px' }}>
        <div style={{ maxWidth:660, margin:'0 auto' }}>
          <div style={{ fontSize:11, fontWeight:700, color:OBMUTED, letterSpacing:'0.08em', marginBottom:8 }}>PASO {obStep} DE 3</div>

          {/* ── Paso 1: Mi Empresa ── */}
          {obStep === 1 && (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <div>
                <h1 style={{ margin:'0 0 6px', fontSize:24, fontWeight:800, color:OBINK }}>Tu perfil de negocio</h1>
                <p style={{ margin:0, fontSize:13, color:OBINK2 }}>Esta info aparece en tu ficha pública. Los campos con <span style={{ color:'#ef4444' }}>*</span> son obligatorios.</p>
              </div>

              <OBCard>
                <OBCardTitle label="Identidad" />
                <div style={{ display:'flex', gap:20, alignItems:'flex-start' }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, flexShrink:0 }}>
                    <div onClick={() => logoRef.current?.click()} style={{ width:84, height:84, borderRadius:'50%', border:`2px dashed ${logoPreview?OBP:OBLINE}`, cursor:'pointer', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', background:OBBG }}>
                      {logoPreview
                        ? <img src={logoPreview} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        : <svg width="38" height="38" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="14" r="8" fill={OBLINE}/><path d="M4 38c0-8.837 7.163-16 16-16s16 7.163 16 16" fill={OBLINE}/></svg>
                      }
                    </div>
                    <button type="button" onClick={() => logoRef.current?.click()} style={{ fontSize:11, fontWeight:700, color:OBP, background:'none', border:'none', cursor:'pointer', fontFamily:OBFONT }}>{logoPreview?'Cambiar logo':'Subir logo'}</button>
                    <span style={{ fontSize:10, color:OBMUTED, textAlign:'center', maxWidth:78, lineHeight:1.4 }}>PNG/JPG · sin texto ni gráficas</span>
                    <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoChange} style={{ display:'none' }} />
                  </div>
                  <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12 }}>
                    <div>
                      <label style={lbl}>Nombre del negocio <span style={{ color:'#ef4444' }}>*</span></label>
                      <input value={nombre} onChange={e => { setNombre(e.target.value); setErrors(p => ({...p, nombre:null})); }} style={inpE('nombre')} placeholder="Ej: Hotel La Costa" />
                      <ErrMsg f="nombre" />
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                      {comTipo && <span style={{ padding:'3px 10px', background:OBPS, borderRadius:999, fontSize:11, fontWeight:700, color:OBP }}>{comTipo}</span>}
                      {comCategorias.map(c => <span key={c} style={{ padding:'3px 10px', background:OBPS, borderRadius:999, fontSize:11, fontWeight:700, color:OBP }}>{c}</span>)}
                    </div>
                  </div>
                </div>
              </OBCard>

              <OBCard>
                <OBCardTitle label="Ubicación" />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <div>
                    <label style={lbl}>Provincia <span style={{ color:'#ef4444' }}>*</span></label>
                    <select value={provincia} onChange={e => { setProvincia(e.target.value); setErrors(p => ({...p, provincia:null})); }} style={{ ...inpE('provincia'), cursor:'pointer' }}>
                      <option value="">Seleccioná</option>
                      {OB_PROVINCIAS.map(pr => <option key={pr} value={pr}>{pr}</option>)}
                    </select>
                    <ErrMsg f="provincia" />
                  </div>
                  <div>
                    <label style={lbl}>Localidad <span style={{ color:'#ef4444' }}>*</span></label>
                    <select value={localidad} onChange={e => { setLocalidad(e.target.value); setErrors(p => ({...p, localidad:null})); }} style={{ ...inpE('localidad'), cursor:'pointer' }}>
                      <option value="">Seleccioná</option>
                      {LOCALIDADES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <ErrMsg f="localidad" />
                  </div>
                </div>
              </OBCard>

              <OBCard>
                <OBCardTitle label="Contacto (opcional)" />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <div>
                    <label style={lbl}>Teléfono</label>
                    <input value={telefono} onChange={e => setTelefono(e.target.value)} style={inp} placeholder="+54 2255 000000" />
                  </div>
                  <div>
                    <label style={lbl}>Instagram</label>
                    <input value={instagram} onChange={e => setInstagram(e.target.value)} style={inp} placeholder="@mi.negocio" />
                  </div>
                </div>
              </OBCard>

              <OBCard>
                <OBCardTitle label="Descripción pública *" />
                <label style={lbl}>Contale a tus visitantes brevemente sobre tu negocio</label>
                <textarea value={descripcion} onChange={e => { setDescripcion(e.target.value.slice(0, DESC_MAX)); setErrors(p => ({...p, descripcion:null})); }} rows={4}
                  placeholder="Somos un hotel familiar a media cuadra del mar, con pileta, desayuno y estacionamiento..."
                  style={{ ...inpE('descripcion'), resize:'vertical', minHeight:90 }} />
                <ErrMsg f="descripcion" />
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
                  <span style={{ fontSize:11, color:OBMUTED }}>Mín. {DESC_MIN} · máx. {DESC_MAX} caracteres</span>
                  <span style={{ fontSize:11, color: descripcion.length > DESC_MAX*0.9 ? '#ef4444' : OBMUTED }}>{descripcion.length} / {DESC_MAX}</span>
                </div>
              </OBCard>

              {errors._ && <div style={{ padding:'10px 14px', background:'#fef2f2', borderRadius:10, fontSize:13, color:'#ef4444', fontFamily:OBFONT }}>{errors._}</div>}

              <div style={{ display:'flex', justifyContent:'flex-end', paddingBottom:40 }}>
                <BtnNext onClick={step1Save} label="Siguiente →" />
              </div>
            </div>
          )}

          {/* ── Paso 2: Cuenta ── */}
          {obStep === 2 && (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <div>
                <h1 style={{ margin:'0 0 6px', fontSize:24, fontWeight:800, color:OBINK }}>Elegí tu plan</h1>
                <p style={{ margin:0, fontSize:13, color:OBINK2 }}>Podés empezar gratis y actualizar cuando quieras. El cobro se activa cuando tu ficha sea aprobada.</p>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14 }}>
                {OB_PLANES.map(pl => (
                  <div key={pl.id} onClick={() => setPlan(pl.id)}
                    style={{ background: plan===pl.id ? OBPS : OBCARD, border:`2px solid ${plan===pl.id ? OBP : OBLINE}`, borderRadius:16, padding:'18px 16px', cursor:'pointer', transition:'all .15s', position:'relative' }}>
                    {pl.badge && <div style={{ position:'absolute', top:-11, left:'50%', transform:'translateX(-50%)', background:OBP, color:'#fff', borderRadius:999, padding:'2px 12px', fontSize:10, fontWeight:700, whiteSpace:'nowrap' }}>{pl.badge}</div>}
                    {plan===pl.id && <div style={{ position:'absolute', top:12, right:12, width:18, height:18, borderRadius:'50%', background:OBP, display:'grid', placeItems:'center' }}><svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg></div>}
                    <div style={{ fontWeight:800, fontSize:15, color: plan===pl.id ? OBP : OBINK, marginBottom:4 }}>{pl.label}</div>
                    <div style={{ fontWeight:700, fontSize:17, color: plan===pl.id ? OBP : OBINK, marginBottom:14 }}>{pl.price}</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                      {pl.features.map(f => (
                        <div key={f} style={{ display:'flex', alignItems:'flex-start', gap:7, fontSize:12, color:OBINK2 }}>
                          <div style={{ width:14, height:14, borderRadius:4, background: plan===pl.id ? OBP : OBLINE, display:'grid', placeItems:'center', flexShrink:0, marginTop:1 }}>
                            <svg width="7" height="7" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display:'flex', justifyContent:'flex-end', paddingBottom:40 }}>
                <BtnNext onClick={step2Save} label="Siguiente →" />
              </div>
            </div>
          )}

          {/* ── Paso 3: Primera Oferta ── */}
          {obStep === 3 && (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <div>
                <h1 style={{ margin:'0 0 6px', fontSize:24, fontWeight:800, color:OBINK }}>Cargá tu primera oferta</h1>
                <p style={{ margin:0, fontSize:13, color:OBINK2 }}>Las ofertas aparecen en tu ficha y en el marketplace cuando tu cuenta sea aprobada. Podés editarlas en cualquier momento.</p>
              </div>

              <OBCard>
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  <div>
                    <label style={lbl}>Título de la oferta <span style={{ color:'#ef4444' }}>*</span></label>
                    <input value={ofTitulo} onChange={e => setOfTitulo(e.target.value)} style={inp} placeholder="Ej: Noche + desayuno para 2 personas" />
                  </div>
                  <div>
                    <label style={lbl}>Descuento <span style={{ color:'#ef4444' }}>*</span></label>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <input type="number" min={1} max={99} value={ofPct} onChange={e => setOfPct(e.target.value)} style={{ ...inp, width:110 }} placeholder="20" />
                      <span style={{ fontSize:22, fontWeight:700, color:OBINK2 }}>%</span>
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Descripción breve <span style={{ textTransform:'none', fontWeight:400, color:OBMUTED }}>— opcional</span></label>
                    <textarea value={ofDesc} onChange={e => setOfDesc(e.target.value)} rows={3}
                      placeholder="Qué incluye, condiciones, vigencia..."
                      style={{ ...inp, resize:'vertical', minHeight:70 }} />
                  </div>
                </div>
              </OBCard>

              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingBottom:40 }}>
                <button onClick={onComplete} style={{ fontSize:13, color:OBMUTED, background:'none', border:'none', cursor:'pointer', fontFamily:OBFONT, fontWeight:600 }}>
                  Lo haré más tarde →
                </button>
                <BtnNext onClick={step3Save} disabled={!ofTitulo.trim() || !ofPct} label="Guardar y terminar" />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  PANTALLA LOGIN
// ═══════════════════════════════════════════════════════════════
export default function LoginView({ onLoginSuccess, onBack, onOnboardingComplete, initialTab = 'ingresar' }) {
  const [tab,       setTab]       = useState(initialTab);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [exito,     setExito]     = useState('');

  // ── Ingresar ──
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [recordarme, setRecordarme] = useState(false);

  // ── Registro: paso (1 = cuenta · 2 = ficha comercial) ──
  const [regStep,   setRegStep]   = useState(1);
  const [exitoTipo, setExitoTipo] = useState(null);     // 'visitante' | 'comercial'

  // ── Datos de cuenta (común a visitante y comercial) ──
  const [rNombre,   setRNombre]   = useState('');
  const [rApellido, setRApellido] = useState('');
  const [rEmail,    setREmail]    = useState('');
  const [rPass,     setRPass]     = useState('');
  const [rPass2,    setRPass2]    = useState('');
  const [rShowPass, setRShowPass] = useState(false);
  const [terminos,  setTerminos]  = useState(false);

  // ── Cuenta comercial (checkbox al final del paso 1) ──
  const [esComercial,   setEsComercial]   = useState(false);
  const [comTipo,       setComTipo]       = useState('');   // 'alojamiento' | 'salidas' | 'aventura_relax'
  const [comCategorias, setComCategorias] = useState([]);   // hasta 2 seleccionadas
  const [regUserId,     setRegUserId]     = useState(null); // userId creado en paso 1

  // ── Ficha del negocio (paso 2) ──
  const [negNombre,      setNegNombre]      = useState('');
  const [negLocalidad,   setNegLocalidad]   = useState('');
  const [negDireccion,   setNegDireccion]   = useState('');
  const [negDescripcion, setNegDescripcion] = useState('');
  const [imagenFile,     setImagenFile]     = useState(null);

  // Alojamiento
  const [tamMinM2,       setTamMinM2]       = useState('');
  const [tamMaxM2,       setTamMaxM2]       = useState('');
  const [minHues,        setMinHues]        = useState('');
  const [maxHues,        setMaxHues]        = useState('');
  const [serviciosSelected, setServiciosSelected] = useState([]);
  const [aceptaMascotas, setAceptaMascotas] = useState(false);
  const [aceptaNinos,    setAceptaNinos]    = useState(false);

  // Gastronomía / Salidas
  const [capacidad,      setCapacidad]      = useState('');
  const [tipoCocina,     setTipoCocina]     = useState('');

  // Aventura & Relax
  const [duracion,       setDuracion]       = useState('');
  const [maxPax,         setMaxPax]         = useState('');
  const [sedeFija,       setSedeFija]       = useState('');

  // ── Handlers ─────────────────────────────────────────────────
  const handleIngresar = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      onLoginSuccess();
    } catch {
      setError('Email o contraseña incorrectos. Verificá tus datos.');
    } finally {
      setLoading(false);
    }
  };

  // Paso 1 — datos de cuenta (común). Si es comercial avanza al paso 2;
  // si es visitante, crea la cuenta directamente.
  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    if (!rNombre.trim())   { setError('Ingresá tu nombre.'); return; }
    if (!rApellido.trim()) { setError('Ingresá tu apellido.'); return; }
    if (rPass.length < 6)  { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (rPass !== rPass2)  { setError('Las contraseñas no coinciden.'); return; }
    if (esComercial) {
      if (!comTipo)                { setError('Seleccioná el tipo de tu cuenta comercial.'); return; }
      if (comCategorias.length === 0) { setError('Elegí al menos una categoría de tu negocio.'); return; }
    }
    if (!terminos) { setError('Debés aceptar los términos y condiciones.'); return; }

    setLoading(true);
    try {
      if (esComercial) {
        // Crear cuenta ahora — Supabase envía el mail de verificación automáticamente
        // Si ya creamos la cuenta (volvió del paso 2), reutilizamos el userId
        let uid = regUserId;
        if (!uid) {
          const { data: authData, error: authError } = await supabase.auth.signUp({ email: rEmail, password: rPass });
          if (authError) throw authError;
          uid = authData.user?.id;
          if (!uid) throw new Error('No se pudo crear el usuario');
          setRegUserId(uid);
        }
        setRegStep(2);
        window.scrollTo(0, 0);
      } else {
        // Visitante: crear cuenta
        await registrarTurista({ nombre: rNombre, apellido: rApellido, email: rEmail, password: rPass });
        setExitoTipo('visitante');
      }
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('already')) setError('Ese email ya está registrado. Probá ingresando.');
      else if (msg.includes('30 seconds') || msg.includes('security purposes')) setError('Esperá unos segundos antes de intentar nuevamente.');
      else setError('Hubo un error al crear la cuenta. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Paso 2 — ficha del negocio (solo comercial). Crea usuario + negocio + perfil.
  const handleNegocioSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    if (!negNombre.trim()) { setError('Ingresá el nombre de tu negocio.'); return; }
    if (!negLocalidad)     { setError('Seleccioná la localidad.'); return; }
    setLoading(true);
    try {
      // La cuenta ya fue creada en paso 1 — solo necesitamos el userId
      const userId = regUserId;
      if (!userId) throw new Error('Sesión expirada, volvé al paso anterior.');

      const payload = {
        nombre:    negNombre,
        tipo:      comTipo,
        categoria: comCategorias.join(' / '),
        localidad: negLocalidad,
        plan:      'free',
        aprobado:  false,
        activo:    false,
      };

      const { data: negocio, error: negError } = await supabase
        .from('negocios').insert(payload).select().single();
      if (negError) throw negError;

      await supabase.from('perfiles').insert({
        id:          userId,
        nombre:      `${rNombre} ${rApellido}`.trim(),
        email:       rEmail,
        negocio_id:  negocio.id,
        rol:         'socio',
        es_superadmin: false,
      });

      setExitoTipo('comercial');
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('already')) setError('Ese email ya está registrado. Probá ingresando.');
      else setError(msg || 'Hubo un error. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(''); setLoading(true);
    try { await loginConGoogle(); }
    catch { setError('No se pudo conectar con Google. Intentá de nuevo.'); setLoading(false); }
  };

  const switchTab = (t) => {
    setTab(t); setError(''); setExito(''); setExitoTipo(null); setRegStep(1);
    setEsComercial(false); setComTipo(''); setComCategorias([]); setRegUserId(null);
  };

  // ─── Render ──────────────────────────────────────────────────
  // Onboarding comercial — paso 2 → wizard de 3 pasos en pantalla completa
  if (tab === 'registrarse' && regStep === 2 && esComercial && !exitoTipo) {
    return (
      <OnboardingComercial
        regUserId={regUserId}
        comTipo={comTipo}
        comCategorias={comCategorias}
        rNombre={rNombre}
        rApellido={rApellido}
        rEmail={rEmail}
        onComplete={() => {
          localStorage.setItem('gesell_onboarding_tip', '1');
          onOnboardingComplete?.();
        }}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: A.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 64, paddingBottom: 48, paddingLeft: 20, paddingRight: 20, fontFamily: A.font }}>
      <div style={{ width: '100%', maxWidth: 520, transition: 'max-width .3s' }}>

        {/* Logo */}
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', marginBottom: 32 }}>
          <img src="/logo-cuponera.svg" alt="Cuponear" style={{ height: 44, width: 'auto' }} />
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', color: A.primary, fontFamily: A.font }}>{getSiteName()}</span>
        </button>

        <div>

          {/* Tabs */}
          <div style={{ display: 'flex', background: A.bg, borderRadius: 14, padding: 4, marginBottom: 28, gap: 4 }}>
            {[['ingresar', 'Ingresar'], ['registrarse', 'Registrarse gratis']].map(([key, label]) => (
              <button key={key} onClick={() => switchTab(key)}
                style={{
                  flex: 1, padding: '10px 0', border: 'none', borderRadius: 11, cursor: 'pointer',
                  fontSize: 14, fontWeight: 700, fontFamily: A.font, transition: 'all .2s',
                  background: tab === key ? A.primary : 'transparent',
                  color: tab === key ? '#fff' : A.muted,
                  boxShadow: tab === key ? '0 2px 10px rgba(37,69,230,0.25)' : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Mensajes */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 11, padding: '12px 14px', marginBottom: 20, fontSize: 13, color: '#B91C1C', fontFamily: A.font }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
            </div>
          )}
          {exito && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 11, padding: '12px 14px', marginBottom: 20, fontSize: 13, color: '#166534', fontFamily: A.font }}>
              <Check size={15} style={{ flexShrink: 0, marginTop: 1 }} /> {exito}
            </div>
          )}

          {/* ══ INGRESAR ══ */}
          {tab === 'ingresar' && (
            <form onSubmit={handleIngresar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Campo label="Email" type="email" value={email} onChange={setEmail} placeholder="tu@email.com" icon={<Mail size={15} />} required />
              <Campo label="Contraseña" type={showPass ? 'text' : 'password'} value={password} onChange={setPassword} placeholder="••••••••"
                icon={<Lock size={15} />} required
                rightEl={<button type="button" onClick={() => setShowPass(s => !s)} style={{ background: 'none', border: 'none', color: A.muted, cursor: 'pointer', display: 'flex' }}>{showPass ? <EyeOff size={17} /> : <Eye size={17} />}</button>}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: -4 }}>
                <div onClick={() => setRecordarme(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ width: 18, height: 18, borderRadius: 999, border: `2px solid ${recordarme ? A.primary : A.line}`, background: recordarme ? A.primary : '#fff', display: 'grid', placeItems: 'center', transition: 'all .15s', flexShrink: 0 }}>
                    {recordarme && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                  </div>
                  <span style={{ fontSize: 13, color: A.ink2, fontFamily: A.font }}>Recordarme</span>
                </div>
                <button type="button" style={{ background: 'none', border: 'none', fontSize: 13, color: A.primary, fontWeight: 600, cursor: 'pointer', fontFamily: A.font }}>¿Olvidaste tu contraseña?</button>
              </div>
              <BtnSubmit loading={loading} label="Ingresar" loadingLabel="Ingresando..." />
              <Divisor />
              <BtnGoogle onClick={handleGoogle} loading={loading} />
            </form>
          )}

          {/* ══ REGISTRARSE ══ */}
          {tab === 'registrarse' && (
            <div>

              {/* ── PASO 1 — Datos de cuenta (común a todos) ── */}
              {!exitoTipo && regStep === 1 && (
                <form onSubmit={handleAccountSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Campo label="Nombre" value={rNombre} onChange={setRNombre} placeholder="Sofía" icon={<User size={15} />} required />
                    <Campo label="Apellido" value={rApellido} onChange={setRApellido} placeholder="García" required />
                  </div>
                  <Campo label="Email" type="email" value={rEmail} onChange={setREmail} placeholder="tu@email.com" icon={<Mail size={15} />} required />
                  <Campo label="Contraseña" type={rShowPass ? 'text' : 'password'} value={rPass} onChange={setRPass} placeholder="Mínimo 6 caracteres"
                    icon={<Lock size={15} />} required
                    rightEl={<button type="button" onClick={() => setRShowPass(s => !s)} style={{ background: 'none', border: 'none', color: A.muted, cursor: 'pointer', display: 'flex' }}>{rShowPass ? <EyeOff size={17} /> : <Eye size={17} />}</button>}
                  />
                  <Campo label="Repetir contraseña" type={rShowPass ? 'text' : 'password'} value={rPass2} onChange={setRPass2} placeholder="Repetí tu contraseña" icon={<Lock size={15} />} required />

                  {/* ── Cuenta comercial (checkbox) ── */}
                  <div style={{ border: `1.5px solid ${esComercial ? A.primary : A.line}`, borderRadius: 14, background: esComercial ? A.primarySoft : '#fff', padding: esComercial ? '16px 16px 18px' : '14px 16px', transition: 'all .18s' }}>
                    <div onClick={() => { setEsComercial(v => !v); setError(''); }} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', userSelect: 'none' }}>
                      <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${esComercial ? A.primary : A.line}`, background: esComercial ? A.primary : '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1, transition: 'all .15s' }}>
                        {esComercial && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Store size={16} color={esComercial ? A.primary : A.ink2} />
                          <span style={{ fontSize: 14, fontWeight: 700, color: esComercial ? A.primary : A.ink, fontFamily: A.font }}>Es una cuenta comercial</span>
                        </div>
                        <div style={{ fontSize: 12.5, color: A.muted, marginTop: 4, lineHeight: 1.5, fontFamily: A.font }}>
                          Activala si tenés un negocio. Así vas a poder <strong style={{ color: A.ink2 }}>publicar promociones</strong> y crear tu ficha en Cuponear.
                        </div>
                      </div>
                    </div>

                    {/* Tipo + categoría — solo si es comercial */}
                    {esComercial && (
                      <div style={{ marginTop: 16 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: A.ink2, marginBottom: 8, fontFamily: A.font }}>¿Qué tipo de negocio? <span style={{ color: A.red }}>*</span></div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                          {TIPOS_COMERCIO.map(t => {
                            const sel = comTipo === t.id;
                            return (
                              <button key={t.id} type="button"
                                onClick={() => { setComTipo(t.id); setComCategorias([]); setError(''); }}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 6px', border: `1.5px solid ${sel ? A.primary : A.line}`, borderRadius: 12, cursor: 'pointer', background: sel ? '#fff' : A.bg, transition: 'all .15s', fontFamily: A.font, textAlign: 'center' }}
                              >
                                <t.Icon size={22} color={sel ? A.primary : A.ink2} />
                                <div>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: sel ? A.primary : A.ink }}>{t.label}</div>
                                  <div style={{ fontSize: 9.5, color: A.muted, marginTop: 2, lineHeight: 1.3, whiteSpace: 'pre-line' }}>{t.sub}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Categoría / industria */}
                        {comTipo && (
                          <div style={{ marginTop: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: A.ink2, fontFamily: A.font }}>Categoría / industria <span style={{ color: A.red }}>*</span></div>
                              <div style={{ fontSize: 11, color: A.muted, fontFamily: A.font }}>Elegí hasta 2</div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {CATS[comTipo].map(c => {
                                const sel = comCategorias.includes(c);
                                const maxed = !sel && comCategorias.length >= 2;
                                return (
                                  <button key={c} type="button"
                                    onClick={() => {
                                      if (maxed) return;
                                      setComCategorias(prev => sel ? prev.filter(x => x !== c) : [...prev, c]);
                                      setError('');
                                    }}
                                    style={{ padding: '6px 12px', border: `1px solid ${sel ? A.primary : A.line}`, borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: maxed ? 'not-allowed' : 'pointer', background: sel ? A.primary : '#fff', color: sel ? '#fff' : maxed ? A.muted : A.ink2, fontFamily: A.font, transition: 'all .15s', opacity: maxed ? 0.5 : 1 }}
                                  >
                                    {c}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Terminos checked={terminos} onChange={setTerminos} />
                  <BtnSubmit loading={loading} label={esComercial ? 'Continuar' : 'Crear mi cuenta'} loadingLabel={esComercial ? 'Continuando...' : 'Creando cuenta...'} />
                  {!esComercial && (
                    <>
                      <Divisor />
                      <BtnGoogle onClick={handleGoogle} loading={loading} label="Registrarse con Google" />
                    </>
                  )}
                </form>
              )}

              {/* ── PASO 2 — Ficha del negocio (comercial) ── */}
              {/* paso 2 → se renderiza como OnboardingComercial antes del return */}

              {/* ── Éxito ── */}
              {exitoTipo && (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Check size={28} color={A.green} />
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: A.ink, margin: '0 0 8px', fontFamily: A.font }}>¡Bienvenido/a a Cuponear!</h2>
                  <p style={{ fontSize: 14, color: A.muted, lineHeight: 1.6, fontFamily: A.font, margin: '0 0 24px' }}>
                    {exitoTipo === 'visitante'
                      ? 'Te enviamos un email de confirmación. Una vez confirmado vas a poder explorar todas las ofertas.'
                      : 'Revisamos tu ficha y te avisamos por email cuando esté activa — generalmente en menos de 48 hs.'}
                  </p>
                  {exitoTipo === 'visitante'
                    ? <button onClick={() => onBack && onBack()} style={{ background: A.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: A.font }}>
                        Empezar a explorar
                      </button>
                    : <button onClick={() => switchTab('ingresar')} style={{ background: A.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: A.font }}>
                        Ingresar
                      </button>
                  }
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: 12, color: A.muted, marginTop: 20, lineHeight: 1.6, fontFamily: A.font }}>
          ¿Tenés dudas sobre cómo funciona?{' '}
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: A.primary, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: A.font }}>
            Contactar al equipo
          </button>
        </p>
      </div>

      {/* ── Responsive ── */}
      <style>{`
        /* Mobile: sin card, contenido al aire con buen aire */
        @media (max-width: 600px) {
          .login-card {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
