import { create } from 'zustand';
import { Defect } from '@/types/defect';
import { UUID } from '@/types/common';

interface DefectState {
  defects: Record<UUID, Defect>;
  addDefect: (d: Defect) => void;
  updateDefect: (id: UUID, patch: Partial<Defect>) => void;
  deleteDefect: (id: UUID) => void;
}

export const useDefectStore = create<DefectState>((set) => ({
  defects: {},

  addDefect: (d) => set((s) => ({ defects: { ...s.defects, [d.bugId]: d } })),

  updateDefect: (id, patch) =>
    set((s) => ({
      defects: { ...s.defects, [id]: { ...s.defects[id], ...patch } },
    })),

  deleteDefect: (id) =>
    set((s) => {
      const nextDefects = { ...s.defects };
      delete nextDefects[id];
      return { defects: nextDefects };
    }),
}));
