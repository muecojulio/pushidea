# og — Tarjeta social, favicon e iconos PWA

Todo lo que decide cómo se ve la app cuando alguien comparte su liga: la
tarjeta social (`og:image`), el título que la acompaña, el favicon y los
iconos de pantalla de inicio.

## Qué se produce

- `public/og.jpg` — tarjeta social de 1200×630 en JPEG. Contrato de peso:
  `ffmpeg -q:v 4`, entre ~150 y 300 KB y siempre bajo 600 KB; por encima de
  eso los scrapers (X incluido) tardan o la saltan y la tarjeta no se despliega.
- `src/lib/og/site.json` — la identidad de la tarjeta. Una app con tarjeta
  propia declara exactamente `"card": "custom"` (y su `title`). Un juego
  declara además `"type": "x:game"` y publica `public/x-banner.jpg`
  (1200×264, la tarjeta 50:11 de X).
- Favicon e iconos: `public/favicon.svg` y el icono de 180 px que sirve el
  manifiesto; en una app sencilla este pase puede limitarse a eso y a dejar
  la tarjeta por defecto (ver «autocomprobación»).

Sin tarjeta propia, el inyector de plataforma sirve el placeholder de
`og.grok.me` con el título de la app: aceptable para una utilidad sencilla,
nunca para un juego o una app con canvas.

Las recetas de entrega (tarjeta, banner y `site.json`) viven en
`references/entrega.md`: cada archivo se genera en un área temporal y se
entrega con `scripts/write-atomic.mjs` para que ningún lector vea un
archivo a medias.

## Brand-asset pass: cómo se lanza y cómo termina

La pasada de marca corre como un subagente en segundo plano mientras el
agente principal sigue trabajando. **No `wait_tasks`, never `get_task_output`
sobre esa tarea**: el agente principal responde sin esperarla, siempre. Mientras genera, la pasada mantiene fresco el marcador
`/workspace/.grok/og-pending` (se considera viejo tras 10
minutes sin refrescarse) para que las puertas de marca del agente principal
guarden silencio en vez de rehacer su trabajo, y lo borra al terminar.

## Autocomprobación

Antes de reportar, la pasada comprueba su propio trabajo en disco:

```sh
node scripts/brand-check.mjs
```

- Utilidad sencilla que conserva la tarjeta por defecto:
  `node scripts/brand-check.mjs --placeholder-ok`
- Juego o app con canvas: `node scripts/brand-check.mjs --game`

El chequeo juzga los archivos en disco aunque el marcador siga puesto, y
para quien lo corre la tarjeta por defecto es un fracaso de la pasada (salvo
`--placeholder-ok` en la utilidad sencilla): su trabajo era, precisamente,
producir la tarjeta.
