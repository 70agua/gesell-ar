# Feature: ScrollCards en Hero

**Status**: Integrado  
**Fecha**: Aug 4, 2026  
**Autor**: Claude (Agent)

## Cambios realizados

### Archivos creados
- `src/components/landing/ScrollCards.jsx` - Componente modular de tarjetas animadas

### Archivos modificados
- `src/components/landing/HeroPase.jsx`
  - Import agregado: `import ScrollCards from './ScrollCards';`
  - JSX insertado: Bloque `<ScrollCards ... />` entre hero content y galería

## Cómo revertir (rollback)

### Opción 1: Revert completo (Git)
```bash
git checkout HEAD -- src/components/landing/HeroPase.jsx
rm src/components/landing/ScrollCards.jsx
```

### Opción 2: Manual (si no usas Git)
1. En `HeroPase.jsx`, elimina la línea:
   ```jsx
   import ScrollCards from './ScrollCards';
   ```

2. En `HeroPase.jsx`, elimina este bloque (líneas ~170-196):
   ```jsx
   {/* ─── SCROLL CARDS: Tarjetas animadas (MindMarket style) ... ─── */}
   <ScrollCards
     cards={[...]}
     onCardClick={...}
   />
   {/* ──────────────────────────────────────────────────────────── */}
   ```

3. Elimina el archivo:
   ```bash
   rm src/components/landing/ScrollCards.jsx
   ```

## Comportamiento

- **3 tarjetas** con info de Pases, Suscripción y Comunidad
- **Animación al scroll**: Tarjetas entran en cascada al enter en viewport
- **Stagger**: 100ms entre cada tarjeta
- **Hover**: Levantamiento + shadow aumentada
- **Responsive**: Grid adapta automáticamente en mobile
- **Clicks**: Cada tarjeta puede triggear una acción diferente

## Personalización

Edita en `ScrollCards.jsx`:
- **Colores**: Objeto `A` al inicio
- **Cards content**: Props `cards` cuando lo llamas en `HeroPase`
- **Animación timing**: Ajusta `transitionDelay` o `animation: scrollCardsEntry`
- **Tamaños**: CSS variables dentro del JSX

## Next steps (opcional)
- Agregar smooth scroll a nivel global (GSAP ScrollSmoother)
- Submenu animations en navbar
- Más refinamiento de estilos
