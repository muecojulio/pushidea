import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  BookOpen,
  Code2,
  ExternalLink,
  Github,
  Library,
  Lightbulb,
  Star,
  WifiOff,
} from "lucide-react";
import { useAviso } from "@/components/ui/use-aviso";
import { Boton } from "@/components/ui/boton";
import { Plegable } from "@/components/ui/plegable";
import { Riel } from "@/components/ui/riel";
import { obtenerConsejo, obtenerRecursos, type Recursos } from "@/lib/apis/publicas";
import { cn, vars } from "@/lib/ui/cn";
import { temaDe } from "@/lib/ui/tema";
import type { Area } from "@/lib/ideas/types";

type Estado = "idle" | "cargando" | "listo" | "error";

function Enlace({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="press inline-flex min-h-11 items-center gap-1.5 rounded-lg text-accent underline-offset-4 hover:text-gold hover:underline"
    >
      {children}
      <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
    </a>
  );
}

/** Consejo breve para crear hoy: Advice Slip traducido con MyMemory (sin clave). */
export function ConsejoDelDia() {
  const anunciar = useAviso();
  const [consejo, setConsejo] = useState<string | null>(null);
  const [estado, setEstado] = useState<Estado>("idle");

  const cargar = useCallback(
    async (forzar: boolean) => {
      setEstado("cargando");
      try {
        const data = await obtenerConsejo(forzar);
        setConsejo(data.texto);
        setEstado("listo");
        if (forzar) anunciar("Otro consejo listo", "exito");
      } catch {
        setEstado("error");
      }
    },
    [anunciar],
  );

  useEffect(() => {
    void cargar(false);
  }, [cargar]);

  if (!consejo && estado !== "error") return null;

  return (
    <div className="tarjeta flex gap-3.5 p-4" style={vars({ "--hue": "#f2c14e" })}>
      <span
        aria-hidden="true"
        className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl"
        style={{ background: "color-mix(in oklab, #f2c14e 18%, #232821)" }}
      >
        <span className="absolute inset-0 animate-destello rounded-2xl bg-gold/20 blur-md" />
        <Lightbulb className="relative size-5 text-gold" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-muted uppercase">
          Consejo para crear hoy
        </p>
        <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-fg">{consejo}</p>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          Consejo público de Advice Slip, traducido en tu dispositivo.
        </p>
      </div>
      <Boton
        variante="fantasma"
        tamano="icono"
        estado={estado === "cargando" ? "cargando" : estado === "error" ? "error" : "inactivo"}
        onClick={() => void cargar(true)}
        aria-label="Pedir otro consejo"
        className="size-11 shrink-0 border border-line"
        icono={
          estado === "error" ? (
            <WifiOff className="size-4" aria-hidden="true" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
              <path
                d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4h-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )
        }
      />
    </div>
  );
}

function Esqueleto({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("esqueleto block", className)} />;
}

/**
 * Recursos reales y gratuitos para convertir la idea en algo: un artículo de
 * Wikipedia, libros de Open Library (con portada) y repositorios públicos de
 * GitHub en carril horizontal.
 *
 * Solo se envía el ámbito de la idea; nada de lo guardado en el teléfono. Se
 * carga al abrir el panel, no antes, y avisa con esqueletos, error y reintento.
 */
