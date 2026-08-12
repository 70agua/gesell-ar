// ============================================================
//  src/components/CaptchaAuto.jsx
//  Verificación anti-bot con forma de mini-juego (2026-08-11, a pedido, sólo
//  en CheckoutHoteleroView.jsx por ahora): en vez del pulsador genérico de
//  CaptchaDeslizar, acá lo que se arrastra es un auto, por una ruta punteada,
//  hasta la bandera del final — mismo gesto ("llegar al fondo"), pero con la
//  lectura de un rompecabezas de arrastre en vez de un slider de formulario.
//
//  Misma salvedad que CaptchaDeslizar: es fricción, no seguridad — cualquier
//  script que corra JS lo pasa. Sirve contra el bot tonto que postea
//  formularios y contra el alta accidental. Si alguna vez hace falta de
//  verdad, va un Turnstile del lado del server.
//
//  Mecánica de arrastre (pointer events, tolerancia de píxeles al soltar,
//  acceso por teclado) calcada de CaptchaDeslizar: mismo problema, sólo
//  cambia el disfraz. No se unificaron en un solo componente parametrizable
//  porque el layout interno (ruta punteada, bandera fija, ancho del auto) no
//  comparte casi nada con la pista lisa del pulsador — hubiera quedado un
//  componente con más ifs de layout que lógica.
// ============================================================
import { useRef, useState } from 'react';
import { Car, Check, Flag } from 'lucide-react';

const C = {
  primary:     '#475BE1',
  primarySoft: '#EEF0FD',
  ink2:        '#3D4255',
  muted:       '#6B7280',
  line:        '#E7E9EE',
  bg:          '#F7F7F8',
  font:        "'Inter', system-ui, sans-serif",
};

const ALTO   = 56;
const BORDE  = 5;             // aire entre el auto y la pista
const AUTO_W = ALTO - BORDE * 2;

export default function CaptchaAuto({
  verificado,
  onVerificar,
  texto       = 'Llevá el auto hasta la bandera',
  descripcion = 'Arrastrá el auto hasta la bandera del final de la ruta para confirmar que sos un humano',
  textoOk     = '¡Llegaste! Verificado',
}) {
  const pistaRef    = useRef(null);
  const arrastreRef = useRef(null);   // { inicioX, max } mientras dura el gesto
  const [x, setX] = useState(0);
  const [activo, setActivo] = useState(false);

  const topeDe = () => (pistaRef.current?.offsetWidth || 0) - AUTO_W - BORDE * 2;

  function empezar(e) {
    if (verificado) return;
    arrastreRef.current = { inicioX: e.clientX, max: topeDe() };
    setActivo(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function mover(e) {
    if (!activo || !arrastreRef.current) return;
    const { inicioX, max } = arrastreRef.current;
    setX(Math.max(0, Math.min(max, e.clientX - inicioX)));
  }

  function soltar(e) {
    if (!activo || !arrastreRef.current) return;
    const { max } = arrastreRef.current;
    setActivo(false);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    // Un par de píxeles de tolerancia: llegar al pixel exacto con el mouse es
    // innecesariamente exigente y el gesto ya quedó claro.
    if (x >= max - 3) { setX(max); onVerificar(true); }
    else setX(0);
  }

  // El teclado también lo resuelve: un captcha que deja afuera a quien no usa
  // mouse es una barrera de accesibilidad, y contra bots no cambia nada porque
  // igual pasan por JS.
  function teclado(e) {
    if (verificado) return;
    if (e.key === 'ArrowRight' || e.key === 'End' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setX(topeDe());
      onVerificar(true);
    }
  }

  const listo = !!verificado;

  return (
    <div
      ref={pistaRef}
      style={{
        position: 'relative', height: ALTO, borderRadius: 12, overflow: 'hidden',
        background: listo ? C.primarySoft : C.bg,
        border: `1px solid ${listo ? C.primary : C.line}`,
        userSelect: 'none', touchAction: 'none', transition: 'background .2s, border-color .2s',
      }}
    >
      {/* Ruta punteada: sugiere el trayecto, no sólo un slider genérico. Se
          recorta a lo que el auto todavía no anduvo, así el tramo ya hecho se
          ve "limpio" atrás suyo. */}
      <div aria-hidden="true"
        style={{
          position: 'absolute', left: BORDE + AUTO_W + 6, right: BORDE + 20, top: '50%',
          borderTop: `2px dashed ${listo ? C.primary : '#C7CCDA'}`,
          opacity: listo ? 0 : 1, transition: 'opacity .2s',
        }}
      />

      {/* Estela: acompaña al auto para que se vea el avance recorrido. */}
      <div aria-hidden="true"
        style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: listo ? '100%' : x + AUTO_W + BORDE,
          background: C.primarySoft,
          transition: activo ? 'none' : 'width .2s',
        }}
      />

      <span
        style={{
          position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
          fontSize: 12.5, fontWeight: 600, fontFamily: C.font,
          color: listo ? C.primary : C.muted,
          pointerEvents: 'none', whiteSpace: 'nowrap', paddingLeft: AUTO_W,
        }}
      >
        {listo ? textoOk : texto}
      </span>

      {/* Bandera de destino, fija al final de la pista. */}
      <span aria-hidden="true"
        style={{
          position: 'absolute', right: BORDE + 2, top: '50%', transform: 'translateY(-50%)',
          display: 'grid', placeItems: 'center', color: listo ? C.primary : C.ink2,
          opacity: listo ? 0 : 0.7, transition: 'opacity .2s',
        }}
      >
        <Flag size={18} strokeWidth={2.2} />
      </span>

      <button
        type="button"
        role="slider"
        aria-label={descripcion}
        aria-valuemin={0} aria-valuemax={1} aria-valuenow={listo ? 1 : 0}
        onPointerDown={empezar}
        onPointerMove={mover}
        onPointerUp={soltar}
        onPointerCancel={soltar}
        onKeyDown={teclado}
        style={{
          // Verificado se ancla con `right` en vez de medir la pista: leer el
          // ancho durante el render da 0 en la primera pasada y no se entera
          // de los cambios de tamaño. Al soltar, x ya vale el tope, así que
          // las dos formas caen en el mismo lugar y no salta.
          position: 'absolute', top: BORDE,
          ...(listo ? { right: BORDE } : { left: BORDE + x }),
          width: AUTO_W, height: AUTO_W, padding: 0,
          display: 'grid', placeItems: 'center',
          borderRadius: 9, border: 'none',
          background: listo ? C.primary : '#fff',
          color: listo ? '#fff' : C.primary,
          boxShadow: '0 1px 4px rgba(11,16,32,0.18)',
          cursor: listo ? 'default' : 'grab',
          transition: activo ? 'none' : 'left .2s, background .2s',
        }}
      >
        {listo ? <Check size={18} strokeWidth={3} /> : <Car size={20} strokeWidth={2.2} />}
      </button>
    </div>
  );
}
