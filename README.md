# Pushidea

Aplicación instalable para generar ideas de apps de uso cotidiano o para facilitar procesos. Cada toque propone una idea distinta, con descripción y pasos. Las que te gustan se quedan en el teléfono.

No incluye ideas de pagos, transferencias ni cuentas de banco.

Node.js 24.x

## Pestañas

- **Generar**: una idea por toque (archivo local de 40 ideas o «Ideas en vivo»), consejo del día, carril con las ideas recientes y, dentro de cada idea, el panel «Profundizar» con el artículo de Wikipedia, los libros con portada y los repositorios de GitHub en carril.
- **Guardadas**: buscador con combobox accesible, filtro por ámbito en carril de chips y las ideas en carrusel (móvil) o cuadrícula (escritorio). Cada tarjeta se desliza para revelar «Abrir» y «Quitar», con «Deshacer». Solo en tu dispositivo.
- **Instalar**: código QR generado en el propio navegador para abrir e instalar Pushidea en cualquier teléfono, tableta o computadora, más el botón de instalación nativa cuando el navegador lo ofrece y los pasos por equipo en paneles plegables.
- **Privacidad**: la política de privacidad completa (qué se guarda, qué sale, cómo borrar todo) en paneles plegables.
- **Ajustes**: «Ideas en vivo» (interruptor), ámbito (chips con su matiz), enfoque (control segmentado con píldora deslizante) y vaciar el historial de vistas con confirmación en dos pasos.

Las cinco pestañas se cambian con toque, con ratón y con teclado (flechas, Inicio, Fin), y también deslizando el panel en horizontal.

## Sistema de interacciones

Un solo juego de piezas reutilizables en `src/components/ui/`, sobre Tailwind v4 y Radix (ya instalados: no se añadió ninguna dependencia):

| Pieza                         | Qué resuelve                                                                                                                                                                                                     |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `boton.tsx`                   | Objetivo táctil de 44 px o más, hundimiento breve al pulsar, elevación sutil solo donde hay cursor, y estados inactivo / cargando / éxito / error / deshabilitado con icono + texto + `aria-busy`                |
| `pestanias.tsx`               | `tablist` y `tab` con píldora animada, foco móvil, flechas e Inicio/Fin, y carril desplazable que centra la pestaña activa                                                                                       |
| `panel-deslizable.tsx`        | Swipe entre secciones con bloqueo de eje (factor 1,2), sin `preventDefault` y sin arrancar sobre controles                                                                                                       |
| `riel.tsx` + `use-riel.ts`    | Scroll horizontal nativo con `scroll-snap`, barra oculta solo a la vista, desvanecido de bordes únicamente cuando hay desbordamiento, flechas con puntero fino y supresión del clic tras arrastrar               |
| `carrusel.tsx`                | Carrusel con la siguiente tarjeta asomando y puntos de progreso en móvil; cuadrícula en pantallas grandes                                                                                                        |
| `deslizable.tsx`              | Swipe para revelar acciones: tope en el ancho del panel, umbral o gesto rápido, `inert` mientras está cerrado, botón explícito con `aria-expanded` y acciones a la vista en escritorio                           |
| `combobox.tsx`                | Búsqueda que filtra sin distinguir mayúsculas ni diacríticos (reutiliza `norm()`), `aria-activedescendant`, flechas/Inicio/Fin/Enter/Escape, opción activa siempre visible y mensaje cuando no hay coincidencias |
| `interruptor.tsx`             | `role="switch"` + `aria-checked`, nombre por `aria-labelledby` y estado dicho también con palabras                                                                                                               |
| `segmentado.tsx`              | `radiogroup` con una sola parada en el orden de tabulación y píldora deslizante                                                                                                                                  |
| `plegable.tsx`                | Radix Collapsible animado con la altura real que mide Radix (sin saltos) y `aria-expanded`/`aria-controls`                                                                                                       |
| `avisos.tsx` + `use-aviso.ts` | Una única región viva (`role="status"`) con confirmación visible y, cuando toca, acción «Deshacer»                                                                                                               |
| `fondo-vivo.tsx`              | Capas decorativas (manchas a la deriva, trama, grano, chispas y viñeta), `aria-hidden` y sin interacción                                                                                                         |

Los tokens de la identidad (colores, sombras, radios y curvas de animación) viven en `src/styles.css` dentro de `@layer components`, para que las utilidades responsivas de Tailwind puedan pisarlos; los diez matices por ámbito están en `src/lib/ui/tema.ts` y se aplican con la variable `--hue`.

