// Admin Resumen — 3 variaciones, una por dirección

// ───── Admin A — clean refined (navy sidebar) ─────
function AdminA() {
  const sidebarItems = [
    ['Resumen', Icon.grid, true, null],
    ['Socios', Icon.users, false, null],
    ['Ofertas', Icon.ticket, false, 1],
    ['Ventas', Icon.bag, false, null],
    ['Usuarios', Icon.user, false, null],
    ['Consultas', Icon.chat, false, null],
  ];
  return (
    <div style={{ display:'grid', gridTemplateColumns:'240px 1fr', height:'100%', background: A.bg, fontFamily: A.font, color: A.ink }}>
      {/* sidebar */}
      <aside style={{ background: A.navy, color:'#fff', padding:'22px 16px', display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', alignItems:'center', gap: 10, padding:'4px 8px 18px' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: A.primary, color:'#fff', display:'grid', placeItems:'center', fontFamily: A.font, fontWeight: 900, fontSize: 16 }}>G</div>
          <div>
            <div style={{ fontFamily: A.font, fontSize: 14, fontWeight: 700 }}>gesell.ar</div>
            <div style={{ fontFamily: A.font, fontSize: 11, color:'rgba(255,255,255,0.55)' }}>Superadmin</div>
          </div>
        </div>
        <nav style={{ display:'flex', flexDirection:'column', gap: 2, marginTop: 10 }}>
          {sidebarItems.map(([l, Ic, a, n], i) => (
            <button key={l} style={{
              display:'flex', alignItems:'center', gap: 10, padding:'10px 12px',
              border:'none', borderRadius: 10,
              background: a ? A.primary : 'transparent',
              color: a ? '#fff' : 'rgba(255,255,255,0.7)',
              fontFamily: A.font, fontSize: 13, fontWeight: 600,
              cursor:'pointer', textAlign:'left',
            }}>
              <Ic width={16} height={16}/>
              <span style={{ flex: 1 }}>{l}</span>
              {n && <span style={{ background: A.yellow, color: A.ink, fontSize: 10, fontWeight: 700, padding:'2px 6px', borderRadius: 999 }}>{n}</span>}
            </button>
          ))}
        </nav>
        <div style={{ marginTop:'auto', padding:'14px 8px 4px', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontFamily: A.font, fontSize: 10, color:'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing:'0.06em', textTransform:'uppercase' }}>Sesión activa</div>
          <div style={{ fontFamily: A.font, fontSize: 13, fontWeight: 600, marginTop: 4 }}>Superadmin</div>
        </div>
      </aside>

      {/* main */}
      <main style={{ padding:'22px 28px', overflow:'hidden' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 22 }}>
          <div>
            <h1 style={{ fontFamily: A.font, fontSize: 28, fontWeight: 700, margin: 0, letterSpacing:'-0.025em' }}>Resumen</h1>
            <div style={{ fontFamily: A.font, fontSize: 13, color: A.muted, marginTop: 4 }}>Martes 26 de mayo · Verano 2026</div>
          </div>
          <button style={{ background:'#fff', border:`1px solid ${A.line}`, padding:'8px 14px', borderRadius: 10, color: A.ink, fontFamily: A.font, fontSize: 13, fontWeight: 500, display:'inline-flex', alignItems:'center', gap: 6 }}>↻ Actualizar</button>
        </div>

        {/* KPI cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 14 }}>
          {[
            { t:'Socios activos', v:'30', d:'+4 este mes', icon: Icon.check, bg:'#E8F5EC', col: A.green },
            { t:'Pendientes', v:'0', d:'todo al día', icon: Icon.users, bg:'#FFF7E5', col:'#C28A1B' },
            { t:'Ofertas activas', v:'37', d:'1 pendiente revisión', icon: Icon.ticket, bg: A.primarySoft, col: A.primary },
            { t:'Ventas mes', v:'$2,4M', d:'+18% vs abril', icon: Icon.trend, bg:'#F3E8FF', col:'#7A3FD8' },
          ].map((k, i) => (
            <div key={i} style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius: 14, padding: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: k.bg, color: k.col, display:'grid', placeItems:'center', marginBottom: 12 }}>
                <k.icon width={18} height={18}/>
              </div>
              <div style={{ fontFamily: A.font, fontSize: 28, fontWeight: 700, color: A.ink, letterSpacing:'-0.02em' }}>{k.v}</div>
              <div style={{ fontFamily: A.font, fontSize: 13, color: A.ink2, fontWeight: 500, marginTop: 2 }}>{k.t}</div>
              <div style={{ fontFamily: A.font, fontSize: 11, color: A.muted, marginTop: 4 }}>{k.d}</div>
            </div>
          ))}
        </div>

        {/* two columns */}
        <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap: 14, marginTop: 14 }}>
          {/* recent partners */}
          <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius: 14, padding: 18 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12 }}>
              <div style={{ fontFamily: A.font, fontSize: 15, fontWeight: 600 }}>Últimos socios</div>
              <span style={{ fontFamily: A.font, fontSize: 12, color: A.primary, fontWeight: 600 }}>Ver todos →</span>
            </div>
            {[
              ['Panadería Artesanal','Experiencia · Mar de las Pampas', 'av-4'],
              ['El Parrillón','Restaurante · Villa Gesell', 'av-3'],
              ['Médanos Aventura','Experiencia · Villa Gesell', 'av-3'],
              ['Surf School Gesell','Experiencia · Villa Gesell', 'av-3'],
              ['Rancho Los Pinos','Experiencia · Villa Gesell', 'av-2'],
            ].map(([n, sub, av], i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap: 12, padding:'10px 0', borderTop: i===0 ? 'none' : `1px solid ${A.line}` }}>
                <span className={`av ${av}`} style={{ width: 36, height: 36 }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: A.font, fontSize: 13, fontWeight: 600 }}>{n}</div>
                  <div style={{ fontFamily: A.font, fontSize: 11, color: A.muted, marginTop: 1 }}>{sub}</div>
                </div>
                <span style={{ background:'#E8F5EC', color: A.green, padding:'3px 8px', borderRadius: 999, fontFamily: A.font, fontSize: 11, fontWeight: 600 }}>Activo</span>
              </div>
            ))}
          </div>

          {/* recent offers */}
          <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius: 14, padding: 18 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12 }}>
              <div style={{ fontFamily: A.font, fontSize: 15, fontWeight: 600 }}>Últimas ofertas</div>
              <span style={{ fontFamily: A.font, fontSize: 12, color: A.primary, fontWeight: 600 }}>Ver →</span>
            </div>
            {[
              ['3x4','dsfsdfsd','Casa de Roberto y Ana','3'],
              ['2x7','dfdsfs','Cervecería Dublín','2'],
              ['3x2','sdfdfsd','Cervecería Dublín','1'],
              ['-25%','Slow Week','Boutique Pinar','2'],
            ].map(([d, t, p, c], i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap: 12, padding:'10px 0', borderTop: i===0 ? 'none' : `1px solid ${A.line}` }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: A.primarySoft, color: A.primary, display:'grid', placeItems:'center', fontFamily: A.font, fontWeight: 700, fontSize: 11, flexShrink: 0 }}>{d}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: A.font, fontSize: 12, fontWeight: 600, color: A.muted }}>{p}</div>
                  <div style={{ fontFamily: A.font, fontSize: 13, fontWeight: 600 }} className="truncate">{t}</div>
                </div>
                <span style={{ display:'inline-flex', alignItems:'center', gap: 4, fontFamily: A.font, fontSize: 11, fontWeight: 600 }}>
                  <span style={{ width: 10, height: 10, borderRadius:'50%', background: A.yellow }}/>{c}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

