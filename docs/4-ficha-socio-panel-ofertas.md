# Ficha de socio — Panel de ofertas

**Versión:** 1.0 · Agosto 2026
**Alcance:** vista de detalle de socio (`/socio/:slug`), columna derecha. Incluye el drawer equivalente en mobile.
**Reemplaza:** el patrón de tabs por badge y el lockup rotado del Pase.

---

## 1. Decisión de arquitectura

El panel deja de usar **tabs** y pasa a **lista acordeón**.

Motivo: las tabs se etiquetaban con el badge de la oferta (`2x1`, `-20%`, `Upgrade`), lo que produce labels duplicados cuando un socio tiene dos ofertas del mismo porcentaje, mezcla tipo de beneficio con magnitud en el mismo control, y trunca el título. El acordeón escala a N ofertas, muestra el título completo y conserva la imagen.

Se elimina también el indicador `1 / 3`: duplicaba la función del selector.

---

## 2. Estructura del panel

```
┌─ Header ─────────────────────────────┐
│ Ofertas de este socio     3 disponibles │
├─ Fila oferta (expandida) ────────────┤
│ [thumb] Título          (•) radio     │
│         subtítulo                     │
│ ┌──────────────────────────────────┐ │
│ │ Hero 16:9 + overlay              │ │
│ │ Bloque de acción (según estado)  │ │
│ │ Línea del Pase                   │ │
│ └──────────────────────────────────┘ │
├─ Fila oferta (colapsada) ────────────┤
│ [thumb] Título          ( ) radio     │
│         subtítulo                     │
├─ Fila oferta (colapsada) ────────────┤
└──────────────────────────────────────┘
```

### 2.1 Header

- Izquierda: `Ofertas de este socio`
- Derecha: contador `N disponibles` — **obligatorio**. Es lo que evita que la primera oferta expandida se lea como la única.

### 2.2 Fila (estado colapsado)

| Elemento | Spec |
|---|---|
| Thumb | 88 × 50 px, `border-radius: 6px`, `object-fit: cover`, badge del descuento en overlay abajo-izquierda |
| Título | 14px / 500, una línea, `text-overflow: ellipsis` |
| Subtítulo | 12px, `--text-secondary`. Contenido: ahorro estimado (`Ahorrás $13.801 aprox.`) o vigencia si es flash |
| Radio | 18px, alineado a la derecha |
| Alto total | ~70px con padding |

El thumb **no es opcional**: una fila solo-texto se lee como nota al pie, no como ítem de lista.

Toda la fila es el área clickeable. El radio es indicador de estado, no control independiente.

### 2.3 Comportamiento

- Una sola oferta expandida por vez.
- La oferta que llega por deep-link desde la minificha entra expandida. **Nunca default al índice 0.**
- Si el socio tiene una sola oferta: no se renderizan filas, se muestra el bloque expandido directo.
- Al expandir, `scrollIntoView({ block: 'nearest', behavior: 'smooth' })` sobre la fila.
- Con más de 6 ofertas: mostrar 6 + botón `Ver las N ofertas`.

---

## 3. Imágenes — proporción

**Una sola proporción en todo el sistema: 16:9.**

| Uso | Tamaño | Notas |
|---|---|---|
| Hero del panel expandido | `aspect-ratio: 16/9`, `border-radius: 10px` | ~236px de alto en panel de 420px |
| Minificha en listados | `aspect-ratio: 16/9` | ya implementado, no tocar |
| Thumb de fila colapsada | 88 × 50 px (16:9) | mismo asset, mismo crop |

Justificación: el socio sube **una** imagen y sirve para los tres usos. Cualquier segunda proporción obliga a un segundo crop en el uploader y multiplica el soporte — es exactamente el tipo de carga operativa que el producto tiene que evitar.

Se evaluó 2:1 (~210px, ahorra 26px de alto). Se descarta: no compensa romper la consistencia con la minificha, y las fotos de comercios verticales sufren más recorte.

### 3.1 Tratamiento del hero

- `object-fit: cover`, `object-position: top` — el overlay ocupa la franja inferior, el sujeto de la foto tiene que subir.
- Degradé obligatorio: `linear-gradient(to top, rgba(0,0,0,.55), transparent 55%)`. Sin esto el texto blanco desaparece en fotos claras (playa, mediodía).
- Overlay abajo-izquierda: descuento en display + subtítulo debajo.
- Corazón (guardar) arriba-derecha, sobre círculo `rgba(0,0,0,.35)`.
- Badge `OFERTA FLASH` arriba-izquierda cuando corresponde.

