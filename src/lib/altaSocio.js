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
//  El negocio nace PUBLICADO (`activo: true`). El socio paga y funciona: no hay
//  moderación previa del negocio. El único control que queda es la aprobación
//  de cada OFERTA (`promociones.aprobada`), que sigue igual.
// ============================================================
import { supabase } from './supabase';
import { existeNegocioConNombre } from './validacionRegistro';
import { crearSuscripcionPro } from './planes';
import { getSession } from './auth';

export const DESC_MIN = 40;

// Errores con nombre: la vista decide el texto, acá no se arma copy.
export const ERRORES_ALTA = {
  nombre_duplicado: 'Ya hay una empresa registrada con ese nombre.',
  email_en_uso:     'Ese mail ya tiene cuenta. Entrá por "Ya tengo cuenta".',
  sin_sesion:       'No pudimos validar tu cuenta. Probá de nuevo.',
  negocio:          'No se pudo registrar la empresa. Probá de nuevo.',
  perfil:           'La cuenta quedó creada pero no pudimos vincular la empresa.',
};

export async function altaSocio({
  negocio,                    // { nombre, tipo, localidad?, descripcion? }
  cuenta,                     // { email, password } — se ignora si ya hay sesión
  persona = null,             // { nombre, apellido, telefono } — sólo en alta nueva
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

  // 2) Negocio. Nace publicado: el alta lo deja operativo en el acto.
  // Del negocio acá va sólo lo que lo identifica —nombre y tipo—: el checkout
  // no le pide la ficha (localidad, descripción, unidades, fotos) a alguien que
  // todavía no pagó. Todo eso se completa después, desde el panel.
  const { data: neg, error: errNeg } = await supabase
    .from('negocios')
    .insert({
      nombre:      negocio.nombre.trim(),
      descripcion: negocio.descripcion?.trim() || null,
      tipo:        negocio.tipo,
      localidad:   negocio.localidad || null,
      plan:        'free',        // lo sube crearSuscripcionPro, no el insert
      aprobado:    true,
      activo:      true,
    })
    .select()
    .single();
  if (errNeg) return { ok: false, error: 'negocio' };

  // 3) Perfil. Upsert y no insert: el turista que se convierte ya tiene fila.
  // Los datos de la PERSONA sólo se escriben en el alta nueva: al que ya tenía
  // cuenta no se le pisa el perfil con lo que puso en este formulario.
  const filaPerfil = { id: userId, negocio_id: neg.id, es_superadmin: false };
  if (persona) {
    Object.assign(filaPerfil, {
      nombre:   persona.nombre?.trim() || null,
      apellido: persona.apellido?.trim() || null,
      telefono: persona.telefono?.trim() || null,
      email:    cuenta?.email?.trim().toLowerCase() || null,
      rol:      'socio',
    });
  }
  const { error: errPerfil } = await supabase
    .from('perfiles')
    .upsert(filaPerfil, { onConflict: 'id' });
  if (errPerfil) return { ok: false, error: 'perfil', negocioId: neg.id };

  // 4) Plan. Dispara alias + créditos del primer mes y el bono del tramo.
  if (codigoPlan) {
    await crearSuscripcionPro(neg.id, { codigoPlan, unidadesDeclaradas });
  }

  return { ok: true, negocioId: neg.id, userId };
}