// ───── Admin A — Ofertas list ─────
function AdminAOfertas() {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'240px 1fr', height:'100%', background: A.bg, fontFamily: A.font, color: A.ink }}>
      <aside style={{ background: A.navy, color:'#fff', padding:'22px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap: 10, padding:'4px 8px 18px' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: A.primary, color:'#fff', display:'grid', placeItems:'center', fontWeight: 900, fontSize: 16 }}>G</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>gesell.ar</div>
            <div style={{ fontSize: 11, color:'rgba(255,255,255,0.55)' }}>Superadmin</div>
          </div>
        </div>
        {[
          ['Resumen', Icon.grid, false],
          ['Socios', Icon.users, false],
          ['Ofertas', Icon.ticket, true],
          ['Ventas', Icon.bag, false],
          ['Usuarios', Icon.user, false],
          ['Consultas', Icon.chat, false],
        ].map(([l, Ic, a]) => (
          <button key={l} style={{
            display:'flex', alignItems:'center', gap: 10, padding:'10px 12px', width:'100%',
            border:'none', borderRadius: 10, background: a ? A.primary : 'transparent',
            color: a ? '#fff' : 'rgba(255,255,255,0.7)',
            fontFamily: A.font, fontSize: 13, fontWeight: 600, marginBottom: 2, textAlign:'left', cursor:'pointer',
          }}><Ic width={16} height={16}/> {l}</button>
        ))}
      </aside>
      <main style={{ padding:'22px 28px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 18 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing:'-0.025em' }}>Ofertas</h1>
          <button style={{ background: A.primary, color:'#fff', border:'none', padding:'10px 16px', borderRadius: 10, fontFamily: A.font, fontWeight: 600, fontSize: 13, display:'inline-flex', alignItems:'center', gap: 6 }}>
            <Icon.plus width={14} height={14}/> Crear oferta
          </button>
        </div>

        <div style={{ display:'flex', gap: 8, marginBottom: 16 }}>
          {[['Todas','37', true],['Activas','36', false],['Pendientes','0', false],['Inactivas','1', false]].map(([l, n, a], i) => (
            <button key={i} style={{
              padding:'8px 16px', borderRadius: 999, border: a ? 'none' : `1px solid ${A.line}`,
              background: a ? A.ink : '#fff', color: a ? '#fff' : A.ink2,
              fontFamily: A.font, fontWeight: 600, fontSize: 13, display:'inline-flex', alignItems:'center', gap: 6,
            }}>{l} <span style={{ opacity: 0.7 }}>{n}</span></button>
          ))}
        </div>

        {/* table */}
        <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius: 14, overflow:'hidden' }}>
          {[
            { d:'3×4', t:'dsfsdfsd', p:'Casa de Roberto y Ana', cat:'Departamento', c:3, s:'Activa', ph:'pool' },
            { d:'2×7', t:'dfdsfs', p:'Cervecería Dublín', cat:'Bar', c:2, s:'Activa', ph:'cerveza' },
            { d:'-35%', t:'Hot Sale frente al mar', p:'Hotel Spa Las Olas', cat:'Hotel', c:3, s:'Activa', ph:'pool' },
            { d:'-15%', t:'Cabalgata al atardecer', p:'Rancho Los Pinos', cat:'Experiencia', c:1, s:'Activa', ph:'bosque' },
            { d:'2×1', t:'Pintas artesanales', p:'Cervecería Dublín', cat:'Bar', c:1, s:'Activa', ph:'cerveza' },
            { d:'-25%', t:'Slow Week — lunes a jueves', p:'Boutique Pinar', cat:'Hotel', c:2, s:'Activa', ph:'interior' },
            { d:'3×3', t:'sddsfd', p:'Cervecería Dublín', cat:'Bar', c:0, s:'Inactiva', ph:'cerveza' },
          ].map((r, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap: 14, padding:'14px 18px', borderTop: i===0 ? 'none' : `1px solid ${A.line}` }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, overflow:'hidden', flexShrink: 0 }}><Photo kind={r.ph}/></div>
              <div style={{ width: 70, fontFamily: A.font, fontWeight: 700, fontSize: 16, color: A.ink, letterSpacing:'-0.02em' }}>{r.d}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: A.font, fontSize: 12, color: A.muted, fontWeight: 500 }}>{r.p} · {r.cat}</div>
                <div style={{ fontFamily: A.font, fontSize: 14, fontWeight: 600 }} className="truncate">{r.t}</div>
              </div>
              <div style={{ display:'inline-flex', alignItems:'center', gap: 4, fontFamily: A.font, fontSize: 12, fontWeight: 600, color: A.ink, minWidth: 28 }}>
                <span style={{ width: 10, height: 10, borderRadius:'50%', background: A.yellow }}/>{r.c}
              </div>
              <span style={{
                padding:'4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                background: r.s==='Activa' ? '#E8F5EC' : '#FCEAEA',
                color: r.s==='Activa' ? A.green : '#C03030',
              }}>{r.s}</span>
              <button style={{ background:'transparent', border:`1px solid ${A.line}`, borderRadius: 8, padding:'6px 10px', fontFamily: A.font, fontWeight: 500, fontSize: 12, display:'inline-flex', alignItems:'center', gap: 4 }}>
                <Icon.edit width={12} height={12}/> Editar
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// ───── Admin B — Editorial (cream) ─────
function AdminB() {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', height:'100%', background: B.paper, fontFamily: B.sans, color: B.ink }}>
      <aside style={{ background: B.cream, borderRight:`1px solid ${B.line}`, padding:'24px 18px' }}>
        <div style={{ display:'flex', alignItems:'center', gap: 8, paddingBottom: 22 }}>
          <div style={{ width: 30, height: 30, borderRadius: 10, background: B.ocean, color: B.cream, display:'grid', placeItems:'center', fontFamily: B.serif, fontStyle:'italic', fontWeight: 400, fontSize: 18 }}>g</div>
          <div>
            <div style={{ fontFamily: B.serif, fontSize: 17, color: B.ink }}>gesell<span style={{color:B.coral}}>.</span>ar</div>
            <div style={{ fontFamily: B.sans, fontSize: 10, color: B.muted, fontWeight: 600, letterSpacing:'0.12em', textTransform:'uppercase' }}>Redacción</div>
          </div>
        </div>
        {[
          ['Resumen', Icon.grid, true],
          ['Socios', Icon.users, false],
          ['Ofertas', Icon.ticket, false, 1],
          ['Ventas', Icon.bag, false],
          ['Crónicas', Icon.edit, false],
          ['Consultas', Icon.chat, false],
        ].map(([l, Ic, a, n], i) => (
          <div key={l} style={{
            display:'flex', alignItems:'center', gap: 10, padding:'10px 10px',
            borderBottom: `1px dotted ${B.line}`,
            color: a ? B.ink : B.ink2, fontFamily: B.sans, fontSize: 14, fontWeight: a ? 600 : 500,
          }}>
            <Ic width={15} height={15} style={{ color: a ? B.coral : B.muted }}/>
            <span style={{ flex: 1, fontFamily: a ? B.serif : B.sans, fontStyle: a ? 'italic' : 'normal', fontSize: a ? 18 : 14, fontWeight: a ? 400 : 500 }}>{l}</span>
            {n && <span style={{ background: B.coral, color:'#fff', padding:'1px 7px', borderRadius: 999, fontSize: 10, fontFamily: B.sans, fontWeight: 700 }}>{n}</span>}
          </div>
        ))}
        <div style={{ marginTop: 32, paddingTop: 16, borderTop:`1px solid ${B.line}` }}>
          <div style={{ fontFamily: B.sans, fontSize: 10, color: B.muted, fontWeight: 600, letterSpacing:'0.12em', textTransform:'uppercase' }}>Editor en jefe</div>
          <div style={{ fontFamily: B.serif, fontSize: 17, color: B.ink, fontStyle:'italic', marginTop: 4 }}>Superadmin</div>
        </div>
      </aside>

      <main style={{ padding:'28px 36px', overflow:'hidden' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', borderBottom:`1px solid ${B.line}`, paddingBottom: 18, marginBottom: 22 }}>
          <div>
            <div style={{ fontFamily: B.sans, fontSize: 11, color: B.muted, fontWeight: 600, letterSpacing:'0.16em', textTransform:'uppercase' }}>Edición Nº 04 · Martes 26 mayo</div>
            <h1 style={{ fontFamily: B.serif, fontSize: 56, margin:'4px 0 0', fontWeight: 400, letterSpacing:'-0.02em', lineHeight: 0.95 }}>El <span style={{ fontStyle:'italic', color: B.coral }}>resumen.</span></h1>
          </div>
          <button style={{ background:'transparent', border:`1px solid ${B.ink}`, padding:'8px 16px', borderRadius: 999, fontFamily: B.sans, fontSize: 13, fontWeight: 500 }}>↻ Actualizar</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 0, borderTop:`1px solid ${B.line}`, borderBottom:`1px solid ${B.line}` }}>
          {[
            ['Socios activos', '30', '+4 mes'],
            ['Pendientes', '0', 'al día'],
            ['Ofertas activas', '37', '1 revisión'],
            ['Ventas mes', '$2,4M', '+18%'],
          ].map(([l, v, d], i) => (
            <div key={i} style={{ padding:'22px 18px', borderRight: i<3 ? `1px solid ${B.line}` : 'none' }}>
              <div style={{ fontFamily: B.sans, fontSize: 10, color: B.muted, fontWeight: 600, letterSpacing:'0.14em', textTransform:'uppercase' }}>{l}</div>
              <div style={{ fontFamily: B.serif, fontSize: 56, color: B.ink, fontWeight: 400, letterSpacing:'-0.025em', lineHeight: 1, marginTop: 6 }}>{v}</div>
              <div style={{ fontFamily: B.serif, fontSize: 14, fontStyle:'italic', color: B.coral, marginTop: 4 }}>{d}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap: 36, marginTop: 30 }}>
          <div>
            <div style={{ fontFamily: B.serif, fontSize: 28, fontStyle:'italic', color: B.ink, fontWeight: 400, letterSpacing:'-0.01em', marginBottom: 14 }}>Últimos socios.</div>
            {[
              ['Panadería Artesanal','Experiencia — Mar de las Pampas'],
              ['El Parrillón','Restaurante — Villa Gesell · Zona hoteles'],
              ['Médanos Aventura','Experiencia — Villa Gesell · Médanos'],
              ['Surf School Gesell','Experiencia — Línea de playa'],
              ['Rancho Los Pinos','Experiencia — Zona norte'],
            ].map(([n, s], i) => (
              <div key={i} style={{ display:'flex', alignItems:'baseline', gap: 12, padding:'12px 0', borderBottom:`1px dotted ${B.line}` }}>
                <div style={{ fontFamily: B.serif, fontSize: 22, color: B.coral, fontStyle:'italic', width: 36 }}>{['I.','II.','III.','IV.','V.'][i]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: B.serif, fontSize: 20, color: B.ink, lineHeight: 1.1 }}>{n}</div>
                  <div style={{ fontFamily: B.sans, fontSize: 12, color: B.muted, marginTop: 2 }}>{s}</div>
                </div>
                <span style={{ fontFamily: B.sans, fontSize: 11, color: B.green, fontWeight: 600, letterSpacing:'0.08em', textTransform:'uppercase' }}>activo</span>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontFamily: B.serif, fontSize: 28, fontStyle:'italic', color: B.ink, fontWeight: 400, letterSpacing:'-0.01em', marginBottom: 14 }}>Ofertas pendientes.</div>
            <div style={{ background: B.cream, border:`1px solid ${B.line}`, borderRadius: 6, padding: 18 }}>
              <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontFamily: B.sans, fontSize: 10, color: B.muted, fontWeight: 600, letterSpacing:'0.12em', textTransform:'uppercase' }}>Pendiente de revisión</div>
                  <div style={{ fontFamily: B.serif, fontSize: 26, fontStyle:'italic', color: B.ink, marginTop: 4 }}>3×3 sddsfd</div>
                  <div style={{ fontFamily: B.sans, fontSize: 12, color: B.muted, marginTop: 4 }}>Cervecería Dublín — Bar</div>
                </div>
                <button style={{ background: B.coral, color:'#fff', border:'none', padding:'8px 14px', borderRadius: 999, fontFamily: B.sans, fontSize: 12, fontWeight: 600 }}>Revisar</button>
              </div>
            </div>

            <div style={{ fontFamily: B.serif, fontSize: 28, fontStyle:'italic', color: B.ink, fontWeight: 400, letterSpacing:'-0.01em', margin:'28px 0 14px' }}>Ventas recientes.</div>
            <div style={{ fontFamily: B.serif, fontSize: 18, fontStyle:'italic', color: B.muted, lineHeight: 1.4 }}>
              "Aún no hay ventas registradas para esta edición. Las ventas aparecerán cuando los usuarios completen cuponeras."
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ───── Admin C — Bold/chunky ─────
function AdminC() {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', height:'100%', background: C.bg, fontFamily: C.sans, color: C.ink }}>
      <aside style={{ background: C.ink, color:'#fff', padding:'22px 16px', borderRight:`3px solid ${C.ink}` }}>
        <div style={{ display:'flex', alignItems:'center', gap: 10, padding:'4px 6px 22px' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: C.celeste, color: C.ink, display:'grid', placeItems:'center', fontFamily: C.display, fontWeight: 900, fontSize: 18, border:`2px solid #fff` }}>G</div>
          <div>
            <div style={{ fontFamily: C.display, fontSize: 16, fontWeight: 700, letterSpacing:'-0.02em' }}>gesell.ar</div>
            <div style={{ fontFamily: C.display, fontSize: 10, fontWeight: 700, color: C.sun, letterSpacing:'0.08em', textTransform:'uppercase' }}>SUPER · ADMIN</div>
          </div>
        </div>
        {[
          ['Resumen', Icon.grid, true, null, C.sun],
          ['Socios', Icon.users, false, null, C.celeste],
          ['Ofertas', Icon.ticket, false, 1, C.coral],
          ['Ventas', Icon.bag, false, null, C.lime],
          ['Usuarios', Icon.user, false, null, '#fff'],
          ['Consultas', Icon.chat, false, null, '#fff'],
        ].map(([l, Ic, a, n, col]) => (
          <button key={l} style={{
            display:'flex', alignItems:'center', gap: 10, width:'100%',
            padding:'10px 12px', marginBottom: 6, cursor:'pointer',
            border: a ? `2px solid ${C.ink}` : '2px solid transparent',
            borderRadius: 12,
            background: a ? col : 'transparent',
            color: a ? C.ink : 'rgba(255,255,255,0.75)',
            fontFamily: C.display, fontSize: 14, fontWeight: 700,
            boxShadow: a ? `3px 3px 0 ${col}` : 'none',
            textAlign:'left',
          }}>
            <Ic width={16} height={16}/>
            <span style={{ flex: 1 }}>{l}</span>
            {n && <span style={{ background: C.coral, color: C.ink, fontSize: 10, fontWeight: 800, padding:'2px 7px', borderRadius: 999, border:`1.5px solid ${C.ink}` }}>{n}</span>}
          </button>
        ))}

        <div style={{ marginTop: 24, padding: 12, background: C.celeste, borderRadius: 14, border:`2px solid #fff`, color: C.ink }}>
          <div style={{ fontFamily: C.display, fontSize: 10, fontWeight: 800, letterSpacing:'0.1em' }}>VERANO '26</div>
          <div style={{ fontFamily: C.display, fontSize: 16, fontWeight: 800, letterSpacing:'-0.02em', marginTop: 2 }}>+18% vs Verano '25 🚀</div>
        </div>
      </aside>

      <main style={{ padding:'22px 28px', overflow:'hidden', position:'relative' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontFamily: C.display, fontSize: 40, fontWeight: 800, letterSpacing:'-0.035em', margin: 0 }}>
              Resumen <span style={{ background: C.sun, padding:'0 8px', boxShadow:`3px 3px 0 ${C.ink}`, border:`2px solid ${C.ink}`, display:'inline-block', transform:'rotate(-1deg)', fontSize: 30 }}>'26</span>
            </h1>
            <div style={{ fontFamily: C.display, fontSize: 12, fontWeight: 700, color: C.muted, marginTop: 6, letterSpacing:'0.06em' }}>★ MARTES 26 MAY · TODO EN ORDEN</div>
          </div>
          <button style={chunkyBtn('#fff', C.ink)}>↻ Actualizar</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 14 }}>
          {[
            { t:'Socios activos', v:'30', d:'+4 mes', bg: C.celeste, e:'👥' },
            { t:'Pendientes', v:'0', d:'todo OK', bg: C.lime, e:'✓' },
            { t:'Ofertas vivas', v:'37', d:'1 revisar', bg: C.sun, e:'🎫' },
            { t:'Ventas mes', v:'$2,4M', d:'+18% 🚀', bg: C.coral, e:'$' },
          ].map((k, i) => (
            <div key={i} style={{ background: k.bg, border:`2.5px solid ${C.ink}`, borderRadius: 16, padding: 16, boxShadow:`4px 4px 0 ${C.ink}`, position:'relative', transform: i%2 ? 'rotate(0.3deg)' : 'rotate(-0.3deg)' }}>
              <div style={{ fontFamily: C.display, fontSize: 28, position:'absolute', top: 12, right: 12, opacity: 0.7 }}>{k.e}</div>
              <div style={{ fontFamily: C.display, fontSize: 11, fontWeight: 800, letterSpacing:'0.1em', textTransform:'uppercase', color: C.ink, opacity: 0.7 }}>{k.t}</div>
              <div style={{ fontFamily: C.display, fontSize: 40, fontWeight: 800, letterSpacing:'-0.035em', lineHeight: 1, marginTop: 8, color: C.ink }}>{k.v}</div>
              <div style={{ fontFamily: C.display, fontSize: 12, fontWeight: 700, color: C.ink, marginTop: 6 }}>{k.d}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap: 16, marginTop: 16 }}>
          <div style={{ background:'#fff', border:`2.5px solid ${C.ink}`, borderRadius: 16, padding: 18, boxShadow:`4px 4px 0 ${C.ink}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 10 }}>
              <div style={{ fontFamily: C.display, fontSize: 18, fontWeight: 800, letterSpacing:'-0.02em' }}>👥 Últimos socios</div>
              <span style={{ fontFamily: C.display, fontSize: 12, fontWeight: 700, color: C.celesteDeep }}>Ver →</span>
            </div>
            {[
              ['Panadería Artesanal','Exp · Mar de las Pampas', C.sun],
              ['El Parrillón','Resto · Villa Gesell', C.coral],
              ['Médanos Aventura','Exp · Villa Gesell', C.lime],
              ['Surf School Gesell','Exp · Línea de playa', C.celeste],
              ['Rancho Los Pinos','Exp · Zona norte', C.sun],
            ].map(([n, s, col], i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap: 12, padding:'8px 0', borderTop: i===0 ? 'none' : `1px dashed ${C.muted}` }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: col, border:`2px solid ${C.ink}`, display:'grid', placeItems:'center', fontFamily: C.display, fontWeight: 800, fontSize: 13 }}>{n[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: C.display, fontSize: 14, fontWeight: 700, letterSpacing:'-0.01em' }}>{n}</div>
                  <div style={{ fontFamily: C.sans, fontSize: 11, color: C.muted }}>{s}</div>
                </div>
                <span style={{ background: C.lime, color: C.ink, padding:'3px 8px', borderRadius: 999, fontFamily: C.display, fontSize: 10, fontWeight: 800, border:`1.5px solid ${C.ink}` }}>ACTIVO</span>
              </div>
            ))}
          </div>

          <div style={{ background:'#fff', border:`2.5px solid ${C.ink}`, borderRadius: 16, padding: 18, boxShadow:`4px 4px 0 ${C.ink}` }}>
            <div style={{ fontFamily: C.display, fontSize: 18, fontWeight: 800, letterSpacing:'-0.02em', marginBottom: 12 }}>🎫 Por revisar</div>

            <div style={{ background: C.coral, border:`2.5px solid ${C.ink}`, borderRadius: 14, padding: 14, boxShadow:`3px 3px 0 ${C.ink}` }}>
              <div style={{ fontFamily: C.display, fontSize: 10, fontWeight: 800, color: C.ink, letterSpacing:'0.1em' }}>OFERTA PENDIENTE</div>
              <div style={{ fontFamily: C.display, fontSize: 22, fontWeight: 800, color: C.ink, marginTop: 4, letterSpacing:'-0.02em' }}>3×3 · sddsfd</div>
              <div style={{ fontFamily: C.sans, fontSize: 12, color: C.ink, opacity: 0.75, marginTop: 4 }}>Cervecería Dublín · Bar</div>
              <div style={{ marginTop: 12, display:'flex', gap: 8 }}>
                <button style={chunkyBtn(C.ink, '#fff', { padding:'7px 12px', fontSize: 12 })}>Aprobar ✓</button>
                <button style={chunkyBtn('#fff', C.ink, { padding:'7px 12px', fontSize: 12 })}>Devolver</button>
              </div>
            </div>

            <div style={{ marginTop: 18, fontFamily: C.display, fontSize: 14, fontWeight: 800, letterSpacing:'-0.01em', marginBottom: 8 }}>📈 Ventas</div>
            <div style={{ fontFamily: C.sans, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
              Aparecen acá cuando los usuarios canjean. Por ahora, <span style={{ fontWeight: 700, color: C.ink }}>0 esta semana</span>.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

Object.assign(window, { AdminA, AdminAOfertas, AdminB, AdminC });
