import { createServerFn } from "@tanstack/react-start";
import { ideaText, isArea, isBanned, isFocus, norm } from "./guard";
import type { Area, Focus, Idea } from "./types";

type GenInput = {
  area: Area | "cualquiera";
  focus: Focus | "ambos";
  avoidTitles: string[];
};

function asInput(value: unknown): GenInput {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const area = typeof raw.area === "string" && (raw.area === "cualquiera" || isArea(raw.area)) ? raw.area : "cualquiera";
  const focus =
    typeof raw.focus === "string" && (raw.focus === "ambos" || isFocus(raw.focus)) ? raw.focus : "ambos";
  const avoidTitles = Array.isArray(raw.avoidTitles)
    ? raw.avoidTitles
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.replace(/\s+/g, " ").trim().slice(0, 80))
        .filter(Boolean)
        .slice(0, 24)
    : [];
  return { area, focus, avoidTitles };
}

function parseIdea(text: string, input: GenInput): Idea | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced?.[1] ?? text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
  const title = typeof data.title === "string" ? data.title.replace(/\s+/g, " ").trim().slice(0, 60) : "";
  const forWhom = typeof data.forWhom === "string" ? data.forWhom.trim().slice(0, 240) : "";
  const problem = typeof data.problem === "string" ? data.problem.trim().slice(0, 240) : "";
  const description = typeof data.description === "string" ? data.description.trim().slice(0, 1200) : "";
  const steps = Array.isArray(data.steps)
    ? data.steps.filter((step): step is string => typeof step === "string").map((step) => step.trim().slice(0, 200)).filter(Boolean).slice(0, 5)
    : [];
  if (title.length < 4 || title.length > 60) return null;
  if (description.length < 80 || forWhom.length < 8 || problem.length < 8 || steps.length < 3) return null;
  const requestedArea = input.area !== "cualquiera" ? input.area : null;
  const area =
    requestedArea ??
    (typeof data.area === "string" && isArea(data.area) ? data.area : "hogar");
  const focus: Focus =
    input.focus !== "ambos" ? input.focus : data.focus === "procesos" ? "procesos" : "cotidiano";
  const draft = { title, forWhom, problem, description, steps };
  if (isBanned(ideaText(draft))) return null;
  if (input.avoidTitles.some((avoid) => norm(avoid) === norm(title))) return null;
  const slug = norm(title).replace(/ /g, "-").slice(0, 40);
  return {
    id: `ia-${slug}-${Date.now().toString(36)}`,
    title,
    area,
    focus,
    forWhom,
    problem,
    description,
    steps,
    source: "ia",
  };
}

async function ask(apiKey: string, input: GenInput, repair: boolean): Promise<Idea | null> {
  const areaLine =
    input.area === "cualquiera"
      ? "Elige el ámbito que mejor encaje."
      : `El ámbito debe ser exactamente "${input.area}".`;
  const focusLine =
    input.focus === "ambos"
      ? "focus debe ser cotidiano o procesos."
      : `focus debe ser "${input.focus}".`;
  const avoid =
    input.avoidTitles.length > 0
      ? `No repitas ni parafrasees estos títulos: ${input.avoidTitles.join(" | ")}.`
      : "Que el título no sea genérico.";

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    signal: AbortSignal.timeout(16000),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      temperature: 0.9,
      max_tokens: 900,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres editor de ideas de aplicaciones en español de México. Cada idea sirve para la vida cotidiana o para facilitar un proceso personal, familiar o de trabajo no financiero. Prohibido hablar de pagos, transferencias, bancos, tarjetas, criptomonedas, préstamos, cobros, facturas, inversiones, divisas, nómina o dinero. No uses esas palabras. Responde solo JSON.",
        },
        {
          role: "user",
          content: `${repair ? "La respuesta anterior no sirvió. " : ""}Genera UNA idea original, concreta y distinta.
${areaLine}
${focusLine}
${avoid}
JSON con esta forma exacta:
{"title":"máximo 5 palabras","area":"hogar|cocina|salud|organizacion|aprendizaje|movilidad|trabajo|cuidado|comunidad|mascotas","focus":"cotidiano|procesos","forWhom":"una frase","problem":"una frase","description":"4 o 5 oraciones de qué hace la app en la vida real","steps":["paso 1","paso 2","paso 3","paso 4"]}`,
        },
      ],
    }),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = body.choices?.[0]?.message?.content ?? "";
  return parseIdea(content, input);
}

export const generateIdea = createServerFn({ method: "POST" })
  .validator((input: unknown) => asInput(input))
  .handler(async ({ data }): Promise<{ ok: true; idea: Idea } | { ok: false; reason: "sin-ia" | "vacia" }> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false, reason: "sin-ia" };
    try {
      const idea = (await ask(apiKey, data, false)) ?? (await ask(apiKey, data, true));
      if (idea) return { ok: true, idea };
      return { ok: false, reason: "vacia" };
    } catch {
      return { ok: false, reason: "sin-ia" };
    }
  });
