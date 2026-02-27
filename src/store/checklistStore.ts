import { create } from 'zustand';
import { ChecklistItem } from '@/types/checklist';
import { UUID } from '@/types/common';

interface ChecklistState {
  items: Record<UUID, ChecklistItem>;
  setItems: (items: ChecklistItem[]) => void;
  toggleItem: (id: UUID) => void;
  reset: () => void;
}

export const useChecklistStore = create<ChecklistState>((set) => ({
  items: {},

  setItems: (list) =>
    set({
      items: list.reduce<Record<UUID, ChecklistItem>>(
        (acc, cur) => ((acc[cur.id] = cur), acc),
        {},
      ),
    }),

  toggleItem: (id) =>
    set((s) => {
      const item = s.items[id];
      if (!item) return s;
      return {
        items: { ...s.items, [id]: { ...item, checked: !item.checked } },
      };
    }),

  reset: () => set({ items: {} }),
}));
