// Direction A — Public screens (the rest)
// Búsqueda, Detalle de oferta, Detalle de pack, Gastronomía (listado + detalle), Onboarding socio

// ───── Búsqueda + Resultados ─────
function ABusqueda() {
  return (
    <div style={{ background:'#fff', fontFamily: A.font, color: A.ink }}>
      <ANav/>

      {/* Search bar */}
      <div style={{ padding:'18px 56px', borderBottom:`1px solid ${A.line}`, background:'#fff', position:'sticky', top: 0, zIndex: 5 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr 1fr 1fr auto', gap: 0, border:`1px solid ${A.line}`, borderRadius: 16, overflow:'hidden', background:'#fff' }}>
          <div style={{ padding:'12px 16px', borderRight:`1px solid ${A.line}` }}>
            <div style={{ fontSize: 10, color: A.muted, fontWeight: 600, letterSpacing:'0.08em', textTransform:'uppercase' }}>Destino</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2, display:'inline-flex', alignItems:'center', gap: 6 }}><Icon.pin width={13} height={13} style={{color: A.primary}}/> Villa Gesell</div>
          </div>
          <div style={{ padding:'12px 16px', borderRight:`1px solid ${A.line}` }}>
            <div style={{ fontSize: 10, color: A.muted, fontWeight: 600, letterSpacing:'0.08em', textTransform:'uppercase' }}>Check-in</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>15 Ene 2026</div>
          </div>
          <div style={{ padding:'12px 16px', borderRight:`1px solid ${A.line}` }}>
            <div style={{ fontSize: 10, color: A.muted, fontWeight: 600, letterSpacing:'0.08em', textTransform:'uppercase' }}>Check-out</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>18 Ene 2026</div>
          </div>
          <div style={{ padding:'12px 16px' }}>
            <div style={{ fontSize: 10, color: A.muted, fontWeight: 600, letterSpacing:'0.08em', textTransform:'uppercase' }}>Huéspedes</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>2 adultos · 1 niño</div>
          </div>
          <button style={{ background: A.primary, color:'#fff', border:'none', padding:'0 22px', fontFamily: A.font, fontWeight: 600, fontSize: 14, display:'inline-flex', alignItems:'center', gap: 6 }}>
            <Icon.search width={16} height={16}/> Actualizar
          </button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap: 32, padding:'24px 56px 60px' }}>
        {/* Filters sidebar */}
        <aside>
          <div style={{ position:'sticky', top: 100 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, letterSpacing:'-0.02em' }}>Filtros</h3>
              <button style={{ background:'transparent', border:'none', color: A.primary, fontSize: 12, fontWeight: 600 }}>Limpiar</button>
            </div>

            <div style={{ borderBottom:`1px solid ${A.line}`, paddingBottom: 18, marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Zona</div>
              {['Villa Gesell · Centro','Villa Gesell · Norte','Villa Gesell · Sur','Mar de las Pampas','Mar Azul','Las Gaviotas'].map((z, i) => (
                <label key={i} style={{ display:'flex', alignItems:'center', gap: 10, padding:'6px 0', fontSize: 13, color: A.ink2 }}>
                  <input type="checkbox" defaultChecked={i===0 || i===3} style={{ accentColor: A.primary, width: 16, height: 16 }}/>
                  <span style={{ flex: 1 }}>{z}</span>
                  <span style={{ color: A.muted, fontSize: 12 }}>{[42,18,24,36,12,9][i]}</span>
                </label>
              ))}
            </div>

            <div style={{ borderBottom:`1px solid ${A.line}`, paddingBottom: 18, marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Tipo</div>
              {['Hotel','Cabaña','Departamento','Casa','Hostel'].map((z, i) => (
                <label key={i} style={{ display:'flex', alignItems:'center', gap: 10, padding:'6px 0', fontSize: 13, color: A.ink2 }}>
                  <input type="checkbox" defaultChecked={i<3} style={{ accentColor: A.primary, width: 16, height: 16 }}/>
                  <span style={{ flex: 1 }}>{z}</span>
                  <span style={{ color: A.muted, fontSize: 12 }}>{[58,72,84,18,8][i]}</span>
                </label>
              ))}
            </div>

            <div style={{ borderBottom:`1px solid ${A.line}`, paddingBottom: 18, marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Precio por noche</div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize: 12, color: A.muted, marginBottom: 8 }}>
                <span>$30.000</span><span>$200.000+</span>
              </div>
              {/* track */}
              <div style={{ position:'relative', height: 28 }}>
                <div style={{ position:'absolute', top: 12, left: 0, right: 0, height: 4, background: A.line, borderRadius: 2 }}/>
                <div style={{ position:'absolute', top: 12, left: '18%', right: '32%', height: 4, background: A.primary, borderRadius: 2 }}/>
                <div style={{ position:'absolute', top: 4, left:'18%', width: 20, height: 20, borderRadius:'50%', background:'#fff', border:`2px solid ${A.primary}`, boxShadow:'0 2px 6px rgba(0,0,0,0.15)', transform:'translateX(-50%)' }}/>
                <div style={{ position:'absolute', top: 4, left:'68%', width: 20, height: 20, borderRadius:'50%', background:'#fff', border:`2px solid ${A.primary}`, boxShadow:'0 2px 6px rgba(0,0,0,0.15)', transform:'translateX(-50%)' }}/>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize: 13, fontWeight: 600, marginTop: 6 }}>
                <span>$60.000</span><span>$140.000</span>
              </div>
            </div>

            <div style={{ borderBottom:`1px solid ${A.line}`, paddingBottom: 18, marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Servicios</div>
              {[[Icon.wave,'A 200m del mar', true],[Icon.drop,'Piscina', true],[Icon.coffee,'Desayuno', false],[Icon.sparkle,'Spa', false],[Icon.key,'Unidad completa', false]].map(([Ic,t,d], i) => (
                <label key={i} style={{ display:'flex', alignItems:'center', gap: 10, padding:'6px 0', fontSize: 13, color: A.ink2 }}>
                  <input type="checkbox" defaultChecked={d} style={{ accentColor: A.primary, width: 16, height: 16 }}/>
                  <Ic width={14} height={14} style={{ color: A.muted }}/>
                  <span style={{ flex: 1 }}>{t}</span>
                </label>
              ))}
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Calificación</div>
              {[5,4,3].map(r => (
                <label key={r} style={{ display:'flex', alignItems:'center', gap: 10, padding:'6px 0', fontSize: 13, color: A.ink2 }}>
                  <input type="checkbox" defaultChecked={r===5} style={{ accentColor: A.primary, width: 16, height: 16 }}/>
                  <span style={{ display:'inline-flex', gap: 1, color: A.yellow }}>
                    {[1,2,3,4,5].map(i => <Icon.star key={i} width={12} height={12} style={{ opacity: i <= r ? 1 : 0.2 }}/>)}
                  </span>
                  <span style={{ flex: 1, color: A.muted, fontSize: 12 }}>y más</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Results */}
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 18 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing:'-0.025em' }}>78 alojamientos en Villa Gesell</h1>
              <div style={{ fontSize: 13, color: A.muted, marginTop: 4 }}>15 — 18 enero · 2 adultos, 1 niño</div>
            </div>
            <div style={{ display:'flex', gap: 8, alignItems:'center' }}>
              <div style={{ display:'flex', background: A.bg, padding: 3, borderRadius: 8, border:`1px solid ${A.line}` }}>
                <button style={{ padding:'6px 10px', borderRadius: 6, background:'#fff', border:`1px solid ${A.line}`, color: A.ink, display:'inline-flex', alignItems:'center', gap: 5, fontSize: 12, fontWeight: 600 }}><Icon.grid width={13} height={13}/> Grid</button>
                <button style={{ padding:'6px 10px', borderRadius: 6, background:'transparent', border:'1px solid transparent', color: A.muted, display:'inline-flex', alignItems:'center', gap: 5, fontSize: 12, fontWeight: 600 }}><Icon.pin width={13} height={13}/> Mapa</button>
              </div>
              <select style={{ padding:'8px 12px', borderRadius: 10, border:`1px solid ${A.line}`, background:'#fff', fontSize: 13, fontWeight: 500, fontFamily: A.font, color: A.ink }}>
                <option>Más relevantes</option>
                <option>Menor precio</option>
                <option>Mejor puntuados</option>
              </select>
            </div>
          </div>

          {/* active filters */}
          <div style={{ display:'flex', gap: 8, flexWrap:'wrap', marginBottom: 16 }}>
            {['Villa Gesell · Centro','Mar de las Pampas','Hotel','Cabaña','A 200m del mar','Piscina','5 estrellas'].map(t => (
              <span key={t} style={{ display:'inline-flex', alignItems:'center', gap: 6, padding:'5px 10px', background: A.primarySoft, color: A.primary, borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                {t} <span style={{ cursor:'pointer', fontWeight: 700 }}>×</span>
              </span>
            ))}
          </div>

          {/* results grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 22 }}>
            {[
              { n:'Hotel Spa Las Olas', type:'Hotel · 4★', loc:'Centro · 80m del mar', p:'85.000', r:'4,8', rc:'214', ph:'pool', tags:['Piscina','Spa','Desayuno'], coin: 3 },
              { n:'Cabañas del Pinar', type:'Cabaña · 4 pax', loc:'Mar de las Pampas · Bosque', p:'65.000', r:'4,7', rc:'128', ph:'bosque', tags:['Casa entera','Cocina','WiFi'], coin: 1 },
              { n:'Apart Sol y Arena', type:'Depto · 2 amb', loc:'Centro · 320m del mar', p:'55.000', r:'4,5', rc:'89', ph:'interior', tags:['Cocina','Balcón'], coin: 0 },
              { n:'Boutique Pinar', type:'Hotel · 5★', loc:'Mar de las Pampas', p:'120.000', r:'4,9', rc:'312', ph:'cabana', tags:['Spa','Restaurant','Piscina'], coin: 2 },
              { n:'Mar Abierto', type:'Hotel · 3★', loc:'Villa Gesell · Norte', p:'48.000', r:'4,3', rc:'67', ph:'morning', tags:['Desayuno','Estacionamiento'], coin: 1 },
              { n:'Posada del Mar', type:'Cabaña · 6 pax', loc:'Las Gaviotas · Bosque', p:'95.000', r:'4,6', rc:'154', ph:'bosque', tags:['Parrilla','Pileta','Mascotas OK'], coin: 0 },
            ].map((r, i) => (
              <div key={i} style={{ display:'flex', flexDirection:'column' }}>
                <div style={{ position:'relative', height: 220, borderRadius: 16, overflow:'hidden' }}>
                  <Photo kind={r.ph}/>
                  <button style={{ position:'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius:'50%', background:'rgba(255,255,255,0.95)', border:'none', display:'grid', placeItems:'center', color: A.ink2 }}>
                    <Icon.heart width={15} height={15}/>
                  </button>
                  {r.coin > 0 && (
                    <div style={{ position:'absolute', top: 12, left: 12, background: A.primary, color:'#fff', padding:'4px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing:'0.04em', textTransform:'uppercase', display:'inline-flex', alignItems:'center', gap: 4 }}>
                      <Icon.ticket width={11} height={11}/> +{r.coin} cupon{r.coin>1?'es':''}
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 10, color: A.muted, fontWeight: 600, letterSpacing:'0.06em', textTransform:'uppercase' }}>{r.type}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginTop: 4 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, letterSpacing:'-0.01em' }}>{r.n}</div>
                    <div style={{ display:'inline-flex', alignItems:'center', gap: 3, fontSize: 12, fontWeight: 600 }}>
                      <Icon.star width={11} height={11} style={{color: A.yellow}}/> {r.r} <span style={{ color: A.muted, fontWeight: 500 }}>({r.rc})</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: A.muted, marginTop: 3, display:'inline-flex', alignItems:'center', gap: 3 }}><Icon.pin width={11} height={11}/> {r.loc}</div>
                  <div style={{ marginTop: 8, display:'flex', gap: 4, flexWrap:'wrap' }}>
                    {r.tags.map(t => <span key={t} style={{ fontSize: 10, padding:'2px 6px', background: A.bg, color: A.ink2, borderRadius: 4, fontWeight: 500 }}>{t}</span>)}
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop: 10 }}>
                    <div>
                      <span style={{ fontSize: 11, color: A.muted }}>desde </span>
                      <span style={{ fontSize: 17, fontWeight: 700, letterSpacing:'-0.015em' }}>${r.p}</span>
                      <span style={{ fontSize: 11, color: A.muted }}> / noche</span>
                    </div>
                    <Icon.chevR width={16} height={16} style={{ color: A.primary }}/>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* pagination */}
          <div style={{ marginTop: 32, display:'flex', justifyContent:'center', gap: 4 }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} style={{
                width: 36, height: 36, borderRadius: 10,
                background: n===1 ? A.ink : '#fff',
                color: n===1 ? '#fff' : A.ink,
                border: n===1 ? 'none' : `1px solid ${A.line}`,
                fontFamily: A.font, fontWeight: 600, fontSize: 13,
              }}>{n}</button>
            ))}
            <span style={{ alignSelf:'center', padding:'0 8px', color: A.muted, fontSize: 13 }}>…</span>
            <button style={{ width: 36, height: 36, borderRadius: 10, background:'#fff', color: A.ink, border:`1px solid ${A.line}`, fontFamily: A.font, fontWeight: 600, fontSize: 13 }}>13</button>
            <button style={{ padding:'0 14px', height: 36, borderRadius: 10, background:'#fff', color: A.ink, border:`1px solid ${A.line}`, fontFamily: A.font, fontWeight: 500, fontSize: 13, display:'inline-flex', alignItems:'center', gap: 4 }}>Siguiente <Icon.chevR width={14} height={14}/></button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ───── Detalle de oferta / cupón ─────
function AOfertaDetalle() {
  return (
    <div style={{ background:'#fff', fontFamily: A.font, color: A.ink }}>
      <ANav/>

      <div style={{ padding:'20px 56px 0', fontSize: 13, color: A.muted, display:'flex', alignItems:'center', gap: 6 }}>
        <span>Ofertas</span> <Icon.chevR width={12} height={12}/> <span>Hotel</span> <Icon.chevR width={12} height={12}/> <span style={{ color: A.ink }}>Hot Sale frente al mar</span>
      </div>

      <section style={{ padding:'24px 56px 40px', display:'grid', gridTemplateColumns:'1.4fr 1fr', gap: 48 }}>
        <div>
          <div style={{ position:'relative', borderRadius: 24, overflow:'hidden', height: 460 }}>
            <Photo kind="pool"/>
            <div style={{ position:'absolute', top: 20, left: 20, background: A.ink, color: A.yellow, padding:'6px 14px', borderRadius: 999, fontFamily: A.font, fontSize: 11, fontWeight: 700, letterSpacing:'0.08em', textTransform:'uppercase', display:'inline-flex', alignItems:'center', gap: 6 }}>
              <Icon.bolt width={12} height={12}/> Flash Sale · vence en 2 días
            </div>
            <div style={{ position:'absolute', bottom: 28, left: 28, color:'#fff' }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing:'0.1em', textTransform:'uppercase', opacity: 0.85 }}>Hotel Spa Las Olas</div>
              <div style={{ fontSize: 92, fontWeight: 800, letterSpacing:'-0.04em', lineHeight: 1, marginTop: 6 }}>—35%</div>
            </div>
          </div>

          <h1 style={{ fontSize: 38, fontWeight: 700, letterSpacing:'-0.025em', margin:'28px 0 12px', lineHeight: 1.1 }}>
            Hot Sale frente al mar — tres noches con todo incluido.
          </h1>
          <p style={{ fontSize: 16, color: A.ink2, lineHeight: 1.5, margin: 0, textWrap:'pretty' }}>
            Aprovechá la última semana de Hot Sale en el Las Olas: 35% off en habitaciones standard de tres noches, con desayuno buffet, acceso libre a la pileta climatizada y un circuito de spa para dos. Válido del 15 al 30 de enero, sujeto a disponibilidad.
          </p>

          {/* How it works */}
          <h3 style={{ fontSize: 20, fontWeight: 600, margin:'32px 0 14px' }}>Cómo se usa</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 14 }}>
            {[
              ['1','Sumá el cupón','Lo guardás en tu cuponera, sin pagar nada.'],
              ['2','Reservá en el hotel','Coordinás fecha directo con el socio.'],
              ['3','Mostrá el QR','En el check-in, te aplican el descuento.'],
            ].map(([n, t, d]) => (
              <div key={n} style={{ padding: 18, border:`1px solid ${A.line}`, borderRadius: 14, background:'#fff' }}>
                <div style={{ width: 30, height: 30, borderRadius:'50%', background: A.primarySoft, color: A.primary, display:'grid', placeItems:'center', fontWeight: 700, fontSize: 14 }}>{n}</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 12 }}>{t}</div>
                <div style={{ fontSize: 12, color: A.muted, marginTop: 4, lineHeight: 1.4 }}>{d}</div>
              </div>
            ))}
          </div>

          {/* Conditions */}
          <h3 style={{ fontSize: 20, fontWeight: 600, margin:'32px 0 14px' }}>Condiciones</h3>
          <ul style={{ margin: 0, padding: 0, listStyle:'none', display:'flex', flexDirection:'column', gap: 8 }}>
            {[
              'Válido del 15 al 30 de enero de 2026, ambas fechas incluidas.',
              'Mínimo de 3 noches, sujeto a disponibilidad.',
              'Aplica a habitaciones standard, doble ocupación. Triple +$18.000/noche.',
              'No combinable con otras promociones del socio.',
              'Cancelación gratuita hasta 48hs antes del check-in.',
            ].map((t, i) => (
              <li key={i} style={{ display:'flex', gap: 10, fontSize: 14, color: A.ink2, lineHeight: 1.5 }}>
                <Icon.check width={16} height={16} style={{ color: A.green, flexShrink: 0, marginTop: 3 }}/>
                <span>{t}</span>
              </li>
            ))}
          </ul>

          {/* From the partner */}
          <h3 style={{ fontSize: 20, fontWeight: 600, margin:'32px 0 14px' }}>Otras ofertas del Las Olas</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 14 }}>
            {[['2×1','Spa día completo','1 cupón',A.primary],['—15%','Cena romántica','2 cupones',A.green]].map(([d, t, c, col], i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap: 14, padding: 16, border:`1px solid ${A.line}`, borderRadius: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: col, color:'#fff', display:'grid', placeItems:'center', fontWeight: 800, fontSize: 14, letterSpacing:'-0.02em' }}>{d}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{t}</div>
                  <div style={{ fontSize: 12, color: A.muted, marginTop: 2 }}>{c}</div>
                </div>
                <Icon.chevR width={16} height={16} style={{ color: A.muted }}/>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Action card */}
        <div>
          <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius: 20, padding: 24, position:'sticky', top: 20, boxShadow:'0 20px 60px -30px rgba(11,16,32,0.22)' }}>
            {/* coins */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 18 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: A.muted, letterSpacing:'0.1em', textTransform:'uppercase' }}>Cupones disponibles</span>
              <span style={{ display:'inline-flex', alignItems:'center', gap: 5, fontWeight: 700, fontSize: 16, color: A.ink }}>
                <span style={{ width: 18, height: 18, borderRadius:'50%', background: A.yellow, display:'inline-block' }}/> 3 <span style={{ color: A.muted, fontWeight: 500, fontSize: 13 }}>/ 50</span>
              </span>
            </div>

            <div style={{ padding:'18px 0', borderTop:`1px solid ${A.line}`, borderBottom:`1px solid ${A.line}` }}>
              <div style={{ fontSize: 11, color: A.muted, fontWeight: 600, letterSpacing:'0.08em', textTransform:'uppercase' }}>Ahorro estimado</div>
              <div style={{ display:'flex', alignItems:'baseline', gap: 10, marginTop: 4 }}>
                <span style={{ fontSize: 36, fontWeight: 700, letterSpacing:'-0.025em', color: A.green }}>$89.250</span>
                <span style={{ fontSize: 13, color: A.muted, textDecoration:'line-through' }}>$255.000</span>
              </div>
              <div style={{ fontSize: 12, color: A.muted, marginTop: 4 }}>Sobre 3 noches a tarifa standard.</div>
            </div>

            <button style={{ marginTop: 18, width:'100%', background: A.primary, color:'#fff', border:'none', borderRadius: 14, padding:'14px 0', fontFamily: A.font, fontWeight: 600, fontSize: 15, display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 8 }}>
              <Icon.ticket width={18} height={18}/> Añadir a mi cuponera
            </button>
            <button style={{ marginTop: 8, width:'100%', background:'#fff', color: A.ink, border:`1px solid ${A.line}`, borderRadius: 14, padding:'12px 0', fontFamily: A.font, fontWeight: 500, fontSize: 14, display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 6 }}>
              <Icon.chat width={15} height={15}/> Consultar con el socio
            </button>

            <div style={{ marginTop: 18, padding: 14, background: A.bg, borderRadius: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: A.muted, letterSpacing:'0.06em', textTransform:'uppercase' }}>El socio</div>
              <div style={{ display:'flex', alignItems:'center', gap: 10, marginTop: 8 }}>
                <span className="av av-3" style={{ width: 40, height: 40 }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Hotel Spa Las Olas</div>
                  <div style={{ fontSize: 11, color: A.muted, marginTop: 1 }}>Esteban & Carla · responden en 30min</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 14, fontSize: 12, color: A.muted, lineHeight: 1.5, display:'flex', gap: 8 }}>
              <Icon.shield width={16} height={16} style={{ color: A.green, flexShrink: 0, marginTop: 1 }}/>
              <span>Si el socio no honra el cupón, te lo reembolsamos en 24hs. Garantía gesell.ar.</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ───── Detalle de pack ─────
