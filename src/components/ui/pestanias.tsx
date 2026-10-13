import { useCallback, useEffect, type KeyboardEvent as EventoTeclado, type ReactNode } from "react";
import { desvanecer, useRiel } from "@/components/ui/use-riel";
import { useIndicador } from "@/components/ui/use-indicador";
import { cn, vars } from "@/lib/ui/cn";
import { prefiereMovimientoReducido } from "@/lib/ui/gestos";

export type Pestania = {
  id: string;
  etiqueta: string;
  icono: ReactNode;
  /** Contador visible (p. ej. ideas guardadas); se anuncia con texto aparte. */
  aviso?: number;
  etiquetaAviso?: string;
};

type Props = {
  pestanias: Pestania[];
  activa: string;
  /** Devuelve el id elegido y la dirección del cambio (-1 atrás, 1 adelante). */
  onCambiar: (id: string, direccion: -1 | 1) => void;
  etiqueta: string;
  className?: string;
};

/**
 * Pestañas del sistema: semántica `tablist`/`tab`/`tabpanel` completa, píldora
 * animada que viaja a la opción activa, foco móvil con flechas e Inicio/Fin, y
 * carril desplazable con desvanecido de bordes cuando las pestañas no caben.
 */
export function Pestanias({ pestanias, activa, onCambiar, etiqueta, className }: Props) {
  const { ref, bordes, centrar, gesto } = useRiel<HTMLDivElement>();
  const total = pestanias.length;
  const indiceActiva = Math.max(
    0,
    pestanias.findIndex((item) => item.id === activa),
  );
  const { medida, nodos, refDe } = useIndicador(indiceActiva, total);

  useEffect(() => {
    centrar((nodos.current[indiceActiva] as HTMLElement | null) ?? null);
  }, [centrar, indiceActiva, nodos]);

  const elegir = useCallback(
    (indice: number) => {
      const destino = pestanias[indice];
      if (!destino || destino.id === activa) return;
      onCambiar(destino.id, indice > indiceActiva ? 1 : -1);
    },
    [pestanias, activa, indiceActiva, onCambiar],
  );

  function onKeyDown(event: EventoTeclado<HTMLDivElement>) {
    const ultimo = total - 1;
    const mapa: Record<string, number> = {
      ArrowRight: indiceActiva >= ultimo ? 0 : indiceActiva + 1,
      ArrowDown: indiceActiva >= ultimo ? 0 : indiceActiva + 1,
      ArrowLeft: indiceActiva <= 0 ? ultimo : indiceActiva - 1,
      ArrowUp: indiceActiva <= 0 ? ultimo : indiceActiva - 1,
      Home: 0,
      End: ultimo,
    };
    const destino = mapa[event.key];
    if (destino === undefined) return;
    event.preventDefault();
    elegir(destino);
    // El foco viaja con la selección (activación automática) sin romper el orden de tabulación.
    requestAnimationFrame(() => (nodos.current[destino] as HTMLButtonElement | null)?.focus());
  }

  return (
    <div
      ref={ref}
      role="tablist"
      aria-label={etiqueta}
      aria-orientation="horizontal"
      onKeyDown={onKeyDown}
      data-riel=""
      {...gesto}
      className={cn("riel sin-barra items-stretch gap-1", className)}
      style={vars(desvanecer(bordes, 28))}
    >
      <span
        aria-hidden="true"
        className="pildora-tab"
        style={{
          width: `${medida.ancho}px`,
          transform: `translateX(${medida.x}px)`,
          opacity: medida.lista ? 1 : 0,
          transitionDuration: prefiereMovimientoReducido() ? "0ms" : undefined,
        }}
      />
      {pestanias.map((item, indice) => {
        const activaItem = item.id === activa;
        const conAviso = typeof item.aviso === "number" && item.aviso > 0;
        return (
          <button
            key={item.id}
            ref={refDe(indice) as (nodo: HTMLButtonElement | null) => void}
            type="button"
            role="tab"
            id={`pestania-${item.id}`}
            aria-selected={activaItem}
            aria-controls={`panel-${item.id}`}
            tabIndex={activaItem ? 0 : -1}
            onClick={() => elegir(indice)}
            data-sin-gesto=""
            className="tab flex-1 basis-0"
          >
            <span className="tab-icono relative" aria-hidden="true">
              {item.icono}
              {conAviso ? (
                <span
                  className={cn(
                    "absolute -top-1.5 -right-2 flex min-w-4 items-center justify-center rounded-full px-1 text-[0.5625rem] leading-4 font-semibold",
                    activaItem ? "bg-ink/30 text-ink" : "bg-accent text-ink",
                  )}
                >
                  {item.aviso! > 99 ? "99+" : item.aviso}
                </span>
              ) : null}
            </span>
            <span className="w-full truncate text-center">{item.etiqueta}</span>
            {conAviso ? (
              <span className="sr-only">{item.etiquetaAviso ?? `${item.aviso} elementos`}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
