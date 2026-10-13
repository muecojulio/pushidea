import { useState } from "react";
import { Database, EyeOff, Lock, ScrollText, ShieldCheck, Trash2, Waypoints } from "lucide-react";
import { useAviso } from "@/components/ui/use-aviso";
import { Boton, type EstadoBoton } from "@/components/ui/boton";
import { Plegable } from "@/components/ui/plegable";
import { cacheClear } from "@/lib/apis/cache";
import { vars } from "@/lib/ui/cn";

/** Botón que borra la caché local de las fuentes públicas, con su estado. */
function BorrarCache() {
  const anunciar = useAviso();
  const [estado, setEstado] = useState<EstadoBoton>("inactivo");

  function borrar() {
    try {
      cacheClear();
      setEstado("exito");
      anunciar("Caché de fuentes públicas borrada de este dispositivo", "exito");
    } catch {
      setEstado("error");
      anunciar("El navegador no dejó borrar la caché", "error");
    }
    window.setTimeout(() => setEstado("inactivo"), 2200);
  }

  return (
    <Boton
      variante="secundario"
      estado={estado}
      onClick={borrar}
      hue="#e2725b"
      icono={<Trash2 className="size-4" aria-hidden="true" />}
    >
      {estado === "exito" ? "Caché borrada" : "Borrar caché de fuentes públicas"}
    </Boton>
  );
}

/**
 * Política de privacidad de Pushidea (versión 1.1, 13 de octubre de 2026).
 * Es también el texto que se enlaza desde la tienda/perfil si algún día se publica.
 * Cada apartado es un panel plegable: el primero llega abierto.
 */
