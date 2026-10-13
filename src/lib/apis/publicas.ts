import { cacheGet, cacheSet } from "./cache";
import type { Area } from "@/lib/ideas/types";

/**
 * APIs públicas SIN clave y SIN registro (elegidas del catálogo abierto
 * github.com/public-apis/public-apis y verificadas una a una):
 *
 * - Advice Slip  api.adviceslip.com          → consejo breve para crear hoy.
 * - MyMemory     api.mymemory.translated.net → traduce ese consejo al español.
 * - Wikipedia ES es.wikipedia.org (API REST) → contexto para profundizar.
 * - Open Library openlibrary.org             → libros reales sobre el ámbito.
 * - GitHub       api.github.com              → repos públicos para inspirarse
 *                                              y copiar ideas (con su licencia).
 *
 * Privacidad: a estos servicios solo viaja el TÉRMINO DEL ÁMBITO elegido
 * (p. ej. "cocina casera"). Nunca se envían ideas guardadas, notas,
 * historial ni ningún dato personal: no hay cuenta ni identificador.
 * Todas las respuestas se cachean en el dispositivo (ver ./cache.ts).
 */

const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;

type Terminos = { wiki: string; libros: string; github: string };

export const TERMINOS_POR_AREA: Record<Area, Terminos> = {
  hogar: { wiki: "organización del hogar", libros: "home organization", github: "home organization" },
  cocina: { wiki: "cocina casera", libros: "cookbook recipes", github: "recipe meal planner" },
  salud: { wiki: "hábitos saludables", libros: "healthy habits", github: "habit tracker" },
  organizacion: { wiki: "productividad personal", libros: "personal productivity", github: "todo task manager" },
  aprendizaje: { wiki: "técnicas de estudio", libros: "study learning techniques", github: "flashcards spaced repetition" },
  movilidad: { wiki: "movilidad urbana", libros: "urban mobility", github: "walking pedestrian" },
  trabajo: { wiki: "gestión del trabajo", libros: "work productivity", github: "project task management" },
  cuidado: { wiki: "cuidados personales", libros: "caregiving", github: "caregiver tracker" },
  comunidad: { wiki: "comunidad vecinal", libros: "community building", github: "neighborhood community" },
  mascotas: { wiki: "cuidado de mascotas", libros: "pet care", github: "pet care tracker" },
};

async function fetchJson(url: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(12_000),
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function texto(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

/* ------------------------------------------------------------------ */
/* Consejo del día (Advice Slip + traducción MyMemory)                 */
/* ------------------------------------------------------------------ */

export type Consejo = { texto: string; original: string };

async function traducir(textoEn: string, id: number): Promise<string> {
  const clave = `traduccion-${id}`;
  const guardada = cacheGet<string>(clave);
  if (guardada) return guardada.data;
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textoEn)}&langpair=en|es`;
    const data = (await fetchJson(url)) as { responseData?: { translatedText?: unknown } };
    const traducido = texto(data.responseData?.translatedText);
    if (traducido && !/MYMEMORY WARNING/i.test(traducido)) {
      cacheSet(clave, traducido, 30 * DIA);
      return traducido;
    }
  } catch {
    // Sin traducción disponible se muestra el original en inglés.
  }
  return textoEn;
}

export async function obtenerConsejo(forzar = false): Promise<Consejo> {
  const clave = "consejo-actual";
  const guardado = cacheGet<Consejo>(clave);
  if (!forzar && guardado?.fresh) return guardado.data;
  try {
    // `cache: "no-store"`: el CDN de Advice Slip reutiliza el mismo consejo unos minutos.
    const data = (await fetchJson("https://api.adviceslip.com/advice", { cache: "no-store" })) as {
      slip?: { id?: unknown; advice?: unknown };
    };
    const original = texto(data.slip?.advice);
    if (!original) throw new Error("consejo vacío");
    const id = typeof data.slip?.id === "number" ? data.slip.id : 0;
    const consejo: Consejo = { original, texto: await traducir(original, id) };
    cacheSet(clave, consejo, 12 * HORA);
    return consejo;
  } catch (error) {
    if (guardado) return guardado.data; // Sin conexión: último consejo guardado.
    throw error;
  }
}

/* ------------------------------------------------------------------ */
/* Recursos para profundizar en una idea (Wikipedia + libros + GitHub) */
/* ------------------------------------------------------------------ */

export type Recursos = {
  wikipedia: { titulo: string; extracto: string; url: string } | null;
  libros: { titulo: string; autor: string; anio: number | null; url: string; portada: string | null }[];
  repos: { nombre: string; descripcion: string; url: string; estrellas: number; licencia: string | null }[];
};

async function buscarWikipedia(termino: string): Promise<Recursos["wikipedia"]> {
  const params = new URLSearchParams({
    action: "query",
    prop: "extracts",
    exintro: "1",
    explaintext: "1",
    generator: "search",
    gsrsearch: termino,
    gsrlimit: "1",
    format: "json",
    origin: "*",
  });
  const data = (await fetchJson(`https://es.wikipedia.org/w/api.php?${params}`)) as {
    query?: { pages?: Record<string, { pageid?: unknown; title?: unknown; extract?: unknown }> };
  };
  const pagina = Object.values(data.query?.pages ?? {})[0];
  if (!pagina || typeof pagina.pageid !== "number") return null;
  const titulo = texto(pagina.title);
  const extracto = texto(pagina.extract);
  if (!titulo || !extracto) return null;
  return {
    titulo,
    extracto: extracto.length > 340 ? `${extracto.slice(0, 340).trimEnd()}…` : extracto,
    url: `https://es.wikipedia.org/?curid=${pagina.pageid}`,
  };
}

