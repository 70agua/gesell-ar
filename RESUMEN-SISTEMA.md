# Cuponear / gesell.ar — Resumen del sistema

Documento de contexto para revisar cambios en la dinámica general.
Estado del código al 31-07-2026 (rama `main`).

---

## 1. Los actores

| Actor | Qué es | Dónde vive |
|---|---|---|
| **Anónimo** | Navega, ve precios en $, puede comprar el Pase sin cuenta | público |
| **Turista** | Cuenta con wallet de **puntos** (cashback) | `perfiles` + `usuario_tokens` |
| **Socio** | Un negocio. Categorías: Alojamiento, Salidas, Aventura & Relax | `negocios` + `perfiles.negocio_id` |
| **Superadmin** | `perfiles.es_superadmin = true` | `SuperAdminView` |

Regla que se rompió una vez y conviene no volver a romper: **persona ≠ negocio**. Nunca usar datos de la persona como default de campos del negocio.

---

## 2. Las dos monedas (no se mezclan)

| | **Puntos** (turista) | **Créditos publicitarios** (socio) |
|---|---|---|
| Tabla | `usuario_tokens` / `token_movimientos` | `socio_tokens` / `token_compras` |
| Cómo se ganan | registro (500), compra del pase (500), upgrade (300), canje (100), cashback 5% de cada compra | se compran ($2.000 + IVA c/u) o vienen con el plan PRO |
| Para qué sirven | parte de pago de la próxima compra (1 punto = $1) | impulsar ofertas, armar cuponeras regalo |
| Se venden al turista | **no** | — |

Ojo: el código todavía llama "tokens" a las dos cosas en algunos nombres de tabla y de función. Es histórico, no significa que sean lo mismo.

---

## 3. Planes de socio — hay DOS modelos conviviendo

### Modelo vigente: PRO en tres tramos (`db/20260728_planes_pro.sql`)

Un solo plan, tres compromisos. Se paga por adelantado.

| Código | Precio/mes | Meses | Total | Créditos/mes | Bono alta |
|---|---|---|---|---|---|
| `pro_1` | $45.000 | 1 | $45.000 | 15 | 0 |
| `pro_6` | $37.500 | 6 | $225.000 | 15 | 20 |
| `pro_12` ★ | $30.000 | 12 | $360.000 | 15 | 60 |

Entrada: `CheckoutHoteleroView` → `altaSocio()` → `crearSuscripcionPro()`.

### Modelo legacy: Gratis / Plus

Sigue vivo en `SociosView`, `LoginView` (onboarding comercial) y `PlanPicker`. Lee las filas `gratis`/`plus` de `planes`, que quedaron con `activo = false` para no romper las FK de `suscripciones_socio`.

### Lo que gatean los componentes

`negocios.plan` es `'free' | 'plus'` y **no distingue tramos**: cualquier plan pagado deja `plan = 'plus'`. La pregunta que se hace el código es "¿paga o no?". El tramo concreto vive en `suscripciones_socio`.

Diferencias reales entre free y pagado hoy:
- **Alias de 6 dígitos** (`socio_alias`) — se genera al pagar, es lo que el huésped tipea para activar un regalo.
- **Cuponeras regalo** — solo Plus (`TabCuponeras` está gateada por `negocio.plan === 'plus'`).
- **Pases-regalo** — Free tope 10/mes, Plus ilimitado (validado en la RPC `activar_regalo_pase`).
- **Packs de upgrade mayoristas** — solo Plus.
- **Fotos de galería** — 4 vs 20.
- **Créditos publicitarios** — el Free los compra, el PRO recibe 15/mes.
- `debeUsarTokens(tipo, plan)`: alojamiento Free paga créditos al publicar. Salidas y Aventura & Relax **nunca** pagan.

⚠️ La reposición mensual de los 15 créditos **no está mecanizada** (no hay job). Solo se acredita el primer mes al dar de alta.

---

## 4. Precio de un cupón — fuente única

`cobros.js → calcularPrecioCupon(ahorroDeclarado)`. Comisión escalonada sobre el ahorro que declara el socio, IVA incluido, techo $14.520:

| Ahorro declarado | Comisión |
|---|---|
| ≤ $5.000 | 25% |
| ≤ $15.000 | 20% |
| ≤ $40.000 | 15% |
| ≤ $100.000 | 10% |
| > $100.000 | 7% |

Cuponear cobra esa comisión al turista. El socio no paga por publicar (salvo alojamiento Free).

---

## 5. El Pase (Cuponera Gesell)

