import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { TOLERANCIA, prefiereMovimientoReducido } from "@/lib/ui/gestos";

export type Bordes = { izq: false; der: false } | { izq: boolean; der: boolean };

function comportamiento(): ScrollBehavior {
  return prefiereMovimientoReducido() ? "auto" : "smooth";
}

/**
 * Estado compartido por todos los carriles horizontales (pestañas, chips,
 * carruseles): sabe si de verdad hay contenido fuera de vista y devuelve
 * utilidades para desplazar o centrar un elemento sin pelearse con el scroll
 * nativo del navegador.
 */
export function useRiel<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const [bordes, setBordes] = useState({ izq: false, der: false });
  const [indiceActivo, setIndiceActivo] = useState(0);

  const medir = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const sobrante = el.scrollWidth - el.clientWidth;
    if (sobrante <= 1) {
      setBordes((prev) => (prev.izq || prev.der ? { izq: false, der: false } : prev));
      return;
    }
    const izq = el.scrollLeft > 2;
    const der = el.scrollLeft < sobrante - 2;
    setBordes((prev) => (prev.izq === izq && prev.der === der ? prev : { izq, der }));

    const centro = el.scrollLeft + el.clientWidth / 2;
    let mejor = 0;
    let menor = Number.POSITIVE_INFINITY;
    Array.from(el.children).forEach((hijo, indice) => {
      const item = hijo as HTMLElement;
      if (typeof item.offsetLeft !== "number") return;
      const distancia = Math.abs(item.offsetLeft + item.offsetWidth / 2 - centro);
      if (distancia < menor) {
        menor = distancia;
        mejor = indice;
      }
    });
    setIndiceActivo((prev) => (prev === mejor ? prev : mejor));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    medir();
    const observador = typeof ResizeObserver === "function" ? new ResizeObserver(medir) : null;
    observador?.observe(el);
    const mutaciones = new MutationObserver(medir);
    mutaciones.observe(el, { childList: true, subtree: true });
    el.addEventListener("scroll", medir, { passive: true });
    window.addEventListener("resize", medir);
    return () => {
      observador?.disconnect();
      mutaciones.disconnect();
      el.removeEventListener("scroll", medir);
      window.removeEventListener("resize", medir);
    };
  }, [medir]);

  /** Avanza o retrocede casi una página del carril (flechas de escritorio). */
  const desplazar = useCallback((direccion: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({
      left: direccion * Math.max(160, el.clientWidth * 0.8),
      behavior: comportamiento(),
    });
  }, []);

  /** Deja un elemento visible y centrado cuando el carril tiene desbordamiento. */
  const centrar = useCallback((elemento: HTMLElement | null | undefined) => {
    const el = ref.current;
    if (!el || !elemento) return;
    const maximo = el.scrollWidth - el.clientWidth;
    if (maximo <= 1) return;
    const objetivo = elemento.offsetLeft - (el.clientWidth - elemento.offsetWidth) / 2;
    el.scrollTo({ left: Math.max(0, Math.min(objetivo, maximo)), behavior: comportamiento() });
  }, []);

  /**
   * Arrastrar el carril no debe activar una opción por accidente: si el
   * puntero se movió más que la tolerancia, el clic siguiente se descarta.
   * Se reparte en el elemento del carril (`{...gesto}`).
   */
  const origen = useRef<{ x: number; y: number } | null>(null);
  const movido = useRef(false);
  const gesto = {
    onPointerDown: (evento: PointerEvent<HTMLElement>) => {
      origen.current = { x: evento.clientX, y: evento.clientY };
      movido.current = false;
    },
    onPointerMove: (evento: PointerEvent<HTMLElement>) => {
      const inicio = origen.current;
      if (!inicio) return;
      if (
        Math.abs(evento.clientX - inicio.x) > TOLERANCIA ||
        Math.abs(evento.clientY - inicio.y) > TOLERANCIA
      ) {
        movido.current = true;
      }
    },
    onClickCapture: (evento: MouseEvent<HTMLElement>) => {
      if (!movido.current) return;
      movido.current = false;
      evento.preventDefault();
      evento.stopPropagation();
    },
  };

  return { ref, bordes, medir, desplazar, centrar, indiceActivo, gesto };
}

/** Variables CSS del desvanecido de bordes, activas solo si hay desbordamiento. */
export function desvanecer(
  bordes: { izq: boolean; der: boolean },
  px = 40,
): Record<string, string> {
  return {
    "--desvanecer-izq": bordes.izq ? `${px}px` : "0px",
    "--desvanecer-der": bordes.der ? `${px}px` : "0px",
  };
}