function APackDetalle() {
  return (
    <div style={{ background:'#fff', fontFamily: A.font, color: A.ink }}>
      <ANav/>

      <div style={{ padding:'20px 56px 0', fontSize: 13, color: A.muted, display:'flex', alignItems:'center', gap: 6 }}>
        <span>Packs</span> <Icon.chevR width={12} height={12}/> <span>Romántico</span> <Icon.chevR width={12} height={12}/> <span style={{ color: A.ink }}>Escapada Romántica</span>
      </div>

      {/* Gallery */}
      <section style={{ padding:'24px 56px 24px', display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gridTemplateRows:'1fr 1fr', gap: 8, height: 440 }}>
        <div style={{ gridRow:'1 / span 2', borderRadius: 20, overflow:'hidden' }}><Photo kind="interior"/></div>
        <div style={{ borderRadius: 20, overflow:'hidden' }}><Photo kind="rest"/></div>
        <div style={{ borderRadius: 20, overflow:'hidden' }}><Photo kind="spa"/></div>
        <div style={{ borderRadius: 20, overflow:'hidden' }}><Photo kind="pool"/></div>
        <div style={{ borderRadius: 20, overflow:'hidden', position:'relative' }}>
          <Photo kind="beach"/>
          <button style={{ position:'absolute', bottom: 14, right: 14, background:'#fff', border:'none', padding:'8px 14px', borderRadius: 999, fontFamily: A.font, fontSize: 12, fontWeight: 600 }}>+ 12 fotos</button>
        </div>
      </section>

      <section style={{ padding:'24px 56px 64px', display:'grid', gridTemplateColumns:'1.5fr 1fr', gap: 48 }}>
        <div>
          <div style={{ display:'inline-flex', alignItems:'center', gap: 6, padding:'5px 12px', background:'#FF3D7F', color:'#fff', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom: 14 }}>
            ⭐ MÁS VENDIDO · 142 packs este verano
          </div>
          <h1 style={{ fontSize: 52, fontWeight: 700, letterSpacing:'-0.03em', margin: 0, lineHeight: 1, color: A.ink }}>
            Escapada<br/>
            <span style={{ color: A.primary }}>Romántica.</span>
          </h1>
          <div style={{ display:'flex', gap: 18, marginTop: 14, fontSize: 13, color: A.muted }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap: 5, color: A.ink, fontWeight: 600 }}><Icon.star width={14} height={14} style={{color: A.yellow}}/> 4,9 (87 reseñas)</span>
            <span style={{ display:'inline-flex', alignItems:'center', gap: 5 }}><Icon.calendar width={13} height={13}/> 2 noches · 3 días</span>
            <span style={{ display:'inline-flex', alignItems:'center', gap: 5 }}><Icon.users width={13} height={13}/> 2 personas</span>
          </div>
          <p style={{ fontSize: 17, color: A.ink2, lineHeight: 1.5, marginTop: 20, maxWidth: 620, textWrap:'pretty' }}>
            Una experiencia diseñada para quienes quieren vivir Villa Gesell sin organizar nada. Tres días pensados con detalle, alojamiento boutique, una cena maridada y un circuito de spa para dos. Cada componente fue elegido por nuestro equipo y verificado con el socio.
          </p>

          <h3 style={{ fontSize: 22, fontWeight: 600, margin:'34px 0 16px', letterSpacing:'-0.015em' }}>Qué incluye este pack</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr', gap: 12 }}>
            {[
              { icon: Icon.key, t:'Alojamiento', s:'Boutique Pinar — 2 noches en habitación deluxe con vista al jardín', ph:'cabana', tag:'Boutique Pinar · Mar de las Pampas' },
              { icon: Icon.utensils, t:'Cena maridada', s:'Menú de 5 pasos con vinos de la región en El Viejo Hobby', ph:'rest', tag:'El Viejo Hobby · Villa Gesell' },
              { icon: Icon.sparkle, t:'Circuito de spa', s:'Día completo de termas + masaje descontracturante para dos', ph:'spa', tag:'Hotel Spa Las Olas · Centro' },
              { icon: Icon.coffee, t:'Desayunos al jardín', s:'Buffet completo los dos días en el lobby del boutique', ph:'coffee', tag:'Incluido en el alojamiento' },
            ].map((it, i) => (
              <div key={i} style={{ display:'flex', gap: 16, padding: 16, border:`1px solid ${A.line}`, borderRadius: 16, background:'#fff' }}>
                <div style={{ width: 96, height: 96, borderRadius: 12, overflow:'hidden', flexShrink: 0 }}><Photo kind={it.ph}/></div>
                <div style={{ flex: 1, display:'flex', flexDirection:'column' }}>
                  <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: A.primarySoft, color: A.primary, display:'grid', placeItems:'center' }}>
                      <it.icon width={15} height={15}/>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{it.t}</div>
                  </div>
                  <div style={{ fontSize: 14, color: A.ink2, marginTop: 8, lineHeight: 1.45 }}>{it.s}</div>
                  <div style={{ marginTop:'auto', paddingTop: 6, fontSize: 11, color: A.muted, fontWeight: 600, letterSpacing:'0.04em', textTransform:'uppercase', display:'inline-flex', alignItems:'center', gap: 4 }}>
                    <Icon.check width={12} height={12} style={{ color: A.green }}/> {it.tag}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <h3 style={{ fontSize: 22, fontWeight: 600, margin:'34px 0 16px', letterSpacing:'-0.015em' }}>Cómo es el día a día</h3>
          <div style={{ position:'relative', paddingLeft: 28 }}>
            <div style={{ position:'absolute', left: 11, top: 8, bottom: 8, width: 2, background: A.line }}/>
            {[
              { d:'Día 1', t:'Llegada y descanso', s:'Check-in 14h en el Boutique Pinar. Tarde libre en el bosque o la pileta. A la noche, cena maridada en El Viejo Hobby (reserva 21h).' },
              { d:'Día 2', t:'Spa y costa', s:'Desayuno al jardín. Día completo de spa con almuerzo ligero. A la tarde, caminata por la costa de Mar Azul.' },
              { d:'Día 3', t:'Mañana lenta', s:'Desayuno tardío hasta las 11h. Check-out 12h con opción de late check-out gratuito.' },
            ].map((day, i) => (
              <div key={i} style={{ position:'relative', marginBottom: 18 }}>
                <div style={{ position:'absolute', left:-28, top: 4, width: 22, height: 22, borderRadius:'50%', background: A.primary, color:'#fff', display:'grid', placeItems:'center', fontSize: 11, fontWeight: 700 }}>{i+1}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: A.muted, letterSpacing:'0.08em', textTransform:'uppercase' }}>{day.d}</div>
                <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>{day.t}</div>
                <div style={{ fontSize: 13, color: A.ink2, lineHeight: 1.5, marginTop: 4 }}>{day.s}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Booking card */}
        <div>
          <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius: 20, padding: 24, position:'sticky', top: 20, boxShadow:'0 20px 60px -30px rgba(11,16,32,0.22)' }}>
            <div style={{ fontSize: 11, color: A.muted, fontWeight: 600, letterSpacing:'0.08em', textTransform:'uppercase' }}>Pack completo, desde</div>
            <div style={{ display:'flex', alignItems:'baseline', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 40, fontWeight: 800, letterSpacing:'-0.03em', color: A.ink }}>$145.000</span>
              <span style={{ fontSize: 14, color: A.muted, textDecoration:'line-through' }}>$210.000</span>
            </div>
            <div style={{ fontSize: 13, color: A.green, fontWeight: 600, marginTop: 4 }}>Ahorrás $65.000 vs reservar por separado</div>

            <div style={{ marginTop: 18, border:`1px solid ${A.line}`, borderRadius: 12, overflow:'hidden' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', borderBottom:`1px solid ${A.line}` }}>
                <div style={{ padding: 12, borderRight:`1px solid ${A.line}` }}>
                  <div style={{ fontSize: 10, color: A.muted, fontWeight: 600, letterSpacing:'0.08em', textTransform:'uppercase' }}>Llegada</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>Vie 15 Feb</div>
                </div>
                <div style={{ padding: 12 }}>
                  <div style={{ fontSize: 10, color: A.muted, fontWeight: 600, letterSpacing:'0.08em', textTransform:'uppercase' }}>Salida</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>Dom 17 Feb</div>
                </div>
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 10, color: A.muted, fontWeight: 600, letterSpacing:'0.08em', textTransform:'uppercase' }}>Personas</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>2 adultos</div>
              </div>
            </div>

            <button style={{ marginTop: 16, width:'100%', background: A.primary, color:'#fff', border:'none', borderRadius: 14, padding:'14px 0', fontFamily: A.font, fontWeight: 600, fontSize: 15 }}>
              Reservar este pack →
            </button>
            <div style={{ marginTop: 8, fontSize: 11, color: A.muted, textAlign:'center' }}>No te cobramos hasta confirmar disponibilidad.</div>

            <div style={{ marginTop: 18, padding: 14, background: A.primarySoft, borderRadius: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: A.primary, letterSpacing:'0.06em', textTransform:'uppercase', display:'inline-flex', alignItems:'center', gap: 6 }}>
                <Icon.bolt width={12} height={12}/> Bonus
              </div>
              <div style={{ fontSize: 13, color: A.ink2, marginTop: 6, lineHeight: 1.4 }}>Te sumamos <span style={{ fontWeight: 700, color: A.ink }}>4 cupones</span> para que canjees en bares, restaurantes y actividades durante tu estadía.</div>
            </div>

            <div style={{ marginTop: 14, fontSize: 12, color: A.muted, lineHeight: 1.5, display:'flex', gap: 8 }}>
              <Icon.shield width={16} height={16} style={{ color: A.green, flexShrink: 0, marginTop: 1 }}/>
              <span>Garantía gesell.ar — si algo no sale, lo arreglamos o te devolvemos.</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ───── Gastronomía listado ─────
