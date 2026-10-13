import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck, Copy, Share2 } from "lucide-react";
import { RecursosIdea } from "@/components/recursos-idea";
import { useAviso } from "@/components/ui/use-aviso";
import { Boton, type EstadoBoton } from "@/components/ui/boton";
import { cn, vars } from "@/lib/ui/cn";
import { AREA_LABEL, FOCUS_LABEL, type Idea } from "@/lib/ideas/types";
import { temaDe } from "@/lib/ui/tema";

/** Texto compartido al guardar o copiar una idea. */
function textoDe(idea: Idea): string {
  return [
    idea.title,
    `${AREA_LABEL[idea.area]} · ${FOCUS_LABEL[idea.focus]}`,
    `Para: ${idea.forWhom}`,
    idea.problem,
    idea.description,
    ...idea.steps.map((paso, indice) => `${indice + 1}. ${paso}`),
  ].join("\n\n");
}

const CHISPAS = [
  { dx: "-22px", dy: "-24px" },
  { dx: "-8px", dy: "-32px" },
  { dx: "8px", dy: "-30px" },
  { dx: "22px", dy: "-22px" },
  { dx: "-28px", dy: "-8px" },
  { dx: "28px", dy: "-10px" },
  { dx: "-14px", dy: "-38px" },
  { dx: "16px", dy: "-36px" },
];

/** Estallido breve al guardar: refuerzo físico, decorativo y con movimiento reducido apagado. */
function Chispas({ momento }: { momento: number }) {
  if (!momento) return null;
  return (
    <span key={momento} className="chispas" aria-hidden="true">
      {CHISPAS.map((chispa, indice) => (
        <span
          key={indice}
          className="chispa"
          style={vars({ "--dx": chispa.dx, "--dy": chispa.dy, animationDelay: `${indice * 18}ms` })}
        />
      ))}
    </span>
  );
}

type Props = {
  idea: Idea;
  saved: boolean;
  onToggle: () => void;
};

/**
 * Ficha de la idea: la pieza central de la app. Entra escalonada, se tiñe con
 * el matiz del ámbito y reúne las acciones con sus estados (cargando, éxito,
 * error) y sus avisos accesibles.
 */
