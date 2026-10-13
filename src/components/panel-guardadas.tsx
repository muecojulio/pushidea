import { useMemo } from "react";
import { BookmarkX, ExternalLink, Hand, Search, Sparkles, Trash2 } from "lucide-react";
import { useAviso } from "@/components/ui/use-aviso";
import { Boton } from "@/components/ui/boton";
import { Carrusel } from "@/components/ui/carrusel";
import { Chip } from "@/components/ui/chip";
import { Combobox, type OpcionCombo } from "@/components/ui/combobox";
import { Deslizable, type AccionDeslizable } from "@/components/ui/deslizable";
import { Riel } from "@/components/ui/riel";
import { norm } from "@/lib/ideas/guard";
import type { AreaFilter } from "@/lib/ideas/pick";
import { usePushidea } from "@/lib/ideas/store";
import { AREAS, AREA_LABEL, FOCUS_LABEL, type Idea } from "@/lib/ideas/types";
import { cn, vars } from "@/lib/ui/cn";
import { temaDe } from "@/lib/ui/tema";

/**
 * Pestaña Guardadas: búsqueda con combobox accesible, filtro por ámbito en
 * carril de chips y las ideas en carrusel (móvil) o cuadrícula (escritorio).
 * Cada tarjeta se puede deslizar para revelar acciones y tiene además un
 * control explícito para abrirlas.
 */
type Props = {
  onAbrir: (idea: Idea) => void;
  /** El filtro lo guarda quien monta el panel: sobrevive a cambiar de pestaña. */
  query: string;
  onQuery: (query: string) => void;
  area: AreaFilter;
  onArea: (area: AreaFilter) => void;
};

export function PanelGuardadas({ onAbrir, query, onQuery, area, onArea }: Props) {
  const saved = usePushidea((state) => state.saved);
  const current = usePushidea((state) => state.current);
  const removeSaved = usePushidea((state) => state.removeSaved);
  const anunciar = useAviso();

  const todas = useMemo(
    () => Object.values(saved).sort((a, b) => a.title.localeCompare(b.title, "es")),
    [saved],
  );

  const porArea = useMemo(
    () => todas.filter((idea) => area === "cualquiera" || idea.area === area),
    [todas, area],
  );

  const visibles = useMemo(() => {
    const consulta = norm(query);
    if (!consulta) return porArea;
    return porArea.filter((idea) =>
      norm(`${idea.title} ${idea.description} ${idea.problem} ${idea.forWhom}`).includes(consulta),
    );
  }, [porArea, query]);

  const opciones = useMemo<OpcionCombo[]>(
    () =>
      porArea.map((idea) => ({
        id: idea.id,
        etiqueta: idea.title,
        detalle: `${AREA_LABEL[idea.area]} · ${FOCUS_LABEL[idea.focus]}`,
        glifo: temaDe(idea.area).emoji,
        hue: temaDe(idea.area).hue,
      })),
    [porArea],
  );

  function quitar(idea: Idea) {
    removeSaved(idea.id);
    anunciar(`«${idea.title}» salió de guardadas`, "neutro", {
      etiqueta: "Deshacer",
      onClick: () => {
        usePushidea.getState().toggleSave(idea);
        anunciar(`«${idea.title}» volvió a guardadas`, "exito");
      },
    });
  }

  function limpiarFiltros() {
    onQuery("");
    onArea("cualquiera");
    anunciar("Filtros en limpio", "neutro");
  }

  const hayFiltros = query.trim().length > 0 || area !== "cualquiera";

  return (
    <section className="lg:grid lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)] lg:items-start lg:gap-8">
      <div className="lg:sticky lg:top-6">
        <Combobox
          etiqueta="Buscar en tus guardadas"
          etiquetaLista="ideas guardadas"
          texto={query}
          onTexto={onQuery}
          opciones={opciones}
          valor={current?.id ?? null}
          onElegir={(id) => {
            const idea = todas.find((item) => item.id === id);
            if (idea) {
              onAbrir(idea);
              anunciar(`Abriendo «${idea.title}»`, "neutro");
            }
          }}
          placeholder="Título, problema o para quién es"
          ayuda="Escribe para filtrar lo de abajo, o elige una idea de la lista para abrirla."
          mensajeVacio={
            todas.length === 0
              ? "Todavía no hay ideas guardadas."
              : "Ninguna guardada coincide con eso."
          }
        />

        <div className="mt-5">
          <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-muted uppercase">
            Filtrar por ámbito
          </p>
          <Riel etiqueta="Filtros por ámbito" pista="Desliza" centrarCuando={area} className="mt-2">
            <Chip
              activo={area === "cualquiera"}
              hue={temaDe("cualquiera").hue}
              glifo={temaDe("cualquiera").emoji}
              onClick={() => onArea("cualquiera")}
            >
              Todas
            </Chip>
            {AREAS.map((item) => (
              <Chip
                key={item.id}
                activo={area === item.id}
                hue={temaDe(item.id).hue}
                glifo={temaDe(item.id).emoji}
                onClick={() => onArea(item.id)}
              >
                {item.label}
              </Chip>
            ))}
          </Riel>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-muted">
            {visibles.length === todas.length
              ? `${todas.length} ${todas.length === 1 ? "idea guardada" : "ideas guardadas"} en este dispositivo`
              : `${visibles.length} de ${todas.length} ideas guardadas`}
          </p>
          {hayFiltros ? (
            <Boton variante="fantasma" onClick={limpiarFiltros} className="min-h-11 px-3 text-xs">
              Limpiar
            </Boton>
          ) : null}
        </div>
      </div>

      <div className="mt-7 lg:mt-0">
        {todas.length === 0 ? (
          <VacioGuardadas />
        ) : visibles.length === 0 ? (
          <div className="tarjeta rise p-6 text-center" style={vars({ "--hue": "#6a9df0" })}>
            <span
              aria-hidden="true"
              className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-azure/15 text-azure"
            >
              <Search className="size-6" />
            </span>
            <h2 className="font-display mt-4 text-2xl text-fg">Nada coincide con esa búsqueda</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
              Prueba con otra palabra o quita el filtro de ámbito. Tus ideas siguen guardadas en
              este teléfono.
            </p>
            <Boton
              variante="secundario"
              hue="#6a9df0"
              className="mx-auto mt-4"
              onClick={limpiarFiltros}
            >
              Quitar filtros
            </Boton>
          </div>
        ) : (
          <Carrusel
            elementos={visibles}
            clave={(idea) => idea.id}
            etiqueta="Ideas guardadas"
            anchoMovil="w-[88%]"
            render={(idea) => (
              <TarjetaGuardada
                idea={idea}
                abierta={idea.id === current?.id}
                onAbrir={onAbrir}
                onQuitar={quitar}
              />
            )}
          />
        )}
      </div>
    </section>
  );
}

