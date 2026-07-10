// ============================================================
//  src/lib/cuponera.jsx — Context global de la cuponera
// ============================================================
import React, { createContext, useContext, useState, useCallback } from 'react';
import { calcularPrecioCupon, CREDITO_TOTAL } from './cobros';

const CuponeraContext = createContext(null);

const ACCENT_BY_CAT = {
  alojamiento:   '#2545E6',
  salidas:       '#0B1020',
  aventura_relax:'#10A36B',
  experiencia:   '#10A36B',
};

function ofertaToCupon(oferta) {
  // Cupón grupal: precio y descuento ya congelados al agregar a la cuponera.
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

export function CuponeraProvider({ children, session, onLoginRequired, onCheckout }) {
  const [cupones,    setCupones]    = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const addCupon = useCallback((oferta) => {
    if (!session) { onLoginRequired?.(); return; }
    const cupon = ofertaToCupon(oferta);
    setCupones(prev => {
      if (prev.some(c => c.id === cupon.id)) return prev;
      return [cupon, ...prev];
    });
    setDrawerOpen(true);
  }, [session, onLoginRequired]);

  const removeCupon   = useCallback((id) => setCupones(prev => prev.filter(c => c.id !== id)), []);
  const clearCuponera = useCallback(() => setCupones([]), []);
  const openDrawer    = useCallback(() => setDrawerOpen(true),  []);
  const closeDrawer   = useCallback(() => setDrawerOpen(false), []);

  const handleCheckout = useCallback(() => {
    closeDrawer();
    onCheckout?.();
  }, [closeDrawer, onCheckout]);

  return (
    <CuponeraContext.Provider value={{ cupones, drawerOpen, addCupon, removeCupon, clearCuponera, openDrawer, closeDrawer, handleCheckout }}>
      {children}
    </CuponeraContext.Provider>
  );
}

export function useCuponera() {
  const ctx = useContext(CuponeraContext);
  if (!ctx) throw new Error('useCuponera debe usarse dentro de CuponeraProvider');
  return ctx;
}
