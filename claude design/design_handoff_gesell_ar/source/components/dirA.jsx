// Direction A — "Aire"
// Refresh conservador del sistema actual. Mismo azul pero refinado.
// Type: Geist · Color: blue #2545E6 + grises · Cards: aireados, sombras suaves

const A = {
  primary: '#2545E6',
  primarySoft: '#EEF1FF',
  primaryDark: '#1731B8',
  ink: '#0B1020',
  ink2: '#3D4255',
  muted: '#6B7280',
  line: '#E7E9EE',
  bg: '#F7F7F8',
  card: '#FFFFFF',
  navy: '#0B1733',
  yellow: '#FFC93C',
  green: '#10A36B',
  font: "'Geist', system-ui, sans-serif",
};

function APill({ children, active, style, onClick, primary }) {
  return (
    <button onClick={onClick} style={{
      padding: '10px 18px', borderRadius: 999,
      border: active ? `1px solid ${A.ink}` : `1px solid ${A.line}`,
      background: active ? A.ink : (primary ? A.primary : '#fff'),
      color: active ? '#fff' : (primary ? '#fff' : A.ink2),
      fontFamily: A.font, fontWeight: 500, fontSize: 14, letterSpacing: '-0.01em',
      display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer',
      ...style,
    }}>{children}</button>
  );
}

function ANav() {
  return (
    <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 56px', borderBottom: `1px solid ${A.line}`, background: '#fff' }}>
      <LogoG size={36} primary={A.primary} textColor={A.ink} radius={9} family={A.font} />
      <div style={{ display:'flex', alignItems:'center', gap: 36, fontFamily: A.font, fontSize: 14, fontWeight: 500, color: A.ink2 }}>
        <span style={{ color: A.ink, fontWeight: 600 }}>Inicio</span>
        <span style={{ display:'inline-flex', alignItems:'center', gap: 4 }}>Zonas <Icon.chevD width={14} height={14}/></span>
        <span>Gastronomía</span>
        <span>Socios</span>
        <span style={{ display:'inline-flex', alignItems:'center', gap: 4 }}>Más <Icon.chevD width={14} height={14}/></span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
        <button style={{ background:'transparent', border:'none', color: A.ink2, fontFamily: A.font, fontWeight: 500, fontSize: 14 }}>Soy socio</button>
        <APill primary style={{ background: A.primary, borderColor: A.primary, color:'#fff', fontWeight: 600 }}>Ingresar</APill>
      </div>
    </nav>
  );
}

