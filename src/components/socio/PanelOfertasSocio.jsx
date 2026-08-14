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
import { useEffect, useState } from 'react';
import OfertaFila, { ALTO_FILA } from './OfertaFila';
import OfertaHero from './OfertaHero';
import BloqueAccion from './BloqueAccion';
import LineaPase from './LineaPase';
import PaSSMark from '../PaSSMark';
import { precioActivacionARS } from '../../lib/cobros';

const A = {
  ink: '#0B1020', ink2: '#3D4255', muted: '#6B7280',
  line: '#E7E9EE', primary: '#475BE1',
  font: "'Inter', system-ui, sans-serif",
};

const VISIBLES = 6;

// Duración del colapso, en ms. Vive en JS porque el desmontaje de la saliente
// depende de ella; el CSS de abajo la lee de acá para que no puedan
// desincronizarse.
const MS_CIERRE = 840;

// Centinela de `elegidaId`: el turista plegó la que estaba abierta y no hay
// ninguna. No es un id posible —los de `promociones` son numéricos— así que no
// puede chocar con una oferta real.
const CERRADO = 'cerrado';

const precioDe = p => precioActivacionARS({
  ahorro: p?.ahorroEstimado ?? p?.ahorro_estimado ?? 0,
  tokensCosto: p?.tokens_costo,
});

// La caja del panel. Es la misma con ofertas y cargando: lo que se está
// esperando es el contenido, no el panel, y si la caja también apareciera
// recién al llegar los datos la columna daría un salto de layout.
const CAJA = {
  background: '#fff', border: `1px solid ${A.line}`, borderRadius: 20,
  boxShadow: '0 20px 60px -30px rgba(11,16,32,0.15)', overflow: 'hidden',
  fontFamily: A.font,
};

// ─── Cabecera ───────────────────────────────────────────────────────────────
// Rediseño 2026-08-13: banda primary con el título a la izquierda y el lockup
// invertido —pastilla blanca, "PaSS" azul— a la derecha. Antes era texto sobre
// blanco y se leía como una etiqueta más de la lista; en primary la lista
// arranca con una tapa y se separa de la ficha que la rodea.
//
// `minHeight: ALTO_FILA` y no un padding propio: la banda tiene que medir
// exactamente lo que mide una fila cerrada, y dos alturas emergentes se
// desincronizan sola la próxima vez que alguien toque un cuerpo de letra de
// cualquiera de los dos lados.
//
// Se fue el contador ("N ofertas de este socio"). Lo pedía el doc §2.1 porque
// con la primera oferta expandida por default el resto de la lista podía pasar
// desapercibida; desde que el acordeón se pliega entero y todas las filas
// quedan a la vista, la cantidad se ve sola y el contador era un dato repetido.
//
// No lleva placeholder mientras carga: es texto fijo, no depende de la
// consulta. Grisarla sería fingir que se está esperando algo que ya está.
function Cabecera() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 14, minHeight: ALTO_FILA, padding: '0 24px',
      background: A.primary, color: '#fff',
    }}>
      <span>
        <span style={{
          display: 'block', fontSize: 24, fontWeight: 800,
          letterSpacing: '-0.02em', lineHeight: 1.15,
        }}>Promociones</span>
        <span style={{
          display: 'block', marginTop: 2, fontSize: 15.5, fontWeight: 500,
          lineHeight: 1.3,
        }}>de este socio</span>
      </span>
      {/* "Más beneficios con" arriba del lockup y no al lado: la marca sola,
          colgada en la esquina, se leía como un sello decorativo. Con la
          bajada encima dice para qué está ahí — que estas mismas ofertas
          rinden más con el Pase— y las dos líneas de la derecha quedan
          enfrentadas a las dos de la izquierda.
          Va centrada sobre el lockup y no alineada al borde derecho: el lockup
          es más ancho que la frase, así que al ras de la derecha la frase
          quedaba corrida y las dos piezas no se leían como un bloque.
          Invertido: `color` pinta la pastilla y la palabra del prefijo —acá,
          blanco sobre el primary de la banda— y `colorTexto` devuelve el
          "PaSS" de adentro al azul, que si no quedaba blanco sobre blanco. */}
      <span style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 7, flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
          Más beneficios con
        </span>
        <PaSSMark size={14} conGesell color="#fff" colorTexto={A.primary} />
      </span>
    </div>
  );
}

