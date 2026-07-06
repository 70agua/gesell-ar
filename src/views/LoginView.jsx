// ============================================================
//  src/views/LoginView.jsx
// ============================================================
import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, AlertCircle, Check, Mail, Lock, User, Store, Coins, Trash2 } from 'lucide-react';
import { login, registrarTurista, loginConGoogle } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { registrarIntentoPagoTarjeta, FOTOS_GALERIA_MAX } from '../lib/planes';
import { getSaldo } from '../lib/cobros';
import {
  getCuponerasRegalo, crearCuponeraRegalo, cambiarEstadoCuponera,
  agregarCupon, quitarCupon, buscarPromosDisponibles, costoCreditosDePromo, sugerirCupones,
} from '../lib/cuponerasRegalo';
import PlanPicker from '../components/PlanPicker';
import GaleriaFotos from '../components/GaleriaFotos';
import PerfilNegocioForm from '../components/PerfilNegocioForm';
import { perfilDesdeNegocio, perfilAPayload, validarPerfil } from '../lib/perfilNegocio';

// ─── Helpers ─────────────────────────────────────────────────
function getSiteName() {
  if (typeof window === 'undefined') return 'gesell.ar';
  const h = window.location.hostname.replace('www.', '');
  return h === 'localhost' ? 'gesell.ar' : h;
}

// Cupo semanal por defecto de activaciones de cuponera regalo
// (socio_alias.unidades_declaradas) — ya no se le pregunta al socio en el alta.
const UNIDADES_DEFAULT = 20;

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

// Copy/pricing de planes vive en src/lib/planes.js y se renderiza vía <PlanPicker />

