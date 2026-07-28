//  src/components/Icono.jsx
//  Los íconos de /public/iconos conviven en dos formatos: SVG plano y Lottie
//  (.json) con animación propia. Este componente elige el render según la
//  extensión, así los call sites solo pasan la ruta y el tamaño.
//
//  Los Lottie NO se animan solos: quedan quietos en el primer cuadro y sólo
//  corren mientras el mouse está encima. Al salir vuelven al reposo.
//
//  Ojo con el tamaño: los SVG son verticales y se dibujan con width:'auto',
//  pero el Lottie corre sobre un canvas cuadrado (430×430) que necesita ancho
//  y alto explícitos. Por eso el estilo lo define siempre quien lo usa.

import { useEffect, useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function Icono({ src, label, className, style, hoverEn = 'self' }) {
  const [caja, setCaja]     = useState(null); // el <span> que envuelve al canvas
  const [lottie, setLottie] = useState(null); // instancia de DotLottie

  // Sin autoplay el canvas arranca en blanco: apenas carga, pintamos el primer
  // cuadro a mano para que el ícono se vea quieto igual que un SVG.
  useEffect(() => {
    if (!lottie) return;
    const reposo = () => { lottie.setFrame(0); lottie.render(); };
    lottie.addEventListener('load', reposo);
    return () => lottie.removeEventListener('load', reposo);
  }, [lottie]);

  useEffect(() => {
    if (!caja || !lottie) return;
    // En las tarjetas el mouse entra por el botón, no por el ícono: con
    // hoverEn="padre" escuchamos al contenedor para que la animación arranque
    // con el hover de la tarjeta entera, el mismo que dispara el pop de CSS.
    const zona = hoverEn === 'padre' ? caja.parentElement : caja;
    if (!zona) return;

    const entra = () => lottie.play();
    const sale  = () => lottie.stop(); // stop deja la animación en el cuadro 0

    zona.addEventListener('mouseenter', entra);
    zona.addEventListener('mouseleave', sale);
    return () => {
      zona.removeEventListener('mouseenter', entra);
      zona.removeEventListener('mouseleave', sale);
    };
  }, [caja, lottie, hoverEn]);

  if (!src.endsWith('.json')) {
    return <img className={className} src={src} alt="" title={label} style={style} />;
  }

  return (
    <span ref={setCaja} className={className} title={label} style={{ lineHeight: 0, ...style }}>
      <DotLottieReact
        src={src}
        loop
        autoplay={false}
        dotLottieRefCallback={setLottie}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </span>
  );
}
