// ============================================================
//  src/components/pase/checkoutTokens.js
//  Paleta y helpers compartidos entre CheckoutPaseView y los tres
//  componentes que extrae (ResumenPase, SelectorDuracion, DatosCompra).
//  Un solo lugar para no desincronizar el estilo entre las piezas del
//  mismo checkout — antes vivían duplicados dentro del archivo único.
// ============================================================

// Paleta acotada a la línea de la marca: primary, negro, blanco y los grises
// que se desprenden de ahí. Sin amarillo ni navy — el checkout es la pantalla
// de plata y tiene que leerse sobria.
export const C = {
  primary:     '#475BE1',
  primaryDark: '#3347C8',
  primarySoft: '#EEF0FD',
  ink:         '#0B1020',
  ink2:        '#3D4255',
  muted:       '#6B7280',
  line:        '#E7E9EE',
  bg:          '#F7F7F8',
  font:        "'Inter', system-ui, sans-serif",
};

export const fmt = n => `$${Math.round(Number(n) || 0).toLocaleString('es-AR')}`;
// Redondeo a la centena para que el prorrateo no escupa precios con cifras sueltas.
export const redondear = n => Math.round((Number(n) || 0) / 100) * 100;
export const emailValido = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
// Teléfono opcional: si lo cargan, que al menos tenga 8 dígitos.
export const telValido = v => !v.trim() || v.replace(/\D/g, '').length >= 8;

export const inputSt = {
  width: '100%', boxSizing: 'border-box', padding: '13px 15px', borderRadius: 12,
  border: `1px solid ${C.line}`, fontSize: 15, fontFamily: C.font, color: C.ink,
  outline: 'none', background: '#fff',
};
export const labelSt = { display: 'block', fontSize: 12.5, fontWeight: 700, color: C.ink2, marginBottom: 6 };

// Validación mínima previa a pagar (§D) — "nombre + mail, nada más" para el
// nuevo, sin cuenta; login clásico para el que ya la tiene. Vive acá (no en
// DatosCompra.jsx) porque ese archivo sólo puede exportar el componente:
// mezclar una función ahí rompe el fast refresh.
export function datosCompraValidos({ sesionActiva, esNuevo, nombreUsuario, email, usuario, password, telefono }) {
  if (sesionActiva) return null;
  if (esNuevo) {
    if (!nombreUsuario.trim()) return 'Completá tu nombre.';
    if (!emailValido(email)) return 'Revisá el mail: no parece válido.';
    if (!telValido(telefono || '')) return 'Revisá el teléfono: faltan dígitos.';
    return null;
  }
  if (!usuario.trim()) return 'Escribí tu mail o tu teléfono.';
  if (password.length < 6) return 'La contraseña tiene que tener al menos 6 caracteres.';
  return null;
}
