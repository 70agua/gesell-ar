// App — gesell.ar · Aire (única dirección)
// Canvas con todas las pantallas públicas + admin organizadas

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "primaryColor": "#2545E6",
  "cardRadius": 16,
  "density": "normal",
  "showPublic": true,
  "showAdmin": true,
  "showMobile": true
}/*EDITMODE-END*/;

const COLOR_OPTIONS = ['#2545E6', '#0B3D5E', '#1E8A5B', '#7A3FD8', '#E76A4B', '#0A0A0F'];

function App() {
  const [tweaks, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    const style = document.getElementById('__tweak-overrides') || (() => {
      const s = document.createElement('style');
      s.id = '__tweak-overrides';
      document.head.appendChild(s);
      return s;
    })();
    const pad = { compacta: 0.7, normal: 1, aireada: 1.3 }[tweaks.density] || 1;
    style.textContent = `
      :root { --aire-primary: ${tweaks.primaryColor}; --aire-radius: ${tweaks.cardRadius}px; --aire-pad: ${pad}; }
    `;
  }, [tweaks.primaryColor, tweaks.cardRadius, tweaks.density]);

  return (
    <>
      <window.DesignCanvas
        title="gesell.ar · Aire"
        subtitle="Dirección visual única — todas las pantallas en una sola fuente"
        bg="#F2F1EE"
      >
        {tweaks.showPublic && (
          <window.DCSection id="public-1" title="Público · Descubrimiento" subtitle="Lo que el turista ve antes de reservar">
            <window.DCArtboard id="home" label="01 · Home" width={1440} height={2800}>
              <AHome/>
            </window.DCArtboard>
            <window.DCArtboard id="busqueda" label="02 · Búsqueda + Resultados" width={1440} height={1800}>
              <ABusqueda/>
            </window.DCArtboard>
            <window.DCArtboard id="aloj" label="03 · Detalle de alojamiento" width={1440} height={1700}>
              <AAlojDetalle/>
            </window.DCArtboard>
          </window.DCSection>
        )}

        {tweaks.showPublic && (
          <window.DCSection id="public-2" title="Público · Cuponera y packs" subtitle="El diferencial de gesell.ar">
            <window.DCArtboard id="oferta" label="04 · Detalle de oferta / cupón" width={1440} height={1700}>
              <AOfertaDetalle/>
            </window.DCArtboard>
            <window.DCArtboard id="pack" label="05 · Detalle de pack" width={1440} height={2100}>
              <APackDetalle/>
            </window.DCArtboard>
          </window.DCSection>
        )}

        {tweaks.showPublic && (
          <window.DCSection id="public-3" title="Público · Gastronomía" subtitle="Listado y detalle de restos/bares/cafés">
            <window.DCArtboard id="gastro-lst" label="06 · Gastronomía · listado" width={1440} height={1400}>
              <AGastroListado/>
            </window.DCArtboard>
            <window.DCArtboard id="gastro-det" label="07 · Gastronomía · detalle" width={1440} height={1850}>
              <AGastroDetalle/>
            </window.DCArtboard>
          </window.DCSection>
        )}

        {tweaks.showMobile && (
          <window.DCSection id="mobile" title="Mobile · Apps del usuario" subtitle="La cuponera en el bolsillo">
            <window.DCArtboard id="cup-mobile" label="08 · Cuponera mobile" width={390} height={844}>
              <ACuponeraMobile/>
            </window.DCArtboard>
          </window.DCSection>
        )}

        {tweaks.showPublic && (
          <window.DCSection id="onboarding" title="Onboarding · Socios" subtitle="Cómo se suma un hotel, resto o experiencia">
            <window.DCArtboard id="onb-socio" label="09 · Sumate como socio" width={1440} height={1100}>
              <AOnboardingSocio/>
            </window.DCArtboard>
          </window.DCSection>
        )}

        {tweaks.showAdmin && (
          <window.DCSection id="admin-1" title="Panel admin · Operación" subtitle="Lo que ve el superadmin del portal">
            <window.DCArtboard id="adm-resumen" label="10 · Resumen" width={1440} height={900}>
              <AdminA/>
            </window.DCArtboard>
            <window.DCArtboard id="adm-ofertas" label="11 · Ofertas" width={1440} height={900}>
              <AdminAOfertas/>
            </window.DCArtboard>
            <window.DCArtboard id="adm-socios" label="12 · Socios" width={1440} height={900}>
              <AdminASocios/>
            </window.DCArtboard>
          </window.DCSection>
        )}

        {tweaks.showAdmin && (
          <window.DCSection id="admin-2" title="Panel admin · Datos y comunicación" subtitle="Ventas y atención al usuario">
            <window.DCArtboard id="adm-ventas" label="13 · Ventas" width={1440} height={900}>
              <AdminAVentas/>
            </window.DCArtboard>
            <window.DCArtboard id="adm-consultas" label="14 · Consultas" width={1440} height={900}>
              <AdminAConsultas/>
            </window.DCArtboard>
          </window.DCSection>
        )}
      </window.DesignCanvas>

      <window.TweaksPanel title="Tweaks · Aire">
        <window.TweakSection label="Secciones">
          <window.TweakToggle label="Público" value={tweaks.showPublic} onChange={(v) => setTweak('showPublic', v)}/>
          <window.TweakToggle label="Mobile" value={tweaks.showMobile} onChange={(v) => setTweak('showMobile', v)}/>
          <window.TweakToggle label="Admin" value={tweaks.showAdmin} onChange={(v) => setTweak('showAdmin', v)}/>
        </window.TweakSection>

        <window.TweakSection label="Estilo · live">
          <window.TweakColor
            label="Color primario"
            value={tweaks.primaryColor}
            onChange={(v) => setTweak('primaryColor', v)}
            options={COLOR_OPTIONS}
          />
          <window.TweakSlider
            label="Radio cards"
            value={tweaks.cardRadius}
            onChange={(v) => setTweak('cardRadius', v)}
            min={0} max={32} step={2}
          />
          <window.TweakRadio
            label="Densidad"
            value={tweaks.density}
            onChange={(v) => setTweak('density', v)}
            options={['compacta','normal','aireada']}
          />
        </window.TweakSection>
      </window.TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
