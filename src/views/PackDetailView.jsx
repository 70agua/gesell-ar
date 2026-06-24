// ============================================================
//  src/views/PackDetailView.jsx — Layout editorial tipo revista
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronRight, ChevronLeft, Star, Heart, Share2,
  Check, Ticket, Users, ShieldCheck, Gift,
  Zap, Clock, MapPin, Flag, ArrowRight,
} from 'lucide-react';
import { CoinSVG } from '../components/Token';
import { ALL_PROMOS } from '../data/mockData';

// ─── Design tokens ───────────────────────────────────────────
const C = {
  primary:     '#2545E6',
  primarySoft: '#EEF1FF',
  primaryDark: '#1731B8',
  ink:         '#0B1020',
  ink2:        '#3D4255',
  muted:       '#6B7280',
  line:        '#E7E9EE',
  bg:          '#F7F7F8',
  green:       '#10A36B',
  yellow:      '#FFC93C',
};

// ─── Badge palette por tipo de pack ──────────────────────────
const BADGE_PALETTE = {
  'Más Vendido':  { accent: '#E63946', accentSoft: '#FEE2E2', accentDark: '#B91C1C' },
  'Eco-Aventura': { accent: '#059669', accentSoft: '#D1FAE5', accentDark: '#065F46' },
  'Gourmet':      { accent: '#D97706', accentSoft: '#FEF3C7', accentDark: '#92400E' },
};
const DEFAULT_PALETTE = { accent: C.primary, accentSoft: C.primarySoft, accentDark: C.primaryDark };

// ─── Calendar helpers ────────────────────────────────────────
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAY_NAMES   = ['Lu','Ma','Mi','Ju','Vi','Sá','Do'];

