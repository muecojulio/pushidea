import type { ReactNode } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { ChevronDown } from "lucide-react";
import { cn, vars } from "@/lib/ui/cn";

type Props = {
  titulo: ReactNode;
  /** Texto de apoyo visible junto al título (estado, resumen, fuente…). */
  subtitulo?: ReactNode;
  icono?: ReactNode;
  children: ReactNode;
  abiertoInicial?: boolean;
  /** Controlado desde fuera; sin `abierto` el panel se gestiona solo. */
  abierto?: boolean;
  onCambio?: (abierto: boolean) => void;
  hue?: string;
  nivel?: 2 | 3;
  className?: string;
  etiquetaControl?: string;
};

/**
 * Panel plegable sobre Radix Collapsible (ya instalado): `aria-expanded` y
 * `aria-controls` correctos, y apertura/cierre animados con el alto real que
 * mide Radix, sin saltos ni `max-height` adivinados.
 */
export function Plegable({
  titulo,
  subtitulo,
  icono,
  children,
  abiertoInicial = false,
  abierto,
  onCambio,
  hue,
  nivel = 3,
  className,
  etiquetaControl,
}: Props) {
  const Titulo = nivel === 2 ? "h2" : "h3";

  return (
    <Collapsible
      open={abierto}
      defaultOpen={abiertoInicial}
      onOpenChange={onCambio}
      className={cn("tarjeta tarjeta-elevable", className)}
      style={hue ? vars({ "--hue": hue }) : undefined}
    >
      <Titulo className="m-0 text-base font-medium">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            aria-label={etiquetaControl}
            data-sin-gesto=""
            className="group press flex min-h-14 w-full items-center gap-3 px-4 py-3.5 text-left"
          >
            {icono ? (
              <span
                aria-hidden="true"
                className="shrink-0 text-accent transition-transform duration-300 group-data-[state=open]:scale-110"
              >
                {icono}
              </span>
            ) : null}
            <span className="min-w-0 flex-1">
              <span className="block text-[0.9375rem] leading-snug font-medium text-fg">
                {titulo}
              </span>
              {subtitulo ? (
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">{subtitulo}</span>
              ) : null}
            </span>
            <ChevronDown
              aria-hidden="true"
              className="size-4 shrink-0 text-muted transition-transform duration-300 ease-suave group-data-[state=open]:rotate-180 group-data-[state=open]:text-accent"
            />
          </button>
        </CollapsibleTrigger>
      </Titulo>
      <CollapsibleContent className="plegable-contenido">
        <div className="px-4 pb-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
