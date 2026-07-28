// ============================================================
//  src/hooks/useMiPase.js
//  El pase del usuario que está mirando, y cuánto le queda.
//
//  Lo consume la ficha de oferta para decidir qué decirle: "ya lo tenés",
//  "usá una de tus elecciones" o "sumalo a mitad de precio". Sin sesión o sin
//  pase activo devuelve `pase: null` y la UI muestra el upsell.
//
//  El tope de elecciones sale de la instancia (una por día comprado) y cae al
//  catálogo cuando la compra no lo trae — mismo criterio que el RPC
//  elegir_premium_pase, que es quien realmente lo hace cumplir.
// ============================================================

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const VACIO = { cargando: false, pase: null, usadas: 0, total: 0, restantes: 0 };

export default function useMiPase(session) {
  const userId = session?.user?.id || null;
  // Sin sesión no hay nada que cargar: el estado inicial ya es el definitivo.
  const [estado, setEstado] = useState(() => (userId ? { ...VACIO, cargando: true } : VACIO));

  useEffect(() => {
    if (!userId) return;
    let vivo = true;

    (async () => {
      const { data: pases } = await supabase
        .from('usuario_pases')
        .select('*, pases(*)')
        .eq('user_id', userId)
        .eq('estado', 'activo')
        .order('creado_en', { ascending: false })
        .limit(1);

      const pase = pases?.[0] || null;
      if (!pase) { if (vivo) setEstado(VACIO); return; }

      const { count } = await supabase
        .from('pase_elecciones')
        .select('id', { count: 'exact', head: true })
        .eq('usuario_pase_id', pase.id);

      const total = pase.elecciones_premium ?? pase.dias
        ?? pase.pases?.elecciones_premium ?? pase.pases?.duracion_dias ?? 0;
      const usadas = count || 0;

      if (vivo) setEstado({
        cargando: false, pase, usadas, total,
        restantes: Math.max(0, total - usadas),
      });
    })();

    return () => { vivo = false; };
  }, [userId]);

  return estado;
}
