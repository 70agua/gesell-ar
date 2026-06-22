// ============================================================
//  src/components/DateRangePicker.jsx
//  Calendario doble de rango de fechas compartido entre
//  HomeView (variant='search') y DetailView (variant='field').
// ============================================================
import React, { useState, useEffect, useRef } from 'react';

const T = {
  primary:     '#2545E6',
  primarySoft: '#EEF1FF',
  ink:         '#0B1020',
  muted:       '#6B7280',
  line:        '#E7E9EE',
  bg:          '#F7F7F8',
  font:        "'Geist', system-ui, sans-serif",
};

const MESES      = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS_SEMANA = ['L','M','X','J','V','S','D'];

const IcoCalendar = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>
);

function getMonthGrid(year, month) {
  const firstDow = new Date(year, month, 1).getDay();
  const startOffset = firstDow === 0 ? 6 : firstDow - 1;
  const total = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(new Date(year, month, d));
  return cells;
}

function nextMo(y, m) { return m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }; }
function prevMo(y, m) { return m === 0  ? { y: y - 1, m: 11 } : { y, m: m - 1 }; }

function fmtShort(d) {
  if (!d) return null;
  return `${d.getDate()}/${d.getMonth() + 1}`;
}
function fmtLong(d) {
  if (!d) return null;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

// ─── Componente principal ─────────────────────────────────────
// value: { desde: Date|null, hasta: Date|null }
// onChange: (newValue) => void
// variant: 'search' (en barra de búsqueda) | 'field' (en formulario)
export default function DateRangePicker({ value, onChange, variant = 'search' }) {
  const [open, setOpen]   = useState(false);
  const [hover, setHover] = useState(null);
  const [base,  setBase]  = useState(() => {
    const d = value?.desde || new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const handleDay = (day) => {
    const { desde, hasta } = value || {};
    if (!desde || (desde && hasta)) {
      onChange({ desde: day, hasta: null });
    } else if (day < desde) {
      onChange({ desde: day, hasta: null });
    } else {
      onChange({ desde, hasta: day });
      setOpen(false);
    }
  };

  const isStart  = d => value?.desde && d.getTime() === value.desde.getTime();
  const isEnd    = d => value?.hasta && d.getTime() === value.hasta.getTime();
  const isInRange= d => {
    if (!value?.desde) return false;
    const end = value.hasta || hover;
    if (!end) return false;
    const [lo, hi] = value.desde <= end ? [value.desde, end] : [end, value.desde];
    return d > lo && d < hi;
  };

  const hasValue = !!(value?.desde || value?.hasta);

  const labelText = () => {
    if (value?.desde && value?.hasta) return `${fmtShort(value.desde)} – ${fmtShort(value.hasta)}`;
    if (value?.desde) return `Desde ${fmtShort(value.desde)}`;
    return 'Cualquier fecha';
  };

  const MonthGrid = ({ y, m }) => {
    const cells = getMonthGrid(y, m);
    return (
      <div style={{ width: 224 }}>
        <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 10 }}>
          {MESES[m]} {y}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1, marginBottom: 4 }}>
          {DIAS_SEMANA.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: T.muted, padding: '2px 0' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={`x${i}`} />;
            const past  = day < today;
            const start = isStart(day);
            const end   = isEnd(day);
            const inRng = isInRange(day);
            const bg    = (start || end) ? T.primary : inRng ? T.primarySoft : 'transparent';
            const color = (start || end) ? '#fff' : past ? '#d0d4de' : inRng ? T.primary : T.ink;
            return (
              <button
                key={day.getTime()}
                disabled={past}
                onClick={() => handleDay(day)}
                onMouseEnter={() => { if (value?.desde && !value?.hasta) setHover(day); }}
                onMouseLeave={() => setHover(null)}
                style={{
                  padding: '5px 0', border: 'none', background: bg, color,
                  borderRadius: (start || end) ? '50%' : inRng ? 0 : 4,
                  fontSize: 12, fontWeight: (start || end) ? 700 : 400,
                  cursor: past ? 'default' : 'pointer', fontFamily: T.font,
                  transition: 'background 0.1s',
                }}
              >{day.getDate()}</button>
            );
          })}
        </div>
      </div>
    );
  };

  const m2 = nextMo(base.y, base.m);

  const popup = open && (
    <div style={{
      position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 1000,
      background: '#fff', border: `1px solid ${T.line}`, borderRadius: 16,
      boxShadow: '0 16px 48px -16px rgba(11,16,32,0.22)',
      padding: '16px 20px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button
          onClick={() => setBase(b => { const p = prevMo(b.y, b.m); return { y: p.y, m: p.m }; })}
          style={{ width: 28, height: 28, border: `1px solid ${T.line}`, borderRadius: 8, background: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', color: T.ink, fontSize: 16 }}
        >‹</button>
        <div />
        <button
          onClick={() => setBase(b => { const n = nextMo(b.y, b.m); return { y: n.y, m: n.m }; })}
          style={{ width: 28, height: 28, border: `1px solid ${T.line}`, borderRadius: 8, background: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', color: T.ink, fontSize: 16 }}
        >›</button>
      </div>
      <div style={{ display: 'flex', gap: 24 }}>
        <MonthGrid y={base.y} m={base.m} />
        <div style={{ width: 1, background: T.line, alignSelf: 'stretch' }} />
        <MonthGrid y={m2.y} m={m2.m} />
      </div>
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: T.muted }}>
          {!value?.desde ? 'Elegí tu fecha de entrada' : !value?.hasta ? 'Ahora la fecha de salida' : `${value.desde.toLocaleDateString('es-AR')} → ${value.hasta.toLocaleDateString('es-AR')}`}
        </span>
        {hasValue && (
          <button
            onClick={() => onChange({ desde: null, hasta: null })}
            style={{ background: 'none', border: 'none', color: T.primary, fontWeight: 600, fontSize: 12, cursor: 'pointer', padding: '4px 8px', borderRadius: 6, fontFamily: T.font }}
          >Borrar fechas</button>
        )}
      </div>
    </div>
  );

  // ── variant='search': trigger inline en la barra de búsqueda ─
  if (variant === 'search') {
    return (
      <div style={{ position: 'relative', borderRight: `1px solid ${T.line}`, flexShrink: 0 }} ref={ref}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{ padding: '14px 18px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 5, width: 178 }}
        >
          <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Fechas</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.primary, display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
            <IcoCalendar />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{labelText()}</span>
          </div>
        </button>
        {popup}
      </div>
    );
  }

  // ── variant='field': trigger como campo de formulario ────────
  const desde = value?.desde ? fmtLong(value.desde) : null;
  const hasta  = value?.hasta  ? fmtLong(value.hasta)  : null;
  const fieldLabel = desde && hasta ? `${desde} → ${hasta}` : desde ? `Desde ${desde}` : 'Elegí las fechas';

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '10px 14px', border: `1px solid ${open ? T.primary : T.line}`,
          borderRadius: 10, background: '#fff', cursor: 'pointer', textAlign: 'left',
          display: 'flex', alignItems: 'center', gap: 10, outline: 'none', transition: 'border-color 0.15s',
        }}
      >
        <span style={{ color: hasValue ? T.primary : T.muted, flexShrink: 0, display: 'flex' }}><IcoCalendar /></span>
        <span style={{ fontSize: 14, fontWeight: hasValue ? 600 : 400, color: hasValue ? T.ink : T.muted }}>{fieldLabel}</span>
      </button>
      {popup}
    </div>
  );
}
