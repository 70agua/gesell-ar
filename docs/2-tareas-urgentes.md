# Cuponear — Tareas urgentes

Ejecución. Leer antes `1-reset-conceptual.md`, que define el porqué de cada cosa.
Las fases son secuenciales: cada una es entregable y testeable por separado.


> **Changelog** · 2026-07-31
> Fase 5b: `num_huespedes` queda obsoleto, lo reemplaza `personas` en `solicitudes_fecha`.

---

## Fase 0 — Desbloquear al socio que ya pagó

Hoy hay socios con dinero cobrado y cero servicio prestado. Va primero, antes que cualquier cosa del turista.

- [ ] **Sacar la aprobación del negocio.** El alta deja el negocio publicado y activo. `aprobado` deja de gatear la visibilidad. Revisar `altaSocio.js` y todos los listados que filtran por ese campo.
- [ ] **Conservar la aprobación de ofertas.** Sin cambios en `SuperAdminView → Marketplace`.
- [ ] **Pantalla de confirmación de créditos publicitarios por transferencia/efectivo.** `confirmarCompra()` existe pero no se llama desde ningún lado: el socio paga y nunca los recibe. Callejón sin salida con plata en el medio.
- [ ] **Job de expiración de ofertas vencidas.** Hoy solo se apagan cuando el superadmin abre su panel.
- [ ] **Job de reposición mensual de los 15 créditos publicitarios del PRO.** Está prometido en el plan y no ocurre.

---

## Fase 1 — Borrados

Antes de construir, sacar lo que no va. Si se construye primero el canje, el cobro por canje se cablea por inercia.

- [ ] **Eliminar la cuponera regalo:** `TabCuponeras`, `cuponerasRegalo.js`, gate `puede_compartir_cuponeras`, y la traba de aprobación de comprobante asociada. Ver §3.1.
- [ ] **Eliminar el cobro por canje al alojamiento:** `onCanjeAlojamiento()`, `generarOrdenCanje()`, tabla `ordenes_cobro`. Ver §3.2.
- [ ] **Eliminar `OfertaEditor.jsx`** (código muerto).
- [ ] Revisar qué queda diferenciando Free de PRO después de sacar la cuponera regalo, y reportarlo antes de avanzar.

---

## Fase 1b — Cerrar el modelo de plan

Va **antes** del rename. Es decisión de modelo, no de código.

- [ ] **Eliminar `debeUsarTokens`.** Un alojamiento sin plan hoy paga créditos publicitarios para publicar. Contradice el principio de que ningún socio paga por publicar, y castiga justamente al canal de distribución del Pase. El control de calidad ya lo da la aprobación de ofertas, que se conserva.
- [ ] Verificar que no quede ningún otro cobro al socio por publicar o por canjear.

**Principio que queda fijado:** el plan compra **visibilidad**, no funcionalidad básica. Nada que haga que una ficha sirva puede estar detrás del plan. PRO compra ranking, créditos publicitarios, upgrade packs, fotos y estadísticas.

---

## Fase 2 — Terminología

Rename mecánico, sin cambios de comportamiento. Conviene hacerlo solo, para que no se mezcle con cambios funcionales.

- [ ] `CuponeraDrawer` / `cuponera.jsx` / textos de UI → **Carrito**
- [ ] "Cuponera Gesell" → **Pase** en toda referencia de producto
- [ ] Verificar que "cuponera" no quede usada en ningún lado: se retira del vocabulario (ver `3-cupopacks.md`)
- [ ] Nombres de tablas/funciones que dicen "tokens" para dos monedas distintas: documentar cuál es cuál. **No renombrar tablas todavía** — es riesgoso y no urgente.

---

## Fase 2b — Liberar el precio en fichas sin plan

Aplicar **después** del rename.

- [ ] **El precio pasa a ser visible en todas las fichas**, tengan plan o no. Hoy una ficha sin plan no muestra precio: con 78 negocios todos en free, el sitio público es un catálogo mudo. Eso le rompe el producto al turista para castigar al socio, y le baja el valor al Pase.
- [ ] **No hay botón de contacto ni teléfono visible.** El contacto no es un dato, es un flujo: ver Fase 5b. No se gatea por plan.

---

## Fase 3 — Piso de precio

- [ ] `cobros.js → calcularPrecioCupon`: agregar `PRECIO_MIN = 2500` y `AHORRO_MIN = 5000`. Ver §4.1.
- [ ] Sacar el tramo del 25% (inalcanzable).
- [ ] Validación en el panel del socio: no publicar con ahorro declarado menor a $5.000.
- [ ] Mostrar al socio el precio resultante del cupón al cargar el ahorro.
- [ ] Cupones con ahorro < $10.000: mostrar ganancia neta en vez de ahorro bruto, y excluirlos de espacios destacados.

---

