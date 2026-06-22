// ============================================================
//  src/views/PublicarOfertaView.jsx
//  Formulario de 3 pasos para publicar una oferta como socio
// ============================================================
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../lib/supabase';
import { login } from '../lib/auth';

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ─── Paleta ────────────────────────────────────────────────
const A = {
  ink:         '#0B1020',
  ink2:        '#3D4255',
  muted:       '#6B7280',
  line:        '#E7E9EE',
  primary:     '#2545E6',
  primarySoft: '#EEF1FF',
  bg:          '#F7F7F8',
  green:       '#116b3c',
  greenBg:     '#eaf4ee',
  red:         '#b82828',
  redBg:       '#fceaea',
  font:        "'Geist', system-ui, sans-serif",
};

// ─── Datos estáticos ────────────────────────────────────────
const CATS = {
  alojamiento:   ['Hotel', 'Cabaña', 'Departamento', 'Domo', 'Dormi', 'Carpa', 'Glamping'],
  salidas:       ['Restaurantes', 'Bares', 'Cafés & Dulces', 'Heladerías', 'Panaderías', 'Discotecas', 'Cines y Teatros', 'Shows y Recitales', 'Centros Culturales', 'Otros'],
  aventura_relax: ['Deportes acuáticos', 'Cabalgatas', 'Kitesurf', 'Yoga / Bienestar', 'Masajes a domicilio', 'Tour fotográfico', 'Pesca deportiva', 'Senderismo', 'Espectáculos'],
};

const LOCALIDADES = ['Villa Gesell', 'Mar de las Pampas', 'Las Gaviotas', 'Mar Azul'];

const CONDICIONES_BASE = [
  { id: 'tarifa', label: 'Aplicable solo a tarifa estándar', sub: 'No válido para feriados ni tarifas especiales' },
  { id: 'disponibilidad', label: 'Sujeto a disponibilidad', sub: 'Puede no estar disponible en fechas de alta demanda' },
  { id: 'anticipada', label: 'Válido con reserva anticipada', sub: 'Requiere reservar con al menos 48 hs de anticipación' },
  { id: 'acumulable', label: 'No acumulable con otras promociones', sub: 'No se puede combinar con otros descuentos activos' },
];

const CONDICIONES_SALIDAS = [
  { id: 'menu', label: 'Aplica solo al menú regular', sub: 'No válido para menús especiales ni fechas festivas' },
  { id: 'preventa', label: 'Con reserva previa obligatoria', sub: 'Debe reservarse mesa con al menos 2 hs de anticipación' },
];

const CONDICIONES_AVENTURA = [
  { id: 'clima', label: 'Sujeto a condiciones climáticas', sub: 'Puede reprogramarse por mal tiempo' },
  { id: 'grupo', label: 'Mínimo de participantes requerido', sub: 'La actividad requiere un mínimo de personas para realizarse' },
];

// ─── Centro de Villa Gesell ─────────────────────────────────
const MAP_CENTER = [-37.2637, -56.9738];
const MAP_ZOOM   = 13;

// ─── Componente mapa con click ──────────────────────────────
function MapPicker({ position, onChange }) {
  useMapEvents({
    click(e) { onChange([e.latlng.lat, e.latlng.lng]); },
  });
  return position ? <Marker position={position} /> : null;
}

// ─── Helpers UI ────────────────────────────────────────────
function Label({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: A.muted, marginBottom: 6, fontFamily: A.font }}>
      {children}
    </div>
  );
}

function Input({ style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%', padding: '10px 14px', background: focused ? '#fff' : A.bg,
        border: `1px solid ${focused ? A.primary : A.line}`, borderRadius: 10,
        fontFamily: A.font, fontSize: 14, color: A.ink, outline: 'none',
        transition: 'border 0.15s, background 0.15s', boxSizing: 'border-box',
        ...style,
      }}
      {...props}
    />
  );
}

function Textarea({ style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%', padding: '10px 14px', background: focused ? '#fff' : A.bg,
        border: `1px solid ${focused ? A.primary : A.line}`, borderRadius: 10,
        fontFamily: A.font, fontSize: 14, color: A.ink, outline: 'none',
        transition: 'border 0.15s, background 0.15s', resize: 'vertical',
        minHeight: 80, boxSizing: 'border-box',
        ...style,
      }}
      {...props}
    />
  );
}

