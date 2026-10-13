/**
 * Matemáticas de gestos táctiles, sin DOM, para poder probarlas con `node --test`.
 *
 * Reglas que implementa (las mismas en pestañas, carruseles y swipe de acciones):
 *
 * - Bloqueo de eje: un gesto solo cuenta como horizontal cuando el avance
 *   lateral supera al vertical por un factor claro (`RATIO_EJE`). Mientras no
 *   se decida, el navegador conserva el scroll vertical.
 * - Umbral doble: distancia suficiente O un gesto rápido (flick) con un
 *   recorrido mínimo. Así responde igual a un arrastre largo y a un toque
 *   breve y seco.
 * - Nada de `preventDefault`: aquí solo se decide, la página nunca se bloquea.
 */

export type Punto = { x: number; y: number; t: number };

/** Cuánto debe ganar lo lateral sobre lo vertical para llamarlo horizontal. */
export const RATIO_EJE = 1.2;
/** Recorrido mínimo para aceptar un swipe sin mirar la velocidad. */
export const DISTANCIA_MINIMA = 44;
/** Recorrido mínimo aceptable cuando el gesto es rápido (flick). */
export const DISTANCIA_FLICK = 16;
/** Velocidad mínima del flick, en px por milisegundo. */
export const VELOCIDAD_FLICK = 0.35;
/** Velocidad a partir de la cual el gesto rápido manda sobre la posición. */
export const VELOCIDAD_DECISIVA = 0.5;
/** Movimiento por debajo del cual todavía no hay gesto (ruido del dedo). */
export const TOLERANCIA = 6;
/** Borde de la pantalla reservado a los gestos del navegador. */
export const MARGEN_BORDE = 18;
/** Fracción del panel de acciones que decide si se abre o se cierra. */
export const UMBRAL_REVELADO = 0.45;

export type Eje = "horizontal" | "vertical" | "indefinido";

/** Eje dominante del gesto. `indefinido` = diagonal o demasiado corto. */
export function ejeDelGesto(inicio: Punto, actual: Punto): Eje {
  const dx = Math.abs(actual.x - inicio.x);
  const dy = Math.abs(actual.y - inicio.y);
  if (dx < TOLERANCIA && dy < TOLERANCIA) return "indefinido";
  if (dx >= dy * RATIO_EJE) return "horizontal";
  if (dy >= dx * RATIO_EJE) return "vertical";
  return "indefinido";
}

export type Swipe = {
  valido: boolean;
  /** -1 hacia la izquierda (avanzar / revelar), 1 hacia la derecha. */
  direccion: -1 | 1;
  distancia: number;
  velocidad: number;
};

/** Decide si el recorrido entre dos puntos es un swipe horizontal utilizable. */
export function swipeHorizontal(inicio: Punto, fin: Punto): Swipe {
  const delta = fin.x - inicio.x;
  const distancia = Math.abs(delta);
  const vertical = Math.abs(fin.y - inicio.y);
  const velocidad = distancia / Math.max(1, fin.t - inicio.t);
  const horizontal = distancia >= vertical * RATIO_EJE;
  const valido =
    horizontal &&
    (distancia >= DISTANCIA_MINIMA ||
      (distancia >= DISTANCIA_FLICK && velocidad >= VELOCIDAD_FLICK));
  return { valido, direccion: delta < 0 ? -1 : 1, distancia, velocidad };
}

/**
 * Desplazamiento final de una tarjeta que se desliza para revelar acciones.
 * Hacia la izquierda topea en el ancho del panel (nunca más allá); hacia la
 * derecha ofrece una goma breve para que el arrastre se sienta físico.
 */
export function limitarArrastre(dx: number, anchoPanel: number): number {
  if (dx >= 0) return Math.min(dx * 0.2, anchoPanel * 0.1);
  return Math.max(dx, -anchoPanel);
}

/** ¿Queda abierto el panel de acciones al soltar? */
export function decidirRevelado(
  desplazamiento: number,
  anchoPanel: number,
  velocidad: number,
): boolean {
  if (anchoPanel <= 0) return false;
  if (Math.abs(velocidad) >= VELOCIDAD_DECISIVA && Math.abs(desplazamiento) >= DISTANCIA_FLICK) {
    return desplazamiento < 0;
  }
  return -desplazamiento >= anchoPanel * UMBRAL_REVELADO;
}

/** El gesto empieza demasiado cerca del borde: manda el navegador. */
export function vieneDelBorde(x: number, anchoVentana: number): boolean {
  return x <= MARGEN_BORDE || x >= anchoVentana - MARGEN_BORDE;
}

/**
 * Controles que se quedan con el gesto: nunca se cambia de pestaña ni se
 * desliza una tarjeta cuando el toque empieza sobre uno de ellos. Los rieles
 * horizontales (`[data-riel]`) entran porque ya son dueños del eje X.
 */
export const SELECTOR_CONTROL = [
  "button",
  "a",
  "input",
  "textarea",
  "select",
  "summary",
  "label",
  "[role='tab']",
  "[role='option']",
  "[role='switch']",
  "[role='combobox']",
  "[role='listbox']",
  "[role='slider']",
  "[role='menu']",
  "[contenteditable='true']",
  "[data-sin-gesto]",
  "[data-riel]",
].join(",");

/** ¿El gesto empieza sobre un control anidado? (usa `closest`, solo navegador) */
export function empiezaEnControl(objetivo: EventTarget | null): boolean {
  if (typeof Element === "undefined") return false;
  const nodo =
    objetivo instanceof Element
      ? objetivo
      : (objetivo as { parentElement?: Element } | null)?.parentElement;
  if (!nodo || typeof nodo.closest !== "function") return false;
  return nodo.closest(SELECTOR_CONTROL) !== null;
}

/** `prefers-reduced-motion` sin romper el renderizado en servidor. */
export function prefiereMovimientoReducido(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Reacciona a cambios de `prefers-reduced-motion` (la persona puede activarlo
 * con la app abierta). Devuelve una función de limpieza.
 */
export function alCambiarMovimientoReducido(escucha: (reducido: boolean) => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const medio = window.matchMedia("(prefers-reduced-motion: reduce)");
  const onChange = (evento: MediaQueryListEvent) => escucha(evento.matches);
  medio.addEventListener("change", onChange);
  escucha(medio.matches);
  return () => medio.removeEventListener("change", onChange);
}
