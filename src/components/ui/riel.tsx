import { useCallback, useEffect, type ReactNode, type Ref } from "react";
import { ChevronLeft, ChevronRight, MoveHorizontal } from "lucide-react";
import { desvanecer, useRiel } from "@/components/ui/use-riel";
import { cn, vars } from "@/lib/ui/cn";

type Props = {
  /** Nombre accesible del grupo: «Filtros», «Categorías», «Ideas recientes»… */
  etiqueta: string;
  children: ReactNode;
  /** `x mandatory` centrado para carruseles de tarjetas; proximity para chips. */
  centrado?: boolean;
  /** Flechas de paginación, solo donde hay cursor y puntero fino. */
  flechas?: boolean;
  /** Pista textual de que hay más contenido fuera de vista. */
  pista?: string;
  /**
   * Valor que identifica la opción activa: cuando cambia, el carril la deja
   * visible y centrada (busca el hijo con `data-activo="true"`).
   */
  centrarCuando?: string;
  rol?: "group" | "toolbar" | "listbox" | "none";
  className?: string;
  claseContenido?: string;
  ref?: Ref<HTMLDivElement>;
  id?: string;
};

/**
 * Carril horizontal del sistema: scroll nativo con momentum, `scroll-snap`
 * moderado, barra oculta solo a la vista y desvanecido de bordes que aparece
 * únicamente cuando de verdad hay contenido fuera. Nunca intercepta el gesto
 * del navegador, por eso lleva `data-riel` para que el swipe de paneles y de
 * tarjetas se aparte al empezar aquí.
 */
export function Riel({
  etiqueta,
  children,
  centrado = false,
  flechas = true,
  pista,
  centrarCuando,
  rol = "group",
  className,
  claseContenido,
  ref,
  id,
}: Props) {
  const { ref: interno, bordes, desplazar, centrar, gesto } = useRiel<HTMLDivElement>();

  useEffect(() => {
    if (!interno.current) return;
    const nodo = interno.current.querySelector<HTMLElement>('[data-activo="true"]');
    centrar(nodo);
  }, [centrarCuando, centrar, interno]);

  const asignar = useCallback(
    (nodo: HTMLDivElement | null) => {
      interno.current = nodo;
      if (typeof ref === "function") ref(nodo);
      else if (ref) (ref as { current: HTMLDivElement | null }).current = nodo;
    },
    [ref, interno],
  );

  const sinDesbordamiento = !bordes.izq && !bordes.der;

  return (
    <div className={cn("relative", className)}>
      <div
        ref={asignar}
        id={id}
        role={rol === "none" ? undefined : rol}
        aria-label={rol === "none" ? undefined : etiqueta}
        data-riel=""
        {...gesto}
        className={cn("riel sin-barra", centrado && "riel-centrado", claseContenido)}
        style={vars(desvanecer(bordes, 44))}
      >
        {children}
      </div>

      {flechas && bordes.izq ? (
        <button
          type="button"
          onClick={() => desplazar(-1)}
          aria-label={`Desplazar ${etiqueta} hacia la izquierda`}
          data-sin-gesto=""
          className="boton boton-icónico boton-secundario absolute top-1/2 left-0 z-10 hidden size-9 -translate-y-1/2 [@media(hover:hover)_and_(pointer:fine)]:flex"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
      ) : null}

      {flechas && bordes.der ? (
        <button
          type="button"
          onClick={() => desplazar(1)}
          aria-label={`Desplazar ${etiqueta} hacia la derecha`}
          data-sin-gesto=""
          className="boton boton-icónico boton-secundario absolute top-1/2 right-0 z-10 hidden size-9 -translate-y-1/2 [@media(hover:hover)_and_(pointer:fine)]:flex"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      ) : null}

      {pista && !sinDesbordamiento ? (
        <p
          aria-hidden="true"
          className="pointer-events-none absolute -top-1 right-1 flex items-center gap-1 text-[0.6875rem] text-muted opacity-0 transition-opacity duration-300 [@media(hover:hover)_and_(pointer:fine)]:opacity-90"
        >
          <MoveHorizontal className="size-3.5" />
          {pista}
        </p>
      ) : null}
    </div>
  );
}