### Movimiento reducido y accesibilidad

- `prefers-reduced-motion: reduce` apaga derivas del fondo, entradas escalonadas, brillos, barridos y chispas, y cambia el scroll suave por inmediato (también en los `scrollTo`, vía `prefiereMovimientoReducido()`).
- El estado nunca depende solo del color: icono + texto + `aria-pressed` / `aria-checked` / `aria-selected` / `aria-current`.
- Foco visible con `outline` dorado de 3 px que ninguna sombra de componente puede tapar; los campos usan su propio halo.
- Nada bloquea el zoom, el scroll ni los gestos del navegador: los gestos propios reservan el borde de la pantalla, no llaman a `preventDefault` y se apartan cuando el gesto es vertical.
- La matemática de los gestos es pura y está probada: `src/lib/ui/gestos.test.ts` (15 casos en 5 suites) corre con `npm test`.

## APIs públicas sin clave ni registro

Elegidas del catálogo abierto [public-apis/public-apis](https://github.com/public-apis/public-apis) y verificadas en vivo. A todas solo les llega el término del ámbito (p. ej. «cocina casera»), nunca datos personales:

| Servicio                                 | Uso                                                                                 |
| ---------------------------------------- | ----------------------------------------------------------------------------------- |
| Advice Slip (`api.adviceslip.com`)       | Consejo breve para crear hoy                                                        |
| MyMemory (`api.mymemory.translated.net`) | Traduce ese consejo al español                                                      |
| Wikipedia ES (`es.wikipedia.org`)        | Artículo relacionado con la idea                                                    |
| Open Library (`openlibrary.org`)         | Libros reales sobre el ámbito                                                       |
| GitHub (`api.github.com`, sin token)     | Repositorios públicos populares para inspirarse y copiar ideas (revisa su licencia) |

El código QR usa la librería abierta [`qrcode`](https://github.com/soldair/qrcode) (del repositorio público de GitHub) y se dibuja en el dispositivo: la dirección de la app no pasa por ningún servicio externo de QR.

## Caché

- **Respuestas de APIs** (`src/lib/apis/cache.ts`): caché local con caducidad (consejo 12 h, recursos por ámbito 24 h, traducciones 30 días). Sin conexión se muestra lo último guardado. Se borra desde la pestaña Privacidad.
- **HTTP**: activos con huella (`/assets/*`) inmutables por un año; iconos y portada con una semana y revalidación. El manifiesto PWA siempre se revalida.

## Base de datos e índices (validación)

Pushidea no usa base de datos para sus funciones: el catálogo son 40 ideas en memoria y lo guardado vive en `localStorage`. Crear tablas e índices SQL no aportaría nada y encendería Postgres en cada arranque, así que **no se crean índices para la app**.

El esquema de cuentas (inactivo) sí tenía un hueco real: el login OAuth busca por `("providerId", "accountId")` y esa pareja no tenía índice. `migrations/auth/0002_auth_indexes.sql` agrega ese índice compuesto y los de `expiresAt` para limpiar sesiones/verificaciones vencidas. Validado con Postgres real (PGLite, 3 000 filas): la consulta de login pasó de `Seq Scan` a `Index Scan using account_provider_account_idx`; en la limpieza por `expiresAt` el planificador sigue prefiriendo barrido cuando casi todo está vencido, que es lo correcto. Los índices que ya existían (email y token únicos, `userId`, `identifier`) no se duplican.

## Seguridad

- `npm audit`: **0 vulnerabilidades** (revisado el 2026-10-13).
- Cabeceras activas en desarrollo y producción (`vite.config.ts` y `vercel.json`, idénticas): CSP restrictiva (solo orígenes propios, Grok y las APIs públicas usadas; `frame-ancestors` limitado sin bloquear la vista previa), HSTS, `nosniff`, `Referrer-Policy` estricta y `Permissions-Policy` con cámara, micrófono, ubicación y pagos apagados.
- La función de servidor valida y acota cada campo que devuelve el modelo, descarta temas de pagos/bancos y reintenta una vez con corrección; la clave de IA nunca llega al navegador.
- Los enlaces externos usan `rel="noopener noreferrer"` y el contenido de las APIs se renderiza como texto (React lo escapa), sin HTML inyectado.

## Código muerto retirado

Estado `hydrated` que nadie leía, el bloque de instalación duplicado en Ajustes, la ruta `/privacidad` suelta (ahora es pestaña), un conjunto de ámbitos duplicado en el generador, el reintento `repair` que nunca se invocaba y el único error de lint (un `catch` vacío sin explicar).
