import type { Area } from "@/lib/ideas/types";

/**
 * Identidad cromática de cada ámbito: diez matices repartidos por la rueda de
 * color, todos legibles sobre el fondo oliva oscuro y siempre acompañados de
 * un emoji y una etiqueta, para que el ámbito no se reconozca solo por color.
 */
export type TemaArea = {
  /** Matiz principal (borde, aura, insignia, riel activo). */
  hue: string;
  /** Glifo que acompaña al color: mismo significado sin depender del matiz. */
  emoji: string;
  /** Nombre corto para las etiquetas de accesibilidad. */
  corto: string;
};

export const AREA_TEMA: Record<Area, TemaArea> = {
  hogar: { hue: "#e2725b", emoji: "🏠", corto: "Hogar" },
  cocina: { hue: "#f0a63a", emoji: "🍲", corto: "Cocina" },
  trabajo: { hue: "#d8c14a", emoji: "🧰", corto: "Trabajo" },
  salud: { hue: "#93c95f", emoji: "🌿", corto: "Hábitos" },
  organizacion: { hue: "#4fc08a", emoji: "🗂️", corto: "Organización" },
  movilidad: { hue: "#45b8d1", emoji: "🚶", corto: "Movilidad" },
  aprendizaje: { hue: "#6a9df0", emoji: "📚", corto: "Aprendizaje" },
  comunidad: { hue: "#a98bf0", emoji: "🏘️", corto: "Comunidad" },
  cuidado: { hue: "#e08ac4", emoji: "🤲", corto: "Cuidado" },
  mascotas: { hue: "#f08a97", emoji: "🐾", corto: "Mascotas" },
};

/** Matiz neutro cálido para «Cualquiera» / «Todas». */
export const TEMA_CUALQUIERA: TemaArea = { hue: "#e08a4f", emoji: "✨", corto: "Cualquiera" };

export function temaDe(area: Area | "cualquiera"): TemaArea {
  return area === "cualquiera" ? TEMA_CUALQUIERA : AREA_TEMA[area];
}

/**
 * Variables CSS que consume el sistema visual (`.hue-borde`, `.hue-aura`,
 * `.hue-chip`…). Se aplican en línea porque el matiz cambia por dato, no por
 * clase estática.
 */
export function varsHue(hue: string, extra?: Record<string, string>): Record<string, string> {
  return { "--hue": hue, ...extra };
}
