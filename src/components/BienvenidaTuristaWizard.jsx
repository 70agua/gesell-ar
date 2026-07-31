// ============================================================
//  src/components/BienvenidaTuristaWizard.jsx
//  Wizard de bienvenida (3 slides) para turistas recién registrados.
//  Ilustraciones abstractas por bloques — no usa minifichas ni
//  carrito reales, sólo representa los conceptos.
// ============================================================
import { useState } from 'react';
import { X, Store, ArrowRight, Wallet, Sparkles } from 'lucide-react';
import CuponIcon from './CuponIcon';
import { CoinSVG } from './Token';

const W = {
  font:  "'Inter', system-ui, sans-serif",
  ink:   '#0f172a',
  ink2:  '#475569',
  p:     '#475be1',
  p2:    '#6d28d9',
  green: '#10b981',
  line:  '#e5e7eb',
};

const SLIDES = [
  {
    titulo: '¿Qué es un cupón?',
    texto: 'Es un beneficio con descuento real que te ofrece un comercio de la zona: alojamiento, salidas o actividades.',
    Ilustracion: () => (
      <div style={{ position: 'relative', width: '100%', height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 168, height: 88, borderRadius: 16, border: `2px dashed ${W.p}`,
          background: 'linear-gradient(135deg, rgba(71,91,225,0.08), rgba(109,40,217,0.08))',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <CuponIcon size={34} className="text-[#475be1]" />
          <span style={{ fontSize: 20, fontWeight: 800, color: W.p, fontFamily: W.font }}>-30%</span>
        </div>
        <Sparkles size={18} color={W.p2} style={{ position: 'absolute', top: 12, right: '28%', opacity: 0.8 }} />
        <Sparkles size={12} color={W.p} style={{ position: 'absolute', bottom: 16, left: '26%', opacity: 0.6 }} />
      </div>
    ),
  },
  {
    titulo: '¿Cómo lo comprás?',
    texto: 'Elegís el cupón que te gusta y lo comprás al instante con tus créditos. Sin trámites, sin esperas.',
    Ilustracion: () => (
      <div style={{ width: '100%', height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <div style={bloque()}>
          <Store size={22} color={W.p} />
        </div>
        <ArrowRight size={16} color={W.line} style={{ flexShrink: 0 }} />
        <div style={bloque()}>
          <CoinSVG size={26} />
        </div>
        <ArrowRight size={16} color={W.line} style={{ flexShrink: 0 }} />
        <div style={{ ...bloque(), background: '#f0fdf4', borderColor: '#bbf7d0' }}>
          <CuponIcon size={22} className="text-[#10b981]" />
        </div>
      </div>
    ),
  },
  {
    titulo: 'Armá tu carrito',
    texto: 'Cada cupón que comprás queda guardado en Mis cupones, siempre a mano para usarlo cuando quieras.',
    Ilustracion: () => (
      <div style={{ width: '100%', height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          position: 'relative', width: 152, height: 100, borderRadius: '16px 16px 12px 12px',
          background: 'linear-gradient(135deg, #475be1 0%, #6d28d9 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ position: 'absolute', top: -10, left: 18, width: 60, height: 20, borderRadius: '8px 8px 0 0', background: '#6d28d9' }} />
          <Wallet size={30} color="#fff" style={{ opacity: 0.9 }} />
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              position: 'absolute', bottom: -10 + i * -4, left: '50%',
              transform: `translateX(calc(-50% + ${(i - 1) * 26}px)) rotate(${(i - 1) * 10}deg)`,
              width: 30, height: 22, borderRadius: 6, background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.18)',
            }}>
              <CuponIcon size={14} className="text-[#475be1]" />
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

function bloque() {
  return {
    width: 52, height: 52, borderRadius: 14, background: '#f8fafc',
    border: `1.5px solid ${W.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  };
}

export default function BienvenidaTuristaWizard({ open, onClose }) {
  const [step, setStep] = useState(0);
  if (!open) return null;

  const isLast = step === SLIDES.length - 1;
  const { titulo, texto, Ilustracion } = SLIDES[step];

  const cerrar = () => { setStep(0); onClose && onClose(); };

  return (
    <>
      <div onClick={cerrar} style={{ position: 'fixed', inset: 0, zIndex: 9970, background: 'rgba(8,12,26,0.65)', backdropFilter: 'blur(3px)' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        zIndex: 9971, width: 'min(400px, 92vw)', background: '#fff', borderRadius: 22,
        boxShadow: '0 30px 80px rgba(0,0,0,0.28)', overflow: 'hidden',
        animation: 'wizard-in 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
      }}>
        <button onClick={cerrar} aria-label="Cerrar" style={{
          position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: '50%',
          background: 'rgba(15,23,42,0.06)', border: 'none', display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', zIndex: 1,
        }}>
          <X size={16} color={W.ink2} />
        </button>

        <div style={{ background: 'linear-gradient(180deg, #f5f6ff 0%, #ffffff 100%)', padding: '30px 24px 8px' }}>
          <Ilustracion />
        </div>

        <div style={{ padding: '18px 26px 26px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: W.ink, fontFamily: W.font }}>{titulo}</h3>
          <p style={{ margin: '0 0 20px', fontSize: 13.5, color: W.ink2, lineHeight: 1.6, fontFamily: W.font }}>{texto}</p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
            {SLIDES.map((_, i) => (
              <div key={i} style={{
                width: i === step ? 20 : 7, height: 7, borderRadius: 999,
                background: i === step ? W.p : W.line, transition: 'all .2s',
              }} />
            ))}
          </div>

          <button
            onClick={() => isLast ? cerrar() : setStep(s => s + 1)}
            style={{
              width: '100%', background: isLast ? W.green : W.p, color: '#fff', border: 'none',
              borderRadius: 12, padding: '13px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              fontFamily: W.font,
            }}
          >
            {isLast ? '¡Listo, vamos!' : 'Siguiente →'}
          </button>
        </div>
      </div>
    </>
  );
}
