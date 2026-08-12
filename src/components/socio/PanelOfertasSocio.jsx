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
  line: '#E7E9EE', primary: '#475BE1',
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
    // Lados: 14px los pone la fila colapsada (OfertaFila) + 15px más acá (29px
    // en total). Arriba/abajo: mismos 15px sumados al padding de base
    // (12→27, 16→31), para que el blanco alrededor separe el bloque expandido
    // de la fila que sigue tanto en horizontal como en vertical.
    <div style={{ padding: '27px 29px 31px' }}>
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
      {/* Apertura del acordeón. La altura del bloque expandido es variable
          (depende del alto de la foto, del copy y de qué botones muestre
          BloqueAccion), así que no se puede transicionar con `height` — de
          `0` a `auto` el navegador no interpola. La forma de animar hacia una
          altura automática sin medir nada con JS es la grilla de una sola
          fila: 0fr → 1fr SÍ interpola, y el hijo aporta su alto real.
          De ahí los dos divs: el de afuera es la grilla que crece, el de
          adentro necesita min-height:0 (si no, el contenido impone su alto
          mínimo y la fila nunca llega a 0) y overflow:hidden para que lo que
          todavía no entra quede recortado en vez de desbordar.
          Sólo se anima la apertura, no el cierre: la fila anterior deja de
          renderizar su bloque en el mismo commit en que la nueva lo monta, y
          sostener el saliente montado para animarlo dejaría dos
          BloqueAccion vivos a la vez. El ojo va al lugar donde se hizo
          click, así que la entrada es la que importa. */}
      {/* Tiempos y curva (2026-08-10, segunda pasada): duraciones al doble
          —la mitad de rápido— y easing simétrico. La curva anterior era
          cubic-bezier(.16,1,.3,1), un ease-out fuerte: salía disparada desde
          el primer frame y frenaba al final, o sea justo sin la entrada
          suave que se pidió. cubic-bezier(.45,0,.55,1) es un ease-in-out
          parejo: acelera al principio, desacelera al final, y los valores
          quedan cerca del medio (.45/.55) para que ese arranque sea sutil y
          no una demora perceptible. Va la misma curva en las dos capas para
          que se lean como un solo gesto y no como dos animaciones sueltas. */}
      <style>{`
        .pos-exp { display: grid; grid-template-rows: 1fr; }
        .pos-exp-in { min-height: 0; overflow: hidden; }
        .pos-exp { animation: posExpAbrir .84s cubic-bezier(.45,0,.55,1); }
        @keyframes posExpAbrir {
          from { grid-template-rows: 0fr; opacity: 0; }
          to   { grid-template-rows: 1fr; opacity: 1; }
        }
        /* El contenido entra un pelo después que la altura, para que se lea
           como "se abre y aparece" y no como un bloque que ya estaba ahí. */
        .pos-exp-in > * { animation: posExpContenido .9s cubic-bezier(.45,0,.55,1) .16s both; }
        @keyframes posExpContenido {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pos-exp, .pos-exp-in > * { animation: none; }
        }
      `}</style>

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
            {/* key = id de la oferta abierta, no del map: es lo que hace que
                React remonte este bloque en CADA selección y la animación
                vuelva a correr. Con la key de la fila, cambiar de oferta
                dentro de la misma fila no reanimaría nada. */}
            {activa && (
              <div className="pos-exp" key={abierta.id}>
                <div className="pos-exp-in">{expandido}</div>
              </div>
            )}
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
