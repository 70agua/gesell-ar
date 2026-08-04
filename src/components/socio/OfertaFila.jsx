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
//  Toda la fila es el área clickeable. El radio es INDICADOR de estado, no un
//  control aparte — por eso no lleva onClick propio ni es focuseable.
// ============================================================
import { esCuponDeEntrada, gananciaNeta } from '../../lib/cobros';

const A = {
  ink: '#0B1020', ink2: '#3D4255', muted: '#6B7280',
  line: '#E7E9EE', primary: '#475BE1',
  font: "'Inter', system-ui, sans-serif",
};

const fmt = n => `$${Math.round(Number(n) || 0).toLocaleString('es-AR')}`;

// El subtítulo dice ahorro, salvo que sea flash y todavía tenga reloj.
//
// En los cupones de entrada (ahorro < $10.000) se muestra la GANANCIA NETA y
// no el ahorro bruto — mismo criterio que la minificha: con ratio 2x, "ahorrás
// $5.000" al lado de "pagás $2.500" invita a hacer la resta.
function subtitulo(promo) {
  if (promo.offerType === 'Flash' && promo.fechaFinFlash) {
    const ms = new Date(promo.fechaFinFlash).getTime() - Date.now();
    if (ms > 0) {
      const hs = Math.floor(ms / 3600000);
      return hs >= 24 ? `Termina en ${Math.floor(hs / 24)} días` : `Termina en ${Math.max(1, hs)} h`;
    }
  }
  const ahorro = promo.ahorroEstimado || 0;
  if (ahorro <= 0) return promo.subtitle || '';
  const monto = esCuponDeEntrada(ahorro) ? gananciaNeta(ahorro) : ahorro;
  return `Ahorrás ${fmt(monto)} aprox.`;
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
        padding: '10px 14px', border: 'none', background: activa ? '#F7F8FC' : 'none',
        cursor: 'pointer', textAlign: 'left', fontFamily: A.font,
      }}
    >
      {/* 88×50 es 16:9 — el mismo asset y el mismo crop que el hero y la
          minificha. Una segunda proporción obligaría a un segundo recorte en
          el uploader del socio.

          El badge NO va encima: a 88px de ancho, sobre una foto cualquiera, no
          se lee. Va arriba del título, donde tiene contraste garantizado. */}
      <div style={{
        width: 88, height: 50, borderRadius: 6,
        overflow: 'hidden', flexShrink: 0, background: '#1a2a35',
      }}>
        {promo.image && (
          <img src={promo.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {promo.badge && (
          <div style={{
            fontSize: 15, fontWeight: 900, color: A.ink, lineHeight: 1.15,
            letterSpacing: '-0.03em', marginBottom: 1,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{promo.badge}</div>
        )}
        <div style={{
          fontSize: 14, fontWeight: 500, color: A.ink, lineHeight: 1.3,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{promo.title || promo.titulo}</div>
        <div style={{ fontSize: 12, color: A.muted, marginTop: 2, lineHeight: 1.3 }}>
          {subtitulo(promo)}
        </div>
      </div>

      <span aria-hidden="true" style={{
        flexShrink: 0, width: 18, height: 18, borderRadius: '50%',
        border: `2px solid ${activa ? A.primary : A.line}`,
        display: 'grid', placeItems: 'center', transition: 'border-color .15s',
      }}>
        {activa && <span style={{ width: 8, height: 8, borderRadius: '50%', background: A.primary }} />}
      </span>
    </button>
  );
}
