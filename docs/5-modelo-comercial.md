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

**"Gesell PASS" desaparece de todos lados.** Es el nombre viejo y no sobrevive en ninguna forma —ni "Gesell Pass", ni "Gesell PaSS", ni el logo. El producto se llama **Cupon PASS**, sin destino en el nombre.

No es sólo prolijidad: **el destino no puede estar en el nombre del producto.** El esquema es multi-destino a propósito (`destino_slug`, "gesell" vive sólo como valor de una fila) y un producto que se llama por su ciudad no se puede expandir sin renombrarse. Lo mismo que ya pasó con "cuponera", pero con geografía.

✅ **Ejecutado el 2026-08-17.** Fue lo único de este doc que se llevó a código:

- `pases.nombre_comercial` → "Cupon PaSS x 3 días" / "x 7 días" (2 filas).
- El prop `conGesell` de `PaSSMark` pasó a `conPrefijo` (12 archivos). El lockup **ya mostraba "CUPON PaSS"** desde el 2026-08-10 —el default de `prefijo` se había cambiado— así que el prop mentía justo en el lugar que decide qué palabra se lee.
- Borrados `public/gesell-pass.svg` y `gesell-pass-03.svg`, que no los referenciaba nadie.

Los docs viejos (`pase-gesell.html`, `4-ficha-socio-panel-ofertas.md`) lo conservan como registro histórico y no se tocan. `public/logo-pregesell.svg` quedó: está huérfano, pero es otro logo, no esta marca.

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

**El día extra vale $5.000, venga del pack que venga.** Es el valor día del pack alto — el más barato de los que hay.

No se cobra el proporcional del pack de origen. El que compró el de 3 estira al mismo precio por día que el que compró el de 7: **hasta ahí se ajusta, más barato no**.

**Lo que no se corrige es el pack ya comprado.** 3 días + 4 agregados = **$40.000** contra **$35.000** del pack de 7. Quedan $5.000 de diferencia y ahí se quedan: es el costo de haber comprado corto, y es lo que sigue empujando al pack de 7. No hay recálculo retroactivo ni upgrade del pack.

Esa brecha acotada es la decisión: castiga lo suficiente para que el pack largo se venda, y no tanto como para que agregar días se sienta una trampa.

⚠️ **Si más adelante hay un pack más largo y más barato por día**, hay que decidir si el día extra baja con él o queda clavado en $5.000. Hoy no se plantea porque el de 7 es el más alto.

### 3.4 Premium

- **Un premium por día contratado.** Pack de 3 → 3 premium. Pack de 7 → 7 premium.
- **Desde los 10 días, premium ilimitados.** Deja de haber tope: entra todo el catálogo.

Los días agregados cuentan: si sumando días llega a 10, desbloquea el ilimitado.

*Esto ya está implementado* (`eleccionesPremium`, `DIAS_PREMIUM_ILIMITADO = 10` en `src/lib/pases.js`) y la lógica del arbitraje ya estaba razonada ahí: atar los premium a los días es lo que evita que dos pases cortos rindan más que uno largo.

**Agregar días vuelve alcanzable el premium ilimitado, y está bien que así sea.** Hoy el umbral de `DIAS_PREMIUM_ILIMITADO` no se toca nunca porque no existe pack de 10 días. Con el día extra a $5.000, llegar a 10 sale **$50.000** desde el pack de 7 (o $55.000 desde el de 3) y abre todo el catálogo premium, sin tope. **Ese precio se sostiene** — decidido el 2026-08-17. Es, de hecho, la única vía para llegar al ilimitado.

### 3.5 Gift PASS — comprar para otro

Es el mismo Cupon PASS, pero **no se aplica a la cuenta del que compra**: se entrega a un tercero por **mail, link o teléfono**.

**El que lo recibe tiene que crearse una cuenta, sí o sí.** No hay uso anónimo.

**Vigencia para reclamarlo: 90 días.** Ese es el plazo que tiene el regalo para que alguien acuse recibo — registrándose, o recibiéndolo con una cuenta ya creada. Si nadie lo reclama, no pasa nada más: vence.

⚠️ Cobrar un regalo que puede vencer sin usarse es una decisión con costado legal (defensa del consumidor / vencimiento de vouchers). Vale la pena confirmarlo antes de publicarlo, no es un bloqueo técnico.

### 3.6 El reloj: cuándo arranca el pase

**No arranca al comprar ni en una fecha que el turista elija a mano.** Pedirle que declare su fecha de viaje y atarlo a eso es un problema: los viajes se mueven. Y a Cuponear no le cuesta nada esperar, porque **cobra en la compra**.

Vale igual para el Cupon PASS propio y para el Gift PASS recibido.

**Hay dos cosas que dan "play", y gana la que caiga primero:**

