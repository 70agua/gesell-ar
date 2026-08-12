// ============================================================
//  src/components/OfertaCard.jsx
//  Card canónica de oferta/cupón — usada en Favoritos, OfertasView,
//  Marketplace (grid y lista), y las minifichas de HomeView.
//  Estructura: header (avatar+nombre+localidad) → imagen con badge
//  + heart → franja "Ahorrás" con "Ver oferta" a la derecha → sello del
//  Pase ("Obtené tu Cupon PASS", o "Incluido en tu" si hay turista logueado)
//  → al pie, debajo del CTA de compra, en texto suelto,
//  "ó compralo suelto por $X".
//
//  El orden es una jerarquía: mirar la oferta cuesta menos que comprarla, así
//  que "Ver oferta" va primero pero en texto; el Pase es lo que queremos que
//  elija, y se lleva la única forma de botón; el cupón suelto es la opción
//  cara y va último, sin forma de botón y sin hover — no se la ofrece, se la
//  menciona.
// ============================================================

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import PaSSMark from './PaSSMark';
import { usePasePropio } from '../lib/pasePropio';
import { useCarrito } from '../lib/carrito';
import { secondsUntil } from '../lib/ofertas';
import { precioActivacionARS, creditosActivacion, esCuponDeEntrada, gananciaNeta } from '../lib/cobros';
import HeartButton from './HeartButton';
import { CreditTooltip } from './InfoTooltip';
import { useMostrarCreditos } from '../lib/sesion';
import GroupBadge from './GroupBadge';
import { descuentoMaximo } from '../lib/grupos';
import { nivelEnPase, esOfertaEstadia } from '../lib/pases';

const A = {
  primary: '#475BE1',
  primarySoft: '#EEF0FD',
  ink:     '#0B1020',
  ink2:    '#3D4255',
  muted:   '#6B7280',
  line:    '#E7E9EE',
  bg:      '#F7F7F8',
  yellow:  '#FFC93C',
  green:   '#10A36B',
  primaryDark: '#3347C8',
  greenSoft: '#EDFAF4',
  // Fondo de la franja de ahorro. Celeste y no verde: el verde lo carga el
  // monto, y repetirlo en el fondo hacía que la franja gritara más que el CTA.
  ahorroBg:  '#ECFAFF',
  font:    "'Inter', system-ui, sans-serif",
};

const fmtPesos = n => '$' + Math.round(n).toLocaleString('es-AR');

// Segunda línea del ahorro. Nunca falta: el número solo no dice sobre qué se
// ahorra, y esa pregunta la contesta o la modalidad (alojamientos, donde
// cambia todo si es por noche o por estadía) o, en el resto, la referencia
// contra la que se comparó. Default seguro del alojamiento = "en toda la
// estadía".
const MODALIDAD_AHORRO = {
  por_persona:        'por persona',
  por_noche:          'por noche',
  en_toda_la_estadia: 'en toda la estadía',
};
function ahorroLegend(promo) {
  // El cupón de entrada no muestra un ahorro sobre la estadía, así que tampoco
  // le corresponde la modalidad: cae en la leyenda genérica.
  if (promo.categoria === 'alojamiento' && !esCuponDeEntrada(promo.ahorroEstimado)) {
    return MODALIDAD_AHORRO[promo.ahorroModalidad] || 'en toda la estadía';
  }
  return 'del precio original';
}

function CoinSVG({ size = 13 }) {
  return <img src="/credito-coin.svg" alt="crédito" width={size} height={size} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }} />;
}

const IcoBolt = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>;

// ─── Contador FLASH: dígitos que ruedan ───────────────────────
// (2026-08-10, a pedido, tomando como referencia skiper-ui/skiper37.) Antes
// los números se reemplazaban de golpe y el contador no se leía como algo
// vivo: cambiaba un carácter por segundo y listo. Ahora cada dígito es una
// tira vertical del 0 al 9 dentro de una ventanita con overflow:hidden, y
// "cambiar de número" es correr esa tira — el mismo mecanismo de odómetro
// que usa la referencia (ahí vía number-flow; acá a mano, que son 20 líneas
// y evita sumar dos dependencias nuevas —number-flow y framer-motion— a un
// proyecto que no usa ninguna librería de animación).
const DIGITO_H = 16; // alto de la ventana = alto de cada número de la tira

