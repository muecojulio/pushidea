import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode, type Ref } from "react";
import { Check, LoaderCircle, TriangleAlert } from "lucide-react";
import { useAviso } from "@/components/ui/use-aviso";
import { cn, vars } from "@/lib/ui/cn";

export type Variante = "primario" | "secundario" | "fantasma" | "peligro";
export type Tamano = "normal" | "grande" | "icono";
/** Ciclo de vida de una acción: inactivo → cargando → éxito o error. */
export type EstadoBoton = "inactivo" | "cargando" | "exito" | "error";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
  tamano?: Tamano;
  estado?: EstadoBoton;
  icono?: ReactNode;
  /** Etiqueta mientras dura la acción («Buscando una idea distinta…»). */
  etiquetaCargando?: string;
  /** Matiz del ámbito: tiñe borde y resplandor sin cambiar el significado. */
  hue?: string;
  /** Mensaje para el lector de pantalla y el aviso flotante al terminar. */
  mensajeExito?: string;
  mensajeError?: string;
  ref?: Ref<HTMLButtonElement>;
};

const CLASE_VARIANTE: Record<Variante, string> = {
  primario: "boton-primario",
  secundario: "boton-secundario",
  fantasma: "boton-fantasma",
  peligro: "boton-peligro",
};

/**
 * Botón del sistema: objetivo táctil de 44 px o más, hundimiento breve al
 * pulsar, elevación sutil solo donde hay cursor, y estados de carga, éxito y
 * error con icono + texto + anuncio accesible (nunca solo color).
 */
export function Boton({
  variante = "secundario",
  tamano = "normal",
  estado = "inactivo",
  icono,
  etiquetaCargando,
  hue,
  mensajeExito,
  mensajeError,
  className,
  style,
  disabled,
  children,
  ref,
  ...resto
}: Props) {
  const anunciar = useAviso();
  const anterior = useRef(estado);

  useEffect(() => {
    if (anterior.current === estado) return;
    anterior.current = estado;
    if (estado === "exito" && mensajeExito) anunciar(mensajeExito, "exito");
    if (estado === "error" && mensajeError) anunciar(mensajeError, "error");
  }, [estado, mensajeExito, mensajeError, anunciar]);

  const cargando = estado === "cargando";
  const iconoEstado =
    estado === "exito" ? (
      <Check className="size-4" aria-hidden="true" />
    ) : estado === "error" ? (
      <TriangleAlert className="size-4" aria-hidden="true" />
    ) : cargando ? (
      <LoaderCircle className="size-4 animate-girar" aria-hidden="true" />
    ) : (
      icono
    );

  return (
    <button
      ref={ref}
      type="button"
      data-estado={estado === "inactivo" ? undefined : estado}
      aria-busy={cargando || undefined}
      disabled={disabled || cargando}
      className={cn(
        "boton",
        CLASE_VARIANTE[variante],
        tamano === "grande" && "boton-grande",
        tamano === "icono" && "boton-icónico",
        className,
      )}
      style={hue ? { ...vars({ "--hue": hue }), ...style } : style}
      {...resto}
    >
      {iconoEstado}
      <span className="truncate">{cargando && etiquetaCargando ? etiquetaCargando : children}</span>
    </button>
  );
}
