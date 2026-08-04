// ============================================================
//  src/lib/favoritos.jsx — Contexto global de favoritos
// ============================================================
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const FavoritosCtx = createContext(null);

// ── Tooltip anclado bajo el botón Ingresar / Registrarse ───
function FavoritosTip({ onRegistrar, onCerrar }) {
  const [saliendo, setSaliendo] = useState(false);

  const cerrar = () => {
    setSaliendo(true);
    setTimeout(onCerrar, 280);
  };

  useEffect(() => {
    const t = setTimeout(cerrar, 6000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: 68,
        right: 18,
        zIndex: 9999,
        width: 290,
        background: '#0B1020',
        borderRadius: 16,
        padding: '16px 18px 14px',
        boxShadow: '0 12px 40px -8px rgba(11,16,32,0.5)',
        animation: saliendo
          ? 'tip-out 0.28s cubic-bezier(.4,0,1,1) forwards'
          : 'tip-in 0.32s cubic-bezier(.34,1.4,.64,1) forwards',
      }}
    >
      {/* Flecha arriba */}
      <div style={{
        position: 'absolute',
        top: -7,
        right: 28,
        width: 14,
        height: 7,
        overflow: 'hidden',
      }}>
        <div style={{
          width: 14,
          height: 14,
          background: '#0B1020',
          transform: 'rotate(45deg)',
          transformOrigin: 'center',
          position: 'absolute',
          top: 3,
          left: 0,
          borderRadius: 2,
        }} />
      </div>

      {/* Contenido */}
      <button
        onClick={cerrar}
        style={{ position: 'absolute', top: 10, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', lineHeight: 1, padding: 2 }}
        aria-label="Cerrar"
      >
        ✕
      </button>

      <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 5px', lineHeight: 1.3 }}>
        ¡Guardá tus favoritos! 💙
      </p>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '0 0 14px', lineHeight: 1.4 }}>
        Registrate gratis y no perdás ningún descuento que te interese.
      </p>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={cerrar}
          style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
        >
          Ahora no
        </button>
        <button
          onClick={onRegistrar}
          style={{ flex: 2, padding: '8px 0', borderRadius: 10, border: 'none', background: '#475BE1', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
        >
          Registrarme gratis →
        </button>
      </div>

      <style>{`
        @keyframes tip-in {
          from { opacity: 0; transform: translateY(-10px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes tip-out {
          from { opacity: 1; transform: translateY(0)    scale(1);    }
          to   { opacity: 0; transform: translateY(-6px) scale(0.96); }
        }
      `}</style>
    </div>
  );
}

export function FavoritosProvider({ children, session, onLoginRequired }) {
  const [ids, setIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('gesell_favoritos') || '[]')); }
    catch { return new Set(); }
  });
  const [showTip, setShowTip]   = useState(false);
  const tipYaMostrado = useRef(false);  // solo una vez por sesión de navegación

  useEffect(() => {
    localStorage.setItem('gesell_favoritos', JSON.stringify([...ids]));
  }, [ids]);

  const toggleFavorito = useCallback((id) => {
    if (!session) {
      if (!tipYaMostrado.current) {
        // Primera vez: mostrar tip simpático
        tipYaMostrado.current = true;
        setShowTip(true);
      } else {
        // Segunda vez en adelante: ir directo al registro
        onLoginRequired?.('registrarse');
      }
      return;
    }
    setIds(prev => {
      const next = new Set(prev);
      const key = String(id);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, [session, onLoginRequired]);

  const esFavorito = useCallback((id) => ids.has(String(id)), [ids]);

  return (
    <FavoritosCtx.Provider value={{ ids: [...ids], toggleFavorito, esFavorito }}>
      {children}
      {showTip && (
        <FavoritosTip
          onRegistrar={() => { setShowTip(false); onLoginRequired?.('registrarse'); }}
          onCerrar={() => setShowTip(false)}
        />
      )}
    </FavoritosCtx.Provider>
  );
}

export function useFavoritos() {
  return useContext(FavoritosCtx);
}