function AHero() {
  return (
    <section style={{ padding: '64px 56px 80px', background: '#fff', position:'relative' }}>
      <div style={{ display:'grid', gridTemplateColumns: '1.05fr 1fr', gap: 64, alignItems:'center' }}>
        {/* left */}
        <div>
          <div style={{ display:'inline-flex', alignItems:'center', gap: 8, padding:'6px 12px', background: A.primarySoft, color: A.primary, borderRadius: 999, fontFamily: A.font, fontWeight: 600, fontSize: 12, letterSpacing: '0.04em', textTransform:'uppercase', marginBottom: 24 }}>
            <Icon.wave width={14} height={14}/> Temporada 2026
          </div>
          <h1 style={{ fontFamily: A.font, fontSize: 76, lineHeight: 0.98, letterSpacing: '-0.035em', color: A.ink, margin: 0, fontWeight: 600 }}>
            Ofertas y promociones en<br/>
            <span style={{ color: A.primary, fontWeight: 700 }}>Villa Gesell.</span>
          </h1>
          <p style={{ fontFamily: A.font, fontSize: 19, lineHeight: 1.4, color: A.muted, marginTop: 22, maxWidth: 460, fontWeight: 400 }}>
            Encontrá el lugar ideal con los servicios que realmente necesitás. Sin sorpresas, sin letra chica.
          </p>

          {/* search card */}
          <div style={{ marginTop: 36, background:'#fff', border: `1px solid ${A.line}`, borderRadius: 20, padding: 8, display:'grid', gridTemplateColumns:'1.2fr 1fr 1fr auto', gap: 0, boxShadow: '0 14px 40px -20px rgba(11,16,32,0.18)' }}>
            <div style={{ padding:'14px 18px', borderRight: `1px solid ${A.line}` }}>
              <div style={{ fontFamily: A.font, fontSize: 11, color: A.muted, fontWeight: 600, letterSpacing:'0.06em', textTransform:'uppercase' }}>Destino</div>
              <div style={{ fontFamily: A.font, fontSize: 15, color: A.ink, fontWeight: 600, marginTop: 4, display:'flex', alignItems:'center', gap: 6 }}><Icon.pin width={14} height={14} style={{color: A.primary}}/> Villa Gesell</div>
            </div>
            <div style={{ padding:'14px 18px', borderRight: `1px solid ${A.line}` }}>
              <div style={{ fontFamily: A.font, fontSize: 11, color: A.muted, fontWeight: 600, letterSpacing:'0.06em', textTransform:'uppercase' }}>Check-in</div>
              <div style={{ fontFamily: A.font, fontSize: 15, color: A.ink, fontWeight: 600, marginTop: 4 }}>15 Ene</div>
            </div>
            <div style={{ padding:'14px 18px', borderRight: `1px solid ${A.line}` }}>
              <div style={{ fontFamily: A.font, fontSize: 11, color: A.muted, fontWeight: 600, letterSpacing:'0.06em', textTransform:'uppercase' }}>Huéspedes</div>
              <div style={{ fontFamily: A.font, fontSize: 15, color: A.ink, fontWeight: 600, marginTop: 4 }}>2 adultos</div>
            </div>
            <button style={{ background: A.primary, border:'none', borderRadius: 14, padding:'0 26px', color:'#fff', fontFamily: A.font, fontWeight: 600, fontSize: 15, display:'inline-flex', alignItems:'center', gap: 8 }}>
              <Icon.search width={18} height={18}/> Buscar
            </button>
          </div>

          {/* filter chips */}
          <div style={{ marginTop: 22, display:'flex', flexWrap:'wrap', gap: 8 }}>
            <APill><Icon.wave width={14} height={14} style={{color:A.primary}}/> A 200m del mar</APill>
            <APill><Icon.drop width={14} height={14} style={{color:A.primary}}/> Con piscina</APill>
            <APill><Icon.coffee width={14} height={14} style={{color:A.primary}}/> Desayuno</APill>
            <APill><Icon.key width={14} height={14} style={{color:A.primary}}/> Unidad completa</APill>
            <APill><Icon.sparkle width={14} height={14} style={{color:A.primary}}/> Spa</APill>
          </div>

          {/* stats */}
          <div style={{ marginTop: 56, display:'flex', gap: 48, paddingTop: 28, borderTop: `1px solid ${A.line}` }}>
            <div>
              <div style={{ fontFamily: A.font, fontSize: 28, color: A.ink, fontWeight: 700, letterSpacing:'-0.02em' }}>240+</div>
              <div style={{ fontFamily: A.font, fontSize: 13, color: A.muted, marginTop: 2 }}>Alojamientos</div>
            </div>
            <div>
              <div style={{ fontFamily: A.font, fontSize: 28, color: A.ink, fontWeight: 700, letterSpacing:'-0.02em' }}>87</div>
              <div style={{ fontFamily: A.font, fontSize: 13, color: A.muted, marginTop: 2 }}>Restaurantes y bares</div>
            </div>
            <div>
              <div style={{ fontFamily: A.font, fontSize: 28, color: A.ink, fontWeight: 700, letterSpacing:'-0.02em' }}>5,8K</div>
              <div style={{ fontFamily: A.font, fontSize: 13, color: A.muted, marginTop: 2 }}>Cupones canjeados</div>
            </div>
          </div>
        </div>

        {/* right — photo collage */}
        <div style={{ position:'relative', height: 580 }}>
          <div style={{ position:'absolute', top: 0, right: 0, width: '60%', height: '60%', borderRadius: 24, overflow:'hidden' }}>
            <Photo kind="beach"/>
          </div>
          <div style={{ position:'absolute', bottom: 0, left: 0, width: '52%', height: '58%', borderRadius: 24, overflow:'hidden', border:'6px solid #fff', boxShadow:'0 30px 80px -30px rgba(0,0,0,0.3)' }}>
            <Photo kind="cabana"/>
          </div>
          <div style={{ position:'absolute', bottom: '8%', right: '4%', width: '40%', height: '36%', borderRadius: 20, overflow:'hidden', border:'6px solid #fff', boxShadow:'0 30px 80px -30px rgba(0,0,0,0.3)' }}>
            <Photo kind="pool"/>
          </div>
          {/* floating review card */}
          <div style={{ position:'absolute', top: '36%', left: '4%', background:'#fff', borderRadius: 16, padding: 14, width: 180, border: `1px solid ${A.line}`, boxShadow:'0 14px 40px -20px rgba(11,16,32,0.25)' }}>
            <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
              <span className="av av-1" style={{ width: 28, height: 28 }}/>
              <div>
                <div style={{ fontFamily: A.font, fontSize: 12, color: A.ink, fontWeight: 600 }}>María L.</div>
                <div style={{ display:'flex', gap: 1, color: A.yellow }}>
                  {[1,2,3,4,5].map(i => <Icon.star key={i} width={10} height={10}/>)}
                </div>
              </div>
            </div>
            <div style={{ fontFamily: A.font, fontSize: 12, color: A.ink2, marginTop: 8, lineHeight: 1.4 }}>"Reservé directo con la cabaña, sin comisiones. Llegué y todo era idéntico a las fotos."</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AOfertaCard({ disc, title, partner, coins, photo, badge }) {
  return (
    <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius: 20, overflow:'hidden', display:'flex', flexDirection:'column' }}>
      <div style={{ position:'relative', height: 200 }}>
        <Photo kind={photo}/>
        {badge && <div style={{ position:'absolute', top: 12, left: 12, background: A.ink, color: '#fff', padding: '6px 10px', borderRadius: 8, fontFamily: A.font, fontSize: 11, fontWeight: 700, letterSpacing:'0.04em', textTransform:'uppercase' }}>{badge}</div>}
        <div style={{ position:'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.95)', borderRadius: 999, padding: '5px 10px', fontFamily: A.font, fontSize: 12, fontWeight: 600, color: A.ink, display:'inline-flex', alignItems:'center', gap: 4 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: A.yellow, display:'inline-block' }}/>{coins}
        </div>
        <div style={{ position:'absolute', bottom: 14, left: 14, color: '#fff' }}>
          <div style={{ fontFamily: A.font, fontSize: 38, fontWeight: 800, letterSpacing:'-0.02em', lineHeight: 1 }}>{disc}</div>
        </div>
      </div>
      <div style={{ padding: 16, flex: 1, display:'flex', flexDirection:'column' }}>
        <div style={{ fontFamily: A.font, fontSize: 14, color: A.ink, fontWeight: 600, lineHeight: 1.3 }}>{title}</div>
        <div style={{ fontFamily: A.font, fontSize: 12, color: A.muted, marginTop: 4 }}>{partner}</div>
        <button style={{ marginTop: 14, background: A.primary, color: '#fff', border:'none', borderRadius: 12, padding: '10px 0', fontFamily: A.font, fontSize: 13, fontWeight: 600, display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 6 }}>
          <Icon.ticket width={16} height={16}/> Añadir a cuponera
        </button>
      </div>
    </div>
  );
}

