// ============================================================
//  src/views/LoginView.jsx
// ============================================================
import React, { useState, useRef } from 'react';
import { Eye, EyeOff, AlertCircle, Check, Mail, Lock, User, Store, Hotel, UtensilsCrossed, Sparkles, ChevronRight } from 'lucide-react';
import { login, registrarTurista, loginConGoogle } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { registrarIntentoPagoTarjeta } from '../lib/planes';
import PlanPicker from '../components/PlanPicker';

// ─── Helpers ─────────────────────────────────────────────────
function getSiteName() {
  if (typeof window === 'undefined') return 'gesell.ar';
  const h = window.location.hostname.replace('www.', '');
  return h === 'localhost' ? 'gesell.ar' : h;
}

// ─── Taxonomía de cuentas comerciales ───────────────────────
const LOCALIDADES = ['Villa Gesell', 'Mar de las Pampas', 'Las Gaviotas', 'Mar Azul'];

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

const SERVICIOS_ALOJ = [
  'WiFi', 'Estacionamiento', 'Pileta', 'Desayuno incluido',
  'Aire acondicionado', 'Calefacción', 'Cocina equipada', 'Parrilla',
  'Lavarropas', 'Secador de cabello', 'TV Smart', 'Ropa de cama',
  'Toallas incluidas', 'Caja fuerte', 'Recepción 24 hs', 'Terraza / Balcón',
  'Vista al mar', 'Bicicletas', 'Jardín / Patio', 'Servicio de limpieza',
];

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

const OB_PAISES = ['Argentina','Uruguay','Chile','Brasil','Paraguay','Bolivia','Otro'];
const COD_PAISES = ['+54','+598','+56','+55','+595','+591','+1','+34','+39','+44'];

// Copy/pricing de planes vive en src/lib/planes.js y se renderiza vía <PlanPicker />

// Componentes a nivel de módulo — NO definir dentro del componente
// (si se recrean en cada render, React remonta los inputs y se pierde el foco al tipear)
const ErrMsg = ({ msg }) => msg ? <span style={{ fontSize:11, color:'#ef4444', marginTop:3, display:'block', fontFamily:OBFONT }}>{msg}</span> : null;
const OBCard = ({ children, style }) => (
  <div style={{ background:OBCARD, borderRadius:16, border:`1px solid ${OBLINE}`, padding:20, ...style }}>{children}</div>
);
const OBCardTitle = ({ label }) => (
  <div style={{ fontSize:13, fontWeight:700, color:OBINK, marginBottom:14, paddingBottom:10, borderBottom:`1px solid ${OBLINE}` }}>{label}</div>
);
const BtnNext = ({ onClick, disabled, label, saving }) => (
  <button onClick={onClick} disabled={disabled || saving}
    style={{ display:'flex', alignItems:'center', gap:8, background:(disabled||saving)?OBMUTED:OBP, color:'#fff', border:'none', borderRadius:12, padding:'13px 28px', fontFamily:OBFONT, fontSize:14, fontWeight:700, cursor:(disabled||saving)?'not-allowed':'pointer', boxShadow:'0 4px 14px rgba(71,91,225,0.25)', transition:'background .15s' }}>
    {saving ? 'Guardando...' : label}
  </button>
);

