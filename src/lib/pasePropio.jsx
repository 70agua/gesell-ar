// ============================================================
//  src/lib/pasePropio.jsx
//  El Pase del turista que está mirando, y cuántos beneficios premium le
//  quedan libres.
//
//  Existe por tres razones concretas:
//
//   1. El sello del Pase en la mini-ficha dice cosas distintas según eso, y
//      **"Ya lo tenés" sólo se puede decir si REALMENTE lo tiene**: si no,
//      es una promesa falsa.
//
//   2. La ficha de oferta se pinta 20 veces en una grilla. Si cada tarjeta
//      preguntara por su cuenta serían 20 consultas para responder una
//      pregunta que es del usuario, no de la oferta. Se pregunta una vez acá.
//
//   3. Los Cupopacks llenan slots premium (§plantilla en lib/cupopacks.js), y
//      para saber si un pack entra —y cuánto de él entra— hacen falta el pase
//      y sus elecciones. Es la misma consulta, así que vive acá y no en cada
//      pantalla que muestre un Cupopack.
// ============================================================
import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { estadoEstadia } from './pases';

const VACIO = {
  activo: false, pendiente: false, cargando: true,
  pase: null, total: 0, usadas: 0, libres: 0, elegidasIds: [],
  // La estadía es la OTRA mitad del Pase y tiene su propio reloj: un uso por
  // pase, no ilimitada como los regulares. Sin este dato la ficha de un
  // alojamiento no puede decir la verdad.
  estadia: { disponible: false, motivo: 'sin_pase' },
  // Desde 10 días, el pase no tiene tope de premium (ver DIAS_PREMIUM_ILIMITADO
  // en lib/pases.js). Es un flag aparte y no "libres muy alto": los textos que
  // muestran "te quedan X de Y" tienen que poder distinguir "sin límite" de un
  // número, así que quien consuma esto SIEMPRE tiene que mirar este flag antes
  // de imprimir `libres`/`total` — ver §infinito más abajo.
  premiumIlimitado: false,
};

const PaseCtx = createContext({ ...VACIO, esTurista: false, comprarPase: null, refrescar: () => {} });

export function PasePropioProvider({ session, perfil, onComprarPase, children }) {
  const userId = session?.user?.id || null;
  // Turista = sesión iniciada que NO es socio ni superadmin. El sello del Pase
  // se dirige a él y sólo a él: al socio mirando su propio catálogo no tiene
  // sentido ofrecerle un Pase de turista.
  const esTurista = !!userId && !perfil?.negocio_id && !perfil?.es_superadmin;
  const [estado, setEstado] = useState({ ...VACIO, cargando: !!userId });

  // Expuesto como `refrescar`: después de aplicar o deshacer un Cupopack los
  // slots cambiaron, y quien lo hizo no tiene por qué saber cómo se recalculan.
  const leer = useCallback(async () => {
    if (!userId) { setEstado({ ...VACIO, cargando: false }); return; }

    const { data } = await supabase
      .from('usuario_pases')
      .select('id, estado, vence_el, dias, elecciones_premium, premium_ilimitado, tipo, upgrade_aplicado, incluye_estadia, estadia_usada_el, pases(elecciones_premium, duracion_dias)')
      .eq('user_id', userId)
      .in('estado', ['activo', 'pendiente']);

    const filas = data || [];
    const ahora = Date.now();
    const vivo  = filas.find(p =>
      p.estado === 'activo' && (!p.vence_el || new Date(p.vence_el).getTime() > ahora)) || null;
    // El pendiente también sirve: desde la Fase 8 se pueden elegir premium con
    // el pase sin activar (db/20260802_fase8_elegir_con_pase_pendiente.sql), y
    // ése es justo el estado del que acaba de comprarlo.
    const pase = vivo || filas.find(p => p.estado === 'pendiente') || null;

    if (!pase) { setEstado({ ...VACIO, cargando: false }); return; }

    // Mismo orden de precedencia que elegir_premium_pase en SQL. Si de acá
    // saliera otro número, la pantalla ofrecería llenar slots que la RPC
    // después rechaza. El pase de regalo no es un caso aparte: lleva su 1
    // premium en elecciones_premium, y cada upgrade pack se lo incrementa.
    const total = pase.elecciones_premium ?? pase.dias
      ?? pase.pases?.elecciones_premium ?? pase.pases?.duracion_dias ?? 3;

    const [{ data: elec }, { data: sols }] = await Promise.all([
      supabase.from('pase_elecciones').select('promocion_id').eq('usuario_pase_id', pase.id),
      // Las solicitudes ENVIADAS también ocupan slot: es lo que hace
      // slots_premium_ocupados() en SQL, la única definición del tope. Contar
      // sólo las elecciones daría de más y la RPC rechazaría con
      // `max_elecciones` un slot que la pantalla mostró como libre.
      supabase.from('solicitudes_fecha').select('id').eq('usuario_pase_id', pase.id).eq('estado', 'enviada'),
    ]);

    const elegidasIds = (elec || []).map(e => e.promocion_id);
    const usadas = elegidasIds.length + (sols || []).length;
    const premiumIlimitado = pase.premium_ilimitado === true;
    // `activo` sigue significando lo de siempre —el Pase está CORRIENDO— porque
    // de eso depende el "Ya lo tenés" de la mini-ficha, que sobre un pase
    // dormido sería una promesa falsa. Los slots, en cambio, ya se pueden usar.
    setEstado({
      activo: !!vivo, pendiente: !vivo, cargando: false,
      pase, usadas, elegidasIds,
      // §infinito: con premiumIlimitado, `total`/`libres` pasan a Infinity y NO
      // a un número grande. Es a propósito: cualquier consumidor NUMÉRICO (el
      // slice de encajeEnPase en lib/cupopacks.js) sigue funcionando solo —
      // `.slice(0, Infinity)` devuelve el array entero—, y cualquier
      // consumidor de TEXTO queda obligado a mirar `premiumIlimitado` antes de
      // imprimir el número, porque nadie quiere ver "te quedan Infinity".
      total:  premiumIlimitado ? Infinity : total,
      libres: premiumIlimitado ? Infinity : Math.max(0, total - usadas),
      premiumIlimitado,
      estadia: estadoEstadia(pase),
    });
  }, [userId]);

  useEffect(() => { leer(); }, [leer]);

  return (
    <PaseCtx.Provider value={{ ...estado, esTurista, comprarPase: onComprarPase, refrescar: leer }}>
      {children}
    </PaseCtx.Provider>
  );
}

export const usePasePropio = () => useContext(PaseCtx);
