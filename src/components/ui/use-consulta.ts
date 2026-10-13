import { useState } from "react";
import { usePintado } from "@/components/ui/use-pintado";

/**
 * Suscripción a una media query, segura en servidor. Se usa para decidir entre
 * carrusel y cuadrícula, o entre swipe y acciones siempre visibles.
 */
export function useConsulta(consulta: string, inicial = false): boolean {
  const [cumple, setCumple] = useState(inicial);

  // Con `usePintado` la rama correcta (carrusel o cuadrícula, swipe o acciones
  // a la vista) está decidida antes del primer pintado: sin parpadeo al hidratar.
  usePintado(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const medio = window.matchMedia(consulta);
    setCumple(medio.matches);
    const onChange = (evento: MediaQueryListEvent) => setCumple(evento.matches);
    medio.addEventListener("change", onChange);
    return () => medio.removeEventListener("change", onChange);
  }, [consulta]);

  return cumple;
}

/** Escritorio con puntero fino: allí las acciones secundarias van a la vista. */
export const CONSULTA_ESCRITORIO = "(hover: hover) and (pointer: fine) and (min-width: 48rem)";
