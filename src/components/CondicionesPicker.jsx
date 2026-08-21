// ============================================================
//  src/components/CondicionesPicker.jsx
//  Selector de condiciones de canje. Lo usan los dos editores de oferta —el
//  alta pública y el panel del socio— contra el mismo catálogo, para que una
//  oferta no signifique cosas distintas según por dónde se cargó.
//
//  Devuelve el TEXTO ya serializado (un renglón por condición) por `onChange`:
//  quien lo usa guarda una string y no tiene que saber nada del formato.
// ============================================================
import { useState } from 'react';
import { condicionesDeCategoria, serializarCondiciones, hidratarCondiciones } from '../lib/condiciones';

export default function CondicionesPicker({ valor = '', categoria = null, onChange, acento = '#475BE1', linea = '#E7E9EE' }) {
  const catalogo = condicionesDeCategoria(categoria);
  // Se hidrata UNA vez: después manda el estado local. Releer `valor` en cada
  // render pelearía con lo que el usuario está tipeando en el campo libre.
  const [estado, setEstado] = useState(() => hidratarCondiciones(valor, categoria));

  const emitir = (next) => {
    setEstado(next);
    onChange?.(serializarCondiciones(next.elegidas, next.valores, next.libre, categoria));
  };

  const toggle = (id) => emitir({ ...estado, elegidas: { ...estado.elegidas, [id]: !estado.elegidas[id] } });
  const setValor = (id, v) => emitir({ ...estado, valores: { ...estado.valores, [id]: v } });
  const setLibre = (v) => emitir({ ...estado, libre: v });

  const elegidas = catalogo.filter(c => estado.elegidas[c.id]).length;
  const total = elegidas + (estado.libre || '').split('\n').filter(s => s.trim()).length;

  return (
    <div>
      <div style={{ display: 'grid', gap: 8 }}>
        {catalogo.map(c => {
          const on = !!estado.elegidas[c.id];
          return (
            <div key={c.id}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                border: `1px solid ${on ? acento : linea}`, borderRadius: 8, cursor: 'pointer',
                background: on ? `${acento}0F` : '#fff', transition: 'all .15s',
              }}>
                <input type="checkbox" checked={on} onChange={() => toggle(c.id)} style={{ accentColor: acento }} />
                <span style={{ fontSize: 13.5, fontWeight: on ? 700 : 500 }}>{c.label}</span>
              </label>
              {/* El campo de detalle aparece sólo con la condición tildada: una
                  fila de inputs vacíos para condiciones que no se eligieron es
                  ruido, y encima invita a completarlos sin tildar nada. */}
              {on && c.valor && (
                <input
                  value={estado.valores[c.id] || ''}
                  onChange={e => setValor(c.id, e.target.value)}
                  placeholder={c.valor}
                  style={{
                    width: '100%', marginTop: 6, padding: '8px 12px',
                    border: `1px solid ${linea}`, borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <textarea
        value={estado.libre}
        onChange={e => setLibre(e.target.value)}
        rows={2}
        placeholder="Otra condición (opcional). Una por renglón."
        style={{
          width: '100%', marginTop: 10, padding: '10px 12px',
          border: `1px solid ${linea}`, borderRadius: 8, fontSize: 13, fontFamily: 'inherit', resize: 'vertical',
        }}
      />

      <div style={{ marginTop: 6, fontSize: 12, color: total > 0 ? '#10A36B' : '#DC2626', fontWeight: 600 }}>
        {total > 0
          ? `${total} condición${total === 1 ? '' : 'es'} — así las va a ver el viajero antes de comprar.`
          : 'Marcá al menos una: es lo único que el viajero lee antes de llegar al mostrador.'}
      </div>
    </div>
  );
}
