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

import { getAlojamientos, getGastronomia, getNegocioById } from './lib/datos';
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
  const [scrolled, setScrolled]         = useState(false);
  const [session, setSession]           = useState(null);
  const [perfil, setPerfil]             = useState(null);
  const [authLoading, setAuthLoading]   = useState(true);
  const [alojamientos, setAlojamientos] = useState([]);
  const [salidas, setSalidas]   = useState([]);
  const [loginInitialTab, setLoginInitialTab] = useState('ingresar');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    async function cargarDatos() {
      const [aloj, gastro] = await Promise.all([getAlojamientos(), getGastronomia()]);
      setAlojamientos(aloj);
      setSalidas(gastro);
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

  const handleLoginSuccess = async () => {
    const s = await getSession();
    const p = await getPerfil();
    setSession(s); setPerfil(p);
    setView(p?.es_superadmin ? 'superadmin' : 'admin');
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

  const PUBLIC_VIEWS = ['home','detail','ofertas','marketplace','marketplace-ofertas','socios','salidas','oferta-detail','pack-detail','packs','ofertas-regalo','publicar-oferta','beneficios-portal'];

  return (
    <FavoritosProvider session={session} onLoginRequired={(tab) => { setLoginInitialTab(tab || 'registrarse'); setView('login'); }}>
    <CuponeraProvider session={session} onLoginRequired={() => setView('login')}>
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
              onOpenDetail={handleOpenDetail}
              onVerTodas={(cat) => { setOfertasCategoria(cat || null); setView('ofertas'); window.scrollTo(0, 0); }}
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
          {view === 'login' && (
            <LoginView onLoginSuccess={handleLoginSuccess} onBack={() => setView('home')} initialTab={loginInitialTab} />
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

        <style dangerouslySetInnerHTML={{ __html: `
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          @keyframes fade-in { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
          @keyframes dropdown-in { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
          .animate-dropdown { animation: dropdown-in 0.2s ease-out forwards; }
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
