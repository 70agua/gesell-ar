// ============================================================
//  src/hooks/useMiPase.js
//  El pase del usuario que está mirando, y cuánto le queda.
//
//  Lo consume la ficha de oferta para decidir qué decirle: "ya lo tenés",
//  "usá una de tus elecciones" o "sumalo a mitad de precio". Sin sesión o sin
//  pase devuelve `pase: null` y la UI muestra el upsell.
//
//  Devuelve TAMBIÉN el pase comprado y sin activar (`pendiente: true`): quien
//  ya pagó no tiene que ver el upsell de comprarlo otra vez.
//
//  El tope de elecciones sale de la instancia (una por día comprado) y cae al
//  catálogo cuando la compra no lo trae — mismo criterio que el RPC
//  elegir_premium_pase, que es quien realmente lo hace cumplir.
// ============================================================

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const VACIO = { cargando: false, pase: null, usadas: 0, total: 0, restantes: 0, activo: false, pendiente: false, premiumIlimitado: false };

export default function useMiPase(session) {
  const userId = session?.user?.id || null;
  // Sin sesión no hay nada que cargar: el estado inicial ya es el definitivo.
  const [estado, setEstado] = useState(() => (userId ? { ...VACIO, cargando: true } : VACIO));

  useEffect(() => {
    if (!userId) return;
    let vivo = true;

    (async () => {
      // Antes esto miraba SÓLO los pases 'activo', con lo cual quien ya había
      // comprado —pero todavía no activó— era invisible para toda la app: se
      // le seguía ofreciendo comprar el pase que ya tenía. Ahora entran los
      // dos estados y el consumidor decide con `activo` / `pendiente`.
      const { data: pases } = await supabase
        .from('usuario_pases')
        .select('*, pases(*)')
        .eq('user_id', userId)
        .in('estado', ['activo', 'pendiente'])
        // El activo manda sobre el pendiente si por algún motivo hay de los dos.
        .order('estado', { ascending: true })
        .order('creado_en', { ascending: false })
        .limit(1);

      const pase = pases?.[0] || null;
      if (!pase) { if (vivo) setEstado(VACIO); return; }

      const { count } = await supabase
        .from('pase_elecciones')
        .select('id', { count: 'exact', head: true })
        .eq('usuario_pase_id', pase.id);

      const totalNum = pase.elecciones_premium ?? pase.dias
        ?? pase.pases?.elecciones_premium ?? pase.pases?.duracion_dias ?? 0;
      const usadas = count || 0;
      // Congelado en la compra (ver DIAS_PREMIUM_ILIMITADO en lib/pases.js): a
      // partir de 10 días no hay tope de premium. `select('*')` ya trae la
      // columna; sólo hace falta nombrarla acá.
      const premiumIlimitado = pase.premium_ilimitado === true;

      if (vivo) setEstado({
        cargando: false, pase, usadas,
        // Infinity y no un número grande: mismo criterio que lib/pasePropio.jsx
        // (§infinito) — la resta/comparación numérica sigue andando sola, y el
        // texto tiene que mirar `premiumIlimitado` antes de imprimir esto.
        total:     premiumIlimitado ? Infinity : totalNum,
        restantes: premiumIlimitado ? Infinity : Math.max(0, totalNum - usadas),
        activo:    pase.estado === 'activo',
        pendiente: pase.estado === 'pendiente',
        premiumIlimitado,
      });
    })();

    return () => { vivo = false; };
  }, [userId]);

  return estado;
}
