// ============================================================
//  src/App.jsx
// ============================================================
import { useState, useEffect } from 'react';
import { Mail } from 'lucide-react';
import Navbar           from './components/Navbar';
import Footer           from './components/Footer';
import HomeView         from './views/HomeView';
import DetailView       from './views/DetailView';
import LoginView, { OnboardingComercial } from './views/LoginView';
import SuperAdminView   from './views/SuperAdminView';
import AdminNegocioView from './views/AdminNegocioView';
import OfertasView      from './views/OfertasView';
import MarketplaceView  from './views/MarketplaceView';
import SociosView        from './views/SociosView';
import GastronomyView    from './views/GastronomyView';
import LoadingScreen     from './components/LoadingScreen';
import OfertaDetailView   from './views/OfertaDetailView';
import PacksListView      from './views/PacksListView';
import OfertasRegaloView  from './views/OfertasRegaloView';
import PublicarOfertaView    from './views/PublicarOfertaView';
import BeneficiosPortalView  from './views/BeneficiosPortalView';
import FavoritosView         from './views/FavoritosView';
import MisCuponesView        from './views/MisCuponesView';
import MiPaseView            from './views/MiPaseView';
import CheckoutView          from './views/CheckoutView';
import CheckoutPaseView      from './views/CheckoutPaseView';
import CheckoutHoteleroView  from './views/CheckoutHoteleroView';
import CanjearRegaloView     from './views/CanjearRegaloView';
import PaseDebugView         from './views/PaseDebugView'; // ⚠️ TEMPORAL (Brief 1) — entra por ?pase-debug=1
import CanjearView           from './views/CanjearView';   // entra por ?canjear=<negocioId> (QR del socio)

import { getAlojamientos, getGastronomia, getAventura, getNegocioById, getPromos } from './lib/datos';
import { getSession, getPerfil } from './lib/auth';
import { supabase } from './lib/supabase';
import { LoadingProvider, useLoading } from './lib/loading';
import { CarritoProvider } from './lib/carrito';
import { PasePropioProvider } from './lib/pasePropio';
import CarritoDrawer                     from './components/CarritoDrawer';
import { FavoritosProvider } from './lib/favoritos';
import { SesionProvider } from './lib/sesion';
import ChatBot                           from './components/ChatBot';
import BienvenidaTuristaWizard           from './components/BienvenidaTuristaWizard';
import useLenisSmoothScroll              from './hooks/useLenisSmoothScroll';

