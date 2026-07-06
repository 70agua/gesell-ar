Mapa de archivos — Cuponear

Raíz / Entry Points
src/main.jsx: Punto de entrada React. Monta <App> en el DOM.
src/App.jsx: Router central SPA. Maneja view como estado, envuelve todos los providers (Loading, Cuponera, Favoritos) y renderiza Navbar, Footer, CuponeraDrawer y ChatBot globales.
src/index.css: Estilos globales + variables CSS del design system Aire.
src/data/mockData.js: Datos de prueba: alojamientos, packs, promos y localidades. Fuente temporal hasta migración total a Supabase.

Vistas (src/views/)
src/views/HomeView.jsx: Pantalla principal. Buscador de alojamientos, carrusel de packs y grid de ofertas destacadas.
src/views/DetailView.jsx: Ficha completa de un alojamiento. Galería, mapa Leaflet, ofertas asociadas y botón de reserva con créditos.
src/views/MarketplaceView.jsx: Grid de alojamientos con filtros por localidad y tipo. Carga datos reales desde Supabase.
src/views/OfertasView.jsx: Listado de todas las ofertas (Flash y Normal) con countdown en tiempo real.
src/views/OfertaDetailView.jsx: Detalle de una oferta/cupón. Muestra condiciones, precio en créditos y botón de canje.
src/views/PacksListView.jsx: Listado editorial de packs de experiencias con datos de mockData.
src/views/PackDetailView.jsx: Detalle de un pack. Layout tipo revista con fotos, itinerario y precio.
src/views/GastronomyView.jsx: Vista de gastronomía. Mapa Leaflet arriba, mini-fichas de restaurantes abajo.
src/views/OfertasRegaloView.jsx: Vista pública (sin sidebar) de ofertas destacadas curadas por el superadmin. Pensada para compartir.
src/views/FavoritosView.jsx: Lista de alojamientos guardados con corazón por el usuario autenticado.
src/views/BeneficiosPortalView.jsx: Portal de beneficios exclusivos de un alojamiento para sus huéspedes (/beneficios/:slug).
src/views/PublicarOfertaView.jsx: Formulario de 3 pasos para que un socio publique una oferta, con selector de ubicación en mapa.
src/views/SociosView.jsx: Landing de planes para socios (BASE / PLUS / BLACK). Tabla comparativa + formulario de contacto/registro.
src/views/LoginView.jsx: Pantalla de login y registro (turista / negocio). Soporta email+password y Google OAuth.
src/views/AdminNegocioView.jsx: Panel del socio/host. Gestión de ofertas, tokens, perfil y métricas del negocio.
src/views/SuperAdminView.jsx: Panel del administrador de la plataforma. Modera ofertas, gestiona socios y visualiza estadísticas globales.

Componentes (src/components/)
src/components/Navbar.jsx: Barra de navegación global. Muestra logo, menú de destinos, acceso a cuponera y sesión del usuario.
src/components/Footer.jsx: Pie de página estático con links y contacto.
src/components/AccommodationCard.jsx: Card reutilizable de alojamiento. Muestra foto, nombre, precio en créditos y botón de favorito.
src/components/OfertaCard.jsx: Card de oferta con tipo (Flash/Normal), precio, ubicación y countdown si aplica.
src/components/MapView.jsx: Mapa interactivo Leaflet con marcadores de alojamientos y galería sincronizada al seleccionar un pin.
src/components/CuponeraDrawer.jsx: Drawer lateral/bottom que muestra los cupones activos del usuario (wallet de cupones).
src/components/ChatBot.jsx: Asistente flotante con respuestas de FAQ predefinidas y sugerencias rápidas.
src/components/DateRangePicker.jsx: Calendario de rango de fechas compartido entre HomeView (búsqueda) y DetailView (reserva).
src/components/HeartButton.jsx: Botón de corazón para marcar favoritos. Conectado al FavoritosProvider global.
src/components/InfoTooltip.jsx: Tooltip informativo reutilizable. Exporta InfoTooltip (precio estimado) y CreditTooltip (valor del crédito).
src/components/Token.jsx: Ícono SVG de la moneda/token dorado del sistema de créditos.
src/components/CuponIcon.jsx: Ícono SVG de cupón de descuento, usado en la cuponera y cards.
src/components/LoadingScreen.jsx: Pantalla de carga global animada (usa loading-casa.webm).
src/components/ComprarTokensModal.jsx: Modal para comprar créditos/tokens. Muestra métodos de pago (MP, transferencia, efectivo).
src/components/OfertaEditor.jsx: Formulario inline de edición completa de una oferta, usado dentro del panel admin del negocio.
src/components/OfertaEditorDrawer.jsx: Drawer que envuelve a OfertaEditor para edición rápida desde SuperAdminView.

Lógica / Contextos (src/lib/)
src/lib/supabase.js: Instancia global del cliente Supabase. Punto de entrada a toda la BD.
src/lib/auth.js: Login, logout, registro, sesión activa y perfil de usuario vía Supabase Auth.
src/lib/datos.js: Queries a Supabase: alojamientos, gastronomía, negocios y promos. Única fuente de datos real.
src/lib/cuponera.jsx: Context + Provider global de la cuponera. Maneja cupones activos, agregar/canjear y colores por categoría.
src/lib/favoritos.jsx: Context + Provider de favoritos. Persiste en Supabase los alojamientos guardados por el usuario.
src/lib/loading.jsx: Context global de loading. Expone showLoading, hideLoading y useLoadingFn para cualquier async call.
src/lib/ofertas.js: Definición de tipos de oferta (Flash/Normal), helpers de countdown (secondsUntil) y lógica de display.
src/lib/cobros.js: Modelo de cobros por tipo de negocio. Define cuándo y cuántos tokens se cobran según plan (FREE paga al publicar, PLUS/BLACK al canjear).
src/lib/gamificacion.js: Sistema de tokens ganados por acciones del usuario (registro, primera reserva, etc.).
src/lib/packs.js: Lógica del armador de packs. Lee configuración del sistema desde Supabase.
src/lib/seguir.js: Lógica de "seguir" a un negocio/socio. Persiste en Supabase y notifica al usuario de nuevas ofertas.
src/lib/socialProof.js: Genera números de prueba social (visitas, "viendo ahora") de forma determinística por ID para que sean estables entre renders.
src/lib/busqueda.js: Estado singleton del buscador principal (destino + fechas). Persiste en memoria durante la sesión SPA.
src/lib/localidades.js: Array de localidades disponibles (Villa Gesell, Mar de las Pampas, Las Gaviotas, etc.).

