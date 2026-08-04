// ============================================================
//  src/components/socio/PanelOfertasSocio.jsx
//  Columna derecha de la ficha de socio: las ofertas de ese comercio.
//
//  Reemplaza a la card de tabs por badge (`2x1`, `-20%`, `Upgrade`), que
//  producía labels duplicados cuando el socio tenía dos ofertas del mismo
//  porcentaje, mezclaba tipo de beneficio con magnitud en el mismo control y
//  truncaba el título. El acordeón escala a N ofertas.
//
//  ⚠️ La oferta que llega por deep-link entra expandida. NUNCA default al
//  índice 0: si el turista clickeó una minificha concreta y le abrimos otra,
//  cambió de producto sin pedirlo.
// ============================================================
import { useState } from 'react';
import OfertaFila from './OfertaFila';
import OfertaHero from './OfertaHero';
import BloqueAccion from './BloqueAccion';
import LineaPase from './LineaPase';
import { precioActivacionARS } from '../../lib/cobros';

const A = {
  ink: '#0B1020', ink2: '#3D4255', muted: '#6B7280',
  line: '#E7E9EE', primary: '#2545E6',
  font: "'Inter', system-ui, sans-serif",
};

const VISIBLES = 6;

const precioDe = p => precioActivacionARS({
  ahorro: p?.ahorroEstimado ?? p?.ahorro_estimado ?? 0,
  tokensCosto: p?.tokens_costo,
});

export default function PanelOfertasSocio({
  promos = [], session, ofertaId,
  onOpenOferta, onComprarPase, onSumarCupon, onCanjear, onCoordinarFecha, onVerPase,
}) {
  // El deep-link manda sobre el índice 0. Si el id no está entre las ofertas de
  // este socio (link viejo, oferta despublicada), cae en la primera: es la
  // única vez que el índice 0 es la respuesta correcta.
  // El estado guarda SÓLO lo que tocó el turista. Cuál está abierta se deriva
  // en el render: elegida → deep-link → primera. Sincronizarlo con un efecto
  // haría que cada re-render del padre reabriera la del deep-link y pisara la
  // que el turista acababa de elegir.
  const [elegidaId, setElegidaId] = useState(null);
  const [verTodas, setVerTodas]   = useState(false);

  // La lista llega recreada en cada render, así que la identidad del array no
  // sirve para detectar "cambió de socio": se compara por ids.
  const ids = promos.map(p => p.id).join(',');
  const [idsPrev, setIdsPrev] = useState(ids);
  if (idsPrev !== ids) { setIdsPrev(ids); setElegidaId(null); setVerTodas(false); }

  if (!promos.length) return null;

  const porDefecto = promos.find(p => String(p.id) === String(ofertaId)) || promos[0];
  const abierta    = promos.find(p => String(p.id) === elegidaId) || porDefecto;
  // Si la del deep-link cae fuera de las primeras seis, la lista arranca abierta:
  // esconderla detrás de "Ver las N" sería no haber respetado el link.
  const mostrarTodas = verTodas || promos.indexOf(porDefecto) >= VISIBLES;
  const lista        = mostrarTodas ? promos : promos.slice(0, VISIBLES);
  const unaSola      = promos.length === 1;

  const expandido = (
    <div style={{ padding: '12px 14px 16px' }}>
      <OfertaHero promo={abierta} onOpenOferta={onOpenOferta} />
      <div style={{ marginTop: 14 }}>
        <BloqueAccion
          promo={abierta}
          session={session}
          precio={precioDe(abierta)}
          onComprarPase={onComprarPase}
          onSumarCupon={onSumarCupon}
          onCanjear={() => onCanjear?.(abierta)}
          onCoordinarFecha={onCoordinarFecha}
        />
        <LineaPase promo={abierta} onVerPase={onVerPase} />
      </div>
    </div>
  );

  return (
    <div style={{
      background: '#fff', border: `1px solid ${A.line}`, borderRadius: 20,
      boxShadow: '0 20px 60px -30px rgba(11,16,32,0.15)', overflow: 'hidden',
      fontFamily: A.font,
    }}>
      {/* El contador es obligatorio (doc §2.1): sin él, la primera oferta
          expandida se lee como la única que tiene el socio. */}
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        gap: 10, padding: '16px 16px 12px',
      }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: A.ink, letterSpacing: '-0.01em' }}>
          Ofertas de este socio
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: A.muted, flexShrink: 0 }}>
          {promos.length} disponible{promos.length !== 1 ? 's' : ''}
        </span>
      </div>

      {unaSola ? expandido : lista.map(p => {
        const activa = p.id === abierta.id;
        return (
          <div key={p.id} style={{ borderTop: `1px solid ${A.line}` }}>
            <OfertaFila promo={p} activa={activa} onClick={() => setElegidaId(String(p.id))} />
            {activa && expandido}
          </div>
        );
      })}

      {!unaSola && !mostrarTodas && promos.length > VISIBLES && (
        <button
          type="button"
          onClick={() => setVerTodas(true)}
          style={{
            width: '100%', padding: '12px 16px', border: 'none',
            borderTop: `1px solid ${A.line}`, background: '#fff',
            color: A.primary, fontFamily: A.font, fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Ver las {promos.length} ofertas
        </button>
      )}
    </div>
  );
}
