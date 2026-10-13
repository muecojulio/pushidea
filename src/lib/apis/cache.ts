/**
 * Caché local con caducidad (TTL) para las respuestas de las APIs públicas.
 *
 * - Vive solo en este dispositivo (`localStorage`), igual que las ideas
 *   guardadas. Nunca se sincroniza ni se envía a ningún servidor.
 * - Sirve para no repetir peticiones (las APIs gratuitas tienen límites,
 *   p. ej. GitHub admite pocas búsquedas por hora sin cuenta) y para poder
 *   mostrar lo último consultado cuando no hay conexión.
 * - Se puede vaciar junto con el resto de datos del sitio desde el navegador.
 */

const STORE_KEY = "pushidea-cache-v1";
const MAX_ENTRIES = 60;

type Entry<T> = { at: number; ttl: number; data: T };

type Store = Record<string, Entry<unknown>>;

function readStore(): Store {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store): void {
  try {
    const keys = Object.keys(store);
    if (keys.length > MAX_ENTRIES) {
      keys
        .sort((a, b) => (store[a]?.at ?? 0) - (store[b]?.at ?? 0))
        .slice(0, keys.length - MAX_ENTRIES)
        .forEach((key) => delete store[key]);
    }
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    // Almacenamiento lleno o bloqueado: la caché es opcional, no debe romper la app.
  }
}

export function cacheGet<T>(key: string): { data: T; fresh: boolean } | null {
  if (typeof localStorage === "undefined") return null;
  const entry = readStore()[key] as Entry<T> | undefined;
  if (!entry || typeof entry.at !== "number") return null;
  return { data: entry.data, fresh: Date.now() - entry.at < entry.ttl };
}

export function cacheSet<T>(key: string, data: T, ttlMs: number): void {
  if (typeof localStorage === "undefined") return;
  const store = readStore();
  store[key] = { at: Date.now(), ttl: ttlMs, data };
  writeStore(store);
}

/** Borra toda la caché de APIs públicas (no toca ideas guardadas ni ajustes). */
export function cacheClear(): void {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    // Sin almacenamiento disponible no hay nada que borrar.
  }
}
