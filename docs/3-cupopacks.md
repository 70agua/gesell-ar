# Cupopacks

> **Changelog** · 2026-08-02
> **Reescrito.** La versión anterior definía el Cupopack como una plantilla sin precio ni checkout. Es falso: el Cupopack **es un producto pago**. Lo que cambia con el Pase no es el producto sino la forma de pagarlo. Nuevo §3 (formas de pago), §4 (beneficio adicional) y §5 (puntos).

Complementa `1-reset-conceptual.md` §5.

---

## 1. Qué es

Un **Cupopack** es una selección curada de cupones que Cuponear arma bajo un concepto editorial (*Amigos & Adrenalina*, *Finde en pareja*, *Con chicos*) y vende como unidad.

- Puede contener cupones **premium** y **regulares**.
- Tiene precio propio y checkout propio.
- Puede tener un **beneficio adicional** que no existe comprando los cupones sueltos (§4).
- Curaduría manual del superadmin. No se automatiza: la curaduría *es* el valor.
- Pertenece a un destino.

**Es un solo producto.** Lo que cambia según el turista tenga o no Pase es **cómo lo paga** (§3), no qué es.

**Por qué existe:** el turista no quiere elegir entre 40 ofertas, quiere que ya esté elegido. Y quien tiene Pase no quiere pensar qué premium usar.

---

## 2. Nombre

| | |
|---|---|
| Singular / plural | Cupopack / Cupopacks |
| Mayúscula | Siempre inicial. Es nombre de producto. |
| Con nombre editorial | *Cupopack Amigos & Adrenalina* |
| En código | `cupopack`, `cupopacks`, `cupopack_id`, `CupopackCard` |
| Nunca | "cuponera" · "cupo pack" · "CupoPack" · "pack de cupones" como nombre |

**"Cuponera" está retirada del vocabulario.** No debe aparecer en código, UI ni comunicación. Ver `1-reset-conceptual.md` §1.

El nombre editorial es lo que el turista recuerda. "Cupopack" es la categoría, "Amigos & Adrenalina" es la cosa.

---

## 3. Las tres formas de pagarlo

| Caso | Qué paga | Beneficio adicional | Puntos |
|---|---|---|---|
| **Sin Pase** | Precio completo del Cupopack | ✅ Sí | 5% de lo pagado |
| **Con Pase, slots suficientes** | **$0** — los regulares los cubre el Pase, los premium consumen slots | ❌ No | 0 (no pagó nada) |
| **Con Pase, slots insuficientes** | Solo los premium que no le entran en sus slots, a precio individual | ❌ No | 5% de lo pagado |

**Por qué el que usa slots no recibe el beneficio adicional:** ya pagó por esos premium al comprar el Pase. El beneficio adicional es lo que compensa pagar el Cupopack completo; darlo también a quien no paga lo vacía de sentido y canibaliza la venta.

**Y por qué eso no es injusto:** el que tiene Pase está recibiendo la curaduría gratis, que es el valor principal del producto.

### Reglas
- Los cupones que **requieren confirmación de fecha** (`requiere_fecha`) quedan excluidos del llenado automático de slots: un Cupopack es un tap, una solicitud es una conversación de 72 h con el socio.
- Reversible: mientras no haya canjeado, el turista puede deshacer el Cupopack o cambiar cualquier elección.
- Si un cupón del pack no entra (cupo del socio agotado, duplicado), **los que sí entraron quedan**. No se revierte todo: se informa qué entró y qué no.

---

## 4. Beneficio adicional

Cada Cupopack **puede** tener uno, definido al crearlo. No es obligatorio y no es siempre el mismo.

Ejemplos: multiplicador de puntos (×2, ×3), descuento extra sobre el total, un cupón exclusivo que no existe suelto.

- Se define por Cupopack en el panel del superadmin.
- **Solo aplica en compra paga completa** (§3).
- Es el argumento que hace que comprar el pack sea mejor que comprar los cupones sueltos.

---

## 5. Puntos

**5% de lo efectivamente pagado**, igual que cualquier compra. Si el Cupopack tiene multiplicador como beneficio adicional, se aplica sobre esa base.

> ⚠️ Regla que se violó y hay que respetar: los puntos **nunca** se calculan sobre el ahorro declarado. Con 1 punto = $1 y hasta 100% de descuento en la próxima compra, calcular sobre el ahorro genera crédito por varias veces el valor de la venta.
>
> Ejemplo del error detectado: Cupopack de $21.900 con ahorro declarado de $106.006 → daba 79.506 puntos, o sea $79.506 de crédito por una compra de $21.900.

---

## 6. Restricciones de copy — no negociables

Prometer que un pack "incluye" alojamiento o resuelve el viaje es intermediación turística (Ley 18.829 / EVT), y Cuponear no es agencia de viajes.

### Prohibido
❌ "todo incluido" · "incluye alojamiento" · "con hotel" · "paquete" · "escapada organizada" · "tu viaje resuelto" · "reservá tu viaje" · "tarifa" · "tour" · "itinerario"
❌ Cualquier formulación donde Cuponear aparezca prestando, vendiendo o garantizando el servicio

### Correcto
✅ "Cupopack Amigos & Adrenalina: 4 cupones elegidos por nosotros"
✅ "Estás comprando los descuentos, no los servicios ni productos en sí"
✅ El alojamiento puede aparecer como **un cupón más**, nunca como algo que el Cupopack provee

### Aclaración legal
Visible antes de pagar, no en acordeón cerrado:

> Estás comprando los descuentos, no los servicios ni productos en sí. Cada beneficio tiene sus propios términos y condiciones de canje.

---

## 7. Dónde aparece

1. **Post-compra del Pase** — momento principal para el que tiene Pase: acaba de pagar y tiene los slots vacíos.
2. **En Mi Pase**, mientras queden slots libres, **antes** del elector manual. Si ya eligió a mano, ofrecérselo llega tarde.
3. **En el catálogo**, como producto propio para quien no tiene Pase.

No reemplaza al listado de ofertas. Es un atajo para el que no quiere elegir.

---

## 8. Lo que no es un Cupopack

**Una selección de cupones sueltos.** Se evaluó y se descartó: no hay caso de uso. Cada cupón se canjea de a uno en el momento, o se pide fecha por anticipado si lo requiere. Para "no perderlo de vista" ya está la **wishlist** (corazón).

---

## 9. Roce menor

"Cupo" en argentino también significa plaza o cantidad disponible, y el Pase tiene slots premium. No usar "cupo" para los slots: decir **"beneficios premium disponibles"**.
