import { cacheClear } from "@/lib/apis/cache";

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-medium text-fg">{titulo}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted">{children}</div>
    </section>
  );
}

/**
 * Política de privacidad de Pushidea (versión 1.1, 13 de octubre de 2026).
 * Es también el texto que se enlaza desde la tienda/perfil si algún día se publica.
 */
export function PrivacidadContenido() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-fg">Privacidad</h1>
        <p className="mt-2 text-xs text-muted">Política de privacidad · Versión 1.1 · 13 de octubre de 2026</p>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Pushidea genera ideas de aplicaciones para la vida diaria. No pide cuenta, no tiene anuncios y no vende
          datos. Esta página explica, sin letra chica, qué se guarda, qué sale de tu dispositivo y qué puedes
          borrar.
        </p>
      </div>

      <Seccion titulo="Lo que se guarda en tu dispositivo">
        <p>
          Las ideas que guardas, el historial de las que ya viste, la última idea mostrada y tus ajustes viven solo
          en este teléfono o computadora, en el almacenamiento local del navegador. No hay una base de datos
          compartida con tus ideas: cualquiera podría leer o borrar ideas ajenas si estuvieran en un tablero
          público.
        </p>
        <p>
          También se guarda una caché con las respuestas de las fuentes públicas (consejos, artículos, libros y
          repositorios) para no pedirlas dos veces y para mostrarlas sin conexión. Esa caché caduca sola en un
          máximo de 30 días.
        </p>
      </Seccion>

      <Seccion titulo="«Ideas en vivo»: qué sale y qué no">
        <p>
          Con «Ideas en vivo» apagado, nada sale del dispositivo. Con el interruptor activo, cada toque envía
          únicamente el ámbito elegido (p. ej. «cocina») y los títulos ya mostrados, para no repetir. No se envían
          contactos, ubicación, notas ni el contenido de tus ideas guardadas. La clave de ese servicio vive en el
          servidor y nunca viaja a tu teléfono.
        </p>
      </Seccion>

      <Seccion titulo="APIs públicas sin cuenta">
        <p>
          Para profundizar en cada idea, Pushidea consulta servicios públicos y gratuitos que no piden clave ni
          registro. A todos ellos solo les llega el término del ámbito (p. ej. «cocina casera»), nunca tus datos:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="text-fg">Advice Slip</span> (api.adviceslip.com): devuelve un consejo breve. No recibe
            ningún dato tuyo, solo la petición del consejo.
          </li>
          <li>
            <span className="text-fg">MyMemory</span> (api.mymemory.translated.net): traduce ese consejo al
            español. Solo recibe el texto del consejo en inglés.
          </li>
          <li>
            <span className="text-fg">Wikipedia en español</span> (es.wikipedia.org): recibe el término del ámbito
            y devuelve un artículo relacionado.
          </li>
          <li>
            <span className="text-fg">Open Library</span> (openlibrary.org): recibe el término del ámbito y
            devuelve libros reales sobre ese tema.
          </li>
          <li>
            <span className="text-fg">GitHub</span> (api.github.com): recibe el término del ámbito y devuelve
            repositorios públicos populares, para inspirarte. Sin cuenta ni token.
          </li>
        </ul>
        <p>
          Esos servicios pueden ver la dirección IP de tu conexión, como cualquier sitio web que visitas. Pushidea
          no les manda identificadores, cookies de seguimiento ni información de tu dispositivo más allá de lo que
          tu navegador envía normalmente.
        </p>
      </Seccion>

      <Seccion titulo="Código QR e instalación">
        <p>
          El código QR de la pestaña «Instalar» se genera dentro de tu navegador con una librería de código
          abierto. La dirección de la app no se envía a ningún servicio externo de códigos QR. Instalar Pushidea es
          agregarla a tu pantalla de inicio: no pasa por tiendas ni requiere cuenta.
        </p>
      </Seccion>

      <Seccion titulo="Permisos y temas prohibidos">
        <p>
          Pushidea no pide permisos de cámara, micrófono, ubicación, contactos ni notificaciones. El navegador
          tiene esos permisos desactivados para esta app por política de seguridad.
        </p>
        <p>
          Esta app no propone pagos, transferencias, cuentas ni bancos. Si una idea generada menciona esos temas,
          se descarta antes de mostrarla.
        </p>
      </Seccion>

      <Seccion titulo="Tus controles: borrar todo">
        <p>
          Puedes quitar las ideas guardadas una por una, vaciar el historial de vistas desde Ajustes sin tocar lo
          que marcaste, y borrar la caché de fuentes públicas con el botón de abajo. Para eliminar absolutamente
          todo, borra los datos del sitio desde los ajustes de tu navegador: se va todo, porque todo vive ahí.
        </p>
        <button
          type="button"
          onClick={() => cacheClear()}
          className="press h-12 rounded-2xl border border-line px-4 text-sm font-medium text-fg"
        >
          Borrar caché de fuentes públicas
        </button>
      </Seccion>

      <Seccion titulo="Cambios y contacto">
        <p>
          Si esta política cambia, se actualizará la versión y la fecha en esta misma pestaña antes de que el
          cambio aplique. Pushidea es un proyecto abierto: puedes revisar el código, reportar un problema de
          privacidad o pedir la eliminación de cualquier dato escribiendo en{" "}
          <a
            href="https://github.com/muecojulio/pushidea/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline-offset-2 hover:underline"
          >
            github.com/muecojulio/pushidea
          </a>
          . Como no guardamos datos en servidores propios, casi siempre la respuesta será ayudarte a borrarlos de
          tu dispositivo.
        </p>
      </Seccion>
    </div>
  );
}
