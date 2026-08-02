# Cuponear — Reset conceptual

Documento de producto. Define **qué es cada cosa** y qué deja de existir.
Se lee antes de `2-tareas-urgentes.md`, que es la ejecución.


> **Changelog** · 2026-08-02
> §5 reescrito: el Cupopack es un producto pago, no una plantilla sin precio.
>
> · 2026-07-31
> Corregido §6 (duración fija por destino). Nuevo §9 (ofertas exclusivas, aparcado). Glosario: "personas" y baja de "huésped".

---

## 1. Reset de terminología

Hoy "cuponera" significa tres cosas distintas en el código. Es el problema más grave del modelo mental, porque ninguna palabra puede significar tres cosas de cara al usuario.

| Hoy | Qué es | Pasa a llamarse |
|---|---|---|
| `CuponeraDrawer` / `cuponera.jsx` | El carrito de compra | **Carrito** ⚠️ *pendiente de confirmación* |
| `TabCuponeras` / `cuponerasRegalo.js` | Regalo del socio al huésped | **se elimina** (§3) |
| "Cuponera Gesell" (§5 del resumen) | El Pase | **Pase** |

**"Cuponera" se retira del vocabulario.** No se reasigna a nada. El conjunto curado que arma Cuponear se llama **Cupopack** (ver anexo `3-cupopacks.md`). La palabra no debe quedar en código, UI ni comunicación.

---

## 2. El modelo de producto — tres cosas, no cinco

| Producto | Qué es | Quién lo arma |
|---|---|---|
| **Cupón suelto** | Un descuento de un socio | El socio publica |
| **Carrito** | Mecanismo de compra de varios cupones sueltos | El usuario |
| **Pase** | Acceso por N días: regulares ilimitados + N premium | Cuponear |

**El carrito no lleva descuento por volumen.** Es un mecanismo de pago, no un producto.

### Qué pasó con la "cuponera pack"

Se evaluó crear un producto nuevo: un conjunto curado con precio propio y checkout propio. **Se descartó.** El Pase lo domina en todo (más cupones, elegidos por el usuario, e incluye lo que el pack vendía). Un producto que es un subconjunto peor de otro no debe existir.

Lo que se rescata es la curaduría, que se materializa en el **Cupopack** (§5): un producto pago que el que tiene Pase puede pagar con sus slots. Sin tablas nuevas, sin precio propio, sin checkout propio.

---

## 3. Qué se elimina

### 3.1 Cuponera regalo del socio
`TabCuponeras`, `cuponerasRegalo.js`, y el gate `puede_compartir_cuponeras`.

Motivo: hay **dos mecanismos de regalo del hotelero al huésped** haciendo lo mismo. Se conserva el **pase-regalo** (alias de 6 dígitos, RPC atómicas, cupo validado, ya integrado al checkout hotelero) y se elimina este.

Efecto colateral positivo: muere la traba #3 (aprobación de comprobante de transferencia para habilitar cuponeras).

### 3.2 Cobro por canje al alojamiento
`onCanjeAlojamiento()`, `generarOrdenCanje()`, `ordenes_cobro`.

Motivo, decidido a nivel producto: cobrarle al socio por el huésped que se le deriva convierte cada socio en una negociación y un cobro aparte (no escala), y genera conflicto de interés con el orden del listado. Además se lee mal cobrarle a quien está dando beneficios sin cargo.

**Nunca estuvo cableado** (depende del canje, que no existe). Se borra antes de construir el canje, para no cablearlo por inercia.

### 3.3 Cobro al socio por publicar
`debeUsarTokens`: hoy un alojamiento sin plan paga créditos publicitarios para publicar una oferta. Se elimina.

Es el mismo razonamiento de §3.2 aplicado un paso antes: no se le cobra al socio que te está dando beneficios, y menos al alojamiento, que es el canal de distribución del pase-regalo.

**Principio general:** ningún socio paga por publicar ni por canjear. El plan compra **visibilidad**, no funcionalidad básica. Nada que haga que una ficha sirva para el turista puede estar detrás del plan — el precio se muestra siempre. PRO compra ranking, créditos publicitarios, upgrade packs, fotos y estadísticas. El botón de contacto es la excepción conservada como argumento de venta.

### 3.4 Aprobación del negocio por el superadmin
El socio paga y **funciona**. `aprobado` deja de ser una traba para publicar el negocio.

Motivo: hoy hay dinero cobrado (hasta $360.000 en `pro_12`) y cero servicio prestado hasta que alguien abre un panel. Es el peor agujero del sistema.

**Se conserva la aprobación de ofertas.** Es el único control que queda, y su objetivo es acotado: detectar ofertas que no sirven, que no gustan o que tienen problemas legales.

---

## 4. Qué cambia

### 4.1 Piso de precio del cupón
`cobros.js → calcularPrecioCupon` no tiene mínimo. Un ahorro de $5.000 da $1.512, por debajo del mínimo de venta.

```
PRECIO_MIN = 2500      // $2.000 + IVA = $2.420, elevado a la centena siguiente
PRECIO_MAX = 14520     // techo actual, se conserva
AHORRO_MIN = 5000      // ahorro mínimo publicable
precio = clamp(redondear_centena(ahorro * comision * 1.21), PRECIO_MIN, PRECIO_MAX)
```

Consecuencias:
- **Entre $5.000 y ~$10.300 de ahorro el precio se clava en $2.500.** El porcentaje del tramo es decorativo ahí abajo. A los socios se les comunica como *"cupón de entrada, $2.500 fijo"*, no como un porcentaje.
- **El tramo del 25% queda muerto** (su techo cae dentro de la zona del piso). Se puede sacar de la tabla.
- El piso bajo es deliberado: sin compra chica (un café, una merienda) el catálogo queda demasiado exclusivo.

