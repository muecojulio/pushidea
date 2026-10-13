import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Bookmark, Check, Copy, SlidersHorizontal, Sparkles } from "lucide-react";
import { generateIdea } from "@/lib/ideas/generate";
import { ideaText, isBanned, norm } from "@/lib/ideas/guard";
import { pickLocal, type AreaFilter, type FocusFilter } from "@/lib/ideas/pick";
import { usePushidea } from "@/lib/ideas/store";
import { AREAS, AREA_LABEL, FOCUS_LABEL, type Idea } from "@/lib/ideas/types";

type Tab = "generar" | "guardadas" | "ajustes";

function Mark() {
  return (
    <span className="relative block h-4 w-11" aria-hidden="true">
      <span className="absolute right-0 bottom-0 left-0 h-px bg-line" />
      <span className="absolute bottom-0 left-1 size-3 rounded-full bg-accent" />
    </span>
  );
}

function Switch({
  on,
  label,
  detail,
  onToggle,
}: {
  on: boolean;
  label: string;
  detail: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className="press flex w-full items-center gap-4 rounded-3xl border border-line bg-surface px-4 py-4 text-left"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-base font-medium text-fg">{label}</span>
        <span className="mt-1 block text-sm leading-relaxed text-muted">{detail}</span>
      </span>
      <span
        className={`relative h-8 w-14 shrink-0 rounded-full transition-colors duration-200 ${on ? "bg-accent" : "bg-raised"}`}
      >
        <span
          className={`absolute top-1 size-6 rounded-full transition-transform duration-200 ${on ? "translate-x-7 bg-ink" : "translate-x-1 bg-fg"}`}
        />
      </span>
    </button>
  );
}

