# Cuponear — Modelo comercial

Documento de producto · **2026-08-17**

**Manda sobre `1-reset-conceptual.md` y `4-socio-distribuidor.md` en todo lo que sea monetización.** Lo que este doc no contradice, sigue vigente.

**No está implementado.** El código todavía corre el modelo anterior (plan PRO por tramos con créditos mensuales, activación manual del pase). §7 lista el delta.

---

## 1. El principio

Hay dos lados que se monetizan distinto:

- **El turista compra acceso a descuentos.**
- **El socio compra visibilidad, o compra pases para regalar.**

**Nadie paga por publicar ni por canjear.** Se mantiene del reset del 2026-07-31 y no se negocia: nada que haga que una ficha sirva para el turista puede estar detrás de un pago.

---

## 2. Los nombres

| Nombre | Qué es |
|---|---|
| **Cupon PASS** | Acceso por días que compra el turista para sí mismo |
| **Gift PASS** | El mismo pase, comprado para regalarle a un tercero |
| **Gift PASS PRO** | La suscripción del socio distribuidor, que le da cupo de Gift PASS para repartir |

**Los tres nombres van en todos lados**: comunicación, UI y código. No es sólo marca.

**"Pase" queda como sinónimo informal, de uso escaso.** Sirve para hablar en castellano de cualquiera de los tres cuando el contexto ya es claro, pero no es el nombre del producto y no se usa como etiqueta en pantalla. La razón de restringirlo es la misma que jubiló "cuponera": una palabra que cubre tres productos obliga a desambiguar en cada conversación.

⚠️ Falta fijar la grafía exacta para la UI: hoy conviven "Cupon PASS" (como se escribió la decisión) y "Gesell PaSS" (como está cargado en la tabla `pases`). Hay que elegir una y que sea la de todos lados.

---

## 3. Turista

Tres formas de comprar, sin jerarquía entre ellas.

### 3.1 Cupón suelto

Sin cambios. Precio por comisión sobre el ahorro (`calcularPrecioCupon`), Carrito como mecanismo para llevarse varios.

### 3.2 Cupon PASS — packs cerrados

**Dos packs estándar, en bloque cerrado.** No es un configurador de días: el turista elige un pack.

| Pack | Precio final | Sin IVA | Por día |
|---|---|---|---|
| 3 días | $20.000 | $16.528,93 | $6.666,67 |
| 7 días | $35.000 | $28.925,62 | $5.000 |

**Del pack de 7 en adelante empieza el valor promocional**: cada día sale más barato que en el de 3. Es lo que empuja al pack largo, y ya está reflejado en los precios cargados.

### 3.3 Agregar días

El turista puede **sumar días a un pase ya comprado**, desde su panel.

**El día extra se cobra al proporcional del pack que compró:**

- Compró el pack de **3** → cada día agregado vale el proporcional de ese pack (**$6.666,67**).
- Compró el pack de **7 o más** → cada día agregado vale el proporcional de ese pack (**$5.000**).

O sea: agregar días **no** te da el precio del pack largo. El que quiere 7 días conviene que compre el pack de 7; el que compró 3 y estira, paga precio de pack de 3 por cada día. Es deliberado — si agregar días diera el precio bueno, nadie compraría el pack de 7.

⚠️ **Consecuencia a mirar en la UI:** 3 días + 4 agregados = $46.666 contra $35.000 del pack de 7. La diferencia es grande y el turista la va a sentir como castigo si no se la avisamos. Falta decidir si en algún punto la pantalla ofrece **pasar al pack de 7** en vez de seguir sumando días sueltos.

⚠️ **Falta la regla de redondeo.** $20.000 / 3 no da un número redondo. Hay que definir si el día extra del pack de 3 se cobra $6.666,67, $6.700 o $7.000.

### 3.4 Premium

- **Un premium por día contratado.** Pack de 3 → 3 premium. Pack de 7 → 7 premium.
- **Desde los 10 días, premium ilimitados.** Deja de haber tope: entra todo el catálogo.

