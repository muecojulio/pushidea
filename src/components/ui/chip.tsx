import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Check } from "lucide-react";
import { cn, vars } from "@/lib/ui/cn";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  activo?: boolean;
  /** Matiz del ámbito: color + emoji + marca de verificación. */
  hue?: string;
  glifo?: ReactNode;
  /** En rieles densos se puede bajar el alto, sin romper el área táctil. */
  compacto?: boolean;
};

/**
 * Chip de filtro. `aria-pressed` dice el estado a las tecnologías de
 * asistencia, el relleno y la marca lo dicen a la vista, y el foco visible
 * viene del anillo global. Funciona igual con toque, mouse y teclado.
 */
export function Chip({
  activo = false,
  hue,
  glifo,
  compacto,
  className,
  style,
  children,
  ...resto
}: Props) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      data-activo={activo}
      className={cn("chip", compacto && "min-h-11 px-3.5 text-[0.8125rem]", className)}
      style={hue ? { ...vars({ "--hue": hue }), ...style } : style}
      {...resto}
    >
      {glifo ? (
        <span aria-hidden="true" className="text-[0.95em] leading-none">
          {glifo}
        </span>
      ) : null}
      <span className="truncate">{children}</span>
      {activo ? <Check className="size-3.5 shrink-0" aria-hidden="true" /> : null}
    </button>
  );
}