function IdeaBody({ idea, saved, onToggle }: { idea: Idea; saved: boolean; onToggle: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const text = [
      idea.title,
      `${AREA_LABEL[idea.area]} · ${FOCUS_LABEL[idea.focus]}`,
      `Para: ${idea.forWhom}`,
      idea.problem,
      idea.description,
      ...idea.steps.map((step, index) => `${index + 1}. ${step}`),
    ].join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="rise rounded-3xl border border-line bg-surface p-5">
      <div className="rise flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-raised px-3 py-1 text-xs font-medium tracking-wide text-fg">
          {AREA_LABEL[idea.area]}
        </span>
        <span className="rounded-full bg-raised px-3 py-1 text-xs font-medium tracking-wide text-muted">
          {FOCUS_LABEL[idea.focus]}
        </span>
        <span className="text-xs text-muted">{idea.source === "ia" ? "Recién pensada" : "Archivo local"}</span>
      </div>
      <h2 className="rise d1 font-display mt-4 text-3xl leading-tight font-medium text-fg">{idea.title}</h2>
      <p className="rise d1 mt-3 text-base leading-relaxed text-fg">{idea.forWhom}</p>
      <p className="rise d2 mt-3 text-sm leading-relaxed text-muted">{idea.problem}</p>
      <p className="rise d2 mt-4 text-base leading-relaxed text-fg">{idea.description}</p>
      <ol className="rise d3 mt-5 space-y-3">
        {idea.steps.map((step, index) => (
          <li key={step} className="flex gap-3 text-sm leading-relaxed text-fg">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-raised text-xs text-accent">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onToggle}
          className={`press flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-medium ${
            saved ? "bg-accent text-ink" : "border border-line bg-raised text-fg"
          }`}
        >
          <Bookmark className="size-4" aria-hidden="true" />
          {saved ? "Guardada" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={() => void copy()}
          className="press flex h-12 items-center justify-center gap-2 rounded-2xl border border-line bg-raised text-sm font-medium text-fg"
        >
          {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
          {copied ? "Copiada" : "Copiar"}
        </button>
      </div>
    </article>
  );
}

export function PushideaApp() {
  const saved = usePushidea((state) => state.saved);
  const recent = usePushidea((state) => state.recent);
  const current = usePushidea((state) => state.current);
  const settings = usePushidea((state) => state.settings);
  const seenCount = usePushidea((state) => state.seenTitles.length);
  const setSettings = usePushidea((state) => state.setSettings);
  const toggleSave = usePushidea((state) => state.toggleSave);
  const removeSaved = usePushidea((state) => state.removeSaved);
  const resetSeen = usePushidea((state) => state.resetSeen);
  const focusIdea = usePushidea((state) => state.focusIdea);
  const [tab, setTab] = useState<Tab>("generar");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [empty, setEmpty] = useState(false);
  const [query, setQuery] = useState("");
  const [savedArea, setSavedArea] = useState<AreaFilter>("cualquiera");

  useEffect(() => {
    void Promise.resolve(usePushidea.persist.rehydrate()).finally(() => {
      usePushidea.getState().setHydrated(true);
    });
  }, []);

  async function onGenerate() {
    if (busy) return;
    setBusy(true);
    setNote(null);
    setEmpty(false);
    const state = usePushidea.getState();
    const blocked = state.blockedTitles();
    let placed = false;
    try {
      let liveReason: "sin-ia" | "vacia" | null = null;
      if (state.settings.useAi) {
        const result = await generateIdea({
          data: {
            area: state.settings.area,
            focus: state.settings.focus,
            avoidTitles: blocked.slice(0, 24),
          },
        });
        if (result.ok && !isBanned(ideaText(result.idea)) && !blocked.map(norm).includes(norm(result.idea.title))) {
          state.commit(result.idea);
          placed = true;
        } else if (!result.ok) {
          liveReason = result.reason;
        } else {
          liveReason = "vacia";
        }
      }
      if (!placed) {
        const local = pickLocal({
          area: state.settings.area,
          focus: state.settings.focus,
          blocked,
        });
        if (!local) {
          setEmpty(true);
        } else {
          state.commit(local);
          if (liveReason === "vacia") {
            setNote("La idea en vivo no cumplía las reglas. Esta es del archivo de tu teléfono.");
          } else if (liveReason === "sin-ia") {
            setNote("La idea en vivo no respondió a tiempo. Esta es del archivo de tu teléfono.");
          }
        }
      }
    } catch {
      const local = pickLocal({
        area: state.settings.area,
        focus: state.settings.focus,
        blocked,
      });
      if (!local) setEmpty(true);
      else {
        state.commit(local);
        setNote("Sin conexión con la idea en vivo. Esta queda guardada solo en tu teléfono si la marcas.");
      }
    } finally {
      setBusy(false);
    }
  }

  const savedList = Object.values(saved)
    .filter((idea) => savedArea === "cualquiera" || idea.area === savedArea)
    .filter((idea) => {
      const haystack = norm(`${idea.title} ${idea.description} ${idea.problem} ${idea.forWhom}`);
      return haystack.includes(norm(query));
    })
    .sort((a, b) => a.title.localeCompare(b.title, "es"));

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="flex items-end justify-between gap-4 pb-6">
        <div>
          <Mark />
          <p className="font-display mt-3 text-3xl leading-none text-fg">Pushidea</p>
          <p className="mt-2 text-sm text-muted">Ideas de uso diario. Sin pagos ni bancos.</p>
        </div>
        <p className="pb-1 text-right text-xs leading-relaxed text-muted">
          {Object.keys(saved).length} guardadas
          <br />
          {seenCount} distintas
        </p>
      </header>

      <main className="flex-1 pb-28">
        {tab === "generar" ? (
          <section>
            <button
              type="button"
              onClick={() => void onGenerate()}
              disabled={busy}
              aria-busy={busy}
              className="press relative h-16 w-full overflow-hidden rounded-2xl bg-accent text-base font-medium text-ink disabled:opacity-80"
            >
              {busy ? "Buscando una idea distinta…" : "Dame una idea"}
              {busy ? <span className="sweep absolute inset-y-0 left-0 w-1/3 bg-fg/20" /> : null}
            </button>
            {note ? <p className="mt-3 text-sm leading-relaxed text-muted">{note}</p> : null}
            {empty ? (
              <div className="mt-6 rounded-3xl border border-line bg-surface p-5">
                <h2 className="font-display text-2xl text-fg">Ya no quedan ideas nuevas con este filtro</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Cambia el ámbito en Ajustes o vacía el historial de vistas. Lo que guardaste no se borra.
                </p>
                <button
                  type="button"
                  onClick={() => setTab("ajustes")}
                  className="press mt-4 h-12 rounded-2xl bg-raised px-4 text-sm font-medium text-fg"
                >
                  Abrir ajustes
                </button>
              </div>
            ) : null}
            {current ? (
              <div className="mt-6">
                <IdeaBody
                  key={current.id}
                  idea={current}
                  saved={Boolean(saved[current.id])}
                  onToggle={() => toggleSave(current)}
                />
              </div>
            ) : !empty ? (
              <div className="mt-6 rounded-3xl border border-dashed border-line p-5">
                <p className="font-display text-2xl leading-tight text-fg">Una idea cada vez que pulses.</p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Cada propuesta explica para quién es, qué problema cotidiano resuelve y cómo se usaría. Si te
                  gusta, se queda en este teléfono el tiempo que quieras.
                </p>
              </div>
            ) : null}
            {recent.length > 1 ? (
              <div className="mt-8">
                <p className="text-xs tracking-wide text-muted uppercase">Recientes en este teléfono</p>
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {recent
                    .filter((idea) => idea.id !== current?.id)
                    .map((idea) => (
                      <button
                        key={idea.id}
                        type="button"
                        onClick={() => focusIdea(idea)}
                        className="press shrink-0 rounded-2xl border border-line bg-surface px-4 py-3 text-left"
                      >
                        <span className="block max-w-40 truncate text-sm text-fg">{idea.title}</span>
                        <span className="mt-1 block text-xs text-muted">{AREA_LABEL[idea.area]}</span>
                      </button>
                    ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {tab === "guardadas" ? (
          <section>
            <label className="block text-sm text-muted" htmlFor="buscar">
              Buscar
            </label>
            <input
              id="buscar"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Título o problema"
              className="mt-2 h-12 w-full rounded-2xl border border-line bg-surface px-4 text-fg outline-none placeholder:text-muted focus:border-accent"
            />
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              <FilterChip active={savedArea === "cualquiera"} onClick={() => setSavedArea("cualquiera")} label="Todas" />
              {AREAS.map((area) => (
                <FilterChip
                  key={area.id}
                  active={savedArea === area.id}
                  onClick={() => setSavedArea(area.id)}
                  label={area.label}
                />
              ))}
            </div>
            {savedList.length === 0 ? (
              <p className="mt-8 text-sm leading-relaxed text-muted">
                {Object.keys(saved).length === 0
                  ? "Todavía no guardas ninguna. Cuando una idea te sirva, márcala y se queda aquí."
                  : "Nada coincide con esa búsqueda."}
              </p>
            ) : (
              <ul className="mt-5 space-y-3">
                {savedList.map((idea) => (
                  <li key={idea.id} className="rounded-3xl border border-line bg-surface p-4">
                    <button type="button" onClick={() => { focusIdea(idea); setTab("generar"); }} className="w-full text-left">
                      <p className="text-xs text-muted">{AREA_LABEL[idea.area]}</p>
                      <p className="font-display mt-1 text-2xl text-fg">{idea.title}</p>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{idea.description}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSaved(idea.id)}
                      className="press mt-4 h-11 rounded-2xl border border-line px-4 text-sm text-fg"
                    >
                      Quitar de guardadas
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        {tab === "ajustes" ? (
          <Settings
            useAi={settings.useAi}
            area={settings.area}
            focus={settings.focus}
            onAi={() => setSettings({ useAi: !settings.useAi })}
            onArea={(area) => setSettings({ area })}
            onFocus={(focus) => setSettings({ focus })}
            onReset={() => {
              resetSeen();
              setEmpty(false);
              setNote(null);
            }}
          />
        ) : null}
      </main>

      <nav className="fixed inset-x-0 bottom-0 border-t border-line bg-bg/95 backdrop-blur-sm">
        <div className="mx-auto grid max-w-lg grid-cols-3 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <TabButton active={tab === "generar"} onClick={() => setTab("generar")} label="Generar" icon={<Sparkles className="size-5" />} />
          <TabButton active={tab === "guardadas"} onClick={() => setTab("guardadas")} label="Guardadas" icon={<Bookmark className="size-5" />} />
          <TabButton active={tab === "ajustes"} onClick={() => setTab("ajustes")} label="Ajustes" icon={<SlidersHorizontal className="size-5" />} />
        </div>
      </nav>
    </div>
  );
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`press h-10 shrink-0 rounded-full px-4 text-sm ${active ? "bg-accent text-ink" : "bg-raised text-fg"}`}
    >
      {label}
    </button>
  );
}

function TabButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`press flex h-14 flex-col items-center justify-center gap-1 text-xs ${active ? "text-accent" : "text-muted"}`}
    >
      {icon}
      {label}
    </button>
  );
}

function Settings({
  useAi,
  area,
  focus,
  onAi,
  onArea,
  onFocus,
  onReset,
}: {
  useAi: boolean;
  area: AreaFilter;
  focus: FocusFilter;
  onAi: () => void;
  onArea: (area: AreaFilter) => void;
  onFocus: (focus: FocusFilter) => void;
  onReset: () => void;
}) {
  const [installReady, setInstallReady] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    setInstalled(standalone);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
      setInstallReady(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  return (
    <section className="space-y-4">
      <Switch
        on={useAi}
        onToggle={onAi}
        label="Ideas en vivo"
        detail="Si está activo, cada toque pide una idea nueva. Si falla, usa el archivo de este teléfono. Apagado, no sale ningún dato."
      />
      <div className="rounded-3xl border border-line bg-surface p-4">
        <p className="text-sm font-medium text-fg">Ámbito</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <FilterChip active={area === "cualquiera"} label="Cualquiera" onClick={() => onArea("cualquiera")} />
          {AREAS.map((item) => (
            <FilterChip key={item.id} active={area === item.id} label={item.label} onClick={() => onArea(item.id)} />
          ))}
        </div>
      </div>
      <div className="rounded-3xl border border-line bg-surface p-4">
        <p className="text-sm font-medium text-fg">Enfoque</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(
            [
              ["ambos", "Ambos"],
              ["cotidiano", "Diario"],
              ["procesos", "Procesos"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => onFocus(id)}
              className={`press h-11 rounded-2xl text-sm ${focus === id ? "bg-accent text-ink" : "bg-raised text-fg"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-3xl border border-line bg-surface p-4">
        <p className="text-sm font-medium text-fg">Instalar en el teléfono</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {installed
            ? "Pushidea ya está instalada en este dispositivo."
            : "En iPhone, usa Compartir y luego Agregar a inicio. En Android, el botón de abajo la instala si el navegador lo permite."}
        </p>
        {installReady && promptEvent ? (
          <button
            type="button"
            className="press mt-4 h-12 w-full rounded-2xl bg-accent text-sm font-medium text-ink"
            onClick={() => {
              void promptEvent.prompt();
              setPromptEvent(null);
              setInstallReady(false);
            }}
          >
            Instalar ahora
          </button>
        ) : null}
        {!installed ? (
          <a
            href="?install=1&platform=ios"
            className="press mt-3 flex h-12 items-center justify-center rounded-2xl border border-line text-sm font-medium text-fg"
          >
            Ver cómo instalar en iPhone
          </a>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onReset}
        className="press h-12 w-full rounded-2xl border border-line text-sm text-fg"
      >
        Vaciar historial de vistas
      </button>
      <p className="text-xs leading-relaxed text-muted">
        Las guardadas no se tocan. El historial solo evita repetir ideas que ya viste.
      </p>
      <Link to="/privacidad" className="inline-flex h-12 items-center text-sm text-accent">
        Privacidad y caché
      </Link>
    </section>
  );
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