// ─── DatePickerField ─────────────────────────────────────────
function DatePickerField({ label, value, onChange, minDate }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const minD  = minDate ? new Date(minDate) : today; minD.setHours(0,0,0,0);
  const [open, setOpen]           = useState(false);
  const [viewYear, setViewYear]   = useState((value || minD).getFullYear());
  const [viewMonth, setViewMonth] = useState((value || minD).getMonth());
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const fmt = d => d ? d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : null;
  const prevMonth = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y=>y-1)) : setViewMonth(m=>m-1);
  const nextMonth = () => viewMonth === 11 ? (setViewMonth(0), setViewYear(y=>y+1)) : setViewMonth(m=>m+1);
  const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();
  const startOffset = (new Date(viewYear, viewMonth, 1).getDay()+6)%7;
  const cells = [...Array(startOffset).fill(null), ...Array.from({length:daysInMonth},(_,i)=>i+1)];
  while (cells.length%7!==0) cells.push(null);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={()=>setOpen(o=>!o)}
        className="w-full px-4 py-3 rounded-xl text-left cursor-pointer transition-colors"
        style={{ border:`1px solid ${open?'rgba(255,255,255,0.6)':'rgba(255,255,255,0.2)'}`, background:'rgba(255,255,255,0.08)', color:'#fff' }}>
        <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color:'rgba(255,255,255,0.55)' }}>{label}</div>
        <div className="text-[14px] font-semibold">{fmt(value) || 'Seleccioná fecha'}</div>
      </button>
      {open && (
        <div className="absolute z-50 bg-white rounded-2xl p-3"
          style={{ top:'calc(100% + 8px)', left:0, width:272, border:`1px solid ${C.line}`, boxShadow:'0 20px 48px -16px rgba(11,16,32,0.28)' }}>
          <div className="flex items-center justify-between mb-2 px-1">
            <button type="button" onClick={prevMonth} className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer border-0" style={{background:C.bg}}><ChevronLeft size={14} color={C.ink2}/></button>
            <span className="text-[13px] font-bold" style={{color:C.ink}}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth} className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer border-0" style={{background:C.bg}}><ChevronRight size={14} color={C.ink2}/></button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {DAY_NAMES.map(d=><div key={d} className="text-center text-[11px] font-bold py-0.5" style={{color:C.muted}}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day,i)=>{
              if(!day) return <div key={i}/>;
              const date=new Date(viewYear,viewMonth,day);
              const isPast=date<minD, isSel=value&&value.toDateString()===date.toDateString(), isToday=date.toDateString()===today.toDateString();
              return (
                <button key={i} type="button" onClick={()=>{if(!isPast){onChange(date);setOpen(false);}}}
                  className="h-8 w-full rounded-lg text-[13px] border-0 flex items-center justify-center"
                  style={{ background:isSel?C.primary:isToday?C.primarySoft:'transparent', color:isPast?'#D1D5DB':isSel?'#fff':isToday?C.primary:C.ink, fontWeight:isSel||isToday?700:500, cursor:isPast?'default':'pointer' }}>
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GuestsSelectorField ─────────────────────────────────────
function GuestsSelectorField({ adultos, setAdultos, ninos, setNinos, bebes, setBebes }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(()=>{
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener('mousedown',h);
    return ()=>document.removeEventListener('mousedown',h);
  },[]);

  const summary = ()=>{
    const p=[`${adultos} adulto${adultos!==1?'s':''}`];
    if(ninos>0) p.push(`${ninos} niño${ninos!==1?'s':''}`);
    if(bebes>0) p.push(`${bebes} bebé${bebes!==1?'s':''}`);
    return p.join(' · ');
  };

  const Spin=({val,onDec,onInc,minVal=0,maxVal=16})=>(
    <div className="flex items-center gap-3">
      <button type="button" onClick={onDec} disabled={val<=minVal}
        className="w-8 h-8 rounded-full flex items-center justify-center border cursor-pointer font-bold text-lg"
        style={{borderColor:val<=minVal?C.line:C.ink2,color:val<=minVal?C.muted:C.ink,background:'#fff'}}>−</button>
      <span className="w-5 text-center text-[15px] font-semibold" style={{color:C.ink}}>{val}</span>
      <button type="button" onClick={onInc} disabled={val>=maxVal}
        className="w-8 h-8 rounded-full flex items-center justify-center border cursor-pointer font-bold text-lg"
        style={{borderColor:val>=maxVal?C.line:C.ink2,color:val>=maxVal?C.muted:C.ink,background:'#fff'}}>+</button>
    </div>
  );

  const rows=[
    {label:'Adultos',sub:null,val:adultos,dec:()=>setAdultos(v=>Math.max(1,v-1)),inc:()=>setAdultos(v=>Math.min(16,v+1)),min:1},
    {label:'Niños',sub:'2 – 12 años',val:ninos,dec:()=>setNinos(v=>Math.max(0,v-1)),inc:()=>setNinos(v=>Math.min(8,v+1))},
    {label:'Bebés',sub:'Menores de 2 años',val:bebes,dec:()=>setBebes(v=>Math.max(0,v-1)),inc:()=>setBebes(v=>Math.min(4,v+1))},
  ];

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={()=>setOpen(o=>!o)}
        className="w-full px-4 py-3 rounded-xl text-left cursor-pointer transition-colors"
        style={{border:`1px solid ${open?'rgba(255,255,255,0.6)':'rgba(255,255,255,0.2)'}`,background:'rgba(255,255,255,0.08)',color:'#fff'}}>
        <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{color:'rgba(255,255,255,0.55)'}}>PERSONAS</div>
        <div className="flex items-center gap-1.5 text-[14px] font-semibold">
          <Users size={14} style={{opacity:.6}}/> {summary()}
        </div>
      </button>
      {open && (
        <div className="absolute z-50 bg-white rounded-2xl overflow-hidden"
          style={{top:'calc(100% + 8px)',left:0,right:0,border:`1px solid ${C.line}`,boxShadow:'0 20px 48px -16px rgba(11,16,32,0.28)'}}>
          {rows.map((r,i)=>(
            <div key={r.label} className="flex items-center justify-between px-4 py-3"
              style={{borderBottom:i<rows.length-1?`1px solid ${C.line}`:'none'}}>
              <div>
                <div className="text-[14px] font-semibold" style={{color:C.ink}}>{r.label}</div>
                {r.sub&&<div className="text-[11px]" style={{color:C.muted}}>{r.sub}</div>}
              </div>
              <Spin val={r.val} onDec={r.dec} onInc={r.inc} minVal={r.min||0}/>
            </div>
          ))}
          <div className="px-4 py-3 flex justify-end" style={{borderTop:`1px solid ${C.line}`}}>
            <button type="button" onClick={()=>setOpen(false)}
              className="px-5 py-2 rounded-[10px] text-[13px] font-bold text-white cursor-pointer border-0"
              style={{background:C.primary}}>Confirmar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Datos editoriales del pack ──────────────────────────────
const PACK_DATA = {
  includes: [
    {icon:'🏨', label:'Alojamiento',   detail:'2 noches en hotel o cabaña seleccionada'},
    {icon:'🍽️', label:'Cena para 2',   detail:'En restaurante afiliado a Cuponear'},
    {icon:'💆', label:'Circuito Spa',  detail:'2hs de termas e hidromasaje'},
    {icon:'🥂', label:'Bienvenida',    detail:'Espumante en la habitación'},
    {icon:'🚗', label:'Estacionamiento',detail:'Sin cargo toda la estadía'},
    {icon:'🎁', label:'Cupones',       detail:'Descuentos en gastronomía local'},
  ],
  timeline: [
    {
      dia:'Día 1', emoji:'🌅', title:'Llegada y primer brindis',
      body:'Llegás, dejás el equipaje y encontrás el espumante esperándote. La tarde es tuya — playa, paseo o el spa si querés arrancar relajado/a.',
      image:'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    },
    {
      dia:'Día 2', emoji:'✨', title:'El día que recordarás',
      body:'Desayuno en el hotel y mañana de spa completo. A la tarde, la ciudad es tuya con los cupones en mano. Por la noche, la cena romántica te espera.',
      image:'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    },
    {
      dia:'Día 3', emoji:'👋', title:'El último desayuno y el mar',
      body:'Check-out sin apuro hasta las 10. Los cupones siguen vigentes — aprovechá el último café frente al mar antes de volver.',
      image:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    },
  ],
  review: {
    nombre:'Valentina M.',
    ciudad:'Buenos Aires',
    stars:5,
    texto:'Fue todo exactamente como lo prometían. El spa fue un lujo, la cena increíble y el hotel espectacular. Lo único que lamentamos es no haber reservado más días.',
    avatar:'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
  },
};

// ─── Bonus cupones (gastronomía) ─────────────────────────────
const BONUS = ALL_PROMOS.filter(p => p.categoria === 'salidas').slice(0, 3);

// ═══════════════════════════════════════════════════════════
//  MAIN — PackDetailView
// ═══════════════════════════════════════════════════════════
export default function PackDetailView({ pack, onBack, onOpenOferta }) {
  if (!pack) return null;

  const palette      = BADGE_PALETTE[pack.badge] || DEFAULT_PALETTE;
  const images       = pack.images?.length ? pack.images : ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'];
  const mainImg      = images[0];
  const sideImgs     = images.slice(1, 3);

  const precioOriginal = Math.round((pack.price || 145000) * 1.25);
  const precioFinal    = pack.price || 145000;
  const ahorro         = precioOriginal - precioFinal;
  const descPct        = Math.round((ahorro / precioOriginal) * 100);

  // Booking state
  const [checkin,  setCheckin]  = useState(null);
  const [checkout, setCheckout] = useState(null);
  const checkoutMin = checkin ? new Date(checkin.getTime()+86_400_000) : new Date();
  const [adultos,  setAdultos]  = useState(2);
  const [ninos,    setNinos]    = useState(0);
  const [bebes,    setBebes]    = useState(0);

  return (
    <div style={{ minHeight:'100vh', background:'#fff', fontFamily:"'Inter', system-ui, sans-serif", color:C.ink, paddingTop:70 }}>

      {/* ══════════════════════════════════════════════════════
          HERO — editorial, imagen + titular
      ════════════════════════════════════════════════════════ */}
      <section style={{ background:C.ink, color:'#fff', overflow:'hidden', position:'relative' }}>

        {/* Imagen de fondo con overlay */}
        <div style={{ position:'absolute', inset:0 }}>
          <img src={mainImg} alt={pack.title} style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.35 }}/>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, rgba(11,16,32,0.9) 0%, rgba(11,16,32,0.55) 60%, rgba(11,16,32,0.2) 100%)' }}/>
        </div>

        <div style={{ position:'relative', maxWidth:1328, margin:'0 auto', padding:'64px 40px 72px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center' }}>

            {/* LEFT — título editorial */}
            <div>
              {/* Breadcrumb */}
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'rgba(255,255,255,0.5)', marginBottom:28 }}>
                <button onClick={onBack} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.7)', fontSize:13, fontWeight:600, cursor:'pointer', padding:0 }}>Packs</button>
                <ChevronRight size={12}/>
                <span style={{ color:'rgba(255,255,255,0.9)' }}>{pack.title}</span>
              </div>

              {/* Badge */}
              {pack.badge && (
                <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:999, fontSize:11, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:20, background: palette.accentSoft, color: palette.accent }}>
                  <Star size={10} fill={palette.accent} color={palette.accent}/> {pack.badge}
                </div>
              )}

              {/* Headline */}
              <h1 style={{ fontSize:'clamp(40px, 5vw, 64px)', fontWeight:900, letterSpacing:'-0.03em', lineHeight:1.0, margin:'0 0 8px', color:'#fff' }}>
                {pack.title}
              </h1>
              <p style={{ fontSize:20, fontWeight:500, color:'rgba(255,255,255,0.65)', margin:'0 0 32px', lineHeight:1.4 }}>
                {pack.subtitle}
              </p>

              {/* Stats row */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:20, marginBottom:36 }}>
                {[
                  {icon:<Star size={14} fill={C.yellow} color={C.yellow}/>, label:'4.9', sub:'(128 reseñas)'},
                  {icon:<span style={{fontSize:14}}>🌅</span>, label:'3 días / 2 noches'},
                  {icon:<Users size={14} color='rgba(255,255,255,0.6)'/>, label:'Hasta 4 personas'},
                  {icon:<Check size={13} color={C.green} strokeWidth={2.5}/>, label:'Pack verificado', color:C.green},
                ].map((s,i)=>(
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:500, color: s.color || 'rgba(255,255,255,0.8)' }}>
                    {s.icon} {s.label}
                    {s.sub && <span style={{ color:'rgba(255,255,255,0.4)', fontWeight:400 }}>{s.sub}</span>}
                  </div>
                ))}
              </div>

              {/* Precio + CTA */}
              <div style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
                <div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>Pack completo desde</div>
                  <div style={{ display:'flex', alignItems:'baseline', gap:10 }}>
                    <span style={{ fontSize:40, fontWeight:900, letterSpacing:'-0.03em', color:'#fff' }}>${precioFinal.toLocaleString('es-AR')}</span>
                    <span style={{ fontSize:15, textDecoration:'line-through', color:'rgba(255,255,255,0.35)' }}>${precioOriginal.toLocaleString('es-AR')}</span>
                    <span style={{ fontSize:12, fontWeight:700, padding:'3px 8px', borderRadius:999, background: palette.accentSoft, color: palette.accent }}>-{descPct}%</span>
                  </div>
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button
                    onClick={()=>document.getElementById('pack-reserva')?.scrollIntoView({behavior:'smooth'})}
                    style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'13px 24px', borderRadius:14, fontSize:15, fontWeight:700, cursor:'pointer', border:'none', background:'#fff', color:C.ink }}>
                    Reservar <ArrowRight size={16}/>
                  </button>
                  <button style={{ display:'flex', alignItems:'center', gap:6, padding:'13px 16px', borderRadius:14, fontSize:13, fontWeight:500, cursor:'pointer', border:'1px solid rgba(255,255,255,0.2)', background:'transparent', color:'#fff' }}>
                    <Heart size={15}/>
                  </button>
                  <button style={{ display:'flex', alignItems:'center', gap:6, padding:'13px 16px', borderRadius:14, fontSize:13, fontWeight:500, cursor:'pointer', border:'1px solid rgba(255,255,255,0.2)', background:'transparent', color:'#fff' }}>
                    <Share2 size={15}/>
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT — mosaico de fotos */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gridTemplateRows:'220px 180px', gap:8 }}>
              {/* Imagen principal — ocupa ambas filas en columna izquierda */}
              <div style={{ gridRow:'1 / span 2', borderRadius:20, overflow:'hidden', position:'relative' }}>
                <img src={mainImg} alt="Pack" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              </div>
              {/* Miniaturas */}
              {[0,1].map(i=>(
                <div key={i} style={{ borderRadius:16, overflow:'hidden', position:'relative' }}>
                  <img src={sideImgs[i] || mainImg} alt={`Foto ${i+2}`} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          QUÉ INCLUYE — chips visuales
      ════════════════════════════════════════════════════════ */}
      <section style={{ background:'#fff', borderBottom:`1px solid ${C.line}` }}>
        <div style={{ maxWidth:1328, margin:'0 auto', padding:'0 40px' }}>
          <div style={{ display:'flex', gap:0, overflowX:'auto', scrollbarWidth:'none' }}>
            {PACK_DATA.includes.map((item,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'20px 24px', borderRight:`1px solid ${C.line}`, flexShrink:0 }}>
                <span style={{ fontSize:22 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:C.ink, lineHeight:1 }}>{item.label}</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:2, whiteSpace:'nowrap' }}>{item.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          DESCRIPCIÓN — intro editorial
      ════════════════════════════════════════════════════════ */}
      <section style={{ background:'#fff' }}>
        <div style={{ maxWidth:1328, margin:'0 auto', padding:'72px 40px 0' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, alignItems:'start' }}>
            <div>
              <div style={{ fontSize:11, fontWeight:800, color:C.primary, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:14 }}>
                El pack
              </div>
              <h2 style={{ fontSize:'clamp(30px,4vw,48px)', fontWeight:900, letterSpacing:'-0.025em', lineHeight:1.1, margin:'0 0 20px' }}>
                Todo listo para que solo pienses en disfrutar
              </h2>
            </div>
            <div style={{ paddingTop:8 }}>
              <p style={{ fontSize:17, lineHeight:1.7, color:C.ink2, margin:0 }}>
                {pack.description ||
                  'Armamos este pack para que no pierdas tiempo organizando. Alojamiento verificado, restaurante reservado y spa esperándote. Llegás y todo ya está. Así de simple.'}
              </p>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:20, fontSize:14, fontWeight:600, color:C.green }}>
                <Check size={16} strokeWidth={2.5}/> Ahorrás ${ahorro.toLocaleString('es-AR')} vs contratar por separado
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TU VIAJE DÍA A DÍA — estilo revista
      ════════════════════════════════════════════════════════ */}
      <section style={{ background:'#fff', padding:'72px 0 80px' }}>
        <div style={{ maxWidth:1328, margin:'0 auto', padding:'0 40px' }}>

          {/* Header sección */}
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:40 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:800, color:C.primary, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>
                Tu viaje
              </div>
              <h2 style={{ fontSize:'clamp(28px,3.5vw,42px)', fontWeight:900, letterSpacing:'-0.025em', margin:0 }}>
                Así son tus {PACK_DATA.timeline.length} días
              </h2>
            </div>
          </div>

          {/* Card grande (Día 1) + columna lateral (Días 2 y 3) */}
          <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:16, alignItems:'stretch' }}>

            {/* Día 1 — featured grande */}
            <div style={{ borderRadius:24, overflow:'hidden', position:'relative', minHeight:480, background:C.ink }}>
              <img src={PACK_DATA.timeline[0].image} alt={PACK_DATA.timeline[0].title}
                style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.6 }}/>
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(11,16,32,0.95) 0%, rgba(11,16,32,0.4) 50%, transparent 100%)' }}/>
              <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:36 }}>
                <div style={{ fontSize:11, fontWeight:700, color: palette.accentSoft, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>
                  {PACK_DATA.timeline[0].emoji} {PACK_DATA.timeline[0].dia}
                </div>
                <h3 style={{ fontSize:28, fontWeight:800, color:'#fff', margin:'0 0 12px', letterSpacing:'-0.02em' }}>
                  {PACK_DATA.timeline[0].title}
                </h3>
                <p style={{ fontSize:15, color:'rgba(255,255,255,0.75)', lineHeight:1.6, margin:0 }}>
                  {PACK_DATA.timeline[0].body}
                </p>
              </div>
            </div>

            {/* Días 2 y 3 — apilados */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {PACK_DATA.timeline.slice(1).map((dia, i)=>(
                <div key={i} style={{ borderRadius:20, overflow:'hidden', position:'relative', flex:1, minHeight:220, background:C.ink }}>
                  <img src={dia.image} alt={dia.title}
                    style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.55 }}/>
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(11,16,32,0.92) 0%, rgba(11,16,32,0.3) 60%, transparent 100%)' }}/>
                  <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:24 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.55)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>
                      {dia.emoji} {dia.dia}
                    </div>
                    <h3 style={{ fontSize:20, fontWeight:800, color:'#fff', margin:'0 0 6px', letterSpacing:'-0.015em' }}>
                      {dia.title}
                    </h3>
                    <p style={{ fontSize:13, color:'rgba(255,255,255,0.7)', lineHeight:1.55, margin:0 }}>
                      {dia.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TESTIMONIAL — lo que dicen
      ════════════════════════════════════════════════════════ */}
      <section style={{ background:C.bg, borderTop:`1px solid ${C.line}`, borderBottom:`1px solid ${C.line}` }}>
        <div style={{ maxWidth:1328, margin:'0 auto', padding:'72px 40px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:64, alignItems:'center' }}>
            <div>
              <div style={{ fontSize:11, fontWeight:800, color:C.primary, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:14 }}>Lo que dicen</div>
              <h2 style={{ fontSize:'clamp(24px,3vw,38px)', fontWeight:900, letterSpacing:'-0.025em', margin:'0 0 8px' }}>
                Quienes ya viajaron
              </h2>
              <p style={{ fontSize:15, color:C.muted, margin:0 }}>Reseñas verificadas de turistas reales.</p>
            </div>
            <div style={{ background:'#fff', borderRadius:24, padding:32, border:`1px solid ${C.line}` }}>
              <div style={{ display:'flex', gap:4, marginBottom:16 }}>
                {[...Array(5)].map((_,i)=><Star key={i} size={18} fill={C.yellow} color={C.yellow}/>)}
              </div>
              <blockquote style={{ fontSize:18, fontWeight:500, lineHeight:1.65, color:C.ink, margin:'0 0 24px', fontStyle:'italic' }}>
                "{PACK_DATA.review.texto}"
              </blockquote>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <img src={PACK_DATA.review.avatar} alt={PACK_DATA.review.nombre}
                  style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover' }}/>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:C.ink }}>{PACK_DATA.review.nombre}</div>
                  <div style={{ fontSize:12, color:C.muted }}>{PACK_DATA.review.ciudad}</div>
                </div>
                <div style={{ marginLeft:'auto', fontSize:12, fontWeight:600, color:C.green, display:'flex', alignItems:'center', gap:4 }}>
                  <Check size={13} strokeWidth={2.5}/> Reseña verificada
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          BONUS CUPONES
      ════════════════════════════════════════════════════════ */}
      {BONUS.length > 0 && (
        <section style={{ background:'#fff', padding:'72px 0' }}>
          <div style={{ maxWidth:1328, margin:'0 auto', padding:'0 40px' }}>
            <div style={{ marginBottom:36 }}>
              <div style={{ fontSize:11, fontWeight:800, color:C.primary, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>
                Bonus incluido
              </div>
              <h2 style={{ fontSize:'clamp(24px,3vw,38px)', fontWeight:900, letterSpacing:'-0.025em', margin:0 }}>
                Cupones de regalo con tu pack
              </h2>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16 }}>
              {BONUS.map(p=>(
                <div
                  key={p.id}
                  onClick={()=>onOpenOferta&&onOpenOferta(p)}
                  style={{ borderRadius:20, overflow:'hidden', cursor:'pointer', border:`1px solid ${C.line}`, transition:'transform 0.15s, box-shadow 0.15s' }}
                  onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow='0 16px 40px rgba(11,16,32,0.12)';}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none';}}
                >
                  <div style={{ position:'relative', height:160 }}>
                    <img src={p.image||p.imagen_url} alt={p.title||p.titulo} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(11,16,32,0.7) 0%, transparent 60%)' }}/>
                    <div style={{ position:'absolute', bottom:12, left:14, fontSize:28, fontWeight:900, color:'#fff', letterSpacing:'-0.02em' }}>{p.badge}</div>
                    {p.offerType==='Flash'&&(
                      <div style={{ position:'absolute', top:12, left:12, display:'flex', alignItems:'center', gap:4, padding:'4px 8px', borderRadius:999, fontSize:10, fontWeight:700, background:'#EF4444', color:'#fff' }}>
                        <Zap size={9}/> Flash
                      </div>
                    )}
                  </div>
                  <div style={{ padding:'14px 16px 16px' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:C.ink, marginBottom:4, lineHeight:1.3 }}>{p.title||p.titulo}</div>
                    <div style={{ fontSize:11, color:C.muted }}>{p.proveedorNombre||''}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:10, fontSize:12, fontWeight:600, color:C.primary }}>
                      Ver oferta <ChevronRight size={13}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          CTA — reserva, fondo oscuro estilo revista
      ════════════════════════════════════════════════════════ */}
      <section id="pack-reserva" style={{ background:C.ink, color:'#fff', position:'relative', overflow:'hidden' }}>
        {/* Imagen fondo sutil */}
        <div style={{ position:'absolute', inset:0 }}>
          <img src={mainImg} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.12 }}/>
        </div>

        <div style={{ position:'relative', maxWidth:1328, margin:'0 auto', padding:'80px 40px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:72, alignItems:'start' }}>

            {/* LEFT — copy */}
            <div>
              <div style={{ fontSize:11, fontWeight:800, color: palette.accentSoft === C.primarySoft ? 'rgba(255,255,255,0.5)' : palette.accentSoft, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>
                Reservá tu pack
              </div>
              <h2 style={{ fontSize:'clamp(32px,4vw,52px)', fontWeight:900, letterSpacing:'-0.03em', lineHeight:1.0, margin:'0 0 20px' }}>
                Tu escapada a Villa Gesell te espera
              </h2>
              <p style={{ fontSize:16, color:'rgba(255,255,255,0.6)', lineHeight:1.65, margin:'0 0 32px' }}>
                No pagás hasta que confirmemos disponibilidad. Te avisamos en menos de 2 horas.
              </p>

              {/* Precio destacado */}
              <div style={{ display:'flex', alignItems:'baseline', gap:14, marginBottom:8 }}>
                <span style={{ fontSize:48, fontWeight:900, letterSpacing:'-0.03em' }}>${precioFinal.toLocaleString('es-AR')}</span>
                <div>
                  <div style={{ fontSize:14, textDecoration:'line-through', color:'rgba(255,255,255,0.35)' }}>${precioOriginal.toLocaleString('es-AR')}</div>
                  <div style={{ fontSize:12, fontWeight:700, padding:'2px 8px', borderRadius:999, background: palette.accent, color:'#fff', display:'inline-block', marginTop:2 }}>
                    -{descPct}% off
                  </div>
                </div>
              </div>
              <div style={{ fontSize:14, fontWeight:600, color:C.green, display:'flex', alignItems:'center', gap:6, marginBottom:32 }}>
                <Check size={15} strokeWidth={2.5}/> Ahorrás ${ahorro.toLocaleString('es-AR')} vs contratar por separado
              </div>

              {/* Garantía */}
              <div style={{ display:'flex', gap:20 }}>
                {[
                  {icon:<ShieldCheck size={18} color={C.green}/>, text:'Pago protegido'},
                  {icon:<Clock size={18} color='rgba(255,255,255,0.5)'/>, text:'Respuesta en 2hs'},
                  {icon:<Check size={18} color={C.green} strokeWidth={2.5}/>, text:'Confirmación garantizada'},
                ].map((g,i)=>(
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, fontWeight:500, color:'rgba(255,255,255,0.6)' }}>
                    {g.icon} {g.text}
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — formulario de reserva */}
            <div style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:24, padding:32, backdropFilter:'blur(12px)' }}>
              <div style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.9)', marginBottom:16 }}>
                Elegí tus fechas
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                <DatePickerField label="CHECK-IN" value={checkin}
                  onChange={d=>{setCheckin(d);if(checkout&&checkout<=d)setCheckout(null);}} minDate={new Date()}/>
                <DatePickerField label="CHECK-OUT" value={checkout}
                  onChange={setCheckout} minDate={checkoutMin}/>
              </div>

              <div style={{ marginBottom:20 }}>
                <GuestsSelectorField adultos={adultos} setAdultos={setAdultos}
                  ninos={ninos} setNinos={setNinos} bebes={bebes} setBebes={setBebes}/>
              </div>

              <button
                className="w-full"
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'16px', borderRadius:16, fontSize:16, fontWeight:800, cursor:'pointer', border:'none', background:'#fff', color:C.ink, width:'100%' }}
                onMouseEnter={e=>e.currentTarget.style.background='#F0F4FF'}
                onMouseLeave={e=>e.currentTarget.style.background='#fff'}
              >
                Reservar este pack <ArrowRight size={18}/>
              </button>

              <div style={{ textAlign:'center', marginTop:12, fontSize:12, color:'rgba(255,255,255,0.4)', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                <ShieldCheck size={13}/> No te cobramos hasta confirmar disponibilidad
              </div>

              <div style={{ textAlign:'center', marginTop:16 }}>
                <button style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'rgba(255,255,255,0.3)', display:'flex', alignItems:'center', gap:4, margin:'0 auto' }}>
                  <Flag size={11}/> Denunciar un problema
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Spacer para el sticky mobile bar ── */}
      <div style={{ height:1 }}/>

      {/* ══════════════════════════════════════════════════════
          STICKY BOTTOM BAR — solo mobile
      ════════════════════════════════════════════════════════ */}
      <div style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:100,
        background:'#fff', borderTop:`1px solid ${C.line}`,
        padding:'12px 20px', display:'flex', alignItems:'center', gap:12,
        boxShadow:'0 -8px 32px rgba(11,16,32,0.12)',
      }} className="md:hidden">
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11, color:C.muted, fontWeight:500 }}>Pack completo desde</div>
          <div style={{ fontSize:22, fontWeight:900, color:C.ink, letterSpacing:'-0.02em' }}>${precioFinal.toLocaleString('es-AR')}</div>
        </div>
        <button
          onClick={()=>document.getElementById('pack-reserva')?.scrollIntoView({behavior:'smooth'})}
          style={{ padding:'12px 22px', borderRadius:14, fontSize:14, fontWeight:700, cursor:'pointer', border:'none', background:C.primary, color:'#fff', whiteSpace:'nowrap' }}>
          Reservar
        </button>
      </div>

    </div>
  );
}