## Fase 4 — Persistir la compra del turista

`CheckoutView` simula todo. Es el flujo principal de monetización B2C y no deja rastro.

- [ ] Escribir `ventas` / `venta_items`
- [ ] Crear los cupones del usuario (tabla nueva: qué compró, estado, vigencia)
- [ ] Acreditar el cashback que la pantalla promete
- [ ] Pantalla "Mis cupones"

Prerequisito del canje: no se puede validar el canje de algo que nunca se guardó.

---

## Fase 5 — Canje

Un solo mecanismo para cupón suelto y para Pase.

- [ ] Código / QR del lado del turista
- [ ] Pantalla de validación en el panel del socio
- [ ] Botón "reportar canje erróneo" → cola del superadmin
- [ ] Anulación desde el superadmin: libera el slot premium si corresponde. Ver §4.4.

---

## Fase 5b — Solicitudes de fecha

Prerequisito de todo el premium con reserva (alojamiento, spa, excursiones). Va antes de los Cupopacks.

**No se gatea por plan.** Es un atributo de la oferta: al crearla, el socio marca **"Requiere confirmación de fecha: SÍ/NO"**.

> ⚠️ Corrección respecto de una indicación anterior: **no reutilizar `consultas`**. Esto es una máquina de estados con timeouts y bloqueo de slots; necesita tabla propia. `consultas` queda para consultas generales.

### Modelo de datos

```sql
solicitudes_fecha
  id                uuid pk
  usuario_pase_id   uuid fk -> usuario_pases
  oferta_id         uuid fk -> ofertas
  socio_id          uuid fk -> negocios
  fecha_pedida      date not null
  personas          integer not null
  estado            text not null      -- ver máquina de estados
  fecha_propuesta   date null          -- solo si el socio contrapropone
  origen_id         uuid null fk -> solicitudes_fecha   -- si nació de una contrapropuesta
  enviada_at        timestamptz
  expira_at         timestamptz not null
  resuelta_at       timestamptz null
```

En `ofertas`: `requiere_fecha boolean default false`.

> `num_huespedes` en `cuponera_items` queda obsoleto: lo reemplaza `personas` en `solicitudes_fecha`.

### Máquina de estados

```
ENVIADA          → slot EN SUSPENSO
  ├─ ACEPTADA         → slot CONSUMIDO (definitivo, no vuelve nunca)
  ├─ RECHAZADA        → slot LIBERADO
  ├─ CONTRAPROPUESTA  → slot LIBERADO de inmediato
  ├─ CANCELADA        → slot LIBERADO   (la cancela el turista)
  └─ VENCIDA          → slot LIBERADO   (timeout)
```

**Contrapropuesta:** libera el slot en el acto. La solicitud original murió. Si el turista después acepta la fecha propuesta, eso **crea una solicitud nueva** (`origen_id` apunta a la vieja) que vuelve a suspender un slot.

⚠️ Caso borde a manejar: entre la contrapropuesta y la aceptación del turista, el slot pudo ocuparse con otra solicitud. Si al aceptar no hay slot libre, mostrar *"No te quedan beneficios premium disponibles"* y no crear la solicitud. No reservar el slot de forma implícita.

### Timeout

```
pase activado    → expira_at = min(enviada_at + 72 h, vence_el del pase)
pase sin activar → expira_at = enviada_at + 72 h
```

Manda el que llegue primero. Avisar al socio antes de que venza. Job recurrente que barre `ENVIADA` con `expira_at` pasado y las pasa a `VENCIDA`.

### Reglas de envío

- **No requiere el pase activado.** Se puede pedir fecha desde que se compró: el turista planifica antes de viajar y no quema días esperando respuestas.
- `fecha_pedida` debe ser futura. Si el pase está activado, además debe caer dentro de su vigencia.
- **Al aceptarse una solicitud con el pase sin activar**, ofrecerle al turista activar desde esa fecha (ver Fase 6, activación programada). Sin esto queda con una fecha confirmada y un pase que puede no cubrir ese día. No activar automáticamente: proponer.
- **Tope:** no se pueden tener más solicitudes en estado `ENVIADA` que slots premium disponibles. Validación **atómica por RPC**, igual que las elecciones premium. Es donde se rompen estas cosas si se valida en el cliente.
- El cupón de estadía queda fuera de este flujo: se usa con el pase sin activar, como hoy.

### Interfaz

**Turista:** elige fecha y cantidad de personas. **Sin texto libre.** Ve el estado: *"1 beneficio premium esperando respuesta"*. Puede cancelar una solicitud `ENVIADA`.

**Socio:** bandeja en el panel con tres botones — **Sí / No / Proponer otra fecha**. Sin texto libre.