function TarjetaGuardada({
  idea,
  abierta,
  onAbrir,
  onQuitar,
}: {
  idea: Idea;
  /** Es la idea abierta ahora mismo en «Generar»: se marca sin depender del color. */
  abierta: boolean;
  onAbrir: (idea: Idea) => void;
  onQuitar: (idea: Idea) => void;
}) {
  const tema = temaDe(idea.area);
  const acciones: AccionDeslizable[] = [
    {
      id: "abrir",
      etiqueta: "Abrir",
      tono: "neutro",
      icono: <ExternalLink className="size-4" aria-hidden="true" />,
      onClick: () => onAbrir(idea),
    },
    {
      id: "quitar",
      etiqueta: "Quitar",
      tono: "peligro",
      icono: <Trash2 className="size-4" aria-hidden="true" />,
      onClick: () => onQuitar(idea),
    },
  ];

  return (
    <Deslizable nombre={idea.title} acciones={acciones} hue={tema.hue} className="h-full">
      <article
        aria-current={abierta ? "true" : undefined}
        className={cn(
          "tarjeta tarjeta-elevable flex flex-1 flex-col p-4 pr-16",
          abierta && "tarjeta-marcada",
        )}
        style={vars({ "--hue": tema.hue })}
      >
        <span className="flex items-center gap-2 text-[0.6875rem] tracking-wide text-muted uppercase">
          {abierta ? (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[0.625rem] font-semibold tracking-wide text-ink uppercase">
              Abierta ahora
            </span>
          ) : null}
          <span aria-hidden="true" className="text-sm">
            {tema.emoji}
          </span>
          {AREA_LABEL[idea.area]}
          <span aria-hidden="true" className="text-line">
            •
          </span>
          {FOCUS_LABEL[idea.focus]}
        </span>

        <h3 className="font-display mt-2 text-xl leading-tight text-fg">{idea.title}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">
          {idea.description}
        </p>

        <p
          aria-hidden="true"
          className="mt-3.5 flex items-center gap-1.5 text-[0.6875rem] text-muted md:hidden"
        >
          <Hand className="size-3.5" aria-hidden="true" />
          Desliza la tarjeta para quitarla
        </p>
      </article>
    </Deslizable>
  );
}

function VacioGuardadas() {
  return (
    <div className="tarjeta rise p-6 lg:p-8" style={vars({ "--hue": "#93c95f" })}>
      <span
        aria-hidden="true"
        className="relative flex size-16 items-center justify-center rounded-3xl bg-moss/15 text-moss"
      >
        <span className="absolute inset-0 animate-respirar rounded-3xl bg-moss/20 blur-lg" />
        <BookmarkX className="relative size-7" />
      </span>
      <h2 className="font-display mt-5 text-3xl leading-tight text-fg">
        Todavía no guardas ninguna
      </h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
        Cuando una idea te sirva, márcala con «Guardar» y se queda aquí, en este dispositivo. No hay
        cuenta, nube ni sincronización: lo que guardas es tuyo y de nadie más.
      </p>
      <p className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span className="rounded-full border border-line bg-surface px-3 py-1.5">
          <Sparkles className="mr-1.5 inline size-3.5 text-accent" aria-hidden="true" />
          Guarda las que te sirvan
        </span>
        <span className="rounded-full border border-line bg-surface px-3 py-1.5">
          Búscalas por título o problema
        </span>
        <span className="rounded-full border border-line bg-surface px-3 py-1.5">
          Fíltralas por ámbito
        </span>
      </p>
      <p className="mt-5 text-xs leading-relaxed text-muted">
        Sugerencia: en la pestaña Generar, cada idea trae un botón «Guardar» y otro «Copiar» para
        llevártela a donde la vayas a construir.
      </p>
    </div>
  );
}
