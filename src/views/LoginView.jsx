// ============================================================
//  src/views/LoginView.jsx — Acceder / Registrarse
//  Aire design system
// ============================================================
import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, Check, Mail, Lock, User } from 'lucide-react';
import { login, registrarTurista, loginConGoogle } from '../lib/auth';

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

// ─── SVGs ────────────────────────────────────────────────────
const IcoGoogle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const INTERESES = [
  { id: 'alojamiento', label: 'Alojamiento',      emoji: '🏠' },
  { id: 'gastronomia', label: 'Gastronomía',       emoji: '🍽️' },
  { id: 'aventura',    label: 'Aventura & Relax',  emoji: '🏄' },
  { id: 'todo',        label: 'Todo un poco',       emoji: '🌊' },
];

// ─── Input con ícono derecho ──────────────────────────────────
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
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          onFocus={() => setFoc(true)}
          onBlur={() => setFoc(false)}
          style={{
            width: '100%', boxSizing: 'border-box',
            paddingTop: 13, paddingBottom: 13,
            paddingLeft: icon ? 42 : 16,
            paddingRight: rightEl ? 48 : 16,
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

// ─── Botón Google ─────────────────────────────────────────────
function BtnGoogle({ onClick, loading, label = 'Acceder con Google' }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '13px 0', border: `1.5px solid ${hov ? A.ink2 : A.line}`, borderRadius: 13, fontSize: 14, fontWeight: 600, color: A.ink, background: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: A.font, transition: 'border-color .15s, background .15s' }}
    >
      <IcoGoogle /> {label}
    </button>
  );
}