// ─── Placeholder de carga ───────────────────────────────────────────────────
// Tres filas grises latiendo con la geometría exacta de OfertaFila. No es
// decoración: mientras la consulta viaja, el sidebar entero quedaba en blanco
// —y la ficha de gastronomía llegaba a decir "no cuenta con cupones
// disponibles", que además de vacío era falso—. El bloque gris no promete
// ninguna oferta en particular, sólo que hay algo cargando.
//
// Mismo latido que los placeholders de la home (opacidad 0.9 ↔ 0.3 sobre
// #e2e4ea) y mismo escalonado por índice, para que se lea como el mismo
// estado de la misma app y no como dos maneras distintas de esperar.
const SKEL_BG = '#e2e4ea';

function BarraSkel({ ancho, alto = 12, delay = 0 }) {
  return (
    <div style={{
      width: ancho, height: alto, borderRadius: 4, background: SKEL_BG,
      animation: 'posSkelPulse 1.4s ease-in-out infinite',
      animationDelay: `${delay}s`,
    }} />
  );
}

function FilaSkeleton({ indice }) {
  const d = indice * 0.12;
  return (
    <div
      aria-hidden="true"
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        minHeight: ALTO_FILA, padding: '16px 14px',
        borderTop: `1px solid ${A.line}`,
      }}
    >
      <div style={{
        width: 110, height: 62, borderRadius: 8, flexShrink: 0, background: SKEL_BG,
        animation: 'posSkelPulse 1.4s ease-in-out infinite', animationDelay: `${d}s`,
      }} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <BarraSkel ancho="38%" alto={11} delay={d} />
        <BarraSkel ancho="82%" alto={14} delay={d} />
        <BarraSkel ancho="54%" alto={11} delay={d} />
      </div>
    </div>
  );
}

