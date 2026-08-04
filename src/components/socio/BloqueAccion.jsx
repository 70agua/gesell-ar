// ============================================================
//  src/components/socio/BloqueAccion.jsx
//  El CTA del panel de ofertas del socio. Depende del estado del USUARIO
//  respecto de ESTA oferta, nunca de la posición en la lista.
//
//  El doc describe tres estados (A sin nada / B con cupón / C con Pase), pero
//  entre B y C faltan dos que no son opcionales:
//
//    · premium sin elegir → el Pase NO la cubre todavía. Hay que gastar una
//      elección primero. Saltear este paso mostraría "Canjear ahora" sobre algo
//      que la RPC `canjear_beneficio` va a rechazar, porque mira
//      `pase_elecciones`.
//    · pase dormido → activar arranca la vigencia y no tiene vuelta atrás.
//
//  ⚠️ El pase dormido NO ofrece "activar y canjear" en un solo tap. Si el
//  turista lo toca el día que compró para curiosear el catálogo, quema días sin
//  canjear nada — el peor primer contacto posible con el producto. Botón
//  "Activar mi Pase" + confirmación obligatoria. Vale igual para el pase de
//  regalo del hotel: la vigencia corre desde la activación, no desde que el
//  hotel lo mandó.
//
//  Jerarquía de A deliberada (doc §4): el Pase es el producto hero y el cupón
//  suelto es la puerta de entrada, no al revés.
// ============================================================
import { useEffect, useState } from 'react';
import PaSSMark from '../PaSSMark';
import { usePasePropio } from '../../lib/pasePropio';
import { activarPaseAhora, elegirPremium, nivelEnPase, precioSueltoConPase } from '../../lib/pases';
import { cuponPropioDe } from '../../lib/compras';

const A = {
  ink: '#0B1020', ink2: '#3D4255', muted: '#6B7280',
  line: '#E7E9EE', primary: '#2545E6', primaryDark: '#1731B8',
  green: '#10A36B', font: "'Inter', system-ui, sans-serif",
};

const fmt = n => `$${Math.round(Number(n) || 0).toLocaleString('es-AR')}`;

function Primario({ children, onClick, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{
      width: '100%', padding: '13px 16px', borderRadius: 12, border: 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      background: A.primary, color: '#fff', fontFamily: A.font,
      fontSize: 15, fontWeight: 700, cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.6 : 1, transition: 'background .15s',
    }}>{children}</button>
  );
}

function Secundario({ children, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      width: '100%', marginTop: 8, padding: '10px 16px', borderRadius: 12,
      border: `1px solid ${A.line}`, background: '#fff', color: A.ink,
      fontFamily: A.font, fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
    }}>{children}</button>
  );
}

function Nota({ children, tono = 'info' }) {
  return (
    <p style={{
      margin: '0 0 10px', fontFamily: A.font, fontSize: 13, lineHeight: 1.5,
      color: tono === 'ok' ? A.green : A.ink2,
    }}>{children}</p>
  );
}

// ─── Confirmación de activación ───────────────────────────────
// No es un "¿estás seguro?" de trámite: es el único momento en que se puede
// avisar que el reloj arranca. Por eso dice la cantidad real de días.
function ConfirmarActivacion({ dias, ocupado, onCancelar, onConfirmar }) {
  return (
    <div onClick={onCancelar} style={{
      position: 'fixed', inset: 0, zIndex: 9400, background: 'rgba(5,10,25,0.6)',
      display: 'grid', placeItems: 'center', padding: 24,
    }}>
      <div onClick={e => e.stopPropagation()} role="alertdialog" aria-modal="true" style={{
        width: '100%', maxWidth: 380, background: '#fff', borderRadius: 20,
        padding: '24px 22px 20px', fontFamily: A.font,
        boxShadow: '0 30px 70px -20px rgba(5,10,25,0.6)',
      }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: A.ink, letterSpacing: '-0.02em', marginBottom: 10 }}>
          ¿Activamos tu Pase?
        </div>
        <p style={{ fontSize: 14.5, color: A.ink2, lineHeight: 1.55, margin: '0 0 20px' }}>
          Al activarlo arrancan tus <b style={{ color: A.ink }}>{dias} días</b>. Activalo cuando llegues a Gesell.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancelar} disabled={ocupado} style={{
            flex: 1, padding: '13px 16px', borderRadius: 12, border: `1px solid ${A.line}`,
            background: '#fff', color: A.ink2, fontFamily: A.font, fontSize: 14.5, fontWeight: 700, cursor: 'pointer',
          }}>Todavía no</button>
          <button onClick={onConfirmar} disabled={ocupado} style={{
            flex: 1, padding: '13px 16px', borderRadius: 12, border: 'none',
            background: A.primary, color: '#fff', fontFamily: A.font, fontSize: 14.5, fontWeight: 800,
            cursor: ocupado ? 'default' : 'pointer', opacity: ocupado ? 0.6 : 1,
          }}>{ocupado ? 'Activando…' : 'Activar ahora'}</button>
        </div>
      </div>
    </div>
  );
}

