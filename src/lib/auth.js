// ============================================================
//  src/lib/auth.js
//  Funciones de login, logout y sesión
// ============================================================
import { supabase } from './supabase';
import { otorgarTokens } from './gamificacion';

// Iniciar sesión
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

// Cerrar sesión
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Acceder / Registrarse con Google (OAuth)
export async function loginConGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

// Obtener sesión activa
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// Obtener perfil del usuario logueado (incluye si es superadmin)
export async function getPerfil() {
  const session = await getSession();
  if (!session) return null;

  let { data, error } = await supabase
    .from('perfiles')
    .select('*, negocios(*)')
    .eq('id', session.user.id)
    .single();

  if (error) {
    // No hay fila en `perfiles` — típico de un alta por Google, que no pasa por
    // registrarTurista(). Se crea un perfil turista al vuelo y se reintenta.
    await crearPerfilTuristaSiFalta(session);
    ({ data, error } = await supabase
      .from('perfiles')
      .select('*, negocios(*)')
      .eq('id', session.user.id)
      .single());
    if (error) return null;
  }
  return data;
}

// Crea un perfil turista para una sesión sin fila en `perfiles` (alta vía OAuth).
// Usa insert (no upsert): si dos llamadas concurrentes chocan, la segunda falla
// por PK duplicada y no vuelve a otorgar créditos de bienvenida.
async function crearPerfilTuristaSiFalta(session) {
  const meta = session.user.user_metadata || {};
  const nombre = meta.full_name || meta.name || session.user.email?.split('@')[0] || 'Usuario';
  const { error } = await supabase.from('perfiles').insert({
    id:     session.user.id,
    nombre,
    email:  session.user.email,
    rol:    'turista',
    es_superadmin: false,
  });
  if (!error) await otorgarTokens(session.user.id, 'registro');
}

// Registrar turista (usuario público)
export async function registrarTurista({ nombre, apellido = '', email, password, intereses = [] }) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  const userId = data.user?.id;
  if (!userId) throw new Error('No se pudo crear el usuario');

  const nombreCompleto = apellido ? `${nombre} ${apellido}` : nombre;

  // Crear perfil con rol turista
  await supabase.from('perfiles').upsert({
    id:     userId,
    nombre: nombreCompleto,
    email,
    rol:    'turista',
    es_superadmin: false,
  });

  // Otorgar 2 créditos de bienvenida
  await otorgarTokens(userId, 'registro');

  return data;
}

// Login de turista (mismo flow que socio — Supabase unifica)
export async function loginTurista(email, password) {
  return login(email, password);
}

// Guardar consulta de turista sobre un alojamiento
export async function guardarConsulta({ negocioId, nombre, email, telefono, mensaje }) {
  const { data, error } = await supabase.from('consultas').insert({
    negocio_id:        negocioId,
    nombre_visitante:  nombre,
    email,
    telefono,
    mensaje,
    leida:             false,
  }).select().single();

  if (error) throw error;
  return data;
}