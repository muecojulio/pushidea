# Pushidea

Aplicación instalable para generar ideas de apps de uso cotidiano o para facilitar procesos. Cada toque propone una idea distinta, con descripción y pasos. Las que te gustan se quedan en el teléfono.

No incluye ideas de pagos, transferencias ni cuentas de banco.

Node.js 24.x

## Pestañas

- **Generar**: una idea por toque (archivo local de 40 ideas o «Ideas en vivo»), consejo del día y recursos para profundizar.
- **Guardadas**: tus ideas marcadas, con búsqueda y filtro por ámbito. Solo en tu dispositivo.
- **Instalar**: código QR generado en el propio navegador para abrir e instalar Pushidea en cualquier teléfono, tableta o computadora, más el botón de instalación nativa cuando el navegador lo ofrece.
- **Privacidad**: la política de privacidad completa (qué se guarda, qué sale, cómo borrar todo).
- **Ajustes**: ámbito, enfoque, «Ideas en vivo» y vaciar el historial de vistas.

## APIs públicas sin clave ni registro

Elegidas del catálogo abierto [public-apis/public-apis](https://github.com/public-apis/public-apis) y verificadas en vivo. A todas solo les llega el término del ámbito (p. ej. «cocina casera»), nunca datos personales:

| Servicio | Uso |
| --- | --- |
| Advice Slip (`api.adviceslip.com`) | Consejo breve para crear hoy |
| MyMemory (`api.mymemory.translated.net`) | Traduce ese consejo al español |
| Wikipedia ES (`es.wikipedia.org`) | Artículo relacionado con la idea |
| Open Library (`openlibrary.org`) | Libros reales sobre el ámbito |
| GitHub (`api.github.com`, sin token) | Repositorios públicos populares para inspirarse y copiar ideas (revisa su licencia) |

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
