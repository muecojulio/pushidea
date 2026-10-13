import { CATALOG } from "./catalog";
import { ideaText, isBanned, norm } from "./guard";
import type { Area, Focus, Idea } from "./types";

export type AreaFilter = Area | "cualquiera";
export type FocusFilter = Focus | "ambos";

type Opciones = {
  area: AreaFilter;
  focus: FocusFilter;
  blocked: string[];
};

/** Semillas del archivo local que aún pueden salir con estos filtros. */
export function disponibles(options: Opciones): Omit<Idea, "source">[] {
  const blocked = new Set(options.blocked.map(norm));
  return CATALOG.filter((idea) => {
    if (blocked.has(norm(idea.title))) return false;
    if (isBanned(ideaText(idea))) return false;
    if (options.area !== "cualquiera" && idea.area !== options.area) return false;
    if (options.focus !== "ambos" && idea.focus !== options.focus) return false;
    return true;
  });
}

/** ¿Queda archivo local con este filtro? Sirve para avisar antes de pulsar. */
export function quedanIdeas(options: Opciones): boolean {
  return disponibles(options).length > 0;
}

export function pickLocal(options: Opciones): Idea | null {
  const pool = disponibles(options);
  if (pool.length === 0) return null;
  const seed = pool[Math.floor(Math.random() * pool.length)];
  if (!seed) return null;
  return { ...seed, source: "archivo" };
}