function AOfertas() {
  return (
    <section style={{ padding: '72px 56px', background: A.bg }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom: 36 }}>
        <div>
          <div style={{ display:'inline-flex', alignItems:'center', gap: 6, fontFamily: A.font, fontSize: 12, fontWeight: 600, color: A.primary, letterSpacing:'0.06em', textTransform:'uppercase' }}>
            <Icon.bolt width={12} height={12}/> Cuponera local
          </div>
          <h2 style={{ fontFamily: A.font, fontSize: 44, color: A.ink, margin: '12px 0 0', fontWeight: 700, letterSpacing:'-0.025em' }}>Ofertas imperdibles</h2>
          <p style={{ fontFamily: A.font, fontSize: 16, color: A.muted, marginTop: 6 }}>Descuentos reales en socios verificados. Canjeás con QR desde tu celular.</p>
        </div>
        <button style={{ background:'transparent', border:'none', fontFamily: A.font, fontSize: 14, fontWeight: 600, color: A.primary, display:'inline-flex', alignItems:'center', gap: 6 }}>
          Ver todas las ofertas <Icon.arrowR width={16} height={16}/>
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
        <AOfertaCard disc="-35%" title="Hoteles frente al mar — Hot Sale" partner="Hotel Spa Las Olas" coins={3} photo="pool" badge="⚡ Flash Sale"/>
        <AOfertaCard disc="-15%" title="Cabalgata entre los pinos al atardecer" partner="Rancho Los Pinos" coins={1} photo="bosque"/>
        <AOfertaCard disc="2×1" title="Ruta de la cerveza: pintas artesanales" partner="Cervecería Dublín" coins={1} photo="cerveza"/>
        <AOfertaCard disc="-25%" title="Slow Week — Lunes a jueves" partner="Boutique Pinar" coins={2} photo="interior" badge="Solo socios"/>
      </div>
    </section>
  );
}

