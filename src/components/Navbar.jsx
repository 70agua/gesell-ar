// ============================================================
//  src/components/Navbar.jsx — Aire design
// ============================================================
import React, { useState, useRef, useEffect } from 'react';
import { locations } from '../data/mockData';
import { useCuponera } from '../lib/cuponera';

const A = {
  ink:         '#0B1020',
  ink2:        '#3D4255',
  muted:       '#6B7280',
  line:        '#E7E9EE',
  primary:     '#2545E6',
  primarySoft: '#EEF1FF',
  bg:          '#F7F7F8',
  font:        "'Geist', system-ui, sans-serif",
};

const ALOJ_TIPOS = ['Todos', 'Hoteles', 'Cabañas', 'Casas', 'Departamentos', 'Dormis / Camping'];

function useOutsideClose(ref, fn) {
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) fn(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
}

function ChevD() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}

function ChevR() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 6 6 6-6 6"/>
    </svg>
  );
}

const DROP_BASE = {
  position: 'absolute', top: 'calc(100% + 10px)',
  background: '#fff', borderRadius: 16, border: `1px solid ${A.line}`,
  boxShadow: '0 20px 60px -20px rgba(11,16,32,0.22)',
  zIndex: 100, overflow: 'hidden',
};

// ─── Icono Cuponera (gem) ─────────────────────────────────────
function IcoGem() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="6 3 18 3 22 9 12 22 2 9"/>
      <path d="M12 22 8 9M12 22l4-13M2 9h20M8 3 6 9M16 3l2 6"/>
    </svg>
  );
}

