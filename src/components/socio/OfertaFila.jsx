// ============================================================
//  src/components/socio/OfertaFila.jsx
//  Una fila del acordeón de ofertas del socio (estado colapsado).
//
//  Reemplaza a las tabs por badge (`2x1`, `-20%`), que producían labels
//  duplicados cuando el socio tenía dos ofertas del mismo porcentaje, mezclaban
//  tipo de beneficio con magnitud en el mismo control, y truncaban el título.
//
//  El thumb NO es opcional: una fila solo-texto se lee como nota al pie y no
//  como ítem de una lista elegible.
//
//  Toda la fila es el área clickeable. La flecha es INDICADOR de estado, no un
//  control aparte — por eso no lleva onClick propio ni es focuseable.
//
//  Era un radio azul (2026-08-13): mentía sobre el control. Un radio promete
//  que siempre va a quedar una elegida, y acá la fila abierta se vuelve a tocar
//  para cerrarla y dejar todo plegado. La flecha dice lo que el control hace de
//  verdad —desplegar y plegar— y en gris no compite con el badge ni con los
//  botones del panel.
// ============================================================
import { ChevronDown } from 'lucide-react';

const A = {
  ink: '#0B1020', ink2: '#3D4255', muted: '#6B7280',
  line: '#E7E9EE', primary: '#475BE1',
  // Fondo de la fila abierta. Era #F7F8FC, un gris con una pizca de azul que
  // se leía como "deshabilitada" y no como "es esta". rgb(237 241 255) es el
  // primary bien diluido: tiñe, no apaga.
  activa: 'rgb(237 241 255)',
  font: "'Inter', system-ui, sans-serif",
};

// El alto de la fila, explícito y exportado: la cabecera del panel tiene que
// medir lo mismo, y con las dos alturas emergiendo de su propio padding
// bastaba con tocar un cuerpo de letra acá para que dejaran de coincidir sin
// que nadie se enterara. Es `minHeight`, no `height`: un título que envuelva
// tiene que poder crecer.
export const ALTO_FILA = 95;

// El subtítulo dice el reloj del flash, y si no hay, lo que traiga la oferta.
//
// El ahorro NO va acá (2026-08-13): en la fila colapsada era el único número a
// la vista y competía con el badge por la lectura. Ahora aparece al expandir,
// al lado del precio y de los botones, que es donde el turista lo necesita
// para decidir. Lo pinta PanelOfertasSocio.
function subtitulo(promo) {
  if (promo.offerType === 'Flash' && promo.fechaFinFlash) {
    const ms = new Date(promo.fechaFinFlash).getTime() - Date.now();
    if (ms > 0) {
      const hs = Math.floor(ms / 3600000);
      return hs >= 24 ? `Termina en ${Math.floor(hs / 24)} días` : `Termina en ${Math.max(1, hs)} h`;
    }
  }
  return promo.subtitle || '';
}

export default function OfertaFila({ promo, activa, onClick, filaRef }) {
  return (
    <button
      ref={filaRef}
      type="button"
      onClick={onClick}
      aria-expanded={activa}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%',
        minHeight: ALTO_FILA,
        padding: '16px 14px', border: 'none', background: activa ? A.activa : 'none',
        cursor: 'pointer', textAlign: 'left', fontFamily: A.font,
      }}
    >
      {/* 110×62 es 16:9 — el mismo asset y el mismo crop que el hero y la
          minificha. Una segunda proporción obligaría a un segundo recorte en
          el uploader del socio.

          El badge NO va encima: a 110px de ancho, sobre una foto cualquiera,
          no se lee. Va arriba del título, donde tiene contraste garantizado. */}
      <div style={{
        width: 110, height: 62, borderRadius: 8,
        overflow: 'hidden', flexShrink: 0, background: '#1a2a35',
      }}>
        {promo.image && (
          <img src={promo.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        )}
      </div>

      {/* Los tres renglones son UNA tipografía en tres pesos, no tres
          tipografías (2026-08-13). Antes eran 15/800 con tracking -0.03em,
          14/500 y 12/400: tres tamaños, tres pesos y un tracking apretado que
          sólo tenía el badge, así que dentro de una fila de 90px convivían tres
          estilos que no se parecían en nada. Ahora hay DOS tamaños —el título
          manda con 14.5 y los dos renglones de apoyo comparten 12.5— y los
          pesos bajan de a un escalón (700 → 600 → 500). La jerarquía la sigue
          marcando el color: primary arriba, ink en el medio, muted abajo. */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {promo.badge && (
          <div style={{
            fontSize: 12.5, fontWeight: 700, color: A.primary, lineHeight: 1.4,
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{promo.badge}</div>
        )}
        <div style={{
          fontSize: 14.5, fontWeight: 600, color: A.ink, lineHeight: 1.4,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{promo.title || promo.titulo}</div>
        {/* Sin subtítulo la fila no deja el hueco: un dato que falta se muestra
            vacío, no con una línea de aire reservada (CLAUDE.md).
            Interlínea doble: la aclaración es el renglón que se lee al final y
            de costado, y el aire de arriba y abajo la despega del título. Ya no
            lleva marginTop — el medio interlineado de más lo aporta la propia
            línea, y sumarle margen encima la volvía a pegar al borde de abajo. */}
        {subtitulo(promo) && (
          <div style={{ fontSize: 12.5, fontWeight: 500, color: A.muted, lineHeight: 2 }}>
            {subtitulo(promo)}
          </div>
        )}
      </div>

      {/* Una sola flecha que rota, y no ChevronDown/ChevronUp intercambiados:
          el giro es continuo y acompaña al panel que se está desplegando, en
          vez de saltar de un glifo al otro a mitad de la animación. */}
      <ChevronDown
        aria-hidden="true"
        size={18}
        color={A.muted}
        style={{
          flexShrink: 0, transition: 'transform .2s',
          transform: activa ? 'rotate(180deg)' : 'none',
        }}
      />
    </button>
  );
}
