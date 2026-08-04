# Rediseño: módulo de upsell del Pase en detalle de oferta
**Contexto:** pantalla de "Ofertas de este socio" → detalle de oferta → módulo inferior que ofrece el Pase Gesell. Problema actual: logo repetido 2 veces, copy redundante/cortado, selector de duración con `<select>` nativo que pesa en mobile (abre picker) separado del botón de compra (2 gestos desconectados).

---

## Estructura nueva

```
┌─────────────────────────────────────┐
│  Sumalo a tu Pase Gesell             │
│  y ahorrás en 20+ lugares más        │
│                                       │
│  [ 3 días ]  [ 7 días ]  [ 14 días ] │  ← chips, "7 días" pre-seleccionado
│                                       │     por default (mayor conversión)
│  ┌─────────────────────────────────┐ │
│  │   Lo quiero · $18.000            │ │  ← precio reacciona al chip activo
│  └─────────────────────────────────┘ │
│                                       │
│  Ver qué incluye el Pase →           │
└─────────────────────────────────────┘
```

## Cambios puntuales

1. **Eliminar el logo incrustado en el texto.** Reemplazar "Conseguí este y muchos más con tu [ISOTIPO]" por texto plano: *"Sumalo a tu Pase Gesell y ahorrás en 20+ lugares más"*. El logo/wordmark no va dentro de la oración.

2. **Reemplazar el `<select>` por chips (segmented control).** 3 opciones tappeables directamente visibles, sin abrir picker nativo. Uno viene pre-seleccionado por default. Al tocar un chip, el precio del botón "Lo quiero" se actualiza en el momento (sin recargar ni navegar).

3. **Un solo botón de conversión**, no un dropdown + botón separados. El botón ya muestra el precio del chip activo.

4. **Eliminar el segundo bloque redundante** ("Tu estadía con el Gesell Pass: el Pase trae una →" — texto cortado). Reemplazar por un link simple: *"Ver qué incluye el Pase →"*, sin logo, sin repetir el mensaje de arriba.

5. **Chip por defecto:** usar el plan de 7 días (el hero/estándar según el modelo de precios vigente), no el más corto ni el más caro — salvo que tengan datos de conversión que digan lo contrario, en cuyo caso ese dato manda.

## Qué NO tocar

- La sección de arriba (radio list "Ofertas de este socio" + imagen grande + "Comprar cupón") queda igual — es el flujo de cupón suelto, funciona bien.
- No cambiar los precios/duraciones reales del Pase — solo la interacción de selección, usar los valores vigentes que ya maneja el sistema de precios.

## Testing

- Verificar que el precio del botón cambia instantáneamente al tocar cada chip, sin parpadeo ni delay perceptible.
- Confirmar que el chip pre-seleccionado coincide con el plan que quieran empujar por default.
- Mobile: los 3 chips tienen que entrar en una fila sin wrap en los anchos de pantalla estándar (360-420px). Si no entran, usar 2 filas antes que achicar tipografía al punto de ser ilegible.
