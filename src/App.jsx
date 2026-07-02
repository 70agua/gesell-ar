// ============================================================
//  src/App.jsx
// ============================================================
import React, { useState, useEffect } from 'react';

import Navbar           from './components/Navbar';
import Footer           from './components/Footer';
import HomeView         from './views/HomeView';
import DetailView       from './views/DetailView';
import LoginView        from './views/LoginView';
import SuperAdminView   from './views/SuperAdminView';
import AdminNegocioView from './views/AdminNegocioView';
import OfertasView      from './views/OfertasView';
import MarketplaceView  from './views/MarketplaceView';
import SociosView        from './views/SociosView';
import GastronomyView    from './views/GastronomyView';
import LoadingScreen     from './components/LoadingScreen';
import OfertaDetailView   from './views/OfertaDetailView';
import PackDetailView     from './views/PackDetailView';
import PacksListView      from './views/PacksListView';
import OfertasRegaloView  from './views/OfertasRegaloView';
import PublicarOfertaView    from './views/PublicarOfertaView';
import BeneficiosPortalView  from './views/BeneficiosPortalView';
import FavoritosView         from './views/FavoritosView';
import CheckoutView          from './views/CheckoutView';

import { getAlojamientos, getGastronomia, getAventura, getNegocioById } from './lib/datos';
import { ALL_PROMOS }                      from './data/mockData';
import { getSession, getPerfil }           from './lib/auth';
import { supabase }                        from './lib/supabase';
import { LoadingProvider, useLoading }     from './lib/loading';
import { CuponeraProvider }               from './lib/cuponera';
import CuponeraDrawer                     from './components/CuponeraDrawer';
import { FavoritosProvider }             from './lib/favoritos';
import ChatBot                           from './components/ChatBot';

