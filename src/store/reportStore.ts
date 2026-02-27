import { create } from 'zustand';
import { ReportData, TestCase } from '@/types';

import type { StateCreator } from 'zustand';

interface ReportState {
  reportData: ReportData | null;
  testCases: TestCase[];
  isLoading: boolean;
  loadReport: (file: File) => Promise<void>;
  clearReport: () => void;
  updateTestCase: (id: string, data: Partial<TestCase>) => void;
}

export const useReportStore = create<ReportState>(
  (set: StateCreator<ReportState>) => ({
    reportData: null,
    testCases: [],
    isLoading: false,
    loadReport: async (file: File) => {
      // TODO: implement parsing logic
    },
    clearReport: () => set({ reportData: null, testCases: [] }),
    updateTestCase: (id: string, data: Partial<TestCase>) => {
      set((state) => ({
        testCases: state.testCases.map((tc) =>
          tc.id === id ? { ...tc, ...data } : tc,
        ),
      }));
    },
  }),
);
