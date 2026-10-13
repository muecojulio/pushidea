import { useEffect, useLayoutEffect } from "react";

/**
 * `useLayoutEffect` en el cliente y `useEffect` en el servidor: mide antes del
 * primer pintado sin provocar el aviso de React durante el SSR.
 */
export const usePintado = typeof window === "undefined" ? useEffect : useLayoutEffect;