export default function PanelOfertasSocio({
  promos = [], session, ofertaId, cuponesTotal = 0, cargando = false,
  onOpenOferta, onComprarPase, onSumarCupon, onCanjear, onCoordinarFecha, onVerPase, onRegalarPase,
}) {
  // El deep-link manda sobre el índice 0. Si el id no está entre las ofertas de
  // este socio (link viejo, oferta despublicada), cae en la primera: es la
  // única vez que el índice 0 es la respuesta correcta.
  // El estado guarda SÓLO lo que tocó el turista. Cuál está abierta se deriva
  // en el render: elegida → deep-link → primera. Sincronizarlo con un efecto
  // haría que cada re-render del padre reabriera la del deep-link y pisara la
  // que el turista acababa de elegir.
  //
  // Tres valores, no dos: `null` es "todavía no tocó nada" y manda el
  // deep-link; un id es la que eligió; y CERRADO es "las cerró todas a mano".
  // Ese tercer estado no se puede representar con null, que ya significa otra
  // cosa: al cerrar la única abierta volvería a abrirse sola la del deep-link.
  const [elegidaId, setElegidaId] = useState(null);
  const [verTodas, setVerTodas]   = useState(false);
  // Las que se están CERRANDO. Siguen montadas hasta que termina su animación
  // de colapso — sin esto la saliente desaparece en el mismo frame en que se
  // monta la entrante y el cierre no se ve. Es una lista y no un solo id
  // porque el turista puede tocar una tercera fila con la segunda a mitad de
  // cierre, y la primera todavía tiene animación por delante.
  const [salientes, setSalientes] = useState([]);

  // La lista llega recreada en cada render, así que la identidad del array no
  // sirve para detectar "cambió de socio": se compara por ids.
  const ids = promos.map(p => p.id).join(',');
  const [idsPrev, setIdsPrev] = useState(ids);
  if (idsPrev !== ids) { setIdsPrev(ids); setElegidaId(null); setVerTodas(false); setSalientes([]); }

  // Desmontar por timer y no por `onAnimationEnd`: el evento burbujea desde el
  // contenido de adentro (que tiene su propia animación) y con
  // prefers-reduced-motion no llega a dispararse nunca, así que las salientes
  // quedarían montadas para siempre. Un click nuevo reinicia el timer y puede
  // dejar una saliente vieja montada un rato de más, pero ya terminó su
  // animación: está en 0fr y no se ve.
  useEffect(() => {
    if (!salientes.length) return;
    const t = setTimeout(() => setSalientes([]), MS_CIERRE + 60);
    return () => clearTimeout(t);
  }, [salientes]);

  // El placeholder gana sobre la lista vacía: mientras la consulta viaja
  // `promos` está vacío igual que cuando el socio no tiene ninguna oferta, y
  // los dos estados no se ven parecidos en pantalla.
  if (cargando) {
    return (
      <div style={CAJA}>
        <style>{`
          @keyframes posSkelPulse { 0%, 100% { opacity: .9 } 50% { opacity: .3 } }
          @media (prefers-reduced-motion: reduce) {
            @keyframes posSkelPulse { 0%, 100% { opacity: .55 } }
          }
        `}</style>
        <Cabecera />
        {[0, 1, 2].map(i => <FilaSkeleton key={i} indice={i} />)}
      </div>
    );
  }

  if (!promos.length) return null;

  const porDefecto = promos.find(p => String(p.id) === String(ofertaId)) || promos[0];
  const abierta    = elegidaId === CERRADO
    ? null
    : promos.find(p => String(p.id) === elegidaId) || porDefecto;
  // Si la del deep-link cae fuera de las primeras seis, la lista arranca abierta:
  // esconderla detrás de "Ver las N" sería no haber respetado el link.
  const mostrarTodas = verTodas || promos.indexOf(porDefecto) >= VISIBLES;
  const lista        = mostrarTodas ? promos : promos.slice(0, VISIBLES);
  const unaSola      = promos.length === 1;

  // Toma una promo y no `abierta` de arriba: mientras dura el cierre hay dos
  // paneles en pantalla —el que entra y el que se va— y cada uno tiene que
  // seguir mostrando SU oferta. Con la variable cerrada, la saliente se
  // colapsaría mostrando el contenido de la entrante.
  const panelDe = promo => (
    // Lados: 14px los pone la fila colapsada (OfertaFila) + 15px más acá (29px
    // en total). Arriba/abajo: mismos 15px sumados al padding de base
    // (12→27, 16→31), para que el blanco alrededor separe el bloque expandido
    // de la fila que sigue tanto en horizontal como en vertical.
    <div style={{ padding: '27px 29px 31px' }}>
      <OfertaHero promo={promo} onOpenOferta={onOpenOferta} />
      <div style={{ marginTop: 14 }}>
        <BloqueAccion
          promo={promo}
          session={session}
          precio={precioDe(promo)}
          cuponesTotal={cuponesTotal}
          onComprarPase={onComprarPase}
          onSumarCupon={onSumarCupon}
          onCanjear={() => onCanjear?.(promo)}
          onCoordinarFecha={onCoordinarFecha}
          onVerPase={onVerPase}
          onRegalarPase={onRegalarPase}
        />
        <LineaPase promo={promo} onVerPase={onVerPase} />
      </div>
    </div>
  );

  // Tocar la fila abierta la CIERRA y deja el acordeón entero plegado. Es lo
  // que la flecha promete: el mismo control que despliega, pliega.
  const elegir = id => {
    const nueva    = String(id);
    const saliente = abierta ? String(abierta.id) : null;
    // La que sale entra a la lista de cierre. Si la nueva venía cerrándose
    // (click de vuelta sobre una que todavía se está plegando) se la saca
    // primero, porque vuelve a ser la abierta y no puede renderizarse en los
    // dos estados a la vez. Cuando se cierra la propia abierta, `nueva` y
    // `saliente` son la misma: se saca y se vuelve a agregar, o sea que la
    // animación de cierre arranca de cero.
    if (saliente) {
      setSalientes(prev => [...prev.filter(x => x !== saliente && x !== nueva), saliente]);
    }
    setElegidaId(saliente === nueva ? CERRADO : nueva);
  };

  return (
    <div style={CAJA}>
      {/* Apertura y cierre del acordeón. La altura del bloque expandido es
          variable (depende del alto de la foto, del copy y de qué botones
          muestre BloqueAccion), así que no se puede transicionar con `height`
          — de `0` a `auto` el navegador no interpola. La forma de animar
          hacia una altura automática sin medir nada con JS es la grilla de una
          sola fila: 0fr ↔ 1fr SÍ interpola, y el hijo aporta su alto real.
          De ahí los dos divs: el de afuera es la grilla que crece o se cierra,
          el de adentro necesita min-height:0 (si no, el contenido impone su
          alto mínimo y la fila nunca llega a 0) y overflow:hidden para que lo
          que todavía no entra quede recortado en vez de desbordar.
          El cierre se anima (2026-08-13): antes la fila anterior dejaba de
          renderizar su bloque en el mismo commit en que la nueva lo montaba y
          el colapso era un salto. Ahora la saliente queda montada hasta que
          termina de cerrarse, o sea que hay dos BloqueAccion vivos durante
          menos de un segundo. Es aceptable porque el estado del Pase viene del
          contexto (usePasePropio, una sola consulta para toda la pantalla) y
          lo único que agrega el saliente es un fetch de lectura del cupón
          propio; no escribe nada. Misma duración y misma curva que la
          apertura: son un solo gesto, y si el cierre fuera más rápido lo de
          abajo saltaría hacia arriba antes de que la entrante lo empuje. */}
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
        .pos-exp, .pos-exp-out { display: grid; }
        .pos-exp-in { min-height: 0; overflow: hidden; }

        .pos-exp { grid-template-rows: 1fr; animation: posExpAbrir ${MS_CIERRE}ms cubic-bezier(.45,0,.55,1); }
        @keyframes posExpAbrir {
          from { grid-template-rows: 0fr; opacity: 0; }
          to   { grid-template-rows: 1fr; opacity: 1; }
        }
        /* El contenido entra un pelo después que la altura, para que se lea
           como "se abre y aparece" y no como un bloque que ya estaba ahí.
           El selector arranca en .pos-exp a propósito: si tomara cualquier
           .pos-exp-in, el panel que se está CERRANDO también correría la
           animación de entrada y su contenido aparecería mientras se colapsa. */
        .pos-exp > .pos-exp-in > * { animation: posExpContenido .9s cubic-bezier(.45,0,.55,1) .16s both; }
        @keyframes posExpContenido {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: none; }
        }

        /* El estado base es 0fr: cuando la animación termina el bloque queda
           colapsado por sí solo, sin depender de forwards ni del desmontaje.
           Así, si el timer que lo desmonta llega tarde, no se ve nada raro. */
        .pos-exp-out { grid-template-rows: 0fr; animation: posExpCerrar ${MS_CIERRE}ms cubic-bezier(.45,0,.55,1); }
        @keyframes posExpCerrar {
          from { grid-template-rows: 1fr; opacity: 1; }
          to   { grid-template-rows: 0fr; opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .pos-exp, .pos-exp > .pos-exp-in > *, .pos-exp-out { animation: none; }
        }
      `}</style>

      <Cabecera />

      {/* Con una sola oferta no hay fila que tocar: el panel va suelto y
          siempre abierto, así que `abierta` nunca puede ser null acá. */}
      {unaSola ? panelDe(porDefecto) : lista.map(p => {
        const activa   = !!abierta && p.id === abierta.id;
        // La saliente nunca es también la abierta: `elegir` la saca de la
        // lista al reabrirla, y acá se vuelve a chequear por las dudas.
        const cerrando = !activa && salientes.includes(String(p.id));
        return (
          <div key={p.id} style={{ borderTop: `1px solid ${A.line}` }}>
            <OfertaFila promo={p} activa={activa} onClick={() => elegir(p.id)} />
            {/* Un solo bloque para los dos estados, cambiando la clase: al
                cerrarse, React reconcilia el MISMO div y no remonta nada de
                adentro. Si fueran dos bloques distintos, BloqueAccion se
                remontaría al empezar el cierre y perdería lo que ya sabe —
                durante el colapso mostraría "Comprar cupón" sobre un cupón que
                el turista ya tiene, hasta que vuelva a responder la consulta.
                La animación arranca igual porque cambia el nombre del
                keyframe, y la de apertura corre al montarse el bloque, que es
                exactamente cuando la fila pasa a activa. */}
            {(activa || cerrando) && (
              <div className={activa ? 'pos-exp' : 'pos-exp-out'}>
                <div className="pos-exp-in">{panelDe(p)}</div>
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