export function PrivacidadContenido() {
  return (
    <div className="space-y-4">
      <div className="tarjeta p-5 lg:p-6" style={vars({ "--hue": "#4fc08a" })}>
        <span
          aria-hidden="true"
          className="relative flex size-12 items-center justify-center rounded-2xl bg-jade/15 text-jade"
        >
          <span className="absolute inset-0 animate-respirar rounded-2xl bg-jade/20 blur-lg" />
          <ShieldCheck className="relative size-6" />
        </span>
        <h1 className="font-display mt-4 text-4xl leading-none text-fg">Privacidad</h1>
        <p className="mt-2.5 text-xs text-muted">
          Política de privacidad · Versión 1.1 · 13 de octubre de 2026
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
          Pushidea genera ideas de aplicaciones para la vida diaria. No pide cuenta, no tiene
          anuncios y no vende datos. Esta página explica, sin letra chica, qué se guarda, qué sale
          de tu dispositivo y qué puedes borrar.
        </p>
        <ul className="mt-5 grid gap-2.5 sm:grid-cols-3">
          {[
            {
              icono: <EyeOff className="size-4" aria-hidden="true" />,
              texto: "Sin cuenta ni correo",
            },
            {
              icono: <Lock className="size-4" aria-hidden="true" />,
              texto: "Todo vive en tu dispositivo",
            },
            {
              icono: <Trash2 className="size-4" aria-hidden="true" />,
              texto: "Se borra cuando tú digas",
            },
          ].map((item) => (
            <li
              key={item.texto}
              className="flex items-center gap-2.5 rounded-2xl border border-line bg-surface/70 px-3.5 py-3 text-xs text-fg"
            >
              <span className="text-jade">{item.icono}</span>
              {item.texto}
            </li>
          ))}
        </ul>
      </div>

      <Plegable
        nivel={2}
        abiertoInicial
        titulo="Lo que se guarda en tu dispositivo"
        subtitulo="Ideas guardadas, historial de vistas, última idea y ajustes"
        icono={<Database className="size-4.5" aria-hidden="true" />}
        hue="#93c95f"
      >
        <div className="space-y-3 text-sm leading-relaxed text-muted">
          <p>
            Las ideas que guardas, el historial de las que ya viste, la última idea mostrada y tus
            ajustes viven solo en este teléfono o computadora, en el almacenamiento local del
            navegador. No hay una base de datos compartida con tus ideas: cualquiera podría leer o
            borrar ideas ajenas si estuvieran en un tablero público.
          </p>
          <p>
            También se guarda una caché con las respuestas de las fuentes públicas (consejos,
            artículos, libros y repositorios) para no pedirlas dos veces y para mostrarlas sin
            conexión. Esa caché caduca sola en un máximo de 30 días.
          </p>
        </div>
      </Plegable>

      <Plegable
        nivel={2}
        titulo="«Ideas en vivo»: qué sale y qué no"
        subtitulo="Solo el ámbito elegido y los títulos ya vistos"
        icono={<Waypoints className="size-4.5" aria-hidden="true" />}
        hue="#4fc08a"
      >
        <p className="text-sm leading-relaxed text-muted">
          Con «Ideas en vivo» apagado, nada sale del dispositivo. Con el interruptor activo, cada
          toque envía únicamente el ámbito elegido (p. ej. «cocina») y los títulos ya mostrados,
          para no repetir. No se envían contactos, ubicación, notas ni el contenido de tus ideas
          guardadas. La clave de ese servicio vive en el servidor y nunca viaja a tu teléfono.
        </p>
      </Plegable>

      <Plegable
        nivel={2}
        titulo="APIs públicas sin cuenta"
        subtitulo="Advice Slip, MyMemory, Wikipedia, Open Library y GitHub"
        icono={<Waypoints className="size-4.5" aria-hidden="true" />}
        hue="#6a9df0"
      >
        <div className="space-y-3 text-sm leading-relaxed text-muted">
          <p>
            Para profundizar en cada idea, Pushidea consulta servicios públicos y gratuitos que no
            piden clave ni registro. A todos ellos solo les llega el término del ámbito (p. ej.
            «cocina casera»), nunca tus datos:
          </p>
          <ul className="space-y-2.5">
            {[
              [
                "Advice Slip",
                "api.adviceslip.com",
                "devuelve un consejo breve. No recibe ningún dato tuyo, solo la petición del consejo.",
              ],
              [
                "MyMemory",
                "api.mymemory.translated.net",
                "traduce ese consejo al español. Solo recibe el texto del consejo en inglés.",
              ],
              [
                "Wikipedia en español",
                "es.wikipedia.org",
                "recibe el término del ámbito y devuelve un artículo relacionado.",
              ],
              [
                "Open Library",
                "openlibrary.org",
                "recibe el término del ámbito y devuelve libros reales sobre ese tema.",
              ],
              [
                "GitHub",
                "api.github.com",
                "recibe el término del ámbito y devuelve repositorios públicos populares, para inspirarte. Sin cuenta ni token.",
              ],
            ].map(([nombre, dominio, uso]) => (
              <li key={nombre} className="rounded-2xl border border-line bg-surface/60 px-3.5 py-3">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-sm font-semibold text-fg">{nombre}</span>
                  <span className="text-xs text-accent">{dominio}</span>
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-muted">{uso}</span>
              </li>
            ))}
          </ul>
          <p>
            Esos servicios pueden ver la dirección IP de tu conexión, como cualquier sitio web que
            visitas. Pushidea no les manda identificadores, cookies de seguimiento ni información de
            tu dispositivo más allá de lo que tu navegador envía normalmente.
          </p>
        </div>
      </Plegable>

      <Plegable
        nivel={2}
        titulo="Código QR e instalación"
        subtitulo="El QR se dibuja en tu navegador"
        icono={<Lock className="size-4.5" aria-hidden="true" />}
        hue="#e08a4f"
      >
        <p className="text-sm leading-relaxed text-muted">
          El código QR de la pestaña «Instalar» se genera dentro de tu navegador con una librería de
          código abierto. La dirección de la app no se envía a ningún servicio externo de códigos
          QR. Instalar Pushidea es agregarla a tu pantalla de inicio: no pasa por tiendas ni
          requiere cuenta.
        </p>
      </Plegable>

      <Plegable
        nivel={2}
        titulo="Permisos y temas prohibidos"
        subtitulo="Ni cámara, ni ubicación, ni pagos"
        icono={<ShieldCheck className="size-4.5" aria-hidden="true" />}
        hue="#e2725b"
      >
        <div className="space-y-3 text-sm leading-relaxed text-muted">
          <p>
            Pushidea no pide permisos de cámara, micrófono, ubicación, contactos ni notificaciones.
            El navegador tiene esos permisos desactivados para esta app por política de seguridad.
          </p>
          <p>
            Esta app no propone pagos, transferencias, cuentas ni bancos. Si una idea generada
            menciona esos temas, se descarta antes de mostrarla.
          </p>
        </div>
      </Plegable>

      <Plegable
        nivel={2}
        titulo="Tus controles: borrar todo"
        subtitulo="Una idea, el historial o la caché entera"
        icono={<Trash2 className="size-4.5" aria-hidden="true" />}
        hue="#f08a97"
      >
        <div className="space-y-4 text-sm leading-relaxed text-muted">
          <p>
            Puedes quitar las ideas guardadas una por una, vaciar el historial de vistas desde
            Ajustes sin tocar lo que marcaste, y borrar la caché de fuentes públicas con el botón de
            abajo. Para eliminar absolutamente todo, borra los datos del sitio desde los ajustes de
            tu navegador: se va todo, porque todo vive ahí.
          </p>
          <BorrarCache />
        </div>
      </Plegable>

      <Plegable
        nivel={2}
        titulo="Cambios y contacto"
        subtitulo="Proyecto abierto en GitHub"
        icono={<ScrollText className="size-4.5" aria-hidden="true" />}
        hue="#a98bf0"
      >
        <p className="text-sm leading-relaxed text-muted">
          Si esta política cambia, se actualizará la versión y la fecha en esta misma pestaña antes
          de que el cambio aplique. Pushidea es un proyecto abierto: puedes revisar el código,
          reportar un problema de privacidad o pedir la eliminación de cualquier dato escribiendo en{" "}
          <a
            href="https://github.com/muecojulio/pushidea/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="press inline-flex min-h-11 items-center rounded-lg text-accent underline-offset-4 hover:text-gold hover:underline"
          >
            github.com/muecojulio/pushidea
          </a>
          . Como no guardamos datos en servidores propios, casi siempre la respuesta será ayudarte a
          borrarlos de tu dispositivo.
        </p>
      </Plegable>
    </div>
  );
}
