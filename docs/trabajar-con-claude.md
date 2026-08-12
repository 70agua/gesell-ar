# Cómo trabajar conmigo gastando menos

Guía escrita el 2026-08-11 a partir de los datos reales de este proyecto: 38 sesiones, 47 horas de trabajo, del 27/6 al 11/8.

**En el plan Pro no pagás por token — pagás $17 fijos.** Lo que se consume no es plata, es **acceso**: hay topes de uso que se reinician, y cuando los tocás, esperás. Así que "gastar menos" acá significa **llegar más lejos antes de quedarte sin sesión**.

---

## Por qué esto importa: los tres números

**1. El 71% del consumo no es pensar ni escribir. Es releer.**
Produje 16,6 millones de tokens de respuesta. Para producirlos releí 5.776 millones de tokens de contexto. Son **348 tokens releídos por cada token escrito**.

**2. Cada mensaje relee todos los anteriores.**
No hay memoria viva entre turnos: en cada mensaje se vuelve a procesar la conversación entera. El mensaje 40 de una sesión cuesta unas ocho veces el mensaje 5, aunque pidas lo mismo.

**3. Tres sesiones se llevaron el 62%.**
De 38 sesiones, las tres más largas consumieron US$1.533 equivalentes. Las 28 más chicas, juntas, US$338. **No es que hagas demasiado — es que algunas sesiones se estiran demasiado.**

---

## Regla 1 — Una tarea, una sesión

Esto solo es el grueso del ahorro. Todo lo demás es afinar.

El caso testigo es la sesión del 4 al 10 de agosto: **seis días, 47 mensajes, US$597 equivalentes — el 24% de todo el proyecto en una sola conversación.** Arrancó pidiendo un reemplazo de texto ("Gesell PASS" → "Cupon PASS"). Para el sexto día, pedir un ajuste de CSS costaba releer los 46 mensajes previos, la mayoría sobre temas ya cerrados.

**Cuándo cortar:** cuando cambia el tema, no cuando termina el día. Terminaste el rename y ahora vas al hero → sesión nueva. Cerraste el bug del checkout y ahora querés tocar el panel del socio → sesión nueva.

**No cortes** en medio de una tarea sola por miedo a gastar. Retomar cuesta más que seguir: hay que reconstruir el contexto que ya estaba armado.

La pregunta correcta no es *"¿cuánto llevo en esta sesión?"* sino *"¿lo que voy a pedir ahora necesita algo de lo que ya hablamos?"*. Si la respuesta es no, sesión nueva.

## Regla 2 — Juntá los pedidos relacionados

Contraintuitivo, pero se deduce de la Regla 1: **diez mensajes de una línea cuestan mucho más que un mensaje con diez puntos.** Cada mensaje suelto paga la relectura completa; el mensaje único la paga una sola vez.

Cuando estés revisando una pantalla y encuentres seis cosas para ajustar, anotalas y mandalas juntas. Vale incluso si son inconexas entre sí, siempre que sean de la misma pantalla.

La excepción es cuando el segundo pedido depende de cómo salga el primero. Ahí no hay nada que juntar.

## Regla 3 — El primer mensaje hace la mitad del trabajo

Un pedido vago me obliga a explorar para entender qué querés, y explorar es leer archivos, y leer archivos llena el contexto que después se relee en cada turno. Un pedido específico me deja ir directo.

No hace falta que sea largo. Alcanza con tres cosas:

- **Qué** querés que pase
- **Dónde**, si lo sabés (el archivo, la pantalla, el componente)
- **Cómo se sabe que salió bien**

> *"En el panel del socio, el botón de eliminar cupón tiene que pedir confirmación antes de borrar. Está en TabOfertas. Que no se pueda borrar de un click."*

Eso vale por cinco mensajes de ida y vuelta.

Si no sabés dónde está, no lo inventes — decí "no sé dónde vive esto". Buscarlo yo es más barato que buscar en el lugar equivocado porque adivinaste.

## Regla 4 — Apuntame al archivo en vez de recordarme

Ya no hace falta que me expliques decisiones viejas. Está todo en memoria, ruteado.

| En vez de… | Decí… |
|---|---|
| "¿Te acordás que los planes cambiaron?" | "Mirá `10-historia-modelos-de-plan`" |
| Reexplicar por qué se retiró "cuponera" | "Está en `10-vocabulario-por-que`" |
| Contarme de nuevo un bug que ya arreglamos | "Eso ya pasó, fijate en memoria" |

