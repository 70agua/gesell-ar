// ============================================================
//  src/lib/favoritos.jsx — Contexto global de favoritos
//  Persiste en localStorage; sincronizable a Supabase en el futuro.
// ============================================================
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const FavoritosCtx = createContext(null);

export function FavoritosProvider({ children }) {
  const [ids, setIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('gesell_favoritos') || '[]')); }
    catch { return new Set(); }
  });

  useEffect(() => {
    localStorage.setItem('gesell_favoritos', JSON.stringify([...ids]));
  }, [ids]);

  const toggleFavorito = useCallback((id) => {
    setIds(prev => {
      const next = new Set(prev);
      const key = String(id);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const esFavorito = useCallback((id) => ids.has(String(id)), [ids]);

  return (
    <FavoritosCtx.Provider value={{ ids: [...ids], toggleFavorito, esFavorito }}>
      {children}
    </FavoritosCtx.Provider>
  );
}

export function useFavoritos() {
  return useContext(FavoritosCtx);
}
