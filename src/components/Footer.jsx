// ============================================================
//  src/components/Footer.jsx
// ============================================================
import React from 'react';
import { Mail, LogIn } from 'lucide-react';

const IcoInstagram = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);
const IcoFacebook = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const P     = '#475be1';
const NAVY  = 'rgb(11, 23, 51)';
const INK2  = '#64748b';
const MUTED = '#94a3b8';
const LINE  = '#1e293b';
const FONT  = "'Inter', system-ui, sans-serif";

const COL = {
  title: { fontFamily: FONT, fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 },
  link:  { fontFamily: FONT, fontSize: 13, color: '#cbd5e1', cursor: 'pointer', lineHeight: 1, padding: '5px 0', display: 'block', transition: 'color 0.15s' },
};

function NavLink({ label, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <span
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...COL.link, color: hover ? '#fff' : '#cbd5e1' }}
    >
      {label}
    </span>
  );
}

export default function Footer({ onNavigate }) {
  const nav = (v) => onNavigate?.(v);

  return (
    <footer style={{ background: NAVY, fontFamily: FONT }}>

      {/* ── Cuerpo principal ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 40px 48px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48 }}>

        {/* Columna marca */}
        <div>
          <img src="/logo-cuponera-wh.svg" alt="Cuponear" style={{ height: 36, width: 'auto', marginBottom: 18 }} />
          <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7, maxWidth: 280, margin: '0 0 24px' }}>
            Descubrí alojamientos, salidas y las mejores salidas y aventura & relax. Armá tu cuponera y ahorrá en cada salida.
          </p>
          {/* Redes sociales */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            {[
              { icon: <IcoInstagram />, label: 'Instagram' },
              { icon: <IcoFacebook />,  label: 'Facebook'  },
              { icon: <Mail size={15}/>,      label: 'Email'     },
            ].map(({ icon, label }) => (
              <button key={label} title={label} style={{
                width: 34, height: 34, borderRadius: 9, border: `1px solid #1e293b`,
                background: '#111827', color: '#94a3b8', display: 'grid', placeItems: 'center',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = P; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = P; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#111827'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#1e293b'; }}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Columna: Explorar */}
        <div>
          <div style={COL.title}>Explorar</div>
          <NavLink label="Inicio"           onClick={() => nav('home')} />
          <NavLink label="Alojamientos"     onClick={() => nav('marketplace')} />
          <NavLink label="Salidas"      onClick={() => nav('salidas')} />
          <NavLink label="Ofertas y descuentos" onClick={() => nav('ofertas')} />
          <NavLink label="Cuponeras" onClick={() => nav('packs')} />
          <NavLink label="Ofertas de regalo" onClick={() => nav('ofertas-regalo')} />
        </div>

        {/* Columna: Tu cuponera */}
        <div>
          <div style={COL.title}>Tu cuponera</div>
          <NavLink label="¿Cómo funciona?"  onClick={() => nav('home')} />
          <NavLink label="Activar descuentos" onClick={() => nav('ofertas')} />
          <NavLink label="Armá tu cuponera" onClick={() => nav('marketplace')} />
          <NavLink label="Ingresar"         onClick={() => nav('login')} />
        </div>

        {/* Columna: Negocios */}
        <div>
          <div style={COL.title}>Negocios</div>
          <NavLink label="Sumá tu negocio"  onClick={() => nav('socios')} />
          <NavLink label="Publicar oferta"  onClick={() => nav('publicar-oferta')} />
          <NavLink label="Panel de socio"   onClick={() => nav('admin')} />
          <div style={{ marginTop: 20 }}>
            <div style={COL.title}>Legal</div>
            <NavLink label="Términos y condiciones" onClick={() => {}} />
            <NavLink label="Política de privacidad" onClick={() => {}} />
          </div>
        </div>
      </div>

      {/* ── Barra inferior ── */}
      <div style={{ borderTop: `1px solid ${LINE}`, padding: '18px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, maxWidth: 1200, margin: '0 auto' }}>
        <span style={{ fontSize: 12, color: MUTED }}>© {new Date().getFullYear()} Cuponera — Todos los derechos reservados</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          {/* Puerta de entrada a la cuenta: es el único acceso al login desde
              que salió de la navbar, así que va acá, siempre visible. */}
          <button
            onClick={() => nav('login')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: FONT,
              fontSize: 12.5, fontWeight: 600, color: '#cbd5e1', cursor: 'pointer',
              background: '#111827', border: `1px solid ${LINE}`, borderRadius: 999,
              padding: '7px 15px', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = P; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = P; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#111827'; e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.borderColor = LINE; }}
          >
            <LogIn size={14} /> Acceso a usuarios
          </button>
          <span style={{ fontSize: 12, color: 'rgb(148, 163, 184)' }}>Hecho con <span style={{ color: 'rgb(37, 69, 230)' }}>♥</span> en Argentina</span>
        </div>
      </div>

    </footer>
  );
}