Los días agregados cuentan: si sumando días llega a 10, desbloquea el ilimitado.

*Esto ya está implementado* (`eleccionesPremium`, `DIAS_PREMIUM_ILIMITADO = 10` en `src/lib/pases.js`) y la lógica del arbitraje ya estaba razonada ahí: atar los premium a los días es lo que evita que dos pases cortos rindan más que uno largo.

### 3.5 Gift PASS — comprar para otro

Es el mismo Cupon PASS, pero **no se aplica a la cuenta del que compra**: se entrega a un tercero por **mail, link o teléfono**.

**El que lo recibe tiene que crearse una cuenta, sí o sí.** No hay uso anónimo.

**Vigencia para reclamarlo: 90 días.** Ese es el plazo que tiene el regalo para que alguien acuse recibo — registrándose, o recibiéndolo con una cuenta ya creada. Si nadie lo reclama, no pasa nada más: vence.

⚠️ Cobrar un regalo que puede vencer sin usarse es una decisión con costado legal (defensa del consumidor / vencimiento de vouchers). Vale la pena confirmarlo antes de publicarlo, no es un bloqueo técnico.

### 3.6 El reloj: el pase arranca con el primer canje

**La vigencia no arranca al comprar ni en una fecha elegida: arranca con el primer canje.**

El razonamiento: pedirle al turista que elija fecha de viaje y atarlo a eso es un problema — los viajes se mueven. El primer canje es la señal real de que empezó a usarlo. Y a Cuponear no le cuesta nada esperar, porque **cobra en la compra**.

Esto vale igual para el Cupon PASS propio y para el Gift PASS recibido.

**La excepción son las ofertas con reserva previa.** Pedir una fecha **no** dispara el reloj: el turista puede gestionar con anticipación sin quemar días. Pero **el canje en la fecha pactada sí lo dispara** — si esa es la primera actividad del viaje, ese canje es el que da "play".

Dicho corto: **reservar no arranca el reloj; canjear sí, siempre.**

⚠️ **Conflicto a resolver: el descuento de estadía (alojamiento).** Hoy está diseñado exactamente al revés — se puede canjear con el pase sin activar, justamente para que el turista reserve alojamiento con descuento meses antes sin quemar días (`esOfertaEstadia` en `pases.js`). Con la regla nueva, ese canje daría "play" y le consumiría el pase antes de viajar. Hay que decidir si el alojamiento es una segunda excepción o si cambia el diseño.

⚠️ **Falta definir:** un pase reclamado (cuenta creada) que nunca se canjea, ¿dura para siempre? Hoy el código tiene una ventana de 12 meses para activar (`VENTANA_ACTIVACION_MESES`). Los 90 días son para *reclamar*, no para *usar*.

---

## 4. Socio estándar

El comercio que da descuentos: gastronomía, salidas, aventura y relax, servicios.

- **Se da de alta y publica gratis.** No hay plan que contratar, no hay suscripción, no hay cupo de ofertas.
- **Lo único que puede pagar es visibilidad**: destacar su empresa o impulsar una oferta puntual para aparecer antes que el resto. Es opcional y es la única salida de dinero.

Sin cambios de fondo respecto del reset: al socio estándar **nunca** se le ofrece el producto del distribuidor.

---

## 5. Socio distribuidor — Gift PASS PRO

El que llega al turista **antes de que viaje** y le entrega el pase. No publica ofertas ni da descuentos: distribuye.

**Rubros: alojamiento, agencia de turismo, inmobiliaria.**

**Producto: Gift PASS PRO, por suscripción.** Abono **mensual, semestral o anual**, con un **cupo de 150 Cupon PASS por mes** para regalar.

Los tres plazos son **formas de pago, no niveles de servicio**: cambia el compromiso, no lo que recibe el socio. Los tres dan el mismo cupo.

Esto reemplaza al esquema anterior, donde el socio pagaba un plan PRO que le daba **créditos publicitarios** y los pases regalo venían aparte, topeados por un parámetro global. Ahora **el cupo de pases es el producto**.

