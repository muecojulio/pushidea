import { createContext, useContext } from "react";

export type Tono = "neutro" | "exito" | "aviso" | "error";

export type AccionAviso = { etiqueta: string; onClick: () => void };

/**
 * Anuncia un cambio de estado: llega a la región viva (lector de pantalla) y,
 * si hace falta, muestra una confirmación breve con una acción («Deshacer»).
 */
export type Anunciar = (texto: string, tono?: Tono, accion?: AccionAviso) => void;

/**
 * El contexto vive aparte del proveedor para que un archivo exporte solo
 * componentes y el otro solo el hook: sin acoplar ambos sistemas.
 */
export const ContextoAviso = createContext<Anunciar>(() => {});

/** Fuera del proveedor es un noop: los componentes siguen funcionando solos. */
export function useAviso(): Anunciar {
  return useContext(ContextoAviso);
}
