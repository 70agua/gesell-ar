// ============================================================
//  src/lib/loading.jsx
//  Contexto global de loading — uso:
//    const { showLoading, hideLoading } = useLoading();
//    const fetchConLoading = useLoadingFn(miFuncionAsync);
// ============================================================
import React, { createContext, useContext, useState, useCallback } from 'react';

const LoadingContext = createContext({
  isLoading: false,
  showLoading: () => {},
  hideLoading: () => {},
});

export function LoadingProvider({ children }) {
  const [count, setCount] = useState(0);
  const showLoading = useCallback(() => setCount(c => c + 1), []);
  const hideLoading = useCallback(() => setCount(c => Math.max(0, c - 1)), []);

  return (
    <LoadingContext.Provider value={{ isLoading: count > 0, showLoading, hideLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

/** Hook para consumir el contexto de loading */
export function useLoading() {
  return useContext(LoadingContext);
}

/**
 * Wrappea una función async mostrando el loading mientras corre.
 * Uso: const guardar = useLoadingFn(() => supabase.from(...).insert(...))
 */
export function useLoadingFn(fn) {
  const { showLoading, hideLoading } = useLoading();
  return useCallback(async (...args) => {
    showLoading();
    try {
      return await fn(...args);
    } finally {
      hideLoading();
    }
  }, [fn, showLoading, hideLoading]);
}