### Lo que este esquema resuelve

El tope de 150 dejó de ser un límite de daño y pasó a ser el contenido del plan. Antes existía como parámetro global justamente porque un plan con regalos ilimitados socavaba la venta de tandas; ahora que el cupo **es** lo que se compra, esa tensión desaparece.

### Revendedor — postergado

El cuarto rubro que se había mencionado (**revendedor**) **queda afuera por ahora**, por decisión explícita: es complejo y no es el momento. No hablar de revendedores en producto ni en comunicación.

El motivo de fondo sigue en pie: "revendedor" implica cobrarle al turista y liquidarle una comisión, y no hay pasarela de pago real ni mecanismo de payout. Es el "modo venta" de `4-socio-distribuidor.md` §2, que ya estaba postergado por lo mismo.

---

## 6. Lo que falta definir

Ninguno de estos bloquea escribir el modelo, pero sí bloquean implementarlo:

1. **Precio del abono Gift PASS PRO** en sus tres plazos. Los valores viejos del PRO ($45.000 / $37.500 / $30.000 por mes) eran de un plan que daba créditos publicitarios, no cupo de pases — no se pueden reusar sin decidirlo.
2. **¿El Gift PASS PRO incluye además visibilidad / créditos publicitarios?** O el distribuidor que quiera destacarse los compra suelto, como el socio estándar.
3. **¿El cupo de 150 se acumula o se pierde?** Un mes flojo con 40 regalados, ¿deja 260 para el siguiente o vuelve a 150?
4. **Redondeo del día extra** (§3.3).
5. **El descuento de estadía y el "play"** (§3.6).
6. **Duración de un pase reclamado y nunca canjeado** (§3.6).
7. **Grafía de los nombres** (§2).

---

## 7. Delta contra lo implementado

Lo que ya está y no hay que tocar:

- Packs de 3 y 7 días con sus precios y su valor promocional (tabla `pases`).
- Un premium por día y el ilimitado desde 10 días (`src/lib/pases.js`).
- El tope de 150 existe como valor (`configuracion.pases_regalo_tope_mensual`).
- Publicación gratis para el socio estándar, e impulso como único débito de créditos.

Lo que cambia:

| Qué | Hoy | Nuevo |
|---|---|---|
| **Arranque del pase** | Activación manual (`activar_pase`) o programada (`programar_activacion_pase`), con estados pendiente/activo | Automático con el primer canje. Los dos flujos de activación y la pantalla que los ofrece quedan sin sentido |
| **Producto del socio distribuidor** | Plan PRO por tramos → créditos publicitarios mensuales + pases regalo topeados aparte | Suscripción → cupo de 150 Gift PASS. Los créditos dejan de ser el contenido del plan |
| **El tope de 150** | Parámetro global en `configuracion`, igual para todos, pensado como límite | Cupo del plan: es lo que el socio compra |
| **Agregar días** | No existe | Alta nueva: cobro proporcional al pack de origen, y hay que **recalcular** `usuario_pases.premium_ilimitado`, que hoy se congela en la compra |
| **Gift PASS del turista** | No existe. Regalar pases es sólo del socio | Alta nueva: compra para un tercero, entrega por mail/link/teléfono, 90 días para reclamar, alta de cuenta obligatoria |
| **Upgrade packs** ($6.000, +1 premium) | Vigentes | A revisar: con un premium por día y el ilimitado a los 10, puede que ya no tengan lugar |
| **Revendedor** | En el CHECK de `negocios.tipo` desde `db/20260802_tipos_empresa_socio.sql` | Queda en la base, pero fuera del discurso comercial |

---

## 8. Dependencias

Sin cambios respecto de `4-socio-distribuidor.md` §9: el premium con reserva necesita la Fase 5b, y sigue sin haber **pasarela de pago real** — que acá pesa más que antes, porque el Gift PASS es una compra para un tercero y el Gift PASS PRO es una suscripción recurrente. Hoy no hay ningún job de cobro recurrente funcionando.
