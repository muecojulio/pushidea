import { useEffect, useState } from "react";
import { BookOpen, Code2, ExternalLink, Lightbulb, RefreshCw } from "lucide-react";
import { obtenerConsejo, obtenerRecursos, type Recursos } from "@/lib/apis/publicas";
import type { Area } from "@/lib/ideas/types";

/** Consejo breve para crear hoy: Advice Slip traducido con MyMemory (sin clave). */
export function ConsejoDelDia() {
  const [consejo, setConsejo] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function cargar(forzar: boolean) {
    setOcupado(true);
    try {
      const data = await obtenerConsejo(forzar);
      setConsejo(data.texto);
    } catch {
      setConsejo(null);
    } finally {
      setOcupado(false);
    }
  }

  useEffect(() => {
    void cargar(false);
  }, []);

  if (!consejo) return null;
  return (
    <div className="mt-6 flex gap-3 rounded-3xl border border-line bg-surface p-4">
      <Lightbulb className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-xs tracking-wide text-muted uppercase">Consejo para crear hoy</p>
        <p className="mt-1 text-sm leading-relaxed text-fg">{consejo}</p>
        <p className="mt-2 text-xs text-muted">Consejo público de Advice Slip, traducido en tu dispositivo.</p>
      </div>
      <button
        type="button"
        onClick={() => void cargar(true)}
        disabled={ocupado}
        aria-label="Otro consejo"
        className="press flex size-10 shrink-0 items-center justify-center rounded-full border border-line text-fg disabled:opacity-60"
      >
        <RefreshCw className={`size-4 ${ocupado ? "animate-spin" : ""}`} aria-hidden="true" />
      </button>
    </div>
  );
}

function Enlace({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="press inline-flex items-center gap-1 text-accent underline-offset-2 hover:underline"
    >
      {children}
      <ExternalLink className="size-3.5" aria-hidden="true" />
    </a>
  );
}

/**
 * Recursos reales y gratuitos para convertir la idea en algo: un artículo de
 * Wikipedia, libros de Open Library y repositorios públicos de GitHub.
 * Solo se envía el ámbito de la idea; nada de lo guardado en el teléfono.
 */
export function RecursosIdea({ area }: { area: Area }) {
  const [abierto, setAbierto] = useState(false);
  const [estado, setEstado] = useState<"idle" | "cargando" | "listo" | "error">("idle");
  const [recursos, setRecursos] = useState<Recursos | null>(null);

  async function cargar() {
    setAbierto(true);
    setEstado("cargando");
    try {
      setRecursos(await obtenerRecursos(area));
      setEstado("listo");
    } catch {
      setEstado("error");
    }
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => void cargar()}
        className="press mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-raised text-sm font-medium text-fg"
      >
        <BookOpen className="size-4" aria-hidden="true" />
        Profundizar: lecturas y proyectos reales
      </button>
    );
  }

  return (
    <div className="mt-4 space-y-4 rounded-3xl border border-line bg-raised/60 p-4">
      <p className="text-xs leading-relaxed text-muted">
        Fuentes públicas sin cuenta (Wikipedia, Open Library y GitHub). Solo sale de tu teléfono el ámbito de la
        idea; tus guardadas no se comparten. Revisa la licencia de cada repositorio antes de copiar código.
      </p>
      {estado === "cargando" ? <p className="text-sm text-muted">Buscando recursos…</p> : null}
      {estado === "error" ? (
        <p className="text-sm text-muted">
          Sin conexión con las fuentes públicas.{" "}
          <button type="button" onClick={() => void cargar()} className="text-accent">
            Reintentar
          </button>
        </p>
      ) : null}
      {estado === "listo" && recursos ? (
        <>
          {recursos.wikipedia ? (
            <div>
              <p className="text-sm font-medium text-fg">{recursos.wikipedia.titulo}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{recursos.wikipedia.extracto}</p>
              <p className="mt-2 text-sm">
                <Enlace href={recursos.wikipedia.url}>Leer en Wikipedia</Enlace>
              </p>
            </div>
          ) : null}
          {recursos.libros.length > 0 ? (
            <div>
              <p className="text-sm font-medium text-fg">Libros para inspirarte</p>
              <ul className="mt-2 space-y-2">
                {recursos.libros.map((libro) => (
                  <li key={libro.url} className="text-sm leading-relaxed">
                    <Enlace href={libro.url}>
                      {libro.titulo}
                      {libro.anio ? ` (${libro.anio})` : ""}
                    </Enlace>
                    <span className="text-muted"> · {libro.autor}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {recursos.repos.length > 0 ? (
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-fg">
                <Code2 className="size-4 text-accent" aria-hidden="true" />
                Proyectos abiertos en GitHub
              </p>
              <ul className="mt-2 space-y-2">
                {recursos.repos.map((repo) => (
                  <li key={repo.url} className="text-sm leading-relaxed">
                    <Enlace href={repo.url}>{repo.nombre}</Enlace>{" "}
                    <span className="text-muted">
                      ★ {repo.estrellas.toLocaleString("es")}
                      {repo.licencia ? ` · ${repo.licencia}` : ""}
                      {repo.descripcion ? ` — ${repo.descripcion}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
