import { CATALOG } from "./catalog";
import { ideaText, isBanned, norm } from "./guard";
import type { Area, Focus, Idea } from "./types";

export type AreaFilter = Area | "cualquiera";
export type FocusFilter = Focus | "ambos";

export function pickLocal(options: {
  area: AreaFilter;
  focus: FocusFilter;
  blocked: string[];
}): Idea | null {
  const blocked = new Set(options.blocked.map(norm));
  const pool = CATALOG.filter((idea) => {
    if (blocked.has(norm(idea.title))) return false;
    if (isBanned(ideaText(idea))) return false;
    if (options.area !== "cualquiera" && idea.area !== options.area) return false;
    if (options.focus !== "ambos" && idea.focus !== options.focus) return false;
    return true;
  });
  if (pool.length === 0) return null;
  const seed = pool[Math.floor(Math.random() * pool.length)];
  if (!seed) return null;
  return { ...seed, source: "archivo" };
}