function AGastroListado() {
  return (
    <div style={{ background:'#fff', fontFamily: A.font, color: A.ink }}>
      <ANav/>

      <section style={{ padding:'40px 56px 24px' }}>
        <div style={{ fontSize: 12, color: A.primary, fontWeight: 600, letterSpacing:'0.08em', textTransform:'uppercase' }}>Sabores de la villa</div>
        <h1 style={{ fontSize: 56, fontWeight: 700, letterSpacing:'-0.03em', margin:'10px 0 0', lineHeight: 1 }}>Dónde comer<br/><span style={{ color: A.primary }}>en Gesell.</span></h1>
        <p style={{ fontSize: 17, color: A.ink2, marginTop: 14, maxWidth: 580, lineHeight: 1.5 }}>
          87 lugares con su carta, sus horarios reales y los cupones activos. Curado por geselinos, sin pagados encubiertos.
        </p>

        {/* Filter row */}
        <div style={{ marginTop: 28, display:'flex', gap: 10, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ display:'flex', gap: 6, background: A.bg, padding: 5, borderRadius: 999, border:`1px solid ${A.line}` }}>
            {['Todo','Restaurant','Bar','Café','Heladería','Parrilla','Pizza'].map((t, i) => (
              <button key={t} style={{
                padding:'8px 16px', borderRadius: 999, border:'none',
                background: i===0 ? A.ink : 'transparent',
                color: i===0 ? '#fff' : A.ink2,
                fontFamily: A.font, fontWeight: 600, fontSize: 13,
              }}>{t}</button>
            ))}
          </div>
          <div style={{ marginLeft:'auto', display:'flex', gap: 8 }}>
            <select style={{ padding:'9px 14px', borderRadius: 10, border:`1px solid ${A.line}`, background:'#fff', fontSize: 13, fontFamily: A.font, fontWeight: 500 }}>
              <option>Cualquier zona</option>
              <option>Villa Gesell · Centro</option>
              <option>Mar de las Pampas</option>
            </select>
            <select style={{ padding:'9px 14px', borderRadius: 10, border:`1px solid ${A.line}`, background:'#fff', fontSize: 13, fontFamily: A.font, fontWeight: 500 }}>
              <option>Cualquier rango</option>
              <option>$ Económico</option>
              <option>$$ Medio</option>
              <option>$$$ Alto</option>
            </select>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section style={{ padding:'12px 56px 64px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 22 }}>
          {[
            { n:'El Viejo Hobby', t:'Restaurant · Bodegón', d:'Las minutas de toda la vida, frente a la avenida 3.', ph:'rest', icon: Icon.utensils, r:'4,6', loc:'Villa Gesell · Centro', price:'$$', coin: 1 },
            { n:'Churros El Topo', t:'Café · Histórico', d:'Funciona desde 1947. Churros con dulce de leche, infaltable.', ph:'coffee', icon: Icon.mug, r:'4,9', loc:'Av 3 · Centro', price:'$', coin: 0 },
            { n:'Cervecería Dublín', t:'Bar · Artesanal', d:'Cerveza tirada del día y las mejores papas con cheddar.', ph:'cerveza', icon: Icon.beer, r:'4,7', loc:'Villa Gesell · Norte', price:'$$', coin: 2 },
            { n:'La Tigra', t:'Restaurant · Autor', d:'Cocina de mercado, carta corta que cambia cada semana.', ph:'rest', icon: Icon.utensils, r:'4,8', loc:'Mar de las Pampas', price:'$$$', coin: 1 },
            { n:'Vista al Mar', t:'Restaurant · Pescados', d:'Mariscos frescos del puerto, terraza con vista directa.', ph:'beach', icon: Icon.utensils, r:'4,5', loc:'Costanera · Sur', price:'$$$', coin: 0 },
            { n:'Café del Pueblo', t:'Café · Especialidad', d:'Tostada nacional y pastelería de autor en el corazón del centro.', ph:'coffee', icon: Icon.mug, r:'4,8', loc:'Centro', price:'$$', coin: 1 },
          ].map((s, i) => (
            <div key={i} style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius: 20, overflow:'hidden', display:'flex', flexDirection:'column' }}>
              <div style={{ position:'relative', height: 200 }}>
                <Photo kind={s.ph}/>
                <div style={{ position:'absolute', top: 12, left: 12, width: 38, height: 38, borderRadius:'50%', background: A.primary, color:'#fff', display:'grid', placeItems:'center' }}>
                  <s.icon width={18} height={18}/>
                </div>
                {s.coin > 0 && (
                  <div style={{ position:'absolute', top: 12, right: 12, background: A.ink, color:'#fff', padding:'4px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing:'0.04em', textTransform:'uppercase', display:'inline-flex', alignItems:'center', gap: 4 }}>
                    <Icon.ticket width={11} height={11}/> {s.coin} cupón{s.coin>1?'es':''}
                  </div>
                )}
              </div>
              <div style={{ padding: 16, flex: 1, display:'flex', flexDirection:'column' }}>
                <div style={{ fontSize: 11, color: A.muted, fontWeight: 600, letterSpacing:'0.06em', textTransform:'uppercase' }}>{s.t}</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginTop: 4 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing:'-0.015em' }}>{s.n}</div>
                  <div style={{ fontSize: 12, color: A.muted, fontWeight: 600 }}>{s.price}</div>
                </div>
                <div style={{ fontSize: 13, color: A.ink2, marginTop: 6, lineHeight: 1.4 }}>{s.d}</div>
                <div style={{ marginTop: 12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize: 12, color: A.muted, display:'inline-flex', alignItems:'center', gap: 4 }}><Icon.pin width={11} height={11}/> {s.loc}</span>
                  <span style={{ display:'inline-flex', alignItems:'center', gap: 4, fontSize: 13, fontWeight: 600 }}><Icon.star width={12} height={12} style={{color: A.yellow}}/> {s.r}</span>
                </div>
                <button style={{ marginTop: 14, background:'#fff', color: A.primary, border:`1px solid ${A.line}`, borderRadius: 12, padding:'10px 0', fontFamily: A.font, fontSize: 13, fontWeight: 600, display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 6 }}>
                  Ver menú y ubicación <Icon.chevR width={14} height={14}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ───── Gastronomía detalle ─────
function AGastroDetalle() {
  return (
    <div style={{ background:'#fff', fontFamily: A.font, color: A.ink }}>
      <ANav/>

      <div style={{ padding:'20px 56px 0', fontSize: 13, color: A.muted, display:'flex', alignItems:'center', gap: 6 }}>
        <span>Gastronomía</span> <Icon.chevR width={12} height={12}/> <span>Restaurant</span> <Icon.chevR width={12} height={12}/> <span style={{ color: A.ink }}>El Viejo Hobby</span>
      </div>

      <section style={{ padding:'18px 56px 24px', display:'grid', gridTemplateColumns:'1.5fr 1fr', gap: 32, alignItems:'flex-end' }}>
        <div>
          <div style={{ display:'inline-flex', alignItems:'center', gap: 6, padding:'4px 10px', background: A.primarySoft, color: A.primary, borderRadius: 999, fontSize: 11, fontWeight: 600, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom: 14 }}>
            <Icon.utensils width={11} height={11}/> Restaurant · Bodegón
          </div>
          <h1 style={{ fontSize: 56, fontWeight: 700, letterSpacing:'-0.03em', margin: 0, lineHeight: 1 }}>El Viejo Hobby</h1>
          <p style={{ fontSize: 17, color: A.ink2, lineHeight: 1.5, marginTop: 14, maxWidth: 560 }}>
            Bodegón clásico de Villa Gesell. Funciona desde 1986 sobre la avenida 3 con la misma carta de minutas que les hizo el nombre.
          </p>
          <div style={{ marginTop: 16, display:'flex', gap: 18, fontSize: 13, color: A.muted, flexWrap:'wrap' }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap: 5, color: A.ink, fontWeight: 600 }}><Icon.star width={14} height={14} style={{color: A.yellow}}/> 4,6 (412)</span>
            <span style={{ display:'inline-flex', alignItems:'center', gap: 5 }}><Icon.pin width={13} height={13}/> Av 3 entre Paseo 105 y 106</span>
            <span style={{ display:'inline-flex', alignItems:'center', gap: 5, color: A.green, fontWeight: 600 }}>● Abierto · cierra 1:30am</span>
          </div>
        </div>
        <div style={{ display:'flex', gap: 10, justifyContent:'flex-end' }}>
          <button style={{ background:'#fff', border:`1px solid ${A.line}`, padding:'10px 14px', borderRadius: 12, fontFamily: A.font, fontSize: 13, fontWeight: 500, display:'inline-flex', alignItems:'center', gap: 6 }}><Icon.heart width={15} height={15}/> Guardar</button>
          <button style={{ background:'#fff', border:`1px solid ${A.line}`, padding:'10px 14px', borderRadius: 12, fontFamily: A.font, fontSize: 13, fontWeight: 500 }}>Compartir</button>
        </div>
      </section>

      {/* Gallery */}
      <section style={{ padding:'8px 56px 40px', display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap: 8, height: 380 }}>
        <div style={{ borderRadius: 20, overflow:'hidden' }}><Photo kind="rest"/></div>
        <div style={{ display:'grid', gridTemplateRows:'1fr 1fr', gap: 8 }}>
          <div style={{ borderRadius: 20, overflow:'hidden' }}><Photo kind="rest"/></div>
          <div style={{ borderRadius: 20, overflow:'hidden' }}><Photo kind="coffee"/></div>
        </div>
        <div style={{ display:'grid', gridTemplateRows:'1fr 1fr', gap: 8 }}>
          <div style={{ borderRadius: 20, overflow:'hidden' }}><Photo kind="cerveza"/></div>
          <div style={{ borderRadius: 20, overflow:'hidden', position:'relative' }}>
            <Photo kind="interior"/>
            <button style={{ position:'absolute', bottom: 10, right: 10, background:'#fff', border:'none', padding:'6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>+ 8</button>
          </div>
        </div>
      </section>

      {/* Body */}
      <section style={{ padding:'0 56px 64px', display:'grid', gridTemplateColumns:'1.5fr 1fr', gap: 48 }}>
        <div>
          <h3 style={{ fontSize: 22, fontWeight: 600, margin:'0 0 14px', letterSpacing:'-0.015em' }}>Lo imperdible</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 12 }}>
            {[
              ['Milanesa napolitana','$8.400','Para dos, fácil.'],
              ['Bondiola al verdeo','$9.600','La que recomienda Diego.'],
              ['Provoleta a la parrilla','$5.800','Para empezar bien.'],
              ['Tira de asado','$11.200','350g, tierna.'],
              ['Ñoquis caseros','$6.800','29 de cada mes.'],
              ['Flan con dulce','$3.400','Mejor que el de tu abuela. Casi.'],
            ].map(([t, p, s], i) => (
              <div key={i} style={{ padding: 14, border:`1px solid ${A.line}`, borderRadius: 14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{t}</span>
                  <span style={{ fontSize: 13, color: A.primary, fontWeight: 700 }}>{p}</span>
                </div>
                <div style={{ fontSize: 12, color: A.muted, marginTop: 4 }}>{s}</div>
              </div>
            ))}
          </div>

          <h3 style={{ fontSize: 22, fontWeight: 600, margin:'34px 0 14px', letterSpacing:'-0.015em' }}>El lugar</h3>
          <p style={{ fontSize: 15, color: A.ink2, lineHeight: 1.6, margin: 0, textWrap:'pretty' }}>
            Diego abrió el local en el '86, recién separado y sin un peso. Empezó cocinando milanesas a pedido y terminó siendo el bodegón al que vuelven tres generaciones. La carta es la misma desde el 92, salvo por algún capricho estacional.
          </p>
          <p style={{ fontSize: 14, color: A.muted, fontStyle:'italic', marginTop: 10 }}>
            "El día que cambien las milas, cierro" — Diego, dueño.
          </p>

          {/* Reviews */}
          <h3 style={{ fontSize: 22, fontWeight: 600, margin:'34px 0 14px', letterSpacing:'-0.015em' }}>Qué dicen</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 14 }}>
            {[
              ['María L.','av-1','Vamos en familia hace 15 años. Nunca cambia, eso es lo mejor.'],
              ['Pablo G.','av-2','La napolitana es enorme. Llevamos doggy bag siempre.'],
            ].map(([n, av, q], i) => (
              <div key={i} style={{ padding: 16, border:`1px solid ${A.line}`, borderRadius: 14 }}>
                <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                  <span className={`av ${av}`} style={{ width: 32, height: 32 }}/>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{n}</div>
                    <div style={{ display:'flex', gap: 1, color: A.yellow }}>{[1,2,3,4,5].map(j=>(<Icon.star key={j} width={11} height={11}/>))}</div>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: A.ink2, marginTop: 10, margin:'10px 0 0', lineHeight: 1.5 }}>"{q}"</p>
              </div>
            ))}
          </div>
        </div>

        {/* Info side */}
        <div>
          <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius: 20, overflow:'hidden', position:'sticky', top: 20 }}>
            {/* Map */}
            <div style={{ height: 200, background: 'linear-gradient(135deg, #DDE7F0, #C4D4E0)', position:'relative' }}>
              <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)', color: A.primary }}>
                <Icon.pin width={32} height={32} fill={A.primary}/>
              </div>
              {/* fake streets */}
              <svg viewBox="0 0 100 80" preserveAspectRatio="none" style={{ position:'absolute', inset: 0, width:'100%', height:'100%', opacity: 0.5 }}>
                <path d="M0 30 L100 30 M0 60 L100 60 M30 0 L30 80 M70 0 L70 80" stroke="#9AB" strokeWidth="0.4"/>
              </svg>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap: 10 }}>
                <Icon.pin width={16} height={16} style={{ color: A.primary, marginTop: 3 }}/>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Av 3 entre Paseos 105 y 106</div>
                  <div style={{ fontSize: 12, color: A.muted, marginTop: 2 }}>Villa Gesell · Centro</div>
                </div>
              </div>
              <button style={{ marginTop: 12, width:'100%', background:'#fff', color: A.ink, border:`1px solid ${A.line}`, borderRadius: 10, padding:'10px 0', fontSize: 13, fontWeight: 500 }}>Cómo llegar →</button>
            </div>

            <div style={{ borderTop:`1px solid ${A.line}`, padding: 18 }}>
              <div style={{ fontSize: 11, color: A.muted, fontWeight: 600, letterSpacing:'0.08em', textTransform:'uppercase' }}>Horarios</div>
              <div style={{ fontSize: 13, color: A.ink, marginTop: 8, lineHeight: 1.7 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span>Lun — Jue</span><span style={{ color: A.muted }}>20h — 0h</span></div>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ fontWeight: 600 }}>Vie — Sáb</span><span style={{ color: A.green, fontWeight: 600 }}>20h — 1:30am</span></div>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span>Domingo</span><span style={{ color: A.muted }}>12h — 16h y 20h — 0h</span></div>
              </div>
            </div>

            <div style={{ borderTop:`1px solid ${A.line}`, padding: 18, background: A.primarySoft }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: A.primary, display:'inline-flex', alignItems:'center', gap: 6 }}>
                <Icon.ticket width={13} height={13}/> 1 cupón activo acá
              </div>
              <div style={{ fontSize: 13, color: A.ink, marginTop: 8, fontWeight: 600 }}>-20% en cenas Lun-Mié</div>
              <button style={{ marginTop: 10, width:'100%', background: A.primary, color:'#fff', border:'none', borderRadius: 10, padding:'10px 0', fontFamily: A.font, fontWeight: 600, fontSize: 13 }}>
                Añadir cupón
              </button>
            </div>

            <div style={{ borderTop:`1px solid ${A.line}`, padding: 18, display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8 }}>
              <button style={{ background: A.ink, color:'#fff', border:'none', borderRadius: 10, padding:'10px 0', fontSize: 13, fontWeight: 600, display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 5 }}>
                Reservar
              </button>
              <button style={{ background:'#fff', color: A.ink, border:`1px solid ${A.line}`, borderRadius: 10, padding:'10px 0', fontSize: 13, fontWeight: 500, display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 5 }}>
                <Icon.chat width={14} height={14}/> WhatsApp
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ───── Onboarding de socio ─────
function AOnboardingSocio() {
  return (
    <div style={{ background: A.bg, fontFamily: A.font, color: A.ink, display:'grid', gridTemplateColumns:'320px 1fr', height:'100%' }}>
      {/* Sidebar progress */}
      <aside style={{ background:'#fff', borderRight:`1px solid ${A.line}`, padding:'28px 24px', display:'flex', flexDirection:'column' }}>
        <LogoG size={32} primary={A.primary} textColor={A.ink} radius={8} family={A.font}/>
        <div style={{ marginTop: 32, fontSize: 11, color: A.muted, fontWeight: 600, letterSpacing:'0.1em', textTransform:'uppercase' }}>Sumate como socio</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin:'6px 0 0', letterSpacing:'-0.02em' }}>Te llevará 5 minutos.</h2>

        {/* Steps */}
        <div style={{ marginTop: 32, position:'relative' }}>
          <div style={{ position:'absolute', left: 15, top: 14, bottom: 14, width: 2, background: A.line }}/>
          {[
            ['Cuenta','Email, contraseña y nombre', 'done'],
            ['Tu negocio','Datos de tu hotel, resto o experiencia', 'current'],
            ['Verificación','Subí dos documentos', 'pending'],
            ['Pricing','Elegí tu primer plan', 'pending'],
            ['Listo','Te aprobamos en 24hs', 'pending'],
          ].map(([t, d, s], i) => {
            const isDone = s === 'done', isCurrent = s === 'current';
            return (
              <div key={t} style={{ position:'relative', display:'flex', gap: 14, marginBottom: 20 }}>
                <div style={{
                  width: 32, height: 32, borderRadius:'50%',
                  background: isDone ? A.green : (isCurrent ? A.primary : '#fff'),
                  border: isDone || isCurrent ? 'none' : `2px solid ${A.line}`,
                  color: (isDone || isCurrent) ? '#fff' : A.muted,
                  display:'grid', placeItems:'center', flexShrink: 0,
                  fontSize: 13, fontWeight: 700,
                }}>
                  {isDone ? <Icon.check width={16} height={16}/> : (i+1)}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: isCurrent ? A.ink : A.ink2 }}>{t}</div>
                  <div style={{ fontSize: 12, color: A.muted, marginTop: 2 }}>{d}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop:'auto', padding: 16, background: A.primarySoft, borderRadius: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: A.primary, display:'inline-flex', alignItems:'center', gap: 6 }}>
            <Icon.chat width={13} height={13}/> ¿Dudas?
          </div>
          <div style={{ fontSize: 12, color: A.ink2, marginTop: 6, lineHeight: 1.4 }}>Escribinos al WhatsApp <span style={{ fontWeight: 600, color: A.ink }}>+54 9 2255 78-3298</span>. Atendemos lun-vie 9-18h.</div>
        </div>
      </aside>

      {/* Form */}
      <main style={{ padding:'40px 64px', overflowY:'hidden' }}>
        <div style={{ maxWidth: 680 }}>
          <div style={{ fontSize: 12, color: A.muted, fontWeight: 600, letterSpacing:'0.08em', textTransform:'uppercase' }}>Paso 2 de 5</div>
          <h1 style={{ fontSize: 38, fontWeight: 700, letterSpacing:'-0.025em', margin:'8px 0 0', lineHeight: 1.05 }}>Contanos sobre tu negocio.</h1>
          <p style={{ fontSize: 15, color: A.muted, marginTop: 10, maxWidth: 540 }}>Estos datos los ven los turistas en tu perfil. Podés editarlos cuando quieras.</p>

          <div style={{ marginTop: 28, display:'grid', gridTemplateColumns:'1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: A.ink2, fontWeight: 600, letterSpacing:'0.04em', textTransform:'uppercase' }}>Nombre comercial *</label>
              <input style={{ width:'100%', padding:'12px 14px', borderRadius: 12, border:`1px solid ${A.line}`, fontSize: 15, fontFamily: A.font, marginTop: 6, color: A.ink, background:'#fff' }} defaultValue="Hotel Spa Las Olas"/>
            </div>
            <div>
              <label style={{ fontSize: 12, color: A.ink2, fontWeight: 600, letterSpacing:'0.04em', textTransform:'uppercase' }}>Tipo de negocio *</label>
              <div style={{ position:'relative', marginTop: 6 }}>
                <select style={{ width:'100%', padding:'12px 14px', borderRadius: 12, border:`1px solid ${A.line}`, fontSize: 15, fontFamily: A.font, color: A.ink, background:'#fff', appearance:'none' }}>
                  <option>Hotel · 4 estrellas</option>
                  <option>Cabaña</option>
                  <option>Restaurant</option>
                  <option>Experiencia</option>
                </select>
                <Icon.chevD width={14} height={14} style={{ position:'absolute', right: 14, top:'50%', transform:'translateY(-50%)', color: A.muted, pointerEvents:'none' }}/>
              </div>
            </div>

            <div style={{ gridColumn:'1 / -1' }}>
              <label style={{ fontSize: 12, color: A.ink2, fontWeight: 600, letterSpacing:'0.04em', textTransform:'uppercase' }}>Descripción breve</label>
              <textarea rows="3" style={{ width:'100%', padding:'12px 14px', borderRadius: 12, border:`1px solid ${A.line}`, fontSize: 14, fontFamily: A.font, marginTop: 6, color: A.ink, background:'#fff', resize:'none', lineHeight: 1.5 }} defaultValue="Hotel boutique sobre la costanera, 24 habitaciones con balcón y pileta climatizada todo el año."/>
              <div style={{ fontSize: 11, color: A.muted, marginTop: 4, display:'flex', justifyContent:'space-between' }}>
                <span>Máx 280 caracteres. Aparece en tu perfil público.</span>
                <span>147 / 280</span>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, color: A.ink2, fontWeight: 600, letterSpacing:'0.04em', textTransform:'uppercase' }}>Zona *</label>
              <div style={{ position:'relative', marginTop: 6 }}>
                <select style={{ width:'100%', padding:'12px 14px', borderRadius: 12, border:`1px solid ${A.line}`, fontSize: 15, fontFamily: A.font, color: A.ink, background:'#fff', appearance:'none' }}>
                  <option>Villa Gesell · Centro</option>
                  <option>Villa Gesell · Norte</option>
                  <option>Mar de las Pampas</option>
                </select>
                <Icon.chevD width={14} height={14} style={{ position:'absolute', right: 14, top:'50%', transform:'translateY(-50%)', color: A.muted, pointerEvents:'none' }}/>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: A.ink2, fontWeight: 600, letterSpacing:'0.04em', textTransform:'uppercase' }}>Dirección</label>
              <input style={{ width:'100%', padding:'12px 14px', borderRadius: 12, border:`1px solid ${A.line}`, fontSize: 15, fontFamily: A.font, marginTop: 6, color: A.ink, background:'#fff' }} defaultValue="Av Costanera 280"/>
            </div>

            <div style={{ gridColumn:'1 / -1' }}>
              <label style={{ fontSize: 12, color: A.ink2, fontWeight: 600, letterSpacing:'0.04em', textTransform:'uppercase' }}>Servicios principales</label>
              <div style={{ marginTop: 10, display:'flex', flexWrap:'wrap', gap: 8 }}>
                {[
                  ['🌊','A menos de 200m del mar', true],
                  ['💧','Piscina', true],
                  ['☕','Desayuno', true],
                  ['🅿','Estacionamiento', true],
                  ['🔑','Unidad completa', false],
                  ['✨','Spa', true],
                  ['🐶','Pet-friendly', false],
                  ['📶','WiFi', true],
                  ['🍳','Cocina', false],
                ].map(([e, t, on], i) => (
                  <button key={i} style={{
                    padding:'8px 14px', borderRadius: 999,
                    border: on ? `1px solid ${A.primary}` : `1px solid ${A.line}`,
                    background: on ? A.primarySoft : '#fff',
                    color: on ? A.primary : A.ink2,
                    fontFamily: A.font, fontSize: 13, fontWeight: 500,
                    display:'inline-flex', alignItems:'center', gap: 6,
                  }}>
                    <span style={{ fontSize: 14 }}>{e}</span>{t}
                    {on && <Icon.check width={12} height={12}/>}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ gridColumn:'1 / -1', display:'flex', justifyContent:'space-between', alignItems:'center', marginTop: 22, paddingTop: 22, borderTop:`1px solid ${A.line}` }}>
              <button style={{ background:'transparent', border:'none', color: A.ink2, fontFamily: A.font, fontWeight: 500, fontSize: 14, display:'inline-flex', alignItems:'center', gap: 6 }}><Icon.arrowL width={16} height={16}/> Volver</button>
              <div style={{ display:'flex', gap: 10 }}>
                <button style={{ background:'#fff', border:`1px solid ${A.line}`, color: A.ink, borderRadius: 12, padding:'12px 18px', fontFamily: A.font, fontWeight: 500, fontSize: 14 }}>Guardar y salir</button>
                <button style={{ background: A.primary, color:'#fff', border:'none', borderRadius: 12, padding:'12px 22px', fontFamily: A.font, fontWeight: 600, fontSize: 14, display:'inline-flex', alignItems:'center', gap: 6 }}>Siguiente <Icon.arrowR width={16} height={16}/></button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

Object.assign(window, { ABusqueda, AOfertaDetalle, APackDetalle, AGastroListado, AGastroDetalle, AOnboardingSocio });
