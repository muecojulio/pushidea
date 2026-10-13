import { type KeyboardEvent as EventoTeclado, type ReactNode } from "react";
import { useIndicador } from "@/components/ui/use-indicador";
import { cn, vars } from "@/lib/ui/cn";
import { prefiereMovimientoReducido } from "@/lib/ui/gestos";

export type OpcionSegmento<T extends string> = {
  id: T;
  etiqueta: string;
  glifo?: ReactNode;
};

type Props<T extends string> = {
  opciones: OpcionSegmento<T>[];
  valor: T;
  onCambiar: (valor: T) => void;
  /** Nombre accesible del grupo («Enfoque», «Orden»…). */
  etiqueta: string;
  hue?: string;
  className?: string;
};

/**
 * Control segmentado: `radiogroup` con una sola parada en el orden de
 * tabulación, flechas para moverse y una píldora que se desliza hasta la
 * opción elegida. Misma idea que la píldora de las pestañas, otro contexto.
 */
export function Segmentado<T extends string>({
  opciones,
  valor,
  onCambiar,
  etiqueta,
  hue,
  className,
}: Props<T>) {
  const indice = Math.max(
    0,
    opciones.findIndex((opcion) => opcion.id === valor),
  );
  const { medida, nodos, refDe } = useIndicador(indice, opciones.length);

  function onKeyDown(event: EventoTeclado<HTMLDivElement>) {
    const ultimo = opciones.length - 1;
    const mapa: Record<string, number> = {
      ArrowRight: indice >= ultimo ? 0 : indice + 1,
      ArrowLeft: indice <= 0 ? ultimo : indice - 1,
      Home: 0,
      End: ultimo,
    };
    const destino = mapa[event.key];
    if (destino === undefined) return;
    event.preventDefault();
    onCambiar(opciones[destino].id);
    requestAnimationFrame(() => (nodos.current[destino] as HTMLButtonElement | null)?.focus());
  }

  return (
    <div
      role="radiogroup"
      aria-label={etiqueta}
      onKeyDown={onKeyDown}
      data-sin-gesto=""
      className={cn("segmento relative flex gap-1", className)}
      style={hue ? vars({ "--hue": hue }) : undefined}
    >
      <span
        aria-hidden="true"
        className="pildora-segmento"
        style={{
          width: `${medida.ancho}px`,
          transform: `translateX(${medida.x}px)`,
          opacity: medida.lista ? 1 : 0,
          transitionDuration: prefiereMovimientoReducido() ? "0ms" : undefined,
        }}
      />
      {opciones.map((opcion, i) => (
        <button
          key={opcion.id}
          ref={refDe(i) as (nodo: HTMLButtonElement | null) => void}
          type="button"
          role="radio"
          aria-checked={opcion.id === valor}
          tabIndex={i === indice ? 0 : -1}
          onClick={() => onCambiar(opcion.id)}
          className="segmento-opcion flex-1"
        >
          {opcion.glifo ? <span aria-hidden="true">{opcion.glifo}</span> : null}
          <span>{opcion.etiqueta}</span>
        </button>
      ))}
    </div>
  );
}
