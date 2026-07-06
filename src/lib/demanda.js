// ============================================================
//  src/lib/demanda.js
//  Relevamiento de demanda de destinos fuera de la cobertura actual.
//  Cada vez que un usuario busca ofertas en un destino al que todavía
//  no llegamos, registramos el destino (y su email, si lo deja) para
//  decidir hacia dónde conviene expandirse. Ver tabla demanda_destinos.
// ============================================================

import { supabase } from './supabase';

const uuid = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

// Id estable por sesión de navegación: permite contar clicks por sesión.
function sessionId() {
  try {
    let id = sessionStorage.getItem('demanda_session');
    if (!id) { id = uuid(); sessionStorage.setItem('demanda_session', id); }
    return id;
  } catch {
    return null;
  }
}

// Registra un click en "Buscar ofertas de viaje" para un destino.
// El id se genera en el cliente (la tabla no tiene SELECT público) para
// poder completar el email después sin necesidad de leer la fila.
// Devuelve ese id, o null si falló.
export async function registrarDemandaDestino({ destino, provincia = null, tipo = null, georefId = null, categoria = null }) {
  if (!destino) return null;
  const id = uuid();
  const { error } = await supabase.from('demanda_destinos').insert({
    id,
    destino,
    provincia,
    tipo,
    georef_id:  georefId,
    categoria,
    session_id: sessionId(),
  });
  return error ? null : id;
}

// Completa el email en un registro de demanda ya creado.
export async function completarEmailDemanda(id, email) {
  if (!id || !email) return;
  await supabase.from('demanda_destinos').update({ email: email.trim() }).eq('id', id);
}

// Lectura para el panel superadmin (la tabla solo permite SELECT al superadmin
// vía RLS). Devuelve las filas crudas para agregarlas en el cliente.
export async function getDemandaDestinos() {
  const { data } = await supabase
    .from('demanda_destinos')
    .select('destino, provincia, tipo, session_id, email, created_at')
    .order('created_at', { ascending: false })
    .limit(5000);
  return data || [];
}
