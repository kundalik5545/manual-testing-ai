import { create } from 'zustand';
import { Report } from '@/types/report';
import { UUID } from '@/types/common';

interface ReportState {
  currentReport?: Report;
  reports: Record<UUID, Report>;
  setCurrent: (report: Report) => void;
  addReport: (report: Report) => void;
  updateReport: (id: UUID, patch: Partial<Report>) => void;
  removeReport: (id: UUID) => void;
}

export const useReportStore = create<ReportState>((set) => ({
  reports: {},
  currentReport: undefined,

  setCurrent: (report) => set({ currentReport: report }),

  addReport: (report) =>
    set((state) => ({
      reports: { ...state.reports, [report.id]: report },
    })),

  updateReport: (id, patch) =>
    set((state) => {
      const existing = state.reports[id];
      if (!existing) return state; // no-op if report does not exist

      const updated = { ...existing, ...patch };
      return {
        reports: {
          ...state.reports,
          [id]: updated,
        },
        currentReport:
          state.currentReport?.id === id ? updated : state.currentReport,
      };
    }),

  removeReport: (id) =>
    set((state) => {
      if (!state.reports[id]) return state;

      const nextReports = { ...state.reports };
      delete nextReports[id];

      return {
        reports: nextReports,
        currentReport:
          state.currentReport?.id === id ? undefined : state.currentReport,
      };
    }),
}));
