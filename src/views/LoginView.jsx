// ============================================================
//  src/views/LoginView.jsx
// ============================================================
import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, Check, Mail, Lock, User, Zap, Crown, Store } from 'lucide-react';
import { login, registrarTurista, loginConGoogle } from '../lib/auth';
import { supabase } from '../lib/supabase';

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
  font:        "'Geist', system-ui, sans-serif",
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
//  PANTALLA LOGIN
// ═══════════════════════════════════════════════════════════════
export default function LoginView({ onLoginSuccess, onBack, initialTab = 'ingresar' }) {
  const [tab,       setTab]       = useState(initialTab);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [exito,     setExito]     = useState('');

  // ── Ingresar ──
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [recordarme, setRecordarme] = useState(false);

  // ── Registro: pasos y tipo ──
  const [regStep,    setRegStep]    = useState(1);       // 1 | 2 | 3
  const [tipoReg,    setTipoReg]    = useState(null);    // 'visitante' | 'alojamiento' | 'comercio'
  const [planElegido,setPlanElegido]= useState(null);    // 'free' | 'plus' | 'black'

  // ── Registro visitante ──
  const [rNombre,   setRNombre]   = useState('');
  const [rApellido, setRApellido] = useState('');
  const [rEmail,    setREmail]    = useState('');
  const [rPass,     setRPass]     = useState('');
  const [rPass2,    setRPass2]    = useState('');
  const [rShowPass, setRShowPass] = useState(false);
  const [terminos,  setTerminos]  = useState(false);

  // ── Registro negocio ──
  const [sNombre,      setSNombre]      = useState('');
  const [sEmail,       setSEmail]       = useState('');
  const [sPass,        setSPass]        = useState('');
  const [sShowPass,    setSShowPass]    = useState(false);
  const [sLocalidad,   setSLocalidad]   = useState('');
  const [sTipo,        setSTipo]        = useState('');
  const [sTerminos,    setSTerminos]    = useState(false);

  const LOCALIDADES = ['Villa Gesell', 'Mar de las Pampas', 'Las Gaviotas', 'Mar Azul'];

  const TIPOS_ALOJAMIENTO = ['Hotel', 'Cabaña', 'Departamento', 'Domo', 'Dormi', 'Carpa'];
  const TIPOS_COMERCIO    = ['Restaurante', 'Bar', 'Café', 'Balneario', 'Pastelería', 'Gourmet', 'Experiencia'];

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

  const handleRegistrarTurista = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    if (rPass !== rPass2) { setError('Las contraseñas no coinciden.'); return; }
    if (rPass.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (!terminos)         { setError('Debés aceptar los términos y condiciones.'); return; }
    setLoading(true);
    try {
      await registrarTurista({ nombre: rNombre, apellido: rApellido, email: rEmail, password: rPass });
      setExito('¡Cuenta creada! Revisá tu email para confirmar tu registro.');
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('already')) setError('Ese email ya está registrado. Probá ingresando.');
      else if (msg.includes('30 seconds') || msg.includes('security purposes')) setError('Esperá unos segundos antes de intentar nuevamente.');
      else setError('Hubo un error al crear la cuenta. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarNegocio = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    if (!sNombre)     { setError('Ingresá el nombre de tu negocio.'); return; }
    if (!sTipo)       { setError('Seleccioná el tipo de negocio.'); return; }
    if (!sLocalidad)  { setError('Seleccioná la localidad.'); return; }
    if (sPass.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (!sTerminos)   { setError('Debés aceptar los términos y condiciones.'); return; }
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email: sEmail, password: sPass });
      if (authError) throw authError;
      const userId = authData.user?.id;
      if (!userId) throw new Error('No se pudo crear el usuario');
      const { error: fnError } = await supabase.rpc('registrar_negocio', {
        p_nombre: sNombre,
        p_tipo: sTipo,
        p_localidad: sLocalidad,
        p_user_id: userId,
      });
      if (fnError) throw fnError;
      setRegStep(3);
    } catch (err) {
      setError(err?.message?.includes('already') ? 'Ese email ya está registrado. Probá ingresando.' : (err.message || 'Hubo un error. Intentá de nuevo.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(''); setLoading(true);
    try { await loginConGoogle(); }
    catch { setError('No se pudo conectar con Google. Intentá de nuevo.'); setLoading(false); }
  };

  const switchTab = (t) => { setTab(t); setError(''); setExito(''); setRegStep(1); setTipoReg(null); setPlanElegido(null); setSTipo(''); };

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: A.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 64, paddingBottom: 48, paddingLeft: 20, paddingRight: 20, fontFamily: A.font }}>
      <div style={{ width: '100%', maxWidth: regStep === 3 ? 960 : 500, transition: 'max-width .3s' }}>

        {/* Logo */}
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', marginBottom: 32 }}>
          <img src="/logo-cuponera.svg" alt="Cuponear" style={{ height: 44, width: 'auto' }} />
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', color: A.primary, fontFamily: A.font }}>Cuponear</span>
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

              {/* PASOS — solo cuando no hay éxito */}
              {/* PASO 1 — elegir tipo */}
              {!exito && regStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { id: 'visitante',  icon: <img src="/turista.svg"   alt="" style={{ width: 56, height: 56 }} />, title: 'Visitante',           sub: 'Explorá ofertas y armá tu cuponera' },
                    { id: 'alojamiento',icon: null,                                                                   title: 'Alojamiento',         sub: 'Dar a conocer mi hotel, cabaña, apart, etc' },
                    { id: 'comercio',   icon: <img src="/anunciar.svg"  alt="" style={{ width: 56, height: 56 }} />, title: 'Comercio o servicio', sub: 'Salidas, aventura, relax, experiencias' },
                  ].map(opt => (
                    <button key={opt.id} type="button"
                      onClick={() => { setTipoReg(opt.id); setError(''); setRegStep(2); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 16,
                        padding: '16px 20px', border: `1.5px solid ${A.line}`,
                        borderRadius: 16, cursor: 'pointer', background: '#fff',
                        textAlign: 'left', fontFamily: A.font, transition: 'all .15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = A.primary; e.currentTarget.style.background = A.primarySoft; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = A.line; e.currentTarget.style.background = '#fff'; }}
                    >
                      {opt.icon && <div style={{ flexShrink: 0, width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{opt.icon}</div>}
                      {!opt.icon && <div style={{ flexShrink: 0, width: 48, height: 48, borderRadius: 12, background: A.primarySoft, display: 'grid', placeItems: 'center' }}><Store size={22} color={A.primary} /></div>}
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: A.ink }}>{opt.title}</div>
                        <div style={{ fontSize: 13, color: A.muted, marginTop: 2 }}>{opt.sub}</div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={A.muted} strokeWidth="2" strokeLinecap="round" style={{ marginLeft: 'auto', flexShrink: 0 }}><path d="m9 6 6 6-6 6"/></svg>
                    </button>
                  ))}
                </div>
              )}

              {/* PASO 2 — formulario */}
              {!exito && regStep === 2 && tipoReg === 'visitante' && (
                <form onSubmit={handleRegistrarTurista} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <button type="button" onClick={() => setRegStep(1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: A.muted, cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '0 0 8px', fontFamily: A.font }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg> Volver
                  </button>
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
                  <Terminos checked={terminos} onChange={setTerminos} />
                  <BtnSubmit loading={loading} label="Crear mi cuenta" loadingLabel="Creando cuenta..." />
                  <Divisor />
                  <BtnGoogle onClick={handleGoogle} loading={loading} label="Registrarse con Google" />
                </form>
              )}

              {!exito && regStep === 2 && (tipoReg === 'alojamiento' || tipoReg === 'comercio') && (
                <form onSubmit={handleRegistrarNegocio} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <button type="button" onClick={() => setRegStep(1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: A.muted, cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '0 0 4px', fontFamily: A.font }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg> Volver
                  </button>
                  <Campo label="Nombre del negocio" value={sNombre} onChange={setSNombre} placeholder="Ej: Hostel La Paloma" required />
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: A.ink2, marginBottom: 6, fontFamily: A.font }}>
                      Tipo de negocio <span style={{ color: A.red, marginLeft: 2 }}>*</span>
                    </label>
                    <select value={sTipo} onChange={e => setSTipo(e.target.value)} required
                      style={{ width: '100%', boxSizing: 'border-box', padding: '13px 16px', border: `1.5px solid ${A.line}`, borderRadius: 13, fontSize: 14, fontFamily: A.font, color: sTipo ? A.ink : A.muted, background: '#fff', outline: 'none' }}>
                      <option value="">Seleccioná el tipo</option>
                      {(tipoReg === 'alojamiento' ? TIPOS_ALOJAMIENTO : TIPOS_COMERCIO).map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <Campo label="Email de contacto" type="email" value={sEmail} onChange={setSEmail} placeholder="tu@email.com" icon={<Mail size={15} />} required />
                  <Campo label="Contraseña" type={sShowPass ? 'text' : 'password'} value={sPass} onChange={setSPass} placeholder="Mínimo 6 caracteres"
                    icon={<Lock size={15} />} required
                    rightEl={<button type="button" onClick={() => setSShowPass(s => !s)} style={{ background: 'none', border: 'none', color: A.muted, cursor: 'pointer', display: 'flex' }}>{sShowPass ? <EyeOff size={17} /> : <Eye size={17} />}</button>}
                  />
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: A.ink2, marginBottom: 6, fontFamily: A.font }}>Localidad *</label>
                    <select value={sLocalidad} onChange={e => setSLocalidad(e.target.value)} required
                      style={{ width: '100%', boxSizing: 'border-box', padding: '13px 16px', border: `1.5px solid ${A.line}`, borderRadius: 13, fontSize: 14, fontFamily: A.font, color: sLocalidad ? A.ink : A.muted, background: '#fff', outline: 'none' }}>
                      <option value="">Seleccioná la localidad</option>
                      {LOCALIDADES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <Terminos checked={sTerminos} onChange={setSTerminos} />
                  <BtnSubmit loading={loading} label="Continuar" loadingLabel="Creando cuenta..." />
                  <p style={{ fontSize: 11, color: A.muted, textAlign: 'center', lineHeight: 1.6, fontFamily: A.font }}>
                    Tu cuenta quedará activa una vez que el equipo de Cuponear la apruebe.
                  </p>
                </form>
              )}

              {/* PASO 3 — pricing upgrade */}
              {!exito && regStep === 3 && (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                      <Check size={26} color={A.green} />
                    </div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: A.ink, margin: '0 0 6px', fontFamily: A.font }}>¡Cuenta creada!</h2>
                    <p style={{ fontSize: 14, color: A.muted, margin: 0, fontFamily: A.font }}>Ya estás en FREEMIUM. ¿Querés más visibilidad? Elegí un plan mejor.</p>
                  </div>

                  {/* Cards de planes — estilo wide */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>
                    {PLANES_ALOJ.map(plan => {
                      const sel = planElegido === plan.id;
                      const icons = { free: <Store size={28} color={sel ? A.primary : A.muted} />, plus: <Zap size={28} color={sel ? A.primary : '#2545E6'} />, black: <Crown size={28} color={sel ? '#fff' : '#F59E0B'} /> };
                      const isBlack = plan.id === 'black';
                      return (
                        <div key={plan.id} style={{ position: 'relative', border: `2px solid ${sel ? A.primary : isBlack ? '#0B1020' : A.line}`, borderRadius: 20, padding: '24px 20px', background: sel ? A.primarySoft : isBlack ? '#0B1020' : '#fff', display: 'flex', flexDirection: 'column', transition: 'all .2s' }}>
                          {plan.badge && (
                            <span style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: isBlack ? '#0B1020' : A.primary, color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 999, whiteSpace: 'nowrap', border: '2px solid #fff' }}>
                              {plan.badge}
                            </span>
                          )}
                          <div style={{ marginBottom: 4 }}>{icons[plan.id]}</div>
                          <div style={{ fontSize: 20, fontWeight: 900, color: isBlack ? '#fff' : A.ink, letterSpacing: '-0.02em', marginBottom: 2 }}>{plan.nombre}</div>
                          {plan.precio
                            ? <div style={{ fontSize: 26, fontWeight: 800, color: isBlack ? '#fff' : A.ink, letterSpacing: '-0.03em', marginBottom: 4 }}>{plan.precio}</div>
                            : <div style={{ fontSize: 13, color: isBlack ? 'rgba(255,255,255,0.6)' : A.muted, marginBottom: 12 }}>Sin cargo de membresía</div>
                          }
                          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                            {plan.items.map((item, i) => (
                              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: isBlack ? 'rgba(255,255,255,0.85)' : A.ink2, lineHeight: 1.4 }}>
                                <Check size={13} color={isBlack ? '#F59E0B' : A.green} style={{ flexShrink: 0, marginTop: 1 }} />
                                {item}
                              </li>
                            ))}
                          </ul>
                          <div style={{ borderTop: `1px solid ${isBlack ? 'rgba(255,255,255,0.1)' : A.line}`, paddingTop: 12, marginBottom: 16 }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: isBlack ? 'rgba(255,255,255,0.5)' : A.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>Publicación de ofertas</div>
                            <p style={{ fontSize: 11, lineHeight: 1.55, margin: 0 }}>
                              {plan.paymentSegments.map((seg, i) => (
                                <span key={i} style={{ fontWeight: seg.bold ? 700 : 400, color: seg.green ? A.green : isBlack ? 'rgba(255,255,255,0.8)' : A.ink }}>{seg.text}</span>
                              ))}
                            </p>
                          </div>
                          <button type="button"
                            onClick={() => setPlanElegido(plan.id)}
                            style={{ width: '100%', padding: '11px 0', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: A.font, transition: 'all .15s',
                              background: sel ? A.primary : isBlack ? 'rgba(255,255,255,0.12)' : A.bg,
                              color: sel ? '#fff' : isBlack ? '#fff' : A.ink,
                            }}
                          >
                            {sel ? '✓ Seleccionado' : plan.id === 'free' ? 'Continuar gratis' : `Elegir ${plan.nombre}`}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                    <button type="button" onClick={() => { setExito('¡Cuenta creada! Revisamos tu ficha y te avisamos cuando esté activa.'); setRegStep(1); }}
                      style={{ background: 'none', border: 'none', color: A.muted, fontSize: 13, cursor: 'pointer', fontFamily: A.font, textDecoration: 'underline' }}>
                      Omitir por ahora, continuar con FREEMIUM
                    </button>
                  </div>
                </div>
              )}

              {/* Éxito */}
              {exito && (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Check size={28} color={A.green} />
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: A.ink, margin: '0 0 8px', fontFamily: A.font }}>¡Bienvenido/a a Cuponear!</h2>
                  <p style={{ fontSize: 14, color: A.muted, lineHeight: 1.6, fontFamily: A.font, margin: '0 0 24px' }}>
                    {tipoReg === 'visitante'
                      ? 'Te enviamos un email de confirmación. Una vez confirmado podés explorar todas las ofertas.'
                      : 'Revisamos tu ficha y te avisamos por email cuando esté activa — generalmente en menos de 48 hs.'}
                  </p>
                  <button onClick={() => switchTab('ingresar')} style={{ background: A.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: A.font }}>
                    Ingresar
                  </button>
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