// ─── Divisor ─────────────────────────────────────────────────
function Divisor() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
      <div style={{ flex: 1, height: 1, background: A.line }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: A.muted, fontFamily: A.font }}>O</span>
      <div style={{ flex: 1, height: 1, background: A.line }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  PANTALLA LOGIN
// ═══════════════════════════════════════════════════════════════
export default function LoginView({ onLoginSuccess, onBack }) {
  const [tab,        setTab]        = useState('acceder'); // 'acceder' | 'registrarse'
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [exito,      setExito]      = useState('');

  // ── Acceder ──
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [recordarme,  setRecordarme]  = useState(false);

  // ── Registrarse ──
  const [rNombre,     setRNombre]     = useState('');
  const [rApellido,   setRApellido]   = useState('');
  const [rEmail,      setREmail]      = useState('');
  const [rPass,       setRPass]       = useState('');
  const [rPass2,      setRPass2]      = useState('');
  const [rShowPass,   setRShowPass]   = useState(false);
  const [intereses,   setIntereses]   = useState([]);
  const [terminos,    setTerminos]    = useState(false);

  const toggleInteres = (id) =>
    setIntereses(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // ── Handlers ─────────────────────────────────────────────────
  const handleAcceder = async (e) => {
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

  const handleRegistrar = async (e) => {
    e.preventDefault();
    setError('');
    if (rPass !== rPass2) { setError('Las contraseñas no coinciden.'); return; }
    if (rPass.length < 6)  { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (!terminos)          { setError('Debés aceptar los términos y condiciones.'); return; }
    setLoading(true);
    try {
      await registrarTurista({ nombre: rNombre, apellido: rApellido, email: rEmail, password: rPass, intereses });
      setExito('¡Cuenta creada! Revisá tu email para confirmar tu registro.');
    } catch (err) {
      setError(err?.message?.includes('already') ? 'Ese email ya está registrado. Probá accediendo.' : 'Hubo un error al crear la cuenta. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(''); setLoading(true);
    try { await loginConGoogle(); }
    catch { setError('No se pudo conectar con Google. Intentá de nuevo.'); setLoading(false); }
  };

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: A.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 64, paddingBottom: 48, paddingLeft: 16, paddingRight: 16, fontFamily: A.font }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Logo */}
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', marginBottom: 32 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: A.primary, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 20, boxShadow: '0 6px 18px rgba(37,69,230,0.28)' }}>G</div>
          <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.025em', color: A.ink }}>gesell.ar</span>
        </button>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 22, border: `1px solid ${A.line}`, padding: '32px 32px 28px', boxShadow: '0 4px 32px rgba(11,16,32,0.07)' }}>

          {/* Tab selector */}
          <div style={{ display: 'flex', background: A.bg, borderRadius: 14, padding: 4, marginBottom: 28, gap: 4 }}>
            {[['acceder', 'Acceder'], ['registrarse', 'Registrarse']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => { setTab(key); setError(''); setExito(''); }}
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

          {/* Error / Éxito */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#FEF2F2', border: `1px solid #FECACA`, borderRadius: 11, padding: '12px 14px', marginBottom: 20, fontSize: 13, color: '#B91C1C', fontFamily: A.font }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
            </div>
          )}
          {exito && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#F0FDF4', border: `1px solid #86EFAC`, borderRadius: 11, padding: '12px 14px', marginBottom: 20, fontSize: 13, color: '#166534', fontFamily: A.font }}>
              <Check size={15} style={{ flexShrink: 0, marginTop: 1 }} /> {exito}
            </div>
          )}

          {/* ══ TAB ACCEDER ══ */}
          {tab === 'acceder' && (
            <form onSubmit={handleAcceder} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Campo label="Email" type="email" value={email} onChange={setEmail} placeholder="tu@email.com" icon={<Mail size={15} />} required />
              <Campo
                label="Contraseña" type={showPass ? 'text' : 'password'}
                value={password} onChange={setPassword} placeholder="••••••••"
                icon={<Lock size={15} />} required
                rightEl={
                  <button type="button" onClick={() => setShowPass(s => !s)} style={{ background: 'none', border: 'none', color: A.muted, cursor: 'pointer', display: 'flex' }}>
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                }
              />

              {/* Recordarme + Olvidé */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: -4 }}>
                <div onClick={() => setRecordarme(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ width: 18, height: 18, borderRadius: 999, border: `2px solid ${recordarme ? A.primary : A.line}`, background: recordarme ? A.primary : '#fff', display: 'grid', placeItems: 'center', transition: 'all .15s', flexShrink: 0 }}>
                    {recordarme && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                  </div>
                  <span style={{ fontSize: 13, color: A.ink2, fontFamily: A.font }}>Recordarme</span>
                </div>
                <button type="button" style={{ background: 'none', border: 'none', fontSize: 13, color: A.primary, fontWeight: 600, cursor: 'pointer', fontFamily: A.font }}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button
                type="submit" disabled={loading}
                style={{ width: '100%', padding: '14px 0', background: loading ? A.muted : A.primary, color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: A.font, boxShadow: '0 4px 16px rgba(37,69,230,0.28)', transition: 'background .15s', marginTop: 4 }}
                onMouseEnter={e => !loading && (e.currentTarget.style.background = A.primaryDark)}
                onMouseLeave={e => !loading && (e.currentTarget.style.background = A.primary)}
              >
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>

              <Divisor />
              <BtnGoogle onClick={handleGoogle} loading={loading} />
            </form>
          )}

          {/* ══ TAB REGISTRARSE ══ */}
          {tab === 'registrarse' && !exito && (
            <form onSubmit={handleRegistrar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Nombre + Apellido en fila */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Campo label="Nombre" value={rNombre} onChange={setRNombre} placeholder="Sofía" icon={<User size={15} />} required />
                <Campo label="Apellido" value={rApellido} onChange={setRApellido} placeholder="García" required />
              </div>

              <Campo label="Email" type="email" value={rEmail} onChange={setREmail} placeholder="tu@email.com" icon={<Mail size={15} />} required />

              <Campo
                label="Contraseña" type={rShowPass ? 'text' : 'password'}
                value={rPass} onChange={setRPass} placeholder="Mínimo 6 caracteres"
                icon={<Lock size={15} />} required
                rightEl={
                  <button type="button" onClick={() => setRShowPass(s => !s)} style={{ background: 'none', border: 'none', color: A.muted, cursor: 'pointer', display: 'flex' }}>
                    {rShowPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                }
              />

              <Campo
                label="Repetir contraseña" type={rShowPass ? 'text' : 'password'}
                value={rPass2} onChange={setRPass2} placeholder="Repetí tu contraseña"
                icon={<Lock size={15} />} required
              />

              {/* Intereses */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: A.ink2, marginBottom: 10, marginTop: 2, fontFamily: A.font }}>¿Qué te trae a gesell.ar?</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {INTERESES.map(({ id, label, emoji }) => {
                    const sel = intereses.includes(id);
                    return (
                      <button
                        key={id} type="button"
                        onClick={() => toggleInteres(id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 7, padding: '9px 12px',
                          border: `1.5px solid ${sel ? A.primary : A.line}`,
                          borderRadius: 11, cursor: 'pointer', fontFamily: A.font,
                          fontSize: 12, fontWeight: sel ? 700 : 500,
                          color: sel ? A.primary : A.ink2,
                          background: sel ? A.primarySoft : '#fff', transition: 'all .15s',
                        }}
                      >
                        <span style={{ fontSize: 15 }}>{emoji}</span> {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Términos */}
              <div onClick={() => setTerminos(v => !v)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', userSelect: 'none', padding: '4px 0' }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${terminos ? A.primary : A.line}`, background: terminos ? A.primary : '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1, transition: 'all .15s' }}>
                  {terminos && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span style={{ fontSize: 13, color: A.ink2, lineHeight: 1.5, fontFamily: A.font }}>
                  Acepto los <button type="button" onClick={e => e.stopPropagation()} style={{ background: 'none', border: 'none', color: A.primary, fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: 13, fontFamily: A.font }}>términos y condiciones</button> y la política de privacidad de gesell.ar
                </span>
              </div>

              <button
                type="submit" disabled={loading}
                style={{ width: '100%', padding: '14px 0', background: loading ? A.muted : A.primary, color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: A.font, boxShadow: '0 4px 16px rgba(37,69,230,0.28)', transition: 'background .15s', marginTop: 2 }}
                onMouseEnter={e => !loading && (e.currentTarget.style.background = A.primaryDark)}
                onMouseLeave={e => !loading && (e.currentTarget.style.background = A.primary)}
              >
                {loading ? 'Creando cuenta...' : 'Crear mi cuenta'}
              </button>

              <Divisor />
              <BtnGoogle onClick={handleGoogle} loading={loading} label="Registrarse con Google" />

              <p style={{ fontSize: 11, color: A.muted, textAlign: 'center', lineHeight: 1.6, marginTop: 4, fontFamily: A.font }}>
                Al continuar con Google también aceptás nuestros términos y condiciones.
              </p>
            </form>
          )}

          {/* Éxito registro */}
          {tab === 'registrarse' && exito && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: A.ink, margin: '0 0 8px', fontFamily: A.font }}>¡Bienvenido/a a gesell.ar!</h2>
              <p style={{ fontSize: 14, color: A.muted, lineHeight: 1.6, fontFamily: A.font, margin: '0 0 24px' }}>
                Te enviamos un email de confirmación. Una vez confirmado podés explorar todas las ofertas y guardar tus favoritos.
              </p>
              <button onClick={() => setTab('acceder')} style={{ background: A.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: A.font }}>
                Ir a Acceder
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: 12, color: A.muted, marginTop: 20, lineHeight: 1.6, fontFamily: A.font }}>
          ¿Sos socio o tenés un negocio?{' '}
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: A.primary, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: A.font }}>
            Contactar al equipo
          </button>
        </p>
      </div>
    </div>
  );
}
