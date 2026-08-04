# Integración Cloudinary — Optimización Automática de Imágenes
**Fase:** 2 (Post-lanzamiento)  
**Prioridad:** Media-Alta  
**Esfuerzo:** ~4–6 horas de desarrollo  
**Impacto:** Mejor UX visual, reducción de carga de servidor, diferenciador para socios

---

## 📌 Objetivo
Reemplazar URLs de imagen locales/CDN actual por URLs dinámicas de Cloudinary que optimizan automáticamente según dispositivo, red y contexto, sin UI extra ni fricción del usuario.

---

## 🎯 Requisitos Funcionales

### 1. Cuenta Cloudinary (Setup no-code)
- Plan: **Free** (100GB/mes, suficiente para Fase 1–2).
- Crear cuenta en cloudinary.com.
- Obtener `CLOUDINARY_CLOUD_NAME` y `CLOUDINARY_API_KEY`.
- Guardar en `.env` del proyecto.

### 2. Migración de Imágenes
- **Opción A (Recomendada):** Cloudinary integrado con Supabase Storage.
  - Configurar "Fetch Remote" en Cloudinary para que tire de Supabase directamente.
  - No duplicar storage; solo transformar URLs.
  - Pros: Cero fricción, cero duplicación, mantenimiento mínimo.
  
- **Opción B:** Subir directamente a Cloudinary via API.
  - Cuando socio sube foto → enviar a Cloudinary en paralelo.
  - Guardar `cloudinary_public_id` en tabla `promociones`.
  - Pros: Control total; contras: +100MB storage cost.

**Decisión recomendada:** Opción A (Fetch Remote).

### 3. URLs Dinámicas por Contexto
Reemplazar todas las URLs de imagen estática por URLs con transformaciones:

#### **a) Listado de ofertas (OfertaCard.jsx)**
```
Imagen actual:   https://bucket.supabase.co/image.jpg
Imagen optimizada: https://res.cloudinary.com/{CLOUD_NAME}/image/fetch/w_400,q_auto,f_webp/https://bucket.supabase.co/image.jpg
```
- Ancho: 400px (mobile-first).
- Calidad: `q_auto` (Cloudinary decide según conexión).
- Formato: WebP (95% menor que JPG).

#### **b) Detalle de oferta (OfertaDetail.jsx)**
```
https://res.cloudinary.com/{CLOUD_NAME}/image/fetch/w_800,q_auto,f_webp/https://bucket.supabase.co/image.jpg
```
- Ancho: 800px (tablet/desktop).
- Misma calidad automática.

#### **c) Thumbnails (CuponeraDrawer, selecciones)**
```
https://res.cloudinary.com/{CLOUD_NAME}/image/fetch/w_150,h_150,c_fill,g_auto,f_webp/https://bucket.supabase.co/image.jpg
```
- 150×150px cuadrado.
- `g_auto`: recorte inteligente (IA detecta sujeto).
- `c_fill`: rellena espacio sin distorsión.

#### **d) Imagen del socio en panel (AdminNegocioView.jsx)**
```
https://res.cloudinary.com/{CLOUD_NAME}/image/fetch/w_300,q_auto,f_webp/https://bucket.supabase.co/image.jpg
```

### 4. Mejora Opcional (Fase 2.5)
Si foto está subexpuesta/oscura, aplicar transformación de brillo:
```
https://res.cloudinary.com/{CLOUD_NAME}/image/fetch/w_400,q_auto,brightness_10,f_webp/https://bucket.supabase.co/image.jpg
```
- `brightness_10`: +10% brillo automático.
- No UI; aplicar a todas las fotos por defecto.

---

## 🔧 Implementación Técnica

