// ============================================================
//  src/lib/sesion.jsx
//  Contexto ligero para exponer, en cualquier profundidad del árbol,
//  si el usuario actual debe ver los precios de las ofertas en CRÉDITOS
//  o en PESOS.
//
//  Regla de negocio (Cuponear v2):
//   - Anónimo, turista (no socio) y socio Gratis  → ven el precio en AR$
//     (IVA ya incluido), sin ninguna mención a créditos (el sistema de
//     créditos a la vista confunde al usuario que recién llega).
//   - Socio Plus → ve el precio en créditos con el valor en AR$ (IVA incluido)
//     entre paréntesis (los créditos son su moneda de cambio / billetera).
//   - Superadmin → ve créditos en los paneles internos de gestión.
//
//  Este contexto SOLO cambia la presentación del precio. La lógica interna
//  de cobros/billetera/canje no se toca.
// ============================================================

import { createContext, useContext } from 'react';

const SesionCtx = createContext({ perfil: null, mostrarCreditos: false });

// El precio de las ofertas SIEMPRE se muestra en pesos.
// Los créditos pasaron a ser "créditos publicitarios" de los socios y ya no
// tienen relación con el precio de las ofertas, así que nadie (ni socio Plus
// ni superadmin) ve el precio de cupones en créditos.
// eslint-disable-next-line no-unused-vars
export function debeVerCreditos(perfil) {
  return false;
}

export function SesionProvider({ perfil, children }) {
  const mostrarCreditos = debeVerCreditos(perfil);
  return (
    <SesionCtx.Provider value={{ perfil, mostrarCreditos }}>
      {children}
    </SesionCtx.Provider>
  );
}

export function useSesion() {
  return useContext(SesionCtx);
}

// Hook de conveniencia: true → mostrar precio en créditos; false → en pesos.
export function useMostrarCreditos() {
  return useContext(SesionCtx).mostrarCreditos;
}