function OnboardingComercial({ regUserId, rNombre, rApellido, rEmail, onComplete }) {
  const [obStep,    setObStep]    = useState(1);
  const [doneSteps, setDoneSteps] = useState(new Set());
  // Rubro (alojamiento/salidas/aventura & relax) + categoría — encabezado del form
  const [tipoNeg, setTipoNeg] = useState('');
  const [catsNeg, setCatsNeg] = useState([]);
  const toggleCat = (c) => setCatsNeg(prev =>
    prev.includes(c) ? prev.filter(x => x !== c) : (prev.length >= 2 ? prev : [...prev, c])
  );
  // Empresa
  const [nombre,      setNombre]      = useState('');
  // Contacto
  const [email,       setEmail]       = useState(rEmail || '');
  const [telFijoCod,  setTelFijoCod]  = useState('+54');
  const [telFijoNum,  setTelFijoNum]  = useState('');
  const [telMovilCod, setTelMovilCod] = useState('+54');
  const [telMovilNum, setTelMovilNum] = useState('');
  const [instagram,   setInstagram]   = useState('');
  const [facebook,    setFacebook]    = useState('');
  const [tiktok,      setTiktok]      = useState('');
  // Ubicación
  const [pais,        setPais]        = useState('Argentina');
  const [provincia,   setProvincia]   = useState('');
  const [localidad,   setLocalidad]   = useState('');
  const [codPostal,   setCodPostal]   = useState('');
  const [calle,       setCalle]       = useState('');
  const [numero,      setNumero]      = useState('');
  const [piso,        setPiso]        = useState('');
  const [depto,       setDepto]       = useState('');
  const [entreCalles, setEntreCalles] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile,    setLogoFile]    = useState(null);
  const logoRef = useRef();
  // Cuenta
  const [plan, setPlan] = useState(null);
  const [datosTarjetaPlus, setDatosTarjetaPlus] = useState(null);
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

  const handleLogoChange = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    setLogoFile(f);
    const reader = new FileReader();
    reader.onload = ev => setLogoPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const validate1 = () => {
    const e = {};
    if (!tipoNeg)                 e.tipo        = 'Elegí el rubro de tu negocio';
    if (catsNeg.length === 0)     e.categorias  = 'Elegí al menos una categoría';
    if (!nombre.trim())           e.nombre      = 'Campo requerido';
    if (!provincia)               e.provincia   = 'Campo requerido';
    if (!localidad)               e.localidad   = 'Campo requerido';
    if (!email.trim())            e.email       = 'Campo requerido';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) e.email = 'Email inválido';
    if (!telMovilNum.trim())      e.telMovil    = 'Campo requerido';
    if (!codPostal.trim())        e.codPostal   = 'Campo requerido';
    if (!calle.trim())            e.calle       = 'Campo requerido';
    if (!numero.trim())           e.numero      = 'Campo requerido';
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
        nombre: nombre.trim(), tipo: tipoNeg, categoria: catsNeg.join(' / '),
        email: email.trim() || null,
        tel_fijo_cod: telFijoNum.trim() ? telFijoCod : null, tel_fijo_num: telFijoNum.trim() || null,
        tel_movil_cod: telMovilNum.trim() ? telMovilCod : null, tel_movil_num: telMovilNum.trim() || null,
        instagram: instagram.trim() || null, facebook: facebook.trim() || null, tiktok: tiktok.trim() || null,
        pais, provincia, localidad, cod_postal: codPostal.trim() || null,
        calle: calle.trim() || null, numero: numero.trim() || null, piso: piso.trim() || null,
        depto: depto.trim() || null, entre_calles: entreCalles.trim() || null,
        descripcion: descripcion.trim(),
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
    if (saving || !plan) return;
    setSaving(true);
    try {
      if (negocioId) {
        if (plan === 'plus' && datosTarjetaPlus) {
          await registrarIntentoPagoTarjeta(negocioId, datosTarjetaPlus);
        } else {
          await supabase.from('negocios').update({ plan: 'free' }).eq('id', negocioId);
        }
      }
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
        tipo: tipoNeg, activo: false,
      });
      onComplete();
    } catch { onComplete(); }
    finally { setSaving(false); }
  };

  const NAV_STEPS = [
    { n:1, label:'Mi Empresa',     sub:'Perfil del negocio' },
    { n:2, label:'Cuenta',         sub:'Planes para socios' },
    { n:3, label:'Primera oferta', sub:'Captá clientes desde el día 1' },
  ];

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', background:OBBG, fontFamily:OBFONT }}>

      {/* ── Sidebar (mismo estilo que el panel admin) ── */}
      <div style={{ width:230, minWidth:230, background:OBNAVY, display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ padding:'20px 0 16px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
          <img src="/logo-cuponera-wh.svg" alt="Cuponera" style={{ width:180, height:'auto', display:'block' }} />
          <div style={{ fontSize:10.5, color:OBMUTED, fontWeight:600, letterSpacing:'0.04em' }}>Registro de socio</div>
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
          {tipoNeg && <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', marginTop:2 }}>{tipoNeg}{catsNeg[0] ? ` · ${catsNeg[0]}` : ''}</div>}
        </div>
      </div>

      {/* ── Contenido (mismo ancho/padding que el panel) ── */}
      <div style={{ flex:1, overflow:'auto', padding:28 }}>
        <div style={{ maxWidth:740 }}>
          <div style={{ fontSize:11, fontWeight:700, color:OBMUTED, letterSpacing:'0.08em', marginBottom:8 }}>PASO {obStep} DE 3</div>

          {/* ── Paso 1: Mi Empresa ── */}
          {obStep === 1 && (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <div>
                <h1 style={{ margin:'0 0 6px', fontSize:24, fontWeight:800, color:OBINK }}>Tu perfil de negocio</h1>
                <p style={{ margin:0, fontSize:13, color:OBINK2 }}>Esta info aparece en tu ficha pública. Los campos con <span style={{ color:'#ef4444' }}>*</span> son obligatorios.</p>
              </div>

              <OBCard>
                <OBCardTitle label="Rubro de tu negocio" />
                <label style={lbl}>Tipo <span style={{ color:'#ef4444' }}>*</span></label>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                  {TIPOS_COMERCIO.map(t => {
                    const sel = tipoNeg === t.id;
                    return (
                      <button key={t.id} type="button"
                        onClick={() => { setTipoNeg(t.id); setCatsNeg([]); setErrors(p => ({ ...p, tipo:null, categorias:null })); }}
                        style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:12, cursor:'pointer', fontFamily:OBFONT, fontSize:13, fontWeight:700,
                          border:`1.5px solid ${sel?OBP:OBLINE}`, background:sel?OBPS:'#fff', color:sel?OBP:OBINK2, transition:'all .15s' }}>
                        <t.Icon size={16} /> {t.label}
                      </button>
                    );
                  })}
                </div>
                <ErrMsg msg={errors.tipo} />

                {tipoNeg && (
                  <div style={{ marginTop:16 }}>
                    <label style={lbl}>Categorías — elegí hasta 2 <span style={{ color:'#ef4444' }}>*</span></label>
                    <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                      {CATS[tipoNeg].map(c => {
                        const sel = catsNeg.includes(c);
                        const maxed = !sel && catsNeg.length >= 2;
                        return (
                          <button key={c} type="button" disabled={maxed}
                            onClick={() => { toggleCat(c); setErrors(p => ({ ...p, categorias:null })); }}
                            style={{ padding:'7px 13px', borderRadius:999, fontFamily:OBFONT, fontSize:12, fontWeight:600,
                              cursor: maxed ? 'not-allowed' : 'pointer', opacity: maxed ? 0.45 : 1,
                              border:`1.5px solid ${sel?OBP:OBLINE}`, background:sel?OBP:'#fff', color:sel?'#fff':OBINK2, transition:'all .15s' }}>
                            {c}
                          </button>
                        );
                      })}
                    </div>
                    <ErrMsg msg={errors.categorias} />
                  </div>
                )}
              </OBCard>

              <OBCard>
                <div style={{ display:'flex', gap:20, alignItems:'flex-start' }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, flexShrink:0 }}>
                    <div onClick={() => logoRef.current?.click()} style={{ width:168, height:168, borderRadius:20, border:`2px dashed ${logoPreview?OBP:OBLINE}`, cursor:'pointer', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', background:OBBG }}>
                      {logoPreview
                        ? <img src={logoPreview} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        : (
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                            <div style={{ width:56, height:56, borderRadius:14, background:OBLINE, display:'grid', placeItems:'center' }}>
                              <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M4 20V6a2 2 0 0 1 2-2h6l2 2h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" stroke={OBMUTED} strokeWidth="1.6" strokeLinejoin="round"/></svg>
                            </div>
                            <span style={{ fontSize:12, fontWeight:700, color:OBMUTED, fontFamily:OBFONT }}>Mi empresa</span>
                          </div>
                        )
                      }
                    </div>
                    <button type="button" onClick={() => logoRef.current?.click()} style={{ fontSize:11, fontWeight:700, color:OBP, background:'none', border:'none', cursor:'pointer', fontFamily:OBFONT }}>{logoPreview?'Cambiar logo':'Subir logo'}</button>
                    <span style={{ fontSize:10, color:OBMUTED, textAlign:'center', maxWidth:120, lineHeight:1.4 }}>PNG/JPG · sin texto ni gráficas · opcional</span>
                    <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoChange} style={{ display:'none' }} />
                  </div>
                  <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12 }}>
                    <div>
                      <label style={lbl}>Nombre del negocio <span style={{ color:'#ef4444' }}>*</span></label>
                      <input value={nombre} onChange={e => { setNombre(e.target.value); setErrors(p => ({...p, nombre:null})); }} style={inpE('nombre')} placeholder="Ej: Hotel La Costa" />
                      <ErrMsg msg={errors.nombre} />
                    </div>
                    <div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
                        <label style={lbl}>Acerca de tu negocio:</label>
                        <span style={{ fontSize:11, color:OBMUTED, fontFamily:OBFONT, fontWeight:600 }}>Mínimo: {DESC_MIN} caracteres</span>
                      </div>
                      <textarea value={descripcion} onChange={e => { setDescripcion(e.target.value.slice(0, DESC_MAX)); setErrors(p => ({...p, descripcion:null})); }} rows={4}
                        placeholder="Ej: Somos un hotel familiar a media cuadra del mar, con pileta, desayuno y estacionamiento..."
                        style={{ ...inpE('descripcion'), resize:'vertical', minHeight:90 }} />
                      <ErrMsg msg={errors.descripcion} />
                      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:5 }}>
                        <span style={{ fontSize:15, fontWeight:700, color: descripcion.length > DESC_MAX*0.9 ? '#ef4444' : OBMUTED }}>{descripcion.length} / {DESC_MAX}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </OBCard>

              <OBCard>
                <OBCardTitle label="Contacto" />
                {/* Email — pre-cargado, requerido */}
                <div style={{ marginBottom:14 }}>
                  <label style={lbl}>Email <span style={{ color:'#ef4444' }}>*</span></label>
                  <input type="email" value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({...p, email:null})); }} style={inpE('email')} placeholder="contacto@minegocio.com" />
                  <ErrMsg msg={errors.email} />
                </div>
                {/* Teléfonos */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                  <div>
                    <label style={lbl}>Teléfono fijo</label>
                    <div style={{ display:'flex', gap:6 }}>
                      <select value={telFijoCod} onChange={e => setTelFijoCod(e.target.value)} style={{ ...inp, width:78, flexShrink:0, cursor:'pointer' }}>
                        {COD_PAISES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input value={telFijoNum} onChange={e => setTelFijoNum(e.target.value)} style={inp} placeholder="2255 432100" />
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Línea móvil <span style={{ color:'#ef4444' }}>*</span></label>
                    <div style={{ display:'flex', gap:6 }}>
                      <select value={telMovilCod} onChange={e => setTelMovilCod(e.target.value)} style={{ ...inp, width:78, flexShrink:0, cursor:'pointer' }}>
                        {COD_PAISES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input value={telMovilNum} onChange={e => { setTelMovilNum(e.target.value); setErrors(p => ({...p, telMovil:null})); }} style={inpE('telMovil')} placeholder="2255 11223344" />
                    </div>
                    <ErrMsg msg={errors.telMovil} />
                  </div>
                </div>
                {/* Redes */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
                  <div>
                    <label style={lbl}>Instagram</label>
                    <input value={instagram} onChange={e => setInstagram(e.target.value)} style={inp} placeholder="@mi.negocio" />
                  </div>
                  <div>
                    <label style={lbl}>Facebook</label>
                    <input value={facebook} onChange={e => setFacebook(e.target.value)} style={inp} placeholder="/mi.negocio" />
                  </div>
                  <div>
                    <label style={lbl}>TikTok</label>
                    <input value={tiktok} onChange={e => setTiktok(e.target.value)} style={inp} placeholder="@mi.negocio" />
                  </div>
                </div>
              </OBCard>

              <OBCard>
                <OBCardTitle label="Ubicación" />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                  <div>
                    <label style={lbl}>País <span style={{ color:'#ef4444' }}>*</span></label>
                    <select value={pais} onChange={e => setPais(e.target.value)} style={{ ...inp, cursor:'pointer' }}>
                      {OB_PAISES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Provincia <span style={{ color:'#ef4444' }}>*</span></label>
                    <select value={provincia} onChange={e => { setProvincia(e.target.value); setErrors(p => ({...p, provincia:null})); }} style={{ ...inpE('provincia'), cursor:'pointer' }}>
                      <option value="">Seleccioná</option>
                      {OB_PROVINCIAS.map(pr => <option key={pr} value={pr}>{pr}</option>)}
                    </select>
                    <ErrMsg msg={errors.provincia} />
                  </div>
                  <div>
                    <label style={lbl}>Localidad <span style={{ color:'#ef4444' }}>*</span></label>
                    <select value={localidad} onChange={e => { setLocalidad(e.target.value); setErrors(p => ({...p, localidad:null})); }} style={{ ...inpE('localidad'), cursor:'pointer' }}>
                      <option value="">Seleccioná</option>
                      {LOCALIDADES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <ErrMsg msg={errors.localidad} />
                  </div>
                  <div>
                    <label style={lbl}>Código postal <span style={{ color:'#ef4444' }}>*</span></label>
                    <input value={codPostal} onChange={e => { setCodPostal(e.target.value); setErrors(p => ({...p, codPostal:null})); }} style={inpE('codPostal')} placeholder="7165" />
                    <ErrMsg msg={errors.codPostal} />
                  </div>
                </div>
                {/* Domicilio */}
                <label style={lbl}>Domicilio <span style={{ color:'#ef4444' }}>*</span></label>
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:14, marginBottom:2 }}>
                  <div>
                    <input value={calle} onChange={e => { setCalle(e.target.value); setErrors(p => ({...p, calle:null})); }} style={inpE('calle')} placeholder="Calle / Avenida" />
                    <ErrMsg msg={errors.calle} />
                  </div>
                  <div>
                    <input value={numero} onChange={e => { setNumero(e.target.value); setErrors(p => ({...p, numero:null})); }} style={inpE('numero')} placeholder="Número o referencia" />
                    <ErrMsg msg={errors.numero} />
                  </div>
                </div>
                <div style={{ marginBottom:8 }} />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 2fr', gap:14 }}>
                  <input value={piso} onChange={e => setPiso(e.target.value)} style={inp} placeholder="Piso" />
                  <input value={depto} onChange={e => setDepto(e.target.value)} style={inp} placeholder="Depto" />
                  <input value={entreCalles} onChange={e => setEntreCalles(e.target.value)} style={inp} placeholder="Entre calles" />
                </div>
              </OBCard>

              {errors._ && <div style={{ padding:'10px 14px', background:'#fef2f2', borderRadius:10, fontSize:13, color:'#ef4444', fontFamily:OBFONT }}>{errors._}</div>}

              <div style={{ display:'flex', justifyContent:'center', paddingBottom:40 }}>
                <BtnNext onClick={step1Save} saving={saving} label="Siguiente →" />
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

              <PlanPicker
                value={plan}
                primaryColor={OBP}
                saving={saving}
                onConfirmFree={() => { setPlan('free'); setDatosTarjetaPlus(null); }}
                onConfirmPlus={datos => { setPlan('plus'); setDatosTarjetaPlus(datos); }}
              />

              <div style={{ display:'flex', justifyContent:'center', paddingBottom:40 }}>
                <BtnNext onClick={step2Save} saving={saving} disabled={!plan} label="Siguiente →" />
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

              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, paddingBottom:40 }}>
                <BtnNext onClick={step3Save} saving={saving} disabled={!ofTitulo.trim() || !ofPct} label="Guardar y terminar" />
                <button onClick={onComplete} style={{ fontSize:13, color:OBMUTED, background:'none', border:'none', cursor:'pointer', fontFamily:OBFONT, fontWeight:600 }}>
                  Lo haré más tarde →
                </button>
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
    <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 56, paddingBottom: 48, paddingLeft: 20, paddingRight: 20, fontFamily: A.font, position: 'relative', overflow: 'hidden' }}>

        {/* Formas abstractas etéreas de fondo */}
        <div aria-hidden style={{ position: 'absolute', top: '-12%', left: '-8%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, rgba(71,91,225,0.22), rgba(71,91,225,0) 70%)', filter: 'blur(20px)', pointerEvents: 'none' }} />
        <div aria-hidden style={{ position: 'absolute', bottom: '-15%', right: '-10%', width: 540, height: 540, borderRadius: '50%', background: 'radial-gradient(circle at 60% 40%, rgba(255,90,138,0.18), rgba(255,90,138,0) 70%)', filter: 'blur(20px)', pointerEvents: 'none' }} />
        <div aria-hidden style={{ position: 'absolute', top: '40%', right: '12%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(125,211,252,0.16), rgba(125,211,252,0) 70%)', filter: 'blur(16px)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 480, transition: 'max-width .3s', position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', marginBottom: 22 }}>
          <img src="/logo-cuponera.svg" alt="Cuponear" style={{ height: 42, width: 'auto' }} />
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', color: A.primary, fontFamily: A.font }}>{getSiteName()}</span>
        </button>

        <div className="login-card" style={{ background: '#fff', border: `1px solid ${A.line}`, borderRadius: 24, padding: '30px 30px 26px', boxShadow: '0 24px 70px -28px rgba(15,23,42,0.28), 0 2px 8px rgba(15,23,42,0.04)' }}>

          {/* Tabs — segmented control (no es CTA) */}
          <div style={{ display: 'flex', background: '#f1f3f9', borderRadius: 12, padding: 4, marginBottom: 26, gap: 4 }}>
            {[['ingresar', 'Ingresar'], ['registrarse', 'Registrarse']].map(([key, label]) => (
              <button key={key} onClick={() => switchTab(key)}
                style={{
                  flex: 1, padding: '10px 0', border: 'none', borderRadius: 9, cursor: 'pointer',
                  fontSize: 14, fontWeight: 700, fontFamily: A.font, transition: 'all .2s',
                  background: tab === key ? '#fff' : 'transparent',
                  color: tab === key ? A.primary : A.muted,
                  boxShadow: tab === key ? '0 1px 3px rgba(15,23,42,0.12)' : 'none',
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
                          Activala si tenés un negocio. Así vas a poder <strong style={{ color: A.ink2 }}>crear cupones de descuento</strong> para tus clientes y armar tu ficha en Cuponear. El rubro exacto (alojamiento, salidas o aventura &amp; relax) lo elegís después, desde tu panel.
                        </div>
                      </div>
                    </div>
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
