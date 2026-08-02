// ============================================================
//  src/components/CupopacksParaPase.jsx
//  "¿Te armamos la selección?" — los Cupopacks que entran en los slots premium
//  que al turista todavía le quedan libres.
//
//  Es el atajo para el que no quiere elegir entre cuarenta premium, no un
//  reemplazo de la elección manual: convive con ella y cualquier elección se
//  puede cambiar después (§6 de 3-cupopacks.md).
//
//  Sólo se muestra si hay al menos un Cupopack con premium que entren. Un
//  bloque vacío que dice "no hay nada" ocupa lugar y no aporta.
// ============================================================
import { useEffect, useState } from 'react';
import { getCupopacks } from '../lib/datos';
import { encajeEnPase, cupopackAplicado, aplicarCupopack, deshacerCupopack } from '../lib/cupopacks';

const A = {
  ink: '#0B1020', ink2: '#3D4255', muted: '#6B7280',
  line: '#E7E9EE', primary: '#2545E6', primarySoft: '#EEF1FF',
  yellow: '#FFC93C', font: "'Inter', system-ui, sans-serif",
};

function Ficha({ cupopack, paseId, libres, total, elegidasIds, onCambio }) {
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso]     = useState(null);

  const { premium, entran, sobran } = encajeEnPase(cupopack.cupones, libres);
  const puesto = cupopackAplicado(cupopack.cupones, elegidasIds, libres || premium.length);
  const mios   = premium.filter(c => elegidasIds.includes(c.id));

  const accionar = async () => {
    if (ocupado) return;
    setOcupado(true); setAviso(null);
    const r = puesto
      ? await deshacerCupopack(paseId, cupopack.cupones, elegidasIds)
      : await aplicarCupopack(paseId, cupopack.cupones, libres);
    setOcupado(false);
    if (puesto && r.fallidos.length) setAviso(`${r.fallidos.length} ya los canjeaste y quedan en tu Pase.`);
    else if (!puesto && r.fallidos.length) setAviso(r.fallidos[0].texto);
    await onCambio();
  };

  return (
    <div style={{
      display: 'flex', gap: 14, alignItems: 'center',
      padding: 12, borderRadius: 16,
      border: `1px solid ${puesto ? A.primary : A.line}`,
      background: puesto ? A.primarySoft : '#fff',
    }}>
      <img src={cupopack.images?.[0]} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 800, color: A.ink, letterSpacing: '-0.01em' }}>{cupopack.title}</div>
        <div style={{ fontSize: 12.5, color: A.ink2, marginTop: 2, lineHeight: 1.4 }}>
          {puesto
            ? `Ocupa ${mios.length} de tus ${total} beneficios premium.`
            : `${entran.length} beneficios premium elegidos por nosotros.${sobran > 0 ? ` (${sobran} no entran)` : ''}`}
        </div>
        {aviso && <div style={{ fontSize: 12, color: '#B5852A', marginTop: 4, lineHeight: 1.4 }}>{aviso}</div>}
      </div>
      <button onClick={accionar} disabled={ocupado} style={{
        flexShrink: 0, padding: '10px 16px', borderRadius: 999, cursor: ocupado ? 'default' : 'pointer',
        border: puesto ? `1.5px solid ${A.line}` : 'none',
        background: puesto ? 'transparent' : A.primary,
        color: puesto ? A.ink2 : '#fff',
        fontFamily: A.font, fontSize: 13.5, fontWeight: 700, opacity: ocupado ? 0.6 : 1,
      }}>
        {ocupado ? '…' : puesto ? 'Sacar' : 'Elegirlos'}
      </button>
    </div>
  );
}

export default function CupopacksParaPase({ paseId, libres, total, elegidasIds = [], onCambio }) {
  const [packs, setPacks] = useState(null);

  useEffect(() => {
    let vivo = true;
    getCupopacks().then(p => { if (vivo) setPacks(p || []); });
    return () => { vivo = false; };
  }, []);

  if (!packs) return null;

  // Se filtra por lo que ENTRA, no por lo que el pack tiene: un Cupopack de 3
  // premium con un solo slot libre igual sirve —se ofrece ese uno—, pero uno
  // sin ningún premium no tiene nada que llenar.
  const utiles = packs.filter(p => {
    const { premium, entran } = encajeEnPase(p.cupones, libres);
    if (!premium.length) return false;
    // Los ya puestos se siguen mostrando aunque no queden slots: es la única
    // forma de poder deshacerlos desde acá.
    return entran.length > 0 || cupopackAplicado(p.cupones, elegidasIds, premium.length);
  });

  if (!utiles.length) return null;

  return (
    <div style={{ background: '#fff', border: `1px solid ${A.line}`, borderRadius: 18, padding: 16, fontFamily: A.font }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: A.ink }}>¿Te armamos la selección?</div>
      <div style={{ fontSize: 13, color: A.muted, margin: '4px 0 14px', lineHeight: 1.5 }}>
        Cupopacks que elegimos nosotros entre los premium. Los ponés de un toque y los cambiás cuando quieras.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {utiles.map(p => (
          <Ficha key={p.id} cupopack={p} paseId={paseId} libres={libres} total={total}
            elegidasIds={elegidasIds} onCambio={onCambio} />
        ))}
      </div>
    </div>
  );
}
