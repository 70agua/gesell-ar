// ============================================================
//  src/lib/altaSocio.js
//  Alta de un socio desde el checkout público: cuenta + negocio + plan, en
//  una sola llamada. Antes esto vivía adentro de SociosView/ModalRegistro,
//  mezclado con el JSX — acá queda testeable y con un único orden de pasos.
//
//  Dos entradas posibles:
//    · sin sesión  → crea el usuario de auth y después el negocio.
//    · con sesión  → sólo crea el negocio y lo cuelga del perfil que ya existe
//                    (es el turista que se convierte en socio).
//
//  El negocio nace `aprobado: false, activo: false`: el alta no publica nada
//  todavía, la moderación es un paso aparte del superadmin.
// ============================================================
import { supabase } from './supabase';
import { existeNegocioConNombre } from './validacionRegistro';
import { crearSuscripcionPro } from './planes';
import { getSession } from './auth';

export const DESC_MIN = 40;

// Errores con nombre: la vista decide el texto, acá no se arma copy.
export const ERRORES_ALTA = {
  nombre_duplicado: 'Ya hay un alojamiento registrado con ese nombre.',
  email_en_uso:     'Ese mail ya tiene cuenta. Entrá por "Ya tengo cuenta".',
  sin_sesion:       'No pudimos validar tu cuenta. Probá de nuevo.',
  negocio:          'No se pudo crear el alojamiento. Probá de nuevo.',
  perfil:           'La cuenta quedó creada pero no pudimos vincular el alojamiento.',
};

export async function altaSocio({
  negocio,                    // { nombre, descripcion, tipo, localidad }
  cuenta,                     // { email, password } — se ignora si ya hay sesión
  codigoPlan,                 // 'pro_1' | 'pro_6' | 'pro_12'
  unidadesDeclaradas = 0,
}) {
  if (await existeNegocioConNombre(negocio.nombre)) {
    return { ok: false, error: 'nombre_duplicado' };
  }

  // 1) Usuario. Si ya viene logueado no se toca nada de auth.
  let sesion = await getSession();
  if (!sesion?.user?.id) {
    const { data, error } = await supabase.auth.signUp({
      email: cuenta.email, password: cuenta.password,
    });
    if (error) {
      return { ok: false, error: error.message?.includes('already') ? 'email_en_uso' : error.message };
    }
    sesion = { user: data.user };
  }
  const userId = sesion?.user?.id;
  if (!userId) return { ok: false, error: 'sin_sesion' };

  // 2) Negocio. Nace apagado: lo prende la moderación.
  const { data: neg, error: errNeg } = await supabase
    .from('negocios')
    .insert({
      nombre:      negocio.nombre.trim(),
      descripcion: negocio.descripcion.trim(),
      tipo:        negocio.tipo,
      localidad:   negocio.localidad,
      plan:        'free',        // lo sube crearSuscripcionPro, no el insert
      aprobado:    false,
      activo:      false,
    })
    .select()
    .single();
  if (errNeg) return { ok: false, error: 'negocio' };

  // 3) Perfil. Upsert y no insert: el turista que se convierte ya tiene fila.
  const { error: errPerfil } = await supabase
    .from('perfiles')
    .upsert({ id: userId, negocio_id: neg.id, es_superadmin: false }, { onConflict: 'id' });
  if (errPerfil) return { ok: false, error: 'perfil', negocioId: neg.id };

  // 4) Plan. Dispara alias + créditos del primer mes y el bono del tramo.
  if (codigoPlan) {
    await crearSuscripcionPro(neg.id, { codigoPlan, unidadesDeclaradas });
  }

  return { ok: true, negocioId: neg.id, userId };
}