function Select({ style, children, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%', padding: '10px 14px', background: focused ? '#fff' : A.bg,
        border: `1px solid ${focused ? A.primary : A.line}`, borderRadius: 10,
        fontFamily: A.font, fontSize: 14, color: A.ink, outline: 'none',
        transition: 'border 0.15s, background 0.15s', boxSizing: 'border-box',
        ...style,
      }}
      {...props}
    >
      {children}
    </select>
  );
}

function CharCount({ value, max }) {
  const len = (value || '').length;
  const pct = len / max;
  const color = pct >= 1 ? A.red : pct >= 0.85 ? '#e07a00' : '#b0b0c0';
  return (
    <div style={{ fontSize: 11, color, textAlign: 'right', marginTop: 3, fontFamily: A.font }}>
      {len} / {max}
    </div>
  );
}

function FieldWrap({ label, hint, children, optional }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <Label>
        {label}{' '}
        {optional && <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#b0b0c0', fontSize: 10 }}>(opcional)</span>}
      </Label>
      {children}
      {hint && <div style={{ fontSize: 12, color: A.muted, marginTop: 4, fontFamily: A.font }}>{hint}</div>}
    </div>
  );
}

// ─── Step indicator ─────────────────────────────────────────
function Steps({ current }) {
  const steps = [
    { n: 1, label: 'La oferta' },
    { n: 2, label: 'Tu empresa' },
    { n: 3, label: 'Listo' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28, paddingBottom: 20, borderBottom: `1px solid ${A.line}` }}>
      {steps.map((s, i) => {
        const done   = s.n < current;
        const active = s.n === current;
        const nBg    = done ? A.green : active ? A.primary : 'transparent';
        const nColor = done || active ? '#fff' : '#b0b0c0';
        const nBorder= done ? A.green : active ? A.primary : '#b0b0c0';
        const textColor = done ? A.green : active ? A.primary : '#b0b0c0';
        return (
          <React.Fragment key={s.n}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: textColor, fontFamily: A.font, whiteSpace: 'nowrap' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', border: `1.5px solid ${nBorder}`, background: nBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: nColor, flexShrink: 0 }}>
                {done ? '✓' : s.n}
              </div>
              {s.label}
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 1, background: A.line, margin: '0 8px' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Preview card ────────────────────────────────────────────
function PreviewCard({ oferta }) {
  const { etiqueta, complemento, fotoUrl, titulo, descripcion, ahorro, empresa } = oferta;
  const hasBadge = etiqueta || complemento;

  return (
    <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,.08)', maxWidth: 340, margin: '0 auto' }}>
      {/* Imagen */}
      <div style={{ position: 'relative', height: 190, background: '#e0e0ea', overflow: 'hidden' }}>
        {fotoUrl ? (
          <img src={fotoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: '#b0b0c0', fontSize: 13, fontFamily: A.font }}>
            <span style={{ fontSize: 32 }}>📷</span>
            <span>Acá va tu foto</span>
          </div>
        )}
        {hasBadge && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(transparent,rgba(0,0,0,.55))' }} />
        )}
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {etiqueta && (
            <div style={{ background: A.primary, color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 6, maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: A.font }}>
              {etiqueta}
            </div>
          )}
          {complemento && (
            <div style={{ background: 'rgba(0,0,0,.55)', color: '#fff', fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 4, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: A.font }}>
              {complemento}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontFamily: "'Syne', " + A.font, fontSize: 16, fontWeight: 700, color: titulo ? A.ink : '#c0c0d0', marginBottom: 6, lineHeight: 1.25, minHeight: 20 }}>
          {titulo || 'Título de la oferta'}
        </div>
        <div style={{ fontSize: 12, color: descripcion ? A.muted : '#c0c0d0', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {descripcion || 'Descripción de la oferta...'}
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderTop: `1px solid ${A.line}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: ahorro ? A.green : '#c0c0d0', background: ahorro ? A.greenBg : '#f0f0f5', padding: '3px 8px', borderRadius: 100, fontFamily: A.font }}>
          {ahorro || 'Ahorro estimado'}
        </div>
        <div style={{ fontSize: 10, color: '#b0b0c0', fontFamily: A.font }}>
          {empresa || 'Tu negocio'}
        </div>
      </div>
    </div>
  );
}

// ─── Modal de login existente ────────────────────────────────
function LoginModal({ onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) return setError('Completá email y contraseña');
    setLoading(true); setError('');
    try {
      await login(email, password);
      const { getPerfil } = await import('../lib/auth');
      const perfil = await getPerfil();
      onSuccess(perfil);
    } catch (e) {
      setError(e.message || 'Error al ingresar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 400, fontFamily: A.font }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: A.ink }}>Ingresá a tu cuenta</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: A.muted, fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        {error && <div style={{ background: A.redBg, color: A.red, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{error}</div>}
        <div style={{ marginBottom: 14 }}>
          <Label>Email</Label>
          <Input type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <Label>Contraseña</Label>
          <Input type="password" placeholder="Tu contraseña" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ width: '100%', background: A.ink, color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: A.font }}
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ─── Vista principal ─────────────────────────────────────
// ═══════════════════════════════════════════════════════════
export default function PublicarOfertaView({ onBack, onLoginSuccess, onGoAdmin, onGoSocios }) {
  const [step, setStep] = useState(1);
  const formRef = useRef(null);

  // ─ Paso 1: oferta ─
  const [etiqueta, setEtiqueta]         = useState('');
  const [complemento, setComplemento]   = useState('');
  const [uploadTab, setUploadTab]       = useState('file');
  const [fotoUrl, setFotoUrl]           = useState('');
  const [fotoFile, setFotoFile]         = useState(null);
  const [titulo, setTitulo]             = useState('');
  const [tituloError, setTituloError]   = useState(false);
  const [descripcion, setDescripcion]   = useState('');
  const [condiciones, setCondiciones]   = useState({});
  const [condCustom, setCondCustom]     = useState('');
  const [ahorroModo, setAhorroModo]     = useState('exacto');
  const [ahorroVal, setAhorroVal]       = useState('');
  const [ahorroDesde, setAhorroDesde]   = useState('');
  const [ahorroHasta, setAhorroHasta]   = useState('');
  const [mapPos, setMapPos]             = useState(null);
  const [empresaNombre, setEmpresaNombre] = useState('');

  // ─ Paso 2: empresa ─
  const [tipo, setTipo]               = useState(null);
  const [categoria, setCategoria]     = useState('');
  const [cantUnidades, setCantUnidades] = useState('');
  const [servicios, setServicios]     = useState('');
  const [capacidad, setCapacidad]     = useState('');
  const [tipoCocina, setTipoCocina]   = useState('');
  const [duracion, setDuracion]       = useState('');
  const [maxPax, setMaxPax]           = useState('');
  const [sedeFija, setSedeFija]       = useState('');
  const [localidad, setLocalidad]     = useState('');
  const [direccion, setDireccion]     = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [step2Error, setStep2Error]   = useState('');
  const [loading, setLoading]         = useState(false);

  // ─ Modales ─
  const [showLoginModal, setShowLoginModal] = useState(false);

  // ─ Computed ─
  const ahorroDisplay = ahorroModo === 'exacto'
    ? ahorroVal
    : ahorroDesde && ahorroHasta ? `Entre ${ahorroDesde} y ${ahorroHasta}`
    : ahorroDesde ? `Desde ${ahorroDesde}`
    : ahorroHasta ? `Hasta ${ahorroHasta}` : '';

  const condicionesActivas = tipo === 'salidas'
    ? [...CONDICIONES_BASE, ...CONDICIONES_SALIDAS]
    : tipo === 'aventura_relax'
    ? [...CONDICIONES_BASE, ...CONDICIONES_AVENTURA]
    : CONDICIONES_BASE;

  function handleTituloChange(v) {
    setTitulo(v);
    const hasCaps = /([A-ZÁÉÍÓÚÑ]{2,}\s){2,}/.test(v) || /[A-ZÁÉÍÓÚÑ]{5,}/.test(v);
    setTituloError(hasCaps);
  }

  function handleFotoFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setFotoUrl(ev.target.result);
    reader.readAsDataURL(file);
  }

  function handleFotoUrl(v) {
    setFotoUrl(v);
    setFotoFile(null);
  }

  function goToStep(n) {
    setStep(n);
    if (formRef.current) formRef.current.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  function handleTipoChange(t) {
    setTipo(t);
    setCategoria('');
    setSedeFija('');
  }

  // ─ Registro + publicación ──────────────────────────────
  async function publicar() {
    if (!tipo) return setStep2Error('Seleccioná el tipo de negocio para continuar');
    if (!localidad) return setStep2Error('Seleccioná la localidad');
    if (!email) return setStep2Error('Ingresá tu email');
    if (!password || password.length < 6) return setStep2Error('La contraseña debe tener al menos 6 caracteres');

    setLoading(true); setStep2Error('');

    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email, password,
      });
      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error('No se pudo crear el usuario');

      // 2. Crear negocio
      const negocioPayload = {
        nombre:    empresaNombre || email.split('@')[0],
        tipo,
        categoria,
        localidad,
        plan:      'free',
        aprobado:  false,
        activo:    false,
      };
      if ((tipo !== 'aventura_relax') || sedeFija === 'fija') {
        negocioPayload.direccion = direccion;
      }
      if (tipo === 'alojamiento') {
        negocioPayload.cant_unidades = cantUnidades ? parseInt(cantUnidades) : null;
        negocioPayload.servicios     = servicios;
      } else if (tipo === 'salidas') {
        negocioPayload.capacidad   = capacidad ? parseInt(capacidad) : null;
        negocioPayload.tipo_cocina = tipoCocina;
      } else if (tipo === 'aventura_relax') {
        negocioPayload.duracion    = duracion;
        negocioPayload.max_pax     = maxPax ? parseInt(maxPax) : null;
        negocioPayload.sede_fija   = sedeFija;
      }

      const { data: negocio, error: negError } = await supabase
        .from('negocios')
        .insert(negocioPayload)
        .select().single();
      if (negError) throw negError;

      // 3. Crear perfil
      await supabase.from('perfiles').insert({
        id:          userId,
        nombre:      empresaNombre || email.split('@')[0],
        negocio_id:  negocio.id,
        es_superadmin: false,
      });

      // 4. Guardar oferta como pendiente
      const condicionesTexto = [
        ...condicionesActivas.filter(c => condiciones[c.id]).map(c => c.label),
        condCustom,
      ].filter(Boolean).join(' · ');

      const ofertaPayload = {
        negocio_id:  negocio.id,
        titulo,
        descripcion,
        etiqueta,
        complemento_etiqueta: complemento,
        ahorro_estimado: ahorroDisplay,
        condiciones: condicionesTexto,
        estado:      'pendiente',
        aprobada:    false,
      };
      if (mapPos) {
        ofertaPayload.lat = mapPos[0];
        ofertaPayload.lng = mapPos[1];
      }
      if (fotoUrl && !fotoFile) {
        ofertaPayload.imagen_url = fotoUrl;
      }
      // Si hay fotoFile, se podría subir a storage — por ahora se queda vacío
      // El superadmin puede completarla luego

      await supabase.from('ofertas').insert(ofertaPayload);

      goToStep(3);
    } catch (err) {
      setStep2Error(err.message || 'Ocurrió un error, intentá de nuevo');
    } finally {
      setLoading(false);
    }
  }

  // ─ Layout ───────────────────────────────────────────────
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <>
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSuccess={(perfil) => {
            setShowLoginModal(false);
            if (onLoginSuccess) onLoginSuccess(perfil);
          }}
        />
      )}

      <div style={{ minHeight: '100vh', background: A.bg, paddingTop: 70, fontFamily: A.font }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: step === 1 ? '1fr 380px' : '1fr', gap: 0, minHeight: 'calc(100vh - 70px)' }}
          className="publicar-grid"
        >

          {/* ── COLUMNA FORMULARIO ── */}
          <div
            ref={formRef}
            style={{ background: '#fff', padding: '32px 36px', borderRight: step === 1 ? `1px solid ${A.line}` : 'none', overflowY: 'auto' }}
            className="publicar-form"
          >
            <Steps current={step} />

            {/* ────────── PASO 1 ────────── */}
            {step === 1 && (
              <div>
                <div style={{ fontFamily: "'Syne', " + A.font, fontSize: 22, fontWeight: 800, color: A.ink, marginBottom: 4 }}>Publicá tu oferta</div>
                <div style={{ fontSize: 13, color: A.muted, marginBottom: 28 }}>Completá los campos y mirá la preview en vivo a la derecha.</div>

                {/* Etiqueta */}
                <FieldWrap label="Etiqueta destacada" optional hint="Aparece sobre la foto. Máximo 14 caracteres para que no se corte.">
                  <Input
                    maxLength={14} placeholder='Ej: "40% off"'
                    value={etiqueta} onChange={e => setEtiqueta(e.target.value)}
                  />
                  <CharCount value={etiqueta} max={14} />
                </FieldWrap>

                {/* Complemento etiqueta */}
                <FieldWrap label="Complemento de etiqueta" optional hint='Se muestra debajo de la etiqueta, en letra más pequeña. Ej: "de descuento en toda la estadía"'>
                  <Input
                    maxLength={40} placeholder='Ej: "de descuento en toda la estadía"'
                    value={complemento} onChange={e => setComplemento(e.target.value)}
                  />
                  <CharCount value={complemento} max={40} />
                </FieldWrap>

                {/* Foto */}
                <FieldWrap label="Foto principal">
                  <div style={{ display: 'flex', gap: 0, marginBottom: 10, border: `1px solid ${A.line}`, borderRadius: 8, overflow: 'hidden' }}>
                    {['file', 'url'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setUploadTab(tab)}
                        style={{ flex: 1, padding: '8px', fontSize: 12, fontWeight: 600, textAlign: 'center', cursor: 'pointer', border: 'none', background: uploadTab === tab ? A.primary : A.bg, color: uploadTab === tab ? '#fff' : A.muted, fontFamily: A.font, transition: 'all 0.15s' }}
                      >
                        {tab === 'file' ? 'Subir foto' : 'URL de imagen'}
                      </button>
                    ))}
                  </div>
                  {uploadTab === 'file' ? (
                    <>
                      <div
                        onClick={() => document.getElementById('foto-input-pub').click()}
                        style={{ border: `2px dashed ${A.line}`, borderRadius: 10, padding: 20, textAlign: 'center', cursor: 'pointer', background: A.bg, transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = A.primary; e.currentTarget.style.background = A.primarySoft; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = A.line; e.currentTarget.style.background = A.bg; }}
                      >
                        <div style={{ fontSize: 24, marginBottom: 6 }}>📷</div>
                        <div style={{ fontSize: 13, color: A.muted }}>
                          {fotoFile ? <span style={{ color: A.green, fontWeight: 600 }}>{fotoFile.name}</span> : 'Hacé clic para subir una foto'}
                        </div>
                        <div style={{ fontSize: 11, color: '#b0b0c0', marginTop: 4 }}>Solo fotos reales — sin texto ni anuncios</div>
                      </div>
                      <input id="foto-input-pub" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFotoFile} />
                    </>
                  ) : (
                    <>
                      <Input type="url" placeholder="https://..." value={fotoUrl} onChange={e => handleFotoUrl(e.target.value)} />
                      <div style={{ fontSize: 12, color: A.muted, marginTop: 4 }}>Pegá la URL de una foto (jpg, png, webp...)</div>
                    </>
                  )}
                </FieldWrap>

                {/* Título */}
                <FieldWrap label="Título de la oferta">
                  <Input
                    maxLength={70} placeholder="Ej: Noche doble con desayuno incluido"
                    value={titulo} onChange={e => handleTituloChange(e.target.value)}
                    style={tituloError ? { borderColor: A.red } : {}}
                  />
                  <CharCount value={titulo} max={70} />
                  {tituloError && (
                    <div style={{ fontSize: 11, color: A.red, marginTop: 4 }}>Evitá escribir varias palabras seguidas en MAYÚSCULAS.</div>
                  )}
                </FieldWrap>

                {/* Descripción */}
                <FieldWrap label="Descripción">
                  <Textarea
                    maxLength={400}
                    placeholder="Contá de qué trata la oferta, qué incluye, por qué vale la pena..."
                    value={descripcion} onChange={e => setDescripcion(e.target.value)}
                  />
                  <CharCount value={descripcion} max={400} />
                </FieldWrap>

                {/* Condiciones */}
                <FieldWrap label="Condiciones" optional>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                    {CONDICIONES_BASE.map(c => (
                      <label
                        key={c.id}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', border: `1px solid ${condiciones[c.id] ? A.primary : A.line}`, borderRadius: 8, cursor: 'pointer', background: condiciones[c.id] ? A.primarySoft : '#fff', transition: 'all 0.15s' }}
                      >
                        <input
                          type="checkbox"
                          checked={!!condiciones[c.id]}
                          onChange={e => setCondiciones(prev => ({ ...prev, [c.id]: e.target.checked }))}
                          style={{ marginTop: 2, flexShrink: 0, accentColor: A.primary }}
                        />
                        <div>
                          <div style={{ fontSize: 13, color: A.ink }}>{c.label}</div>
                          <div style={{ fontSize: 11, color: A.muted, marginTop: 2 }}>{c.sub}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <Input placeholder="Otra condición personalizada..." value={condCustom} onChange={e => setCondCustom(e.target.value)} />
                </FieldWrap>

                {/* Ahorro */}
                <FieldWrap label="Ahorro estimado para el cliente">
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    {['exacto', 'rango'].map(modo => (
                      <button
                        key={modo}
                        onClick={() => setAhorroModo(modo)}
                        style={{ flex: 1, padding: '8px', fontSize: 12, fontWeight: 600, border: `1px solid ${ahorroModo === modo ? A.primary : A.line}`, borderRadius: 8, cursor: 'pointer', background: ahorroModo === modo ? A.primary : A.bg, color: ahorroModo === modo ? '#fff' : A.muted, fontFamily: A.font, transition: 'all 0.15s' }}
                      >
                        {modo === 'exacto' ? 'Monto exacto' : 'Entre... y...'}
                      </button>
                    ))}
                  </div>
                  {ahorroModo === 'exacto' ? (
                    <Input placeholder='Ej: "$15.000"' value={ahorroVal} onChange={e => setAhorroVal(e.target.value)} />
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <Input placeholder="Desde $10.000" value={ahorroDesde} onChange={e => setAhorroDesde(e.target.value)} />
                      <Input placeholder="Hasta $20.000" value={ahorroHasta} onChange={e => setAhorroHasta(e.target.value)} />
                    </div>
                  )}
                </FieldWrap>

                {/* Mapa */}
                <FieldWrap label="Ubicación de la oferta">
                  <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${A.line}`, height: 200 }}>
                    <MapContainer center={MAP_CENTER} zoom={MAP_ZOOM} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                      <TileLayer
                        attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <MapPicker position={mapPos} onChange={setMapPos} />
                    </MapContainer>
                  </div>
                  <div style={{ fontSize: 12, color: A.muted, marginTop: 4 }}>
                    {mapPos
                      ? <span style={{ color: A.green }}>📍 Ubicación marcada — podés moverla haciendo clic</span>
                      : 'Hacé clic en el mapa para marcar la ubicación de la oferta'}
                  </div>
                </FieldWrap>

                <div style={{ borderTop: `1px solid ${A.line}`, margin: '20px 0' }} />

                {/* Empresa */}
                <FieldWrap label="¿A qué empresa pertenece esta oferta?">
                  <Input
                    maxLength={60} placeholder="Nombre de tu negocio o empresa"
                    value={empresaNombre} onChange={e => setEmpresaNombre(e.target.value)}
                  />
                </FieldWrap>

                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button
                    onClick={() => goToStep(2)}
                    style={{ flex: 1, background: A.ink, color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: A.font }}
                  >
                    Crear empresa nueva →
                  </button>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    style={{ background: 'none', border: `1px solid ${A.line}`, color: A.muted, borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: A.font, whiteSpace: 'nowrap' }}
                  >
                    Ya tengo cuenta
                  </button>
                </div>
              </div>
            )}

            {/* ────────── PASO 2 ────────── */}
            {step === 2 && (
              <div style={{ maxWidth: 560, margin: '0 auto' }}>
                <div style={{ fontFamily: "'Syne', " + A.font, fontSize: 22, fontWeight: 800, color: A.ink, marginBottom: 4 }}>Creá tu cuenta</div>
                <div style={{ fontSize: 13, color: A.muted, marginBottom: 28 }}>Solo te lleva un minuto. Luego revisamos tu oferta y te avisamos.</div>

                {/* Tipo de negocio */}
                <FieldWrap label="¿Qué tipo de negocio tenés?">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    {[
                      { id: 'alojamiento', icon: '🏨', label: 'Alojamiento', sub: 'Hotel, cabaña, dpto, domo...' },
                      { id: 'salidas', icon: '🍽️', label: 'Salidas', sub: 'Restó, bar, café, panadería...' },
                      { id: 'aventura_relax', icon: '🎯', label: 'Aventura & Relax', sub: 'Tours, deportes, spa, cultura...' },
                    ].map(t => (
                      <div
                        key={t.id}
                        onClick={() => handleTipoChange(t.id)}
                        style={{ border: `1.5px solid ${tipo === t.id ? A.primary : A.line}`, borderRadius: 12, padding: '14px 10px', textAlign: 'center', cursor: 'pointer', background: tipo === t.id ? A.primarySoft : '#fff', transition: 'all 0.15s' }}
                      >
                        <div style={{ fontSize: 24, marginBottom: 8 }}>{t.icon}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: A.ink, marginBottom: 4 }}>{t.label}</div>
                        <div style={{ fontSize: 10, color: A.muted, lineHeight: 1.3 }}>{t.sub}</div>
                      </div>
                    ))}
                  </div>
                </FieldWrap>

                {/* Categoría */}
                {tipo && (
                  <FieldWrap label="Categoría">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {CATS[tipo].map(c => (
                        <button
                          key={c}
                          onClick={() => setCategoria(c === categoria ? '' : c)}
                          style={{ padding: '5px 12px', border: `1px solid ${categoria === c ? A.primary : A.line}`, borderRadius: 100, fontSize: 12, fontWeight: 500, cursor: 'pointer', background: categoria === c ? A.primary : A.bg, color: categoria === c ? '#fff' : A.ink, fontFamily: A.font, transition: 'all 0.15s' }}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </FieldWrap>
                )}

                {/* Campos específicos Alojamiento */}
                {tipo === 'alojamiento' && (
                  <>
                    <FieldWrap label="Cantidad de unidades (habitaciones / cabañas / dptos)">
                      <Input type="number" min="1" placeholder="Ej: 12" value={cantUnidades} onChange={e => setCantUnidades(e.target.value)} />
                    </FieldWrap>
                    <FieldWrap label="Servicios incluidos" optional>
                      <Input placeholder="Ej: WiFi, pileta, estacionamiento, desayuno" value={servicios} onChange={e => setServicios(e.target.value)} />
                    </FieldWrap>
                  </>
                )}

                {/* Campos específicos Salidas */}
                {tipo === 'salidas' && (
                  <>
                    <FieldWrap label="Capacidad aproximada" optional>
                      <Input type="number" min="1" placeholder="Cantidad de cubiertos o personas" value={capacidad} onChange={e => setCapacidad(e.target.value)} />
                    </FieldWrap>
                    <FieldWrap label="Tipo de cocina / propuesta" optional>
                      <Input placeholder="Ej: Parrilla argentina, cocina de mar, café de especialidad" value={tipoCocina} onChange={e => setTipoCocina(e.target.value)} />
                    </FieldWrap>
                  </>
                )}

                {/* Campos específicos Experiencia */}
                {tipo === 'aventura_relax' && (
                  <>
                    <FieldWrap label="Duración aproximada" optional>
                      <Input placeholder="Ej: 2 horas, medio día, jornada completa" value={duracion} onChange={e => setDuracion(e.target.value)} />
                    </FieldWrap>
                    <FieldWrap label="Participantes máximos" optional>
                      <Input type="number" min="1" placeholder="Cantidad de personas por turno" value={maxPax} onChange={e => setMaxPax(e.target.value)} />
                    </FieldWrap>
                    <FieldWrap label="¿La experiencia tiene sede fija?">
                      <Select value={sedeFija} onChange={e => setSedeFija(e.target.value)}>
                        <option value="">Seleccioná</option>
                        <option value="fija">Sí, tiene dirección fija</option>
                        <option value="domicilio">No, voy al domicilio del cliente</option>
                        <option value="variable">Tiene punto de encuentro variable</option>
                      </Select>
                    </FieldWrap>
                  </>
                )}

                {/* Localidad */}
                <FieldWrap label="Localidad">
                  <Select value={localidad} onChange={e => setLocalidad(e.target.value)}>
                    <option value="">Seleccioná una localidad</option>
                    {LOCALIDADES.map(l => <option key={l}>{l}</option>)}
                  </Select>
                </FieldWrap>

                {/* Domicilio — solo si no es experiencia sin sede */}
                {(tipo !== 'aventura_relax' || sedeFija === 'fija') && (
                  <FieldWrap label="Domicilio">
                    <Input placeholder="Calle y número" value={direccion} onChange={e => setDireccion(e.target.value)} />
                  </FieldWrap>
                )}

                {/* Email + Contraseña */}
                <FieldWrap label="Email">
                  <Input type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                </FieldWrap>
                <FieldWrap label="Contraseña">
                  <Input type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} />
                </FieldWrap>

                {/* Banner info */}
                {tipo === 'alojamiento' && (
                  <div style={{ background: A.primarySoft, borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 13, color: A.ink }}>
                    <strong style={{ display: 'block', marginBottom: 6 }}>Empezás con el plan FREE — sin costo</strong>
                    Podés publicar 1 oferta cada 30 días. Cada canje de oferta te devuelve créditos que podés usar para bajar el costo del plan o regalar a tus huéspedes.
                    {onGoSocios && (
                      <button onClick={onGoSocios} style={{ background: 'none', border: 'none', color: A.primary, fontWeight: 600, fontSize: 12, marginTop: 6, cursor: 'pointer', padding: 0, display: 'block', fontFamily: A.font }}>
                        Ver todos los planes →
                      </button>
                    )}
                  </div>
                )}
                {(tipo === 'salidas' || tipo === 'aventura_relax') && (
                  <div style={{ background: A.greenBg, borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 13, color: A.ink }}>
                    <strong style={{ display: 'block', marginBottom: 6 }}>Publicar es gratis para vos</strong>
                    Los restaurantes y experiencias no pagan plan. Podés pagar un extra para tener más visibilidad o ser parte de ofertas exclusivas para huéspedes de hoteles adheridos.
                  </div>
                )}

                {/* Error */}
                {step2Error && (
                  <div style={{ background: A.redBg, color: A.red, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
                    {step2Error}
                  </div>
                )}

                {/* Botones */}
                <button
                  onClick={publicar}
                  disabled={loading}
                  style={{ width: '100%', background: A.ink, color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: A.font, marginBottom: 12 }}
                >
                  {loading ? 'Publicando...' : 'Publicar mi oferta'}
                </button>
                <div style={{ textAlign: 'center' }}>
                  <button onClick={() => goToStep(1)} style={{ background: 'none', border: `1px solid ${A.line}`, color: A.muted, borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: A.font }}>
                    ← Volver a la oferta
                  </button>
                </div>
              </div>
            )}

            {/* ────────── PASO 3 ────────── */}
            {step === 3 && (
              <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center', padding: '32px 20px' }}>
                <div style={{ width: 64, height: 64, background: A.greenBg, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>
                  ✓
                </div>
                <div style={{ fontFamily: "'Syne', " + A.font, fontSize: 24, fontWeight: 800, color: A.ink, marginBottom: 8 }}>
                  ¡Oferta publicada!
                </div>
                <div style={{ fontSize: 14, color: A.muted, marginBottom: 24, lineHeight: 1.6 }}>
                  Tu oferta está siendo revisada por el equipo de Cuponear.<br />
                  Te avisamos por email cuando esté activa — generalmente en menos de 48 hs.
                </div>

                <div style={{ border: `1px solid ${A.line}`, borderRadius: 14, padding: 20, textAlign: 'left', marginBottom: 24, background: A.bg }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: A.ink, marginBottom: 8 }}>Un paso más — completá tu ficha</div>
                  <div style={{ fontSize: 13, color: A.muted, marginBottom: 16, lineHeight: 1.6 }}>
                    Registrarse no genera una ficha completa automáticamente. Agregá fotos, descripción detallada y datos de contacto para que los turistas elijan tu oferta. La ficha también pasa por revisión del equipo.
                  </div>
                  <button
                    onClick={() => onGoAdmin && onGoAdmin()}
                    style={{ width: '100%', background: A.ink, color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: A.font }}
                  >
                    Completar ficha ahora
                  </button>
                </div>

                <button
                  onClick={() => onBack && onBack()}
                  style={{ background: 'none', border: 'none', color: A.muted, fontSize: 13, cursor: 'pointer', padding: 8, fontFamily: A.font }}
                >
                  Lo hago después → volver al inicio
                </button>
              </div>
            )}
          </div>

          {/* ── PREVIEW (solo en paso 1) ── */}
          {step === 1 && (
            <div
              className="publicar-preview"
              style={{ background: '#f0f0f5', padding: '24px 20px', position: 'sticky', top: 70, height: 'calc(100vh - 70px)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#b0b0c0', marginBottom: 12, fontFamily: A.font }}>
                <span style={{ background: '#e0e0ea', padding: '2px 8px', borderRadius: 100 }}>Preview de tu oferta</span>
              </div>
              <PreviewCard
                oferta={{ etiqueta, complemento, fotoUrl, titulo, descripcion, ahorro: ahorroDisplay, empresa: empresaNombre }}
              />
              <div style={{ fontSize: 11, color: '#b0b0c0', textAlign: 'center', marginTop: 16, lineHeight: 1.5, fontFamily: A.font }}>
                La preview es orientativa — el diseño final puede variar levemente en el sitio.
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .publicar-grid { grid-template-columns: 1fr !important; }
          .publicar-form { padding: 20px 18px !important; border-right: none !important; }
          .publicar-preview { position: static !important; height: auto !important; }
        }
      `}</style>
    </>
  );
}
