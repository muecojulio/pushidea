import type { ReactNode } from "react";
import { CONSULTA_ESCRITORIO, useConsulta } from "@/components/ui/use-consulta";
import { desvanecer, useRiel } from "@/components/ui/use-riel";
import { cn, vars } from "@/lib/ui/cn";

type Props<T> = {
  elementos: T[];
  clave: (elemento: T, indice: number) => string;
  render: (elemento: T, indice: number) => ReactNode;
  /** Nombre accesible del conjunto («Ideas guardadas», «Proyectos abiertos»…). */
  etiqueta: string;
  /** Clases de ancho de cada tarjeta en móvil: deja asomar la siguiente. */
  anchoMovil?: string;
  /** Cuadrícula de escritorio: por defecto dos columnas y tres en pantallas anchas. */
  columnas?: string;
  /** Puntos de progreso del carrusel (decorativos). */
  puntos?: boolean;
  className?: string;
  claseItem?: string;
};

/**
 * Carrusel de tarjetas que se vuelve cuadrícula cuando deja de ser útil.
 *
 * En móvil: carril nativo con `scroll-snap` centrado, la siguiente tarjeta
 * asoma para sugerir que hay más, y los puntos dicen dónde estás. En
 * escritorio: cuadrícula, sin scroll horizontal ni desvanecido.
 */
export function Carrusel<T>({
  elementos,
  clave,
  render,
  etiqueta,
  anchoMovil = "w-[86%]",
  columnas = "md:grid-cols-2 xl:grid-cols-3",
  puntos = true,
  className,
  claseItem,
}: Props<T>) {
  const { ref, bordes, indiceActivo } = useRiel<HTMLDivElement>();
  const escritorio = useConsulta(CONSULTA_ESCRITORIO);
  const hayDesbordamiento = bordes.izq || bordes.der;

  return (
    <div className={className}>
      <div
        ref={ref}
        role="group"
        aria-label={etiqueta}
        data-riel=""
        className={cn(
          "riel riel-centrado sin-barra items-stretch md:grid md:gap-4 md:overflow-visible md:mask-none lg:gap-5",
          columnas,
        )}
        style={vars(escritorio ? {} : desvanecer(bordes, 52))}
      >
        {elementos.map((elemento, indice) => (
          <div key={clave(elemento, indice)} className={cn(anchoMovil, "md:w-auto", claseItem)}>
            {render(elemento, indice)}
          </div>
        ))}
      </div>

      {puntos && !escritorio && hayDesbordamiento && elementos.length > 1 ? (
        <div aria-hidden="true" className="mt-3 flex items-center justify-center gap-1.5">
          {elementos.map((elemento, indice) => (
            <span
              key={clave(elemento, indice)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                indice === indiceActivo ? "w-5 bg-accent" : "w-1.5 bg-line",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
