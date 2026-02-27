import create from 'zustand';
import { ReportData, TestCase } from '@/types';

interface ReportState {
  reportData: ReportData | null;
  testCases: TestCase[];
  isLoading: boolean;
  loadReport: (file: File) => Promise<void>;
  clearReport: () => void;
  updateTestCase: (id: string, data: Partial<TestCase>) => void;
}

export const useReportStore = create<ReportState>((set) => ({
  reportData: null,
  testCases: [],
  isLoading: false,
  loadReport: async (file) => {
    // TODO: implement parsing logic
  },
  clearReport: () => set({ reportData: null, testCases: [] }),
  updateTestCase: (id, data) => {
    set((state) => ({
      testCases: state.testCases.map((tc) =>
        tc.id === id ? { ...tc, ...data } : tc
      ),
    }));
  },
}));
