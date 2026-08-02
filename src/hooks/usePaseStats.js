// ============================================================
//  src/hooks/usePaseStats.js
//  Datos vivos del catálogo del Pase para el hero de la home.
//
//    · cupones  = ofertas vigentes del catálogo del Pase, SIN deduplicar
//                 por negocio. Es el número que el turista va a recorrer
//                 —y el que se muestra en el hero—: hoy son 133 contra
//                 64 socios. No es el mismo dato que `lugares` ni lo
//                 reemplaza; `lugares` sigue siendo la base del ahorro.
//    · lugares  = negocios activos con al menos una oferta vigente
//                 incluida en el Pase (todo el catálogo).
//    · ahorro   = suma del ahorro declarado contando 1 oferta por
//                 negocio (regla: 1 canje por comercio) — se toma la
//                 de mayor ahorro de cada negocio. El alojamiento suma
//                 UNA sola vez (el mejor): el descuento de estadía es
//                 de un solo uso, sumar todos los hoteles inflaría la
//                 promesa.
//
//  Nunca devuelve valores hardcodeados: ante error o catálogo vacío
//  entrega `ok: false` y la UI oculta la línea completa.
// ============================================================

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { normalizePromo } from '../lib/datos';
import { esCategoriaPase, esOfertaEstadia } from '../lib/pases';

const fmt = (n) => Number(n).toLocaleString('es-AR', { maximumFractionDigits: 0 });

export default function usePaseStats() {
  const [stats, setStats] = useState({ ok: false, loading: true, cupones: 0, lugares: 0, ahorro: 0 });

  useEffect(() => {
    let vivo = true;

    (async () => {
      const { data, error } = await supabase
        .from('promociones')
        .select('*, negocios(nombre, tipo, categoria, localidad, zona, foto_perfil, imagen_url, activo)')
        .eq('activa', true)
        .eq('aprobada', true);

      if (!vivo) return;
      if (error) { setStats({ ok: false, loading: false, cupones: 0, lugares: 0, ahorro: 0 }); return; }

      // 1 oferta por negocio: la de mayor ahorro declarado.
      const mejorPorNegocio = new Map();
      const estadias = [];
      let cupones = 0;
      (data || [])
        .filter(p => p.negocios?.activo !== false)
        .map(normalizePromo)
        .filter(esCategoriaPase)
        .forEach(p => {
          cupones += 1;
          if (!p.negocioId) return;
          const previo = mejorPorNegocio.get(p.negocioId) || 0;
          if (p.ahorroEstimado > previo) mejorPorNegocio.set(p.negocioId, p.ahorroEstimado);
          if (esOfertaEstadia(p)) estadias.push(p.negocioId);
        });

      const lugares = mejorPorNegocio.size;
      // Alojamiento: se cuenta el mejor una sola vez (1 estadía por pase).
      const idsEstadia = new Set(estadias);
      const ahorroLibre = [...mejorPorNegocio.entries()]
        .filter(([id]) => !idsEstadia.has(id))
        .reduce((acc, [, v]) => acc + v, 0);
      const mejorEstadia = [...idsEstadia]
        .reduce((max, id) => Math.max(max, mejorPorNegocio.get(id) || 0), 0);
      const ahorro = ahorroLibre + mejorEstadia;

      setStats({ ok: lugares > 0, loading: false, cupones, lugares, ahorro });
    })();

    return () => { vivo = false; };
  }, []);

  return {
    ...stats,
    cuponesFmt: fmt(stats.cupones),
    lugaresFmt: fmt(stats.lugares),
    ahorroFmt:  fmt(stats.ahorro),
  };
}