export default function Navbar({ scrolled, view, setView, session, perfil, onLoginClick, onLogout }) {
  const [alojOpen,   setAlojOpen]   = useState(false);
  const [gastroOpen, setGastroOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredLoc, setHoveredLoc] = useState(locations[0]);
  const { openDrawer } = useCuponera();

  // Determinar tipo de sesión
  const esSocioOAdmin = session && (perfil?.negocio_id || perfil?.es_superadmin);
  const esTurista     = session && !esSocioOAdmin;
  const nombreDisplay = esSocioOAdmin
    ? (perfil?.negocios?.nombre || perfil?.nombre || session?.user?.email || 'Mi cuenta')
    : (perfil?.nombre || session?.user?.email || 'Mi cuenta');
  const avatarUrl = esSocioOAdmin
    ? (perfil?.negocios?.foto_perfil || perfil?.negocios?.imagen_url || perfil?.avatar_url || null)
    : (perfil?.avatar_url || null);
  const avatarLetra = (nombreDisplay)[0].toUpperCase();

  const alojRef   = useRef(null);
  const gastroRef = useRef(null);

  useOutsideClose(alojRef,   () => setAlojOpen(false));
  useOutsideClose(gastroRef, () => setGastroOpen(false));

  const closeAll = () => { setAlojOpen(false); setGastroOpen(false); };

  const navStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
    background: '#fff',
    borderBottom: `1px solid ${A.line}`,
    display: 'flex', justifyContent: 'center',
    transition: 'box-shadow 0.2s',
    boxShadow: scrolled ? '0 2px 20px -8px rgba(11,16,32,0.14)' : 'none',
    fontFamily: A.font,
  };

  const navLinkSt = {
    background: 'none', border: 'none', fontSize: 16, fontWeight: 500,
    color: A.ink2, cursor: 'pointer', padding: '4px 0', fontFamily: A.font,
    display: 'inline-flex', alignItems: 'center', gap: 4,
  };

  return (
    <>
      <nav style={navStyle}>
        <div style={{ width: '100%', maxWidth: 1328, padding: '0 40px', height: 70, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>

          {/* ── Logo ── */}
          <div
            onClick={() => { setView('home'); setMobileOpen(false); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 }}
          >
            <div style={{ width: 34, height: 34, borderRadius: 9, background: A.primary, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 18, letterSpacing: '-0.04em' }}>G</div>
            <span style={{ fontWeight: 800, fontSize: 24, color: A.ink, letterSpacing: '-0.02em', fontFamily: A.font }}>gesell.ar</span>
          </div>

          {/* ── Desktop nav links (hidden on mobile via CSS class) ── */}
          <div className="navbar-links" style={{ display: 'flex', alignItems: 'center', gap: 24, flex: 1, paddingLeft: 24 }}>

            {/* Inicio */}
            <button onClick={() => setView('home')} style={navLinkSt}>
              Inicio
            </button>

            {/* Alojamientos ▾ */}
            <div style={{ position: 'relative' }} ref={alojRef}>
              <button
                onClick={() => { setAlojOpen(o => !o); setGastroOpen(false); }}
                style={navLinkSt}
              >
                Alojamientos <ChevD />
              </button>
              {alojOpen && (
                <div style={{ ...DROP_BASE, left: '50%', transform: 'translateX(-50%)', width: 460 }}>
                  <div style={{ display: 'flex' }}>
                    {/* Localidades */}
                    <div style={{ width: 180, borderRight: `1px solid ${A.line}`, background: A.bg, padding: '8px 0', flexShrink: 0 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: A.muted, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 16px 6px', margin: 0 }}>Destinos</p>
                      {locations.map(loc => (
                        <button
                          key={loc}
                          onMouseEnter={() => setHoveredLoc(loc)}
                          onClick={() => { setView('marketplace'); closeAll(); }}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '9px 16px', border: 'none', textAlign: 'left', cursor: 'pointer',
                            background: hoveredLoc === loc ? '#fff' : 'transparent',
                            color: hoveredLoc === loc ? A.primary : A.ink2,
                            fontSize: 13, fontWeight: hoveredLoc === loc ? 600 : 500,
                            fontFamily: A.font,
                          }}
                        >
                          <span>{loc}</span>
                          {hoveredLoc === loc && <ChevR />}
                        </button>
                      ))}
                    </div>

                    {/* Tipos bajo la localidad */}
                    <div style={{ flex: 1, padding: '10px 10px' }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: A.primary, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '4px 6px 8px', fontFamily: A.font }}>
                        {hoveredLoc}
                      </p>
                      {ALOJ_TIPOS.map(tipo => (
                        <button
                          key={tipo}
                          onClick={() => { setView('marketplace'); closeAll(); }}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center',
                            padding: '8px 10px', border: 'none', borderRadius: 10, cursor: 'pointer',
                            textAlign: 'left', fontSize: 13, fontWeight: tipo === 'Todos' ? 600 : 500,
                            color: tipo === 'Todos' ? A.primary : A.ink2,
                            background: 'transparent', fontFamily: A.font,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = A.bg; e.currentTarget.style.color = A.primary; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = tipo === 'Todos' ? A.primary : A.ink2; }}
                        >
                          {tipo}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Gastronomía ▾ */}
            <div style={{ position: 'relative' }} ref={gastroRef}>
              <button
                onClick={() => { setGastroOpen(o => !o); setAlojOpen(false); }}
                style={navLinkSt}
              >
                Gastronomía <ChevD />
              </button>
              {gastroOpen && (
                <div style={{ ...DROP_BASE, left: '50%', transform: 'translateX(-50%)', width: 210 }}>
                  <div style={{ padding: '8px 0' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: A.muted, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 16px 4px', margin: 0 }}>Destinos</p>
                    {locations.map(loc => (
                      <button
                        key={loc}
                        onClick={() => { setView('gastronomia'); closeAll(); }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', border: 'none', background: 'transparent', fontSize: 13, fontWeight: 500, color: A.ink2, cursor: 'pointer', textAlign: 'left', fontFamily: A.font }}
                        onMouseEnter={e => { e.currentTarget.style.background = A.bg; e.currentTarget.style.color = A.primary; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = A.ink2; }}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Packs recomendados */}
            <button
              onClick={() => { setView('packs'); closeAll(); }}
              style={navLinkSt}
            >
              Packs recomendados
            </button>

            {/* ¡Sumá tu negocio! — solo visible cuando no hay sesión */}
            {!session && (
              <button
                onClick={() => setView('socios')}
                style={{
                  ...navLinkSt,
                  marginLeft: 'auto', color: A.primary, fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                ¡Sumá tu negocio!
              </button>
            )}
          </div>

          {/* ── Auth + hamburger ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>

            {/* === TURISTA logueado === */}
            {esTurista && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Avatar + nombre */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="Perfil" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${A.line}` }} />
                    : <div style={{ width: 34, height: 34, borderRadius: '50%', background: A.ink, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700, fontFamily: A.font, flexShrink: 0 }}>{avatarLetra}</div>
                  }
                  <span style={{ fontSize: 14, fontWeight: 600, color: A.ink, fontFamily: A.font, whiteSpace: 'nowrap' }}>
                    {nombreDisplay}
                  </span>
                  <ChevD />
                </div>
                {/* Cuponera */}
                <button
                  onClick={openDrawer}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: A.primarySoft, border: 'none', borderRadius: 999, padding: '8px 16px', fontSize: 13, fontWeight: 700, color: A.primary, cursor: 'pointer', fontFamily: A.font, whiteSpace: 'nowrap' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#DDE3FD'}
                  onMouseLeave={e => e.currentTarget.style.background = A.primarySoft}
                >
                  <IcoGem /> Cuponera
                </button>
                {/* Separador */}
                <span style={{ color: A.line, fontSize: 20, fontWeight: 300 }}>|</span>
                {/* Salir */}
                <button onClick={onLogout} style={{ background: 'none', border: 'none', fontSize: 14, color: A.muted, cursor: 'pointer', fontWeight: 500, fontFamily: A.font }}>
                  Salir
                </button>
              </div>
            )}

            {/* === SOCIO / ADMIN logueado === */}
            {esSocioOAdmin && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Avatar + nombre negocio */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="Negocio" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${A.line}` }} />
                    : <div style={{ width: 34, height: 34, borderRadius: '50%', background: A.ink, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700, fontFamily: A.font, flexShrink: 0 }}>{avatarLetra}</div>
                  }
                  <span style={{ fontSize: 14, fontWeight: 500, color: A.ink2, fontFamily: A.font, whiteSpace: 'nowrap', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {nombreDisplay}
                  </span>
                </div>
                {/* Mi panel */}
                <button
                  onClick={() => setView(perfil?.es_superadmin ? 'superadmin' : 'admin')}
                  style={{ background: 'none', border: 'none', fontSize: 14, fontWeight: 700, color: A.primary, cursor: 'pointer', fontFamily: A.font, whiteSpace: 'nowrap' }}
                >
                  Mi panel
                </button>
                {/* Separador */}
                <span style={{ color: A.line, fontSize: 20, fontWeight: 300 }}>|</span>
                {/* Salir */}
                <button onClick={onLogout} style={{ background: 'none', border: 'none', fontSize: 14, color: A.muted, cursor: 'pointer', fontWeight: 500, fontFamily: A.font }}>
                  Salir
                </button>
              </div>
            )}

            {/* === NO logueado === */}
            {!session && (
              <button
                className="navbar-socios-btn"
                onClick={onLoginClick}
                style={{
                  background: A.ink, color: '#fff', border: 'none',
                  borderRadius: 999, padding: '9px 22px',
                  fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  whiteSpace: 'nowrap', fontFamily: A.font,
                  boxShadow: '0 2px 8px rgba(11,16,32,0.22)',
                }}
              >
                Acceder/Registro
              </button>
            )}

            {/* Hamburger (visible on mobile via CSS) */}
            <button
              className="navbar-hamburger"
              onClick={() => setMobileOpen(o => !o)}
              style={{ background: 'none', border: `1px solid ${A.line}`, borderRadius: 10, width: 38, height: 38, display: 'none', placeItems: 'center', cursor: 'pointer', color: A.ink, flexShrink: 0 }}
            >
              {mobileOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40, background: '#fff', paddingTop: 70, overflowY: 'auto', fontFamily: A.font }}>
          <div style={{ padding: '24px 24px 48px' }}>
            <button onClick={() => { setView('home'); setMobileOpen(false); }} style={{ width: '100%', textAlign: 'left', padding: '14px 0', border: 'none', borderBottom: `1px solid ${A.line}`, background: 'none', fontSize: 16, fontWeight: 600, color: A.ink, cursor: 'pointer', fontFamily: A.font }}>
              Inicio
            </button>

            <p style={{ fontSize: 10, fontWeight: 700, color: A.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 24, marginBottom: 8 }}>Alojamientos</p>
            {locations.map(loc => (
              <button key={loc} onClick={() => { setView('marketplace'); setMobileOpen(false); }} style={{ width: '100%', textAlign: 'left', padding: '10px 0', border: 'none', borderBottom: `1px solid ${A.line}`, background: 'none', fontSize: 14, color: A.ink2, cursor: 'pointer', fontFamily: A.font }}>
                {loc}
              </button>
            ))}

            <p style={{ fontSize: 10, fontWeight: 700, color: A.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 24, marginBottom: 8 }}>Gastronomía</p>
            {locations.map(loc => (
              <button key={loc} onClick={() => { setView('gastronomia'); setMobileOpen(false); }} style={{ width: '100%', textAlign: 'left', padding: '10px 0', border: 'none', borderBottom: `1px solid ${A.line}`, background: 'none', fontSize: 14, color: A.ink2, cursor: 'pointer', fontFamily: A.font }}>
                {loc}
              </button>
            ))}

            <button
              onClick={() => { setView('packs'); setMobileOpen(false); }}
              style={{ width: '100%', textAlign: 'left', padding: '14px 0', border: 'none', borderBottom: `1px solid ${A.line}`, background: 'none', fontSize: 16, fontWeight: 600, color: A.ink, cursor: 'pointer', fontFamily: A.font, marginTop: 16 }}
            >
              Packs recomendados
            </button>

            <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {session ? (
                <>
                  {/* Info de cuenta */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${A.line}` }}>
                    {perfil?.avatar_url ? (
                      <img src={perfil.avatar_url} alt="Perfil" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `2px solid ${A.line}` }} />
                    ) : (
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: A.ink, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 16, fontWeight: 700, fontFamily: A.font, flexShrink: 0 }}>
                        {(perfil?.nombre || session.user?.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <span style={{ fontSize: 15, fontWeight: 600, color: A.ink, fontFamily: A.font }}>
                      {perfil?.nombre || session.user?.email}
                    </span>
                  </div>
                  <button
                    onClick={() => { setView(perfil?.es_superadmin ? 'superadmin' : 'admin'); setMobileOpen(false); }}
                    style={{ width: '100%', padding: '14px', border: 'none', borderRadius: 14, background: A.ink, fontSize: 15, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: A.font }}
                  >
                    Mi cuenta
                  </button>
                  <button
                    onClick={() => { onLogout(); setMobileOpen(false); }}
                    style={{ width: '100%', padding: '14px', border: `1px solid ${A.line}`, borderRadius: 14, background: A.bg, fontSize: 15, fontWeight: 600, color: A.muted, cursor: 'pointer', fontFamily: A.font }}
                  >
                    Salir
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { setView('socios'); setMobileOpen(false); }} style={{ width: '100%', padding: '14px', border: 'none', borderRadius: 14, background: A.primary, fontSize: 15, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: A.font }}>
                    Sumá tu negocio
                  </button>
                  <button onClick={() => { onLoginClick(); setMobileOpen(false); }} style={{ width: '100%', padding: '14px', border: `1px solid ${A.line}`, borderRadius: 14, background: A.bg, fontSize: 15, fontWeight: 600, color: A.ink, cursor: 'pointer', fontFamily: A.font }}>
                    Acceso a socios
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
