# Anexo — Cupopacks

Complementa `1-reset-conceptual.md` §5. Define el nombre, cómo se escribe y qué no se puede decir.


> **Changelog** · 2026-07-31
> Sin cambios.

---

## 1. Qué es

Un **Cupopack** es una selección pre-armada de cupones premium que llena los slots del Pase de un tap.

No es un producto. No tiene precio, ni stock, ni checkout, ni tabla de compras. Es una **plantilla de elecciones** dentro del Pase que el usuario ya compró.

---

## 2. Por qué este nombre

- **Retira "cuponera" del vocabulario.** La palabra significaba tres cosas (carrito, regalo del socio, Pase). En vez de reasignarla a un cuarto significado, se jubila. Es la única forma de que la ambigüedad no vuelva.
- **Explicita que el pack es de cupones**, no de servicios. Eso importa por lo del punto 4.
- Es corto, se pronuncia bien y admite nombre editorial detrás: *Cupopack Finde clásico*.

---

## 3. Cómo se escribe

| | |
|---|---|
| Singular / plural | Cupopack / Cupopacks |
| Mayúscula | Siempre inicial. Es nombre de producto. |
| Con nombre editorial | `Cupopack` + nombre: *Cupopack Finde clásico*, *Cupopack Ruta gourmet* |
| En código | `cupopack`, `cupopacks`, `cupopack_id`, `CupopackCard` |
| Nunca | "cupo pack", "CupoPack", "cupón pack", "pack de cupones" como nombre |

El nombre editorial es lo que el usuario recuerda. "Cupopack" es la categoría, "Finde clásico" es la cosa.

---

## 4. Restricciones de copy — no negociables

El producto anterior (un pack con precio propio que incluía alojamiento) se descartó por exposición regulatoria: prometer que un paquete "incluye" alojamiento es intermediación turística (Ley 18.829 / EVT), y Cuponear no es agencia de viajes.

El Cupopack no tiene ese problema **mientras el copy no arrastre la promesa vieja**.

### Prohibido
❌ "todo incluido"
❌ "incluye alojamiento" / "incluye la estadía" / "con hotel"
❌ "paquete" / "escapada organizada" / "tu viaje resuelto"
❌ "reservá tu viaje" / "tarifa" / "tour" / "itinerario"
❌ Cualquier formulación donde Cuponear aparezca prestando, vendiendo o garantizando el servicio

### Correcto
✅ "Cupopack Finde clásico: 3 beneficios premium elegidos por nosotros"
✅ "Te armamos la selección"
✅ "Descuentos en..." / "Beneficios en..."
✅ El alojamiento puede aparecer como **un beneficio más** (un late checkout, un desayuno), nunca como algo que el Cupopack "incluye" en el sentido de proveerlo

### La diferencia en una línea
El Cupopack **elige por vos entre los descuentos que ya tenés con el Pase**. No te vende nada nuevo, no te resuelve el viaje.

---

## 5. Reglas de composición

- Solo premium (ahorro declarado > $15.000). Los regulares ya vienen ilimitados con el Pase; meterlos no aporta.
- La cantidad de premium tiene que caber en los slots del Pase del usuario. Si tiene 3 slots y el Cupopack trae 4, se ofrecen los 3 primeros o no se ofrece.
- **Reversible siempre**, hasta el canje. Un tap lo deshace, y cualquier elección individual se puede cambiar. Sin esto, un paquete cerrado genera rechazo.
- Curaduría manual del superadmin. No se automatiza: la curaduría *es* el valor.
- Un Cupopack pertenece a un destino.

---

## 6. Dónde aparece

1. **Post-compra del Pase** — momento principal. El usuario acaba de pagar y tiene los slots vacíos.
2. **En Mi Pase**, mientras queden slots libres.
3. **Antes de comprar**, como argumento de venta del Pase: *"Elegí vos o dejanos armarlo"*.

No compite con el listado de premium ni lo reemplaza. Es un atajo para el que no quiere elegir.

---

## 7. Roce menor a tener en cuenta

"Cupo" en argentino también significa plaza o cantidad disponible, y el Pase tiene slots de premium. En textos donde convivan ambos ("te quedan 2 cupos" + "Cupopack"), revisar que no se lea confuso. No usar la palabra "cupo" para los slots del Pase: decir **"beneficios premium disponibles"**.
