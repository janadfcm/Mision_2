# Mision 2 · Async Odyssey

## Descripción

**Museo de bolsillo** es un buscador de obras del [Art Institute of Chicago](https://api.artic.edu/docs/). Escribes un tema (gatos, mar, noche…) y la app muestra las obras como si estuvieran colgadas en una sala: imagen, título, artista, fecha y país de origen, con enlace a la ficha del museo.

Con los resultados se puede:

- **Filtrar** sin volver a pedir datos: solo obras con imagen, por siglo o por país.
- **Ver estadísticas** calculadas con `reduce`: obras por siglo, el artista que más se repite y la obra más antigua.

Elegí esta API porque no necesita clave, admite CORS y se sale de los ejemplos típicos (PokeAPI, TheMealDB…). La API está en inglés, así que **hay que buscar en inglés** (`cat` en vez de `gato`); la app lo avisa bajo el buscador.

Estructura de `src/`, un módulo por responsabilidad:

| Módulo | Qué hace |
|---|---|
| `api.js` | `fetch` con `async/await`, `response.ok` y errores con mensajes en castellano. Sin DOM |
| `datos.js` | Limpia y transforma los datos con `map`/`filter`/`reduce`. Sin `fetch` ni DOM |
| `render.js` | Pinta en el DOM con `createElement` y `textContent` (nunca `innerHTML` con datos de la API) |
| `main.js` | Conecta todo: formulario, filtros y estados (cargando, error, sin resultados) |
| `cache.js` | Bonus: caché en `localStorage` con caducidad de 24 h |

## Cómo ejecutarlo

Necesitas Node.js instalado.

```bash
npm install
npm run dev
```

Abre la dirección que aparece en la terminal (normalmente http://localhost:5173) y busca algo en inglés, por ejemplo `cat`.

## Uso de IA

- **Herramienta**: Claude Code (modelo Claude Opus 5.5).
- **Qué partes**: la IA escribió el código **módulo a módulo** (`api.js`, `datos.js`, `render.js`, `main.js`, `style.css` y `cache.js`) y me explicó cada uno antes de pasar al siguiente. También redactó este README a partir de mis notas.
- **Qué hice yo**: tomé las decisiones del proyecto (la API, el nombre, el umbral de relevancia, el aviso de buscar en inglés, la caducidad de la caché y el apaño de la miniatura difuminada), probé cada módulo en Chrome antes de seguir e hice yo todos los *commits*. No escribí código a mano.
- ***Prompts* reales**:
  - «a ver ahora pon el codigo en los archivos para que lo pruebe» (15 de octubre, al empezar el código; elegí ir módulo a módulo, empezando por `api.js`).
  - «haz tú la prueba de robustez» (17 de octubre; de ahí salió que el cortafuegos de la API bloquea búsquedas con aspecto de ataque y la app lo confundía con un fallo de conexión, así que se retocó el mensaje de error).
- **Cómo lo verifiqué**:
  - En Chrome: búsqueda normal, búsqueda sin resultados (`qq`), búsqueda vacía, filtros (también sin coincidencias), modo sin conexión con «Reintentar», caché («· desde la caché» al repetir) y modo claro/oscuro, mirando que la consola no diera errores.
  - La IA lo probó además con 13 casos de robustez en Chrome automatizado, simulando respuestas raras de la API (error 500, respuesta que no es JSON, JSON sin `data`, obra con todos los campos a `null`, título con HTML).

## Autopsia

### 1. Miniatura difuminada cuando la imagen no carga

Desde el 17 de octubre, el servidor de imágenes del museo (IIIF) tiene una verificación anti-bots de Cloudflare: responde con un 403 y la página «Just a moment...». En una pestaña la imagen se ve, porque Chrome supera la verificación, pero dentro de la página, con `<img>`, no carga. No es un fallo del código.

**Lo que hice**: usar la miniatura que ya viene en la respuesta de la API (`thumbnail.lqip`, un GIF de 8×5 píxeles en base64), ampliarla y difuminarla con el aviso «Imagen no disponible». Como viene de fuera, la valido antes de meterla en un `src`: solo acepto `data:image/…;base64` de GIF, PNG, JPEG o WebP (fuera SVG, que puede llevar código). Si el museo quita el bloqueo, la imagen buena vuelve a salir sola.

**Por qué es discutible**: la tarjeta se ve borrosa; da el color de la obra, no la obra.

**Alternativas descartadas**:
- Cambiar de API a un día del plazo: demasiado riesgo.
- Dejar solo el recuadro gris «Sin imagen»: funciona, pero todas las tarjetas se veían iguales.
- Quitar el `Referer` de la petición (`referrerPolicy = 'no-referrer'`): lo probé y no cambió nada, así que lo deshice.

### 2. Umbral de relevancia para las búsquedas sin coincidencias

La API no devuelve 0 resultados cuando no encuentra nada: devuelve todo el catálogo (133 169 obras) con una puntuación de relevancia (`_score`) casi nula. Sin hacer nada, buscar `qq` llenaba la página de obras que no tienen nada que ver.

**Lo que hice**: medir el `_score` con 10 búsquedas reales. Las coincidencias de verdad tienen 2 o más y el relleno ronda 0,00002, así que descarto lo que tenga menos de 1. Por ejemplo, `axolotl` pasa de 30 resultados a 1 y `qq`, de 30 a 0.

**Por qué es discutible**: es un número elegido a mano a partir de pocas pruebas; si el museo cambia cómo calcula la relevancia, el filtro podría quitar obras buenas o dejar pasar relleno.

**Alternativas descartadas**:
- Buscar el texto entre comillas: sí devuelve 0 cuando no hay nada, pero es demasiado estricto y pierde resultados buenos.
- Mostrarlo todo con un aviso: la página se llena de obras sin relación con la búsqueda.
