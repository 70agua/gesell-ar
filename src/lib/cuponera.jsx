// ============================================================
//  src/lib/cuponera.jsx — Context global de la cuponera
// ============================================================
import React, { createContext, useContext, useState, useCallback } from 'react';

const CuponeraContext = createContext(null);

// Color de acento por categoría de oferta
const ACCENT_BY_CAT = {
  alojamiento: '#2545E6',   // primary
  salidas: '#0B1020',   // ink
  experiencia: '#10A36B',   // green
};

// Convierte una oferta del sistema al shape de la cuponera
function ofertaToCupon(oferta) {
  const tokensCosto = oferta.tokens_costo ?? 3;
  const precio      = tokensCosto * 2000;
  const beneficio   = oferta.beneficioValor || 30000;
  // Fecha de vencimiento simulada: fin de temporada
  const exp = oferta.exp || oferta.fechaFinFlash
    ? new Date(oferta.fechaFinFlash).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
    : 'Vence 30 Ene';

  return {
    id:     oferta.id ? `oferta-${oferta.id}` : `tmp-${Date.now()}`,
    d:      oferta.badge || '-',
    t:      oferta.title || oferta.titulo || 'Oferta',
    p:      oferta.proveedorNombre || oferta.negocios?.nombre || 'Socio Cuponear',
    price:  precio,
    was:    beneficio,
    exp,
    accent: ACCENT_BY_CAT[oferta.categoria] || '#2545E6',
    // Datos extra para referencia
    _oferta: oferta,
  };
}

export function CuponeraProvider({ children, session, onLoginRequired }) {
  const [cupones,    setCupones]    = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const addCupon = useCallback((oferta) => {
    if (!session) {
      onLoginRequired?.();
      return;
    }
    const cupon = ofertaToCupon(oferta);
    setCupones(prev => {
      // Evitar duplicados
      if (prev.some(c => c.id === cupon.id)) return prev;
      return [cupon, ...prev];
    });
    setDrawerOpen(true);
  }, [session, onLoginRequired]);

  const removeCupon = useCallback((id) => {
    setCupones(prev => prev.filter(c => c.id !== id));
  }, []);

  const openDrawer  = useCallback(() => setDrawerOpen(true),  []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <CuponeraContext.Provider value={{ cupones, drawerOpen, addCupon, removeCupon, openDrawer, closeDrawer }}>
      {children}
    </CuponeraContext.Provider>
  );
}

export function useCuponera() {
  const ctx = useContext(CuponeraContext);
  if (!ctx) throw new Error('useCuponera debe usarse dentro de CuponeraProvider');
  return ctx;
}