function AAlojCard({ title, type, price, photo, fav }) {
  return (
    <div style={{ display:'flex', flexDirection:'column' }}>
      <div style={{ position:'relative', height: 320, borderRadius: 20, overflow:'hidden' }}>
        <Photo kind={photo}/>
        <button style={{ position:'absolute', top: 14, right: 14, width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.95)', border:'none', display:'grid', placeItems:'center', color: fav ? A.primary : A.ink2 }}>
          <Icon.heart width={18} height={18} fill={fav ? A.primary : 'none'}/>
        </button>
        <div style={{ position:'absolute', bottom: 14, left: 14, background:'rgba(255,255,255,0.95)', padding:'4px 10px', borderRadius: 999, fontFamily: A.font, fontSize: 11, fontWeight: 600, color: A.ink, letterSpacing:'0.04em', textTransform:'uppercase' }}>{type}</div>
      </div>
      <div style={{ marginTop: 14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
          <div style={{ fontFamily: A.font, fontSize: 17, color: A.ink, fontWeight: 600 }}>{title}</div>
          <div style={{ display:'flex', alignItems:'center', gap: 4, color: A.yellow }}>
            <Icon.star width={14} height={14}/>
            <span style={{ fontFamily: A.font, fontSize: 13, color: A.ink, fontWeight: 600 }}>4,8</span>
          </div>
        </div>
        <div style={{ fontFamily: A.font, fontSize: 13, color: A.muted, marginTop: 4, display:'flex', alignItems:'center', gap: 4 }}><Icon.pin width={12} height={12}/> Villa Gesell · Centro</div>
        <div style={{ marginTop: 12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <span style={{ fontFamily: A.font, fontSize: 13, color: A.muted }}>Desde </span>
            <span style={{ fontFamily: A.font, fontSize: 20, color: A.ink, fontWeight: 700, letterSpacing:'-0.02em' }}>${price}</span>
            <span style={{ fontFamily: A.font, fontSize: 13, color: A.muted }}> / noche</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AAlojamientos() {
  const [tab, setTab] = React.useState('Todos');
  return (
    <section style={{ padding: '72px 56px', background: '#fff' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom: 36 }}>
        <div>
          <h2 style={{ fontFamily: A.font, fontSize: 44, color: A.ink, margin: 0, fontWeight: 700, letterSpacing:'-0.025em' }}>Alojamientos destacados</h2>
          <p style={{ fontFamily: A.font, fontSize: 16, color: A.muted, marginTop: 8 }}>Donde el descanso se encuentra con el mar.</p>
        </div>
        <div style={{ display:'flex', gap: 6, background: A.bg, padding: 5, borderRadius: 999, border:`1px solid ${A.line}` }}>
          {['Todos','Hotel','Cabaña','Departamento'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 18px', borderRadius: 999, border:'none',
              background: tab===t ? A.ink : 'transparent',
              color: tab===t ? '#fff' : A.ink2,
              fontFamily: A.font, fontWeight: 600, fontSize: 13,
            }}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
        <AAlojCard title="Hotel Spa Las Olas" type="Hotel" price="85.000" photo="pool" fav/>
        <AAlojCard title="Cabañas del Pinar" type="Cabaña" price="65.000" photo="bosque"/>
        <AAlojCard title="Apart Sol y Arena" type="Departamento" price="55.000" photo="interior"/>
        <AAlojCard title="Boutique Pinar" type="Hotel" price="120.000" photo="cabana"/>
      </div>
    </section>
  );
}

function APacks() {
  return (
    <section style={{ padding: '80px 56px', background: A.navy, color:'#fff' }}>
      <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems:'end', marginBottom: 40 }}>
        <div>
          <div style={{ display:'inline-flex', alignItems:'center', gap: 8, padding:'6px 12px', background: 'rgba(255,201,60,0.16)', color: A.yellow, borderRadius: 999, fontFamily: A.font, fontWeight: 600, fontSize: 12, letterSpacing: '0.06em', textTransform:'uppercase', marginBottom: 20 }}>
            <Icon.bolt width={12} height={12}/> Experiencias todo-en-uno
          </div>
          <h2 style={{ fontFamily: A.font, fontSize: 56, margin: 0, fontWeight: 700, letterSpacing:'-0.03em', lineHeight: 1 }}>Packs<br/><span style={{ color: '#7DA1FF' }}>exclusivos</span></h2>
        </div>
        <div style={{ paddingBottom: 8 }}>
          <p style={{ fontFamily: A.font, fontSize: 17, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, margin: 0 }}>Combinamos alojamiento, gastronomía y aventuras en un solo paquete verificado. Pagás una sola vez.</p>
          <button style={{ marginTop: 18, background:'transparent', border:'none', color: '#7DA1FF', fontFamily: A.font, fontWeight: 600, fontSize: 14, display:'inline-flex', alignItems:'center', gap: 6, padding: 0 }}>
            Ver todos los packs <Icon.arrowR width={16} height={16}/>
          </button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap: 24 }}>
        {/* featured */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius: 24, overflow:'hidden', display:'grid', gridTemplateColumns:'1fr 1fr' }}>
          <div style={{ position:'relative', minHeight: 340 }}>
            <Photo kind="interior"/>
            <div style={{ position:'absolute', top: 16, left: 16, background: '#FF3D7F', color:'#fff', padding:'6px 12px', borderRadius: 999, fontFamily: A.font, fontWeight: 700, fontSize: 11, letterSpacing:'0.06em', textTransform:'uppercase' }}>MÁS VENDIDO</div>
          </div>
          <div style={{ padding: 28, display:'flex', flexDirection:'column' }}>
            <div style={{ fontFamily: A.font, fontSize: 11, fontWeight: 600, color: '#7DA1FF', letterSpacing:'0.06em', textTransform:'uppercase' }}>Pack destacado</div>
            <div style={{ fontFamily: A.font, fontSize: 30, fontWeight: 700, letterSpacing:'-0.02em', marginTop: 6 }}>Escapada Romántica</div>
            <div style={{ fontFamily: A.font, fontSize: 14, color: 'rgba(255,255,255,0.65)', marginTop: 8, lineHeight: 1.5 }}>Dos noches en hotel boutique + cena para dos + circuito de spa. Pensado para quienes quieren vivir Villa Gesell sin organizar nada.</div>

            <div style={{ marginTop: 18, display:'flex', flexDirection:'column', gap: 10 }}>
              {[['Alojamiento','Boutique Pinar · 2 noches'], ['Cena','Restaurant del Faro'], ['Spa','Circuito termal Las Olas']].map(([k,v]) => (
                <div key={k} style={{ display:'flex', gap: 12, alignItems:'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(125,161,255,0.15)', color: '#7DA1FF', display:'grid', placeItems:'center', flexShrink: 0 }}>
                    <Icon.check width={16} height={16}/>
                  </div>
                  <div>
                    <div style={{ fontFamily: A.font, fontSize: 13, fontWeight: 600 }}>{k}</div>
                    <div style={{ fontFamily: A.font, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{v}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 'auto', paddingTop: 20, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontFamily: A.font, fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.06em', fontWeight: 600 }}>Pack desde</div>
                <div style={{ fontFamily: A.font, fontSize: 26, color: '#22D396', fontWeight: 700, letterSpacing:'-0.02em' }}>$145.000</div>
              </div>
              <button style={{ background:'#fff', color: A.navy, border:'none', padding:'12px 18px', borderRadius: 12, fontFamily: A.font, fontWeight: 600, fontSize: 13, display:'inline-flex', alignItems:'center', gap: 6 }}>
                Ver pack <Icon.arrowR width={14} height={14}/>
              </button>
            </div>
          </div>
        </div>

        {/* secondary packs */}
        <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
          {[
            ['Aventura Norte','Quad + cabalgata + asado','$98.000','sunset'],
            ['Familiar Total','3 noches + actividades kids','$210.000','beach'],
            ['Gastro Tour','5 restaurantes en 3 días','$72.000','rest'],
          ].map(([t, s, p, ph]) => (
            <div key={t} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 14, display:'flex', gap: 14, alignItems:'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: 12, overflow:'hidden', flexShrink: 0 }}><Photo kind={ph}/></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: A.font, fontSize: 15, fontWeight: 600 }}>{t}</div>
                <div style={{ fontFamily: A.font, fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{s}</div>
                <div style={{ fontFamily: A.font, fontSize: 15, color: '#22D396', fontWeight: 700, marginTop: 6 }}>{p}</div>
              </div>
              <Icon.chevR width={18} height={18} style={{ color: 'rgba(255,255,255,0.45)' }}/>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AFooter() {
  return (
    <footer style={{ padding: '40px 56px', background: '#fff', borderTop: `1px solid ${A.line}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <LogoG size={32} primary={A.primary} textColor={A.ink} radius={8} family={A.font}/>
      <div style={{ fontFamily: A.font, fontSize: 13, color: A.muted, display:'flex', gap: 28 }}>
        <span>Soy socio</span><span>Términos</span><span>Privacidad</span><span>Contacto</span>
      </div>
      <div style={{ fontFamily: A.font, fontSize: 12, color: A.muted }}>© 2026 gesell.ar</div>
    </footer>
  );
}

function AHome() {
  return (
    <div style={{ background:'#fff', fontFamily: A.font }}>
      <ANav/>
      <AHero/>
      <AOfertas/>
      <AAlojamientos/>
      <APacks/>
      <AFooter/>
    </div>
  );
}

// ───── Hero only (for the comparison row at the top) ─────
function AHeroOnly() {
  return (
    <div style={{ background:'#fff', fontFamily: A.font, height:'100%' }}>
      <ANav/>
      <AHero/>
    </div>
  );
}

// ───── Detalle de alojamiento ─────
function AAlojDetalle() {
  return (
    <div style={{ background:'#fff', fontFamily: A.font, color: A.ink }}>
      <ANav/>
      <div style={{ padding: '20px 56px 0', fontFamily: A.font, fontSize: 13, color: A.muted, display:'flex', alignItems:'center', gap: 6 }}>
        <span>Alojamientos</span> <Icon.chevR width={12} height={12}/> <span>Villa Gesell</span> <Icon.chevR width={12} height={12}/> <span style={{ color: A.ink }}>Hotel Spa Las Olas</span>
      </div>
      <section style={{ padding:'18px 56px 32px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap: 32 }}>
          <div>
            <h1 style={{ fontFamily: A.font, fontSize: 44, margin: 0, fontWeight: 700, letterSpacing:'-0.025em' }}>Hotel Spa Las Olas</h1>
            <div style={{ marginTop: 8, display:'flex', alignItems:'center', gap: 16, fontFamily: A.font, fontSize: 14, color: A.muted }}>
              <span style={{ display:'inline-flex', alignItems:'center', gap: 6, color: A.ink, fontWeight: 600 }}><Icon.star width={14} height={14} style={{ color: A.yellow }}/> 4,8 <span style={{ color: A.muted, fontWeight: 500 }}>(214 reseñas)</span></span>
              <span style={{ display:'inline-flex', alignItems:'center', gap: 4 }}><Icon.pin width={14} height={14}/> Villa Gesell · Centro</span>
              <span style={{ display:'inline-flex', alignItems:'center', gap: 4, color: A.green, fontWeight: 600 }}><Icon.check width={14} height={14}/> Socio verificado</span>
            </div>
          </div>
          <div style={{ display:'flex', gap: 10 }}>
            <button style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius: 12, padding:'10px 14px', fontFamily: A.font, fontWeight: 500, fontSize: 13, display:'inline-flex', alignItems:'center', gap: 6, color: A.ink }}><Icon.heart width={16} height={16}/> Guardar</button>
            <button style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius: 12, padding:'10px 14px', fontFamily: A.font, fontWeight: 500, fontSize: 13, color: A.ink }}>Compartir</button>
          </div>
        </div>

        {/* Gallery */}
        <div style={{ marginTop: 22, display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gridTemplateRows:'1fr 1fr', gap: 8, height: 480 }}>
          <div style={{ gridRow:'1 / span 2', borderRadius: 20, overflow:'hidden' }}><Photo kind="pool"/></div>
          <div style={{ borderRadius: 20, overflow:'hidden' }}><Photo kind="interior"/></div>
          <div style={{ borderRadius: 20, overflow:'hidden' }}><Photo kind="spa"/></div>
          <div style={{ borderRadius: 20, overflow:'hidden' }}><Photo kind="beach"/></div>
          <div style={{ borderRadius: 20, overflow:'hidden', position:'relative' }}>
            <Photo kind="morning"/>
            <button style={{ position:'absolute', bottom: 14, right: 14, background:'#fff', border:'none', padding:'8px 14px', borderRadius: 999, fontFamily: A.font, fontSize: 12, fontWeight: 600, color: A.ink }}>+ 18 fotos</button>
          </div>
        </div>
      </section>

      {/* Body */}
      <section style={{ padding: '0 56px 64px', display:'grid', gridTemplateColumns: '1.6fr 1fr', gap: 56, alignItems:'flex-start' }}>
        <div>
          {/* Amenities */}
          <h3 style={{ fontFamily: A.font, fontSize: 20, fontWeight: 600, color: A.ink, margin: '12px 0 16px' }}>Qué incluye</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 14 }}>
            {[
              [Icon.wave, 'A 80m del mar'],
              [Icon.drop, 'Piscina climatizada'],
              [Icon.sparkle, 'Spa y circuito termal'],
              [Icon.coffee, 'Desayuno buffet incluido'],
              [Icon.key, 'Check-in 24hs'],
              [Icon.shield, 'Cancelación flexible'],
            ].map(([Ic, t]) => (
              <div key={t} style={{ display:'flex', alignItems:'center', gap: 12, padding:'12px 14px', border:`1px solid ${A.line}`, borderRadius: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: A.primarySoft, color: A.primary, display:'grid', placeItems:'center' }}>
                  <Ic width={18} height={18}/>
                </div>
                <span style={{ fontFamily: A.font, fontSize: 14, color: A.ink, fontWeight: 500 }}>{t}</span>
              </div>
            ))}
          </div>

          <h3 style={{ fontFamily: A.font, fontSize: 20, fontWeight: 600, color: A.ink, margin: '36px 0 12px' }}>Sobre el lugar</h3>
          <p style={{ fontFamily: A.font, fontSize: 15, lineHeight: 1.6, color: A.ink2, margin: 0, textWrap:'pretty' }}>
            Un boutique sobre la costanera con 24 habitaciones y vista al mar. La pileta climatizada y el circuito de spa funcionan todo el año. El restaurant del lobby trabaja con productores locales y cambia la carta cada estación.
          </p>

          <h3 style={{ fontFamily: A.font, fontSize: 20, fontWeight: 600, color: A.ink, margin: '32px 0 14px' }}>Ofertas activas en este alojamiento</h3>
          <div style={{ display:'flex', gap: 14 }}>
            <div style={{ flex: 1, border:`1px solid ${A.line}`, borderRadius: 16, padding: 16, display:'flex', alignItems:'center', gap: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: 10, background: A.ink, color:'#fff', display:'grid', placeItems:'center', fontFamily: A.font, fontWeight: 800, fontSize: 17 }}>-35%</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: A.font, fontSize: 14, fontWeight: 600 }}>Hot Sale frente al mar</div>
                <div style={{ fontFamily: A.font, fontSize: 12, color: A.muted, marginTop: 2 }}>Válido hasta el 30/01 · 3 cupones</div>
              </div>
              <Icon.chevR width={18} height={18} style={{ color: A.muted }}/>
            </div>
            <div style={{ flex: 1, border:`1px solid ${A.line}`, borderRadius: 16, padding: 16, display:'flex', alignItems:'center', gap: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: 10, background: A.primary, color:'#fff', display:'grid', placeItems:'center', fontFamily: A.font, fontWeight: 800, fontSize: 17 }}>2×1</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: A.font, fontSize: 14, fontWeight: 600 }}>Spa día completo</div>
                <div style={{ fontFamily: A.font, fontSize: 12, color: A.muted, marginTop: 2 }}>Lunes a jueves · 1 cupón</div>
              </div>
              <Icon.chevR width={18} height={18} style={{ color: A.muted }}/>
            </div>
          </div>
        </div>

        {/* Booking card */}
        <div style={{ position:'sticky', top: 20 }}>
          <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius: 20, padding: 22, boxShadow: '0 20px 60px -30px rgba(11,16,32,0.22)' }}>
            <div style={{ display:'flex', alignItems:'baseline', gap: 6 }}>
              <span style={{ fontFamily: A.font, fontSize: 32, fontWeight: 700, color: A.ink, letterSpacing:'-0.025em' }}>$85.000</span>
              <span style={{ fontFamily: A.font, fontSize: 14, color: A.muted }}>/ noche</span>
            </div>
            <div style={{ fontFamily: A.font, fontSize: 12, color: A.green, marginTop: 4, display:'inline-flex', alignItems:'center', gap: 4, fontWeight: 600 }}><Icon.check width={12} height={12}/> Precio directo, sin comisión</div>

            <div style={{ marginTop: 18, display:'grid', gridTemplateColumns:'1fr 1fr', gap: 0, border:`1px solid ${A.line}`, borderRadius: 12, overflow:'hidden' }}>
              <div style={{ padding: 12, borderRight:`1px solid ${A.line}` }}>
                <div style={{ fontFamily: A.font, fontSize: 10, fontWeight: 600, color: A.muted, letterSpacing:'0.06em', textTransform:'uppercase' }}>Check-in</div>
                <div style={{ fontFamily: A.font, fontSize: 14, fontWeight: 600, color: A.ink, marginTop: 4 }}>15 Ene 2026</div>
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ fontFamily: A.font, fontSize: 10, fontWeight: 600, color: A.muted, letterSpacing:'0.06em', textTransform:'uppercase' }}>Check-out</div>
                <div style={{ fontFamily: A.font, fontSize: 14, fontWeight: 600, color: A.ink, marginTop: 4 }}>18 Ene 2026</div>
              </div>
              <div style={{ padding: 12, borderTop:`1px solid ${A.line}`, gridColumn:'1 / -1' }}>
                <div style={{ fontFamily: A.font, fontSize: 10, fontWeight: 600, color: A.muted, letterSpacing:'0.06em', textTransform:'uppercase' }}>Huéspedes</div>
                <div style={{ fontFamily: A.font, fontSize: 14, fontWeight: 600, color: A.ink, marginTop: 4 }}>2 adultos · 1 niño</div>
              </div>
            </div>

            <button style={{ marginTop: 16, width:'100%', background: A.primary, color:'#fff', border:'none', borderRadius: 14, padding: '14px 0', fontFamily: A.font, fontWeight: 600, fontSize: 15 }}>
              Consultar disponibilidad
            </button>
            <button style={{ marginTop: 8, width:'100%', background: '#fff', color: A.ink, border:`1px solid ${A.line}`, borderRadius: 14, padding: '12px 0', fontFamily: A.font, fontWeight: 500, fontSize: 14, display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 6 }}>
              <Icon.chat width={16} height={16}/> Chatear con el socio
            </button>

            <div style={{ marginTop: 16, padding: 12, background: A.primarySoft, borderRadius: 12 }}>
              <div style={{ fontFamily: A.font, fontSize: 12, color: A.primary, fontWeight: 600, display:'inline-flex', alignItems:'center', gap: 6 }}>
                <Icon.bolt width={12} height={12}/> 3 cupones disponibles
              </div>
              <div style={{ fontFamily: A.font, fontSize: 12, color: A.ink2, marginTop: 4, lineHeight: 1.4 }}>Reservando acá sumás cupones para canjear en restaurantes y experiencias locales.</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ───── Cuponera mobile ─────
function ACuponeraMobile() {
  return (
    <div style={{ background: A.bg, fontFamily: A.font, color: A.ink, height: '100%', display:'flex', flexDirection:'column', position:'relative' }}>
      {/* status bar */}
      <div style={{ height: 38, display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 22px', fontFamily: A.font, fontSize: 13, fontWeight: 600, color: A.ink }}>
        <span>9:41</span><span style={{ display:'inline-flex', gap: 4, alignItems:'center', fontSize: 12 }}>● ● ● ●</span>
      </div>

      {/* header */}
      <div style={{ padding:'14px 20px 0' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontFamily: A.font, fontSize: 13, color: A.muted, fontWeight: 500 }}>Buen día,</div>
            <div style={{ fontFamily: A.font, fontSize: 22, fontWeight: 700, color: A.ink, letterSpacing:'-0.02em' }}>María 👋</div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 12, background:'#fff', display:'grid', placeItems:'center', border:`1px solid ${A.line}`, position:'relative' }}>
            <Icon.bell width={18} height={18} style={{color: A.ink}}/>
            <div style={{ position:'absolute', top: 7, right: 7, width: 8, height: 8, borderRadius: '50%', background: A.primary, border:'2px solid #fff' }}/>
          </div>
        </div>

        {/* wallet card */}
        <div style={{ marginTop: 18, background: A.ink, color: '#fff', borderRadius: 20, padding: 18, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-30, right:-30, width: 140, height: 140, borderRadius:'50%', background:'rgba(125,161,255,0.18)' }}/>
          <div style={{ position:'absolute', top: 20, right: 20, width: 80, height: 80, borderRadius:'50%', background:'rgba(255,201,60,0.25)' }}/>
          <div style={{ fontFamily: A.font, fontSize: 11, color:'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing:'0.06em', textTransform:'uppercase' }}>Mi cuponera</div>
          <div style={{ display:'flex', alignItems:'baseline', gap: 6, marginTop: 4 }}>
            <span style={{ fontFamily: A.font, fontSize: 48, fontWeight: 800, letterSpacing:'-0.03em' }}>7</span>
            <span style={{ fontFamily: A.font, fontSize: 14, color:'rgba(255,255,255,0.65)' }}>cupones activos</span>
          </div>
          <div style={{ marginTop: 14, display:'flex', gap: 8 }}>
            <div style={{ background:'rgba(255,255,255,0.12)', padding:'5px 10px', borderRadius: 999, fontFamily: A.font, fontSize: 11, fontWeight: 500 }}>3 vencen pronto</div>
            <div style={{ background: A.yellow, color: A.ink, padding:'5px 10px', borderRadius: 999, fontFamily: A.font, fontSize: 11, fontWeight: 700 }}>+2 esta semana</div>
          </div>
        </div>
      </div>

      {/* tabs */}
      <div style={{ padding: '20px 20px 0', display:'flex', gap: 6 }}>
        <button style={{ flex: 1, padding:'10px 0', borderRadius: 999, background: A.ink, color:'#fff', border:'none', fontFamily: A.font, fontWeight: 600, fontSize: 13 }}>Activos · 7</button>
        <button style={{ flex: 1, padding:'10px 0', borderRadius: 999, background:'#fff', color: A.ink2, border:`1px solid ${A.line}`, fontFamily: A.font, fontWeight: 500, fontSize: 13 }}>Usados · 12</button>
      </div>

      {/* coupons */}
      <div style={{ flex: 1, padding: '14px 20px 100px', overflowY:'auto', display:'flex', flexDirection:'column', gap: 12 }}>
        {[
          ['-35%', 'Hot Sale frente al mar', 'Hotel Spa Las Olas', 'Vence 30 Ene', 'pool', A.primary],
          ['2×1', 'Pintas artesanales', 'Cervecería Dublín', 'Vence 15 Feb', 'cerveza', A.ink],
          ['-15%', 'Cabalgata atardecer', 'Rancho Los Pinos', 'Vence 12 Feb', 'bosque', A.green],
        ].map(([d, t, p, v, ph, c], i) => (
          <div key={i} style={{ background:'#fff', borderRadius: 16, border:`1px solid ${A.line}`, overflow:'hidden', display:'flex' }}>
            <div style={{ width: 92, position:'relative' }}>
              <Photo kind={ph}/>
              <div style={{ position:'absolute', inset: 0, display:'grid', placeItems:'center', color:'#fff', fontFamily: A.font, fontSize: 22, fontWeight: 800, letterSpacing:'-0.02em', textShadow:'0 2px 8px rgba(0,0,0,0.4)' }}>{d}</div>
            </div>
            <div style={{ flex: 1, padding: 12, position:'relative' }}>
              <div style={{ fontFamily: A.font, fontSize: 14, fontWeight: 600, color: A.ink }}>{t}</div>
              <div style={{ fontFamily: A.font, fontSize: 12, color: A.muted, marginTop: 2 }}>{p}</div>
              <div style={{ fontFamily: A.font, fontSize: 11, color: A.muted, marginTop: 8, display:'inline-flex', alignItems:'center', gap: 4 }}><Icon.calendar width={11} height={11}/> {v}</div>
              <button style={{ position:'absolute', right: 10, top: '50%', transform:'translateY(-50%)', background: c, color:'#fff', border:'none', padding:'8px 12px', borderRadius: 10, fontFamily: A.font, fontWeight: 600, fontSize: 12, display:'inline-flex', alignItems:'center', gap: 4 }}><Icon.qr width={14} height={14}/></button>
            </div>
          </div>
        ))}

        {/* sugerencias */}
        <div style={{ marginTop: 4, fontFamily: A.font, fontSize: 13, fontWeight: 600, color: A.muted, letterSpacing:'0.04em', textTransform:'uppercase' }}>Cerca tuyo</div>
        <div style={{ background:'#fff', borderRadius: 16, border:`1px solid ${A.line}`, padding: 12, display:'flex', alignItems:'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 10, overflow:'hidden' }}><Photo kind="coffee"/></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: A.font, fontSize: 13, fontWeight: 600 }}>Café del Pueblo</div>
            <div style={{ fontFamily: A.font, fontSize: 11, color: A.muted }}>A 320m · -10% en desayunos</div>
          </div>
          <button style={{ background: A.primarySoft, color: A.primary, border:'none', padding:'8px 12px', borderRadius: 10, fontFamily: A.font, fontWeight: 600, fontSize: 12 }}>+ Sumar</button>
        </div>
      </div>

      {/* bottom nav */}
      <div style={{ position:'absolute', bottom: 0, left: 0, right: 0, background:'#fff', borderTop:`1px solid ${A.line}`, padding:'10px 0 28px', display:'flex', justifyContent:'space-around' }}>
        {[
          ['Inicio', Icon.compass, false],
          ['Cupones', Icon.ticket, true],
          ['Mapa', Icon.pin, false],
          ['Cuenta', Icon.user, false],
        ].map(([l, Ic, a]) => (
          <div key={l} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: 3, color: a ? A.primary : A.muted }}>
            <Ic width={20} height={20}/>
            <span style={{ fontFamily: A.font, fontSize: 11, fontWeight: a ? 600 : 500 }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { AHome, AHeroOnly, AAlojDetalle, ACuponeraMobile, A });
