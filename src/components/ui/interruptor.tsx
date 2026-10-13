import { useId } from "react";
import { useAviso } from "@/components/ui/use-aviso";
import { cn, vars } from "@/lib/ui/cn";

type Props = {
  encendido: boolean;
  onCambiar: (encendido: boolean) => void;
  etiqueta: string;
  detalle?: string;
  hue?: string;
  className?: string;
  /** Texto opcional del estado, visible junto a la pista. */
  mostrarEstado?: boolean;
};

/**
 * Interruptor accesible: `role="switch"` + `aria-checked`, nombre por
 * `aria-labelledby` y descripción aparte, movimiento breve del pomo y estado
 * dicho también con palabras (no solo con el color de la pista).
 */
export function Interruptor({
  encendido,
  onCambiar,
  etiqueta,
  detalle,
  hue,
  className,
  mostrarEstado = true,
}: Props) {
  const base = useId();
  const idEtiqueta = `${base}-etiqueta`;
  const idDetalle = `${base}-detalle`;
  const idEstado = `${base}-estado`;
  const anunciar = useAviso();

  function alternar() {
    const siguiente = !encendido;
    onCambiar(siguiente);
    anunciar(
      `${etiqueta}: ${siguiente ? "activado" : "desactivado"}`,
      siguiente ? "exito" : "neutro",
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={encendido}
      aria-labelledby={idEtiqueta}
      aria-describedby={
        detalle ? `${idDetalle} ${mostrarEstado ? idEstado : ""}`.trim() || undefined : undefined
      }
      onClick={alternar}
      className={cn(
        "press tarjeta tarjeta-suave flex w-full items-center gap-4 rounded-3xl px-4 py-4 text-left",
        className,
      )}
      style={hue ? vars({ "--hue": hue }) : undefined}
    >
      <span className="min-w-0 flex-1">
        <span id={idEtiqueta} className="flex items-center gap-2 text-base font-medium text-fg">
          {etiqueta}
          {mostrarEstado ? (
            <span
              id={idEstado}
              className={cn(
                "rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold tracking-wide uppercase",
                encendido ? "bg-moss/20 text-moss" : "bg-raised text-muted",
              )}
            >
              {encendido ? "Activo" : "Apagado"}
            </span>
          ) : null}
        </span>
        {detalle ? (
          <span id={idDetalle} className="mt-1.5 block text-sm leading-relaxed text-muted">
            {detalle}
          </span>
        ) : null}
      </span>
      <span className="pista" data-encendida={encendido} aria-hidden="true">
        <span className="pomo" />
      </span>
    </button>
  );
}