async function buscarLibros(termino: string): Promise<Recursos["libros"]> {
  const params = new URLSearchParams({
    q: termino,
    limit: "3",
    fields: "title,author_name,first_publish_year,cover_i,key",
  });
  const data = (await fetchJson(`https://openlibrary.org/search.json?${params}`)) as {
    docs?: Record<string, unknown>[];
  };
  return (data.docs ?? []).flatMap((doc) => {
    const titulo = texto(doc.title);
    const ruta = texto(doc.key);
    if (!titulo || !ruta.startsWith("/")) return [];
    const autores = Array.isArray(doc.author_name) ? doc.author_name.map(texto).filter(Boolean) : [];
    const cover = typeof doc.cover_i === "number" ? doc.cover_i : null;
    return [
      {
        titulo,
        autor: autores[0] ?? "Autoría colectiva",
        anio: typeof doc.first_publish_year === "number" ? doc.first_publish_year : null,
        url: `https://openlibrary.org${ruta}`,
        portada: cover ? `https://covers.openlibrary.org/b/id/${cover}-M.jpg` : null,
      },
    ];
  });
}

async function buscarRepos(termino: string): Promise<Recursos["repos"]> {
  const params = new URLSearchParams({
    q: `${termino} in:name,description`,
    sort: "stars",
    order: "desc",
    per_page: "3",
  });
  // Sin token a propósito: es una API pública sin registro (límite compartido,
  // por eso la respuesta se cachea 24 h en el dispositivo).
  const data = (await fetchJson(`https://api.github.com/search/repositories?${params}`)) as {
    items?: Record<string, unknown>[];
  };
  return (data.items ?? []).flatMap((repo) => {
    const nombre = texto(repo.full_name);
    const url = texto(repo.html_url);
    if (!nombre || !url.startsWith("https://github.com/")) return [];
    const licencia = repo.license as { spdx_id?: unknown } | null;
    return [
      {
        nombre,
        descripcion: texto(repo.description),
        url,
        estrellas: typeof repo.stargazers_count === "number" ? repo.stargazers_count : 0,
        licencia: texto(licencia?.spdx_id) || null,
      },
    ];
  });
}

export async function obtenerRecursos(area: Area): Promise<Recursos> {
  const clave = `recursos-${area}`;
  const guardado = cacheGet<Recursos>(clave);
  if (guardado?.fresh) return guardado.data;
  const terminos = TERMINOS_POR_AREA[area];
  const [wikipedia, libros, repos] = await Promise.allSettled([
    buscarWikipedia(terminos.wiki),
    buscarLibros(terminos.libros),
    buscarRepos(terminos.github),
  ]);
  const recursos: Recursos = {
    wikipedia: wikipedia.status === "fulfilled" ? wikipedia.value : null,
    libros: libros.status === "fulfilled" ? libros.value : [],
    repos: repos.status === "fulfilled" ? repos.value : [],
  };
  if (!recursos.wikipedia && recursos.libros.length === 0 && recursos.repos.length === 0) {
    if (guardado) return guardado.data; // Sin conexión: lo último que sí cargó.
    throw new Error("sin-recursos");
  }
  cacheSet(clave, recursos, DIA);
  return recursos;
}