Compra única, multi-destino por diseño (`destino_slug`). `lib/pases.js`.

**Dos capas, derivadas del ahorro, sin columna de tramo:**
- **Incluida** (ahorro ≤ $15.000): entra siempre, uso libre, 1 por comercio.
- **Premium** (ahorro > $15.000): el turista elige **una por día de pase**. La que no eligió la puede comprar suelta **a mitad de precio**.

**Aparte va el descuento de estadía** (alojamiento): 1 uso por pase, y se puede usar con el pase **todavía sin activar** — el turista reserva con descuento antes de viajar sin quemar los días. Los pases-regalo de hotelero vienen sin estadía.

**Ciclo de vida:**
```
compra (anónimo o logueado) → pase_compras
   ↓ registro/login con el mismo mail
vincularComprasPase() → usuario_pases estado 'pendiente'
   ↓ 1 tap del turista (ventana de 12 meses)
activarPase() → 'activo', vence_el = hoy + N días
   ↓
canjes (1 por comercio) → pase_canjes
```
Si se pasa la ventana de 12 meses: pasa a `vencido` y **se devuelve el precio en puntos, automáticamente**.

**Pase-regalo del hotelero:** el huésped valida el alias de 6 dígitos → `validar_alias_regalo` (RPC) → `activar_regalo_pase` (RPC, valida cupo atómicamente). Regalo sin upgrade **no da puntos**. El hotel Plus puede comprar packs de upgrades (mín. 10, $6.000 c/u) y asignarlos a sus regalos.

---

## 6. Los flujos, uno por uno

### 6.1 Turista compra cupones sueltos
`OfertaDetailView / DetailView → addCupon() → CuponeraDrawer → CheckoutView`

🔴 **`CheckoutView` no persiste nada.** Simula 1200 ms, limpia el carrito y muestra la pantalla de éxito. No escribe `ventas`, no crea cupones del usuario, no acredita el cashback que promete en pantalla. Las tablas `ventas` / `venta_items` solo se **leen** en el panel del superadmin — nadie las escribe.

### 6.2 Turista compra el Pase
`HomeView / CtaPase → CheckoutPaseView`. Sí persiste (`pase_compras`), pago mock. Puede comprar sin cuenta; la vinculación es idempotente por mail.

### 6.3 Alta de socio
`CheckoutHoteleroView → altaSocio()`: crea usuario + negocio + suscripción en una llamada. El negocio nace **`aprobado: false, activo: false`** → no se ve en ningún listado hasta que el superadmin lo aprueba.

### 6.4 Socio publica una oferta
`AdminNegocioView → TabOfertas`. La oferta nace **`aprobada: false`** → no se ve hasta que el superadmin la aprueba (individual o en lote desde el Marketplace).

### 6.5 Socio compra créditos
`ComprarTokensModal → registrarCompra()`. Tarjeta/MP se confirman al instante (mock). Transferencia y efectivo quedan `estado: 'pendiente'`.

🔴 **No hay ninguna pantalla que confirme esas compras pendientes.** `confirmarCompra()` existe pero solo se llama desde el propio `registrarCompra` para tarjeta/MP. Una compra por transferencia queda pendiente para siempre.

### 6.6 Socio impulsa una oferta
`impulso.js`. Mueve créditos del saldo al presupuesto de la oferta. Se consume por acceso (0,02) y por venta (0,5) vía RPC `consumir_impulso`. Las impulsadas rankean primero. Automático de punta a punta.

### 6.7 Socio Plus arma una cuponera regalo
`TabCuponeras`. Cada cupón agregado debita créditos según su ahorro; quitarlo los devuelve. Automático — con **una traba**: si el plan se pagó por transferencia, `puede_compartir_cuponeras` queda en `false` y la cuponera no se puede activar hasta que el superadmin apruebe el comprobante.

### 6.8 Canje en el mostrador
🔴 **No existe.** No hay QR, no hay botón de "marcar como canjeado" en el panel del socio. Consecuencias:
- `onCanjeAlojamiento()` / `generarOrdenCanje()` nunca se llaman → `ordenes_cobro` nunca se puebla → el cobro por canje al alojamiento Plus no ocurre.
- `COSTO_RESULTADO` del impulso (1 crédito por canje real) es solo un número de referencia para el simulador.
- Los canjes del **Pase** sí se registran (`pase_canjes`), pero solo desde `PaseDebugView` — no hay UI de producción.

---

## 7. Automático vs. superadmin

### Automático (sin intervención)