// ─── Contenido de la app (necesita el contexto de loading) ───
function AppContent() {
  const { isLoading } = useLoading();

  const [view, setView]                 = useState('home');
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedOferta, setSelectedOferta]     = useState(null);
  const [selectedPack, setSelectedPack]         = useState(null);
  const [marketplaceLocalidad, setMarketplaceLocalidad] = useState('');
  const [marketplaceTipo,     setMarketplaceTipo]     = useState('todos');
  const [ofertasCategoria, setOfertasCategoria] = useState(null);
  const [ofertasLocalidades, setOfertasLocalidades] = useState([]);
  const [gastroCategoria,   setGastroCategoria]   = useState('');
  const [gastroAventura, setGastroAventura] = useState('');
  const [gastroNavKey,      setGastroNavKey]      = useState(0);
  const [salidasModoRanking, setSalidasModoRanking] = useState(false);
  const [scrolled, setScrolled]         = useState(false);
  const [session, setSession]           = useState(null);
  const [perfil, setPerfil]             = useState(null);
  const [authLoading, setAuthLoading]   = useState(true);
  const [alojamientos, setAlojamientos] = useState([]);
  const [salidas, setSalidas]   = useState([]);
  const [aventura, setAventura] = useState([]);
  const [loginInitialTab, setLoginInitialTab] = useState('ingresar');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    async function cargarDatos() {
      const [aloj, gastro, avent] = await Promise.all([getAlojamientos(), getGastronomia(), getAventura()]);
      setAlojamientos(aloj);
      setSalidas(gastro);
      setAventura(avent);
    }
    cargarDatos();
  }, []);

  useEffect(() => {
    async function checkSession() {
      const s = await getSession();
      setSession(s);
      if (s) { const p = await getPerfil(); setPerfil(p); }
      setAuthLoading(false);
    }
    checkSession();
  }, []);

  const handleOpenDetail = (item, type, initialTab) => {
    setSelectedItem({ ...item, itemType: type, initialTab: initialTab || null });
    setView('detail');
    window.scrollTo(0, 0);
  };

  const handleOpenOferta = async (oferta) => {
    if (oferta?.categoria === 'alojamiento' && oferta?.negocioId) {
      let neg = alojamientos.find(a => String(a.id) === String(oferta.negocioId));
      if (!neg) neg = await getNegocioById(oferta.negocioId);
      if (neg) { handleOpenDetail(neg, 'alojamiento'); return; }
    }
    setSelectedOferta(oferta);
    setView('oferta-detail');
    window.scrollTo(0, 0);
  };

  const handleOpenPack = (pack) => {
    setSelectedPack(pack);
    setView('pack-detail');
    window.scrollTo(0, 0);
  };

  const handleOpenLocalidad = (localidad) => {
    setMarketplaceLocalidad(localidad || '');
    setView('marketplace');
    window.scrollTo(0, 0);
  };

  // Abre un negocio (alojamiento o gastronomía) por su id
  const handleOpenNegocio = (negocioId) => {
    const neg =
      alojamientos.find(a => String(a.id) === String(negocioId)) ||
      salidas.find(g => String(g.id) === String(negocioId));
    if (neg) {
      const tipo = salidas.some(g => String(g.id) === String(negocioId))
        ? 'salidas'
        : 'alojamiento';
      handleOpenDetail(neg, tipo);
    }
  };

  // Navega a la sección correcta según categoría de oferta
  const handleOpenSeccion = (categoria) => {
    if (categoria === 'salidas') {
      setView('salidas');
    } else if (categoria === 'ofertas') {
      // Desde OfertaDetailView — siempre va al listado de ofertas
      setMarketplaceLocalidad('');
      setView('marketplace-ofertas');
    } else {
      setMarketplaceLocalidad('');
      setView('marketplace');
    }
    window.scrollTo(0, 0);
  };

  const [wizardTip, setWizardTip] = useState(null); // null | 1 | 2

  const handleLoginSuccess = async () => {
    const s = await getSession();
    const p = await getPerfil();
    setSession(s); setPerfil(p);
    setView(p?.es_superadmin ? 'superadmin' : 'admin');
  };

  const handleOnboardingComplete = async () => {
    const s = await getSession();
    const p = await getPerfil();
    setSession(s); setPerfil(p);
    setView('home');
    setTimeout(() => setWizardTip(1), 900);
  };

  const handleLogout = async () => {
    const { logout } = await import('./lib/auth');
    await logout();
    setSession(null); setPerfil(null);
    // Solo redirigir si la vista actual requiere sesión activa
    const PROTECTED_VIEWS = ['admin', 'superadmin', 'login'];
    if (PROTECTED_VIEWS.includes(view)) setView('home');
    // En cualquier otra vista pública, se queda donde está (el estado de sesión se limpia)
  };

  // Pantalla de carga inicial (auth check) o loading global
  if (authLoading) return <LoadingScreen />;

  const PUBLIC_VIEWS = ['home','detail','ofertas','marketplace','marketplace-ofertas','socios','salidas','oferta-detail','pack-detail','packs','ofertas-regalo','publicar-oferta','beneficios-portal','favoritos','checkout'];

  return (
    <FavoritosProvider session={session} onLoginRequired={(tab) => { setLoginInitialTab(tab || 'registrarse'); setView('login'); }}>
    <CuponeraProvider session={session} onLoginRequired={() => setView('login')} onCheckout={() => { setView('checkout'); window.scrollTo(0, 0); }}>
      {/* Loading global — se activa con showLoading() desde cualquier vista */}
      {isLoading && <LoadingScreen />}

      <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">

        {PUBLIC_VIEWS.includes(view) && (
          <Navbar
            scrolled={scrolled}
            view={view}
            setView={setView}
            session={session}
            perfil={perfil}
            onLoginClick={(tab = 'ingresar') => { setLoginInitialTab(tab); setView('login'); }}
            onRegisterClick={(tab = 'registrarse') => { setLoginInitialTab(tab); setView('login'); }}
            onLogout={handleLogout}
            onPublicarOferta={() => { setView('publicar-oferta'); window.scrollTo(0, 0); }}
            onNavbarNav={(targetView, opts = {}) => {
              if (opts.localidades !== undefined) {
                setMarketplaceLocalidad('__multi__:' + opts.localidades.join(','));
              } else if (opts.localidad !== undefined) {
                setMarketplaceLocalidad(opts.localidad === 'Todos los destinos' ? '' : (opts.localidad || ''));
              } else if (opts.tipo !== undefined) {
                setMarketplaceLocalidad('');
              }
              if (opts.tipo !== undefined) setMarketplaceTipo(opts.tipo || 'todos');
              if (opts.gastroCategoria !== undefined || opts.gastroAventura !== undefined) {
                setGastroCategoria(opts.gastroCategoria || '');
                setGastroAventura(opts.gastroAventura || '');
              }
              if (opts.ofertasCategoria !== undefined) {
                setOfertasCategoria(opts.ofertasCategoria || null);
              }
              if (targetView === 'salidas') {
                setSalidasModoRanking(false);
                setGastroNavKey(k => k + 1);
              }
              setView(targetView);
              window.scrollTo(0, 0);
            }}
          />
        )}

        <main className="flex-grow">
          {view === 'home' && (
            <HomeView
              accommodations={alojamientos}
              dining={salidas}
              aventura={aventura}
              onOpenDetail={handleOpenDetail}
              onVerTodas={(cat) => { if (cat === 'salidas') { setSalidasModoRanking(true); setGastroNavKey(k => k + 1); setView('salidas'); } else { setOfertasCategoria(cat || null); setView('ofertas'); } window.scrollTo(0, 0); }}
              onArmarPack={() => { setView('marketplace'); window.scrollTo(0, 0); }}
              onVerMarketplace={() => { setView('marketplace'); window.scrollTo(0, 0); }}
              onOpenPack={handleOpenPack}
              onOpenOferta={handleOpenOferta}
              onVerOfertasRegalo={() => { setView('ofertas-regalo'); window.scrollTo(0, 0); }}
              onNavMarketplaceTipo={(filtro) => { setMarketplaceTipo(filtro || 'todos'); setView('marketplace'); window.scrollTo(0, 0); }}
            />
          )}
          {view === 'ofertas' && (
            <OfertasView
              key={ofertasCategoria + '|' + ofertasLocalidades.join(',')}
              onBack={() => { setOfertasCategoria(null); setOfertasLocalidades([]); setView('home'); }}
              onOpenOferta={handleOpenOferta}
              initialCategoria={ofertasCategoria}
              initialLocalidades={ofertasLocalidades}
            />
          )}
          {view === 'marketplace' && (
            <MarketplaceView
              key={marketplaceLocalidad + '|' + marketplaceTipo}
              onBack={() => { setMarketplaceLocalidad(''); setMarketplaceTipo('todos'); setView('home'); }}
              onOpenDetail={handleOpenDetail}
              initialFiltro={marketplaceTipo}
              initialLocalidad={marketplaceLocalidad}
              onVerOfertas={(locs) => { setOfertasLocalidades(locs); setOfertasCategoria(null); setView('ofertas'); window.scrollTo(0, 0); }}
            />
          )}
          {view === 'marketplace-ofertas' && (
            <MarketplaceView onBack={() => { setView('home'); window.scrollTo(0, 0); }} onOpenDetail={handleOpenDetail} initialFiltro="oferta" />
          )}
          {view === 'detail' && (
            <DetailView
              item={selectedItem}
              session={session}
              onLoginRequired={(tab) => { setLoginInitialTab(tab || 'registrarse'); setView('login'); }}
              onBack={() => setView('home')}
              onOpenOferta={handleOpenOferta}
              onOpenPack={handleOpenPack}
              onOpenLocalidad={handleOpenLocalidad}
              onOpenSeccion={handleOpenSeccion}
              onOpenClase={({ localidad, clase }) => {
                setMarketplaceLocalidad(localidad || '');
                setMarketplaceTipo(clase || 'todos');
                setView('marketplace');
                window.scrollTo(0, 0);
              }}
            />
          )}
          {view === 'oferta-detail' && (
            <OfertaDetailView
              oferta={selectedOferta}
              allPromos={ALL_PROMOS}
              onBack={() => { setView(selectedItem ? 'detail' : 'home'); window.scrollTo(0,0); }}
              onOpenOferta={handleOpenOferta}
              onOpenLocalidad={handleOpenLocalidad}
              onOpenNegocio={handleOpenNegocio}
              onOpenSeccion={handleOpenSeccion}
            />
          )}
          {view === 'pack-detail' && (
            <PackDetailView
              pack={selectedPack}
              onBack={() => setView('packs')}
              onOpenOferta={handleOpenOferta}
            />
          )}
          {view === 'packs' && (
            <PacksListView
              onBack={() => setView('home')}
              onOpenPack={handleOpenPack}
            />
          )}
          {view === 'ofertas-regalo' && (
            <OfertasRegaloView
              onBack={() => { setView('home'); window.scrollTo(0, 0); }}
              onOpenOferta={handleOpenOferta}
            />
          )}
          {view === 'publicar-oferta' && (
            <PublicarOfertaView
              onBack={() => { setView('home'); window.scrollTo(0, 0); }}
              onLoginSuccess={async (perfilData) => {
                const { getSession } = await import('./lib/auth');
                const s = await getSession();
                setSession(s); setPerfil(perfilData);
                setView(perfilData?.es_superadmin ? 'superadmin' : 'admin');
              }}
              onGoAdmin={() => setView('admin')}
              onGoSocios={() => setView('socios')}
            />
          )}
          {view === 'beneficios-portal' && (
            <BeneficiosPortalView
              onBack={() => { setView('home'); window.scrollTo(0, 0); }}
              onActivarOferta={handleOpenOferta}
            />
          )}
          {view === 'favoritos' && (
            <FavoritosView
              accommodations={alojamientos}
              dining={salidas}
              promos={ALL_PROMOS}
              onOpenDetail={handleOpenDetail}
              onOpenOferta={handleOpenOferta}
              onBack={() => { setView('home'); window.scrollTo(0, 0); }}
            />
          )}
          {view === 'checkout' && (
            <CheckoutView
              session={session}
              onBack={() => { setView('home'); window.scrollTo(0, 0); }}
              onSuccess={() => { setView('home'); window.scrollTo(0, 0); }}
            />
          )}
          {view === 'login' && (
            <LoginView
              onLoginSuccess={handleLoginSuccess}
              onBack={() => setView('home')}
              onOnboardingComplete={handleOnboardingComplete}
              initialTab={loginInitialTab}
            />
          )}
          {view === 'socios' && (
            <SociosView onBack={() => setView('home')} />
          )}
          {view === 'salidas' && (
            <GastronomyView
              key={gastroNavKey}
              onBack={() => { setGastroCategoria(''); setGastroAventura(''); setView('home'); }}
              session={session}
              onLoginClick={() => setView('login')}
              onOpenDetail={handleOpenDetail}
              onVerOfertas={() => { setOfertasCategoria(null); setView('ofertas'); window.scrollTo(0,0); }}
              initialCategoria={gastroCategoria}
              initialAventura={gastroAventura}
              modoRanking={salidasModoRanking}
            />
          )}
          {view === 'superadmin' && (
            <SuperAdminView
              perfil={perfil}
              onGoHome={() => setView('home')}
              onEditarSocio={async (negocioId) => {
                const { data } = await supabase.from('negocios').select('*').eq('id', negocioId).single();
                setPerfil(p => ({ ...p, negocio_id: negocioId, negocios: data }));
                setView('admin');
              }}
            />
          )}
          {view === 'admin' && (
            <AdminNegocioView
              perfil={perfil}
              onGoHome={() => setView('home')}
              onVolver={perfil?.es_superadmin ? () => setView('superadmin') : null}
            />
          )}
        </main>

        {PUBLIC_VIEWS.includes(view) && <Footer onNavigate={(v) => { setView(v); window.scrollTo(0,0); }} />}

        <CuponeraDrawer />
        <ChatBot />

        {/* ── Wizard tip post-onboarding ── */}
        {wizardTip && (() => {
          const userEmail = session?.user?.email || '';
          const closeAll  = () => setWizardTip(null);
          const W = {
            font:  "'Inter', system-ui, sans-serif",
            ink:   '#0f172a',
            ink2:  '#475569',
            p:     '#475be1',
            green: '#10b981',
          };
          return (
            <>
              {/* Backdrop */}
              <div onClick={closeAll} style={{ position:'fixed', inset:0, zIndex:9980, background:'rgba(8,12,26,0.65)', backdropFilter:'blur(3px)' }} />
              {/* Card posicionada apuntando al avatar del usuario (top-right) */}
              <div style={{ position:'fixed', top:68, right:22, zIndex:9981, width:310, background:'#fff', borderRadius:20, boxShadow:'0 24px 64px rgba(0,0,0,0.22)', overflow:'hidden', animation:'wizard-in 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
                {/* Triangulito */}
                <div style={{ position:'absolute', top:-7, right:56, width:14, height:14, background:'#fff', transform:'rotate(45deg)', borderRadius:3, boxShadow:'-2px -2px 4px rgba(0,0,0,0.06)' }} />

                {wizardTip === 1 && (
                  <>
                    <div style={{ background:'linear-gradient(135deg, #475be1 0%, #6d28d9 100%)', padding:'28px 20px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
                      <img src="/cuponix-base.svg" alt="" style={{ height:96, objectFit:'contain', filter:'drop-shadow(0 8px 20px rgba(0,0,0,0.3))' }} />
                    </div>
                    <div style={{ padding:'20px 20px 22px' }}>
                      <h3 style={{ margin:'0 0 8px', fontSize:17, fontWeight:800, color:W.ink, fontFamily:W.font }}>¡Tu panel de socio está listo!</h3>
                      <p style={{ margin:'0 0 18px', fontSize:13, color:W.ink2, lineHeight:1.6, fontFamily:W.font }}>
                        Desde tu nombre arriba a la derecha podés ingresar al panel en cualquier momento — cargás ofertas, ves estadísticas y administrás tu cuenta.
                      </p>
                      <button onClick={() => setWizardTip(2)} style={{ width:'100%', background:W.p, color:'#fff', border:'none', borderRadius:11, padding:'12px 0', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:W.font }}>
                        Entendido →
                      </button>
                    </div>
                  </>
                )}

                {wizardTip === 2 && (
                  <div style={{ padding:'28px 22px 24px' }}>
                    <div style={{ width:52, height:52, borderRadius:14, background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={W.green} strokeWidth="1.8" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    </div>
                    <h3 style={{ margin:'0 0 8px', fontSize:16, fontWeight:800, color:W.ink, textAlign:'center', fontFamily:W.font }}>Confirmá tu email</h3>
                    <p style={{ margin:'0 0 18px', fontSize:13, color:W.ink2, lineHeight:1.6, textAlign:'center', fontFamily:W.font }}>
                      Te enviamos un link de verificación a<br/><strong style={{ color:W.ink }}>{userEmail}</strong>.<br/>Hacé click en ese link para activar tu cuenta completamente.
                    </p>
                    <button onClick={closeAll} style={{ width:'100%', background:W.green, color:'#fff', border:'none', borderRadius:11, padding:'12px 0', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:W.font }}>
                      ¡Listo, voy a revisar mi mail!
                    </button>
                  </div>
                )}
              </div>
            </>
          );
        })()}

        <style dangerouslySetInnerHTML={{ __html: `
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          @keyframes fade-in { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
          @keyframes dropdown-in { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
          .animate-dropdown { animation: dropdown-in 0.2s ease-out forwards; }
          @keyframes wizard-in { from { opacity: 0; transform: translateY(-12px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        `}} />
      </div>
    </CuponeraProvider>
    </FavoritosProvider>
  );
}

// ─── Raíz: provee el contexto de loading a toda la app ───────
export default function App() {
  return (
    <LoadingProvider>
      <AppContent />
    </LoadingProvider>
  );
}
