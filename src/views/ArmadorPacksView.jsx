// ============================================================
//  src/views/ArmadorPacksView.jsx
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, ShoppingCart, Plus, Minus, MapPin,
  ChevronRight, CheckCircle2, Sparkles, CreditCard,
  Smartphone, Building2, X, Gift, Share2, Unlock,
} from 'lucide-react';
import Token, { TokenLight } from '../components/Token';
import { getConfiguracion, tokensPorTipo, calcularResumen, getCombinaciones } from '../lib/packs';
import { getAlojamientos, getGastronomia } from '../lib/datos';
import { calcularDesbloqueos, ACCIONES, otorgarTokens, getWallet } from '../lib/gamificacion';
import { supabase } from '../lib/supabase';
import LoadingScreen from '../components/LoadingScreen';

// ─── Experiencias mock ───────────────────────────────────────
const EXPERIENCIAS_MOCK = [
  { id: 'exp1', name: 'Safari en médanos',     type: 'Experiencia', tokens_costo: 1, location: 'Villa Gesell',  zone: 'Villa Gesell',  image: 'https://images.unsplash.com/photo-1533481405265-e9ce0c044abb?auto=format&fit=crop&w=800&q=80',  description: 'Recorrido en 4x4 por los médanos más imponentes.' },
  { id: 'exp2', name: 'Cabalgata al atardecer',type: 'Experiencia', tokens_costo: 1, location: 'Barrio Norte', zone: 'Villa Gesell',  image: 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?auto=format&fit=crop&w=800&q=80',  description: 'Cabalgata guiada por el pinar y la playa.' },
  { id: 'exp3', name: 'Surf & bodyboard',      type: 'Experiencia', tokens_costo: 1, location: 'Playa',        zone: 'Villa Gesell',  image: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=800&q=80',  description: 'Clases para principiantes y avanzados.' },
  { id: 'exp4', name: 'Paseo en kayak',        type: 'Experiencia', tokens_costo: 1, location: 'Mar Azul',     zone: 'Mar Azul',      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',  description: 'Navegá por la laguna con guía experto.' },
];

const CATEGORIAS = [
  { id: 'alojamiento', label: 'Alojamiento',  icon: '🏨', color: 'bg-blue-600'    },
  { id: 'gastronomia', label: 'Gastronomía',  icon: '🍽️', color: 'bg-amber-500'   },
  { id: 'experiencia', label: 'Aventura & Relax', icon: '🧭', color: 'bg-emerald-600' },
];

// ─── Tarjeta del catálogo ────────────────────────────────────
function CatalogoCard({ item, enCarrito, onAgregar, onQuitar, tokensItem }) {
  return (
    <div className={`group bg-white rounded-2xl overflow-hidden border transition-all duration-200 ${
      enCarrito ? 'border-blue-400 shadow-lg shadow-blue-50' : 'border-slate-100 shadow-sm hover:shadow-md'
    }`}>
      <div className="relative h-40 overflow-hidden">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
        {enCarrito && (
          <div className="absolute top-3 right-3 bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-lg">
            <CheckCircle2 size={16} />
          </div>
        )}
        {/* Tokens del item sobre la imagen */}
        <div className="absolute bottom-2 right-3">
          <TokenLight amount={tokensItem} size="sm" />
        </div>
      </div>
      <div className="p-4">
        <p className="font-black text-slate-900 text-sm leading-tight mb-1 truncate">{item.name}</p>
        <p className="text-slate-400 text-xs font-medium flex items-center gap-1 mb-3">
          <MapPin size={10} /> {item.zone} · {item.location}
        </p>
        <div className="flex items-center justify-between">
          <Token amount={tokensItem} label size="sm" />
          {enCarrito ? (
            <button onClick={() => onQuitar(item)} className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-xl font-bold text-xs transition-all">
              <Minus size={12} /> Quitar
            </button>
          ) : (
            <button onClick={() => onAgregar(item)} className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-sm">
              <Plus size={12} /> Agregar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Widget de tokens ganados ────────────────────────────────
function TokensGanados({ session, onCompartir }) {
  const acciones = Object.entries(ACCIONES);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <span className="text-lg">🎮</span>
        <h3 className="font-black text-slate-900 text-sm">Ganá tokens</h3>
      </div>
      <div className="divide-y divide-slate-50">
        {acciones.map(([key, accion]) => (
          <div key={key} className="px-5 py-3 flex items-center gap-3">
            <span className="text-xl shrink-0">{accion.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 text-xs truncate">{accion.label}</p>
              <p className="text-slate-400 text-[10px] font-medium">Por única vez</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Token amount={accion.tokens} size="xs" />
              {key === 'compartir_pack' && session && (
                <button
                  onClick={onCompartir}
                  className="bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 p-1.5 rounded-lg transition-all"
                >
                  <Share2 size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
        {!session && (
          <div className="px-5 py-3 bg-blue-50/50">
            <p className="text-blue-600 text-xs font-bold flex items-center gap-1">Iniciá sesión para acumular tokens <img src="/cuponera-coin.svg" alt="crédito" style={{width:14,height:14}}/></p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function ArmadorPacksView({ onBack }) {
  const [categoria, setCategoria]         = useState('alojamiento');
  const [carrito, setCarrito]             = useState([]);
  const [config, setConfig]               = useState({});
  const [formaPago, setFormaPago]         = useState('tarjeta');
  const [alojamientos, setAlojamientos]   = useState([]);
  const [gastronomia, setGastronomia]     = useState([]);
  const [combinaciones, setCombinaciones] = useState([]);
  const [desbloqueos, setDesbloqueos]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [paso, setPaso]                   = useState('armar');
  const [email, setEmail]                 = useState('');
  const [nombre, setNombre]               = useState('');
  const [session, setSession]             = useState(null);
  const [wallet, setWallet]               = useState({ balance: 0 });
  const [tokensAUsar, setTokensAUsar]     = useState(0);
  const [notif, setNotif]                 = useState(null);

  useEffect(() => {
    async function init() {
      const [cfg, aloj, gastro] = await Promise.all([
        getConfiguracion(),
        getAlojamientos(),
        getGastronomia(),
      ]);
      setConfig(cfg);
      setAlojamientos(aloj);
      setGastronomia(gastro);

      // Verificar sesión
      const { data: { session: s } } = await supabase.auth.getSession();
      setSession(s);
      if (s) {
        const w = await getWallet(s.user.id);
        setWallet(w);
      }
      setLoading(false);
    }
    init();
  }, []);

  // Actualizar combinaciones y desbloqueos al cambiar carrito
  useEffect(() => {
    setDesbloqueos(calcularDesbloqueos(carrito));
    if (carrito.length < 2) { setCombinaciones([]); return; }
    const ids = carrito.map(i => String(i.id));
    getCombinaciones(ids).then(setCombinaciones);
  }, [carrito]);

  const mostrarNotif = (msg, tipo = 'ok') => {
    setNotif({ msg, tipo });
    setTimeout(() => setNotif(null), 3000);
  };

  const catalogoPorCategoria = {
    alojamiento: alojamientos,
    gastronomia: gastronomia,
    experiencia: EXPERIENCIAS_MOCK,
  };

  const catalogo = catalogoPorCategoria[categoria] || [];

  // Tokens del item — respeta tokens_costo si está definido en el negocio
  const getTokensItem = (item) =>
    item.tokens_costo != null ? item.tokens_costo : tokensPorTipo(item.type, config);

  const agregarAlCarrito = (item) => {
    if (carrito.find(i => String(i.id) === String(item.id))) return;
    setCarrito(prev => [...prev, item]);
  };

  const quitarDelCarrito = (item) => {
    setCarrito(prev => prev.filter(i => String(i.id) !== String(item.id)));
  };

  const enCarrito = (item) => !!carrito.find(i => String(i.id) === String(item.id));

  // Resumen con tokens a usar descontados
  const resumen = carrito.length > 0
    ? (() => {
        const base = calcularResumen(carrito, formaPago, config);
        const tokenPrice = parseFloat(config.token_precio_sin_iva || 5000) *
          (1 + parseFloat(config.token_iva_porcentaje || 21) / 100);
        const descTokens = tokensAUsar * tokenPrice;
        return {
          ...base,
          descTokens,
          totalFinal: Math.max(0, base.total - descTokens),
        };
      })()
    : null;

  const tokenPrice = parseFloat(config.token_precio_sin_iva || 5000) *
    (1 + parseFloat(config.token_iva_porcentaje || 21) / 100);

  // Compartir pack
  const handleCompartir = async () => {
    if (!session) return;
    const result = await otorgarTokens(session.user.id, 'compartir_pack');
    if (result.ok) {
      mostrarNotif(`🪙 +${result.tokens} tokens ganados por compartir`);
      const w = await getWallet(session.user.id);
      setWallet(w);
    } else {
      mostrarNotif(result.mensaje, 'info');
    }
    // Abrir share nativo si está disponible
    if (navigator.share) {
      navigator.share({ title: 'Mi pack en gesell.ar', url: window.location.href }).catch(() => {});
    }
  };

  if (loading) return (
    <LoadingScreen />
  );

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Notificación flotante */}
      {notif && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl font-bold text-sm animate-fade-in">
          {notif.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-500 font-bold hover:text-blue-600 transition-colors shrink-0">
            <ArrowLeft size={20} /> Volver
          </button>
          <div className="text-center">
            <h1 className="font-black text-slate-900 text-lg leading-tight">Armá tu pack</h1>
            <p className="text-slate-400 text-xs font-medium">Combiná servicios y obtené beneficios exclusivos</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Wallet si está logueado */}
            {session && (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl">
                <Token amount={wallet.balance} size="sm" />
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-3 py-2 rounded-xl">
              <ShoppingCart size={16} className="text-blue-600" />
              <span className="font-black text-blue-600 text-sm">{carrito.length}</span>
            </div>
            {carrito.length > 0 && (
              <button onClick={() => setPaso('checkout')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm">
                Ver resumen
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {paso === 'armar' && (
          <div className="flex flex-col lg:flex-row gap-8">

            {/* ── Catálogo ── */}
            <div className="flex-1 min-w-0">
              <div className="flex gap-2 mb-6 flex-wrap">
                {CATEGORIAS.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoria(cat.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      categoria === cat.id
                        ? `${cat.color} text-white shadow-md`
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Desbloqueos progresivos */}
              {desbloqueos.length > 0 && (
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 mb-5 flex items-start gap-3">
                  <Unlock size={18} className="text-blue-200 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    {desbloqueos.map((d, i) => (
                      <p key={i} className="text-white text-xs font-medium">
                        <span className="mr-1">{d.emoji}</span>{d.texto}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {catalogo.length === 0 ? (
                <p className="text-center text-slate-400 py-16 font-medium">No hay servicios disponibles</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {catalogo.map((item) => (
                    <CatalogoCard
                      key={item.id}
                      item={item}
                      enCarrito={enCarrito(item)}
                      onAgregar={agregarAlCarrito}
                      onQuitar={quitarDelCarrito}
                      tokensItem={getTokensItem(item)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Panel derecho ── */}
            <div className="lg:w-80 shrink-0 space-y-4">

              {/* Carrito */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                  <ShoppingCart size={16} className="text-blue-600" />
                  <h3 className="font-black text-slate-900 text-sm">Tu pack</h3>
                  <span className="ml-auto text-slate-400 text-xs font-medium">{carrito.length} servicios</span>
                </div>
                {carrito.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <p className="text-slate-400 text-sm font-medium">Agregá servicios para armar tu pack</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {carrito.map((item) => {
                      const tokens = getTokensItem(item);
                      return (
                        <div key={item.id} className="px-5 py-3 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 text-xs truncate">{item.name}</p>
                            <Token amount={tokens} label size="xs" className="mt-0.5" />
                          </div>
                          <button onClick={() => quitarDelCarrito(item)} className="text-slate-300 hover:text-red-500 transition-colors shrink-0">
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Combinaciones especiales */}
              {combinaciones.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={15} className="text-emerald-600" />
                    <p className="font-black text-emerald-800 text-sm">¡Beneficios activados!</p>
                  </div>
                  <div className="space-y-2">
                    {combinaciones.map((c) => (
                      <div key={c.id} className="flex items-start gap-2">
                        <Gift size={13} className="text-emerald-600 mt-0.5 shrink-0" />
                        <p className="text-emerald-700 text-xs font-medium leading-snug">{c.descripcion_publica}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Forma de pago */}
              {carrito.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <p className="font-black text-slate-900 text-sm mb-3">Forma de pago</p>
                  <div className="space-y-2">
                    {[
                      { id: 'mercadopago',   label: 'MercadoPago',        icon: <Smartphone size={14} />, desc: `${config.descuento_mp || 15}% OFF` },
                      { id: 'transferencia', label: 'Transferencia',       icon: <Building2 size={14} />,  desc: `${config.descuento_transferencia || 15}% OFF` },
                      { id: 'tarjeta',       label: 'Tarjeta de crédito',  icon: <CreditCard size={14} />, desc: null },
                    ].map((fp) => (
                      <button
                        key={fp.id}
                        onClick={() => setFormaPago(fp.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                          formaPago === fp.id ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <span className={formaPago === fp.id ? 'text-blue-600' : 'text-slate-400'}>{fp.icon}</span>
                        <span className={`flex-1 text-sm font-bold ${formaPago === fp.id ? 'text-blue-700' : 'text-slate-700'}`}>{fp.label}</span>
                        {fp.desc && (
                          <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full">{fp.desc}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Usar tokens del wallet */}
              {session && wallet.balance > 0 && carrito.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-black text-amber-800 text-sm flex items-center gap-1.5">
                      <img src="/cuponera-coin.svg" alt="crédito" style={{width:16,height:16}}/> Usar mis tokens
                    </p>
                    <Token amount={wallet.balance} label size="sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setTokensAUsar(t => Math.max(0, t - 1))} className="w-8 h-8 rounded-lg bg-white border border-amber-200 flex items-center justify-center text-amber-700 font-black hover:bg-amber-100 transition-all">−</button>
                    <div className="flex-1 text-center">
                      <Token amount={tokensAUsar} label size="md" />
                      {tokensAUsar > 0 && <p className="text-amber-600 text-xs font-medium mt-0.5">-${(tokensAUsar * tokenPrice).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>}
                    </div>
                    <button onClick={() => setTokensAUsar(t => Math.min(wallet.balance, t + 1))} className="w-8 h-8 rounded-lg bg-white border border-amber-200 flex items-center justify-center text-amber-700 font-black hover:bg-amber-100 transition-all">+</button>
                  </div>
                </div>
              )}

              {/* Resumen precio */}
              {resumen && (
                <div className="bg-slate-900 rounded-2xl p-5 text-white">
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        Subtotal (<Token amount={resumen.totalTokens} size="xs" className="inline" />)
                      </span>
                      <span className="font-bold">${resumen.subtotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
                    </div>
                    {resumen.descuento > 0 && (
                      <div className="flex justify-between text-green-400">
                        <span>Descuento forma de pago ({resumen.descuentoPct}%)</span>
                        <span className="font-bold">-${resumen.descuento.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
                      </div>
                    )}
                    {resumen.descTokens > 0 && (
                      <div className="flex justify-between text-amber-400">
                        <span className="flex items-center gap-1"><img src="/cuponera-coin.svg" alt="crédito" style={{width:14,height:14}}/> Tokens canjeados ({tokensAUsar})</span>
                        <span className="font-bold">-${resumen.descTokens.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-400 text-xs">
                      <span>IVA incluido</span>
                      <span>${resumen.iva.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-700 pt-4 flex items-center justify-between mb-4">
                    <span className="font-black text-lg">Total</span>
                    <span className="font-black text-2xl text-emerald-400">${resumen.totalFinal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
                  </div>
                  <button onClick={() => setPaso('checkout')} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-black text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
                    Continuar al pago <ChevronRight size={16} />
                  </button>
                </div>
              )}

              {/* Ganá tokens */}
              <TokensGanados session={session} onCompartir={handleCompartir} />
            </div>
          </div>
        )}

        {/* ── CHECKOUT ── */}
        {paso === 'checkout' && resumen && (
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setPaso('armar')} className="flex items-center gap-2 text-slate-500 font-bold hover:text-blue-600 transition-colors mb-6">
              <ArrowLeft size={18} /> Volver al armador
            </button>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
              <h2 className="text-2xl font-black text-slate-900">Resumen de tu cuponera</h2>

              {/* Items */}
              <div className="space-y-3">
                {carrito.map((item) => {
                  const tokens = getTokensItem(item);
                  return (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-800">{item.name}</p>
                        <p className="text-slate-400 text-xs font-medium">{item.type} · {item.zone}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <Token amount={tokens} size="sm" />
                        <p className="text-slate-400 text-xs mt-0.5">${(tokens * tokenPrice).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Beneficios activados */}
              {combinaciones.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="font-black text-emerald-800 text-sm mb-2 flex items-center gap-2">
                    <Gift size={15} /> Beneficios incluidos en tu cuponera
                  </p>
                  {combinaciones.map((c) => (
                    <p key={c.id} className="text-emerald-700 text-xs font-medium flex items-start gap-1.5 mt-1">
                      <CheckCircle2 size={12} className="mt-0.5 shrink-0" /> {c.descripcion_publica}
                    </p>
                  ))}
                </div>
              )}

              {/* Desbloqueos */}
              {desbloqueos.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="font-black text-blue-800 text-sm mb-2 flex items-center gap-2">
                    <Unlock size={15} /> Beneficios desbloqueados
                  </p>
                  {desbloqueos.map((d, i) => (
                    <p key={i} className="text-blue-700 text-xs font-medium mt-1">{d.emoji} {d.texto}</p>
                  ))}
                </div>
              )}

              {/* Datos del usuario */}
              <div className="space-y-3">
                <h3 className="font-black text-slate-900">Tus datos</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Nombre</label>
                    <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
                  </div>
                </div>
              </div>

              {/* Total y CTA */}
              <div className="bg-slate-900 rounded-2xl p-6">
                <div className="space-y-2 mb-4">
                  {resumen.descuento > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-400">Descuento ({resumen.descuentoPct}%)</span>
                      <span className="text-green-400 font-bold">-${resumen.descuento.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
                    </div>
                  )}
                  {resumen.descTokens > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-amber-400 flex items-center gap-1"><img src="/cuponera-coin.svg" alt="crédito" style={{width:14,height:14}}/> Tokens ({tokensAUsar})</span>
                      <span className="text-amber-400 font-bold">-${resumen.descTokens.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between border-t border-slate-700 pt-4 mb-6">
                  <span className="text-white font-black text-lg">Total a pagar</span>
                  <span className="text-emerald-400 font-black text-3xl">${resumen.totalFinal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
                </div>
                <button
                  disabled={!email || !nombre}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-black text-base transition-all shadow-lg active:scale-95"
                >
                  Pagar y obtener mi cuponera
                </button>
                <p className="text-slate-500 text-xs text-center mt-3 font-medium">
                  Recibirás tu QR y código de acceso por email al instante
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