1. **Un canje efectivo.** El turista canjea algo: ahí empezó a usarlo.
2. **Una fecha confirmada por un socio.** Cuando un socio le confirma una fecha para una oferta con reserva previa, **esa fecha queda agendada como arranque** y el pase se activa solo cuando llega, haya canje ese día o no.

**Pedir la fecha no arranca nada.** El turista puede gestionar con toda la anticipación que quiera sin quemar días. Lo que agenda el arranque es la **confirmación del socio**.

**La fecha de arranque se puede adelantar, nunca atrasar.** Si después de tener una fecha confirmada consigue otra confirmación **anterior** —reservó una excursión para el 15 y después le confirman masajes para el 12— el 12 pasa a ser el nuevo arranque. Es correcto: si el 12 ya está usando el pase, el pase arrancó el 12.

Dicho corto: **el pase arranca en la primera fecha en que el turista lo va a usar, sea porque canjeó o porque un socio ya se lo confirmó.**

### 3.7 Por qué la reserva funciona así — y no de otra

**Cuponear no participa del pago de una reserva. Por ley, y bien lejos de eso** (Ley 18.829: transmitir una solicitud no es intermediar).

Lo único que pasa es que **el socio le confirma la fecha y se compromete a cobrarle con el descuento aplicado**. La plata va del turista al socio, directo, el día que se presenta. Cuponear no toma seña, no retiene, no liquida.

De ahí sale, sin excepciones especiales, todo lo de arriba: si no hay pago, la confirmación es sólo un compromiso de fecha, y por eso no puede arrancar el reloj el día que se pide — pero sí el día pactado, porque ese día el turista efectivamente está usando su pase.

**Esto disuelve el conflicto del descuento de estadía (alojamiento).** No hace falta que el alojamiento tenga reloj propio: es una oferta con reserva previa como cualquier otra, y sigue el mismo camino — confirma la fecha, se compromete al descuento, y el pase arranca el día del check-in. Hoy `esOfertaEstadia` en `pases.js` le da un reloj aparte ("usable con el pase sin activar") precisamente para resolver un problema que esta regla ya resuelve sola. **Ese caso especial se puede borrar.**

**Un pase reclamado y nunca usado dura 6 meses.** Contados desde que se reclama. Son dos relojes distintos y conviene no confundirlos:

| Reloj | Cuánto | Desde cuándo |
|---|---|---|
| Reclamar un Gift PASS | 90 días | la compra |
| Usar un pase ya reclamado | 6 meses | el reclamo |
| Los días del pase | 3, 7 o los que sumó | el "play" |

### 3.8 Cuando la fecha confirmada se cae

**Si se cae con anticipación, se avisa y el arranque agendado queda sin efecto.** El aviso entra por un **flag** o por **Cuponix**, y el "play" automático de esa fecha se anula — el pase vuelve a arrancar con lo que caiga primero de lo que quede (otra fecha confirmada, o un canje).

**Si se cae in situ, se evalúa el caso.** No hay regla automática: el día ya llegó y el pase ya arrancó, así que revertirlo es una decisión con criterio, no un cálculo.

Encaja con lo que ya existe: es el mismo patrón que `reportar_canje_erroneo` — el que sufre el problema **reporta**, y la resolución cae en la **bandeja única del superadmin** (`TabPendientes`). No hace falta un mecanismo nuevo, hace falta un tipo nuevo en esa cola. Y Cuponix ya sabe registrar consultas ahí (`negocio_id null`).

⚠️ **Falta:** que el aviso "con anticipación" tenga un plazo. Sin un número, cualquier aviso a último momento discute si era in situ o no.

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

**Producto: Gift PASS PRO, por suscripción.** Abono **mensual, semestral o anual**, con un **cupo de 50 Cupon PASS por mes** para regalar.

Los tres plazos son **formas de pago, no niveles de servicio**: cambia el compromiso, no lo que recibe el socio. Los tres dan el mismo cupo.

**El cupo no se acumula: se pierde.** Un mes con 20 regalados no deja 80 para el siguiente — vuelve a 50. Es un cupo mensual, no una bolsa.

### Por qué 50 y no 150

Calibrado contra el caso típico: un complejo de cabañas estándar, **8 unidades**, con **1 o 2 recambios por semana** en temporada alta. Eso da entre 32 y 64 regalos por mes.

**50 cae adentro de ese rango, a propósito.** Un complejo lleno en enero se queda corto y compra pases extra; el resto del año le sobra. Los 150 anteriores no los tocaba nadie nunca, y un cupo que nunca se toca no es un cupo: es un adorno que no vende nada.

### Precios

| Plazo | Por mes (sin IVA) | Bonificación | Bienvenida | Total adelantado |
|---|---|---|---|---|
| **PRO mensual** | $45.000 | — | +5 créditos publicitarios | — |
| **PRO 6 meses** | $37.500 | 1 mes bonificado | +20 créditos publicitarios | $225.000 + IVA |
| **PRO 12 meses** | $30.000 | 4 meses bonificados | +60 créditos publicitarios | $360.000 + IVA |

