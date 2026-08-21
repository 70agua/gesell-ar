// ============================================================
//  src/views/PaseDebugView.jsx
//  ⚠️ TEMPORAL — panel de prueba de la lógica del Pase (Brief 1).
//  No es UI de producto: sirve para recorrer los flujos con clicks
//  antes de que Brief 2 arme las pantallas reales. BORRAR luego.
//  Se entra por URL: ?pase-debug=1
// ============================================================
import { useState } from 'react';
import {
  getPaseDestino, getOfertasBase, getOfertasPremium,
  comprarPase, activarPase, upgradePaseB2C,
  activarRegalo, elegirPremium, getElecciones,
  canjearPase, getCanjes, getAhorroPase, getMisPases,
  getBloquePase,
} from '../lib/pases';

const box   = { border: '1px solid #E4DACA', borderRadius: 12, padding: 16, marginBottom: 16, background: '#fff' };
const btn   = { padding: '8px 14px', margin: '4px 6px 4px 0', border: '1px solid #123B47', borderRadius: 8, background: '#123B47', color: '#fff', cursor: 'pointer', fontSize: 13 };
const btn2  = { ...btn, background: '#fff', color: '#123B47' };
const inp   = { padding: '6px 10px', border: '1px solid #ccc', borderRadius: 6, fontSize: 13, marginRight: 8 };
const h3s   = { margin: '0 0 10px', color: '#123B47', fontSize: 16 };

// Ref de pago mock (fuera del componente: no ensuciar el render con Date.now)
const nuevoRef = (prefijo) => `${prefijo}-${Date.now()}`;