function DigitoRodante({ n }) {
  return (
    <span style={{ display: 'block', height: DIGITO_H, overflow: 'hidden' }}>
      <span
        style={{
          display: 'block',
          transform: `translateY(-${n * DIGITO_H}px)`,
          transition: 'transform .55s cubic-bezier(.16,1,.3,1)',
          willChange: 'transform',
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
          <span key={d} style={{ display: 'block', height: DIGITO_H, lineHeight: `${DIGITO_H}px` }}>{d}</span>
        ))}
      </span>
    </span>
  );
}

// Una casilla (horas, minutos o segundos) = dos dígitos rodantes.
function CasillaTiempo({ valor }) {
  const s = String(valor).padStart(2, '0');
  return (
    <div style={{ background: '#fff', color: A.ink, borderRadius: 5, fontSize: 12, fontWeight: 800, minWidth: 26, padding: '3px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontVariantNumeric: 'tabular-nums' }}>
      {s.split('').map((d, i) => <DigitoRodante key={i} n={Number(d)} />)}
    </div>
  );
}

function FlashPill({ fechaFinFlash }) {
  const [secs, setSecs] = useState(() => secondsUntil(fechaFinFlash));
  // Depende de `fechaFinFlash` (antes: array vacío, que dejaba el intervalo
  // corriendo para siempre aunque el contador ya hubiera llegado a cero —
  // seguía haciendo un setState por segundo sobre un componente que ya
  // devolvía null). Ahora se recalcula si cambia la fecha y se corta solo al
  // llegar a 0.
  useEffect(() => {
    setSecs(secondsUntil(fechaFinFlash));
    const t = setInterval(() => {
      setSecs(s => {
        if (s <= 1) { clearInterval(t); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [fechaFinFlash]);
  if (secs <= 0) return null;
  const th = Math.floor(secs / 3600), tm = Math.floor((secs % 3600) / 60), ts = secs % 60;
  return (
    // right:52 reserva el espacio del corazón (top-right) — si chip+contador
    // no entran en el ancho disponible, el contador baja a un renglón nuevo.
    <div style={{ position: 'absolute', top: 10, left: 10, right: 52, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, zIndex: 2 }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#EF4444', borderRadius: 999, padding: '5px 12px 5px 11px', flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: '#fff', letterSpacing: '0.05em' }}>OFERTA</span>
        <span style={{ fontSize: 11, fontWeight: 900, color: A.yellow, fontStyle: 'italic', letterSpacing: '0.05em' }}>FLASH</span>
        <span style={{ color: A.yellow, display: 'flex', alignItems: 'center' }}><IcoBolt /></span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
        {[th, tm, ts].map((v, i) => (
          <React.Fragment key={i}>
            {/* Arriba de 99h la tira de dos dígitos no alcanza y se muestra
                el número plano: una oferta flash de más de cuatro días es un
                caso de borde, no vale romper el formato por él. */}
            {i === 0 && v > 99
              ? <div style={{ background: '#fff', color: A.ink, borderRadius: 5, fontSize: 12, fontWeight: 800, minWidth: 26, padding: '3px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{v}</div>
              : <CasillaTiempo valor={v} />}
            {i < 2 && <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 900, fontSize: 13 }}>:</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── Header: avatar + nombre + localidad ──────────────────────
function ProveedorHeader({ promo, size = 44 }) {
  const nombre = promo.proveedorNombre || promo.subtitle?.split('·')[0]?.trim();
  const localidad = promo.negocioLocalidad || promo.negocioZone;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '14px 16px 12px' }}>
      <div style={{ width: size, height: size, borderRadius: '50%', background: A.bg, border: `1px solid ${A.line}`, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {promo.proveedorImage
          ? <img src={promo.proveedorImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: size * 0.32, fontWeight: 700, color: A.muted }}>{(nombre || '?')[0]}</span>
        }
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: A.ink, lineHeight: 1.25, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {nombre}
        </div>
        {localidad && (
          <div style={{ fontSize: 12, color: A.muted, marginTop: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {localidad}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Imagen con badge, heart y overlays ───────────────────────
// `grow`: cuando la ficha se estira para igualar a la más alta de su fila, el
// sobrante lo absorbe la foto (que recorta con object-fit) en vez de aparecer
// como un blanco entre el contenido y la franja de ahorro.
// ─── Corona PREMIUM: mismo fondo translúcido que el corazón ──
// `rgba(0,0,0,0.30)` + blur es el fondo del HeartButton sobre foto (ver
// HeartButton.jsx) — se repite acá para que las dos píldoras que flotan sobre
// la imagen se lean como una sola familia visual, no como dos estilos.
function PremiumBadge({ top = 10 }) {
  return (
    <div style={{
      position: 'absolute', top, left: 10, zIndex: 3,
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: 'rgba(0,0,0,0.30)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
      borderRadius: 999, padding: '6px 13px 6px 10px',
    }}>
      <img src="/iconos/premium-01.svg" alt="" width={14} height={11} style={{ display: 'block', flexShrink: 0 }} />
      {/* "Finito": peso 500 y no 700+ como el resto de los badges — éste
          acompaña, no compite con el % de descuento que va abajo. */}
      <span style={{ fontSize: 11, fontWeight: 500, color: '#fff', letterSpacing: '0.09em' }}>PREMIUM</span>
    </div>
  );
}

function ImagenConBadge({ promo, imgHeight, inMarketplace, hideHeart = false, grow = false }) {
  const esFlash = promo.offerType === 'Flash';
  return (
    <div style={{ position: 'relative', overflow: 'hidden', flexShrink: 0, ...(grow ? { flexGrow: 1 } : null), ...(imgHeight ? { height: imgHeight } : { aspectRatio: '4/3' }) }}>
      <img src={promo.image} alt={promo.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,16,32,0.75) 0%, rgba(11,16,32,0.15) 55%, transparent 100%)' }} />

      {esFlash && <FlashPill fechaFinFlash={promo.fechaFinFlash} />}

      {nivelEnPase(promo) === 'premium' && <PremiumBadge top={esFlash ? 44 : 10} />}

      {promo.exclusivoHuespedes && (
        <>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 56, background: 'linear-gradient(to bottom, rgba(5,10,25,0.72) 0%, transparent 100%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M20 12v10H4V12"/><rect x="2" y="7" width="20" height="5" rx="1"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
            </svg>
            <span style={{ fontSize: 11, fontWeight: 500, color: '#fff', lineHeight: 1.3 }}>Exclusivo turistas de {promo.exclusivoHuespedes}</span>
          </div>
        </>
      )}

      {promo.esGrupal && (
        <div style={{ position: 'absolute', top: esFlash ? 44 : 10, left: 10, zIndex: 3 }}>
          <GroupBadge descuentoMax={descuentoMaximo(promo.grupoTramos)} compact />
        </div>
      )}

      {inMarketplace ? (
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 3, background: '#d2e9f3', color: '#0c101f', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', padding: '3px 8px', borderRadius: 999 }}>
          PROMOCIÓN
        </div>
      ) : !hideHeart && (
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 3 }}>
          <HeartButton id={promo.id} />
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 16px 15px' }}>
        <div style={{ fontSize: (promo.badge?.length || 0) > 5 ? 30 : 42, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{promo.badge}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.92)', lineHeight: 1.3, marginTop: 6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{promo.title}</div>
      </div>
    </div>
  );
}

// ─── Franja "Ahorrás $X aprox." ───────────────────────────────
//  Fila principal en una sola línea (se achica si no entra). Si hay
//  leyenda (alojamientos) va en un renglón aparte, agrandando el recuadro.
//
//  Los PUNTOS salieron de acá: en la mini-ficha competían con el ahorro, que
//  es el número que decide. Quedan en el detalle de la oferta, donde el
//  turista ya está evaluando la compra.
// En los cupones de entrada (ahorro < $10.000) el ahorro bruto se lee mal:
// con ratio 2x, "ahorrás $5.000" al lado de "pagás $2.500" invita a hacer la
// resta. Ahí el monto es la GANANCIA NETA, que es lo que el turista se lleva
// de verdad — pero el verbo sigue siendo "Ahorrás": nunca "Ganás", que es de
// los puntos y confunde dos monedas distintas. Y el monto siempre lleva
// "aprox.": es una estimación en los dos casos.
//
// A la derecha va `accion` — el "Ver oferta". Va acá y no abajo porque es lo
// más barato que puede hacer el turista, y en la franja no le compite al Pase.
function FranjaAhorro({ ahorroEstimado, legend, accion = null }) {
  const entrada = esCuponDeEntrada(ahorroEstimado);
  const monto   = entrada ? gananciaNeta(ahorroEstimado) : ahorroEstimado;
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const fit = () => {
      const o = outerRef.current, inn = innerRef.current;
      if (!o || !inn) return;
      const avail = o.clientWidth;
      const need = inn.scrollWidth;
      setScale(need > avail && need > 0 ? avail / need : 1);
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (outerRef.current) ro.observe(outerRef.current);
    return () => ro.disconnect();
  }, [ahorroEstimado, monto]);

  const hayAhorro = ahorroEstimado > 0;
  // Sin ahorro la franja igual se dibuja si tiene que llevar el "Ver oferta":
  // es el único lugar donde vive ese enlace.
  if (!hayAhorro && !accion) return null;

  return (
    <div style={{ background: A.ahorroBg, padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {hayAhorro && (
          <>
            <div ref={outerRef} style={{ overflow: 'hidden' }}>
              <div ref={innerRef} style={{ display: 'flex', width: 'max-content', minWidth: '100%', alignItems: 'baseline', gap: 10, whiteSpace: 'nowrap', transform: `scale(${scale})`, transformOrigin: 'left center' }}>
                <span style={{ color: A.green }}>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>Ahorrás </span>
                  <span style={{ fontSize: 13, fontWeight: 800 }}>{fmtPesos(monto)} </span>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>aprox.</span>
                </span>
              </div>
            </div>
            {legend && (
              <div style={{ fontSize: 11, fontWeight: 700, color: A.green }}>{legend}</div>
            )}
          </>
        )}
      </div>
      {accion}
    </div>
  );
}

// ─── "Ampliar info" — enlace, no botón ────────────────────────
// Sólo texto: sin borde ni fondo. Es lo que menos compromete de la ficha y no
// tiene que verse como el CTA.
//
// Abre el detalle del CUPÓN y no la ficha del socio, que es a donde lleva
// clickear la tarjeta. Son dos preguntas distintas: la tarjeta pregunta "quién
// es este comercio", el enlace pregunta "qué dice la letra chica de este
// descuento" — y la letra chica (precio suelto, condiciones, stock) vive en el
// detalle del cupón.
function VerOfertaLink({ promo, onOpen }) {
  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); onOpen && onOpen(promo, { detalle: true }); }}
      style={{
        flexShrink: 0, background: 'none', border: 'none', padding: 0,
        fontFamily: A.font, fontSize: 12.5, fontWeight: 800, color: A.green,
        textDecoration: 'underline', textUnderlineOffset: 2,
        lineHeight: 1.2, whiteSpace: 'nowrap', cursor: 'pointer',
      }}
    >
      Ampliar info
    </button>
  );
}

// ─── Precio del cupón suelto (micro-fichas de la home) ────────
// Mismo criterio que la mini-ficha: el suelto es la opción cara y se enuncia
// como tal ("suelto por $X"), no como la acción principal. Acá no va el sello
// del Pase porque son piezas chicas de la home, sin lugar para dos elementos.
export function PrecioCupon({ tokens_costo, ahorro = 0, color = A.ink, mutedColor = A.muted }) {
  const mostrarCreditos = useMostrarCreditos();
  const tc = tokens_costo;
  if (tc == null && !(ahorro > 0)) return null;
  if (tc === 0) {
    return (
      <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: A.green }}>
        Este cupón es GRATIS para vos
      </div>
    );
  }
  const pesos = fmtPesos(precioActivacionARS({ ahorro, tokensCosto: tc }));
  const creds = creditosActivacion({ ahorro, tokensCosto: tc });
  return (
    <div style={{ textAlign: 'center', fontSize: 12, color, lineHeight: 1.4 }}>
      {mostrarCreditos ? (
        <>
          Suelto por{' '}
          <CoinSVG size={13} />{' '}
          <span style={{ fontWeight: 800 }}>{creds} crédito{creds !== 1 ? 's' : ''}</span>
          <CreditTooltip />
          <span style={{ display: 'block', fontSize: 11, color: mutedColor, marginTop: 2 }}>({pesos})</span>
        </>
      ) : (
        <>Suelto por <span style={{ fontWeight: 800 }}>{pesos}</span></>
      )}
    </div>
  );
}

// ─── Franja "¡Últimos N cupones!" (solo si hay stock físico y quedan ≤8) ──
function StockStrip({ tieneStock, stockRestante }) {
  if (!tieneStock || stockRestante == null || stockRestante <= 0 || stockRestante > 5) return null;
  const nIconos = Math.min(stockRestante, 5);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 16px', background: '#FFF4E5', borderTop: '1px solid #FBE3BE' }}>
      <span style={{ display: 'inline-flex', flexShrink: 0 }}>
        {Array.from({ length: nIconos }).map((_, i) => (
          <img key={i} src="/ico-disc.svg" alt="" width={17} height={17}
            style={{ display: 'block', marginLeft: i ? -5 : 0, animation: i === nIconos - 1 ? 'stockBlink 0.8s ease-in-out infinite' : undefined }} />
        ))}
      </span>
      <span style={{ fontSize: 11.5, fontWeight: 800, color: '#B4531B', letterSpacing: '0.01em' }}>
        {stockRestante === 1 ? '¡Último cupón disponible!' : `¡Últimos ${stockRestante} cupones!`}
      </span>
    </div>
  );
}

// ─── Sello del Pase ───────────────────────────────────────────
// DOS textos, y sólo dos:
//
//   con Pase ACTIVO  →  "Usá tu Cupon PASS"
//   sin Pase activo  →  "Obtené tu Cupon PASS"
//
// Igual para base, premium y estadía: el sello dice a qué producto pertenece la
// oferta, no cómo se consume. El límite —cuántos premium trae el Pase, cuántos
// quedan, que la estadía es una sola— se explica en el detalle, en la caja
// lateral, donde hay lugar para decirlo entero.
//
// NUNCA "incluido": una premium consume uno de los pocos slots y la estadía es
// una por pase. "Incluido" promete acceso ilimitado a algo limitado.
//
// El estado depende de TENER PASE ACTIVO, no de estar logueado. Un turista
// logueado sin Pase no tiene nada que usar.
//
// No es un botón: la forma llena y redondeada es del CTA de compra. Dos pesos
// de acción y no dos botones — azul lleno = la acción; texto = todo lo demás.
function SelloPase() {
  const { activo, comprarPase } = usePasePropio();
  const texto = activo ? 'Usá tu' : 'Obtené tu';

  // Al que ya lo tiene no se le vende de nuevo.
  const clickable = !activo && typeof comprarPase === 'function';

  return (
    <button
      type="button"
      onClick={clickable ? (e => { e.stopPropagation(); comprarPase(); }) : undefined}
      style={{
        alignSelf: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        background: 'none', border: 'none', padding: 0, textDecoration: 'none',
        fontFamily: A.font, fontSize: 12, fontWeight: 400,
        color: A.primary, cursor: clickable ? 'pointer' : 'default', lineHeight: 3,
      }}
    >
      {/* La NauryzRedkeds del lockup se apoya más abajo que la Inter dentro de
          la misma caja. Los 2px alinean las dos ópticamente; `alignItems:
          center` sólo iguala las cajas, no los trazos. */}
      <span style={{ position: 'relative', top: -2 }}>{texto}</span>
      <PaSSMark size={11} conGesell />
    </button>
  );
}

// ¿El Pase ya cubre esta oferta? Sólo con Pase ACTIVO, y sólo cuando usarla no
// consume nada: una base es ilimitada y la estadía sin usar ya está paga.
//
// Una premium NO cuenta: ocupa uno de los pocos slots, así que comprarla suelta
// sigue siendo una decisión real y el botón tiene que estar.
function cubiertoPorPase(promo, { activo, estadia }) {
  if (!activo) return false;
  if (nivelEnPase(promo) === 'premium') return false;
  if (esOfertaEstadia(promo)) return !!estadia?.disponible;
  return true;
}

// ─── Pie: el CTA de compra arriba, el sello del Pase abajo ─────
//
// El PRECIO no está acá. Un número en la mini-ficha invita a comparar antes de
// saber qué se compra, y la ficha no tiene lugar para explicarlo; vive en el
// detalle ampliado, que es donde el turista ya está evaluando.
//
// El botón va PRIMERO: es la acción, y el sello es la nota al pie que explica
// la otra forma de conseguirlo. Leído en ese orden, el sello no interrumpe la
// decisión — la complementa.
//
// Y no aparece si el Pase ya cubre la oferta: al que pagó el Pase no se le
// vuelve a vender lo que ya es suyo.
function PrecioYAcciones({ promo, onOpen, hideActions = false, hideAgregar = false }) {
  const { addCupon } = useCarrito();
  const { activo, estadia } = usePasePropio();
  const [hover, setHover] = useState(false);

  if (hideActions) return <div style={{ padding: '15px 16px 17px' }} />;

  const cubierto = cubiertoPorPase(promo, { activo, estadia });
  const gratis   = promo.tokens_costo === 0;

  // Con el Pase corriendo y la oferta cubierta, no hay nada que comprar: lo que
  // sigue es usarla. El botón deja de agregar al carrito y lleva al detalle,
  // que es donde vive el canje —cámara, código manual, confirmación—. Meter
  // todo eso en la mini-ficha sería resolver en la vidriera algo que pasa
  // parado en el mostrador.
  const usar = cubierto;

  return (
    <div style={{ padding: '15px 16px 17px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <button
          type="button"
          onClick={e => { e.stopPropagation(); usar ? onOpen?.(promo, { detalle: true }) : addCupon(promo); }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            // 70% del ancho y centrado: el botón no tiene que empujar contra los
            // bordes de la ficha para pesar — el color ya lo hace, y el aire a
            // los costados lo separa de la franja de ahorro de arriba.
            width: '70%', alignSelf: 'center',
            minHeight: 48, padding: '0 20px', border: 'none',
            // Totalmente redondeado: es la única pieza de la ficha con forma de
            // botón, así que no necesita competir por atención con un radio.
            borderRadius: 999,
            background: hover ? A.primaryDark : A.primary, color: '#fff',
            fontFamily: A.font, fontSize: 15, fontWeight: 800, cursor: 'pointer',
            transition: 'background .15s',
          }}
        >
          {usar ? 'Canjear ahora' : gratis ? 'Lo quiero, es gratis' : 'Quiero el cupón'}
        </button>

      {!hideAgregar && <SelloPase />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
export default function OfertaCard({ promo, onOpen, onClick, variant = 'grid', inMarketplace = false, reviewSlot = null, fixedHeight = null, hideActions = false, hideAgregar = false, hideHeart = false }) {
  const abrir = onOpen || onClick;

  if (variant === 'list') {
    return (
      <div
        onClick={() => abrir && abrir(promo)}
        style={{ background: '#fff', border: `1px solid ${A.line}`, borderRadius: 20, overflow: 'hidden', display: 'flex', cursor: 'pointer', transition: 'box-shadow 0.2s', fontFamily: A.font }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 32px -12px rgba(11,16,32,0.18)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
      >
        <div style={{ position: 'relative', width: 200, flexShrink: 0 }}>
          <ImagenConBadge promo={promo} imgHeight="100%" inMarketplace={inMarketplace} hideHeart={hideHeart} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <ProveedorHeader promo={promo} size={38} />
          {reviewSlot}
          <FranjaAhorro ahorroEstimado={promo.ahorroEstimado} legend={ahorroLegend(promo)}
            accion={<VerOfertaLink promo={promo} onOpen={abrir} />} />
          <StockStrip tieneStock={promo.tieneStock} stockRestante={promo.stockRestante} />
          <PrecioYAcciones promo={promo} onOpen={abrir} hideAgregar={hideAgregar} />
        </div>
      </div>
    );
  }

  const card = (
    <div
      onClick={() => abrir && abrir(promo)}
      style={{ background: '#fff', border: inMarketplace ? 'none' : `1px solid ${A.line}`, borderRadius: inMarketplace ? 19 : 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s', fontFamily: A.font, ...(fixedHeight ? { height: fixedHeight } : { flex: 1 }) }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 16px 48px -16px rgba(11,16,32,0.18)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
      <ProveedorHeader promo={promo} />
      <ImagenConBadge promo={promo} inMarketplace={inMarketplace} hideHeart={hideHeart} grow={!fixedHeight} />
      <StockStrip tieneStock={promo.tieneStock} stockRestante={promo.stockRestante} />
      {/* Con alto fijo, la reseña se expande y empuja franja+precio al fondo */}
      {fixedHeight
        ? <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>{reviewSlot}</div>
        : reviewSlot}
      <FranjaAhorro ahorroEstimado={promo.ahorroEstimado} legend={ahorroLegend(promo)}
        accion={hideActions ? null : <VerOfertaLink promo={promo} onOpen={abrir} />} />
      <PrecioYAcciones promo={promo} onOpen={abrir} hideActions={hideActions} hideAgregar={hideAgregar} />
    </div>
  );

  if (inMarketplace) {
    return (
      <div style={{ background: 'linear-gradient(to bottom, #d2e9f3, #2d44dd)', borderRadius: 21, padding: 2, display: 'flex' }}>
        {card}
      </div>
    );
  }
  return card;
}