Los números cierran contra el precio de lista: 6 meses son 5 pagos de $45.000 = $225.000, y 12 meses son 8 pagos de $45.000 = $360.000. "Meses bonificados" y "precio por mes más bajo" son **la misma cosa dicha de dos maneras** — se comunican las dos porque cada una convence a alguien distinto, pero no hay dos descuentos.

### Pases extra — cuando el cupo no alcanza

El socio PRO que en un mes necesita más de 50 **compra los que quiera, sueltos, a $2.500 cada uno**. Si un hotel quiere regalar 4 más, paga $10.000.

**El precio es el piso del cupón** (`PRECIO_MIN = 2500` en `cobros.js`): un pase extra sale lo mismo que el cupón más barato del catálogo. No es un número inventado — está anclado a un precio que ya existe y que se mueve con el resto.

**Sólo para socios PRO.** No es una puerta de entrada alternativa a la suscripción.

Las cuentas cierran en la dirección correcta:

| | Por pase |
|---|---|
| Incluido en el abono (50 por $45.000) | **$900** |
| Extra suelto | **$2.500** |
| Lo que el turista paga por ese mismo pase | **$20.000** |

La suscripción sigue siendo lejos el mejor precio por pase, así que el extra no la canibaliza — es un techo blando, no una alternativa. Y para el socio, cualquiera de los dos números es chico contra lo que está regalando.

**No tiene nombre de producto, y no lo necesita.** En pantalla es un botón — **"Quiero regalar más pases"** — al lado del stock de pases del socio PRO. Punto. No se comunica como "upgrade", "tanda" ni "pack": es una acción, no una cosa que se compre por su nombre.

Eso también cierra la colisión con los **upgrade packs** que ya existen ($6.000, +1 premium): son dos acciones distintas con dos botones distintos, y ninguna de las dos necesita que el socio aprenda un sustantivo. Adentro del código sí van a necesitar identificadores separados, pero eso es problema de quien lo implemente, no de la comunicación.

⚠️ **Van por rieles distintos de cobro.** El upgrade pack se paga con **saldo de créditos publicitarios** (`asignar_upgrade_pack`, descuento atómico); los pases extra se pagan en **pesos**. Hay que decidir si conviven así o si los extras también salen del saldo.

⚠️ **Sin tope, el extra no tiene freno.** `4-socio-distribuidor.md` §7 ya lo había marcado: lo que escala no es el costo de Cuponear —el pase base cuesta cero— sino la **carga sobre el comercio que recibe los canjes**. Un distribuidor que compra 500 extras por $1.250.000 puede tapar de canjes a un comercio chico. No hay mecanismo de protección y sigue sin haberlo.

### Qué incluye, y qué dejó de incluir

**Los créditos publicitarios son de bienvenida, una sola vez.** No hay reposición mensual. El plan anterior daba **15 créditos por mes** además del bono; eso desaparece.

El cambio de fondo: antes el socio pagaba por **créditos publicitarios** y los pases regalo venían aparte, topeados por un parámetro global. Ahora paga por el **cupo de pases**, y los créditos son un empujón inicial para que arranque.

### Lo que este esquema resuelve

El tope de 150 dejó de ser un límite de daño y pasó a ser el contenido del plan. Antes existía como parámetro global justamente porque un plan con regalos ilimitados socavaba la venta de tandas; ahora que el cupo **es** lo que se compra, esa tensión desaparece.

El precio no se movió, pero **lo que compra sí**: mismo abono, contenido distinto.

### Revendedor — postergado

El cuarto rubro que se había mencionado (**revendedor**) **queda afuera por ahora**, por decisión explícita: es complejo y no es el momento. No hablar de revendedores en producto ni en comunicación.

El motivo de fondo sigue en pie: "revendedor" implica cobrarle al turista y liquidarle una comisión, y no hay pasarela de pago real ni mecanismo de payout. Es el "modo venta" de `4-socio-distribuidor.md` §2, que ya estaba postergado por lo mismo.

---

## 6. Lo que falta definir

Queda poco, y nada de esto impide empezar:

1. **Si los pases extra se pagan en pesos o con saldo de créditos** (§5).
2. **Si hay tope de pases extra**, y qué protege al comercio que recibe los canjes (§5).
3. **Plazo del aviso "con anticipación"** cuando se cae una fecha confirmada (§3.8). Sin un número, cada caso discute si era in situ o no.
4. **Si el día extra sigue a un pack más largo y más barato**, el día que exista (§3.3). Hoy no se plantea.