**Comunicación de estos cupones:** mostrar **ganancia neta** (`ahorro − precio`) en vez del ahorro bruto, y no hacerlos elegibles para espacios destacados. Con ratio 2x, "ahorrás $5.000 por $2.500" invita a hacer la resta.

### 4.2 Upgrade pack del hotelero → +1 premium
Hoy el upgrade ($6.000, mín. 10) solo habilita que el huésped gane puntos. El hotel paga $6.000 para que su huésped gane 300 puntos ($300). No cierra y no se puede vender.

**Pasa a otorgar +1 premium en el pase-regalo al que se asigna.** El hotel paga $6.000 y su huésped desbloquea un beneficio de más de $15.000 de ahorro.

El mecanismo (compra mayorista, saldo, asignación) ya está construido. Solo cambia qué otorga.

### 4.3 Premium: slots ocupados, no consumidos
- El contador cuenta **elecciones activas**, no acumuladas. El usuario llena y vacía slots libremente.
- Al canjear, el slot **se congela definitivamente**.
- Si no usa sus premium dentro de los días del pase, los pierde. Sin devolución.

Esto es lo que hace posible ofrecer selecciones pre-armadas: son reversibles con un tap.

### 4.4 Anulación de canje
Un canje anulado es un **error operativo** (no había mesa, se escaneó el cupón equivocado, la venta no se concretó), no un cambio de opinión.

- **Solo el superadmin puede anular.**
- El socio tiene un botón **"reportar canje erróneo"** en su panel, que genera una entrada en una cola del superadmin. Sin esto, el turista queda sin recurso y termina escribiendo por WhatsApp — el mismo callejón sin salida que la traba #4.
- Anular un canje **libera el slot** y el usuario puede volver a elegir.

---

## 5. Cupopacks

Selección curada de cupones (premium y regulares) que Cuponear arma bajo un concepto editorial y **vende como unidad**, con precio y checkout propios. Puede traer un **beneficio adicional** que no existe comprando los cupones sueltos.

Quien tiene Pase no compra el Cupopack: lo **paga con sus slots premium** (los regulares los cubre el Pase). En ese caso no recibe el beneficio adicional, porque ya pagó esos premium al comprar el Pase.

Es **un solo producto con tres formas de pago**. Definición completa, reglas y copy en `3-cupopacks.md`.

> ⚠️ Una versión anterior de este documento decía que el Cupopack no tenía precio ni checkout. Era falso.

## 6. Pase-regalo

**Definición:** pase por N días con **1 premium incluido**, más los que el socio agregue vía upgrade packs (§4.2).

- Los cupones regulares quedan **ilimitados**. Es el wow, no cuesta nada y es lo que hace que el turista abra la app.
- **La duración es fija por destino** (`pases.duracion_dias`). Es una propiedad del destino —en Gesell la estadía típica es de 7 días—, no de quién entrega el pase. Ya está implementado así en `activar_regalo_pase`.
- El límite vive donde está el valor: los premium. Que es exactamente donde tiene que aparecer el upsell.
- Sin descuento de estadía (ya está alojado).

**Copy:** *"Tu alojamiento te regala el Pase: todos los descuentos del destino durante tu estadía, más 1 beneficio premium a elección."*

**El "1 premium" es configurable por plan del socio.** Es la única palanca comercial, y alcanza. Agregar una segunda (días variables) daría lugar a que cada socio negocie duración.

> ⚠️ Corrección: una versión anterior de este documento decía que la duración salía de la estadía del huésped. **Es falso** — nunca se implementó así. Que sea fija por destino es además lo que permite que el pase-regalo funcione para socios que no hospedan a nadie (§ doc 4).

Se descartó un esquema con premium variables según duración de la estadía (2 hasta 7 días, 3 después): tres perillas, un umbral arbitrario y cambio de mecánica respecto del pase pago.

## 7. Pendiente — sistema de visibilidad

Los créditos publicitarios hoy funcionan de forma binaria: la oferta impulsada rankea primero. Debe pasar a ser **proporcional a la inversión** y aplicarse en todas las vistas donde la oferta o el socio aparezcan.

Además debe cruzarse con **actividad del socio**: quien mantiene su contenido vivo y actualizado gana visibilidad, independientemente de lo que invierta.

**Esto necesita documento propio.** Define qué tan "pagable" es la home y, mal hecho, se nota de inmediato. No implementar por intuición.

---

## 8. Terminología acordada

- **Créditos publicitarios** — nunca "créditos" ni "tokens" a secas. Son del socio.
- **Puntos** — la moneda del turista (cashback). Nunca "tokens".
- **Pase** — el producto de acceso por días. Nunca "cuponera".
- **Carrito** — el mecanismo de compra. Nunca "cuponera".
- **Cupopack** — selección curada de premium dentro del Pase.
- **Cuponera** — **retirada**. No se usa para nada.
- **Personas** — solo para *contar* gente (capacidad, cantidad en una solicitud, unidad de precio). No nombra al actor.
- **Huésped** — **retirada**. El actor es el turista; el plan ya no es exclusivo de alojamientos.
- **Persona ≠ negocio.** Nunca usar datos de la persona como default de campos del negocio.

---

## 9. Conceptos aparcados

**Ofertas exclusivas** (`exclusivoHuespedes`). Marca una oferta como visible o canjeable solo para los turistas que llegaron por un socio determinado. Herramienta anti-OTA: le da al turista un motivo para reservar directo.

Hoy existe **solo en datos mock**. No implementar. Cuando vuelva, el concepto correcto es **"clientes de este socio"**, no "alojados acá" — así nace compatible con socios distribuidores (doc 4) y no hay que rehacerlo.
