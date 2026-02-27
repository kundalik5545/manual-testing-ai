import { create } from 'zustand';
import { Defect } from '@/types/defect';
import { UUID } from '@/types/common';
import {
  deleteDefect as deleteDefectFromDb,
  loadAllDefects,
  saveDefect,
} from '@/lib/db/defectsStore';

interface DefectState {
  defects: Record<UUID, Defect>;
  initialized: boolean;
  loadDefects: () => Promise<void>;
  addDefect: (d: Defect) => Promise<void>;
  updateDefect: (id: UUID, patch: Partial<Defect>) => Promise<void>;
  deleteDefect: (id: UUID) => Promise<void>;
}

export const useDefectStore = create<DefectState>((set, get) => ({
  defects: {},
  initialized: false,

  loadDefects: async () => {
    const defects = await loadAllDefects();
    set({
      defects: defects.reduce<Record<UUID, Defect>>((acc, defect) => {
        acc[defect.bugId] = defect;
        return acc;
      }, {}),
      initialized: true,
    });
  },

  addDefect: async (d) => {
    await saveDefect(d);
    set((s) => ({ defects: { ...s.defects, [d.bugId]: d } }));
  },

  updateDefect: async (id, patch) => {
    const existing = get().defects[id];
    if (!existing) {
      return;
    }

    const updatedDefect: Defect = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    await saveDefect(updatedDefect);
    set((s) => ({ defects: { ...s.defects, [id]: updatedDefect } }));
  },

  deleteDefect: async (id) => {
    await deleteDefectFromDb(id);
    set((s) => {
      const nextDefects = { ...s.defects };
      delete nextDefects[id];
      return { defects: nextDefects };
    });
  },
}));
