# Cuponear — Socio distribuidor

Documento de producto. **No implementar todavía**: depende de las fases 5b y 6 de `2-tareas-urgentes.md`.
Complementa `1-reset-conceptual.md`.


> **Changelog** · 2026-07-31
> Modo venta postergado hasta la pasarela. Duración fija por destino. Precios sin anclar: falta la escalera del Pase.

---

## 1. Qué es

Un **socio distribuidor** es un negocio que llega al turista **antes** de que viaje y le entrega el Pase. No publica ofertas ni da descuentos: distribuye.

Casos: inmobiliarias de alquiler temporario, alojamientos, agencias de viaje, empresas de transporte, sindicatos y mutuales, receptivos.

**Una sola primitiva:** `alias + cupo`. Todos los casos son lo mismo por debajo; cambia quién se registra. Si cada tipo se vuelve un caso especial, se complica el código y el discurso comercial.

**No agrega nada nuevo para el turista.** Ve el mismo Pase. Toda la complejidad queda del lado del socio.

### Por qué importa
En la costa atlántica la mayoría del turismo no para en hotel: alquila por inmobiliaria o llega en micro. Los alojamientos solos no cubren ese volumen.

### Ya funciona técnicamente
La duración del pase-regalo es **fija por destino** (`pases.duracion_dias`), no derivada de una estadía. Eso significa que el mecanismo actual **ya sirve para un socio que no hospeda a nadie**. No hay que desacoplar nada.

---

## 2. Los dos modos

Un booleano en el socio. Misma mecánica de alias, mismo pase, misma app.

| | **Modo regalo** ✅ fase 1 | **Modo venta** ⏸️ postergado |
|---|---|---|
| Para quién | Compite por la reserva directa: inmobiliaria, alojamiento, cabañas | Tiene mostrador y vendedores: agencia, terminal, receptivo |
| Qué hace | Regala el Pase como diferencial | Vende el Pase y se queda con el 20% |
| Quién paga | El socio le paga a Cuponear | Cuponear le paga al socio |
| Producto | Pase regalo (base + 1 premium, sin puntos) | Pase completo (premium según días, con puntos) |

### Por qué el modo venta queda postergado
No hay pasarela de pago real ni mecanismo de payout. Liquidar el 20% en saldo interno no le sirve a una agencia, que quiere plata. Vender una comisión que no se puede pagar es peor que no ofrecerla.

**Se retoma cuando exista la pasarela.** Diseño previsto: el turista paga a Cuponear vía link o QR con el alias del distribuidor; el distribuidor no adelanta capital ni maneja efectivo; comisión plana del 20% sobre el precio del pase según su duración.

**Consecuencia a asumir:** en fase 1 **las agencias quedan afuera**. Una agencia no paga por regalar. Los distribuidores que entran ahora son los que compiten por la reserva directa. El canal agencia está postergado, no abierto.

---

## 3. Mecánica: saldo de pases

```
tandas_pases
  socio_id
  cantidad
  precio_unitario
  saldo_disponible
  renovacion_automatica  -- true = suscripción
  vence_el               -- fin de temporada para prepago
```

**Una suscripción es una tanda que se repone sola.** No es un sistema de facturación aparte: es el mismo saldo con `renovacion_automatica = true`. Esto evita duplicar la superficie de cobro, que hoy no tiene ningún job recurrente funcionando (deuda técnica #4).

---

## 4. Precios

> ⚠️ **Precios provisorios.** El Pase se vende por días (referencia conocida: 3 días a $20.000 + IVA = $24.200 final). Falta la escalera completa por duración para anclar estos números y para calcular la comisión del modo venta. **No publicar sin eso.**

| Tanda | Precio | Por pase |
|---|---|---|
| 10 de prueba | gratis | — |
| 25 | $12.500 | $500 |
| 100 | $40.000 | $400 |
| 500 | $150.000 | $300 |
| 2.000 | $400.000 | $200 |

Suscripción (misma tanda, renovación automática): **−20%**. Ej. 100/mes recurrente = $32.000/mes.

**Entrada gratis con 10 pases de prueba.** Autoservicio puro, cero negociación, cero fuerza de ventas — que es exactamente lo que mató a las cuponeras tradicionales.

---

## 5. Duración y premium

- **Duración: fija por destino.** No es configurable por socio ni por plan. Es una propiedad del destino (en Gesell, la estadía típica es de 7 días).
- **Premium: 1 incluido, configurable por plan.** Es la única palanca comercial del pase-regalo, y alcanza. Una segunda perilla daría lugar a que cada socio negocie.
- Más premium: el socio compra **upgrade packs** ($6.000 c/u, mínimo 10), que otorgan +1 premium cada uno.

---

## 6. Conflicto a resolver: el ilimitado del PRO

El PRO de alojamiento hoy da **pases regalo ilimitados**. Una inmobiliaria toma PRO y distribuye gratis, con lo cual nadie compra tandas y el precio del distribuidor queda socavado por el propio plan de Cuponear.

**Propuesta:** ponerle al PRO un cupo mensual de **150 pases**. Un alojamiento real nunca lo toca (20 unidades × rotación ≈ 60-100/mes), así que no se rompe el principio de que *el precio tiene que empujar el regalo, no gravarlo*. Por encima de ese número, compra tandas como cualquier distribuidor.

**Pendiente de decisión.**

---

## 7. El límite real es la saturación del socio

Distribuir 5.000 pases no le cuesta a Cuponear 5.000 veces más: los descuentos los financian los comercios y el costo marginal del pase base es cero.

Lo que sí escala es la carga sobre el socio receptor: 5.000 pases en enero pueden llenar de canjes a un comercio chico. **Ese límite es del destino, no del distribuidor.**

Implicancia: el precio de las tandas no refleja costo, refleja el valor que el distribuidor captura.

**No hay mecanismo de protección y hace falta uno.** Con volumen bajo no importa; el día que entre un distribuidor grande, sí. Hoy solo existe `stock` a nivel de tanda, que limita cuánto reparte cada socio pero no cuánto recibe cada comercio.

---

## 8. Fuera de alcance

- **Modo venta** completo (requiere pasarela de pago real)
- Cupo de saturación por destino o por socio receptor
- White label / código de lote con marca del distribuidor
- Comisión escalonada por volumen en modo venta (arrancaría plana al 20%)

---

## 9. Dependencias

No se puede construir antes de:
- **Fase 5b** — solicitudes de fecha (el premium con reserva no funciona sin eso)
- **Fase 6** — Mi Pase: activación y billetera desde producción
- Definición del **sistema de visibilidad**, que sostiene el precio del PRO y por comparación el del distribuidor