El índice de memoria (`MEMORY.md`) tiene la tabla completa de qué leer según la tarea, y lo cargo siempre. Un `[[nombre-de-archivo]]` me lleva directo.

## Regla 5 — El modelo según la tarea

No todas las tareas necesitan el modelo más caro. Sonnet consume bastante menos por token que Opus.

| Tarea | Modelo |
|---|---|
| Renombrar, mover archivos, aplicar un patch, buscar dónde está algo | **Sonnet** |
| Traducir un brief a código ya especificado | **Sonnet** |
| Decidir arquitectura, diseñar una pantalla, resolver un bug esquivo | **Opus** |
| Charlar una idea de producto | **Opus** |

En este proyecto Sonnet produjo **53% más texto que Opus gastando 30% menos**. Casi todo el trabajo mecánico se puede hacer con Sonnet sin que se note la diferencia.

## Regla 6 — El navegador al final, no al principio

Verificar en el navegador está bien y lo pediste explícitamente — pero cada captura de pantalla es cara en contexto. Sirve para **confirmar que algo quedó bien**, no para explorar.

Mal: abrir el navegador y ponerse a mirar a ver qué está roto.
Bien: hacer el cambio, abrir el navegador, sacar una captura, cerrar.

Si hay varias cosas visuales para revisar, mejor una pasada al final que una por cambio.

## Regla 7 — Decime cuando algo cambió afuera

Si tocaste código a mano, cambiaste algo en Supabase o moviste archivos entre sesiones, avisámelo en el primer mensaje. Si no, trabajo sobre lo que creo que hay, descubro a mitad de camino que no coincide, y hay que rehacer. Eso ya pasó con las fotos de los negocios y con los CHECK de la base.

---

## Qué cambió con la memoria nueva

**Antes:** 23 archivos planos, 89 KB, sin ruteo. Para orientarme en un tema tenía que leer de más, y ese "de más" quedaba en contexto para el resto de la sesión.

**Ahora:** un índice con tabla de ruteo que se carga siempre, y 19 archivos chicos que se leen sólo cuando corresponden. Una tarea típica pide dos o tres archivos de ~3 KB en vez de un barrido general.

**Además dejaron de pisarse con CLAUDE.md.** Antes el modelo de planes estaba explicado en los dos lados y había que leer ambos para saber cuál mandaba. Ahora: CLAUDE.md dice cómo funciona hoy, la memoria dice por qué y qué se descartó. Cada cosa en un solo lugar.

**Para que siga funcionando** hace falta poco: cuando cerremos una decisión de producto o encontremos un bug que costó tiempo, decime "guardá esto". Si la memoria se desactualiza vuelve a ser ruido caro. El mapa (`node tools/memory-map.mjs`) avisa cuando hay archivos huérfanos o fuera del índice.

---

## Checklist rápido

**Antes de escribir el primer mensaje de una sesión:**

- [ ] ¿Esto necesita algo de la sesión anterior? Si no → sesión nueva
- [ ] ¿Puedo juntar varios pedidos de la misma pantalla en uno?
- [ ] ¿Dije qué, dónde y cómo se sabe que salió bien?
- [ ] ¿Es tarea mecánica? → Sonnet
- [ ] ¿Cambió algo afuera desde la última vez?

**Señales de que conviene cortar y arrancar de nuevo:**

- Cambiaste de tema y el nuevo no depende del anterior
- La sesión lleva más de un día
- Estás pidiendo ajustes finos sobre algo que ya funciona
- Notás que las respuestas tardan más de lo normal

---

## Lo que *no* hay que hacer para ahorrar

Un par de aclaraciones, porque optimizar de más sale caro:

**No escribas mensajes telegráficos.** Ahorrar diez palabras en el pedido para después gastar tres mensajes aclarando es peor negocio. La claridad es barata.

**No evites pedir verificación visual.** Las rondas de CSS "a ojo" de principios de agosto costaron más que las capturas que las habrían evitado.

**No partas una tarea sola en varias sesiones.** Reconstruir contexto cuesta más que mantenerlo.

**No dejes de pedir cosas grandes.** El plan Pro te rindió unas 45 veces lo que pagaste. El objetivo es llegar más lejos, no hacer menos.
