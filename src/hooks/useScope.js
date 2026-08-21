// ============================================================
//  src/hooks/useScope.js
//  Puerta de entrada a src/lib/scope.js desde componentes. Resuelve el
//  scope inicial al montar, se suscribe a cuponear:scope, y trae las
//  listas que el selector y los listados necesitan: ciudades de la
//  región activa, regiones activas (para cambiar de scope) y regiones
//  en waitlist (para el bloque "Próximamente" del selector).
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  getScope, resolverScopeInicial, setRegion as setRegionScope, setCiudad as setCiudadScope,
  getRegionesActivas, getRegionesWaitlist, getCiudadesDeRegion,
} from '../lib/scope';

export default function useScope() {
  const [scope, setScopeState]   = useState(getScope());
  const [regiones, setRegiones]  = useState([]);
  const [waitlist, setWaitlist]  = useState([]);
  const [ciudades, setCiudades]  = useState([]);
  const [listo, setListo]        = useState(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const [inicial, activas, enEspera] = await Promise.all([
        resolverScopeInicial(),
        getRegionesActivas(),
        getRegionesWaitlist(),
      ]);
      if (!vivo) return;
      setScopeState({ region: inicial.region, ciudad: inicial.ciudad });
      setCiudades(inicial.ciudades);
      setRegiones(activas);
      setWaitlist(enEspera);
      setListo(true);
    })();

    const onScope = () => setScopeState(getScope());
    window.addEventListener('cuponear:scope', onScope);
    return () => { vivo = false; window.removeEventListener('cuponear:scope', onScope); };
  }, []);

  // Al cambiar de región, traer sus ciudades — no las de la región vieja.
  // getCiudadesDeRegion ya devuelve [] sin regionId (ver scope.js), así que
  // no hace falta la rama sin región acá: siempre pasa por el mismo .then,
  // nunca un setState síncrono en el cuerpo del efecto.
  useEffect(() => {
    let vivo = true;
    getCiudadesDeRegion(scope.region?.id).then(cs => { if (vivo) setCiudades(cs); });
    return () => { vivo = false; };
  }, [scope.region?.id]);

  const setRegion = useCallback((region) => setRegionScope(region), []);
  const setCiudad = useCallback((ciudad) => setCiudadScope(ciudad), []);

  return {
    region: scope.region,
    ciudad: scope.ciudad,
    setRegion,
    setCiudad,
    regiones,
    ciudades,
    regionesWaitlist: waitlist,
    listo,
  };
}