### 1. Crear Utilidad (src/utils/cloudinaryUrl.js)
```javascript
// Función helper que toma URL original y devuelve URL optimizada
export const getCloudinaryUrl = (originalUrl, options = {}) => {
  if (!originalUrl) return null;
  
  const {
    width = 400,
    quality = 'auto',
    format = 'webp',
    crop = null,
    gravity = null,
    brightness = 0,
  } = options;
  
  const cloudinaryUrl = `${process.env.REACT_APP_CLOUDINARY_BASE_URL}/image/fetch`;
  const transforms = [];
  
  if (width) transforms.push(`w_${width}`);
  if (quality) transforms.push(`q_${quality}`);
  if (format) transforms.push(`f_${format}`);
  if (crop) transforms.push(`c_${crop}`);
  if (gravity) transforms.push(`g_${gravity}`);
  if (brightness !== 0) transforms.push(`brightness_${brightness}`);
  
  const transformString = transforms.join(',');
  return `${cloudinaryUrl}/${transformString}/${encodeURIComponent(originalUrl)}`;
};
```

### 2. Actualizar Componentes
**OfertaCard.jsx:**
```javascript
import { getCloudinaryUrl } from '@/utils/cloudinaryUrl';

export function OfertaCard({ oferta }) {
  const imagenOptimizada = getCloudinaryUrl(oferta.imagen_url, {
    width: 400,
    quality: 'auto',
    crop: 'fill',
    gravity: 'auto'
  });
  
  return (
    <div className="oferta-card">
      <img src={imagenOptimizada} alt={oferta.nombre} />
      {/* resto del componente */}
    </div>
  );
}
```

**CuponeraDrawer.jsx (thumbnails):**
```javascript
const thumbUrl = getCloudinaryUrl(oferta.imagen_url, {
  width: 150,
  crop: 'fill',
  gravity: 'auto'
});
```

### 3. Env Variables
```
REACT_APP_CLOUDINARY_CLOUD_NAME=tu_cloud_name
REACT_APP_CLOUDINARY_BASE_URL=https://res.cloudinary.com/{CLOUD_NAME}
```

### 4. Testing
- Subir foto "mala" (celular, oscura, 5MB).
- Renderizar en listado → debe mostrar 400px, WebP, <100KB.
- Abrir en detalle → debe mostrar 800px, WebP.
- Comprobar velocidad: antes vs. después con DevTools Network.

---

## 📊 Métricas de Éxito

| Métrica | Baseline | Target |
|---------|----------|--------|
| **Tamaño promedio imagen listado** | 600KB | <80KB |
| **Tiempo de carga (Network)** | 1.2s | <300ms |
| **Bounce rate en catálogo** | 15% | <8% |
| **Costo de CDN** | $0 (Supabase) | $0 (Cloudinary Free) |

---

## 🎁 Beneficios Adicionales (Futuros)

1. **Analytics de imagen:** Cloudinary reporta cuántas veces se descargó cada foto.
2. **Watermark automático:** Agregar logo de Cuponear a fotos (branding).
3. **A/B testing visual:** Probar dos versiones de la misma oferta (brightness, crop).
4. **Generación de variantes:** Crear versión cuadrada, vertical, horizontal sin resubir.

---

## 📅 Roadmap
- **Semana 1:** Setup Cloudinary Free + env vars.
- **Semana 2:** Crear utilidad + actualizar 3 componentes críticos (OfertaCard, CuponeraDrawer, AdminNegocioView).
- **Semana 3:** Testing, análisis de impacto, documentación.
- **Semana 4 (Opcional):** Brightness automático + analytics.

---

## ⚠️ Consideraciones

- **Supabase Storage:** No necesita cambio. Cloudinary fetcha URLs públicas de Supabase.
- **Offline:** Si Cloudinary cae, fallback a URL original (Supabase).
- **GDPR/privacidad:** Cloudinary procesa imagen, no la almacena permanentemente (fetch mode). Revisar ToS.
- **Cache:** Cloudinary cachea resultados 1 año; cambios de URL requieren cache-busting.

---

## 🔗 Recursos
- Docs: https://cloudinary.com/documentation/image_transformation_reference
- Playground: https://cloudinary.com/getcwd/media_explorer
- Pricing Free: https://cloudinary.com/pricing/