export default function PaseDebugView({ session, perfil, onBack }) {
  const userId = session?.user?.id || null;

  const [misPases, setMisPases] = useState([]);
  const [paseSel, setPaseSel]   = useState('');
  const [base, setBase]         = useState([]);
  const [premium, setPremium]   = useState([]);
  const [baseSel, setBaseSel]       = useState('');
  const [premiumSel, setPremiumSel] = useState('');
  const [negocioId, setNegocioId]   = useState(perfil?.negocio_id || '');
  const [log, setLog]           = useState([]);

  const registrar = (etiqueta, data) =>
    setLog(l => [{ t: new Date().toLocaleTimeString(), etiqueta, data }, ...l].slice(0, 40));

  const run = (etiqueta, fn) => async () => {
    try {
      const r = await fn();
      registrar(etiqueta, r);
    } catch (e) {
      registrar(etiqueta + ' — EXCEPTION', String(e?.message || e));
    }
  };

  const cargarPase = run('getPaseDestino', () => getPaseDestino());
  const cargarMisPases = run('getMisPases', async () => {
    const p = await getMisPases(userId); setMisPases(p);
    if (p[0]) setPaseSel(p[0].id);
    return p.map(x => ({ id: x.id, tipo: x.tipo, estado: x.estado, upgrade: x.upgrade_aplicado, vence: x.vence_el }));
  });
  const cargarBase = run('getOfertasBase', async () => {
    const b = await getOfertasBase(); setBase(b); if (b[0]) setBaseSel(b[0].id);
    return b.map(x => ({ id: x.id, title: x.title, ahorro: x.ahorroEstimado, tipo: x.negocioTipo }));
  });
  const cargarPremium = run('getOfertasPremium', async () => {
    const p = await getOfertasPremium({ soloConCupo: false }); setPremium(p); if (p[0]) setPremiumSel(p[0].id);
    return p.map(x => ({ id: x.id, title: x.title, ahorro: x.ahorroEstimado, cupo: x.cupoMensualPremium, restante: x.cupoRestante }));
  });

  if (!userId) {
    return (
      <div style={{ maxWidth: 720, margin: '40px auto', padding: 20 }}>
        <h2 style={{ color: '#123B47' }}>Panel de prueba del Pase</h2>
        <p>Necesitás estar logueado (las funciones usan <code>auth.uid()</code>). Iniciá sesión y volvé a entrar con <code>?pase-debug=1</code>.</p>
        <button style={btn} onClick={onBack}>← Volver</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 860, margin: '24px auto', padding: 20, fontSize: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h2 style={{ color: '#123B47', margin: 0 }}>🧪 Panel de prueba — Pase</h2>
        <button style={btn2} onClick={onBack}>← Volver a la app</button>
      </div>
      <p style={{ color: '#8a6', margin: '0 0 16px' }}>
        Temporal. user: <code>{userId.slice(0, 8)}…</code>{perfil?.negocio_id ? ` · negocio: ${perfil.negocio_id.slice(0, 8)}…` : ' · (sin negocio)'}
      </p>

      <div style={box}>
        <h3 style={h3s}>1 · Catálogo y capas (query en vivo)</h3>
        <button style={btn} onClick={cargarPase}>getPaseDestino</button>
        <button style={btn} onClick={cargarBase}>getOfertasBase (≤$15k)</button>
        <button style={btn} onClick={cargarPremium}>getOfertasPremium (&gt;$15k)</button>
      </div>

      <div style={box}>
        <h3 style={h3s}>2 · Compra / activación (MOCK)</h3>
        <button style={btn} onClick={run('comprarPase', () => comprarPase({ userId, pagoRef: nuevoRef('mock') }))}>comprarPase (+500)</button>
        <button style={btn} onClick={cargarMisPases}>getMisPases ↻</button>
        <div style={{ marginTop: 10 }}>
          Pase activo:&nbsp;
          <select style={inp} value={paseSel} onChange={e => setPaseSel(e.target.value)}>
            <option value="">— elegí un pase —</option>
            {misPases.map(p => <option key={p.id} value={p.id}>{p.tipo}/{p.estado}{p.upgrade_aplicado ? '/upg' : ''} · {p.id.slice(0, 8)}</option>)}
          </select>
          <button style={btn2} disabled={!paseSel} onClick={run('activarPase', () => activarPase(paseSel).then(r => (cargarMisPases(), r)))}>activarPase</button>
          <button style={btn2} disabled={!paseSel} onClick={run('upgradePaseB2C', () => upgradePaseB2C({ usuarioPaseId: paseSel, userId, pagoRef: nuevoRef('upg') }).then(r => (cargarMisPases(), r)))}>upgradeB2C (+300)</button>
        </div>
        <div style={{ marginTop: 10 }}>
          Regalo desde negocio:&nbsp;
          <input style={inp} placeholder="origen_negocio_id (uuid)" value={negocioId} onChange={e => setNegocioId(e.target.value)} size={38} />
          <button style={btn2} disabled={!negocioId} onClick={run('activarRegalo', () => activarRegalo({ origenNegocioId: negocioId }).then(r => (cargarMisPases(), r)))}>activarRegalo</button>
        </div>
      </div>

      <div style={box}>
        <h3 style={h3s}>3 · Elección premium y canje</h3>
        <div>
          Oferta premium:&nbsp;
          <select style={inp} value={premiumSel} onChange={e => setPremiumSel(e.target.value)}>
            <option value="">— cargá premium arriba —</option>
            {premium.map(p => <option key={p.id} value={p.id}>{p.title} · ${p.ahorroEstimado} · cupo {p.cupoRestante ?? '—'}</option>)}
          </select>
          <button style={btn} disabled={!paseSel || !premiumSel} onClick={run('elegirPremium', () => elegirPremium(paseSel, premiumSel))}>elegirPremium</button>
          <button style={btn2} disabled={!paseSel} onClick={run('getElecciones', () => getElecciones(paseSel).then(e => e.map(x => x.promo?.title)))}>getElecciones</button>
        </div>
        <div style={{ marginTop: 10 }}>
          Oferta a canjear:&nbsp;
          <select style={inp} value={baseSel} onChange={e => setBaseSel(e.target.value)}>
            <option value="">— base —</option>
            {base.map(p => <option key={p.id} value={p.id}>[base] {p.title} · ${p.ahorroEstimado}</option>)}
            {premium.map(p => <option key={p.id} value={p.id}>[prem] {p.title} · ${p.ahorroEstimado}</option>)}
          </select>
          <button style={btn} disabled={!paseSel || !baseSel} onClick={run('canjearPase', () => canjearPase({ usuarioPaseId: paseSel, userId, promocionId: baseSel }))}>canjearPase (+100)</button>
        </div>
        <div style={{ marginTop: 10 }}>
          <button style={btn2} disabled={!paseSel} onClick={run('getCanjes', () => getCanjes(paseSel))}>getCanjes</button>
          <button style={btn2} disabled={!paseSel} onClick={run('getAhorroPase 💰', () => getAhorroPase(paseSel).then(v => 'Ahorraste $' + v.toLocaleString('es-AR')))}>getAhorroPase</button>
        </div>
      </div>

      <div style={box}>
        <h3 style={h3s}>4 · Panel del socio (negocio)</h3>
        <input style={inp} placeholder="negocio_id" value={negocioId} onChange={e => setNegocioId(e.target.value)} size={38} />
        <div style={{ marginTop: 8 }}>
          <button style={btn2} disabled={!negocioId} onClick={run('getBloquePase', () => getBloquePase(negocioId))}>bloque pase (alias/cupo/packs)</button>
        </div>
      </div>

      <div style={box}>
        <h3 style={h3s}>Resultados</h3>
        {log.length === 0 && <p style={{ color: '#999' }}>Todavía nada. Empezá por el bloque 1.</p>}
        {log.map((e, i) => (
          <div key={i} style={{ borderBottom: '1px solid #eee', padding: '6px 0', fontFamily: 'monospace', fontSize: 12 }}>
            <b style={{ color: '#0E8C7F' }}>{e.t} · {e.etiqueta}</b>
            <pre style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap', color: '#333' }}>{JSON.stringify(e.data, null, 2)}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
