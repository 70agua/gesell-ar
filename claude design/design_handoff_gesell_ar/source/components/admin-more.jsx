// Admin extra screens for Aire — Socios, Ventas, Consultas

// Shared admin sidebar (Aire navy)
function ASidebar({ active = 'Resumen', counts = {} }) {
  const items = [
    ['Resumen', Icon.grid],
    ['Socios', Icon.users],
    ['Ofertas', Icon.ticket],
    ['Ventas', Icon.bag],
    ['Usuarios', Icon.user],
    ['Consultas', Icon.chat],
  ];
  return (
    <aside style={{ background: A.navy, color:'#fff', padding:'22px 16px', display:'flex', flexDirection:'column' }}>
      <div style={{ display:'flex', alignItems:'center', gap: 10, padding:'4px 8px 18px' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: A.primary, color:'#fff', display:'grid', placeItems:'center', fontFamily: A.font, fontWeight: 900, fontSize: 16 }}>G</div>
        <div>
          <div style={{ fontFamily: A.font, fontSize: 14, fontWeight: 700 }}>gesell.ar</div>
          <div style={{ fontFamily: A.font, fontSize: 11, color:'rgba(255,255,255,0.55)' }}>Superadmin</div>
        </div>
      </div>
      <nav style={{ display:'flex', flexDirection:'column', gap: 2, marginTop: 10 }}>
        {items.map(([l, Ic]) => {
          const a = l === active;
          const n = counts[l];
          return (
            <button key={l} style={{
              display:'flex', alignItems:'center', gap: 10, padding:'10px 12px', width:'100%',
              border:'none', borderRadius: 10, background: a ? A.primary : 'transparent',
              color: a ? '#fff' : 'rgba(255,255,255,0.7)',
              fontFamily: A.font, fontSize: 13, fontWeight: 600, textAlign:'left', cursor:'pointer',
            }}>
              <Ic width={16} height={16}/>
              <span style={{ flex: 1 }}>{l}</span>
              {n && <span style={{ background: A.yellow, color: A.ink, fontSize: 10, fontWeight: 700, padding:'2px 6px', borderRadius: 999 }}>{n}</span>}
            </button>
          );
        })}
      </nav>
      <div style={{ marginTop:'auto', padding:'14px 8px 4px', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontFamily: A.font, fontSize: 10, color:'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing:'0.06em', textTransform:'uppercase' }}>Sesión activa</div>
        <div style={{ fontFamily: A.font, fontSize: 13, fontWeight: 600, marginTop: 4 }}>Superadmin</div>
      </div>
    </aside>
  );
}

// ───── Admin Socios ─────
function AdminASocios() {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'240px 1fr', height:'100%', background: A.bg, fontFamily: A.font, color: A.ink }}>
      <ASidebar active="Socios" counts={{ Ofertas: 1 }}/>
      <main style={{ padding:'22px 28px', overflow:'hidden' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 18 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing:'-0.025em' }}>Socios</h1>
            <div style={{ fontSize: 13, color: A.muted, marginTop: 4 }}>30 activos · 0 pendientes · 4 nuevos este mes</div>
          </div>
          <div style={{ display:'flex', gap: 10 }}>
            <button style={{ background:'#fff', border:`1px solid ${A.line}`, padding:'9px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500, display:'inline-flex', alignItems:'center', gap: 6 }}>Exportar</button>
            <button style={{ background: A.primary, color:'#fff', border:'none', padding:'9px 14px', borderRadius: 10, fontFamily: A.font, fontWeight: 600, fontSize: 13, display:'inline-flex', alignItems:'center', gap: 6 }}>
              <Icon.plus width={14} height={14}/> Invitar socio
            </button>
          </div>
        </div>

        {/* search + filters */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap: 10, marginBottom: 14 }}>
          <div style={{ position:'relative' }}>
            <Icon.search width={16} height={16} style={{ position:'absolute', top:'50%', left: 14, transform:'translateY(-50%)', color: A.muted }}/>
            <input placeholder="Buscar socio, localidad o categoría…" style={{ width:'100%', padding:'10px 14px 10px 38px', borderRadius: 10, border:`1px solid ${A.line}`, fontSize: 13, fontFamily: A.font, background:'#fff', color: A.ink }}/>
          </div>
          <select style={{ padding:'10px 14px', borderRadius: 10, border:`1px solid ${A.line}`, fontSize: 13, fontFamily: A.font, fontWeight: 500, background:'#fff' }}>
            <option>Todas las categorías</option><option>Hotel</option><option>Cabaña</option><option>Restaurant</option><option>Experiencia</option>
          </select>
          <select style={{ padding:'10px 14px', borderRadius: 10, border:`1px solid ${A.line}`, fontSize: 13, fontFamily: A.font, fontWeight: 500, background:'#fff' }}>
            <option>Todos los estados</option><option>Activo</option><option>Pendiente</option><option>Inactivo</option>
          </select>
        </div>

        {/* table header */}
        <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius: 14, overflow:'hidden' }}>
          <div style={{ display:'grid', gridTemplateColumns:'24px 1.4fr 1fr 0.6fr 0.5fr auto', gap: 12, padding:'12px 18px', borderBottom:`1px solid ${A.line}`, background: A.bg, fontSize: 11, fontWeight: 600, color: A.muted, letterSpacing:'0.06em', textTransform:'uppercase' }}>
            <input type="checkbox" style={{ accentColor: A.primary }}/>
            <span>Socio</span>
            <span>Ubicación</span>
            <span>Ofertas</span>
            <span>Estado</span>
            <span></span>
          </div>
          {[
            { n:'Panadería Artesanal', t:'Experiencia · Bakery', loc:'Mar de las Pampas · Acceso principal', av:'av-4', of:3, s:'Activo' },
            { n:'El Parrillón', t:'Restaurante', loc:'Villa Gesell · Zona hoteles', av:'av-3', of:5, s:'Activo' },
            { n:'Médanos Aventura', t:'Experiencia · Aventura', loc:'Villa Gesell · Barrio de los médanos', av:'av-3', of:2, s:'Activo' },
            { n:'Surf School Gesell', t:'Experiencia · Deporte', loc:'Villa Gesell · Línea de playa', av:'av-3', of:4, s:'Activo' },
            { n:'Rancho Los Pinos', t:'Experiencia · Cabalgatas', loc:'Villa Gesell · Zona norte', av:'av-2', of:1, s:'Activo' },
            { n:'Spa Pinar', t:'Experiencia · Bienestar', loc:'Mar de las Pampas · Bosque', av:'av-5', of:6, s:'Activo' },
            { n:'Mar Abierto Gesell', t:'Hotel · 3★', loc:'Villa Gesell · Norte', av:'av-3', of:2, s:'Activo' },
            { n:'Café del Pueblo', t:'Café', loc:'Villa Gesell · Centro', av:'av-4', of:1, s:'Pendiente' },
          ].map((r, i) => (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'24px 1.4fr 1fr 0.6fr 0.5fr auto', gap: 12, padding:'14px 18px', borderTop: i===0 ? 'none' : `1px solid ${A.line}`, alignItems:'center' }}>
              <input type="checkbox" style={{ accentColor: A.primary }}/>
              <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
                <span className={`av ${r.av}`} style={{ width: 38, height: 38 }}/>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{r.n}</div>
                  <div style={{ fontSize: 12, color: A.muted, marginTop: 1 }}>{r.t}</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: A.ink2, display:'inline-flex', alignItems:'center', gap: 5 }}><Icon.pin width={12} height={12}/> {r.loc}</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{r.of}</div>
              <span style={{
                padding:'3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, display:'inline-block', width:'fit-content',
                background: r.s==='Activo' ? '#E8F5EC' : (r.s==='Pendiente' ? '#FFF4E0' : '#FCEAEA'),
                color: r.s==='Activo' ? A.green : (r.s==='Pendiente' ? '#C28A1B' : '#C03030'),
              }}>{r.s}</span>
              <div style={{ display:'flex', gap: 6 }}>
                <button style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius: 8, padding:'6px 10px', fontSize: 12, fontWeight: 500, display:'inline-flex', alignItems:'center', gap: 4 }}><Icon.edit width={12} height={12}/> Editar</button>
                <button style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius: 8, padding:'6px 10px', fontSize: 12, fontWeight: 500, color: A.muted }}>···</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14, display:'flex', justifyContent:'space-between', alignItems:'center', fontSize: 13, color: A.muted }}>
          <span>Mostrando 1—8 de 30 socios</span>
          <div style={{ display:'flex', gap: 4 }}>
            {['‹',1,2,3,4,'›'].map((p, i) => (
              <button key={i} style={{
                width: 30, height: 30, borderRadius: 8, border:`1px solid ${A.line}`,
                background: p===1 ? A.ink : '#fff', color: p===1 ? '#fff' : A.ink,
                fontFamily: A.font, fontWeight: 600, fontSize: 12,
              }}>{p}</button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

// ───── Admin Ventas ─────
function AdminAVentas() {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'240px 1fr', height:'100%', background: A.bg, fontFamily: A.font, color: A.ink }}>
      <ASidebar active="Ventas" counts={{ Ofertas: 1 }}/>
      <main style={{ padding:'22px 28px', overflow:'hidden' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 18 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing:'-0.025em' }}>Ventas</h1>
            <div style={{ fontSize: 13, color: A.muted, marginTop: 4 }}>1 — 26 de mayo · Verano 2026</div>
          </div>
          <div style={{ display:'flex', gap: 8 }}>
            <select style={{ padding:'9px 14px', borderRadius: 10, border:`1px solid ${A.line}`, fontSize: 13, fontFamily: A.font, fontWeight: 500, background:'#fff' }}>
              <option>Últimos 30 días</option><option>Este verano</option><option>Histórico</option>
            </select>
            <button style={{ background:'#fff', border:`1px solid ${A.line}`, padding:'9px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500 }}>Exportar CSV</button>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 14, marginBottom: 14 }}>
          {[
            { t:'Volumen total', v:'$2.412.000', d:'+18% vs abril', icon: Icon.bag, col: A.primary },
            { t:'Comisión gesell.ar', v:'$241.200', d:'10% del volumen', icon: Icon.trend, col: A.green },
            { t:'Cupones canjeados', v:'342', d:'+86 esta semana', icon: Icon.ticket, col: '#C28A1B' },
            { t:'Ticket promedio', v:'$7.052', d:'+$420 vs abril', icon: Icon.check, col: '#7A3FD8' },
          ].map((k, i) => (
            <div key={i} style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius: 14, padding: 16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${k.col}1A`, color: k.col, display:'grid', placeItems:'center' }}>
                  <k.icon width={16} height={16}/>
                </div>
              </div>
              <div style={{ fontSize: 11, color: A.muted, fontWeight: 600, letterSpacing:'0.06em', textTransform:'uppercase', marginTop: 12 }}>{k.t}</div>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing:'-0.02em', marginTop: 2 }}>{k.v}</div>
              <div style={{ fontSize: 11, color: A.green, fontWeight: 600, marginTop: 3 }}>↑ {k.d}</div>
            </div>
          ))}
        </div>

        {/* Chart + recent sales */}
        <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap: 14 }}>
          <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius: 14, padding: 18 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Volumen diario</div>
                <div style={{ fontSize: 12, color: A.muted, marginTop: 2 }}>Mayo 2026</div>
              </div>
              <div style={{ display:'flex', gap: 12, fontSize: 12 }}>
                <span style={{ display:'inline-flex', alignItems:'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: A.primary }}/> Alojamiento</span>
                <span style={{ display:'inline-flex', alignItems:'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: A.yellow }}/> Cupones</span>
                <span style={{ display:'inline-flex', alignItems:'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: A.green }}/> Packs</span>
              </div>
            </div>
            {/* fake bar chart */}
            <div style={{ display:'flex', alignItems:'flex-end', gap: 6, height: 200, padding:'10px 0' }}>
              {[
                [40,15,10],[55,18,12],[42,22,15],[68,25,18],[72,30,20],[58,28,22],[45,32,18],
                [80,35,25],[92,40,30],[75,38,28],[88,45,35],[110,50,42],[125,55,48],[105,52,40],
                [98,48,38],[115,55,45],[130,60,52],[125,58,48],[140,65,55],[155,70,62],[148,68,58],
                [160,75,68],[175,82,72],[168,78,70],[180,85,75],[195,92,82],[210,98,90],
              ].map(([a, b, c], i) => {
                const total = a + b + c;
                return (
                  <div key={i} style={{ flex: 1, display:'flex', flexDirection:'column', justifyContent:'flex-end', height:'100%', gap: 1 }}>
                    <div style={{ height: c, background: A.green, borderRadius: '4px 4px 0 0' }}/>
                    <div style={{ height: b, background: A.yellow }}/>
                    <div style={{ height: a, background: A.primary, borderRadius: '0 0 4px 4px' }}/>
                  </div>
                );
              })}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop: 8, fontSize: 10, color: A.muted, fontWeight: 500 }}>
              <span>1</span><span>7</span><span>14</span><span>21</span><span>26</span>
            </div>
          </div>

          <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius: 14, padding: 18 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Últimas ventas</div>
              <span style={{ fontSize: 12, color: A.primary, fontWeight: 600 }}>Ver todas →</span>
            </div>
            {[
              ['Hot Sale frente al mar', 'Hotel Spa Las Olas', '$165.750', '4 cupones'],
              ['Escapada Romántica', 'Pack · Boutique Pinar', '$145.000', 'Pack'],
              ['Pintas artesanales 2×1', 'Cervecería Dublín', '$6.400', '2 cupones'],
              ['Cabalgata atardecer', 'Rancho Los Pinos', '$18.500', '1 cupón'],
              ['Slow Week boutique', 'Boutique Pinar', '$98.000', '2 cupones'],
            ].map(([t, p, m, c], i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap: 12, padding:'10px 0', borderTop: i===0 ? 'none' : `1px solid ${A.line}` }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: A.primarySoft, color: A.primary, display:'grid', placeItems:'center', flexShrink: 0 }}>
                  <Icon.bag width={14} height={14}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }} className="truncate">{t}</div>
                  <div style={{ fontSize: 11, color: A.muted, marginTop: 1 }} className="truncate">{p}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{m}</div>
                  <div style={{ fontSize: 10, color: A.muted, fontWeight: 500 }}>{c}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

// ───── Admin Consultas (inbox-style) ─────
function AdminAConsultas() {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'240px 1fr', height:'100%', background: A.bg, fontFamily: A.font, color: A.ink }}>
      <ASidebar active="Consultas" counts={{ Ofertas: 1, Consultas: 3 }}/>
      <main style={{ display:'grid', gridTemplateColumns:'360px 1fr', overflow:'hidden' }}>
        {/* Inbox list */}
        <div style={{ borderRight:`1px solid ${A.line}`, background:'#fff', overflowY:'auto' }}>
          <div style={{ padding:'18px 20px', borderBottom:`1px solid ${A.line}`, position:'sticky', top: 0, background:'#fff' }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing:'-0.02em' }}>Consultas</h1>
            <div style={{ marginTop: 10, display:'flex', gap: 6 }}>
              {[['Sin responder', 3, true],['Todas', 24, false],['Archivadas', 12, false]].map(([l, n, a], i) => (
                <button key={i} style={{
                  padding:'5px 12px', borderRadius: 999, fontSize: 11,
                  background: a ? A.ink : 'transparent', color: a ? '#fff' : A.ink2,
                  border: a ? 'none' : `1px solid ${A.line}`, fontFamily: A.font, fontWeight: 600,
                }}>{l} <span style={{ opacity: a ? 0.7 : 1 }}>{n}</span></button>
              ))}
            </div>
            <div style={{ position:'relative', marginTop: 10 }}>
              <Icon.search width={14} height={14} style={{ position:'absolute', top:'50%', left: 12, transform:'translateY(-50%)', color: A.muted }}/>
              <input placeholder="Buscar consulta…" style={{ width:'100%', padding:'8px 12px 8px 32px', borderRadius: 8, border:`1px solid ${A.line}`, fontSize: 12, fontFamily: A.font }}/>
            </div>
          </div>

          {[
            { name:'María L.', av:'av-1', date:'Hace 12m', subj:'Consulta sobre Hot Sale Las Olas', prev:'Hola, quería saber si el cupón sirve para una habitación triple…', unread: true, current: true },
            { name:'Pablo G.', av:'av-2', date:'Hace 1h', subj:'Pack Romántico — disponibilidad', prev:'Hola! Quería ver si hay disponibilidad para el 14 de febrero…', unread: true, current: false },
            { name:'Sofía R.', av:'av-5', date:'Hace 3h', subj:'¿Mascotas en Cabañas del Pinar?', prev:'Buenas, vamos con un perro mediano. ¿Hay cabañas pet-friendly…', unread: true, current: false },
            { name:'Diego A.', av:'av-3', date:'Ayer', subj:'Cuponera — no me llega QR', prev:'Compré dos cupones ayer y no me llegó el código QR al email…', unread: false, current: false },
            { name:'Laura M.', av:'av-1', date:'Lun 18', subj:'Cancelación reserva pack', prev:'Necesito cancelar la reserva del pack familiar por tema de salud…', unread: false, current: false },
            { name:'Marcos T.', av:'av-3', date:'Lun 18', subj:'Quiero ser socio', prev:'Tengo un complejo de cabañas en Mar de las Pampas y me gustaría…', unread: false, current: false },
            { name:'Inés C.', av:'av-4', date:'Dom 17', subj:'Cupones para socios', prev:'Hola! ¿Los cupones de Cervecería Dublín sirven a la tarde…', unread: false, current: false },
          ].map((c, i) => (
            <div key={i} style={{
              padding:'14px 20px', borderBottom:`1px solid ${A.line}`, cursor:'pointer',
              background: c.current ? A.primarySoft : 'transparent',
              borderLeft: c.current ? `3px solid ${A.primary}` : '3px solid transparent',
            }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap: 10 }}>
                <span className={`av ${c.av}`} style={{ width: 36, height: 36, position:'relative', flexShrink: 0 }}>
                  {c.unread && <span style={{ position:'absolute', top: 0, right: 0, width: 10, height: 10, borderRadius:'50%', background: A.primary, border:'2px solid #fff' }}/>}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                    <span style={{ fontSize: 13, fontWeight: c.unread ? 700 : 600 }}>{c.name}</span>
                    <span style={{ fontSize: 10, color: A.muted, fontWeight: 500 }}>{c.date}</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: c.unread ? 600 : 500, marginTop: 2 }} className="truncate">{c.subj}</div>
                  <div style={{ fontSize: 11, color: A.muted, marginTop: 3, lineHeight: 1.4 }} className="truncate">{c.prev}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detail */}
        <div style={{ background: A.bg, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {/* header */}
          <div style={{ padding:'18px 24px', background:'#fff', borderBottom:`1px solid ${A.line}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, color: A.muted, fontWeight: 600, letterSpacing:'0.06em', textTransform:'uppercase' }}>Sin responder · Asignar a</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin:'4px 0 0', letterSpacing:'-0.02em' }}>Consulta sobre Hot Sale Las Olas</h2>
                <div style={{ marginTop: 8, display:'flex', alignItems:'center', gap: 14, fontSize: 12, color: A.muted }}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap: 6 }}><span className="av av-1" style={{ width: 22, height: 22 }}/> María L. · maria.lopez@gmail.com</span>
                  <span>·</span>
                  <span>Sobre la oferta <span style={{ color: A.primary, fontWeight: 600 }}>Hot Sale frente al mar</span></span>
                </div>
              </div>
              <div style={{ display:'flex', gap: 8 }}>
                <button style={{ background:'#fff', border:`1px solid ${A.line}`, padding:'7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500 }}>Archivar</button>
                <button style={{ background:'#fff', border:`1px solid ${A.line}`, padding:'7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500 }}>Marcar leído</button>
                <button style={{ background:'#fff', border:`1px solid ${A.line}`, padding:'7px 10px', borderRadius: 8, fontSize: 12, color: A.muted }}>···</button>
              </div>
            </div>
          </div>

          {/* messages */}
          <div style={{ flex: 1, overflowY:'auto', padding:'24px', display:'flex', flexDirection:'column', gap: 14 }}>
            <div style={{ display:'flex', gap: 12 }}>
              <span className="av av-1" style={{ width: 36, height: 36, flexShrink: 0 }}/>
              <div style={{ flex: 1 }}>
                <div style={{ display:'flex', alignItems:'baseline', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>María L.</span>
                  <span style={{ fontSize: 11, color: A.muted }}>Hace 12 minutos</span>
                </div>
                <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius: 12, borderTopLeftRadius: 4, padding: 14, marginTop: 6, fontSize: 14, color: A.ink2, lineHeight: 1.5 }}>
                  Hola, quería saber si el cupón Hot Sale (-35%) sirve para una habitación triple. Vamos con dos chicos (uno de 8 y otra de 11) y vimos que ustedes ponen "doble ocupación". ¿Podemos usarlo igual sumando una cama extra? ¿Hay un cargo aparte? Gracias!
                </div>
              </div>
            </div>

            <div style={{ display:'flex', gap: 12, flexDirection:'row-reverse' }}>
              <div style={{ width: 36, height: 36, borderRadius:'50%', background: A.primary, color:'#fff', display:'grid', placeItems:'center', flexShrink: 0, fontSize: 12, fontWeight: 700 }}>S</div>
              <div style={{ flex: 1, maxWidth:'80%' }}>
                <div style={{ display:'flex', alignItems:'baseline', gap: 8, justifyContent:'flex-end' }}>
                  <span style={{ fontSize: 11, color: A.muted }}>Pendiente de envío</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Vos (Superadmin)</span>
                </div>
                <div style={{ background: A.primary, color:'#fff', borderRadius: 12, borderTopRightRadius: 4, padding: 14, marginTop: 6, fontSize: 14, lineHeight: 1.5, opacity: 0.5 }}>
                  <span style={{ fontStyle:'italic' }}>Borrador — escribí tu respuesta abajo…</span>
                </div>
              </div>
            </div>
          </div>

          {/* compose */}
          <div style={{ padding:'14px 24px 18px', background:'#fff', borderTop:`1px solid ${A.line}` }}>
            <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius: 14, padding: 14 }}>
              <div style={{ display:'flex', gap: 6, marginBottom: 8 }}>
                {['Hola María','Confirmación','Re-envío','Plantilla'].map(t => (
                  <button key={t} style={{ padding:'4px 10px', background: A.primarySoft, color: A.primary, border:'none', borderRadius: 999, fontSize: 11, fontFamily: A.font, fontWeight: 600 }}>{t}</button>
                ))}
              </div>
              <textarea rows="3" placeholder="Escribí tu respuesta…" style={{ width:'100%', padding: 8, fontSize: 14, fontFamily: A.font, border:'none', outline:'none', resize:'none', color: A.ink, lineHeight: 1.5 }}/>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop: 6, borderTop:`1px solid ${A.line}`, paddingTop: 10 }}>
                <div style={{ fontSize: 11, color: A.muted, display:'inline-flex', alignItems:'center', gap: 6 }}>
                  <Icon.shield width={12} height={12}/> María recibirá tu respuesta por email
                </div>
                <div style={{ display:'flex', gap: 8 }}>
                  <button style={{ background:'#fff', border:`1px solid ${A.line}`, padding:'8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500 }}>Guardar borrador</button>
                  <button style={{ background: A.primary, color:'#fff', border:'none', padding:'8px 16px', borderRadius: 8, fontFamily: A.font, fontWeight: 600, fontSize: 13, display:'inline-flex', alignItems:'center', gap: 6 }}>
                    Enviar respuesta <Icon.arrowR width={13} height={13}/>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

Object.assign(window, { AdminASocios, AdminAVentas, AdminAConsultas, ASidebar });