---

## 4. Bloque de acción — tres estados

El CTA depende del estado del usuario respecto de esa oferta, **no de la posición en la lista**.

### Estado A — sin cupón ni Pase

```
[ Adquirir el Gesell Pass ]        ← botón primario
  Obtener descuento · $3.500       ← botón secundario
```

Jerarquía deliberada: el Pase es el producto hero, el cupón suelto es la puerta de entrada.

### Estado B — con cupón activo para esta oferta

```
¿Estás en el lugar? Escaneá el QR del socio
[ (qr) Canjear ahora ]
ó pedile el código de 6 dígitos  [000] [000]
```

- Icono: `public/iconos/qr-code.svg`, 19px, a la izquierda del label, gap 12px.
- `¿Estás en el lugar?` en `--text-accent` / 500; el resto en tinta regular.
- Input de código: dos grupos de 3, `inputmode="numeric"`, autoavance entre casillas.
- Confirmación previa al canje: *"¿Seguro? El cupón queda anulado."*

### Estado C — con Pase que cubre esta oferta

Igual que el estado B. No se muestra precio en ningún lado.

---

## 5. Línea del Pase (reemplaza el lockup rotado)

El sticker rotado se elimina: ocupaba el mejor píxel del panel sin convertir.

En su lugar, una línea de texto debajo del CTA. **El copy cambia según la capa de la oferta**, derivada del tramo de comisión:

| Capa | Tramo | Copy |
|---|---|---|
| Base | 25% / 20% | `Incluido en el Gesell Pass →` |
| Premium | 15% / 10% / 7% | `Entra como una de tus 2 experiencias premium →` |

Un solo string no sirve: "ya lo tenés incluido" es falso en premium, donde el turista elige solo 2.

### 5.1 Si el usuario ya tiene el Pase

En ofertas premium, la línea muestra el saldo real:

- `Te quedan 2 elecciones premium`
- `Te queda 1 elección premium`
- `Usaste tus 2 elecciones premium` → link a upgrade

Es data auditable y crea el momento de decisión que protege al socio de alto ticket.

---

## 6. Prueba social — se retira

Se eliminan del encabezado de la ficha:

- `7 personas viendo ahora`
- `83 cupones canjeados`

Motivo: al lanzamiento los números reales van a ser flacos, y números inflados destruyen lo único que la plataforma vende de fondo, que es confianza. Se reactivan cuando `oferta_stats` tenga volumen real y los valores salgan de la tabla, nunca de un generador.

---

## 7. Breadcrumb y labels de categoría

### Bug actual

```
Inicio > Salidas > Las Gaviotas > salidass
```

El último crumb imprime el slug de la categoría (con el typo de doble s) en vez del nombre del socio.

### Correcto

```
Inicio > Salidas > Las Gaviotas > Arena Gesell Shows
```

### Mismo problema en el cuerpo

El bloque `Información del comercio` muestra `TIPO: salidas` — es la key cruda de la DB.

### Solución

Un único map exportado, consumido por breadcrumb, ficha, filtros y listados:

```
categoria_key → { label, labelSingular, icono }
```

Sin esto cada vista inventa su propio label, y en expansión multi-destino el problema se multiplica por destino. El map no puede hardcodear localidad.

---

## 8. Copy pendiente de validar

- `Obtener descuento · $3.500` vs `Quiero el cupón` (actual en minificha). La minificha y el panel tienen que decir lo mismo o el usuario siente que cambió de producto al hacer clic.
- Lockup del Pase: unificar capitalización. Hoy conviven `PaSS`, `pass` y `Pass`. **Siempre imagen, nunca texto renderizado.**

---

## 9. Checklist de implementación

- [ ] Panel recibe `ofertaId` y expande esa oferta
- [ ] Header con contador `N disponibles`
- [ ] Filas con thumb 88×50, título, subtítulo de ahorro, radio
- [ ] Hero 16:9 con degradé y `object-position: top`
- [ ] Tres estados del bloque de acción
- [ ] Línea del Pase con copy por capa
- [ ] Saldo de elecciones premium para usuarios con Pase
- [ ] Retirar contadores de prueba social
- [ ] Map `categoria_key → label`
- [ ] Breadcrumb con nombre del socio en el último crumb
- [ ] `scrollIntoView` al expandir
- [ ] Corte a 6 ofertas + "Ver las N ofertas"