// Componentes a nivel de módulo — NO definir dentro del componente
// (si se recrean en cada render, React remonta los inputs y se pierde el foco al tipear)
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
  // Perfil del negocio — objeto único manejado por PerfilNegocioForm
  const [perfil, setPerfil] = useState(() => perfilDesdeNegocio(null, rEmail));
  const [fotos, setFotos] = useState([]);
  // Cuenta
  const [plan, setPlan] = useState(null);
  // Oferta
  const [ofTitulo, setOfTitulo] = useState('');
  const [ofPct,    setOfPct]    = useState('');
  const [ofDesc,   setOfDesc]   = useState('');
  const [ofTipo,   setOfTipo]   = useState('Normal'); // 'Normal' | 'Flash'
  const [ofFechaFinFlash, setOfFechaFinFlash] = useState('');
  const [ofImagenFile, setOfImagenFile]       = useState(null);
  const [ofImagenPreview, setOfImagenPreview] = useState(null);
  const ofImagenRef = useRef();
  // Cuponera regalo (paso 4, solo Plus)
  const [cuponeraId, setCuponeraId]   = useState(null);
  const [saldoCreditos, setSaldoCreditos] = useState(0);
  const [aliasSocio, setAliasSocio]   = useState(null);
  const [cuponesCup, setCuponesCup]   = useState([]);
  const [busTexto, setBusTexto]       = useState('');
  const [busResultados, setBusResultados] = useState([]);
  const [busLoading, setBusLoading]   = useState(false);
  const [showCrearOtra, setShowCrearOtra] = useState(false);
  const [nuevaCupNombre, setNuevaCupNombre] = useState('');
  const [cup4Loading, setCup4Loading] = useState(true);
  const [cup4Error, setCup4Error]     = useState('');
  const [puedeCompartir, setPuedeCompartir] = useState(true);
  // Misc
  const [negocioId, setNegocioId] = useState(null);
  const [stubError, setStubError] = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [errors,    setErrors]    = useState({});

  // Estilos compartidos por los pasos 3 y 4 (el paso 2 los trae PerfilNegocioForm)
  const inp = { width:'100%', boxSizing:'border-box', padding:'10px 14px', borderRadius:10, border:`1px solid ${OBLINE}`, fontFamily:OBFONT, fontSize:13, color:OBINK, outline:'none', background:'#fff', transition:'border-color .15s' };
  const lbl = { fontFamily:OBFONT, fontSize:11, fontWeight:700, color:OBINK2, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' };

  // Se crea un negocio "borrador" apenas arranca el wizard (con datos provisorios)
  // para que el paso 1 (Cuenta) ya tenga un negocioId real donde atar el plan,
  // los créditos y el alias — el paso 2 (Mi Empresa) lo completa con un update.
  useEffect(() => {
    if (!negocioId) crearNegocioStub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function crearNegocioStub() {
    setStubError(null);
    try {
      const { data: neg, error: negErr } = await supabase.from('negocios').insert({
        nombre: `${rNombre} ${rApellido}`.trim() || 'Nuevo negocio',
        tipo: 'alojamiento', plan: 'free', aprobado: false, activo: false,
      }).select().single();
      if (negErr) throw negErr;
      await supabase.from('perfiles').insert({
        id: regUserId, nombre: `${rNombre} ${rApellido}`.trim(), email: rEmail,
        negocio_id: neg.id, rol: 'socio', es_superadmin: false,
      });
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
      setDoneSteps(s => new Set([...s, 2]));
      setObStep(3);
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
      setDoneSteps(s => new Set([...s, 1]));
      setObStep(2);
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
      if (error) throw new Error(typeof error === 'string' ? error : (error.message || 'No pudimos activar el plan Plus.'));

      // Sólo marcamos el paso como completado si el alta realmente se guardó.
      setPlan('plus');
      setDoneSteps(s => new Set([...s, 1]));
      setObStep(2);
      window.scrollTo(0, 0);
    } catch (err) {
      setErrors({ _: err?.message || 'No pudimos activar el plan Plus. Reintentá.' });
      window.scrollTo(0, 0);
    } finally { setSaving(false); }
  };

  const handleOfImagenChange = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    setOfImagenFile(f);
    const reader = new FileReader();
    reader.onload = ev => setOfImagenPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const step3Save = async () => {
    if (saving || !ofTitulo.trim() || !ofPct) return;
    setSaving(true);
    try {
      let imagenUrl = null;
      if (ofImagenFile && negocioId) {
        try {
          const ext = ofImagenFile.name.split('.').pop().toLowerCase();
          const { data: up } = await supabase.storage.from('negocios').upload(`promos/${negocioId}-${Date.now()}.${ext}`, ofImagenFile, { upsert: true });
          if (up) { const { data: ud } = supabase.storage.from('negocios').getPublicUrl(up.path); imagenUrl = ud.publicUrl; }
        } catch { /* imagen se puede subir más tarde */ }
      }
      if (negocioId) await supabase.from('promociones').insert({
        negocio_id: negocioId, titulo: ofTitulo.trim(),
        descripcion: ofDesc.trim() || null, badge: `-${ofPct}%`,
        offer_type: ofTipo, fecha_fin_flash: ofTipo === 'Flash' && ofFechaFinFlash ? ofFechaFinFlash : null,
        imagen_url: imagenUrl, aprobada: false, activa: false,
      });
      setDoneSteps(s => new Set([...s, 3]));
      if (plan === 'plus') { setObStep(4); window.scrollTo(0, 0); }
      else onComplete();
    } catch {
      if (plan === 'plus') { setDoneSteps(s => new Set([...s, 3])); setObStep(4); window.scrollTo(0, 0); }
      else onComplete();
    }
    finally { setSaving(false); }
  };

  // ── Paso 4 (solo Plus): armar la primera cuponera regalo ──
  async function cargarPaso4() {
    setCup4Loading(true);
    const [cups, saldo, aliasRes, negRes] = await Promise.all([
      getCuponerasRegalo(negocioId),
      getSaldo(negocioId),
      supabase.from('socio_alias').select('codigo, unidades_declaradas').eq('negocio_id', negocioId).maybeSingle(),
      supabase.from('negocios').select('puede_compartir_cuponeras').eq('id', negocioId).single(),
    ]);
    let cup = cups[0];
    if (!cup) {
      const { data } = await crearCuponeraRegalo(negocioId, 'Mi primera cuponera');
      cup = { ...data, cuponeras_regalo_cupones: [] };
    }
    setCuponeraId(cup.id);
    setCuponesCup(cup.cuponeras_regalo_cupones || []);
    setSaldoCreditos(saldo);
    setAliasSocio(aliasRes.data || null);
    setPuedeCompartir(negRes.data?.puede_compartir_cuponeras !== false);
    setBusResultados(await buscarPromosDisponibles({ localidad: perfil.localidad }));
    setCup4Loading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (obStep === 4 && negocioId) cargarPaso4();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obStep, negocioId]);

  async function refrescarPaso4() {
    const [cups, saldo] = await Promise.all([getCuponerasRegalo(negocioId), getSaldo(negocioId)]);
    const cup = cups.find(c => c.id === cuponeraId) || cups[0];
    setCuponesCup(cup?.cuponeras_regalo_cupones || []);
    setSaldoCreditos(saldo);
  }

  async function handleAgregarCupon4(promo) {
    if (cuponesCup.some(c => c.promocion_id === promo.id)) return;
    const { error } = await agregarCupon(negocioId, cuponeraId, promo, cuponesCup.length);
    if (error) { setCup4Error(error); return; }
    setCup4Error('');
    await refrescarPaso4();
  }

  async function handleSugerir4() {
    setBusLoading(true);
    const excluirIds = cuponesCup.map(c => c.promocion_id);
    setBusResultados(await sugerirCupones(perfil.localidad, { excluirIds }));
    setBusLoading(false);
  }

  async function handleQuitarCupon4(cuponeraCuponId) {
    await quitarCupon(negocioId, cuponeraCuponId);
    await refrescarPaso4();
  }

  async function handleCrearOtraCuponera() {
    if (!nuevaCupNombre.trim()) return;
    const { data } = await crearCuponeraRegalo(negocioId, nuevaCupNombre.trim());
    setCuponeraId(data.id);
    setCuponesCup([]);
    setNuevaCupNombre('');
    setShowCrearOtra(false);
  }

  async function finalizarPaso4() {
    if (cuponesCup.length > 0 && puedeCompartir) await cambiarEstadoCuponera(cuponeraId, 'activa');
    onComplete();
  }

  const NAV_STEPS = [
    { n:1, label:'Cuenta',       sub:'Planes para socios' },
    { n:2, label:'Mi Empresa',   sub:'Perfil del negocio' },
    { n:3, label:'Crear oferta', sub:'Captá clientes desde el día 1' },
    ...(plan === 'plus' ? [{ n:4, label:'Cuponera regalo', sub:'Regalale a tus huéspedes' }] : []),
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
          {perfil.tipo && <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', marginTop:2 }}>{perfil.tipo}{perfil.cats[0] ? ` · ${perfil.cats[0]}` : ''}</div>}
        </div>
      </div>

      {/* ── Contenido (mismo ancho/padding que el panel) ── */}
      <div style={{ flex:1, overflow:'auto', padding:28 }}>
        <div style={{ maxWidth:740 }}>
          <div style={{ fontSize:11, fontWeight:700, color:OBMUTED, letterSpacing:'0.08em', marginBottom:8 }}>PASO {obStep} DE {NAV_STEPS.length}</div>

          {/* ── Paso 2: Mi Empresa ── */}
          {obStep === 2 && (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <div>
                <h1 style={{ margin:'0 0 6px', fontSize:24, fontWeight:800, color:OBINK }}>Tu perfil de negocio</h1>
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

          {/* ── Paso 1: Cuenta ── */}
          {obStep === 1 && (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <div>
                <h1 style={{ margin:'0 0 6px', fontSize:24, fontWeight:800, color:OBINK }}>Elegí tu plan</h1>
                <p style={{ margin:0, fontSize:13, color:OBINK2 }}>Podés empezar gratis y actualizar cuando quieras. El cobro se activa cuando tu ficha sea aprobada.</p>
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
                  value={plan}
                  primaryColor={OBP}
                  saving={saving}
                  unidadesDeclaradas={UNIDADES_DEFAULT}
                  onConfirmFree={confirmarFree}
                  onConfirmPlus={confirmarPlus}
                />
              )}
            </div>
          )}

          {/* ── Paso 3: Crear oferta ── */}
          {obStep === 3 && (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <div>
                <h1 style={{ margin:'0 0 6px', fontSize:24, fontWeight:800, color:OBINK }}>Cargá tu primera oferta</h1>
                <p style={{ margin:0, fontSize:13, color:OBINK2 }}>Las ofertas aparecen en tu ficha y en el marketplace cuando tu cuenta sea aprobada. Podés editarlas en cualquier momento.</p>
              </div>

              <OBCard>
                <div style={{ display:'flex', gap:20, alignItems:'flex-start' }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, flexShrink:0 }}>
                    <div onClick={() => ofImagenRef.current?.click()} style={{ width:140, height:140, borderRadius:20, border:`2px dashed ${ofImagenPreview?OBP:OBLINE}`, cursor:'pointer', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', background:OBBG }}>
                      {ofImagenPreview
                        ? <img src={ofImagenPreview} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        : <span style={{ fontSize:12, fontWeight:700, color:OBMUTED, fontFamily:OBFONT }}>Foto</span>
                      }
                    </div>
                    <button type="button" onClick={() => ofImagenRef.current?.click()} style={{ fontSize:11, fontWeight:700, color:OBP, background:'none', border:'none', cursor:'pointer', fontFamily:OBFONT }}>{ofImagenPreview?'Cambiar foto':'Subir foto'}</button>
                    <input ref={ofImagenRef} type="file" accept="image/*" onChange={handleOfImagenChange} style={{ display:'none' }} />
                  </div>

                  <div style={{ flex:1, display:'flex', flexDirection:'column', gap:14 }}>
                    <div>
                      <label style={lbl}>Título de la oferta <span style={{ color:'#ef4444' }}>*</span></label>
                      <input value={ofTitulo} onChange={e => setOfTitulo(e.target.value)} style={inp} placeholder="Ej: Noche + desayuno para 2 personas" />
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                      <div>
                        <label style={lbl}>Descuento <span style={{ color:'#ef4444' }}>*</span></label>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <input type="number" min={1} max={99} value={ofPct} onChange={e => setOfPct(e.target.value)} style={{ ...inp, width:110 }} placeholder="20" />
                          <span style={{ fontSize:22, fontWeight:700, color:OBINK2 }}>%</span>
                        </div>
                      </div>
                      <div>
                        <label style={lbl}>Tipo de oferta</label>
                        <select value={ofTipo} onChange={e => setOfTipo(e.target.value)} style={{ ...inp, cursor:'pointer' }}>
                          <option value="Normal">Normal</option>
                          <option value="Flash">Flash (con cuenta regresiva)</option>
                        </select>
                      </div>
                    </div>
                    {ofTipo === 'Flash' && (
                      <div>
                        <label style={lbl}>Vence el <span style={{ color:'#ef4444' }}>*</span></label>
                        <input type="datetime-local" value={ofFechaFinFlash} onChange={e => setOfFechaFinFlash(e.target.value)} style={{ ...inp, maxWidth:220 }} />
                      </div>
                    )}
                    <div>
                      <label style={lbl}>Descripción breve <span style={{ textTransform:'none', fontWeight:400, color:OBMUTED }}>— opcional</span></label>
                      <textarea value={ofDesc} onChange={e => setOfDesc(e.target.value)} rows={3}
                        placeholder="Qué incluye, condiciones, vigencia..."
                        style={{ ...inp, resize:'vertical', minHeight:70 }} />
                    </div>
                  </div>
                </div>
              </OBCard>

              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, paddingBottom:40 }}>
                <BtnNext onClick={step3Save} saving={saving} disabled={!ofTitulo.trim() || !ofPct} label={plan === 'plus' ? 'Guardar y seguir' : 'Guardar y terminar'} />
                <button onClick={() => (plan === 'plus' ? setObStep(4) : onComplete())} style={{ fontSize:13, color:OBMUTED, background:'none', border:'none', cursor:'pointer', fontFamily:OBFONT, fontWeight:600 }}>
                  Lo haré más tarde →
                </button>
              </div>
            </div>
          )}

          {/* ── Paso 4: Cuponera regalo (solo Plus) ── */}
          {obStep === 4 && (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <div>
                <h1 style={{ margin:'0 0 6px', fontSize:24, fontWeight:800, color:OBINK }}>Armá tu primera cuponera regalo</h1>
                <p style={{ margin:0, fontSize:13, color:OBINK2 }}>Sumale cupones de otros socios y regalásela a tus huéspedes con tu alias. La pagás una sola vez al armarla — hoy tenés créditos de bienvenida para empezar.</p>
              </div>

              {cup4Loading ? (
                <div style={{ padding:'30px 0', textAlign:'center', fontFamily:OBFONT, fontSize:13, color:OBMUTED }}>Cargando…</div>
              ) : (
                <>
                  <div style={{ display:'flex', gap:14, alignItems:'center' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, fontFamily:OBFONT, fontSize:13, color:OBINK2 }}>
                      <Coins size={16} color="#f59e0b" /> <b style={{ color:OBINK }}>{saldoCreditos}</b> créditos disponibles
                    </div>
                    {aliasSocio && (
                      <div style={{ fontFamily:OBFONT, fontSize:13, color:OBINK2 }}>
                        Alias: <b style={{ color:OBINK }}>{aliasSocio.codigo}</b> · {aliasSocio.unidades_declaradas} activaciones/semana
                      </div>
                    )}
                  </div>

                  {cup4Error && <div style={{ padding:'10px 14px', background:'#fef2f2', borderRadius:10, fontSize:13, color:'#ef4444', fontFamily:OBFONT }}>{cup4Error}</div>}

                  <OBCard>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                      <OBCardTitle label="Cupones incluidos" />
                      {!showCrearOtra && (
                        <button type="button" onClick={() => setShowCrearOtra(true)} style={{ fontSize:12, fontWeight:700, color:OBP, background:'none', border:'none', cursor:'pointer', fontFamily:OBFONT }}>
                          Crear otra cuponera
                        </button>
                      )}
                    </div>

                    {showCrearOtra && (
                      <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                        <input value={nuevaCupNombre} onChange={e => setNuevaCupNombre(e.target.value)} placeholder="Nombre de la nueva cuponera" style={inp} onKeyDown={e => e.key === 'Enter' && handleCrearOtraCuponera()} />
                        <button type="button" onClick={handleCrearOtraCuponera} style={{ background:OBP, color:'#fff', border:'none', borderRadius:10, padding:'0 16px', fontFamily:OBFONT, fontSize:13, fontWeight:700, cursor:'pointer' }}>Crear</button>
                        <button type="button" onClick={() => setShowCrearOtra(false)} style={{ background:'transparent', color:OBMUTED, border:`1px solid ${OBLINE}`, borderRadius:10, padding:'0 14px', fontFamily:OBFONT, fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancelar</button>
                      </div>
                    )}

                    {cuponesCup.length === 0 ? (
                      <div style={{ textAlign:'center', padding:'24px 0', color:OBMUTED, fontFamily:OBFONT, fontSize:13 }}>
                        Todavía no agregaste cupones — elegí alguno de la lista de abajo.
                      </div>
                    ) : (
                      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:4 }}>
                        {cuponesCup.map(cup => (
                          <div key={cup.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:10, border:`1px solid ${OBLINE}` }}>
                            <img src={cup.promociones?.imagen_url || '/cuponera-coin.svg'} alt="" style={{ width:38, height:38, borderRadius:8, objectFit:'cover', flexShrink:0 }} />
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontFamily:OBFONT, fontSize:13, fontWeight:700, color:OBINK, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{cup.promociones?.titulo}</div>
                              <div style={{ fontFamily:OBFONT, fontSize:11, color:OBMUTED }}>{cup.promociones?.negocios?.nombre}</div>
                            </div>
                            <span style={{ fontSize:11, fontWeight:700, color:OBINK2, display:'flex', alignItems:'center', gap:4, fontFamily:OBFONT, flexShrink:0 }}>
                              <Coins size={12} color="#f59e0b" /> {cup.costo_creditos}
                            </span>
                            <button type="button" onClick={() => handleQuitarCupon4(cup.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', padding:4, flexShrink:0 }}><Trash2 size={14} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </OBCard>

                  <OBCard>
                    <OBCardTitle label={`Catálogo en ${perfil.localidad || 'tu localidad'}`} />
                    <button type="button" onClick={handleSugerir4} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:OBPS, color:OBP, border:`1.5px dashed ${OBP}55`, borderRadius:10, padding:'10px 0', fontFamily:OBFONT, fontSize:12.5, fontWeight:700, cursor:'pointer', marginBottom:12 }}>
                      <Coins size={14} color="#f59e0b" /> Sugerir cupones de mi zona automáticamente
                    </button>
                    <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                      <input value={busTexto} onChange={e => setBusTexto(e.target.value)}
                        onKeyDown={async e => { if (e.key === 'Enter') { setBusLoading(true); setBusResultados(await buscarPromosDisponibles({ localidad: perfil.localidad, texto: busTexto })); setBusLoading(false); } }}
                        placeholder="Buscar por título..." style={inp} />
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:280, overflowY:'auto' }}>
                      {busLoading ? (
                        <div style={{ textAlign:'center', padding:20, color:OBMUTED, fontFamily:OBFONT, fontSize:13 }}>Buscando…</div>
                      ) : busResultados.length === 0 ? (
                        <div style={{ textAlign:'center', padding:20, color:OBMUTED, fontFamily:OBFONT, fontSize:13 }}>Sin resultados</div>
                      ) : busResultados.map(p => {
                        const costo = costoCreditosDePromo(p);
                        const yaIncluido = cuponesCup.some(c => c.promocion_id === p.id);
                        return (
                          <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:10, border:`1px solid ${OBLINE}` }}>
                            <img src={p.imagen_url || '/cuponera-coin.svg'} alt="" style={{ width:38, height:38, borderRadius:8, objectFit:'cover', flexShrink:0 }} />
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontFamily:OBFONT, fontSize:13, fontWeight:700, color:OBINK, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.titulo}</div>
                              <div style={{ fontFamily:OBFONT, fontSize:11, color:OBMUTED }}>{p.negocios?.nombre}</div>
                            </div>
                            <span style={{ fontSize:11, fontWeight:700, color:OBINK2, display:'flex', alignItems:'center', gap:4, fontFamily:OBFONT, flexShrink:0 }}>
                              <Coins size={12} color="#f59e0b" /> {costo}
                            </span>
                            <button type="button" disabled={yaIncluido} onClick={() => handleAgregarCupon4(p)}
                              style={{ background:yaIncluido?OBLINE:OBPS, color:yaIncluido?OBMUTED:OBP, border:'none', borderRadius:8, padding:'6px 12px', fontFamily:OBFONT, fontSize:12, fontWeight:700, cursor:yaIncluido?'default':'pointer', flexShrink:0 }}>
                              {yaIncluido ? 'Agregado' : 'Agregar'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </OBCard>

                  {!puedeCompartir && cuponesCup.length > 0 && (
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', fontFamily:OBFONT, fontSize: 12, color: '#b45309' }}>
                      Tu comprobante de transferencia está pendiente de aprobación — tu cuponera queda en borrador y la vas a poder publicar desde el panel apenas se apruebe.
                    </div>
                  )}

                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, paddingBottom:40 }}>
                    <BtnNext onClick={finalizarPaso4} saving={saving} label={cuponesCup.length > 0 && puedeCompartir ? 'Publicar y terminar' : 'Terminar'} />
                    <button onClick={onComplete} style={{ fontSize:13, color:OBMUTED, background:'none', border:'none', cursor:'pointer', fontFamily:OBFONT, fontWeight:600 }}>
                      Lo haré más tarde →
                    </button>
                  </div>
                </>
              )}
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

  const handleGoogle = async () => {
    setError(''); setLoading(true);
    try { await loginConGoogle(); }
    catch { setError('No se pudo conectar con Google. Intentá de nuevo.'); setLoading(false); }
  };

  const switchTab = (t) => {
    setTab(t); setError(''); setExito(''); setExitoTipo(null); setRegStep(1);
    setEsComercial(false); setRegUserId(null);
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
