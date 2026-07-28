// ============================================================
//  src/components/CaptchaDeslizar.jsx
//  Verificación anti-bot de arrastre: se corre el pulsador hasta el final de
//  la pista y listo. Sin escribir nada, sin leer letras deformadas.
//
//  Es fricción, no seguridad: cualquier script que corra JS lo pasa. Sirve
//  contra el bot tonto que postea formularios y contra el alta accidental.
//  Si alguna vez hace falta de verdad, va un Turnstile del lado del server.
// ============================================================
import { useRef, useState } from 'react';
import { Check, ChevronsRight } from 'lucide-react';

const C = {
  primary:     '#2545E6',
  primarySoft: '#EEF1FF',
  ink2:        '#3D4255',
  muted:       '#6B7280',
  line:        '#E7E9EE',
  bg:          '#F7F7F8',
  font:        "'Inter', system-ui, sans-serif",
};

const ALTO    = 48;
const BORDE   = 4;            // aire entre el pulsador y la pista
const PULSOR  = ALTO - BORDE * 2;

// `texto` es lo que se lee dentro de la pista y tiene que entrar en poco ancho;
// `descripcion` es la frase entera y va como nombre accesible del control.
// Separadas a propósito: el que ve la pantalla ya tiene el rótulo de arriba y
// la flecha del pulsador, el que la escucha necesita la explicación completa.
export default function CaptchaDeslizar({
  verificado,
  onVerificar,
  texto       = 'Deslizá si sos un humano',
  descripcion = 'Deslizá el control hasta el final para confirmar que sos un humano',
  textoOk     = 'Verificado',
}) {
  const pistaRef  = useRef(null);
  const arrastreRef = useRef(null);   // { inicioX, max } mientras dura el gesto
  const [x, setX] = useState(0);
  const [activo, setActivo] = useState(false);

  const topeDe = () => (pistaRef.current?.offsetWidth || 0) - PULSOR - BORDE * 2;

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
      {/* Estela: acompaña al pulsador para que se vea el avance */}
      <div aria-hidden="true"
        style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: listo ? '100%' : x + PULSOR + BORDE,
          background: C.primarySoft,
          transition: activo ? 'none' : 'width .2s',
        }}
      />

      <span
        style={{
          position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
          fontSize: 12.5, fontWeight: 600, fontFamily: C.font,
          color: listo ? C.primary : C.muted,
          // Centrado contra la pista entera, sin descontar el pulsador: el
          // texto queda al medio de la caja y no corrido a la derecha.
          pointerEvents: 'none', whiteSpace: 'nowrap',
        }}
      >
        {listo ? textoOk : texto}
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
          width: PULSOR, height: PULSOR, padding: 0,
          display: 'grid', placeItems: 'center',
          borderRadius: 9, border: 'none',
          background: listo ? C.primary : '#fff',
          color: listo ? '#fff' : C.primary,
          boxShadow: '0 1px 4px rgba(11,16,32,0.18)',
          cursor: listo ? 'default' : 'grab',
          transition: activo ? 'none' : 'left .2s, background .2s',
        }}
      >
        {listo ? <Check size={18} strokeWidth={3} /> : <ChevronsRight size={18} strokeWidth={2.6} />}
      </button>
    </div>
  );
}