- Alta de socio: usuario + negocio + suscripción + alias + créditos de bienvenida.
- Compra de créditos con tarjeta/MP → acredita al instante.
- Impulso: descuento por evento vía RPC atómica.
- Cuponeras regalo: débito y reintegro de créditos.
- Pase: vinculación de compras por mail, activación, elecciones premium (RPC con validación de cupo), canjes, puntos, **devolución en puntos** si vence la ventana de 12 meses.
- Pases-regalo: validación de alias y cupo mensual, atómica en la base.
- Toggle activo/inactivo del negocio (autogestión del socio), y las ofertas de un negocio inactivo desaparecen de los listados.
- Puntos del turista: registro, cashback, acciones.

### Requiere superadmin — y **traba el flujo**

| # | Traba | Dónde | Qué bloquea |
|---|---|---|---|
| 1 | **Aprobar el negocio** | `SuperAdminView → Socios` | El socio paga, se da de alta y **no existe** para nadie hasta que alguien lo aprueba. Es la traba más dura: hay dinero cobrado y cero servicio prestado. |
| 2 | **Aprobar cada oferta** | `SuperAdminView → Marketplace` | Toda oferta nueva queda invisible. Hay aprobación en lote, pero es una por una en el tiempo. |
| 3 | **Aprobar comprobante de transferencia** | `SuperAdminView → Socios` | El socio Plus que pagó por transferencia no puede activar cuponeras regalo. |
| 4 | **Confirmar compra de créditos por transferencia/efectivo** | *no existe la pantalla* | El socio pagó y nunca recibe los créditos. Es una traba sin salida. |
| 5 | **Apagar ofertas vencidas** | efecto secundario de abrir el panel | Las ofertas con `fecha_vencimiento` pasada se desactivan **solo cuando el superadmin carga `SuperAdminView`**. Si no entra en una semana, quedan vivas una semana. |

### Otras cosas que solo hace el superadmin (no traban, pero centralizan)

- Editar copy y precios de los planes.
- Editar cualquier oferta o negocio "como si fuera el socio".
- Portadas / publicidades de la home, contenidos dinámicos, imágenes.
- Marcar consultas como leídas.
- Bloquear turistas, borrar cuentas y negocios.

### Idea registrada pero no implementada

**Moderación solo de la primera oferta:** validar humanamente la primera oferta de cada socio nuevo y después confiar en la cuenta. Ataca directamente las trabas #1 y #2.

---

## 8. Deuda técnica que condiciona cualquier cambio

1. **Sin pasarela de pago real.** Todo es mock: cupones, pase, plan PRO, créditos. Las referencias de MercadoPago se guardan como texto libre, no hay webhook.
2. **`CheckoutView` no persiste** — el flujo principal de monetización B2C no deja rastro en la base.
3. **Sin canje físico** — no se cierra el círculo entre venta y uso.
4. **Sin jobs recurrentes** — ni renovación de suscripciones, ni reposición mensual de créditos, ni expiración de ofertas o pases. Todo lo "recurrente" del modelo de negocio depende hoy de que alguien abra una pantalla.
5. **Dos modelos de plan conviviendo** — PRO en el checkout nuevo, Gratis/Plus en las pantallas viejas, y `negocios.plan` aplanado a `free|plus`.
6. **`ordenes_cobro`, `ventas`, `venta_items`** existen y se leen, pero nadie las escribe.
7. `TabInbox` (consultas del socio) es **data mock**; las consultas reales solo se ven en el panel del superadmin.
8. `OfertaEditor.jsx` es código muerto (el vivo es `OfertaEditorDrawer` para superadmin y `TabOfertas` para el socio).

---

## 9. Mapa rápido de archivos

| Tema | Archivo |
|---|---|
| Planes y suscripciones | `src/lib/planes.js` |
| Precios, créditos, comisión | `src/lib/cobros.js` |
| Puntos del turista | `src/lib/gamificacion.js` |
| Pase | `src/lib/pases.js` |
| Alta de socio | `src/lib/altaSocio.js` |
| Cuponeras regalo | `src/lib/cuponerasRegalo.js` |
| Impulso publicitario | `src/lib/impulso.js` |
| Datos y normalizadores | `src/lib/datos.js` |
| Panel del socio (3.900 líneas) | `src/views/AdminNegocioView.jsx` |
| Panel del superadmin (3.200 líneas) | `src/views/SuperAdminView.jsx` |
| Checkouts | `CheckoutView` (cupones), `CheckoutPaseView` (pase), `CheckoutHoteleroView` (plan PRO) |
| Migraciones | `db/*.sql` |
