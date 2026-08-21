// ============================================================
//  src/components/pase/DatosCompra.jsx
//  Contacto antes de pagar — extraído de CheckoutPaseView (brief checkout
//  2026-08-18, §C/§D). El alta pasó a ser el bloque MÁS CHICO del checkout,
//  no el más grande: `comprarPaseAnonimo()` no pide cuenta (RLS pública en
//  `pase_compras`), así que antes de pagar sólo hace falta lo mínimo para
//  identificar la compra. La contraseña, su repetición y el captcha se
//  mudaron a la pantalla de confirmación post-pago (CheckoutPaseView),
//  sobre un usuario que ya convirtió.
//
//    · Con sesión activa   → cero campos, sólo confirmar el mail.
//    · Nuevo               → nombre + mail. Nada más.
//    · Ya tengo cuenta     → mail/teléfono + contraseña (entra ANTES de
//      pagar porque hace falta loguearlo para vincular la compra al toque;
//      no es el camino que este cambio buscaba aliviar — ya eran 2 campos).
// ============================================================
import { C, inputSt, labelSt } from './checkoutTokens';

export default function DatosCompra({
  sesionActiva,
  esNuevo, setEsNuevo,
  nombreUsuario, setNombreUsuario,
  email, setEmail,
  usuario, setUsuario,
  password, setPassword,
  telefono, setTelefono,
  avisoReset,
  onOlvideLaClave,
}) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 20, padding: 20, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, margin: '4px 0 24px' }}>
        <span style={{ fontSize: 22, fontWeight: 500, fontStyle: 'italic', color: C.primary, letterSpacing: '-0.01em' }}>
          {sesionActiva ? 'Comprando con' : 'Ingresá a'}
        </span>
        <img src="/logo-cuponear.svg" alt="Cuponear" style={{ height: 44, width: 'auto', display: 'block' }} />
      </div>

      {sesionActiva ? (
        // Ya está adentro: no hay nada que pedirle. Sólo confirmarle a quién
        // le va a quedar cargado el pase — es la cuenta de la sesión, no una
        // que tenga que volver a escribir.
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          background: C.bg, borderRadius: 12, padding: '13px 15px',
        }}>
          <span style={{ fontSize: 13.5, color: C.ink2 }}>Se va a cargar en tu cuenta</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>{sesionActiva.user?.email}</span>
        </div>
      ) : (
        <>
          <div role="tablist" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: 4, background: C.bg, borderRadius: 12, marginBottom: 16 }}>
            {[{ id: true, label: 'Soy nuevo' }, { id: false, label: 'Ya tengo cuenta' }].map(t => (
              <button
                key={t.label} role="tab" aria-selected={esNuevo === t.id}
                onClick={() => setEsNuevo(t.id)}
                style={{
                  padding: '13px 10px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: C.font,
                  fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em', transition: 'background .15s, color .15s',
                  background: esNuevo === t.id ? '#fff' : 'transparent',
                  color: esNuevo === t.id ? C.primary : C.ink2,
                  boxShadow: esNuevo === t.id ? '0 1px 3px rgba(11,16,32,0.12)' : 'none',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {esNuevo ? (
            <>
              <div style={{ marginBottom: 14 }}>
                <label style={labelSt} htmlFor="pase-nombre">Nombre</label>
                <input id="pase-nombre" type="text" autoComplete="name"
                  value={nombreUsuario} onChange={e => setNombreUsuario(e.target.value)}
                  placeholder="Tu nombre" style={inputSt}
                  onFocus={e => e.currentTarget.style.borderColor = C.primary}
                  onBlur={e => e.currentTarget.style.borderColor = C.line} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelSt} htmlFor="pase-email">Mail</label>
                <input id="pase-email" type="email" inputMode="email" autoComplete="email"
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="ejemplo@mail.com" style={inputSt}
                  onFocus={e => e.currentTarget.style.borderColor = C.primary}
                  onBlur={e => e.currentTarget.style.borderColor = C.line} />
              </div>
              <div>
                <label style={labelSt} htmlFor="pase-tel">Teléfono <span style={{ fontWeight: 500, color: C.muted }}>(opcional)</span></label>
                <input id="pase-tel" type="tel" inputMode="tel" autoComplete="tel"
                  value={telefono} onChange={e => setTelefono(e.target.value)}
                  placeholder="11 5555 5555" style={inputSt}
                  onFocus={e => e.currentTarget.style.borderColor = C.primary}
                  onBlur={e => e.currentTarget.style.borderColor = C.line} />
              </div>
              <p style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5, margin: '10px 0 0' }}>
                Elegís tu contraseña después de pagar, ya con el pase confirmado.
              </p>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 14 }}>
                <label style={labelSt} htmlFor="pase-usuario">Mail o teléfono</label>
                <input id="pase-usuario" type="text" autoComplete="username"
                  value={usuario} onChange={e => setUsuario(e.target.value)}
                  placeholder="ejemplo@mail.com, ó 1155555555" style={inputSt}
                  onFocus={e => e.currentTarget.style.borderColor = C.primary}
                  onBlur={e => e.currentTarget.style.borderColor = C.line} />
              </div>
              <div>
                <label style={labelSt} htmlFor="pase-pass">Contraseña</label>
                <input id="pase-pass" type="password" autoComplete="current-password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Tu contraseña" style={inputSt}
                  onFocus={e => e.currentTarget.style.borderColor = C.primary}
                  onBlur={e => e.currentTarget.style.borderColor = C.line} />
                <button
                  type="button" onClick={onOlvideLaClave}
                  style={{ background: 'none', border: 'none', padding: '8px 0 0', color: C.primary, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: C.font }}
                >
                  Olvidé mi contraseña
                </button>
                {avisoReset && (
                  <p style={{ fontSize: 12.5, color: C.ink2, margin: '4px 0 0', lineHeight: 1.5 }}>{avisoReset}</p>
                )}
              </div>
              <p style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5, margin: '14px 0 0' }}>
                El pase te queda cargado en tu cuenta, sin hacer nada más.
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}
