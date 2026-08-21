// ============================================================
//  src/components/pase/ResumenPase.jsx
//  Panel de resumen del checkout — extraído de CheckoutPaseView (brief
//  checkout 2026-08-18, §A/§B/§C). Es la ÚNICA pieza del checkout que se
//  lee como superficie de producto: sticky en desktop, barra fija abajo
//  en mobile. Acá vive el precio, el CTA de pago y el ahorro — antes
//  estaban al final de un scroll de 720px y desaparecían justo cuando el
//  turista los necesitaba para decidir.
// ============================================================
import { CreditCard, Loader2, MapPin } from 'lucide-react';
import SelectorRegion from '../SelectorRegion';
import PaSSMark from '../PaSSMark';
import InfoTooltip from '../InfoTooltip';
import { Incluye } from './SelectorDuracion';
import { C, fmt } from './checkoutTokens';

// "Villa Gesell, Mar de las Pampas y Mar Azul" — el join con "y" antes del
// último es el que hace que la lista se lea como frase y no como un dump.
function listaConY(items) {
  if (items.length <= 1) return items[0] || '';
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}

const TEXTO_TOOLTIP_ACTIVACION =
  'Si tu primer canje es una oferta que necesita fecha confirmada (alojamiento, una excursión, un masaje), el pase arranca en la fecha que el comercio confirme.';

export default function ResumenPase({
  region, ciudades,
  pase, dias, precio, nombre, esCustom, incluidas, ahorroEstimado,
  error, pagando, onPagar, ctaLabel = null,
}) {
  const deshabilitado = pagando || !pase;
  const precioSinIva = esCustom ? null : pase?.precio_sin_iva;

  return (
    <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 20, padding: '22px 22px 24px' }}>
      {/* Región + ciudades — display, no selector (§A). El link de cambiar es
          el mismo SelectorRegion del header: un solo componente, un solo
          estado, nada de una segunda fuente de verdad geográfica. */}
      {region && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: C.ink2 }}>Cupon PASS ·</span>
            <SelectorRegion condensed />
          </div>
          {ciudades?.length > 0 && (
            <p style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: C.muted, lineHeight: 1.5, margin: '8px 0 0' }}>
              <MapPin size={13} style={{ flexShrink: 0, marginTop: 2 }} />
              Válido en {listaConY(ciudades.map(c => c.nombre))}.
            </p>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <PaSSMark size={14} conPrefijo />
        {dias > 0 && <span style={{ fontSize: 14, fontWeight: 800, color: C.ink2 }}>x {dias} días</span>}
      </div>

      {pase && (
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          {/* El precio (abajo, 24px) es el número que manda acá: es lo único
              que se cobra de verdad. El ahorro premium (2026-08-18: sólo la
              capa premium, ver ahorroEstimadoPase — antes sumaba también la
              capa base de uso ilimitado y daba cifras de siete números) va
              chico y como texto corrido, no como una segunda cifra hero
              compitiéndole al precio. */}
          {ahorroEstimado > 0 && (
            <div style={{ fontSize: 12.5, color: C.ink2, marginBottom: 4 }}>
              Hasta <b style={{ color: C.primary }}>{fmt(ahorroEstimado)}</b> en tus elecciones premium
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Incluye incluidas={incluidas} dias={dias} ahorro={0} />
          </div>
        </div>
      )}

      <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ fontSize: 13.5, color: C.ink2, fontWeight: 600 }}>{nombre}</span>
          <span style={{ fontSize: 24, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em' }}>
            {pase ? fmt(precio) : '—'}
          </span>
        </div>
        {precioSinIva != null && (
          <div style={{ fontSize: 11.5, color: C.muted, textAlign: 'right', marginTop: 2 }}>
            Precio sin impuestos: {fmt(precioSinIva)}
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: '#FDECEC', color: '#B42318', fontSize: 13, padding: '10px 13px', borderRadius: 10, marginBottom: 14 }}>
          {error}
        </div>
      )}

      <button
        onClick={onPagar}
        disabled={deshabilitado}
        style={{
          width: '100%', padding: '16px', borderRadius: 14, border: 'none',
          background: deshabilitado ? C.line : C.primary,
          color: deshabilitado ? C.muted : '#fff',
          fontSize: 16, fontWeight: 800, cursor: deshabilitado ? 'not-allowed' : 'pointer',
          fontFamily: C.font, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
          transition: 'background .15s',
        }}
        onMouseEnter={e => { if (!deshabilitado) e.currentTarget.style.background = C.primaryDark; }}
        onMouseLeave={e => { if (!deshabilitado) e.currentTarget.style.background = C.primary; }}
      >
        {pagando
          ? <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Procesando…</>
          : ctaLabel
            ? <>{ctaLabel} →</>
            : <><CreditCard size={17} /> Pagar {pase ? fmt(precio) : ''}</>}
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Línea de activación (§B) — reemplaza al bloque "¿Cómo funciona?" que
          se sacó del checkout. El caso de la fecha acordada con un socio es
          una regla de sistema, no un argumento de venta: va en el tooltip,
          no en la línea. */}
      <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, textAlign: 'center', margin: '14px 0 0' }}>
        Comprá cuando quieras: tus días empiezan a correr con tu primer descuento, no con la compra.
        <InfoTooltip text={TEXTO_TOOLTIP_ACTIVACION} />
      </p>

      <p style={{ fontSize: 11.5, color: C.muted, textAlign: 'center', margin: '10px 0 0' }}>
        Pago único · sin suscripción · sin renovación automática
      </p>
    </div>
  );
}
