// ============================================================
//  src/views/SociosView.jsx
// ============================================================

import React, { useState } from 'react';
import { Check, Zap, Crown, ArrowRight, X, Store, Mail, Lock, Minus, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';

const PLANES = [
  {
    id: 'free',
    nombre: 'FREEMIUM',
    precioMes: null,
    precioAnio: null,
    precioSinImpuestos: null,
    color: 'border-slate-200',
    badge: null,
    icon: <Store size={26} className="text-slate-400" />,
    items: [
      { text: 'Presencia SIN CARGO en listado de alojamientos' },
      { text: 'Panel de administración BÁSICO' },
      { text: 'Ficha: hasta 4 fotos, mapa de ubicación y detalles del alojamiento' },
      { text: 'Sin formulario de contacto directo', negative: true },
    ],
    paymentNote: 'Publicás ofertas SIN CARGO. Cuando un huésped la canjea, pagás 8 créditos. Total: $16.000 + IVA',
    cta: 'Registrarse gratis',
    ctaColor: 'bg-slate-900 hover:bg-slate-800 text-white',
  },
  {
    id: 'plus',
    nombre: 'PLUS',
    precioMes: 20000,
    precioAnio: 240000,
    precioSinImpuestos: '$189.600',
    color: 'border-blue-500 shadow-xl shadow-blue-100',
    badge: 'Más elegido',
    badgeColor: 'bg-blue-600',
    icon: <Zap size={26} className="text-blue-600" />,
    items: [
      { text: 'Presencia y mayor relevancia en el listado' },
      { text: 'Panel de administración AVANZADO (hasta 20 fotos)' },
      { text: 'Sello "Socio verificado" visible en el listado' },
      { text: 'Gestión de precios a la vista (opcional)' },
      { text: 'Formulario de contacto directo' },
      { text: 'Estadísticas: vistas, clics y canjes' },
      { text: 'Reseñas verificadas de huéspedes que canjearon' },
      { text: 'Aparición rotativa en newsletter mensual' },
      { text: 'Beneficios exclusivos con socios aliados' },
    ],
    paymentNote: 'Publicás ofertas SIN CARGO. Cuando un huésped la canjea, pagás 2 créditos. Total: $4.000 + IVA',
    cta: 'Comenzar en PLUS',
    ctaColor: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  {
    id: 'black',
    nombre: 'BLACK',
    precioMes: 29000,
    precioAnio: 348000,
    precioSinImpuestos: '$274.920',
    color: 'border-slate-900 shadow-xl shadow-slate-200',
    badge: 'Premium',
    badgeColor: 'bg-slate-900',
    icon: <Crown size={26} className="text-amber-500" />,
    items: [
      { text: 'Todo lo que incluye PLUS, más:', bold: true },
      { text: 'Presencia estelar en "Alojamientos destacados"' },
      { text: 'Presencia en Mail Marketing, redes y Google Ads' },
      { text: 'Onboarding personalizado por el equipo' },
      { text: 'Informes de rendimiento mensuales' },
      { text: 'Prioridad en fechas pico (Carnaval, Semana Santa, verano)' },
    ],
    paymentNote: 'Publicás ofertas SIN CARGO. Cuando un huésped la canjea, pagás 2 créditos. Total: $4.000 + IVA',
    cta: 'Comenzar en BLACK',
    ctaColor: 'bg-slate-900 hover:bg-black text-white',
  },
];

const OTROS_SERVICIOS = [
  {
    titulo: 'Marketing Digital',
    items: [
      'Community Management (redes sociales)',
      'Diseño gráfico (logo, folletos, web)',
      'Fotografía profesional',
      'Consultoría SEO / Paid Media',
      'Automatización con IA (muy pronto)',
    ],
  },
  {
    titulo: 'Gastronomía',
    items: [
      'Catering y organización de eventos',
      'Box de desayunos a pedido',
      'Viandas congeladas para ofrecer a tus huéspedes',
    ],
  },
];

// ─── Modal presupuesto ────────────────────────────────────────
function ModalPresupuesto({ servicio, onClose }) {
  const [enviado, setEnviado] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', mensaje: '' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  function enviar() {
    if (!form.nombre || !form.email || !form.mensaje) return;
    // Aquí iría la integración real (email, Supabase, etc.)
    setEnviado(true);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-900 px-8 py-6 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Consulta de servicio</p>
            <h2 className="text-white font-black text-xl">{servicio}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer"><X size={22} /></button>
        </div>

        {enviado ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-green-600" />
            </div>
            <h3 className="font-black text-slate-900 text-xl mb-2">¡Consulta enviada!</h3>
            <p className="text-slate-500 text-sm font-medium mb-6">Nos ponemos en contacto en las próximas 24 hs.</p>
            <button onClick={onClose} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-sm cursor-pointer">Cerrar</button>
          </div>
        ) : (
          <div className="p-8 space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Tu nombre</label>
              <input value={form.nombre} onChange={set('nombre')} placeholder="Ej: María González"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Email de contacto</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" value={form.email} onChange={set('email')} placeholder="tu@email.com"
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">¿Qué necesitás?</label>
              <textarea value={form.mensaje} onChange={set('mensaje')} placeholder="Contanos brevemente qué tenés en mente..." rows={4}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
              />
            </div>
            <button onClick={enviar}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-base transition-all shadow-lg active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <Send size={16} /> Enviar consulta
            </button>
            <p className="text-center text-slate-400 text-xs font-medium">
              Te respondemos en menos de 24 horas hábiles.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Modal de registro ────────────────────────────────────────
const TIPOS_ALOJ     = ['Hotel','Cabaña','Departamento','Domo','Dormi','Carpa'];
const TIPOS_GASTRO   = ['Restaurante','Bar','Café','Pastelería','Gourmet'];
const TIPOS_AVENTURA = ['Experiencia','Balneario'];
const LOCALIDADES    = ['Villa Gesell','Mar de las Pampas','Las Gaviotas','Mar Azul'];

function ModalRegistro({ planInicial, tipoInicial = 'Hotel', onClose, onSuccess }) {
  const esAlojamiento  = TIPOS_ALOJ.includes(tipoInicial);
  const sectorInicial  = TIPOS_AVENTURA.includes(tipoInicial) ? 'aventura' : 'gastro';

  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [sectorGastro, setSectorGastro] = useState(sectorInicial);
  const [form, setForm] = useState({
    nombre:    '',
    tipo:      tipoInicial,
    localidad: 'Villa Gesell',
    email:     '',
    password:  '',
    plan:      esAlojamiento ? (planInicial || 'free') : 'free',
  });

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSectorChange = (sector) => {
    setSectorGastro(sector);
    setForm(f => ({ ...f, tipo: sector === 'gastro' ? TIPOS_GASTRO[0] : TIPOS_AVENTURA[0] }));
  };

  async function registrar() {
    if (!form.nombre || !form.email || !form.password) return setError('Completá todos los campos');
    if (form.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres');
    setLoading(true); setError('');

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email, password: form.password,
    });
    if (authError) { setLoading(false); return setError(authError.message); }

    const { data: negocio, error: negError } = await supabase
      .from('negocios')
      .insert({ nombre: form.nombre, tipo: form.tipo, localidad: form.localidad, plan: form.plan, aprobado: false, activo: false })
      .select().single();
    if (negError) { setLoading(false); return setError('Error al crear el perfil'); }

    await supabase.from('perfiles').insert({
      id: authData.user.id, nombre: form.nombre, negocio_id: negocio.id, es_superadmin: false,
    });

    setLoading(false);
    onSuccess();
  }

  const tiposActivos = sectorGastro === 'gastro' ? TIPOS_GASTRO : TIPOS_AVENTURA;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-slate-900 px-8 py-6 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Nuevo socio</p>
            <h2 className="text-white font-black text-xl">
              {esAlojamiento ? `Plan ${form.plan.toUpperCase()}` : 'Plan FREEMIUM'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer"><X size={22} /></button>
        </div>

        <div className="p-8 space-y-4">

          {/* ── ALOJAMIENTO: selector de plan ── */}
          {esAlojamiento && (
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Plan</label>
              <div className="grid grid-cols-3 gap-2">
                {['free','plus','black'].map(p => (
                  <button key={p} onClick={() => setForm(f => ({...f, plan: p}))}
                    className={`py-2 rounded-xl font-black text-sm transition-all cursor-pointer ${form.plan === p ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >{p.toUpperCase()}</button>
                ))}
              </div>
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Nombre del negocio</label>
            <input
              value={form.nombre} onChange={set('nombre')}
              placeholder={esAlojamiento ? 'Ej: Hotel Las Olas' : 'Ej: La Pizzería del Mar'}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>

          {/* ── ALOJAMIENTO: tipo dropdown + localidad ── */}
          {esAlojamiento ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Tipo</label>
                <select value={form.tipo} onChange={set('tipo')} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none cursor-pointer">
                  {TIPOS_ALOJ.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Localidad</label>
                <select value={form.localidad} onChange={set('localidad')} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none cursor-pointer">
                  {LOCALIDADES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
          ) : (
            /* ── GASTRO/AVENTURA: selector de sector + tipo pills ── */
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">¿A qué rubro pertenecés?</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'gastro',   label: '🍽️ Gastronomía' },
                    { id: 'aventura', label: '🏄 Aventura & Relax' },
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleSectorChange(s.id)}
                      className={`py-2.5 rounded-xl font-black text-sm transition-all cursor-pointer ${sectorGastro === s.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >{s.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Tipo de negocio</label>
                <div className="flex flex-wrap gap-2">
                  {tiposActivos.map(t => (
                    <button
                      key={t}
                      onClick={() => setForm(f => ({ ...f, tipo: t }))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${form.tipo === t ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Localidad</label>
                <select value={form.localidad} onChange={set('localidad')} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none cursor-pointer">
                  {LOCALIDADES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="email" value={form.email} onChange={set('email')} placeholder="tu@email.com"
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Contraseña</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="password" value={form.password} onChange={set('password')} placeholder="Mínimo 6 caracteres"
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">{error}</div>}

          <button onClick={registrar} disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-4 rounded-2xl font-black text-base transition-all shadow-lg active:scale-[0.98] cursor-pointer"
          >
            {loading ? 'Creando cuenta...' : 'Crear mi cuenta'}
          </button>
          <p className="text-center text-slate-400 text-xs font-medium">
            Tu cuenta quedará activa una vez que el equipo de gesell.ar la apruebe.
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
export default function SociosView({ onBack }) {
  const [modalPlan, setModalPlan]         = useState(null);
  const [registrado, setRegistrado]       = useState(false);
  const [modalServicio, setModalServicio] = useState(null);
  const [tipoDefault, setTipoDefault]     = useState('Hotel');
  const [categoriaSocios, setCategoriaSocios] = useState('alojamientos'); // 'alojamientos' | 'comercios'

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <div className="bg-slate-950 pt-32 pb-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="text-blue-400 font-black text-xs uppercase tracking-widest mb-4 block">Para proveedores de servicios</span>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
            Sumá tu negocio a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">gesell.ar</span>
          </h1>
          <p className="text-slate-400 text-lg font-medium leading-relaxed mb-8">
            Miles de turistas buscan alojamiento, gastronomía y experiencias en Villa Gesell y alrededores. Hacé que te encuentren.
          </p>
          <div>
            <p className="text-white font-black text-xl mb-2">¿Qué tipo de negocio tenés?</p>
            <p className="text-slate-400 text-sm mb-7">El plan que te ofrecemos depende de tu tipo de negocio</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => { setTipoDefault('Hotel'); setCategoriaSocios('alojamientos'); window.scrollTo({ top: 600, behavior: 'smooth' }); }}
                className="bg-white hover:bg-slate-100 text-slate-900 px-7 py-4 rounded-2xl font-black text-base transition-all shadow-xl active:scale-95 cursor-pointer flex items-center gap-3"
              >
                <span className="text-2xl">🚪</span> Alojamiento
              </button>
              <button
                onClick={() => { setTipoDefault('Restaurante'); setCategoriaSocios('comercios'); window.scrollTo({ top: 600, behavior: 'smooth' }); }}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-7 py-4 rounded-2xl font-black text-base transition-all shadow-xl active:scale-95 cursor-pointer flex items-center gap-3"
              >
                <span className="text-2xl">🍽️</span> Gastronomía
              </button>
              <button
                onClick={() => { setTipoDefault('Experiencia'); setCategoriaSocios('comercios'); window.scrollTo({ top: 600, behavior: 'smooth' }); }}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-7 py-4 rounded-2xl font-black text-base transition-all shadow-xl active:scale-95 cursor-pointer flex items-center gap-3"
              >
                <span className="text-2xl">🏄</span> Aventura & Relax
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Selector de categoría ── */}
      <div className="flex justify-center pt-12 pb-2 px-4">
        <div style={{ display: 'inline-flex', background: '#F1F5F9', borderRadius: 14, padding: 4, gap: 4 }}>
          {[
            { id: 'alojamientos', label: '🚪 Alojamientos' },
            { id: 'comercios',    label: '🏪 Comercios y servicios' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setCategoriaSocios(id)}
              style={{
                padding: '10px 24px', border: 'none', borderRadius: 11, cursor: 'pointer',
                fontSize: 14, fontWeight: 700, fontFamily: "'Geist', system-ui, sans-serif",
                transition: 'all .2s',
                background: categoriaSocios === id ? '#0B1020' : 'transparent',
                color: categoriaSocios === id ? '#fff' : '#6B7280',
                boxShadow: categoriaSocios === id ? '0 2px 10px rgba(11,16,32,0.20)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de planes — Alojamientos */}
      {categoriaSocios === 'alojamientos' && (
      <div id="planes-alojamiento" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-black text-slate-900 mb-3">Planes para alojamientos</h2>
          <p className="text-slate-500 font-medium">Elegí el plan que mejor se adapta a tu negocio</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PLANES.map(plan => (
            <div key={plan.id} className={`relative border-2 ${plan.color} rounded-3xl p-7 flex flex-col`}>
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${plan.badgeColor} text-white text-xs font-black px-4 py-1 rounded-full`}>
                  {plan.badge}
                </div>
              )}

              {/* Nombre e icono */}
              <div className="mb-5">
                <div className="mb-2">{plan.icon}</div>
                <h3 className="text-2xl font-black text-slate-900">{plan.nombre}</h3>
                {plan.precioMes ? (
                  <div className="mt-1.5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900">
                        ${plan.precioMes.toLocaleString('es-AR')}
                      </span>
                      <span className="text-slate-400 text-sm font-medium">/ mes</span>
                    </div>
                    <p className="text-slate-400 text-xs font-medium mt-0.5">
                      ${plan.precioAnio.toLocaleString('es-AR')} facturado anualmente
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm font-medium mt-1">Sin costo de membresía</p>
                )}
              </div>

              {/* Beneficios + nota de pago */}
              <div className="flex-1 flex flex-col mb-6">
                <ul className="space-y-1.5">
                  {plan.items.map((item, i) => (
                    <li
                      key={i}
                      className={`flex items-start gap-2 text-[13px] leading-snug ${
                        item.bold
                          ? 'font-black text-slate-900 mt-1'
                          : item.negative
                          ? 'font-normal text-slate-400'
                          : 'font-normal text-slate-600'
                      }`}
                    >
                      {!item.bold && (
                        item.negative
                          ? <Minus size={13} className="mt-0.5 shrink-0 text-slate-300" />
                          : <Check size={13} className="mt-0.5 shrink-0 text-green-500" />
                      )}
                      {item.text}
                    </li>
                  ))}
                </ul>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Condiciones de pago — separadas, sin tilde */}
                {plan.paymentNote && (
                  <div className="border-t border-slate-100 mt-5 pt-3.5">
                    <p className="text-xs text-slate-400 font-normal leading-relaxed">
                      {plan.paymentNote}
                    </p>
                  </div>
                )}
              </div>

              {/* CTA */}
              <button
                onClick={() => { setTipoDefault('Hotel'); setModalPlan(plan.id); }}
                className={`w-full py-3.5 rounded-2xl font-black text-sm transition-all active:scale-95 cursor-pointer ${plan.ctaColor}`}
              >
                {plan.cta}
              </button>

              {/* Precio sin impuestos */}
              {plan.precioSinImpuestos && (
                <p className="text-center text-slate-400 text-xs font-light mt-2">
                  Precio sin impuestos nacionales: {plan.precioSinImpuestos}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      )} {/* fin alojamientos */}

      {/* Tabla de planes — Comercios y servicios */}
      {categoriaSocios === 'comercios' && (
      <div id="planes-gastronomia" className="bg-emerald-950 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-emerald-800/60 text-emerald-300 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">
              <span>🍽️</span> Restaurantes, cafés y actividades
            </div>
            <h2 className="text-4xl font-black text-white mb-3">Plan para gastronómicos y experiencias</h2>
            <p className="text-emerald-300 font-medium">Publicá tus ofertas sin costo. Solo pagás cuando hay resultado.</p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-3xl p-8 flex flex-col shadow-2xl shadow-black/30">
              <div className="mb-5">
                <Store size={26} className="text-slate-400 mb-2" />
                <h3 className="text-2xl font-black text-slate-900">FREEMIUM</h3>
                <p className="text-slate-400 text-sm font-medium mt-1">Sin costo de membresía</p>
              </div>

              <ul className="space-y-1.5 mb-5">
                {[
                  { text: 'Ficha del negocio ó emprendimiento, con fotos y descripción' },
                  { text: 'Publicación y canje de ofertas: SIN CARGO' },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] leading-snug font-normal text-slate-600">
                    <Check size={13} className="mt-0.5 shrink-0 text-emerald-500" />
                    {item.text}
                  </li>
                ))}
              </ul>

              {/* Opción destacada */}
              <div className="border border-amber-200 bg-amber-50 rounded-2xl p-4 mb-6">
                <div className="flex items-start gap-2">
                  <span className="text-lg leading-none mt-0.5">⭐</span>
                  <div>
                    <p className="text-sm font-black text-amber-900">¡Destacá tu negocio y hacete ver!</p>
                    <p className="text-sm text-amber-900 mt-0.5"><span className="font-bold">Opcional:</span> <span className="font-normal">5 créditos/mes ($10.000 + IVA)</span></p>
                    <p className="text-xs text-amber-700 font-normal mt-0.5 leading-relaxed">
                      Tu perfil y ofertas aparecen con mucha mayor visibilidad, y podés vincularlas a alojamientos PLUS/BLACK para llegar directo a sus huéspedes. ¡Preparate para recibir clientes!
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => { setTipoDefault('Restaurante'); setModalPlan('free'); }}
                className="w-full py-3.5 rounded-2xl font-black text-sm transition-all active:scale-95 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Registrarme gratis
              </button>
            </div>
          </div>
        </div>
      </div>

      )} {/* fin comercios */}

      {/* Otros servicios */}
      <div className="bg-slate-50 border-t border-slate-100 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 text-center mb-12">Otros servicios para socios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {OTROS_SERVICIOS.map(s => (
              <div key={s.titulo} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col">
                <h3 className="font-black text-slate-900 text-lg mb-4">{s.titulo}</h3>
                <ul className="space-y-2 flex-1">
                  {s.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-600 text-sm font-medium">
                      <Check size={14} className="text-blue-500 mt-0.5 shrink-0" />{item}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setModalServicio(s.titulo)}
                  className="mt-6 w-full py-3 rounded-xl border-2 border-slate-900 text-slate-900 font-black text-sm hover:bg-slate-900 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send size={14} /> Solicitar un presupuesto
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modalServicio && (
        <ModalPresupuesto servicio={modalServicio} onClose={() => setModalServicio(null)} />
      )}

      {modalPlan && !registrado && (
        <ModalRegistro
          planInicial={modalPlan}
          tipoInicial={tipoDefault}
          onClose={() => setModalPlan(null)}
          onSuccess={() => { setModalPlan(null); setRegistrado(true); }}
        />
      )}

      {registrado && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-10 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-green-600" />
            </div>
            <h2 className="font-black text-slate-900 text-2xl mb-2">¡Cuenta creada!</h2>
            <p className="text-slate-500 font-medium mb-6">Tu cuenta está pendiente de aprobación. Te avisamos cuando esté lista.</p>
            <button onClick={() => setRegistrado(false)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-sm cursor-pointer">Entendido</button>
          </div>
        </div>
      )}
    </div>
  );
}
