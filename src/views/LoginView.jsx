// ============================================================
//  src/views/LoginView.jsx
// ============================================================
import { useState, useEffect } from 'react';
import { Eye, EyeOff, AlertCircle, Check, Mail, Lock, User, Store, Ticket, ChevronRight, ArrowLeft } from 'lucide-react';
import { login, registrarTurista, loginConGoogle } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { registrarIntentoPagoTarjeta, FOTOS_GALERIA_MAX } from '../lib/planes';
import { getSaldo } from '../lib/cobros';
import PlanPicker from '../components/PlanPicker';
import GaleriaFotos from '../components/GaleriaFotos';
import PerfilNegocioForm from '../components/PerfilNegocioForm';
import { perfilDesdeNegocio, perfilAPayload, validarPerfil } from '../lib/perfilNegocio';
import { existePersonaConNombre, existeNegocioConNombre } from '../lib/validacionRegistro';
import { TabOfertas } from './AdminNegocioView';

// ─── Helpers ─────────────────────────────────────────────────
function getSiteName() {
  if (typeof window === 'undefined') return 'gesell.ar';
  const h = window.location.hostname.replace('www.', '');
  return h === 'localhost' ? 'gesell.ar' : h;
}

// Cupo semanal por defecto de activaciones de pase-regalo
// (socio_alias.unidades_declaradas) — ya no se le pregunta al socio en el alta.
const UNIDADES_DEFAULT = 20;

const A = {
  primary:     '#475BE1',
  primaryDark: '#3347C8',
  primarySoft: '#EEF0FD',
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
      style={{ width: '100%', padding: '14px 0', background: loading ? A.muted : A.primary, color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: A.font, boxShadow: '0 4px 16px rgba(71,91,225,0.28)', transition: 'background .15s', marginTop: 2 }}
      onMouseEnter={e => !loading && (e.currentTarget.style.background = A.primaryDark)}
      onMouseLeave={e => !loading && (e.currentTarget.style.background = A.primary)}
    >
      {loading ? loadingLabel : label}
    </button>
  );
}


// ═══════════════════════════════════════════════════════════════
//  ONBOARDING COMERCIAL — wizard de 3 pasos estilo panel admin
// ═══════════════════════════════════════════════════════════════
const OBP    = '#475be1';
const OBINK  = '#0f172a';
const OBINK2 = '#475569';
const OBMUTED= '#94a3b8';
const OBLINE = '#e2e8f0';
const OBBG   = '#f8fafc';
const OBCARD = '#ffffff';
const OBNAVY = '#0f172a';
const OBFONT = "'Inter', system-ui, sans-serif";
const OBGRN  = '#10b981';

// Copy/pricing de planes vive en src/lib/planes.js y se renderiza vía <PlanPicker />

// Componentes a nivel de módulo — NO definir dentro del componente
// (si se recrean en cada render, React remonta los inputs y se pierde el foco al tipear)
const OBCard = ({ children, style }) => (
  <div style={{ background:OBCARD, borderRadius:16, border:`1px solid ${OBLINE}`, padding:20, ...style }}>{children}</div>
);
const BtnNext = ({ onClick, disabled, label, saving }) => (
  <button onClick={onClick} disabled={disabled || saving}
    style={{ display:'flex', alignItems:'center', gap:8, background:(disabled||saving)?OBMUTED:OBP, color:'#fff', border:'none', borderRadius:12, padding:'13px 28px', fontFamily:OBFONT, fontSize:14, fontWeight:700, cursor:(disabled||saving)?'not-allowed':'pointer', boxShadow:'0 4px 14px rgba(71,91,225,0.25)', transition:'background .15s' }}>
    {saving ? 'Guardando...' : label}
  </button>
);

// Botón "Volver" sin borde ni fondo — se pone a la izquierda del título de cada paso.
function VolverBtn({ onClick }) {
  return (
    <button type="button" onClick={onClick}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: OBMUTED, fontFamily: OBFONT, fontSize: 13, fontWeight: 600, flexShrink: 0 }}
      onMouseEnter={e => (e.currentTarget.style.color = OBINK)}
      onMouseLeave={e => (e.currentTarget.style.color = OBMUTED)}>
      <ArrowLeft size={16} /> Volver
    </button>
  );
}