export function RecursosIdea({ area }: { area: Area }) {
  const anunciar = useAviso();
  const [abierto, setAbierto] = useState(false);
  const [estado, setEstado] = useState<Estado>("idle");
  const [recursos, setRecursos] = useState<Recursos | null>(null);
  const tema = temaDe(area);

  async function cargar() {
    setEstado("cargando");
    try {
      const data = await obtenerRecursos(area);
      setRecursos(data);
      setEstado("listo");
    } catch {
      setEstado("error");
      anunciar("Sin conexión con las fuentes públicas", "error");
    }
  }

  function alternar(siguiente: boolean) {
    setAbierto(siguiente);
    if (siguiente && (estado === "idle" || estado === "error")) void cargar();
  }

  return (
    <Plegable
      abierto={abierto}
      onCambio={alternar}
      hue={tema.hue}
      className="tarjeta-suave mt-5"
      icono={<BookOpen className="size-4.5" aria-hidden="true" />}
      titulo="Profundizar: lecturas y proyectos reales"
      subtitulo={
        estado === "listo"
          ? "Wikipedia, Open Library y GitHub, sin cuenta"
          : estado === "error"
            ? "No se pudo cargar · toca para reintentar"
            : "Se abre con fuentes públicas, gratis y sin registro"
      }
      etiquetaControl="Profundizar en esta idea con lecturas y proyectos reales"
    >
      <div className="space-y-5 pt-1">
        <p className="text-xs leading-relaxed text-muted">
          Solo sale de tu teléfono el ámbito de la idea; tus guardadas no se comparten. Revisa la
          licencia de cada repositorio antes de copiar código.
        </p>

        {estado === "cargando" ? (
          <div className="flex gap-2.5 overflow-hidden">
            <Esqueleto className="h-32 w-40 shrink-0" />
            <Esqueleto className="h-32 w-40 shrink-0" />
            <Esqueleto className="h-32 w-24 shrink-0" />
          </div>
        ) : null}

        {estado === "error" ? (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-peligro/40 bg-peligro/10 px-3.5 py-3">
            <p className="min-w-0 flex-1 text-sm text-fg">
              Sin conexión con las fuentes públicas ahora mismo. Puedes reintentar o seguir con la
              idea.
            </p>
            <Boton
              variante="secundario"
              hue={tema.hue}
              onClick={() => void cargar()}
              icono={<WifiOff className="size-4" />}
            >
              Reintentar
            </Boton>
          </div>
        ) : null}

        {estado === "listo" && recursos ? (
          <>
            {recursos.wikipedia ? (
              <div>
                <p className="flex items-center gap-2 text-[0.6875rem] font-semibold tracking-[0.14em] text-muted uppercase">
                  <Library className="size-3.5" aria-hidden="true" />
                  Contexto
                </p>
                <p className="font-display mt-2 text-xl leading-tight text-fg">
                  {recursos.wikipedia.titulo}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {recursos.wikipedia.extracto}
                </p>
                <Enlace href={recursos.wikipedia.url}>Leer en Wikipedia</Enlace>
              </div>
            ) : null}

            {recursos.libros.length > 0 ? (
              <div>
                <p className="flex items-center gap-2 text-[0.6875rem] font-semibold tracking-[0.14em] text-muted uppercase">
                  <BookOpen className="size-3.5" aria-hidden="true" />
                  Libros para inspirarte
                </p>
                <Riel etiqueta="Libros sobre este ámbito" className="mt-2.5" flechas={false}>
                  {recursos.libros.map((libro) => (
                    <a
                      key={libro.url}
                      href={libro.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tarjeta tarjeta-elevable w-40 p-2.5"
                      style={vars({ "--hue": tema.hue })}
                    >
                      {libro.portada ? (
                        <img
                          src={libro.portada}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="h-36 w-full rounded-xl bg-raised object-cover"
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="flex h-36 w-full items-center justify-center rounded-xl text-3xl"
                          style={{ background: `color-mix(in oklab, ${tema.hue} 16%, #232821)` }}
                        >
                          📖
                        </span>
                      )}
                      <span className="mt-2 block text-sm leading-snug font-medium text-fg">
                        <span className="line-clamp-2">{libro.titulo}</span>
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-muted">
                        {libro.autor}
                        {libro.anio ? ` · ${libro.anio}` : ""}
                      </span>
                    </a>
                  ))}
                </Riel>
              </div>
            ) : null}

            {recursos.repos.length > 0 ? (
              <div>
                <p className="flex items-center gap-2 text-[0.6875rem] font-semibold tracking-[0.14em] text-muted uppercase">
                  <Code2 className="size-3.5" aria-hidden="true" />
                  Proyectos abiertos en GitHub
                </p>
                <Riel
                  etiqueta="Repositorios públicos para inspirarse"
                  className="mt-2.5"
                  flechas={false}
                >
                  {recursos.repos.map((repo) => (
                    <a
                      key={repo.url}
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tarjeta tarjeta-elevable flex w-64 flex-col p-3.5"
                      style={vars({ "--hue": tema.hue })}
                    >
                      <span className="flex items-center gap-2 text-xs text-muted">
                        <Github className="size-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{repo.nombre}</span>
                      </span>
                      <span className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-fg">
                        {repo.descripcion || "Sin descripción en el repositorio."}
                      </span>
                      <span className="mt-3 flex items-center gap-2 text-xs text-muted">
                        <span className="inline-flex items-center gap-1 rounded-full bg-raised px-2 py-1 text-gold">
                          <Star className="size-3" aria-hidden="true" />
                          {repo.estrellas.toLocaleString("es")}
                        </span>
                        {repo.licencia ? (
                          <span className="truncate rounded-full bg-raised px-2 py-1">
                            {repo.licencia}
                          </span>
                        ) : null}
                        <ExternalLink className="ml-auto size-3.5 shrink-0" aria-hidden="true" />
                      </span>
                    </a>
                  ))}
                </Riel>
              </div>
            ) : null}

            {!recursos.wikipedia && recursos.libros.length === 0 && recursos.repos.length === 0 ? (
              <p className="text-sm text-muted">
                Las fuentes públicas no devolvieron nada para este ámbito.
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </Plegable>
  );
}