export function IdeaTarjeta({ idea, saved, onToggle }: Props) {
  const anunciar = useAviso();
  const tema = temaDe(idea.area);
  const [estadoCopiar, setEstadoCopiar] = useState<EstadoBoton>("inactivo");
  const [estadoCompartir, setEstadoCompartir] = useState<EstadoBoton>("inactivo");
  const [chispas, setChispas] = useState(0);
  const [puedeCompartir, setPuedeCompartir] = useState(false);
  const [guardadaAntes, setGuardadaAntes] = useState(saved);

  useEffect(() => {
    setPuedeCompartir(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  // Al pasar de «sin guardar» a «guardada» salta el estallido y se retira solo.
  useEffect(() => {
    if (saved && !guardadaAntes) {
      setChispas(Date.now());
      const timer = setTimeout(() => setChispas(0), 760);
      setGuardadaAntes(saved);
      return () => clearTimeout(timer);
    }
    setGuardadaAntes(saved);
  }, [saved, guardadaAntes]);

  async function copiar(silencioso = false) {
    setEstadoCopiar("cargando");
    try {
      await navigator.clipboard.writeText(textoDe(idea));
      setEstadoCopiar("exito");
      if (!silencioso) anunciar(`«${idea.title}» copiada al portapapeles`, "exito");
      setTimeout(() => setEstadoCopiar("inactivo"), 1800);
    } catch {
      setEstadoCopiar("error");
      anunciar("El navegador no dejó copiar la idea", "error");
      setTimeout(() => setEstadoCopiar("inactivo"), 2200);
    }
  }

  async function compartir() {
    setEstadoCompartir("cargando");
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: `Pushidea · ${idea.title}`, text: textoDe(idea) });
        setEstadoCompartir("exito");
        anunciar("Idea compartida", "exito");
      } else {
        await copiar(true);
        setEstadoCompartir("exito");
        anunciar("Sin panel de compartir en este navegador: la idea quedó copiada", "aviso");
      }
      setTimeout(() => setEstadoCompartir("inactivo"), 1800);
    } catch {
      // Cancelar el panel del sistema no es un error: vuelve al estado inicial.
      setEstadoCompartir("inactivo");
    }
  }

  function alternarGuardado() {
    onToggle();
    anunciar(
      saved
        ? `«${idea.title}» ya no está en guardadas`
        : `«${idea.title}» guardada en este dispositivo`,
      saved ? "neutro" : "exito",
    );
  }

  return (
    <article
      className="tarjeta tarjeta-elevable rise p-5 lg:p-6"
      style={vars({ "--hue": tema.hue })}
      aria-labelledby={`titulo-${idea.id}`}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-xl"
          style={{
            background: `color-mix(in oklab, ${tema.hue} 22%, #232821)`,
            boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${tema.hue} 45%, transparent)`,
          }}
        >
          {tema.emoji}
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{
              background: `color-mix(in oklab, ${tema.hue} 20%, transparent)`,
              color: tema.hue,
            }}
          >
            {AREA_LABEL[idea.area]}
          </span>
          <span className="inline-flex items-center rounded-full bg-raised px-2.5 py-1 text-xs font-medium text-muted">
            {FOCUS_LABEL[idea.focus]}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted">
            {idea.source === "ia" ? (
              <>
                <span className="punto-vivo inline-block size-1.5" aria-hidden="true" />
                Recién pensada
              </>
            ) : (
              "Archivo local"
            )}
          </span>
        </div>
        {puedeCompartir ? (
          <Boton
            variante="fantasma"
            tamano="icono"
            estado={estadoCompartir}
            onClick={() => void compartir()}
            aria-label={`Compartir la idea ${idea.title}`}
            className="size-11 shrink-0 border border-line"
            icono={<Share2 className="size-4" aria-hidden="true" />}
          />
        ) : null}
      </div>

      <h2
        id={`titulo-${idea.id}`}
        className="font-display mt-4 text-3xl leading-[1.08] font-medium text-fg lg:text-[2.6rem]"
      >
        {idea.title}
      </h2>
      <svg
        aria-hidden="true"
        viewBox="0 0 240 10"
        preserveAspectRatio="none"
        className="mt-2 h-2.5 w-44 max-w-full overflow-visible text-accent"
      >
        <path
          d="M2 6.5C42 1.5 68 9 112 5.5S196 1.5 238 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="subrayado-trazo"
          style={vars({ "--largo": "270" })}
        />
      </svg>

      <p className="mt-4 text-base leading-relaxed text-fg">{idea.forWhom}</p>
      <p
        className="mt-3 rounded-2xl border-l-2 py-2 pl-3.5 text-sm leading-relaxed text-muted"
        style={{ borderColor: tema.hue }}
      >
        {idea.problem}
      </p>
      <p className="mt-4 text-base leading-relaxed text-fg/95">{idea.description}</p>

      <ol className="mt-6 space-y-3.5">
        {idea.steps.map((paso, indice) => (
          <li
            key={paso}
            className={cn(
              "relative flex gap-3.5 rise text-sm leading-relaxed text-fg",
              `d${Math.min(indice + 1, 5)}`,
            )}
          >
            {indice < idea.steps.length - 1 ? (
              <span
                aria-hidden="true"
                className="absolute top-9 left-[0.9rem] h-[calc(100%-0.6rem)] w-px"
                style={{ background: `linear-gradient(180deg, ${tema.hue}66, transparent)` }}
              />
            ) : null}
            <span
              aria-hidden="true"
              className="relative flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
              style={{
                background: `color-mix(in oklab, ${tema.hue} 18%, #232821)`,
                color: tema.hue,
                boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${tema.hue} 40%, transparent)`,
              }}
            >
              {indice + 1}
            </span>
            <span className="pt-1">{paso}</span>
          </li>
        ))}
      </ol>

      <RecursosIdea area={idea.area} />

      <div className="mt-6 grid grid-cols-2 gap-3">
        <span className="relative">
          <Boton
            variante={saved ? "primario" : "secundario"}
            onClick={alternarGuardado}
            aria-pressed={saved}
            hue={tema.hue}
            className="w-full"
            icono={
              saved ? (
                <BookmarkCheck className="size-4" aria-hidden="true" />
              ) : (
                <Bookmark className="size-4" aria-hidden="true" />
              )
            }
          >
            {saved ? "Guardada" : "Guardar"}
          </Boton>
          <Chispas momento={chispas} />
        </span>
        <Boton
          variante="secundario"
          estado={estadoCopiar}
          hue={tema.hue}
          onClick={() => void copiar()}
          className="w-full"
          icono={<Copy className="size-4" aria-hidden="true" />}
          mensajeExito="Idea copiada al portapapeles"
          mensajeError="El navegador no dejó copiar la idea"
        >
          {estadoCopiar === "exito" ? "Copiada" : "Copiar"}
        </Boton>
      </div>
    </article>
  );
}
