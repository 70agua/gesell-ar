// ============================================================
//  src/lib/pasePropio.jsx
//  ¿El turista que está mirando tiene un Pase activo?
//
//  Existe por dos razones concretas:
//
//   1. El sello del Pase en la mini-ficha dice cosas distintas según eso, y
//      **"Ya lo tenés" sólo se puede decir si REALMENTE lo tiene**: si no,
//      es una promesa falsa.
//
//   2. La ficha de oferta se pinta 20 veces en una grilla. Si cada tarjeta
//      preguntara por su cuenta serían 20 consultas para responder una
//      pregunta que es del usuario, no de la oferta. Se pregunta una vez acá.
// ============================================================
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

const PaseCtx = createContext({ activo: false, pendiente: false, cargando: true, comprarPase: null });

export function PasePropioProvider({ session, onComprarPase, children }) {
  const userId = session?.user?.id || null;
  const [estado, setEstado] = useState({ activo: false, pendiente: false, cargando: !!userId });

  useEffect(() => {
    if (!userId) { setEstado({ activo: false, pendiente: false, cargando: false }); return; }
    let vivo = true;
    supabase
      .from('usuario_pases')
      .select('estado, vence_el')
      .eq('user_id', userId)
      .in('estado', ['activo', 'pendiente'])
      .then(({ data }) => {
        if (!vivo) return;
        const ahora = Date.now();
        const filas = data || [];
        const activo = filas.some(p =>
          p.estado === 'activo' && (!p.vence_el || new Date(p.vence_el).getTime() > ahora));
        setEstado({ activo, pendiente: !activo && filas.length > 0, cargando: false });
      });
    return () => { vivo = false; };
  }, [userId]);

  return (
    <PaseCtx.Provider value={{ ...estado, comprarPase: onComprarPase }}>
      {children}
    </PaseCtx.Provider>
  );
}

export const usePasePropio = () => useContext(PaseCtx);
