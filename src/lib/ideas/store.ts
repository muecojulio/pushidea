import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { norm } from "./guard";
import type { AreaFilter, FocusFilter } from "./pick";
import type { Idea } from "./types";

type Settings = {
  useAi: boolean;
  area: AreaFilter;
  focus: FocusFilter;
};

type PushState = {
  saved: Record<string, Idea>;
  seenTitles: string[];
  recent: Idea[];
  current: Idea | null;
  settings: Settings;
  setSettings: (patch: Partial<Settings>) => void;
  commit: (idea: Idea) => void;
  toggleSave: (idea: Idea) => void;
  removeSaved: (id: string) => void;
  resetSeen: () => void;
  focusIdea: (idea: Idea) => void;
  blockedTitles: () => string[];
};

const MAX_RECENT = 12;
const MAX_SEEN = 500;

export const usePushidea = create<PushState>()(
  persist(
    (set, get) => ({
      saved: {},
      seenTitles: [],
      recent: [],
      current: null,
      settings: { useAi: true, area: "cualquiera", focus: "ambos" },
      setSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),
      commit: (idea) => {
        const title = norm(idea.title);
        const seenTitles = get().seenTitles.includes(title)
          ? get().seenTitles
          : [title, ...get().seenTitles].slice(0, MAX_SEEN);
        const recent = [idea, ...get().recent.filter((item) => item.id !== idea.id)].slice(0, MAX_RECENT);
        set({ current: idea, seenTitles, recent });
      },
      toggleSave: (idea) => {
        const saved = { ...get().saved };
        if (saved[idea.id]) delete saved[idea.id];
        else saved[idea.id] = { ...idea };
        set({ saved });
      },
      removeSaved: (id) => {
        const saved = { ...get().saved };
        delete saved[id];
        set({ saved });
      },
      resetSeen: () => set({ seenTitles: [], recent: [], current: null }),
      focusIdea: (idea) => set({ current: idea }),
      blockedTitles: () => {
        const savedTitles = Object.values(get().saved).map((idea) => norm(idea.title));
        return [...get().seenTitles, ...savedTitles];
      },
    }),
    {
      name: "pushidea-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        saved: state.saved,
        seenTitles: state.seenTitles,
        recent: state.recent,
        current: state.current,
        settings: state.settings,
      }),
    },
  ),
);