export default function BloqueAccion({
  promo, session, precio,
  onComprarPase, onSumarCupon, onCanjear, onCoordinarFecha,
}) {
  const { pase, activo, pendiente, libres, total, elegidasIds, premiumIlimitado, refrescar } = usePasePropio();

  const [cuponPropio, setCuponPropio] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [ocupado, setOcupado]         = useState(false);
  const [aviso, setAviso]             = useState('');

  // Al cambiar de oferta hay que olvidar el cupón de la anterior AHORA, no
  // después del efecto: si no, entre el cambio y el fetch se pinta un render
  // que le dice "ya es tuyo" sobre una oferta que no compró.
  const [promoPrev, setPromoPrev] = useState(promo?.id);
  if (promoPrev !== promo?.id) { setPromoPrev(promo?.id); setCuponPropio(null); setAviso(''); }

  // ¿Ya compró un cupón de ESTA oferta y sigue sin canjear? Es lo que separa el
  // estado A del B. Se pregunta por oferta, y por eso vive en el panel
  // expandido y no en cada fila colapsada.
  useEffect(() => {
    let vivo = true;
    if (!session?.user?.id || !promo?.id) return;
    cuponPropioDe(promo.id).then(c => { if (vivo) setCuponPropio(c); });
    return () => { vivo = false; };
  }, [session?.user?.id, promo?.id]);

  const premium    = nivelEnPase(promo) === 'premium';
  const conPase    = !!pase;
  const yaElegida  = premium && elegidasIds.includes(promo.id);
  const pideFecha  = !!(promo.requiereFecha || promo.requiereReserva);
  const cubierta   = !premium || yaElegida;
  const mitad      = precioSueltoConPase(precio);

  const activar = async () => {
    if (!pase || ocupado) return;
    setOcupado(true); setAviso('');
    const r = await activarPaseAhora(pase.id);
    setOcupado(false); setConfirmando(false);
    if (!r?.ok) { setAviso('No pudimos activar tu Pase. Probá de nuevo.'); return; }
    // Recién ahora el bloque pasa al estado C.
    refrescar();
  };

  const elegir = async () => {
    if (!pase || ocupado) return;
    setOcupado(true); setAviso('');
    const r = await elegirPremium(pase.id, promo.id);
    setOcupado(false);
    if (!r?.ok) {
      setAviso(r?.error === 'max_elecciones'
        ? 'Ya usaste todas tus elecciones PREMIUM.'
        : 'No se pudo elegir. Probá de nuevo.');
      return;
    }
    refrescar();
  };

  const error = aviso && (
    <div style={{ marginTop: 8, fontSize: 12.5, color: '#B91C1C', fontFamily: A.font, textAlign: 'center' }}>{aviso}</div>
  );

  const botonCanjear = (
    <Primario onClick={onCanjear}>
      <img src="/iconos/qr-code.svg" alt="" width={19} height={19}
           style={{ display: 'block', flexShrink: 0, filter: 'brightness(0) invert(1)' }} />
      Canjear ahora
    </Primario>
  );

  // ─── B · ya lo compró suelto ────────────────────────────────
  // Va primero, antes que cualquier rama del Pase: un cupón pago es del turista
  // pase lo que pase. Mostrarle otra cosa sería venderle lo que ya tiene.
  if (cuponPropio) {
    return (
      <div>
        <Nota tono="ok">Ya es tuyo. Mostrá el QR del comercio para canjearlo.</Nota>
        {botonCanjear}
        <div style={{ marginTop: 8, fontSize: 12, color: A.muted, textAlign: 'center', fontFamily: A.font }}>
          Tu código: <b style={{ color: A.ink, letterSpacing: '0.08em' }}>{cuponPropio.codigo}</b>
        </div>
        {error}
      </div>
    );
  }

  // ─── A · no tiene Pase ──────────────────────────────────────
  if (!conPase) {
    return (
      <div>
        <Primario onClick={() => onComprarPase?.(7)}>
          Adquirir el <PaSSMark size={13} conGesell />
        </Primario>
        <Secundario onClick={() => onSumarCupon?.(promo)}>
          Obtener descuento{precio > 0 ? ` · ${fmt(precio)}` : ''}
        </Secundario>
        {error}
      </div>
    );
  }

  // ─── Coordinar fecha ────────────────────────────────────────
  // NO exige activar el pase: coordinar con el pase dormido es justamente para
  // lo que se hizo la activación programada — acordar el día antes de viajar
  // sin quemar días esperando respuestas.
  //
  // ⚠️ Copy no negociable (Ley 18.829): nunca "reservá" ni "disponibilidad".
  // Cuponear TRANSMITE un pedido; confirma el comercio.
  if (pideFecha && onCoordinarFecha) {
    return (
      <div>
        <Nota>Elegí el día y el comercio te responde. La fecha la confirma él, no nosotros.</Nota>
        <Primario onClick={() => onCoordinarFecha(promo)}>Coordinar fecha</Primario>
        {error}
      </div>
    );
  }

  // ─── Premium que todavía no eligió ──────────────────────────
  // Con Pase de 10+ días el tope desaparece, pero la oferta sigue sin ser
  // "incluida": hay que ELEGIRLA igual, sólo que sin tope de cuántas.
  if (!cubierta) {
    if (premiumIlimitado || libres > 0) {
      return (
        <div>
          <Nota>
            {premiumIlimitado
              ? <>Tenés todo el catálogo PREMIUM disponible, sin tope.</>
              : <>Te {libres === 1 ? 'queda' : 'quedan'} <b style={{ color: A.ink }}>{libres}</b> {libres === 1 ? 'elección' : 'elecciones'} PREMIUM de {total}.</>}
          </Nota>
          <Primario onClick={elegir} disabled={ocupado}>
            {ocupado ? 'Eligiendo…' : 'Usar una de mis elecciones'}
          </Primario>
          {!premiumIlimitado && (
            <Secundario onClick={() => onSumarCupon?.(promo)}>
              Guardar mis elecciones y pagarlo {fmt(mitad)}
            </Secundario>
          )}
          {error}
        </div>
      );
    }
    return (
      <div>
        <Nota>Ya usaste tus {total} elecciones PREMIUM. Este lo sumás a mitad de precio.</Nota>
        <Primario onClick={() => onSumarCupon?.(promo)}>Sumarlo por {fmt(mitad)}</Primario>
        <div style={{ marginTop: 8, fontSize: 12, color: A.muted, textAlign: 'center', fontFamily: A.font }}>
          Precio sin Pase: {fmt(precio)}
        </div>
        {error}
      </div>
    );
  }

  // ─── Pase comprado y todavía dormido ────────────────────────
  if (pendiente) {
    const dias = pase.dias ?? pase.pases?.duracion_dias ?? 7;
    return (
      <div>
        <Nota>Ya tenés tu Pase. Activalo cuando estés en Gesell para empezar a canjear.</Nota>
        <Primario onClick={() => setConfirmando(true)}>Activar mi Pase</Primario>
        {error}
        {confirmando && (
          <ConfirmarActivacion
            dias={dias} ocupado={ocupado}
            onCancelar={() => setConfirmando(false)}
            onConfirmar={activar}
          />
        )}
      </div>
    );
  }

  // ─── C · el Pase la cubre y está corriendo ──────────────────
  // Sin precio a la vista en ningún lado: ya lo pagó con el Pase.
  return (
    <div>
      <Nota tono="ok">
        {yaElegida ? 'La elegiste con tu Pase. ' : 'Entra en tu Pase. '}
        Mostrá el QR del comercio para canjearla.
      </Nota>
      {activo ? botonCanjear : <Nota>Activá tu Pase para poder canjear.</Nota>}
      {error}
    </div>
  );
}