// ─── Contenido de la app (necesita el contexto de loading) ───
function AppContent() {
  const { isLoading } = useLoading();
  // Sensación de scroll suave (aceleración/frenado) con Lenis, igual que
  // cheaf.com/ar — ver el archivo del hook para el porqué (tres intentos
  // caseros antes de esto no funcionaron bien).
  useLenisSmoothScroll();

  // El QR estático del socio apunta a ?canjear=<negocioId>: el turista cae
  // directo en la pantalla de canje con ese comercio ya resuelto.
  // ⚠️ TEMPORAL (Brief 1): ?pase-debug=1 arranca en el panel de prueba del Pase
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const [canjearNegocioId] = useState(() => params?.get('canjear') || null);
  const [view, setView]                 = useState(
    () => params?.has('canjear') ? 'canjear'
        : params?.has('pase-debug') ? 'pase-debug'
        : 'home'
  );
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedOferta, setSelectedOferta]     = useState(null);
  const [marketplaceLocalidad, setMarketplaceLocalidad] = useState('');
  const [marketplaceTipo,     setMarketplaceTipo]     = useState('todos');
  const [packFamilia,         setPackFamilia]         = useState(null);
  const [paseDias,            setPaseDias]            = useState(7);
  // "Planes y suscripción" entra al checkout sin saber si es turista o hotelero:
  // ahí el checkout arranca preguntándolo. Los CTA de "Pase x N días" no.
  const [pasePreguntarPerfil, setPasePreguntarPerfil] = useState(false);
  // Sube cada vez que se entra por el navbar: fuerza el remount del checkout
  // para que vuelva a preguntar aunque ya estuvieras parado en esa vista.
  const [paseNavKey,          setPaseNavKey]          = useState(0);
  const [ofertasCategoria, setOfertasCategoria] = useState(null);
  const [ofertasLocalidades, setOfertasLocalidades] = useState([]);
  const [ofertasTipoInicial, setOfertasTipoInicial] = useState(null);
  const [ofertasExperienciaInicial, setOfertasExperienciaInicial] = useState(null);
  const [gastroCategoria,   setGastroCategoria]   = useState('');
  const [gastroAventura,    setGastroAventura]    = useState('');
  const [gastroFoco,        setGastroFoco]        = useState(null);
  const [gastroModoAventura, setGastroModoAventura] = useState(false);
  const [gastroNavKey,      setGastroNavKey]      = useState(0);
  const [salidasModoRanking, setSalidasModoRanking] = useState(false);
  const [scrolled, setScrolled]         = useState(false);
  const [session, setSession]           = useState(null);
  const [perfil, setPerfil]             = useState(null);
  const [authLoading, setAuthLoading]   = useState(true);
  // Si viene de "Publicá GRATIS" (menú de usuario), el wizard de alta comercial
  // salta el paso de elegir plan y entra directo en Free.
  const [convertirPlanDirecto, setConvertirPlanDirecto] = useState(null);
  const [alojamientos, setAlojamientos] = useState([]);
  const [salidas, setSalidas]   = useState([]);
  const [aventura, setAventura] = useState([]);
  // Catálogo real de ofertas. Lo consumen el detalle de oferta (para "otras del
  // mismo socio") y Favoritos (para resolver los corazones). Antes las dos
  // recibían ALL_PROMOS del mock: los favoritos de un turista se buscaban
  // contra un catálogo inventado y nunca podían coincidir con lo que compró.
  const [promos, setPromos] = useState([]);
  const [loginInitialTab, setLoginInitialTab] = useState('ingresar');
  // 'comercial' entra directo al alta de negocio; null muestra el selector.
  const [loginModoRegistro, setLoginModoRegistro] = useState(null);
  // El login se disparó porque un visitante quiso agregar un cupón a su carrito.
  // Al volver logueado lo mandamos a home (no al panel) y dejamos que el carrito
  // reinyecte el cupón + muestre el aviso, sin interrumpir con el wizard.
  const [cuponLoginPending, setCuponLoginPending] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    async function cargarDatos() {
      const [aloj, gastro, avent, ofertas] = await Promise.all([getAlojamientos(), getGastronomia(), getAventura(), getPromos(300)]);
      setAlojamientos(aloj);
      setSalidas(gastro);
      setAventura(avent);
      setPromos(ofertas || []);
    }
    cargarDatos();
  }, []);

  useEffect(() => {
    async function checkSession() {
      const s = await getSession();
      setSession(s);
      if (s) {
        const p = await getPerfil();
        setPerfil(p);
        // Si venía de Google con intención "comercial" (guardada antes del
        // redirect), lo mandamos derecho al alta comercial en vez de dejarlo
        // como turista con "publicar oferta". Se honra sólo si es reciente
        // (<10 min) y el perfil todavía no tiene negocio.
        try {
          const raw = localStorage.getItem('cuponear_reg_intent');
          if (raw) {
            localStorage.removeItem('cuponear_reg_intent');
            const { modo, ts } = JSON.parse(raw);
            const fresco = Date.now() - (ts || 0) < 10 * 60 * 1000;
            if (modo === 'comercial' && fresco && p && !p.negocio_id && !p.es_superadmin) {
              setView('convertir-comercial');
            }
          }
        } catch { /* flag inválido: ignorar */ }
      }
      setAuthLoading(false);
    }
    checkSession();
  }, []);

  // `ofertaId` es el deep-link: qué oferta del socio abrir expandida en el
  // panel. Se llamaba `initialTab` y nadie lo leía — resto del sistema de tabs
  // que el acordeón reemplazó.
  const handleOpenDetail = (item, type, ofertaId) => {
    setSelectedItem({ ...item, itemType: type, ofertaId: ofertaId || null });
    setView('detail');
    window.scrollTo(0, 0);
  };

  const handleOpenOferta = async (oferta, opts = {}) => {
    // Un cupón abre la ficha del socio (igual para todas las categorías, no sólo
    // alojamiento). Así gastronomía y aventura & relax muestran la misma vista de
    // socio/promociones que los alojamientos, en lugar de la vista de oferta suelta.
    //
    // `opts.detalle` saltea eso y va derecho al detalle del cupón. Lo usa
    // "Ampliar info" de la mini-ficha: la tarjeta pregunta quién es el comercio,
    // el enlace pregunta la letra chica del descuento. La bandera evita tener
    // que enhebrar un segundo callback por las once superficies que pintan
    // mini-fichas — la decisión de a dónde ir es de acá, no de cada vista.
    if (!opts.detalle && oferta?.negocioId) {
      let neg = alojamientos.find(a => String(a.id) === String(oferta.negocioId));
      if (!neg) neg = await getNegocioById(oferta.negocioId);
      // El tercer argumento es lo que hace que el panel abra ESTA oferta y no
      // la primera del socio: el turista clickeó una minificha concreta.
      if (neg) { handleOpenDetail(neg, oferta.categoria || undefined, oferta.id); return; }
    }
    setSelectedOferta(oferta);
    setView('oferta-detail');
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
  // Siempre aterriza en el listado unificado de ofertas (OfertasView) —
  // las minifichas de negocio sin oferta quedan reservadas al ranking de gastronomía.
  const handleOpenSeccion = (categoria) => {
    if (categoria === 'salidas' || categoria === 'alojamiento' || categoria === 'aventura_relax') {
      setOfertasCategoria(categoria);
      setOfertasLocalidades([]);
      setOfertasTipoInicial(null);
      setView('ofertas');
    } else if (categoria === 'ofertas') {
      setOfertasCategoria(null);
      setOfertasLocalidades([]);
      setOfertasTipoInicial(null);
      setView('ofertas');
    } else {
      setMarketplaceLocalidad('');
      setView('marketplace');
    }
    window.scrollTo(0, 0);
  };

  const [wizardTip, setWizardTip] = useState(null); // null | 1 | 2
  const [turistaWizardOpen, setTuristaWizardOpen] = useState(false);
  const [emailToastOpen, setEmailToastOpen] = useState(false);

  useEffect(() => {
    if (!emailToastOpen) return;
    const t = setTimeout(() => setEmailToastOpen(false), 5000);
    return () => clearTimeout(t);
  }, [emailToastOpen]);

  const handleTuristaRegistroComplete = async () => {
    const s = await getSession();
    const p = await getPerfil();
    setSession(s); setPerfil(p);
    // Si antes de registrarse compró un pase dejando sólo el mail, acá se
    // convierte en un pase suyo (ver vincularComprasPase en lib/pases.js).
    if (s?.user?.email) {
      const { vincularComprasPase } = await import('./lib/pases');
      await vincularComprasPase(s.user.id, s.user.email);
    }
    setView('home');
    window.scrollTo(0, 0);
    // Si venía de agregar un cupón, el carrito abre su drawer + aviso: no
    // encimamos el wizard de bienvenida.
    if (cuponLoginPending) { setCuponLoginPending(false); return; }
    setTuristaWizardOpen(true);
  };

  const handleLoginSuccess = async () => {
    const s = await getSession();
    const p = await getPerfil();
    setSession(s); setPerfil(p);
    if (cuponLoginPending) {
      setCuponLoginPending(false);
      setView('home');
      window.scrollTo(0, 0);
      return;
    }
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

  const PUBLIC_VIEWS = ['home','detail','ofertas','marketplace','marketplace-ofertas','socios','salidas','oferta-detail','packs','ofertas-regalo','publicar-oferta','beneficios-portal','favoritos','checkout','checkout-pase','checkout-hotelero','canjear-regalo'];

  return (
    <SesionProvider perfil={perfil}>
    <FavoritosProvider session={session} onLoginRequired={(tab) => { setLoginInitialTab(tab || 'registrarse'); setView('login'); }}>
    {/* Sin sesión, querer un cupón lleva al checkout del Pase y no al login
        viejo —el de "Soy turista / Soy comercio"—: ese ya no describe al
        producto, y el checkout del Pase trae su propio alta de cuenta.

        El cupón no se pierde: `guardarPendiente` lo deja anotado y el carrito
        lo reinyecta solo cuando aparece la sesión, salga de donde salga. */}
    <CarritoProvider session={session} onLoginRequired={() => { setCuponLoginPending(true); setPaseDias(7); setPasePreguntarPerfil(false); setView('checkout-pase'); window.scrollTo(0, 0); }} onCheckout={() => { setView('checkout'); window.scrollTo(0, 0); }}>
    <PasePropioProvider session={session} perfil={perfil} onComprarPase={() => { setPaseDias(7); setPasePreguntarPerfil(false); setView('checkout-pase'); window.scrollTo(0, 0); }}>
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
            onRegisterClick={(tab = 'registrarse', modo = null) => {
              // `modo` fija el tipo de cuenta y saltea el selector turista/negocio:
              // lo usa "Publicá una oferta", que va derecho al alta de negocio.
              setLoginInitialTab(tab); setLoginModoRegistro(modo); setView('login');
            }}
            onLogout={handleLogout}
            onPublicarOferta={() => {
              // Turista logueado sin negocio: primero convierte su cuenta a comercial.
              if (session && perfil && !perfil.negocio_id && !perfil.es_superadmin) setView('convertir-comercial');
              else setView('publicar-oferta');
              window.scrollTo(0, 0);
            }}
            onConvertirseSocio={() => {
              setConvertirPlanDirecto('free');
              setView('convertir-comercial');
              window.scrollTo(0, 0);
            }}
            onNavbarNav={(targetView, opts = {}) => {
              if (opts.localidades !== undefined) {
                setMarketplaceLocalidad('__multi__:' + opts.localidades.join(','));
                if (targetView === 'ofertas') setOfertasLocalidades(opts.localidades || []);
              } else if (opts.localidad !== undefined) {
                setMarketplaceLocalidad(opts.localidad === 'Todos los destinos' ? '' : (opts.localidad || ''));
                if (targetView === 'ofertas') {
                  setOfertasLocalidades(opts.localidad && opts.localidad !== 'Todos los destinos' ? [opts.localidad] : []);
                }
              } else if (opts.tipo !== undefined) {
                setMarketplaceLocalidad('');
                if (targetView === 'ofertas') setOfertasLocalidades([]);
              } else if (targetView === 'ofertas') {
                setOfertasLocalidades([]);
              }
              if (opts.tipo !== undefined) setMarketplaceTipo(opts.tipo || 'todos');
              if (targetView === 'ofertas') {
                setOfertasTipoInicial(opts.tipo || opts.gastroCategoria || opts.aventuraTipo || null);
                setOfertasExperienciaInicial(opts.gastroExperiencia || null);
              }
              if (opts.gastroCategoria !== undefined || opts.gastroAventura !== undefined) {
                setGastroCategoria(opts.gastroCategoria || '');
                setGastroAventura(opts.gastroAventura || '');
              }
              if (opts.ofertasCategoria !== undefined) {
                setOfertasCategoria(opts.ofertasCategoria || null);
              }
              if (targetView === 'salidas') {
                setSalidasModoRanking(false);
                setGastroModoAventura(false);
                setGastroFoco(null);
                setGastroNavKey(k => k + 1);
              }
              // "Packs todo incluido": cada familia del menú entra al listado
              // con ese filtro ya tildado; "Más packs" (null) entra sin filtro.
              if (targetView === 'packs') setPackFamilia(opts.packFamilia || null);
              if (targetView === 'checkout-pase') {
                setPasePreguntarPerfil(!!opts.preguntarPerfil);
                setPaseNavKey(k => k + 1);
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
              onVerTodas={(cat) => { if (cat === 'salidas') { setSalidasModoRanking(true); setGastroModoAventura(false); setGastroFoco(null); setGastroNavKey(k => k + 1); setView('salidas'); } else { setOfertasCategoria(cat || null); setOfertasTipoInicial(null); setView('ofertas'); } window.scrollTo(0, 0); }}
              onArmarPack={() => { setView('marketplace'); window.scrollTo(0, 0); }}
              onVerPacks={() => { setPackFamilia(null); setView('packs'); window.scrollTo(0, 0); }}
              onOpenOferta={handleOpenOferta}
              onVerOfertasRegalo={() => { setView('ofertas-regalo'); window.scrollTo(0, 0); }}
              onComprarPase={(dias) => { setPaseDias(dias || 7); setPasePreguntarPerfil(false); setView('checkout-pase'); window.scrollTo(0, 0); }}
              onSuscribirHoteleria={() => { setView('checkout-hotelero'); window.scrollTo(0, 0); }}
              // Mismo cierre que el `onListo` de la vista completa de
              // checkout-hotelero, más abajo: el alta embebida en el hero
              // (ver CheckoutHoteleroView `embebido`, disparada desde
              // HeroPase) también necesita refrescar sesión/perfil y mandar
              // al panel — no hay por qué navegar a otra ruta primero.
              onSuscripcionLista={async () => {
                const s = await getSession();
                const p = await getPerfil();
                setSession(s); setPerfil(p);
                setView(p?.negocio_id ? 'admin' : 'home');
                window.scrollTo(0, 0);
              }}
              onVerPase={() => { setView('mi-pase'); window.scrollTo(0, 0); }}
              onNavMarketplaceTipo={(filtro) => { setMarketplaceTipo(filtro || 'todos'); setView('marketplace'); window.scrollTo(0, 0); }}
              onNavCuponear={(target) => {
                // Entramos SIEMPRE al listado con los filtros vacíos (inclusive):
                // se muestra todo el universo del bucket y el usuario acota con
                // los filtros de la izquierda (localidad, etc.). `foco` sólo define
                // qué grupo de filtros y qué título mostrar — nunca pre-tilda nada.
                if (target === 'alojamientos') {
                  setOfertasCategoria('alojamiento');
                  setOfertasTipoInicial(null);
                  setView('ofertas');
                } else if (target === 'comer' || target === 'compras') {
                  setSalidasModoRanking(false);
                  setGastroModoAventura(false);
                  setGastroCategoria(''); setGastroAventura('');
                  setGastroFoco(target === 'compras' ? 'compras' : null);
                  setGastroNavKey(k => k + 1);
                  setView('salidas');
                } else if (target === 'experiencia' || target === 'mimo') {
                  setSalidasModoRanking(false);
                  setGastroModoAventura(true);
                  setGastroCategoria(''); setGastroAventura('');
                  setGastroFoco(target);
                  setGastroNavKey(k => k + 1);
                  setView('salidas');
                }
                window.scrollTo(0, 0);
              }}
            />
          )}
          {view === 'ofertas' && (
            /* data-nav-section: pinta y subraya el ítem del navbar mientras se
               está dentro del listado (mismo mecanismo que las tiras de la home). */
            <div data-nav-section={ofertasCategoria === 'aventura_relax' ? 'aventura' : ofertasCategoria === 'alojamiento' ? 'aloj' : undefined}>
              <OfertasView
                key={ofertasCategoria + '|' + ofertasLocalidades.join(',') + '|' + ofertasTipoInicial + '|' + ofertasExperienciaInicial}
                onBack={() => { setOfertasCategoria(null); setOfertasLocalidades([]); setOfertasTipoInicial(null); setOfertasExperienciaInicial(null); setView('home'); }}
                onOpenOferta={handleOpenOferta}
                initialCategoria={ofertasCategoria}
                initialLocalidades={ofertasLocalidades}
                initialTipo={ofertasTipoInicial}
                initialExperiencia={ofertasExperienciaInicial}
              />
            </div>
          )}
          {view === 'marketplace' && (
            <MarketplaceView
              key={marketplaceLocalidad + '|' + marketplaceTipo}
              onBack={() => { setMarketplaceLocalidad(''); setMarketplaceTipo('todos'); setView('home'); }}
              onOpenDetail={handleOpenDetail}
              initialFiltro={marketplaceTipo}
              initialLocalidad={marketplaceLocalidad}
              onVerOfertas={(locs) => { setOfertasLocalidades(locs); setOfertasCategoria(null); setOfertasTipoInicial(null); setView('ofertas'); window.scrollTo(0, 0); }}
              onOpenOferta={handleOpenOferta}
            />
          )}
          {view === 'marketplace-ofertas' && (
            <MarketplaceView onBack={() => { setView('home'); window.scrollTo(0, 0); }} onOpenDetail={handleOpenDetail} initialFiltro="oferta" onOpenOferta={handleOpenOferta} />
          )}
          {view === 'detail' && (
            <DetailView
              item={selectedItem}
              session={session}
              onLoginRequired={(tab) => { setLoginInitialTab(tab || 'registrarse'); setView('login'); }}
              onBack={() => setView('home')}
              onOpenOferta={handleOpenOferta}
              onOpenLocalidad={handleOpenLocalidad}
              onOpenSeccion={handleOpenSeccion}
              onComprarPase={(dias) => { setPaseDias(dias || 7); setPasePreguntarPerfil(false); setView('checkout-pase'); window.scrollTo(0, 0); }}
              onSuscribirHoteleria={() => { setView('checkout-hotelero'); window.scrollTo(0, 0); }}
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
              allPromos={promos}
              onBack={() => { setView(selectedItem ? 'detail' : 'home'); window.scrollTo(0,0); }}
              onOpenOferta={handleOpenOferta}
              onOpenLocalidad={handleOpenLocalidad}
              onOpenNegocio={handleOpenNegocio}
              onOpenSeccion={handleOpenSeccion}
              session={session}
              onComprarPase={(dias) => { setPaseDias(dias || 7); setPasePreguntarPerfil(false); setView('checkout-pase'); window.scrollTo(0, 0); }}
            />
          )}
          {view === 'packs' && (
            <div data-nav-section="packs">
              <PacksListView
                onBack={() => setView('home')}
                familia={packFamilia}
                onFamiliaChange={setPackFamilia}
                onVerPase={() => { setView('mi-pase'); window.scrollTo(0, 0); }}
              />
            </div>
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
          {view === 'mi-pase' && (
            <MiPaseView
              session={session}
              onBack={() => { setView('home'); window.scrollTo(0, 0); }}
              onComprarPase={() => { setView('checkout-pase'); window.scrollTo(0, 0); }}
              onExplorar={() => { setView('ofertas'); window.scrollTo(0, 0); }}
            />
          )}
          {view === 'mis-cupones' && (
            <MisCuponesView
              session={session}
              onBack={() => { setView('home'); window.scrollTo(0, 0); }}
              onExplorar={() => { setView('ofertas'); window.scrollTo(0, 0); }}
            />
          )}
          {view === 'favoritos' && (
            <FavoritosView
              accommodations={alojamientos}
              dining={salidas}
              promos={promos}
              onOpenDetail={handleOpenDetail}
              onOpenOferta={handleOpenOferta}
              onBack={() => { setView('home'); window.scrollTo(0, 0); }}
            />
          )}
          {view === 'checkout' && (
            <CheckoutView
              session={session}
              onBack={() => { setView('home'); window.scrollTo(0, 0); }}
              onSuccess={() => { setView('mis-cupones'); window.scrollTo(0, 0); }}
            />
          )}
          {view === 'canjear' && (
            <CanjearView
              session={session}
              negocioId={canjearNegocioId}
              onSalir={() => { setView('mis-cupones'); window.scrollTo(0, 0); }}
              onLoginRequired={() => { setLoginInitialTab('ingresar'); setView('login'); window.scrollTo(0, 0); }}
            />
          )}
          {/* ⚠️ TEMPORAL (Brief 1): panel de prueba del Pase — borrar con Brief 2 */}
          {view === 'pase-debug' && (
            <PaseDebugView
              session={session}
              perfil={perfil}
              onBack={() => { setView('home'); window.scrollTo(0, 0); }}
            />
          )}
          {view === 'checkout-pase' && (
            <CheckoutPaseView
              key={`pase-${paseNavKey}`}
              paseDias={paseDias}
              preguntarPerfil={pasePreguntarPerfil}
              onSoyHotelero={() => { setView('checkout-hotelero'); window.scrollTo(0, 0); }}
              onListo={async () => {
                // La cuenta ya se creó (o se validó) dentro del checkout: acá
                // sólo se refresca la sesión en memoria y se vuelve a la home.
                const s = await getSession();
                const p = await getPerfil();
                setSession(s); setPerfil(p);
                setView('home');
                window.scrollTo(0, 0);
              }}
            />
          )}
          {view === 'canjear-regalo' && (
            <CanjearRegaloView
              onComprarPase={() => { setPasePreguntarPerfil(false); setPaseNavKey(k => k + 1); setView('checkout-pase'); window.scrollTo(0, 0); }}
              onListo={async () => {
                // El pase-regalo ya quedó activo bajo la cuenta recién creada:
                // refrescamos sesión y lo mandamos a ver los descuentos.
                const s = await getSession();
                const p = await getPerfil();
                setSession(s); setPerfil(p);
                setOfertasCategoria(null); setOfertasTipoInicial(null); setOfertasLocalidades([]);
                setView('ofertas');
                window.scrollTo(0, 0);
              }}
            />
          )}
          {view === 'checkout-hotelero' && (
            <CheckoutHoteleroView
              onListo={async () => {
                // El alta ya creó cuenta + negocio: refrescamos sesión y perfil
                // y lo dejamos en su panel, que es donde está su código.
                const s = await getSession();
                const p = await getPerfil();
                setSession(s); setPerfil(p);
                setView(p?.negocio_id ? 'admin' : 'home');
                window.scrollTo(0, 0);
              }}
            />
          )}
          {view === 'login' && (
            <LoginView
              onLoginSuccess={handleLoginSuccess}
              onBack={() => setView('home')}
              onOnboardingComplete={handleOnboardingComplete}
              onTuristaRegistrada={handleTuristaRegistroComplete}
              initialTab={loginInitialTab}
              initialModoRegistro={loginModoRegistro}
            />
          )}
          {view === 'convertir-comercial' && session && (
            <OnboardingComercial
              regUserId={session.user.id}
              rNombre={(perfil?.nombre || '').trim().split(' ')[0] || ''}
              rApellido={(perfil?.nombre || '').trim().split(' ').slice(1).join(' ')}
              rEmail={perfil?.email || session.user.email || ''}
              planDirecto={convertirPlanDirecto}
              onComplete={() => { setConvertirPlanDirecto(null); handleOnboardingComplete(); }}
              onSalir={() => { setConvertirPlanDirecto(null); setView('home'); window.scrollTo(0, 0); }}
            />
          )}
          {view === 'socios' && (
            <SociosView onBack={() => setView('home')} />
          )}
          {view === 'salidas' && (
            <div data-nav-section={gastroModoAventura ? 'aventura' : 'gastro'}>
              <GastronomyView
                key={gastroNavKey}
                onBack={() => { setGastroCategoria(''); setGastroAventura(''); setGastroFoco(null); setGastroModoAventura(false); setView('home'); }}
                session={session}
                onLoginClick={() => setView('login')}
                onOpenDetail={handleOpenDetail}
                onOpenOferta={handleOpenOferta}
                onVerOfertas={() => { setOfertasCategoria(null); setOfertasTipoInicial(null); setView('ofertas'); window.scrollTo(0,0); }}
                onVerRanking={() => { setSalidasModoRanking(true); window.scrollTo(0, 0); }}
                initialCategoria={gastroCategoria}
                initialAventura={gastroAventura}
                foco={gastroFoco}
                modoAventura={gastroModoAventura}
                modoRanking={salidasModoRanking}
              />
            </div>
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

        <CarritoDrawer />
        <ChatBot view={view} />

        {/* ── Wizard de bienvenida post-registro de turista ── */}
        <BienvenidaTuristaWizard
          open={turistaWizardOpen}
          onClose={() => { setTuristaWizardOpen(false); setEmailToastOpen(true); }}
        />

        {/* ── Globito: recordatorio de confirmar el email ── */}
        {emailToastOpen && (
          <div
            onClick={() => setEmailToastOpen(false)}
            style={{
              position: 'fixed', top: 78, right: 22, zIndex: 9990, width: 300, background: '#fff',
              borderRadius: 16, boxShadow: '0 20px 50px rgba(0,0,0,0.18)', padding: '14px 16px',
              display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer',
              fontFamily: "'Inter', system-ui, sans-serif",
              animation: 'wizard-in 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
            }}
          >
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Mail size={17} color="#10b981" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>No te olvides de confirmar tu email</div>
              <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>Te enviamos un correo con un link para activar tu cuenta.</div>
            </div>
          </div>
        )}

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
    </PasePropioProvider>
    </CarritoProvider>
    </FavoritosProvider>
    </SesionProvider>
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