**Cerrado el 2026-08-17:** precio del día extra (plano a $5.000, sin problema de redondeo), el descuento de estadía (deja de ser caso especial), el premium ilimitado a $50.000 (se sostiene), los precios y el contenido del abono PRO, el cupo de 50 que no se acumula, los pases extra a $2.500, los 6 meses del pase sin usar, la caída de una fecha confirmada, y **el nombre: Cupon PASS, y "Gesell PASS" desaparece**.

---

## 7. Delta contra lo implementado

Lo que ya está y no hay que tocar:

- Packs de 3 y 7 días con sus precios y su valor promocional (tabla `pases`).
- Un premium por día y el ilimitado desde 10 días (`src/lib/pases.js`).
- El tope de 150 existe como valor (`configuracion.pases_regalo_tope_mensual`).
- Publicación gratis para el socio estándar, e impulso como único débito de créditos.
- **El mecanismo de arranque diferido ya existe**: el cron `activar-pases-programados` activa pases en una fecha agendada. Lo único que cambia es **quién escribe esa fecha** — hoy el turista, mañana el sistema desde las confirmaciones. La máquina de estados de `solicitudes_fecha`, que ya distingue `enviada` de `aceptada`, es exactamente el disparador que hace falta.

Lo que cambia:

| Qué | Hoy | Nuevo |
|---|---|---|
| **Arranque del pase** | Lo decide el turista: activa a mano (`activar_pase`) o programa una fecha (`programar_activacion_pase`), con estados pendiente/activo | Lo decide el sistema: el primer canje, o la fecha confirmada más temprana. La pantalla que le pide al turista que active o programe **desaparece** |
| **Fecha de arranque agendada** | La elige el turista | La calcula el sistema desde las confirmaciones, y **se adelanta** si aparece una anterior. Es un valor que se recalcula, no uno que se escribe una vez |
| **Reloj propio del alojamiento** | `esOfertaEstadia` le da un reloj aparte: usable con el pase sin activar | **Se borra.** Es una oferta con reserva previa como cualquier otra |
| **Producto del socio distribuidor** | Plan PRO por tramos → créditos publicitarios mensuales + pases regalo topeados aparte | Suscripción → cupo de 150 Gift PASS. Los créditos dejan de ser el contenido del plan |
| **Precio del abono** | $45.000 / $37.500 / $30.000 por mes | **Sin cambios** — las filas de `planes` quedan como están |
| **Créditos del plan** | `creditos_incluidos = 15` por mes + bono de bienvenida (5/20/60) | Sólo el bono de bienvenida. **Los 15 mensuales desaparecen**, y con ellos el motivo del cron `reponer-creditos-mensuales` — que pasa a servir para **resetear el cupo de 150**, que tampoco se acumula |
| **El tope de 150** | Parámetro global en `configuracion.pases_regalo_tope_mensual`, pensado como límite | **Cupo de 50**, contenido del plan, se pierde si no se usa. El valor sigue en 150 en la base: **no tocarlo hasta implementar**, porque hoy gobierna el modelo viejo |
| **Pases extra** | No existe | Alta nueva: $2.500 por pase (`PRECIO_MIN`), sólo para PRO, sin tope definido. En pantalla, un botón "Quiero regalar más pases" junto al stock |
| **Nombre del producto** | Decía "Gesell PaSS" | ✅ **Hecho el 2026-08-17.** Es lo único de este doc ya ejecutado (§2) |
| **Ventana para usar un pase** | `VENTANA_ACTIVACION_MESES = 12` | **6 meses**, contados desde el reclamo |
| **Fecha confirmada que se cae** | No existe el caso | Aviso por flag o Cuponix → anula el arranque agendado. In situ, va a la cola del superadmin, mismo patrón que `reportar_canje_erroneo` |
| **Agregar días** | No existe | Alta nueva: $5.000 por día venga del pack que venga, y hay que **recalcular** `usuario_pases.premium_ilimitado`, que hoy se congela en la compra |
| **Gift PASS del turista** | No existe. Regalar pases es sólo del socio | Alta nueva: compra para un tercero, entrega por mail/link/teléfono, 90 días para reclamar, alta de cuenta obligatoria |
| **Upgrade packs** ($6.000, +1 premium) | Vigentes | A revisar: con un premium por día y el ilimitado a los 10, puede que ya no tengan lugar |
| **Revendedor** | En el CHECK de `negocios.tipo` desde `db/20260802_tipos_empresa_socio.sql` | Queda en la base, pero fuera del discurso comercial |

---

## 8. Dependencias

Sin cambios respecto de `4-socio-distribuidor.md` §9: el premium con reserva necesita la Fase 5b, y sigue sin haber **pasarela de pago real** — que acá pesa más que antes, porque el Gift PASS es una compra para un tercero y el Gift PASS PRO es una suscripción recurrente. Hoy no hay ningún job de cobro recurrente funcionando.
