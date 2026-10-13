import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CSSProperties } from "react";

/** Une clases condicionales y resuelve conflictos de Tailwind (ya instaladas). */
export function cn(...entradas: ClassValue[]): string {
  return twMerge(clsx(entradas));
}

/** Estilo en línea con variables CSS tipado, sin pelearse con React. */
export function vars(valores: Record<string, string | number>): CSSProperties {
  return valores as CSSProperties;
}
