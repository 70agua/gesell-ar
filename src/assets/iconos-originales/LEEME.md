# Íconos Lottie originales

Los `.json` que sirve la app viven en `public/iconos/`. Acá quedan las versiones
tal como llegaron de diseño, antes de los retoques que se les hicieron a mano.

Esta carpeta está fuera de `public/` a propósito: nada la importa, así que Vite
no la copia a `dist/` y no se descarga en producción. Es sólo el respaldo para
poder volver atrás.

| Archivo | Qué le cambió al que está en producción |
|---|---|
| `mas-con-corchetes.json` | El original traía cinco capas: tres `circle` y dos `bracket L`/`bracket R`. Se borraron los dos corchetes y quedaron los tres puntos. |
| `familia-sin-espejar.json` | Se espejó horizontalmente para que no se leyera como el logo de MySpace: el layer raíz `hover-pinch` pasó de `scale [100,100,100]` a `[-100,100,100]`. Su anchor está en (215,215), el centro del canvas, así que el reflejo no lo corre. |

Para restaurar alguno, copiarlo sobre el de `public/iconos/` con el nombre corto:

```bash
cp src/assets/iconos-originales/mas-con-corchetes.json public/iconos/mas.json
cp src/assets/iconos-originales/familia-sin-espejar.json public/iconos/familia.json
```