`TabInbox` (hoy data mock) se construye acá, no en la Fase 7, y pasa a ser la **bandeja única del socio** con dos tipos filtrables: **consultas** (las que hoy sólo ve el superadmin) y **solicitudes de fecha**. Misma lógica que `TabPendientes` en el superadmin: un solo lugar donde mirar lo que espera respuesta, en vez de un tab por cada cosa.

**Notificaciones** en cada cambio de estado, a las dos partes. Al socio, además, aviso previo al vencimiento.

### Cancelación — política única

Aceptada la solicitud, **el premium se consumió**. Si después se cancela la reserva, el slot no vuelve.

No hay políticas por socio: Cuponear no cobra el servicio, así que no hay nada que devolver. Lo que ocurra entre turista y socio después de la confirmación es la política del socio.

Esto elimina el incentivo a cancelar de trampa (arreglar por afuera y recuperar el slot) sin castigar a quien cancela por una razón real.

### Restricciones de copy — no negociables

Cuponear **transmite una solicitud**, no reserva ni confirma nada. Intermediar en reservas de servicios turísticos es actividad reservada a las agencias (Ley 18.829).

❌ "reservá" · "tu reserva está confirmada" · "reservá con nosotros" · "disponibilidad" · "consultar disponibilidad"
✅ "enviar solicitud" · "confirmar estas fechas con el comercio" · "el comercio te va a responder"

Cuponear no guarda disponibilidad, no confirma y no cobra el servicio. Confirma el socio, y la relación sigue entre él y el turista.

⚠️ **Antes de integrar RUMRAK:** sincronizar calendarios y disponibilidad cambia el encuadre — dejarías de ser un canal de solicitudes para parecer un motor de reservas. Revisar con abogado antes de esa integración, no después.

---

## Fase 6 — Mi Pase

El backend está entero; falta todo el medio del recorrido.

- [ ] Activación desde producción (hoy solo en `PaseDebugView`)
- [ ] Programar fecha de activación — **está prometido en `CheckoutPaseView` y no existe en el modelo de datos**. Complementa la Fase 5b: cuando le aceptan una fecha con el pase sin activar, es lo que se le ofrece para que la vigencia cubra ese día.
- [ ] Billetera: días, ahorro acumulado, canjes, estadía
- [ ] Elección de premium: slots ocupados, reversibles hasta el canje (§4.3)
- [ ] Consumir `estadoEstadia`, `getOfertasEstadia`, `incluidaEnPase`, `usePaseStats` — hoy sin uso en producto
- [ ] Corregir `useMiPase.js:33`: hoy solo mira pases `activo`, con lo cual quien compró es invisible para toda la app

---

## Fase 7 — Bloque Pase en el panel del socio

Hoy el checkout hotelero promete un código que el panel no muestra. Promesa rota en producción.

- [ ] Alias de 6 dígitos visible
- [ ] Cupo mensual de regalos y consumo
- [ ] Upgrade packs: saldo, compra, asignación — con el nuevo significado de +1 premium (§4.2)
- [ ] Lista de huéspedes que activaron y ahorro generado
- [ ] Reemplazar `TabEstadisticas` (hoy 100% hardcodeado) — **empezar por el tracking, no por la pantalla**: `visitas` y `oferta_stats` están en 0 y nadie escribe en ellas. Instrumentar vistas de ficha, vistas de oferta, clicks a contacto y canjes. Recién con eso arriba, la pantalla. Si el volumen es bajo, mostrar lo que haya y avisar que falta historial — **nunca rellenar con mock**.

> `TabInbox` **NO se toca en esta fase**. Pasa a la Fase 5b, donde se convierte en la bandeja única del socio con dos tipos: consultas y solicitudes de fecha. Misma lógica que `TabPendientes` en el superadmin.

---

## Fase 8 — Cupopacks

Recién acá. Depende de que existan los slots premium y el canje.

- [ ] Modelo de plantilla: nombre editorial, destino, lista de premium
- [ ] Panel del superadmin para armarlas
- [ ] Oferta post-compra del Pase: "¿te armamos la selección?" → llena los slots de un tap
- [ ] Reversible: deshacer el Cupopack o cambiar cualquier elección
- [ ] Copy sujeto a las restricciones de `3-cupopacks.md`

---

## Fase 9 — Avisos por mail

Hoy no se envía ninguno propio (solo el de Supabase Auth).

- [ ] Oferta aprobada / rechazada
- [ ] Un huésped activó tu pase-regalo
- [ ] Vencimiento próximo del pase del turista

---

## Fuera de estas fases

- **Sistema de visibilidad proporcional a créditos publicitarios** — necesita documento propio (§7 del reset). No implementar por intuición.
- **Pasarela de pago real** — todo es mock. Condiciona todo lo anterior, pero no bloquea construirlo.
- **Unificación de los dos modelos de plan** (PRO por tramos vs. legacy Gratis/Plus).
