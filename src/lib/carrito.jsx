// ============================================================
//  src/lib/carrito.jsx — Context global del carrito de compra
// ============================================================
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { calcularPrecioCupon, CREDITO_TOTAL } from './cobros';
import { trackAgregarCarrito } from './tracking';

const CarritoContext = createContext(null);

// Cupón que el visitante quiso agregar estando deslogueado. Se guarda en
// sessionStorage para sobrevivir el viaje al login/registro (incluido el
// redirect completo de Google) y se reinyecta al volver ya con sesión.
const PENDING_KEY = 'carrito_pending';
const PENDING_TTL = 10 * 60 * 1000; // 10 min

function guardarPendiente(oferta) {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ oferta, ts: Date.now() }));
  } catch { /* storage no disponible: se pierde el pendiente, no es crítico */ }
}

function tomarPendiente() {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PENDING_KEY);
    const { oferta, ts } = JSON.parse(raw);
    if (!oferta || Date.now() - (ts || 0) > PENDING_TTL) return null;
    return oferta;
  } catch {
    return null;
  }
}

const ACCENT_BY_CAT = {
  alojamiento:   '#2545E6',
  salidas:       '#0B1020',
  aventura_relax:'#10A36B',
  experiencia:   '#10A36B',
};

function ofertaToCupon(oferta) {
  // Cupón grupal: precio y descuento ya congelados al agregar al carrito.
  const grupal = oferta._grupal || null;

  const ahorro = oferta.ahorroEstimado || oferta.savings || 0;
  // Grupal → total congelado; si no, tabla escalonada; fallback a tokens_costo.
  const precio = grupal
    ? grupal.total_paid
    : ahorro > 0
      ? calcularPrecioCupon(ahorro)
      : (oferta.tokens_costo ?? 0) * CREDITO_TOTAL;

  let exp = 'Sin vencimiento';
  if (oferta.fechaVencimiento) {
    exp = 'Vence ' + new Date(oferta.fechaVencimiento).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  } else if (oferta.fechaFinFlash) {
    exp = 'Vence ' + new Date(oferta.fechaFinFlash).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  }

  // Un cupón grupal es único por cantidad declarada: distinguimos su id.
  const baseId = oferta.id ? `oferta-${oferta.id}` : `tmp-${Date.now()}`;

  return {
    id:     grupal ? `${baseId}-g${grupal.declared_pax}` : baseId,
    d:      oferta.badge || '-',
    t:      grupal
              ? `${oferta.title || oferta.titulo || 'Oferta'} · ${grupal.declared_pax} personas`
              : (oferta.title || oferta.titulo || 'Oferta'),
    p:      oferta.proveedorNombre || oferta.negocios?.nombre || 'Socio Cuponear',
    price:  precio,
    ahorro,
    exp,
    accent: ACCENT_BY_CAT[oferta.categoria] || '#2545E6',
    categoria: oferta.categoria || 'alojamiento',
    grupal, // { declared_pax, applied_discount_pct, total_paid, qr_token }
    _oferta: oferta,
  };
}

export function CarritoProvider({ children, session, onLoginRequired, onCheckout }) {
  const [cupones,    setCupones]    = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast,      setToast]      = useState(false); // aviso "cupón agregado"

  // Inserta el cupón (dedupe por id) y abre el drawer.
  const insertarCupon = useCallback((oferta) => {
    // Se mide acá y no en cada vista: es el único camino al carrito.
    if (oferta?.id) trackAgregarCarrito(oferta.id);
    const cupon = ofertaToCupon(oferta);
    setCupones(prev => {
      if (prev.some(c => c.id === cupon.id)) return prev;
      return [cupon, ...prev];
    });
    setDrawerOpen(true);
  }, []);

  const addCupon = useCallback((oferta) => {
    if (!session) {
      // Sin sesión: recordamos el cupón y mandamos a loguearse. Al volver con
      // sesión, el efecto de abajo lo reinyecta automáticamente.
      guardarPendiente(oferta);
      onLoginRequired?.();
      return;
    }
    insertarCupon(oferta);
  }, [session, onLoginRequired, insertarCupon]);

  // Al pasar a estar logueado, reinyectar el cupón que quedó pendiente.
  // (Sincronizar con el estado de auth externo es el caso de uso legítimo de un
  //  efecto; el setState acá es intencional.)
  useEffect(() => {
    if (!session) return;
    const oferta = tomarPendiente();
    if (!oferta) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    insertarCupon(oferta);
    setToast(true);
  }, [session, insertarCupon]);

  // El aviso de "cupón agregado" se autocierra a los 5 s.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  // Compra directa de un Cupopack entero: mete todos los cupones de una y va
  // al pago sin abrir el drawer — el turista no arma nada, se lleva el pack.
  const comprarAhora = useCallback((ofertas) => {
    if (!session) {
      onLoginRequired?.();
      return;
    }
    const nuevos = (ofertas || []).map(ofertaToCupon);
    setCupones(prev => {
      const yaEstan = new Set(prev.map(c => c.id));
      return [...nuevos.filter(c => !yaEstan.has(c.id)), ...prev];
    });
    setDrawerOpen(false);
    onCheckout?.();
  }, [session, onLoginRequired, onCheckout]);

  const removeCupon   = useCallback((id) => setCupones(prev => prev.filter(c => c.id !== id)), []);
  const clearCarrito = useCallback(() => setCupones([]), []);
  const openDrawer    = useCallback(() => setDrawerOpen(true),  []);
  const closeDrawer   = useCallback(() => setDrawerOpen(false), []);
  const dismissToast  = useCallback(() => setToast(false), []);

  const handleCheckout = useCallback(() => {
    closeDrawer();
    onCheckout?.();
  }, [closeDrawer, onCheckout]);

  return (
    <CarritoContext.Provider value={{ cupones, drawerOpen, addCupon, comprarAhora, removeCupon, clearCarrito, openDrawer, closeDrawer, handleCheckout }}>
      {children}
      <CuponAgregadoToast open={toast} onClose={dismissToast} onOpenDrawer={() => { dismissToast(); openDrawer(); }} />
    </CarritoContext.Provider>
  );
}

// ── Aviso flotante: confirma que se agregó el cupón tras loguearse ──
function CuponAgregadoToast({ open, onClose, onOpenDrawer }) {
  if (!open) return null;
  return (
    <div
      role="status"
      onClick={onOpenDrawer}
      style={{
        position: 'fixed', top: 78, left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999, width: 340, maxWidth: 'calc(100vw - 24px)',
        background: '#fff', borderRadius: 16,
        boxShadow: '0 20px 50px rgba(0,0,0,0.18)', border: '1px solid #E7E9EE',
        padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center',
        cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif",
        animation: 'cuponToastIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
      }}
    >
      <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#ECFDF5', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10A36B" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0B1020', marginBottom: 2 }}>¡Agregaste un cupón a tu carrito!</div>
        <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.4 }}>La encontrás arriba a la derecha cuando quieras.</div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Cerrar aviso"
        style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 4, flexShrink: 0, lineHeight: 0 }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
      </button>
      <style>{`@keyframes cuponToastIn { from { opacity: 0; transform: translateX(-50%) translateY(-12px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>
    </div>
  );
}

export function useCarrito() {
  const ctx = useContext(CarritoContext);
  if (!ctx) throw new Error('useCarrito debe usarse dentro de CarritoProvider');
  return ctx;
}