export function OnboardingComercial({ regUserId, rNombre, rApellido, rEmail, onComplete, onSalir, planDirecto }) {
  const [obStep,    setObStep]    = useState(1);
  const [doneSteps, setDoneSteps] = useState(new Set());
  // Perfil del negocio — objeto único manejado por PerfilNegocioForm
  const [perfil, setPerfil] = useState(() => perfilDesdeNegocio(null, rEmail));
  const [fotos, setFotos] = useState([]);
  // Cuenta
  const [plan, setPlan] = useState(null);
  // Oferta (paso 3) — se carga con el editor real del panel (TabOfertas).
  // Toast mínimo para el feedback que emite TabOfertas.
  const [toast, setToast] = useState(null);
  const showToast = (msg, tipo = 'ok') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 2600);
  };
  // Misc
  const [negocioId, setNegocioId] = useState(null);
  const [stubError, setStubError] = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [errors,    setErrors]    = useState({});

  // Saldo de créditos publicitarios: lo consume el paso 3 (crear cupón), que
  // puede necesitarlos para publicar. Antes lo cargaba el paso 4 (pase-regalo
  // regalo), que ya no existe.
  const [saldoCreditos, setSaldoCreditos] = useState(0);
  useEffect(() => {
    if (!negocioId) return;
    let vivo = true;
    getSaldo(negocioId).then(s => { if (vivo) setSaldoCreditos(s); }).catch(() => {});
    return () => { vivo = false; };
  }, [negocioId]);

  // Se crea un negocio "borrador" apenas arranca el wizard (con datos provisorios)
  // para que el paso 1 (Cuenta) ya tenga un negocioId real donde atar el plan,
  // los créditos y el alias — el paso 2 (Mi Empresa) lo completa con un update.
  useEffect(() => {
    if (!negocioId) crearNegocioStub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Entrada directa "Publicá GRATIS": deja el negocio en plan free y sigue el
  // wizard normal. Ya no hace falta saltear ningún paso — el primero es "Mi
  // Empresa" y el del plan sólo aparece si el rubro es alojamiento.
  useEffect(() => {
    if (negocioId && planDirecto === 'free' && !plan) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlan('free');
      supabase.from('negocios').update({ plan: 'free' }).eq('id', negocioId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [negocioId]);

  async function crearNegocioStub() {
    setStubError(null);
    try {
      // Nombre provisorio genérico — nunca el nombre y apellido de la persona:
      // negocio y persona son dos entidades distintas (como una página de empresa
      // vs. un perfil personal), aunque queden vinculadas por negocio_id.
      const { data: neg, error: negErr } = await supabase.from('negocios').insert({
        nombre: 'Mi negocio (completar datos)',
        // `aprobado: true` — la moderación previa del negocio ya no existe.
        // Nace `activo: false` sólo porque es un cascarón sin nombre real ni
        // ficha: lo prende el propio socio desde su panel cuando lo completa.
        tipo: 'alojamiento', plan: 'free', aprobado: true, activo: false,
      }).select().single();
      if (negErr) throw negErr;
      // upsert (no insert): si el usuario ya tenía perfil (p. ej. un turista que se
      // está convirtiendo en socio), esto lo actualiza en vez de chocar contra la PK.
      await supabase.from('perfiles').upsert({
        id: regUserId, nombre: `${rNombre} ${rApellido}`.trim(), email: rEmail,
        negocio_id: neg.id, rol: 'socio', es_superadmin: false,
      }, { onConflict: 'id' });
      setNegocioId(neg.id);
    } catch (err) {
      setStubError(err?.message || 'No pudimos preparar tu cuenta. Reintentá.');
    }
  }

  const stepEmpresaSave = async () => {
    if (saving) return;
    const errs = validarPerfil(perfil);
    if (Object.keys(errs).length) { setErrors(errs); window.scrollTo(0, 0); return; }
    setSaving(true);
    try {
      if (await existeNegocioConNombre(perfil.nombre, { excluirId: negocioId })) {
        setErrors({ nombre: 'Ya existe un negocio registrado con ese nombre.' });
        window.scrollTo(0, 0);
        return;
      }
      let imagenUrl = perfil.logoPreview || null;
      if (perfil.logoFile && negocioId) {
        try {
          const ext = perfil.logoFile.name.split('.').pop().toLowerCase();
          const { data: up } = await supabase.storage.from('negocios').upload(`logos/${negocioId}.${ext}`, perfil.logoFile, { upsert: true });
          if (up) { const { data: ud } = supabase.storage.from('negocios').getPublicUrl(up.path); imagenUrl = ud.publicUrl; }
        } catch { /* logo se puede subir más tarde */ }
      }
      const urlsGaleria = [];
      for (let i = 0; i < fotos.length; i++) {
        const f = fotos[i];
        if (!f.file) { urlsGaleria.push(f.src); continue; }
        try {
          const ext = f.file.name.split('.').pop().toLowerCase();
          const { data: up } = await supabase.storage.from('negocios').upload(`galeria/${negocioId}/${Date.now()}-${i}.${ext}`, f.file, { upsert: true });
          if (up) { const { data: ud } = supabase.storage.from('negocios').getPublicUrl(up.path); urlsGaleria.push(ud.publicUrl); }
        } catch { /* esa foto se puede resubir más tarde */ }
      }
      const payload = { ...perfilAPayload(perfil), imagen_url: imagenUrl, galeria: urlsGaleria };
      const { error: negErr } = await supabase.from('negocios').update(payload).eq('id', negocioId);
      if (negErr) throw negErr;
      setDoneSteps(s => new Set([...s, 1]));
      // Sólo el alojamiento/agencia pasa por el plan; el comercio va derecho
      // a crear su primer cupón, que es su única puerta de entrada.
      setObStep(perfil.tipo === 'alojamiento' ? 2 : 3);
      window.scrollTo(0, 0);
    } catch (err) { setErrors({ _: err?.message || 'Error al guardar, intentá de nuevo.' }); }
    finally { setSaving(false); }
  };

  // Elegir un plan ya persiste y avanza de paso — un solo click (sin "Siguiente" aparte).
  const confirmarFree = async () => {
    if (saving) return;
    setPlan('free');
    setSaving(true);
    try {
      if (negocioId) await supabase.from('negocios').update({ plan: 'free' }).eq('id', negocioId);
      setDoneSteps(s => new Set([...s, 2]));
      setObStep(3);
      window.scrollTo(0, 0);
    } catch { /* alta se completa igual, el socio queda en free por default */ }
    finally { setSaving(false); }
  };

  const confirmarPlus = async (datos) => {
    if (saving) return;
    setSaving(true);
    setErrors({});
    try {
      if (!negocioId) throw new Error('No pudimos preparar tu cuenta. Reintentá en unos segundos.');

      // El comprobante es secundario: si la subida falla, seguimos con el alta igual.
      let comprobanteUrl = null;
      if (datos.comprobanteFile) {
        try {
          const ext = datos.comprobanteFile.name.split('.').pop().toLowerCase();
          const { data: up } = await supabase.storage.from('negocios').upload(`comprobantes/${negocioId}.${ext}`, datos.comprobanteFile, { upsert: true });
          if (up) { const { data: ud } = supabase.storage.from('negocios').getPublicUrl(up.path); comprobanteUrl = ud.publicUrl; }
        } catch { /* comprobante opcional: no debe bloquear el alta Plus */ }
      }

      // registrarIntentoPagoTarjeta devuelve { error } — hay que chequearlo, no ignorarlo.
      const { error } = await registrarIntentoPagoTarjeta(negocioId, { ...datos, comprobanteUrl });
      if (error) throw new Error(typeof error === 'string' ? error : (error.message || 'No pudimos activar el plan.'));

      // Sólo marcamos el paso como completado si el alta realmente se guardó.
      setPlan('plus');
      setDoneSteps(s => new Set([...s, 2]));
      setObStep(3);
      window.scrollTo(0, 0);
    } catch (err) {
      setErrors({ _: err?.message || 'No pudimos activar el plan. Reintentá.' });
      window.scrollTo(0, 0);
    } finally { setSaving(false); }
  };

  // "Volver": retrocede al paso anterior del wizard; si ya estamos en el
  // primero, sale del alta comercial (misma acción que el logo).
  const irAtras = async () => {
    const prev = NAV_STEPS.map(s => s.n).filter(n => n < obStep).pop();
    if (prev) { setObStep(prev); window.scrollTo(0, 0); }
    else {
      // Si vuelve desde el primer paso, eliminar el usuario/negocio incompletos
      // para que pueda reintentar el registro desde cero con el mismo email.
      try {
        if (regUserId) {
          // Eliminar el negocio stub
          const { data: perfilData } = await supabase.from('perfiles').select('negocio_id').eq('id', regUserId).single();
          if (perfilData?.negocio_id) {
            await supabase.from('negocios').delete().eq('id', perfilData.negocio_id);
          }
          // Eliminar el perfil
          await supabase.from('perfiles').delete().eq('id', regUserId);
        }
      } catch (err) {
        console.error('Error al limpiar registro incompleto:', err);
        // Continuar igual aunque falle la limpieza
      }
      onSalir?.();
    }
  };

  // Paso 3: se omite/continúa. Las ofertas ya las persiste TabOfertas contra `promociones`.
  const step3Continuar = () => {
    setDoneSteps(s => new Set([...s, 3]));
    onComplete();
  };

  // El rubro se elige en "Mi Empresa", así que ese paso va PRIMERO: recién
  // cuando sabemos que es un alojamiento o una agencia tiene sentido mostrarle
  // un plan. Al comercio no se le ofrece nunca — entra gratis publicando.
  const esHotelero = perfil.tipo === 'alojamiento';
  const NAV_STEPS = [
    { n:1, label:'Mi Empresa',  sub:'Perfil del negocio' },
    ...(esHotelero ? [{ n:2, label:'Plan', sub:'Regalá el Pase a tus clientes' }] : []),
    { n:3, label:'Crear cupón', sub:'Captá clientes desde el día 1' },
  ];

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', background:OBBG, fontFamily:OBFONT }}>

      {/* ── Sidebar (mismo estilo que el panel admin) ── */}
      <div style={{ width:230, minWidth:230, background:OBNAVY, display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ padding:'20px 0 16px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
          <button type="button" onClick={() => onSalir?.()} title="Ir al inicio y descartar el alta comercial"
            style={{ background:'none', border:'none', padding:0, cursor:'pointer', display:'block' }}>
            <img src="/logo-cuponear-wh.svg" alt="Cuponear" style={{ width:180, height:'auto', display:'block' }} />
          </button>
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
          {perfil.tipo && <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', marginTop:2 }}>{perfil.tipo}{perfil.cats[0] ? ` · ${perfil.cats[0]}` : ''}</div>}
        </div>
      </div>

      {/* ── Contenido (mismo ancho/padding que el panel) ── */}
      <div style={{ flex:1, overflow:'auto', padding:28 }}>
        {obStep === 3 ? (
          /* Paso 3: el editor real de ofertas (el mismo del panel), a ancho completo. */
          <TabOfertas
            onboarding
            onSkip={step3Continuar}
            onVolver={irAtras}
            negocioId={negocioId}
            negocioTipo={perfil.tipo}
            plan={plan || 'free'}
            showToast={showToast}
            saldoTokens={saldoCreditos}
            setSaldoTokens={setSaldoCreditos}
            onUpgrade={() => {}}
          />
        ) : (
        <div style={{ maxWidth:740 }}>
          <div style={{ fontSize:11, fontWeight:700, color:OBMUTED, letterSpacing:'0.08em', marginBottom:8 }}>PASO {obStep} DE {NAV_STEPS.length}</div>

          {/* ── Paso 2: Mi Empresa ── */}
          {obStep === 1 && (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                  <VolverBtn onClick={irAtras} />
                  <h1 style={{ margin:0, fontSize:24, fontWeight:800, color:OBINK }}>Tu perfil de negocio</h1>
                </div>
                <p style={{ margin:0, fontSize:13, color:OBINK2 }}>Esta info aparece en tu ficha pública. Los campos con <span style={{ color:'#ef4444' }}>*</span> son obligatorios.</p>
              </div>

              <PerfilNegocioForm value={perfil} onChange={setPerfil} errors={errors} />

              <OBCard>
                <GaleriaFotos fotos={fotos} onChange={setFotos} maxFotos={FOTOS_GALERIA_MAX[plan || 'free']} />
              </OBCard>

              {errors._ && <div style={{ padding:'10px 14px', background:'#fef2f2', borderRadius:10, fontSize:13, color:'#ef4444', fontFamily:OBFONT }}>{errors._}</div>}

              <div style={{ display:'flex', justifyContent:'center', paddingBottom:40 }}>
                <BtnNext onClick={stepEmpresaSave} saving={saving} label="Siguiente →" />
              </div>
            </div>
          )}

          {/* ── Paso 2: Plan (sólo alojamientos y agencias) ── */}
          {obStep === 2 && (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <VolverBtn onClick={irAtras} />
                <h1 style={{ margin:0, fontSize:24, fontWeight:800, color:OBINK }}>Regalá el pase a tus clientes</h1>
              </div>

              {errors._ && <div style={{ padding:'10px 14px', background:'#fef2f2', borderRadius:10, fontSize:13, color:'#ef4444', fontFamily:OBFONT }}>{errors._}</div>}

              {!negocioId ? (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, padding:'40px 0' }}>
                  {stubError ? (
                    <>
                      <p style={{ fontSize:13, color:'#ef4444', fontFamily:OBFONT, margin:0 }}>{stubError}</p>
                      <button type="button" onClick={crearNegocioStub} style={{ background:OBP, color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontFamily:OBFONT, fontSize:13, fontWeight:700, cursor:'pointer' }}>Reintentar</button>
                    </>
                  ) : (
                    <p style={{ fontSize:13, color:OBMUTED, fontFamily:OBFONT }}>Preparando tu cuenta…</p>
                  )}
                </div>
              ) : (
                <PlanPicker
                  primaryColor={OBP}
                  saving={saving}
                  unidadesDeclaradas={UNIDADES_DEFAULT}
                  onConfirmFree={confirmarFree}
                  onConfirmPlus={confirmarPlus}
                />
              )}
            </div>
          )}

        </div>
        )}
      </div>

      {toast && (
        <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', zIndex:10000, background: toast.tipo === 'err' ? '#ef4444' : OBINK, color:'#fff', padding:'11px 20px', borderRadius:12, fontFamily:OBFONT, fontSize:13, fontWeight:600, boxShadow:'0 12px 32px rgba(0,0,0,0.28)' }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  PANTALLA LOGIN
// ═══════════════════════════════════════════════════════════════
export default function LoginView({ onLoginSuccess, onBack, onOnboardingComplete, onTuristaRegistrada, initialTab = 'ingresar', initialEmail = '', initialModoRegistro = null }) {
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

  // ── Datos de cuenta (común a visitante y comercial) ──
  const [rNombre,   setRNombre]   = useState('');
  const [rApellido, setRApellido] = useState('');
  // Viene precargado cuando el turista ya compró el pase dejando su mail.
  const [rEmail,    setREmail]    = useState(initialEmail);
  const [rPass,     setRPass]     = useState('');
  const [rPass2,    setRPass2]    = useState('');
  const [rShowPass, setRShowPass] = useState(false);
  const [terminos,  setTerminos]  = useState(false);

  // ── Modo de registro: se elige en dos tarjetas ANTES del formulario.
  //    null = todavía no eligió · 'turista' · 'comercial'
  const [modoRegistro,  setModoRegistro]  = useState(initialModoRegistro);
  const esComercial = modoRegistro === 'comercial';
  const [regUserId,     setRegUserId]     = useState(null); // userId creado en paso 1

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
      // No permitimos dos cuentas con el mismo nombre y apellido (no se valida
      // de nuevo si ya se creó la cuenta y sólo estamos volviendo del paso 2).
      if (!regUserId) {
        const yaExiste = await existePersonaConNombre(`${rNombre} ${rApellido}`);
        if (yaExiste) { setError('Ya existe una cuenta registrada con ese nombre y apellido.'); setLoading(false); return; }
      }
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
        // Visitante: crear cuenta y pasar directo a la home ya logueado
        await registrarTurista({ nombre: rNombre, apellido: rApellido, email: rEmail, password: rPass });
        await onTuristaRegistrada?.();
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

  // Google es un redirect: la intención "comercial" se pierde en el viaje de
  // ida/vuelta, así que la guardamos con timestamp antes de salir. Al volver,
  // App la lee y manda al alta comercial en vez de dejarlo como turista.
  const handleGoogle = async (intent) => {
    setError(''); setLoading(true);
    try {
      if (intent === 'comercial') {
        localStorage.setItem('cuponear_reg_intent', JSON.stringify({ modo: 'comercial', ts: Date.now() }));
      } else {
        localStorage.removeItem('cuponear_reg_intent');
      }
      await loginConGoogle();
    } catch {
      localStorage.removeItem('cuponear_reg_intent');
      setError('No se pudo conectar con Google. Intentá de nuevo.'); setLoading(false);
    }
  };

  const switchTab = (t) => {
    setTab(t); setError(''); setExito(''); setRegStep(1);
    setModoRegistro(null); setRegUserId(null);
  };

  // ─── Render ──────────────────────────────────────────────────
  // Onboarding comercial — paso 2 → wizard de 3 pasos en pantalla completa
  if (tab === 'registrarse' && regStep === 2 && esComercial) {
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
        onSalir={() => { setModoRegistro(null); onBack?.(); }}
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
          <img src="/logo-cuponear.svg" alt="Cuponear" style={{ height: 42, width: 'auto' }} />
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
              <BtnGoogle onClick={() => handleGoogle()} loading={loading} />
              <Divisor />
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
            </form>
          )}

          {/* ══ REGISTRARSE ══ */}
          {tab === 'registrarse' && (
            <div>

              {/* ── PASO 1a — Elegir tipo de cuenta (dos tarjetas) ── */}
              {regStep === 1 && !modoRegistro && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: A.ink, fontFamily: A.font }}>¿Cómo vas a usar Cuponear?</div>
                    <div style={{ fontSize: 13, color: A.muted, marginTop: 4, fontFamily: A.font }}>Elegí una opción para empezar tu registro.</div>
                  </div>
                  {[
                    { id: 'turista',   Icon: User, titulo: 'Soy turista', desc: 'Explorá descuentos de la zona, armá tu carrito y disfrutá todos los beneficios.' },
                    { id: 'comercial', Icon: Store,  titulo: 'Tengo un negocio',          desc: 'Armá tu ficha de negocio, publicá ofertas y sumá clientes. ¡Empezá GRATIS!' },
                  ].map(o => (
                    <button key={o.id} type="button" onClick={() => { setModoRegistro(o.id); setError(''); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', padding: '16px', borderRadius: 16, border: `1.5px solid ${A.line}`, background: '#fff', cursor: 'pointer', transition: 'all .15s', fontFamily: A.font }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = A.primary; e.currentTarget.style.background = A.primarySoft; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = A.line; e.currentTarget.style.background = '#fff'; }}>
                      <div style={{ width: 46, height: 46, borderRadius: 12, background: A.primarySoft, color: A.primary, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <o.Icon size={22} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: A.ink }}>{o.titulo}</div>
                        <div style={{ fontSize: 12.5, color: A.muted, marginTop: 3, lineHeight: 1.45 }}>{o.desc}</div>
                      </div>
                      <ChevronRight size={18} color={A.muted} style={{ flexShrink: 0 }} />
                    </button>
                  ))}
                </div>
              )}

              {/* ── PASO 1b — Datos de cuenta (según el modo elegido) ── */}
              {regStep === 1 && modoRegistro && (
                <form onSubmit={handleAccountSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Si el modo vino fijado desde afuera (p. ej. "Publicá una
                      oferta"), no se ofrece volver al selector: esa entrada es
                      sólo de negocio. */}
                  {!initialModoRegistro && (
                    <button type="button" onClick={() => { setModoRegistro(null); setError(''); }}
                      style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: A.muted, fontSize: 13, fontWeight: 600, fontFamily: A.font }}>
                      ← {esComercial ? 'Tengo un negocio' : 'Quiero aprovechar ofertas'} · Cambiar
                    </button>
                  )}

                  <BtnGoogle onClick={() => handleGoogle(esComercial ? 'comercial' : undefined)} loading={loading}
                    label={esComercial ? 'Continuar con Google' : 'Registrarse con Google'} />
                  <Divisor />

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

                  {esComercial && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, border: `1px solid ${A.line}`, background: A.primarySoft, borderRadius: 12, padding: '12px 14px' }}>
                      <Store size={16} color={A.primary} style={{ flexShrink: 0, marginTop: 1 }} />
                      <div style={{ fontSize: 12.5, color: A.ink2, lineHeight: 1.5, fontFamily: A.font }}>
                        Vas a poder <strong style={{ color: A.ink }}>crear cupones</strong> y armar tu ficha. El rubro (alojamiento, salidas o aventura &amp; relax) lo elegís en el próximo paso.
                      </div>
                    </div>
                  )}

                  <Terminos checked={terminos} onChange={setTerminos} />
                  <BtnSubmit loading={loading} label={esComercial ? 'Continuar' : 'Crear mi cuenta'} loadingLabel={esComercial ? 'Continuando...' : 'Creando cuenta...'} />
                </form>
              )}

              {/* ── PASO 2 — Ficha del negocio (comercial) ── */}
              {/* paso 2 → se renderiza como OnboardingComercial antes del return */}

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
