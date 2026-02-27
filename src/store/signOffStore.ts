import { create } from 'zustand';
import { SignOffEntry } from '@/types/signOff';
import { UUID } from '@/types/common';

interface SignOffState {
  entries: Record<UUID, SignOffEntry>;
  setEntries: (entries: SignOffEntry[]) => void;
  addEntry: (e: SignOffEntry) => void;
  updateEntry: (id: UUID, patch: Partial<SignOffEntry>) => void;
  removeEntry: (id: UUID) => void;
}

export const useSignOffStore = create<SignOffState>((set) => ({
  entries: {},

  setEntries: (list) =>
    set({
      entries: list.reduce<Record<UUID, SignOffEntry>>(
        (acc, cur) => ((acc[cur.id] = cur), acc),
        {},
      ),
    }),

  addEntry: (e) => set((s) => ({ entries: { ...s.entries, [e.id]: e } })),

  updateEntry: (id, patch) =>
    set((s) => {
      const current = s.entries[id];
      if (!current) return s; // avoid creating partial/invalid records
      return {
        entries: { ...s.entries, [id]: { ...current, ...patch } },
      };
    }),

  removeEntry: (id) =>
    set((s) => {
      const next = { ...s.entries };
      delete next[id];
      return { entries: next };
    }),
}));
