export const AREAS = [
  { id: "hogar", label: "Hogar" },
  { id: "cocina", label: "Cocina" },
  { id: "salud", label: "Hábitos" },
  { id: "organizacion", label: "Organización" },
  { id: "aprendizaje", label: "Aprendizaje" },
  { id: "movilidad", label: "Movilidad" },
  { id: "trabajo", label: "Trabajo" },
  { id: "cuidado", label: "Cuidado" },
  { id: "comunidad", label: "Comunidad" },
  { id: "mascotas", label: "Mascotas" },
] as const;

export type Area = (typeof AREAS)[number]["id"];
export type Focus = "cotidiano" | "procesos";
export type Source = "ia" | "archivo";

export type Idea = {
  id: string;
  title: string;
  area: Area;
  focus: Focus;
  forWhom: string;
  problem: string;
  description: string;
  steps: string[];
  source: Source;
};

export const AREA_LABEL: Record<Area, string> = Object.fromEntries(
  AREAS.map((area) => [area.id, area.label]),
) as Record<Area, string>;

export const FOCUS_LABEL: Record<Focus, string> = {
  cotidiano: "Uso diario",
  procesos: "Proceso",
};
