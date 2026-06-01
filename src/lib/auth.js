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

  const { data, error } = await supabase
    .from('perfiles')
    .select('*, negocios(*)')
    .eq('id', session.user.id)
    .single();

  if (error) return null;
  return data;
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