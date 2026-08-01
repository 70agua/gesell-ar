// ============================================================
//  src/components/CtaPase.jsx
//  El CTA de una oferta, contado desde el pase. Reemplaza al viejo
//  "Agregar a cuponera", que no distinguía nada. Hoy el destino es el carrito.
//
//  Cinco situaciones, según la regla de lib/pases.js (nivelEnPase) y el pase
//  del que mira (useMiPase):
//
//    SIN PASE   · incluida → "con el PaSS esto venía incluido"
//               · premium  → "con el PaSS lo elegís, o sale la mitad"
//    CON PASE   · incluida → ya lo tenés, sumalo sin costo
//               · premium con elecciones → usás una de las N que te quedan
//               · premium sin elecciones → lo sumás a mitad de precio
//
//  El botón siempre hace algo: sumar el cupón al carrito (onSumar) o
//  gastar una elección premium (onElegir). El upsell nunca bloquea.
// ============================================================

import PaSSMark from './PaSSMark';
import { nivelEnPase, precioSueltoConPase } from '../lib/pases';

const C = {
  primary:     '#2545E6',
  primaryDark: '#1731B8',
  primarySoft: '#EEF1FF',
  ink:         '#0B1020',
  ink2:        '#3D4255',
  muted:       '#6B7280',
  green:       '#10A36B',
  font:        "'Inter', system-ui, sans-serif",
};

const fmt = n => `$${Math.round(Number(n) || 0).toLocaleString('es-AR')}`;

// Un renglón de contexto arriba del botón: es el lugar del upsell.
function Nota({ children, tono = 'info' }) {
  const fondo = tono === 'ok' ? '#EDFAF4' : C.primarySoft;
  const color = tono === 'ok' ? C.green : C.ink2;
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, background: fondo, color, borderRadius: 12, padding: '10px 13px', fontSize: 12.5, lineHeight: 1.45, fontFamily: C.font, marginBottom: 10 }}>
      {children}
    </div>
  );
}

export default function CtaPase({
  promo, precioLista, miPase,
  onSumar, onElegir, onComprarPase, onActivarPase,
  compacto = false, sumado = false,
}) {
  const premium   = nivelEnPase(promo) === 'premium';
  const conPase   = !!miPase?.pase;
  // Comprado pero todavía sin activar: no se puede canjear, pero tampoco hay
  // que ofrecerle comprar el pase que ya tiene.
  const pendiente = !!miPase?.pendiente;
  const restantes = miPase?.restantes || 0;
  const mitad     = precioSueltoConPase(precioLista);

  const alto  = compacto ? '11px 0' : '13px 0';
  const cuerpo = compacto ? 14 : 15;

  const boton = (label, { accion, tono = 'primary' } = {}) => (
    <button
      onClick={accion}
      style={{
        width: '100%', padding: alto, borderRadius: 12, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        fontSize: cuerpo, fontWeight: 700, fontFamily: C.font,
        background: tono === 'ok' ? C.green : C.primary, color: '#fff',
        transition: 'background .15s',
      }}
      onMouseEnter={e => { if (tono !== 'ok') e.currentTarget.style.background = C.primaryDark; }}
      onMouseLeave={e => { if (tono !== 'ok') e.currentTarget.style.background = C.primary; }}
    >
      {label}
    </button>
  );

  if (sumado) return boton('Ya está en tu carrito', { accion: undefined, tono: 'ok' });

  // ─── Sin pase: acá vive el upsell ───────────────────────────
  if (!conPase) {
    return (
      <>
        <Nota>
          {premium ? (
            <span>
              De los grandes: con tu <PaSSMark size={11} conGesell /> lo elegís sin costo
              {mitad > 0 && <> — o lo sumás por <b>{fmt(mitad)}</b> en vez de {fmt(precioLista)}</>}.
            </span>
          ) : (
            <span>
              Con tu <PaSSMark size={11} conGesell /> este cupón ya venía incluido.
            </span>
          )}
        </Nota>
        {boton(precioLista > 0 ? `Sumarlo por ${fmt(precioLista)}` : 'Sumarlo a mi carrito', { accion: onSumar })}
        <button
          onClick={onComprarPase}
          style={{ width: '100%', marginTop: 8, background: 'none', border: 'none', color: C.primary, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: C.font, padding: '4px 0' }}
        >
          Ver el Gesell PaSS →
        </button>
      </>
    );
  }

  // ─── Pase comprado y sin activar ────────────────────────────
  if (pendiente) {
    return (
      <>
        <Nota tono="ok">
          <span>Ya tenés el Pase. Activalo cuando llegues y este cupón entra sin costo.</span>
        </Nota>
        {boton('Activar mi Pase', { accion: onActivarPase, tono: 'ok' })}
        <button
          onClick={onSumar}
          style={{ width: '100%', marginTop: 8, background: 'none', border: 'none', color: C.muted, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: C.font, padding: '4px 0' }}
        >
          Comprarlo suelto igual
        </button>
      </>
    );
  }

  // ─── Con pase, oferta incluida ──────────────────────────────
  if (!premium) {
    return (
      <>
        <Nota tono="ok">
          <span>Incluido en tu pase: no gastás ninguna elección.</span>
        </Nota>
        {boton('Sumarlo a mi carrito', { accion: onSumar })}
      </>
    );
  }

  // ─── Con pase, premium con elecciones disponibles ───────────
  if (restantes > 0) {
    return (
      <>
        <Nota>
          <span>
            Este es de los grandes. Te {restantes === 1 ? 'queda' : 'quedan'} <b>{restantes}</b>{' '}
            {restantes === 1 ? 'elección' : 'elecciones'} de {miPase.total}.
          </span>
        </Nota>
        {boton('Usar una de mis elecciones', { accion: onElegir })}
        <button
          onClick={onSumar}
          style={{ width: '100%', marginTop: 8, background: 'none', border: 'none', color: C.muted, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: C.font, padding: '4px 0' }}
        >
          Guardar mis elecciones y pagarlo {fmt(mitad)}
        </button>
      </>
    );
  }

  // ─── Con pase, premium sin elecciones ───────────────────────
  return (
    <>
      <Nota>
        <span>Ya usaste tus {miPase.total} elecciones. Este lo sumás a mitad de precio.</span>
      </Nota>
      {boton(`Sumarlo por ${fmt(mitad)}`, { accion: onSumar })}
      <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: C.muted, fontFamily: C.font }}>
        Precio sin pase: {fmt(precioLista)}
      </div>
    </>
  );
}
