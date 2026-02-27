import create from 'zustand';

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
  setActiveSection: (section) => set({ activeSection: section }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  openModal: (modal, data) => set({ activeModal: modal, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
  setFilter: (type, values) =>
    set((s) => ({ filters: { ...s.filters, [type]: values } })),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
