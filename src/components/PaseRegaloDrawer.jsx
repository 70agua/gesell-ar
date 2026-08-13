// ============================================================
//  src/components/PaseRegaloDrawer.jsx
//  El drawer GIFT PaSS, abierto desde cualquier pantalla.
//
//  Es el mismo panel que el hero abre con el ícono del regalito, pero suelto:
//  el del hero vive adentro de HeroPase porque participa de su choreografía
//  (al elegir una opción el drawer se desliza afuera y entra el paso 2 con la
//  lluvia de cupones). Fuera de la home no hay paso 2 al que ir, así que cada
//  opción navega a su vista y listo.
//
//  Lo que NO se duplica es el contenido: las dos tarjetas salen de
//  hero/destinosRegalo.js y el interior del panel usa las clases de
//  hero-coupons.css, que se importan acá para que existan en pantallas donde
//  HeroPase no está montado.
//
//  Qué hace cada puerta desde afuera del hero:
//   · persona → checkout del Pase (lo mismo que el hero, que también navega)
//   · empresa → CheckoutHoteleroView como VISTA, no embebida: embeberla es lo
//     que hace el hero adentro de su propio slide, y acá ese slide no existe.
// ============================================================
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRight } from 'lucide-react';
import PaSSMark from './PaSSMark';
import { DESTINOS } from './hero/destinosRegalo';
import './hero/hero-coupons.css';
import './pase-regalo-drawer.css';

// El dorado del moño de giftpass-logo.svg: el lockup del panel es GIft PaSS,
// no el CUPON PaSS azul.
const DORADO_GIFT = '#FFB94A';

export default function PaseRegaloDrawer({ abierto, onCerrar, onElegir }) {
  // Escape cierra, como en cualquier capa modal de la app. El listener sólo
  // vive mientras el drawer está abierto: si no, cada ficha de socio dejaría
  // un handler global escuchando de gratis.
  useEffect(() => {
    if (!abierto) return;
    const alTeclear = e => { if (e.key === 'Escape') onCerrar?.(); };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [abierto, onCerrar]);

  // Portal al body y no en su lugar del árbol: el drawer es fixed a pantalla
  // completa, y adentro de la columna del panel de ofertas —que tiene
  // overflow y stacking propios— quedaría recortado o por debajo del hero.
  return createPortal(
    <>
      <div
        className={`prd-scrim${abierto ? ' prd-scrim--visible' : ''}`}
        aria-hidden="true"
        onClick={onCerrar}
      />
      <div
        className={`prd-drawer${abierto ? ' prd-drawer--abierto' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Regalar un Pase"
        // Cerrado sigue montado (para poder animar el slide), así que hay que
        // decirle al lector de pantalla que ahí no hay nada que leer.
        aria-hidden={!abierto}
      >
        <div className="gp-panel">
          <button type="button" className="prd-cerrar" onClick={onCerrar} aria-label="Cerrar">
            <X size={18} strokeWidth={2.5} />
          </button>

          <div className="gp-cabezal">
            <h2 className="gp-titulo">
              <PaSSMark size={26} conGesell prefijo="GIft" color={DORADO_GIFT} />
            </h2>
            <p className="gp-bajada">
              Obsequiá pases con todos los descuentos de la red.
            </p>
          </div>

          <p className="gp-elegi">Elegí una opción:</p>
          <div className="gp-opciones">
            {DESTINOS.map(d => (
              <button
                key={d.id}
                type="button"
                className="gp-opcion"
                onClick={() => onElegir?.(d.id)}
              >
                <img className="gp-opcion-icono" src={d.icono} alt="" aria-hidden="true" />
                <span className="gp-opcion-texto">
                  <span className="gp-opcion-fila">
                    <span className="gp-opcion-titulo">{d.titulo}</span>
                    {d.tag && (
                      <span className="gp-opcion-tag" style={{ background: d.tagColor }}>{d.tag}</span>
                    )}
                  </span>
                  {d.quien && <span className="gp-opcion-quien">{d.quien}</span>}
                  <span className="gp-opcion-detalle">{d.detalle}</span>
                </span>
                {/* La flecha es lo que dice que la tarjeta ES el botón. Sin
                    ella, dos recuadros apilados con borde se leen como campos
                    a marcar, que es justo lo que dejaron de ser. */}
                <span className="gp-opcion-flecha" aria-hidden="true">
                  <ArrowRight size={20} strokeWidth={2.5} />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
