# Entrega atómica de los archivos de marca

Ningún archivo de marca se escribe en su sitio definitivo: el agente
principal puede estar corriendo `npm run build` en el mismo instante, y un
lector a mitad de escritura se llevaría medio JPEG o medio JSON. Cada
archivo se genera primero bajo `/workspace/.grok/` (mismo sistema de
archivos que el destino, nunca dentro de `public/`, que `vite build`
copia tal cual al despliegue) y se entrega con un `rename` atómico:

```sh
node scripts/write-atomic.mjs /workspace/.grok/og.jpg.tmp public/og.jpg
node scripts/write-atomic.mjs /workspace/.grok/x-banner.jpg.tmp public/x-banner.jpg
node scripts/write-atomic.mjs /workspace/.grok/site.json.tmp src/lib/og/site.json
```

- `public/og.jpg` — la tarjeta social 1200×630 (solo apps con tarjeta propia).
- `public/x-banner.jpg` — el banner 1200×264 de X (solo `"type": "x:game"`).
- `src/lib/og/site.json` — `{ "title": "…", "card": "custom" }`; en juegos,
  además `"type": "x:game"`.

Si el archivo temporal no existe, la entrega falla sin tocar el destino:
la versión anterior queda intacta.
