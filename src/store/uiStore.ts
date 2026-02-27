import { create } from 'zustand';

interface UIState {
  activeSection: string;
  sidebarCollapsed: boolean;
  activeModal: string | null;
  modalData: any;
  filters: {
    priority: string[];
    status: string[];
    module: string[];
  };
  searchQuery: string;
  setActiveSection: (section: string) => void;
  toggleSidebar: () => void;
  openModal: (modal: string, data?: any) => void;
  closeModal: () => void;
  setFilter: (type: string, values: string[]) => void;
  setSearchQuery: (query: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeSection: '',
  sidebarCollapsed: false,
  activeModal: null,
  modalData: null,
  filters: { priority: [], status: [], module: [] },
  searchQuery: '',
  setActiveSection: (section: string) => set({ activeSection: section }),
  toggleSidebar: () =>
    set((s: UIState) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  openModal: (modal: string, data?: any) =>
    set({ activeModal: modal, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
  setFilter: (type: string, values: string[]) =>
    set((s: UIState) => ({ filters: { ...s.filters, [type]: values } })),
  setSearchQuery: (query: string) => set({ searchQuery: query }),
}));
