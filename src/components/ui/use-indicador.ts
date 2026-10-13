import { useCallback, useEffect, useRef, useState } from "react";
import { usePintado } from "@/components/ui/use-pintado";

/**
 * Medida del indicador deslizante (píldora de pestañas y de controles
 * segmentados): sigue al elemento activo, a sus cambios de tamaño y al del
 * contenedor, sin depender de anchos fijos.
 */
export function useIndicador(indice: number, total: number) {
  const nodos = useRef<(HTMLElement | null)[]>([]);
  const [medida, setMedida] = useState({ x: 0, ancho: 0, lista: false });

  const medir = useCallback(() => {
    const nodo = nodos.current[indice];
    if (!nodo) return;
    const x = nodo.offsetLeft;
    const ancho = nodo.offsetWidth;
    setMedida((prev) =>
      prev.x === x && prev.ancho === ancho && prev.lista ? prev : { x, ancho, lista: true },
    );
  }, [indice]);

  usePintado(medir, [medir]);

  useEffect(() => {
    if (typeof ResizeObserver !== "function") return;
    const observador = new ResizeObserver(() => medir());
    nodos.current.forEach((nodo) => {
      if (nodo) observador.observe(nodo);
    });
    return () => observador.disconnect();
  }, [medir, total]);

  /** Callbacks de `ref` estables por índice: no reenganchan en cada render. */
  const callbacks = useRef<((nodo: HTMLElement | null) => void)[]>([]);
  const refDe = useCallback((i: number) => {
    let callback = callbacks.current[i];
    if (!callback) {
      callback = (nodo: HTMLElement | null) => {
        nodos.current[i] = nodo;
      };
      callbacks.current[i] = callback;
    }
    return callback;
  }, []);

  return { medida, medir, nodos, refDe };
}
